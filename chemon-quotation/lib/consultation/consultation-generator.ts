/**
 * 상담기록지 엑셀 파일 생성
 */

import ExcelJS from 'exceljs';
import { ConsultationRecordData, QuotationContentItem } from './types';

/**
 * 상담기록지 엑셀 파일 생성
 */
export async function generateConsultationRecord(
  data: ConsultationRecordData,
  quotationItems: QuotationContentItem[]
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();

  // 시트 1: 상담기록지
  createMainSheet(workbook, data);

  // 시트 2: 견적내용(가격표시x)
  createQuotationSheet(workbook, quotationItems);

  // Blob으로 변환
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * 시트 1: 상담기록지 생성
 */
function createMainSheet(
  workbook: ExcelJS.Workbook,
  data: ConsultationRecordData
): void {
  const sheet = workbook.addWorksheet('상담기록지');

  // 열 너비 설정
  sheet.columns = [
    { width: 14 }, // A
    { width: 18 }, // B
    { width: 25 }, // C
    { width: 14 }, // D
    { width: 30 }, // E
  ];

  // 스타일 정의
  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, size: 10 },
    alignment: { horizontal: 'center', vertical: 'middle' },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    },
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    },
  };

  const cellStyle: Partial<ExcelJS.Style> = {
    font: { size: 10 },
    alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    },
  };

  let row = 1;

  // 제목: 견적 의뢰 기초 자료
  sheet.mergeCells(`A${row}:E${row}`);
  const titleCell = sheet.getCell(`A${row}`);
  titleCell.value = '견적 의뢰 기초 자료';
  titleCell.style = {
    font: { bold: true, size: 14, color: { argb: 'FFFFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    },
  };
  sheet.getRow(row).height = 28;
  row++;

  // 물질 | 값 | 작성자 | 값
  sheet.getCell(`A${row}`).value = '물질';
  sheet.getCell(`A${row}`).style = headerStyle;
  sheet.mergeCells(`B${row}:C${row}`);
  sheet.getCell(`B${row}`).value = data.basic.substanceName;
  sheet.getCell(`B${row}`).style = cellStyle;
  sheet.getCell(`D${row}`).value = '작성자';
  sheet.getCell(`D${row}`).style = headerStyle;
  sheet.getCell(`E${row}`).value = data.basic.authorName;
  sheet.getCell(`E${row}`).style = cellStyle;
  row++;

  // 의뢰기관 | 값 | 의뢰자 | 값
  sheet.getCell(`A${row}`).value = '의뢰기관';
  sheet.getCell(`A${row}`).style = headerStyle;
  sheet.mergeCells(`B${row}:C${row}`);
  sheet.getCell(`B${row}`).value = data.basic.clientCompany;
  sheet.getCell(`B${row}`).style = cellStyle;
  sheet.getCell(`D${row}`).value = '의뢰자';
  sheet.getCell(`D${row}`).style = headerStyle;
  sheet.getCell(`E${row}`).value = data.basic.clientContact;
  sheet.getCell(`E${row}`).style = cellStyle;
  row++;

  // 연락처 | Tel | 값 | e mail | 값
  sheet.getCell(`A${row}`).value = '연락처';
  sheet.getCell(`A${row}`).style = headerStyle;
  sheet.getCell(`B${row}`).value = 'Tel';
  sheet.getCell(`B${row}`).style = headerStyle;
  sheet.getCell(`C${row}`).value = data.basic.clientTel;
  sheet.getCell(`C${row}`).style = cellStyle;
  sheet.getCell(`D${row}`).value = 'e mail';
  sheet.getCell(`D${row}`).style = headerStyle;
  sheet.getCell(`E${row}`).value = data.basic.clientEmail;
  sheet.getCell(`E${row}`).style = cellStyle;
  row++;

  // 물질 제공 예상 일정
  sheet.mergeCells(`A${row}:C${row}`);
  sheet.getCell(`A${row}`).value = '물질 제공 예상 일정';
  sheet.getCell(`A${row}`).style = headerStyle;
  sheet.mergeCells(`D${row}:E${row}`);
  sheet.getCell(`D${row}`).value = data.basic.substanceDeliveryDate;
  sheet.getCell(`D${row}`).style = cellStyle;
  row++;

  // 항목 헤더
  sheet.mergeCells(`A${row}:C${row}`);
  sheet.getCell(`A${row}`).value = '항 목';
  sheet.getCell(`A${row}`).style = headerStyle;
  sheet.mergeCells(`D${row}:E${row}`);
  sheet.getCell(`D${row}`).value = '각 항목에 대해서 자세히 기입해 주세요';
  sheet.getCell(`D${row}`).style = headerStyle;
  row++;

  // 시험의 종류
  const testTypeRows: [string, string, string][] = [
    ['시험의 종류', '독성시험', data.testTypes.toxicity],
    ['', '유전독성', data.testTypes.genotoxicity],
    ['', '약효시험', data.testTypes.efficacy],
    ['', '일반약리/안전성약리', data.testTypes.safetyPharmacology],
    ['', '혈액검사', data.testTypes.hematology],
    ['', '조직병리검사', data.testTypes.histopathology],
    ['', '분석시험', data.testTypes.analysis],
    ['', '기타', data.testTypes.others],
  ];

  const testTypeStartRow = row;
  for (const [label, subLabel, value] of testTypeRows) {
    sheet.getCell(`A${row}`).value = label;
    sheet.getCell(`A${row}`).style = headerStyle;
    sheet.mergeCells(`B${row}:C${row}`);
    sheet.getCell(`B${row}`).value = subLabel;
    sheet.getCell(`B${row}`).style = headerStyle;
    sheet.mergeCells(`D${row}:E${row}`);
    sheet.getCell(`D${row}`).value = value;
    sheet.getCell(`D${row}`).style = cellStyle;
    row++;
  }
  sheet.mergeCells(`A${testTypeStartRow}:A${row - 1}`);

  // 시험계 (동물종)
  const animalRows: [string, string, string][] = [
    ['시험계', '설치류', data.animals.rodent],
    ['', '비설치류', data.animals.nonRodent],
    ['', '토끼', data.animals.rabbit],
    ['', '기니픽', data.animals.guineaPig],
    ['', '기타', data.animals.others],
  ];

  const animalStartRow = row;
  for (const [label, subLabel, value] of animalRows) {
    sheet.getCell(`A${row}`).value = label;
    sheet.getCell(`A${row}`).style = headerStyle;
    sheet.mergeCells(`B${row}:C${row}`);
    sheet.getCell(`B${row}`).value = subLabel;
    sheet.getCell(`B${row}`).style = headerStyle;
    sheet.mergeCells(`D${row}:E${row}`);
    sheet.getCell(`D${row}`).value = value;
    sheet.getCell(`D${row}`).style = cellStyle;
    row++;
  }
  sheet.mergeCells(`A${animalStartRow}:A${row - 1}`);

  // 시험물질 정보
  const substanceRows: [string, string, string][] = [
    ['시험물질', '시험물질 종류', data.substance.type],
    ['', '적응증', data.substance.indication],
    ['', '투여경로', data.substance.administrationRoute],
    ['', '임상투여기간', data.substance.clinicalDuration],
    ['', '보관조건', data.substance.storageCondition],
    ['', '기타', data.substance.otherInfo],
  ];

  const substanceStartRow = row;
  for (const [label, subLabel, value] of substanceRows) {
    sheet.getCell(`A${row}`).value = label;
    sheet.getCell(`A${row}`).style = headerStyle;
    sheet.mergeCells(`B${row}:C${row}`);
    sheet.getCell(`B${row}`).value = subLabel;
    sheet.getCell(`B${row}`).style = headerStyle;
    sheet.mergeCells(`D${row}:E${row}`);
    sheet.getCell(`D${row}`).value = value;
    sheet.getCell(`D${row}`).style = cellStyle;
    row++;
  }
  sheet.mergeCells(`A${substanceStartRow}:A${row - 1}`);

  // 다지점시험
  const multiSiteRows: [string, string, string][] = [
    ['다지점시험', '다지점시험여부', data.multiSite.isMultiSite],
    ['', '위임범위(시험항목)', data.multiSite.delegationScope],
    ['', '다지점시험장소,\n담당자 연락처', data.multiSite.siteInfo],
  ];

  const multiSiteStartRow = row;
  for (const [label, subLabel, value] of multiSiteRows) {
    sheet.getCell(`A${row}`).value = label;
    sheet.getCell(`A${row}`).style = headerStyle;
    sheet.mergeCells(`B${row}:C${row}`);
    sheet.getCell(`B${row}`).value = subLabel;
    sheet.getCell(`B${row}`).style = headerStyle;
    sheet.mergeCells(`D${row}:E${row}`);
    sheet.getCell(`D${row}`).value = value;
    sheet.getCell(`D${row}`).style = cellStyle;
    row++;
  }
  sheet.mergeCells(`A${multiSiteStartRow}:A${row - 1}`);

  // 자료 보관기간
  sheet.mergeCells(`A${row}:C${row}`);
  sheet.getCell(`A${row}`).value = '자료 보관기간';
  sheet.getCell(`A${row}`).style = headerStyle;
  sheet.mergeCells(`D${row}:E${row}`);
  sheet.getCell(`D${row}`).value = data.retentionPeriod;
  sheet.getCell(`D${row}`).style = cellStyle;
  row++;

  // 상담 내역 헤더
  sheet.getCell(`A${row}`).value = '날짜';
  sheet.getCell(`A${row}`).style = headerStyle;
  sheet.getCell(`B${row}`).value = '상담자';
  sheet.getCell(`B${row}`).style = headerStyle;
  sheet.mergeCells(`C${row}:E${row}`);
  sheet.getCell(`C${row}`).value = '상담내용';
  sheet.getCell(`C${row}`).style = headerStyle;
  row++;

  // 상담 내역 (최대 5건)
  for (let i = 0; i < 5; i++) {
    const consultation = data.consultations[i] || {
      date: '',
      consultant: '',
      content: '',
    };
    sheet.getCell(`A${row}`).value = consultation.date;
    sheet.getCell(`A${row}`).style = cellStyle;
    sheet.getCell(`B${row}`).value = consultation.consultant;
    sheet.getCell(`B${row}`).style = cellStyle;
    sheet.mergeCells(`C${row}:E${row}`);
    sheet.getCell(`C${row}`).value = consultation.content;
    sheet.getCell(`C${row}`).style = cellStyle;
    sheet.getRow(row).height = 35;
    row++;
  }
}

/**
 * 시트 2: 견적내용(가격표시x) 생성
 */
function createQuotationSheet(
  workbook: ExcelJS.Workbook,
  items: QuotationContentItem[]
): void {
  const sheet = workbook.addWorksheet('견적내용(가격표시x)');

  // 열 너비 설정
  sheet.columns = [
    { width: 6 }, // No.
    { width: 40 }, // 시험명
    { width: 15 }, // 동물종
    { width: 10 }, // 기간
    { width: 10 }, // 투여경로
    { width: 12 }, // 동물수
    { width: 8 }, // 군수
    { width: 20 }, // 옵션
    { width: 20 }, // 비고
  ];

  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, size: 10 },
    alignment: { horizontal: 'center', vertical: 'middle' },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    },
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    },
  };

  const cellStyle: Partial<ExcelJS.Style> = {
    font: { size: 10 },
    alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    },
  };

  // 안내 문구
  sheet.mergeCells('A1:I1');
  sheet.getCell('A1').value =
    '※ 계약서에 첨부된 견적서 내용 - 가격부분은 제외, 시험 내용만';
  sheet.getCell('A1').style = {
    font: { italic: true, size: 10, color: { argb: 'FF666666' } },
  };

  // 헤더
  const headers = [
    'No.',
    '시험명',
    '동물종',
    '기간',
    '투여경로',
    '동물수',
    '군수',
    '옵션',
    '비고',
  ];
  headers.forEach((header, index) => {
    const cell = sheet.getCell(2, index + 1);
    cell.value = header;
    cell.style = headerStyle;
  });

  // 데이터
  items.forEach((item, index) => {
    const rowNum = index + 3;
    sheet.getCell(rowNum, 1).value = item.no;
    sheet.getCell(rowNum, 2).value = item.testName;
    sheet.getCell(rowNum, 3).value = item.species;
    sheet.getCell(rowNum, 4).value = item.duration;
    sheet.getCell(rowNum, 5).value = item.route;
    sheet.getCell(rowNum, 6).value = item.animalCount;
    sheet.getCell(rowNum, 7).value = item.groupCount;
    sheet.getCell(rowNum, 8).value = item.options;
    sheet.getCell(rowNum, 9).value = item.remarks;

    for (let col = 1; col <= 9; col++) {
      sheet.getCell(rowNum, col).style = cellStyle;
    }
  });
}
