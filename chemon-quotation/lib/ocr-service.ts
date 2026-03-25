// lib/ocr-service.ts
// OCR 서비스 레이어 — 개발: Tesseract.js / 정식: OpenAI Vision API로 교체

import Tesseract from 'tesseract.js';

export interface ParsedStudyRow {
  substanceCode: string;
  projectCode: string;
  testSubstance: string;
  sponsor: string;
  studyCode: string;
  studyTitle: string;
  studyDirector: string;
}

export interface OCRResult {
  studies: ParsedStudyRow[];
  rawText: string;
  confidence: number;
}

// 표 텍스트를 파싱하여 시험 데이터 행으로 변환
function parseTableText(text: string): ParsedStudyRow[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const studies: ParsedStudyRow[] = [];

  // 시험번호 패턴: XX-YY-ZZZZ (예: 25-NV-0194)
  const studyCodePattern = /\d{2}-[A-Z]{2}-\d{3,4}/;

  for (const line of lines) {
    // 탭이나 여러 공백으로 구분된 셀 분리
    const cells = line.split(/\t+|\s{2,}/).map(c => c.trim()).filter(c => c.length > 0);

    // 시험번호가 포함된 행만 처리
    const hasStudyCode = cells.some(c => studyCodePattern.test(c));
    if (!hasStudyCode || cells.length < 3) continue;

    // 시험번호 위치 찾기
    const codeIdx = cells.findIndex(c => studyCodePattern.test(c));
    const codeMatch = cells[codeIdx].match(studyCodePattern);
    if (!codeMatch) continue;

    // 셀 수에 따라 매핑 (유연하게 처리)
    const row: ParsedStudyRow = {
      substanceCode: '',
      projectCode: '',
      testSubstance: '',
      sponsor: '',
      studyCode: codeMatch[0],
      studyTitle: '',
      studyDirector: '',
    };

    // 7열 이상: 물질코드, 프로젝트코드, 시험물질, 의뢰기관, 시험번호, 시험제목, 시험책임자
    if (cells.length >= 7) {
      row.substanceCode = cells[0] || '';
      row.projectCode = cells[1] || '';
      row.testSubstance = cells[2] || '';
      row.sponsor = cells[3] || '';
      // cells[codeIdx] = studyCode (이미 설정됨)
      row.studyTitle = cells[codeIdx + 1] || '';
      row.studyDirector = cells[codeIdx + 2] || cells[cells.length - 1] || '';
    } else if (cells.length >= 4) {
      // 최소 4열: 시험번호, 시험제목, 시험책임자 + α
      row.studyTitle = cells[codeIdx + 1] || '';
      row.studyDirector = cells[cells.length - 1] || '';
      if (codeIdx > 0) row.substanceCode = cells[0] || '';
      if (codeIdx > 1) row.projectCode = cells[1] || '';
    } else {
      // 3열: 시험번호, 시험제목, 시험책임자
      row.studyTitle = cells[codeIdx + 1] || '';
      row.studyDirector = cells[codeIdx + 2] || cells[cells.length - 1] || '';
    }

    studies.push(row);
  }

  return studies;
}

// 메인 OCR 함수 — Tesseract.js (개발용)
export async function parseStudyImage(imageFile: File): Promise<OCRResult> {
  const result = await Tesseract.recognize(imageFile, 'kor+eng', {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        // progress callback 가능
      }
    },
  });

  const rawText = result.data.text;
  const confidence = result.data.confidence;
  const studies = parseTableText(rawText);

  return { studies, rawText, confidence };
}
