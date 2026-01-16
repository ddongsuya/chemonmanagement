interface GenerateParams {
  userCode: string;
  nextSeq: number;
}

interface GenerateRevisionParams {
  originalNumber: string; // "25-DL-12-0001"
  currentRevision: number; // 0, 1, 2...
}

/**
 * 신규 견적번호 생성
 * @returns "25-DL-12-0001" 형식
 */
export function generateQuotationNumber({
  userCode,
  nextSeq,
}: GenerateParams): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const seq = nextSeq.toString().padStart(4, '0');

  return `${year}-${userCode}-${month}-${seq}`;
}

/**
 * 수정 견적번호 생성
 * @returns "25-DL-12-0001-1" 형식
 */
export function generateRevisionNumber({
  originalNumber,
  currentRevision,
}: GenerateRevisionParams): string {
  // 이미 수정본인 경우 기본 번호 추출 (25-DL-12-0001-1 → 25-DL-12-0001)
  const baseNumber = originalNumber.split('-').slice(0, 4).join('-');
  const nextRevision = currentRevision + 1;

  return `${baseNumber}-${nextRevision}`;
}

/**
 * 견적번호 파싱
 */
export function parseQuotationNumber(quotationNo: string): {
  year: string;
  userCode: string;
  month: string;
  seq: number;
  revision: number;
} {
  const parts = quotationNo.split('-');

  return {
    year: parts[0], // "25"
    userCode: parts[1], // "DL"
    month: parts[2], // "12"
    seq: parseInt(parts[3]), // 1
    revision: parts[4] ? parseInt(parts[4]) : 0, // 0 또는 1, 2, 3...
  };
}

/**
 * 견적번호 유효성 검사
 */
export function isValidQuotationNumber(quotationNo: string): boolean {
  const pattern = /^\d{2}-[A-Z]{2}-\d{2}-\d{4}(-\d+)?$/;
  return pattern.test(quotationNo);
}

/**
 * 수정본 여부 확인
 */
export function isRevision(quotationNo: string): boolean {
  return quotationNo.split('-').length > 4;
}

/**
 * 기본 견적번호 추출 (수정본에서 원본 번호)
 */
export function getBaseNumber(quotationNo: string): string {
  return quotationNo.split('-').slice(0, 4).join('-');
}
