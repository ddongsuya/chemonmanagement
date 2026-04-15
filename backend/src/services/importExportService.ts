/**
 * ImportExportService
 * 
 * CRM 고객 데이터 가져오기/내보내기 서비스
 * - Excel 파일 파싱 및 열 매핑
 * - 유효성 검사 및 중복 감지 연동
 * - 필터 조건 적용 내보내기
 */

import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { CustomerGrade, SegmentType } from '@prisma/client';
import { AppError, ErrorCodes } from '../types/error';
import prisma from '../lib/prisma';

interface ColumnMapping {
  excelColumn: number;
  field: string;
  label: string;
  required: boolean;
}

interface ValidationResult {
  valid: boolean;
  totalRows: number;
  validRows: number;
  errors: { row: number; field: string; message: string }[];
  preview: Record<string, string>[];
}

type DuplicateAction = 'skip' | 'update';
type RowStatus = 'created' | 'skipped' | 'updated' | 'failed';

interface ImportRowResult {
  row: number;
  status: RowStatus;
  name: string;
  message?: string;
}

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  rows: ImportRowResult[];
}

const MAX_IMPORT_ROWS = 500;

interface ExportOptions {
  userId: string;
  columns?: string[];
  format?: 'xlsx' | 'csv';
  filters?: {
    grade?: CustomerGrade;
    segment?: SegmentType;
    search?: string;
    createdFrom?: Date;
    createdTo?: Date;
  };
}

const DEFAULT_COLUMNS: ColumnMapping[] = [
  { excelColumn: 1, field: 'name', label: '고객명', required: true },
  { excelColumn: 2, field: 'company', label: '회사명', required: false },
  { excelColumn: 3, field: 'email', label: '이메일', required: false },
  { excelColumn: 4, field: 'phone', label: '전화번호', required: false },
  { excelColumn: 5, field: 'address', label: '주소', required: false },
  { excelColumn: 6, field: 'grade', label: '등급', required: false },
  { excelColumn: 7, field: 'segment', label: '세그먼트', required: false },
  { excelColumn: 8, field: 'notes', label: '비고', required: false },
];

const GRADE_MAP: Record<string, CustomerGrade> = {
  '리드': 'LEAD', 'LEAD': 'LEAD',
  '잠재고객': 'PROSPECT', 'PROSPECT': 'PROSPECT',
  '고객': 'CUSTOMER', 'CUSTOMER': 'CUSTOMER',
  'VIP': 'VIP',
  '비활성': 'INACTIVE', 'INACTIVE': 'INACTIVE',
};

const SEGMENT_MAP: Record<string, SegmentType> = {
  '의약품': 'PHARMACEUTICAL', 'PHARMACEUTICAL': 'PHARMACEUTICAL',
  '화장품': 'COSMETICS', 'COSMETICS': 'COSMETICS',
  '건강기능식품': 'HEALTH_FOOD', 'HEALTH_FOOD': 'HEALTH_FOOD',
  '의료기기': 'MEDICAL_DEVICE', 'MEDICAL_DEVICE': 'MEDICAL_DEVICE',
  '기타': 'OTHER', 'OTHER': 'OTHER',
};

const GRADE_LABEL: Record<string, string> = {
  LEAD: '리드', PROSPECT: '잠재고객', CUSTOMER: '고객', VIP: 'VIP', INACTIVE: '비활성',
};

const SEGMENT_LABEL: Record<string, string> = {
  PHARMACEUTICAL: '의약품', COSMETICS: '화장품', HEALTH_FOOD: '건강기능식품',
  MEDICAL_DEVICE: '의료기기', OTHER: '기타',
};

/**
 * 업로드된 Excel 파일의 헤더를 파싱하여 열 매핑 제안
 */
export async function parseUploadedFile(filePath: string): Promise<{
  headers: string[];
  suggestedMapping: ColumnMapping[];
  rowCount: number;
}> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new AppError('Excel 파일에 시트가 없습니다', 400, ErrorCodes.VALIDATION_ERROR);

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell((cell, colNumber) => {
    headers.push(String(cell.value || `열${colNumber}`));
  });

  // 자동 매핑 제안
  const suggestedMapping: ColumnMapping[] = DEFAULT_COLUMNS.map((col) => {
    const matchIdx = headers.findIndex(
      (h) => h.includes(col.label) || h.toLowerCase().includes(col.field.toLowerCase())
    );
    return {
      ...col,
      excelColumn: matchIdx >= 0 ? matchIdx + 1 : col.excelColumn,
    };
  });

  let rowCount = 0;
  sheet.eachRow((_, rowNumber) => {
    if (rowNumber > 1) rowCount++;
  });

  return { headers, suggestedMapping, rowCount };
}

/**
 * 열 매핑 기반 유효성 검사
 */
export async function validateImport(
  filePath: string,
  mapping: ColumnMapping[],
  userId: string
): Promise<ValidationResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new AppError('시트가 없습니다', 400, ErrorCodes.VALIDATION_ERROR);

  const result: ValidationResult = {
    valid: true,
    totalRows: 0,
    validRows: 0,
    errors: [],
    preview: [],
  };

  const getCellValue = (row: ExcelJS.Row, col: number): string => {
    const cell = row.getCell(col);
    return cell.value != null ? String(cell.value).trim() : '';
  };

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    result.totalRows++;

    const record: Record<string, string> = {};
    let rowValid = true;

    for (const col of mapping) {
      const value = getCellValue(row, col.excelColumn);
      record[col.field] = value;

      if (col.required && !value) {
        result.errors.push({ row: rowNumber, field: col.field, message: `${col.label}은(는) 필수입니다` });
        rowValid = false;
      }

      if (col.field === 'grade' && value && !GRADE_MAP[value]) {
        result.errors.push({ row: rowNumber, field: 'grade', message: `유효하지 않은 등급: ${value}` });
        rowValid = false;
      }

      if (col.field === 'segment' && value && !SEGMENT_MAP[value]) {
        result.errors.push({ row: rowNumber, field: 'segment', message: `유효하지 않은 세그먼트: ${value}` });
        rowValid = false;
      }

      if (col.field === 'email' && value && !value.includes('@')) {
        result.errors.push({ row: rowNumber, field: 'email', message: `유효하지 않은 이메일: ${value}` });
        rowValid = false;
      }
    }

    if (rowValid) result.validRows++;
    if (result.preview.length < 5) result.preview.push(record);
  });

  result.valid = result.errors.length === 0;
  return result;
}

/**
 * 가져오기 실행
 * - 중복 판정: 이메일 우선, 이메일 없으면 name+company
 * - duplicateAction: skip(건너뛰기) / update(값 있는 필드만 덮어쓰기)
 * - 단일 트랜잭션, best-effort (개별 행 실패는 기록 후 계속)
 * - 최대 500행 제한
 */
export async function executeImport(
  filePath: string,
  mapping: ColumnMapping[],
  userId: string,
  duplicateAction: DuplicateAction = 'skip'
): Promise<ImportResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new AppError('시트가 없습니다', 400, ErrorCodes.VALIDATION_ERROR);

  const getCellValue = (row: ExcelJS.Row, col: number): string => {
    const cell = row.getCell(col);
    return cell.value != null ? String(cell.value).trim() : '';
  };

  // 행 수집
  const rows: { row: ExcelJS.Row; rowNumber: number }[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) rows.push({ row, rowNumber });
  });

  // 행 수 상한 체크
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new AppError(
      `한 번에 최대 ${MAX_IMPORT_ROWS}행까지 가져올 수 있습니다. 현재 파일: ${rows.length}행`,
      400,
      ErrorCodes.VALIDATION_ERROR
    );
  }

  const result: ImportResult = { created: 0, updated: 0, skipped: 0, failed: 0, rows: [] };

  await prisma.$transaction(async (tx) => {
    for (const { row, rowNumber } of rows) {
      try {
        const record: Record<string, string> = {};
        for (const col of mapping) {
          record[col.field] = getCellValue(row, col.excelColumn);
        }

        const name = record.name || '';
        if (!name) {
          result.failed++;
          result.rows.push({ row: rowNumber, status: 'failed', name: '(빈 행)', message: '고객명이 필요합니다' });
          continue;
        }

        // 중복 판정
        const email = record.email || '';
        const company = record.company || '';
        let existing: { id: string } | null = null;
        let matchReason = '';

        if (email) {
          // 1순위: 이메일 일치
          existing = await tx.customer.findFirst({
            where: { userId, email, deletedAt: null },
            select: { id: true },
          });
          if (existing) matchReason = `이메일 중복 (${email})`;
        }

        if (!existing && !email) {
          // 2순위: 이메일이 둘 다 없으면 name + company
          existing = await tx.customer.findFirst({
            where: { userId, name, company: company || null, deletedAt: null },
            select: { id: true },
          });
          if (existing) matchReason = `name+company 중복 (${name} / ${company || '-'})`;
        }

        if (existing) {
          if (duplicateAction === 'skip') {
            result.skipped++;
            result.rows.push({ row: rowNumber, status: 'skipped', name, message: matchReason });
          } else {
            // update: 파일에 값이 있는 필드만 덮어쓰기
            const updateData: Record<string, string | null> = {};
            if (record.name) updateData.name = record.name;
            if (record.company) updateData.company = record.company;
            if (record.email) updateData.email = record.email;
            if (record.phone) updateData.phone = record.phone;
            if (record.address) updateData.address = record.address;
            if (record.notes) updateData.notes = record.notes;

            const gradeUpdate: Record<string, unknown> = {};
            if (record.grade && GRADE_MAP[record.grade]) {
              gradeUpdate.grade = GRADE_MAP[record.grade];
            }
            const segmentUpdate: Record<string, unknown> = {};
            if (record.segment && SEGMENT_MAP[record.segment]) {
              segmentUpdate.segment = SEGMENT_MAP[record.segment];
            }

            await tx.customer.update({
              where: { id: existing.id },
              data: { ...updateData, ...gradeUpdate, ...segmentUpdate },
            });
            result.updated++;
            result.rows.push({ row: rowNumber, status: 'updated', name, message: `${matchReason} → 업데이트` });
          }
        } else {
          // 새 레코드 생성
          await tx.customer.create({
            data: {
              userId,
              name,
              company: company || null,
              email: email || null,
              phone: record.phone || null,
              address: record.address || null,
              notes: record.notes || null,
              grade: record.grade ? (GRADE_MAP[record.grade] || 'PROSPECT') : 'PROSPECT',
              segment: record.segment ? (SEGMENT_MAP[record.segment] || null) : null,
            },
          });
          result.created++;
          result.rows.push({ row: rowNumber, status: 'created', name });
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '알 수 없는 오류';
        const name = (() => {
          try {
            const nameCol = mapping.find(c => c.field === 'name');
            if (nameCol) return getCellValue(row, nameCol.excelColumn) || '(알 수 없음)';
          } catch { /* ignore */ }
          return '(알 수 없음)';
        })();
        result.failed++;
        result.rows.push({ row: rowNumber, status: 'failed', name, message });
      }
    }
  });

  return result;
}

/**
 * 고객 데이터 내보내기
 */
export async function exportCustomers(options: ExportOptions): Promise<string> {
  const { userId, columns, format = 'xlsx', filters } = options;

  const where: any = { userId, deletedAt: null };
  if (filters?.grade) where.grade = filters.grade;
  if (filters?.segment) where.segment = filters.segment;
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { company: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  if (filters?.createdFrom || filters?.createdTo) {
    where.createdAt = {};
    if (filters.createdFrom) where.createdAt.gte = filters.createdFrom;
    if (filters.createdTo) where.createdAt.lte = filters.createdTo;
  }

  const customers = await prisma.customer.findMany({
    where,
    include: {
      customerTags: { select: { name: true } },
      customerHealthScores: { orderBy: { calculatedAt: 'desc' }, take: 1, select: { score: true, churnRiskScore: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('고객 데이터');

  // 기본 열 + 확장 열
  const allColumns = [
    { header: '고객명', key: 'name', width: 20 },
    { header: '회사명', key: 'company', width: 20 },
    { header: '이메일', key: 'email', width: 25 },
    { header: '전화번호', key: 'phone', width: 15 },
    { header: '주소', key: 'address', width: 30 },
    { header: '등급', key: 'grade', width: 10 },
    { header: '세그먼트', key: 'segment', width: 15 },
    { header: '태그', key: 'tags', width: 20 },
    { header: '건강도', key: 'healthScore', width: 10 },
    { header: '이탈위험', key: 'churnRisk', width: 10 },
    { header: '비고', key: 'notes', width: 30 },
    { header: '등록일', key: 'createdAt', width: 15 },
  ];

  const selectedColumns = columns && columns.length > 0
    ? allColumns.filter((c) => columns.includes(c.key))
    : allColumns;

  sheet.columns = selectedColumns;

  // 헤더 스타일
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
  headerRow.alignment = { horizontal: 'center' };

  for (const cust of customers) {
    const hs = cust.customerHealthScores[0];
    sheet.addRow({
      name: cust.name,
      company: cust.company || '',
      email: cust.email || '',
      phone: cust.phone || '',
      address: cust.address || '',
      grade: GRADE_LABEL[cust.grade] || cust.grade,
      segment: cust.segment ? (SEGMENT_LABEL[cust.segment] || cust.segment) : '',
      tags: cust.customerTags.map((t) => t.name).join(', '),
      healthScore: hs?.score ?? '',
      churnRisk: hs?.churnRiskScore ?? '',
      notes: cust.notes || '',
      createdAt: cust.createdAt.toISOString().split('T')[0],
    });
  }

  const exportDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `customers_export_${timestamp}.${format}`;
  const filePath = path.join(exportDir, filename);

  if (format === 'csv') {
    await workbook.csv.writeFile(filePath);
  } else {
    await workbook.xlsx.writeFile(filePath);
  }

  return filePath;
}

/**
 * 고객 가져오기 템플릿 생성
 */
export async function generateImportTemplate(): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('고객 가져오기 템플릿');

  sheet.columns = DEFAULT_COLUMNS.map((c) => ({
    header: c.required ? `${c.label}*` : c.label,
    key: c.field,
    width: 20,
  }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

  // 예시 행
  sheet.addRow({
    name: '홍길동',
    company: '(주)테스트',
    email: 'test@example.com',
    phone: '010-1234-5678',
    address: '서울시 강남구',
    grade: '잠재고객',
    segment: '화장품',
    notes: '비고 내용',
  });

  const exportDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

  const filePath = path.join(exportDir, 'customer_import_template.xlsx');
  await workbook.xlsx.writeFile(filePath);
  return filePath;
}
