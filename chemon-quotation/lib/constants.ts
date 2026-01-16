// 견적 유효기간 옵션
export const VALIDITY_OPTIONS = [
  { value: 15, label: '15일' },
  { value: 30, label: '30일' },
  { value: 60, label: '60일' },
  { value: 90, label: '90일' },
];

// 견적 상태
export const QUOTATION_STATUSES = [
  { value: 'draft', label: '작성중' },
  { value: 'submitted', label: '제출완료' },
  { value: 'won', label: '수주' },
  { value: 'lost', label: '실주' },
  { value: 'expired', label: '만료' },
];

// 회사 정보 기본값
export const DEFAULT_COMPANY_INFO = {
  name: '주식회사 켐온',
  name_en: 'CHEMON Inc.',
  business_number: '123-45-67890',
  ceo_name: '대표이사',
  address: '경기도 수원시 영통구 광교로 156',
  address_en: '156, Gwanggyo-ro, Yeongtong-gu, Suwon-si, Gyeonggi-do, Korea',
  tel: '031-888-9900',
  fax: '031-888-9901',
  email: 'contact@chemon.co.kr',
  website: 'www.chemon.co.kr',
  logo: '',
};

// 회사 정보 가져오기 함수
export function getCompanyInfo() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('company_info');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse company info:', e);
      }
    }
  }
  return DEFAULT_COMPANY_INFO;
}

// 하위 호환성을 위한 COMPANY_INFO (deprecated)
export const COMPANY_INFO = DEFAULT_COMPANY_INFO;
