// Excel Import/Export Service
import ExcelJS from 'exceljs';
import prisma from '../lib/prisma';
import { AppError, ErrorCodes } from '../types/error';
import path from 'path';
import fs from 'fs';

// 내보내기 가능한 데이터 타입
export type ExportType = 'leads' | 'quotations' | 'contracts' | 'studies' | 'customers';

// 가져오기 결과
interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

export class ExcelService {
  private exportDir: string;

  constructor() {
    this.exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  // ==================== 내보내기 (Export) ====================

  async exportLeads(userId: string, filters?: { startDate?: Date; endDate?: Date }): Promise<string> {
    const where: any = { userId, deletedAt: null };
    if (filters?.startDate) where.createdAt = { gte: filters.startDate };
    if (filters?.endDate) where.createdAt = { ...where.createdAt, lte: filters.endDate };

    const leads = await prisma.lead.findMany({
      where,
      include: {
        customer: { select: { name: true, company: true } },
        stage: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('리드 목록');

    sheet.columns = [
      { header: '리드명', key: 'title', width: 30 },
      { header: '고객사', key: 'customerName', width: 20 },
      { header: '담당자', key: 'contactName', width: 15 },
      { header: '연락처', key: 'contactPhone', width: 15 },
      { header: '이메일', key: 'contactEmail', width: 25 },
      { header: '파이프라인 단계', key: 'stage', width: 15 },
      { header: '상태', key: 'status', width: 10 },
      { header: '예상 금액', key: 'expectedAmount', width: 15 },
      { header: '예상 계약일', key: 'expectedCloseDate', width: 15 },
      { header: '출처', key: 'source', width: 15 },
      { header: '메모', key: 'notes', width: 40 },
      { header: '생성일', key: 'createdAt', width: 15 },
    ];

    this.styleHeader(sheet);

    leads.forEach(lead => {
      sheet.addRow({
        title: lead.companyName,
        customerName: lead.customer?.company || lead.customer?.name || lead.companyName,
        contactName: lead.contactName,
        contactPhone: lead.contactPhone,
        contactEmail: lead.contactEmail,
        stage: lead.stage?.name || '',
        status: this.translateStatus(lead.status),
        expectedAmount: lead.expectedAmount ? Number(lead.expectedAmount) : '',
        expectedCloseDate: lead.expectedDate ? this.formatDate(lead.expectedDate) : '',
        source: lead.source || '',
        notes: lead.inquiryDetail || '',
        createdAt: this.formatDate(lead.createdAt),
      });
    });

    const filename = `leads_${Date.now()}.xlsx`;
    const filepath = path.join(this.exportDir, filename);
    await workbook.xlsx.writeFile(filepath);
    return filename;
  }

  async exportQuotations(userId: string, filters?: { startDate?: Date; endDate?: Date; type?: string }): Promise<string> {
    const where: any = { userId, deletedAt: null };
    if (filters?.startDate) where.createdAt = { gte: filters.startDate };
    if (filters?.endDate) where.createdAt = { ...where.createdAt, lte: filters.endDate };
    if (filters?.type) where.quotationType = filters.type;

    const quotations = await prisma.quotation.findMany({
      where,
      include: { customer: { select: { name: true, company: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('견적서 목록');

    sheet.columns = [
      { header: '견적번호', key: 'quotationNumber', width: 18 },
      { header: '유형', key: 'type', width: 10 },
      { header: '고객사', key: 'customerName', width: 20 },
      { header: '프로젝트명', key: 'projectName', width: 30 },
      { header: 'Modality', key: 'modality', width: 15 },
      { header: '상태', key: 'status', width: 10 },
      { header: '소계', key: 'subtotal', width: 15 },
      { header: '할인율(%)', key: 'discountRate', width: 12 },
      { header: '할인금액', key: 'discountAmount', width: 15 },
      { header: 'VAT', key: 'vat', width: 15 },
      { header: '총액', key: 'totalAmount', width: 18 },
      { header: '유효기간', key: 'validDays', width: 10 },
      { header: '유효일', key: 'validUntil', width: 15 },
      { header: '메모', key: 'notes', width: 40 },
      { header: '생성일', key: 'createdAt', width: 15 },
    ];

    this.styleHeader(sheet);

    quotations.forEach(q => {
      sheet.addRow({
        quotationNumber: q.quotationNumber,
        type: q.quotationType === 'TOXICITY' ? '독성' : '효력',
        customerName: q.customer?.company || q.customer?.name || q.customerName,
        projectName: q.projectName,
        modality: q.modality || '',
        status: this.translateStatus(q.status),
        subtotal: q.subtotal ? Number(q.subtotal) : '',
        discountRate: q.discountRate ? Number(q.discountRate) : '',
        discountAmount: q.discountAmount ? Number(q.discountAmount) : '',
        vat: q.vat ? Number(q.vat) : '',
        totalAmount: Number(q.totalAmount),
        validDays: q.validDays,
        validUntil: q.validUntil ? this.formatDate(q.validUntil) : '',
        notes: q.notes || '',
        createdAt: this.formatDate(q.createdAt),
      });
    });

    const filename = `quotations_${Date.now()}.xlsx`;
    const filepath = path.join(this.exportDir, filename);
    await workbook.xlsx.writeFile(filepath);
    return filename;
  }

  async exportContracts(userId: string, filters?: { startDate?: Date; endDate?: Date }): Promise<string> {
    const where: any = { userId, deletedAt: null };
    if (filters?.startDate) where.createdAt = { gte: filters.startDate };
    if (filters?.endDate) where.createdAt = { ...where.createdAt, lte: filters.endDate };

    const contracts = await prisma.contract.findMany({
      where,
      include: { customer: { select: { name: true, company: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('계약 목록');

    sheet.columns = [
      { header: '계약번호', key: 'contractNumber', width: 18 },
      { header: '고객사', key: 'customerName', width: 20 },
      { header: '프로젝트명', key: 'projectName', width: 30 },
      { header: '상태', key: 'status', width: 12 },
      { header: '계약금액', key: 'totalAmount', width: 18 },
      { header: '계약일', key: 'signedDate', width: 15 },
      { header: '시작일', key: 'startDate', width: 15 },
      { header: '종료예정일', key: 'endDate', width: 15 },
      { header: '메모', key: 'notes', width: 40 },
      { header: '생성일', key: 'createdAt', width: 15 },
    ];

    this.styleHeader(sheet);

    contracts.forEach(c => {
      sheet.addRow({
        contractNumber: c.contractNumber,
        customerName: c.customer?.company || c.customer?.name,
        projectName: c.title,
        status: this.translateContractStatus(c.status),
        totalAmount: Number(c.totalAmount),
        signedDate: c.signedDate ? this.formatDate(c.signedDate) : '',
        startDate: c.startDate ? this.formatDate(c.startDate) : '',
        endDate: c.endDate ? this.formatDate(c.endDate) : '',
        notes: c.notes || '',
        createdAt: this.formatDate(c.createdAt),
      });
    });

    const filename = `contracts_${Date.now()}.xlsx`;
    const filepath = path.join(this.exportDir, filename);
    await workbook.xlsx.writeFile(filepath);
    return filename;
  }

  async exportStudies(userId: string, filters?: { startDate?: Date; endDate?: Date }): Promise<string> {
    const where: any = { contract: { userId }, deletedAt: null };
    if (filters?.startDate) where.createdAt = { gte: filters.startDate };
    if (filters?.endDate) where.createdAt = { ...where.createdAt, lte: filters.endDate };

    const studies = await prisma.study.findMany({
      where,
      include: { contract: { include: { customer: { select: { name: true, company: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('시험 목록');

    sheet.columns = [
      { header: '시험번호', key: 'studyNumber', width: 18 },
      { header: '시험명', key: 'testName', width: 30 },
      { header: '계약번호', key: 'contractNumber', width: 18 },
      { header: '고객사', key: 'customerName', width: 20 },
      { header: '상태', key: 'status', width: 12 },
      { header: '시작일', key: 'startDate', width: 15 },
      { header: '종료예정일', key: 'expectedEndDate', width: 15 },
      { header: '실제종료일', key: 'actualEndDate', width: 15 },
      { header: '메모', key: 'notes', width: 40 },
      { header: '생성일', key: 'createdAt', width: 15 },
    ];

    this.styleHeader(sheet);

    studies.forEach(s => {
      sheet.addRow({
        studyNumber: s.studyNumber,
        testName: s.testName,
        contractNumber: s.contract.contractNumber,
        customerName: s.contract.customer?.company || s.contract.customer?.name,
        status: this.translateStudyStatus(s.status),
        startDate: s.startDate ? this.formatDate(s.startDate) : '',
        expectedEndDate: s.expectedEndDate ? this.formatDate(s.expectedEndDate) : '',
        actualEndDate: s.actualEndDate ? this.formatDate(s.actualEndDate) : '',
        notes: s.notes || '',
        createdAt: this.formatDate(s.createdAt),
      });
    });

    const filename = `studies_${Date.now()}.xlsx`;
    const filepath = path.join(this.exportDir, filename);
    await workbook.xlsx.writeFile(filepath);
    return filename;
  }

  async exportCustomers(userId: string): Promise<string> {
    const customers = await prisma.customer.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('고객 목록');

    sheet.columns = [
      { header: '고객명', key: 'name', width: 20 },
      { header: '회사명', key: 'company', width: 25 },
      { header: '이메일', key: 'email', width: 30 },
      { header: '전화번호', key: 'phone', width: 18 },
      { header: '주소', key: 'address', width: 40 },
      { header: '메모', key: 'notes', width: 40 },
      { header: '생성일', key: 'createdAt', width: 15 },
    ];

    this.styleHeader(sheet);

    customers.forEach(c => {
      sheet.addRow({
        name: c.name,
        company: c.company || '',
        email: c.email || '',
        phone: c.phone || '',
        address: c.address || '',
        notes: c.notes || '',
        createdAt: this.formatDate(c.createdAt),
      });
    });

    const filename = `customers_${Date.now()}.xlsx`;
    const filepath = path.join(this.exportDir, filename);
    await workbook.xlsx.writeFile(filepath);
    return filename;
  }

  // ==================== 가져오기 (Import) ====================

  private async generateLeadNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastLead = await prisma.lead.findFirst({
      where: { leadNumber: { startsWith: `LD-${year}` } },
      orderBy: { leadNumber: 'desc' },
    });
    const seq = lastLead ? parseInt(lastLead.leadNumber.split('-')[2]) + 1 : 1;
    return `LD-${year}-${seq.toString().padStart(4, '0')}`;
  }

  async importLeads(userId: string, filePath: string): Promise<ImportResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.worksheets[0];
    
    if (!sheet) throw new AppError('Excel 파일에 시트가 없습니다', 400, ErrorCodes.VALIDATION_ERROR);

    const result: ImportResult = { success: 0, failed: 0, errors: [] };
    const defaultStage = await prisma.pipelineStage.findFirst({ orderBy: { order: 'asc' } });

    const rows: any[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 헤더 스킵
      rows.push({ row, rowNumber });
    });

    for (const { row, rowNumber } of rows) {
      try {
        const title = this.getCellValue(row, 1);
        if (!title) {
          result.errors.push({ row: rowNumber, message: '리드명이 필요합니다' });
          result.failed++;
          continue;
        }

        const leadNumber = await this.generateLeadNumber();
        await prisma.lead.create({
          data: {
            leadNumber,
            user: { connect: { id: userId } },
            companyName: title,
            contactName: this.getCellValue(row, 3) || '',
            contactPhone: this.getCellValue(row, 4) || null,
            contactEmail: this.getCellValue(row, 5) || null,
            stage: { connect: { id: defaultStage?.id || '' } },
            status: 'NEW',
            expectedAmount: this.parseNumber(this.getCellValue(row, 8)),
            expectedDate: this.parseDate(this.getCellValue(row, 9)),
            source: (this.getCellValue(row, 10) as any) || 'OTHER',
            inquiryDetail: this.getCellValue(row, 11) || null,
          },
        });
        result.success++;
      } catch (error: any) {
        result.errors.push({ row: rowNumber, message: error.message || '알 수 없는 오류' });
        result.failed++;
      }
    }
    return result;
  }

  async importQuotations(userId: string, filePath: string): Promise<ImportResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.worksheets[0];
    
    if (!sheet) throw new AppError('Excel 파일에 시트가 없습니다', 400, ErrorCodes.VALIDATION_ERROR);

    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    const rows: any[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      rows.push({ row, rowNumber });
    });

    for (const { row, rowNumber } of rows) {
      try {
        const customerName = this.getCellValue(row, 3);
        const projectName = this.getCellValue(row, 4);
        const totalAmount = this.parseNumber(this.getCellValue(row, 11));

        if (!customerName || !projectName) {
          result.errors.push({ row: rowNumber, message: '고객사명과 프로젝트명이 필요합니다' });
          result.failed++;
          continue;
        }

        const typeStr = this.getCellValue(row, 2);
        const quotationType = typeStr === '효력' ? 'EFFICACY' : 'TOXICITY';
        const quotationNumber = await this.generateQuotationNumber(quotationType);

        await prisma.quotation.create({
          data: {
            userId,
            quotationNumber,
            quotationType,
            customerName,
            projectName,
            modality: this.getCellValue(row, 5) || null,
            status: 'DRAFT',
            subtotal: this.parseDecimal(this.getCellValue(row, 7)),
            discountRate: this.parseDecimal(this.getCellValue(row, 8)),
            discountAmount: this.parseDecimal(this.getCellValue(row, 9)),
            vat: this.parseDecimal(this.getCellValue(row, 10)),
            totalAmount: totalAmount || 0,
            validDays: 30,
            items: [],
            notes: this.getCellValue(row, 14) || null,
          },
        });
        result.success++;
      } catch (error: any) {
        result.errors.push({ row: rowNumber, message: error.message || '알 수 없는 오류' });
        result.failed++;
      }
    }
    return result;
  }

  /**
   * 기존 엑셀 양식으로 견적서 + 고객 + 계약 일괄 가져오기
   * 헤더: 견적 송부 날짜 | 견적서 번호 | 계약번호 | 시험기준 | 견적명 | 의뢰기관 | 의뢰자 | 의뢰자 연락처 | 의뢰자 e-mail | 제출용도 | 물질종류 | 담당자 | 견적금액 | 할인율 | 계약금액 | 결론
   */
  async importQuotationsLegacy(userId: string, filePath: string): Promise<ImportResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.worksheets[0];

    if (!sheet) throw new AppError('Excel 파일에 시트가 없습니다', 400, ErrorCodes.VALIDATION_ERROR);

    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    const rows: any[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      rows.push({ row, rowNumber });
    });

    for (const { row, rowNumber } of rows) {
      try {
        // 컬럼 매핑 (1-indexed)
        const sentDate = this.getCellValue(row, 1);
        const quotationNumber = this.getCellValue(row, 2);
        const contractNumber = this.getCellValue(row, 3);
        const testStandard = this.getCellValue(row, 4);
        const quotationName = this.getCellValue(row, 5);
        const company = this.getCellValue(row, 6);
        const contactName = this.getCellValue(row, 7);
        const contactPhone = this.getCellValue(row, 8);
        const contactEmail = this.getCellValue(row, 9);
        const purpose = this.getCellValue(row, 10);
        const substanceType = this.getCellValue(row, 11);
        const quotationAmount = this.parseNumber(this.getCellValue(row, 13));
        const discountRateRaw = this.getCellValue(row, 14);
        const contractAmount = this.parseNumber(this.getCellValue(row, 15));
        const conclusion = this.getCellValue(row, 16);

        if (!quotationName && !company) {
          result.errors.push({ row: rowNumber, message: '견적명 또는 의뢰기관이 필요합니다' });
          result.failed++;
          continue;
        }

        // 고객 찾기 또는 생성
        let customer = null;
        if (company || contactName) {
          const orConditions: any[] = [];
          if (company) orConditions.push({ company: { equals: company, mode: 'insensitive' as const } });
          if (contactName) orConditions.push({ name: { equals: contactName, mode: 'insensitive' as const } });

          customer = await prisma.customer.findFirst({
            where: { userId, OR: orConditions, deletedAt: null },
          });
          if (!customer) {
            customer = await prisma.customer.create({
              data: {
                userId,
                name: contactName || company || '미지정',
                company: company || null,
                phone: contactPhone || null,
                email: contactEmail || null,
              },
            });
          }
        }

        // 할인율 파싱
        let discountRate: number | null = null;
        if (discountRateRaw) {
          const parsed = parseFloat(discountRateRaw.replace(/%/g, '').trim());
          if (!isNaN(parsed)) discountRate = parsed;
        }

        // 결론 → 상태 매핑
        const status = this.mapConclusionToStatus(conclusion);

        // 견적서 번호
        let finalQuotationNumber = quotationNumber;
        if (!finalQuotationNumber) {
          finalQuotationNumber = await this.generateQuotationNumber('TOXICITY');
        } else {
          const existing = await prisma.quotation.findUnique({ where: { quotationNumber: finalQuotationNumber } });
          if (existing) {
            result.errors.push({ row: rowNumber, message: `견적서 번호 중복: ${finalQuotationNumber}` });
            result.failed++;
            continue;
          }
        }

        const totalAmount = quotationAmount || 0;
        const discountAmount = discountRate ? totalAmount * (discountRate / 100) : null;

        const notesParts: string[] = [];
        if (testStandard) notesParts.push(`시험기준: ${testStandard}`);
        if (purpose) notesParts.push(`제출용도: ${purpose}`);
        if (substanceType) notesParts.push(`물질종류: ${substanceType}`);

        const quotation = await prisma.quotation.create({
          data: {
            userId,
            quotationNumber: finalQuotationNumber,
            quotationType: 'TOXICITY',
            customerId: customer?.id || null,
            customerName: company || contactName || '미지정',
            projectName: quotationName || '미지정',
            modality: substanceType || null,
            status,
            totalAmount,
            discountRate,
            discountAmount,
            items: [],
            notes: notesParts.length > 0 ? notesParts.join(' | ') : null,
            createdAt: this.parseDate(sentDate) || new Date(),
          },
        });

        // 계약번호가 있으면 계약도 생성
        if (contractNumber && customer) {
          const existingContract = await prisma.contract.findUnique({ where: { contractNumber } });
          if (!existingContract) {
            try {
              await prisma.contract.create({
                data: {
                  userId,
                  customerId: customer.id,
                  contractNumber,
                  title: quotationName || '미지정',
                  contractType: 'TOXICITY',
                  status: contractAmount ? 'SIGNED' : 'NEGOTIATING',
                  totalAmount: contractAmount || totalAmount,
                  quotations: { connect: { id: quotation.id } },
                },
              });
            } catch {
              // 계약 생성 실패해도 견적서는 이미 생성됨
            }
          }
        }

        result.success++;
      } catch (error: any) {
        result.errors.push({ row: rowNumber, message: error.message || '알 수 없는 오류' });
        result.failed++;
      }
    }
    return result;
  }

  private mapConclusionToStatus(conclusion: string): 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' {
    if (!conclusion) return 'DRAFT';
    const c = conclusion.trim().toLowerCase();
    if (c.includes('수주') || c.includes('계약') || c.includes('성공') || c.includes('수락')) return 'ACCEPTED';
    if (c.includes('실주') || c.includes('실패') || c.includes('거절') || c.includes('탈락')) return 'REJECTED';
    if (c.includes('만료') || c.includes('취소')) return 'EXPIRED';
    if (c.includes('제출') || c.includes('송부') || c.includes('발송')) return 'SENT';
    return 'DRAFT';
  }

  async importContracts(userId: string, filePath: string): Promise<ImportResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.worksheets[0];
    
    if (!sheet) throw new AppError('Excel 파일에 시트가 없습니다', 400, ErrorCodes.VALIDATION_ERROR);

    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    const rows: any[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      rows.push({ row, rowNumber });
    });

    for (const { row, rowNumber } of rows) {
      try {
        const customerName = this.getCellValue(row, 2);
        const projectName = this.getCellValue(row, 3);

        if (!projectName) {
          result.errors.push({ row: rowNumber, message: '프로젝트명이 필요합니다' });
          result.failed++;
          continue;
        }

        // 고객 찾기 또는 생성
        let customer = await prisma.customer.findFirst({
          where: { userId, name: customerName, deletedAt: null },
        });
        if (!customer && customerName) {
          customer = await prisma.customer.create({
            data: { userId, name: customerName },
          });
        }

        const contractNumber = await this.generateContractNumber();

        await prisma.contract.create({
          data: {
            userId,
            customerId: customer?.id || '',
            contractNumber,
            title: projectName,
            contractType: 'TOXICITY',
            status: 'NEGOTIATING',
            totalAmount: this.parseNumber(this.getCellValue(row, 5)) || 0,
            signedDate: this.parseDate(this.getCellValue(row, 6)),
            startDate: this.parseDate(this.getCellValue(row, 7)),
            endDate: this.parseDate(this.getCellValue(row, 8)),
            notes: this.getCellValue(row, 9) || null,
          },
        });
        result.success++;
      } catch (error: any) {
        result.errors.push({ row: rowNumber, message: error.message || '알 수 없는 오류' });
        result.failed++;
      }
    }
    return result;
  }

  async importCustomers(userId: string, filePath: string): Promise<ImportResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.worksheets[0];
    
    if (!sheet) throw new AppError('Excel 파일에 시트가 없습니다', 400, ErrorCodes.VALIDATION_ERROR);

    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    const rows: any[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      rows.push({ row, rowNumber });
    });

    for (const { row, rowNumber } of rows) {
      try {
        const name = this.getCellValue(row, 1);
        if (!name) {
          result.errors.push({ row: rowNumber, message: '고객명이 필요합니다' });
          result.failed++;
          continue;
        }

        // 중복 체크
        const existing = await prisma.customer.findFirst({
          where: { userId, name, deletedAt: null },
        });
        if (existing) {
          result.errors.push({ row: rowNumber, message: `이미 존재하는 고객: ${name}` });
          result.failed++;
          continue;
        }

        await prisma.customer.create({
          data: {
            userId,
            name,
            company: this.getCellValue(row, 2) || null,
            email: this.getCellValue(row, 3) || null,
            phone: this.getCellValue(row, 4) || null,
            address: this.getCellValue(row, 5) || null,
            notes: this.getCellValue(row, 6) || null,
          },
        });
        result.success++;
      } catch (error: any) {
        result.errors.push({ row: rowNumber, message: error.message || '알 수 없는 오류' });
        result.failed++;
      }
    }
    return result;
  }

  // ==================== 템플릿 생성 ====================

  async generateTemplate(type: ExportType): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    let sheet: ExcelJS.Worksheet;
    let filename: string;

    switch (type) {
      case 'leads':
        sheet = workbook.addWorksheet('리드 템플릿');
        sheet.columns = [
          { header: '리드명*', key: 'title', width: 30 },
          { header: '고객사', key: 'customerName', width: 20 },
          { header: '담당자', key: 'contactName', width: 15 },
          { header: '연락처', key: 'contactPhone', width: 15 },
          { header: '이메일', key: 'contactEmail', width: 25 },
          { header: '파이프라인 단계', key: 'stage', width: 15 },
          { header: '상태', key: 'status', width: 10 },
          { header: '예상 금액', key: 'expectedAmount', width: 15 },
          { header: '예상 계약일(YYYY-MM-DD)', key: 'expectedCloseDate', width: 20 },
          { header: '출처', key: 'source', width: 15 },
          { header: '메모', key: 'notes', width: 40 },
        ];
        filename = 'template_leads.xlsx';
        break;

      case 'quotations':
        sheet = workbook.addWorksheet('견적서 템플릿');
        sheet.columns = [
          { header: '견적번호(자동생성)', key: 'quotationNumber', width: 18 },
          { header: '유형(독성/효력)', key: 'type', width: 15 },
          { header: '고객사*', key: 'customerName', width: 20 },
          { header: '프로젝트명*', key: 'projectName', width: 30 },
          { header: 'Modality', key: 'modality', width: 15 },
          { header: '상태', key: 'status', width: 10 },
          { header: '소계', key: 'subtotal', width: 15 },
          { header: '할인율(%)', key: 'discountRate', width: 12 },
          { header: '할인금액', key: 'discountAmount', width: 15 },
          { header: 'VAT', key: 'vat', width: 15 },
          { header: '총액*', key: 'totalAmount', width: 18 },
          { header: '유효기간(일)', key: 'validDays', width: 12 },
          { header: '유효일(YYYY-MM-DD)', key: 'validUntil', width: 18 },
          { header: '메모', key: 'notes', width: 40 },
        ];
        filename = 'template_quotations.xlsx';
        break;

      case 'contracts':
        sheet = workbook.addWorksheet('계약 템플릿');
        sheet.columns = [
          { header: '계약번호(자동생성)', key: 'contractNumber', width: 18 },
          { header: '고객사', key: 'customerName', width: 20 },
          { header: '프로젝트명*', key: 'projectName', width: 30 },
          { header: '상태', key: 'status', width: 12 },
          { header: '계약금액', key: 'totalAmount', width: 18 },
          { header: '계약일(YYYY-MM-DD)', key: 'signedDate', width: 18 },
          { header: '시작일(YYYY-MM-DD)', key: 'startDate', width: 18 },
          { header: '종료예정일(YYYY-MM-DD)', key: 'endDate', width: 18 },
          { header: '메모', key: 'notes', width: 40 },
        ];
        filename = 'template_contracts.xlsx';
        break;

      case 'customers':
        sheet = workbook.addWorksheet('고객 템플릿');
        sheet.columns = [
          { header: '고객명*', key: 'name', width: 20 },
          { header: '회사명', key: 'company', width: 25 },
          { header: '이메일', key: 'email', width: 30 },
          { header: '전화번호', key: 'phone', width: 18 },
          { header: '주소', key: 'address', width: 40 },
          { header: '메모', key: 'notes', width: 40 },
        ];
        filename = 'template_customers.xlsx';
        break;

      default:
        throw new AppError('지원하지 않는 템플릿 유형입니다', 400, ErrorCodes.VALIDATION_ERROR);
    }

    this.styleHeader(sheet);
    // 예시 데이터 행 추가
    sheet.addRow(this.getExampleRow(type));

    const filepath = path.join(this.exportDir, filename);
    await workbook.xlsx.writeFile(filepath);
    return filename;
  }

  // ==================== Helper Methods ====================

  private styleHeader(sheet: ExcelJS.Worksheet) {
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;
  }

  private getCellValue(row: ExcelJS.Row, col: number): string {
    const cell = row.getCell(col);
    if (!cell || cell.value === null || cell.value === undefined) return '';
    if (cell.value instanceof Date) return cell.value.toISOString().slice(0, 10);
    return String(cell.value).trim();
  }

  private parseNumber(value: string): number | null {
    if (!value) return null;
    const num = parseFloat(value.replace(/,/g, ''));
    return isNaN(num) ? null : num;
  }

  private parseDecimal(value: string): any {
    const num = this.parseNumber(value);
    return num !== null ? num : null;
  }

  private parseDate(value: string): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private translateStatus(status: string): string {
    const map: Record<string, string> = {
      NEW: '신규', CONTACTED: '연락완료', QUALIFIED: '검토완료', PROPOSAL_SENT: '견적발송',
      NEGOTIATING: '협상중', CONVERTED: '계약전환', LOST: '실패', DORMANT: '휴면',
      DRAFT: '작성중', SENT: '제출', ACCEPTED: '수주', REJECTED: '실주', EXPIRED: '만료',
    };
    return map[status] || status;
  }

  private translateContractStatus(status: string): string {
    const map: Record<string, string> = {
      NEGOTIATING: '협의중', SIGNED: '체결', TEST_RECEPTION: '시험접수',
      IN_PROGRESS: '진행중', COMPLETED: '완료', TERMINATED: '해지',
    };
    return map[status] || status;
  }

  private translateStudyStatus(status: string): string {
    const map: Record<string, string> = {
      PREPARING: '준비중', IN_PROGRESS: '진행중', ANALYSIS: '분석중',
      REPORT_DRAFT: '보고서작성', REPORT_REVIEW: '보고서검토', COMPLETED: '완료', SUSPENDED: '중단',
    };
    return map[status] || status;
  }

  private async generateQuotationNumber(type: 'TOXICITY' | 'EFFICACY'): Promise<string> {
    const prefix = type === 'TOXICITY' ? 'TQ' : 'EQ';
    const year = new Date().getFullYear();
    const last = await prisma.quotation.findFirst({
      where: { quotationNumber: { startsWith: `${prefix}-${year}-` } },
      orderBy: { quotationNumber: 'desc' },
    });
    const seq = last ? parseInt(last.quotationNumber.split('-')[2], 10) + 1 : 1;
    return `${prefix}-${year}-${seq.toString().padStart(4, '0')}`;
  }

  private async generateContractNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const last = await prisma.contract.findFirst({
      where: { contractNumber: { startsWith: `CT-${year}-` } },
      orderBy: { contractNumber: 'desc' },
    });
    const seq = last ? parseInt(last.contractNumber.split('-')[2], 10) + 1 : 1;
    return `CT-${year}-${seq.toString().padStart(4, '0')}`;
  }

  private getExampleRow(type: ExportType): any {
    switch (type) {
      case 'leads':
        return { title: '(예시) 신규 프로젝트 문의', customerName: '(주)예시회사', contactName: '홍길동',
          contactPhone: '010-1234-5678', contactEmail: 'hong@example.com', stage: '', status: '',
          expectedAmount: 50000000, expectedCloseDate: '2026-03-01', source: '웹사이트', notes: '메모 내용' };
      case 'quotations':
        return { quotationNumber: '(자동생성)', type: '독성', customerName: '(주)예시회사', projectName: '신약개발 프로젝트',
          modality: 'Small Molecule', status: '', subtotal: 45000000, discountRate: 10, discountAmount: 4500000,
          vat: 4050000, totalAmount: 44550000, validDays: 30, validUntil: '2026-03-01', notes: '메모 내용' };
      case 'contracts':
        return { contractNumber: '(자동생성)', customerName: '(주)예시회사', projectName: '신약개발 프로젝트',
          status: '', totalAmount: 100000000, signedDate: '2026-01-15', startDate: '2026-02-01',
          endDate: '2026-12-31', notes: '메모 내용' };
      case 'customers':
        return { name: '홍길동', company: '(주)예시회사', email: 'hong@example.com',
          phone: '010-1234-5678', address: '서울시 강남구', notes: '메모 내용' };
      default:
        return {};
    }
  }

  async generateLegacyTemplate(): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('기존 견적서 양식');

    sheet.columns = [
      { header: '견적 송부 날짜', key: 'sentDate', width: 18 },
      { header: '견적서 번호', key: 'quotationNumber', width: 18 },
      { header: '계약번호', key: 'contractNumber', width: 18 },
      { header: '시험기준', key: 'testStandard', width: 15 },
      { header: '견적명', key: 'quotationName', width: 30 },
      { header: '의뢰기관', key: 'company', width: 25 },
      { header: '의뢰자', key: 'contactName', width: 15 },
      { header: '의뢰자 연락처', key: 'contactPhone', width: 18 },
      { header: '의뢰자 e-mail', key: 'contactEmail', width: 25 },
      { header: '제출용도', key: 'purpose', width: 15 },
      { header: '물질종류', key: 'substanceType', width: 15 },
      { header: '담당자', key: 'manager', width: 15 },
      { header: '견적금액', key: 'quotationAmount', width: 18 },
      { header: '할인율', key: 'discountRate', width: 12 },
      { header: '계약금액', key: 'contractAmount', width: 18 },
      { header: '결론', key: 'conclusion', width: 12 },
    ];

    this.styleHeader(sheet);

    sheet.addRow({
      sentDate: '2026-01-15',
      quotationNumber: '(비워두면 자동생성)',
      contractNumber: 'CT-2026-0001',
      testStandard: 'KGLP',
      quotationName: '신약개발 독성시험',
      company: '(주)예시제약',
      contactName: '홍길동',
      contactPhone: '010-1234-5678',
      contactEmail: 'hong@example.com',
      purpose: 'IND',
      substanceType: 'Small Molecule',
      manager: '(현재 로그인 사용자)',
      quotationAmount: 50000000,
      discountRate: '10%',
      contractAmount: 45000000,
      conclusion: '수주',
    });

    const filename = 'template_quotations_legacy.xlsx';
    const filepath = path.join(this.exportDir, filename);
    await workbook.xlsx.writeFile(filepath);
    return filename;
  }
}

export const excelService = new ExcelService();
