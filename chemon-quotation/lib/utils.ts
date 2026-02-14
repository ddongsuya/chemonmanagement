import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 금액 포맷
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

// 날짜 포맷
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// 견적번호 생성 (새 형식: 25-DL-12-0001)
export function generateQuotationNumber(): string {
  // localStorage에서 사용자 설정 로드
  const USER_SETTINGS_KEY = 'chemon_user_settings';
  let userCode = 'XX';
  let nextSeq = 1;

  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(USER_SETTINGS_KEY);
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        userCode = settings.user_code || 'XX';
        nextSeq = settings.next_quotation_seq || 1;
      } catch {
        // 기본값 사용
      }
    }
  }

  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const seq = nextSeq.toString().padStart(4, '0');

  return `${year}-${userCode}-${month}-${seq}`;
}

// 견적번호 생성 후 시퀀스 증가
export function incrementQuotationSeq(): void {
  const USER_SETTINGS_KEY = 'chemon_user_settings';
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(USER_SETTINGS_KEY);
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        settings.next_quotation_seq = (settings.next_quotation_seq || 1) + 1;
        localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
      } catch {
        // 무시
      }
    }
  }
}

// 상태 라벨
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: '작성중',
    submitted: '제출완료',
    reviewing: '검토중',
    won: '수주',
    lost: '실주',
    expired: '만료',
    cancelled: '취소',
  };
  return labels[status] || status;
}

// 상태 색상
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-blue-100 text-blue-700',
    reviewing: 'bg-yellow-100 text-yellow-700',
    won: 'bg-green-100 text-green-700',
    lost: 'bg-red-100 text-red-700',
    expired: 'bg-orange-100 text-orange-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}
