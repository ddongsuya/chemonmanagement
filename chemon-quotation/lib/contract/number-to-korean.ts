/**
 * 숫자를 한글 금액으로 변환
 * @param num - 변환할 숫자
 * @returns 한글 금액 문자열
 * @example numberToKorean(356000000) => "삼억오천육백만"
 */
export function numberToKorean(num: number): string {
  if (num === 0) return '영';
  
  const units = ['', '만', '억', '조'];
  const digits = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  const subUnits = ['', '십', '백', '천'];
  
  let result = '';
  let unitIndex = 0;
  
  while (num > 0) {
    const chunk = num % 10000;
    if (chunk > 0) {
      let chunkStr = '';
      let tempChunk = chunk;
      let subUnitIndex = 0;
      
      while (tempChunk > 0) {
        const digit = tempChunk % 10;
        if (digit > 0) {
          // 일십, 일백, 일천은 '일'을 생략 (단, 일만, 일억은 생략하지 않음)
          const digitStr = (digit === 1 && subUnitIndex > 0) ? '' : digits[digit];
          chunkStr = digitStr + subUnits[subUnitIndex] + chunkStr;
        }
        tempChunk = Math.floor(tempChunk / 10);
        subUnitIndex++;
      }
      result = chunkStr + units[unitIndex] + result;
    }
    num = Math.floor(num / 10000);
    unitIndex++;
  }
  
  return result;
}

/**
 * 숫자를 천단위 콤마가 포함된 문자열로 변환
 * @param num - 변환할 숫자
 * @returns 포맷된 문자열
 * @example formatNumber(356000000) => "356,000,000"
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

/**
 * 날짜를 한글 형식으로 변환
 * @param date - Date 객체 또는 날짜 문자열
 * @returns 한글 날짜 문자열
 * @example formatDateKorean(new Date('2025-03-15')) => "2025년 03월 15일"
 */
export function formatDateKorean(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}년 ${month}월 ${day}일`;
}

/**
 * 두 날짜 사이의 주 수 계산
 * @param startDate - 시작일
 * @param endDate - 종료일
 * @returns 주 수
 */
export function calculateWeeks(startDate: Date | string, endDate: Date | string): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.ceil(diffDays / 7);
}
