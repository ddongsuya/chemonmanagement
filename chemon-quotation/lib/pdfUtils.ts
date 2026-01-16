// 금액 포맷 (PDF용)
export const formatCurrencyForPDF = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR').format(amount);
};

// 날짜 포맷 (PDF용)
export const formatDateForPDF = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

// 유효기간 계산
export const calculateValidUntil = (baseDate: Date, days: number): Date => {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + days);
  return date;
};
