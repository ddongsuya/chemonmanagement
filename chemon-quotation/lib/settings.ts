// 시스템 설정 기본값
export const DEFAULT_SYSTEM_SETTINGS = {
  quotation_prefix: 'Q',
  quotation_format: 'PREFIX-YYYY-NNN',
  default_validity_days: 30,
  default_discount_rate: 0,
  auto_analysis_calculation: true,
  validation_invivo_cost: 10000000,
  validation_invitro_cost: 10000000,
  analysis_unit_cost: 1000000,
  email_notification: true,
  browser_notification: false,
  notify_on_expiry: true,
  expiry_reminder_days: 7,
  currency_unit: 'KRW',
  date_format: 'YYYY.MM.DD',
  show_vat_notice: true,
};

// 시스템 설정 가져오기
export function getSystemSettings() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('system_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SYSTEM_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse system settings:', e);
      }
    }
  }
  return DEFAULT_SYSTEM_SETTINGS;
}

// 견적번호 생성
export function generateQuotationNumber(sequence?: number) {
  const settings = getSystemSettings();
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const seq = sequence ?? Math.floor(Math.random() * 1000);
  const seqStr = String(seq).padStart(3, '0');

  switch (settings.quotation_format) {
    case 'PREFIX-YYYY-NNN':
      return `${settings.quotation_prefix}-${year}-${seqStr}`;
    case 'PREFIX-YYYYMM-NNN':
      return `${settings.quotation_prefix}-${year}${month}-${seqStr}`;
    case 'YYYYMMDD-NNN':
      return `${year}${month}${day}-${seqStr}`;
    default:
      return `${settings.quotation_prefix}-${year}-${seqStr}`;
  }
}

// 조제물분석 비용 계산
export function calculateAnalysisCost(
  testType: 'in vivo' | 'in vitro',
  analysisCount: number
) {
  const settings = getSystemSettings();

  if (!settings.auto_analysis_calculation) {
    return 0;
  }

  const validationCost =
    testType === 'in vivo'
      ? settings.validation_invivo_cost
      : settings.validation_invitro_cost;

  const analysisCost = settings.analysis_unit_cost * analysisCount;

  return validationCost + analysisCost;
}

// 기본 유효기간 가져오기
export function getDefaultValidityDays() {
  const settings = getSystemSettings();
  return settings.default_validity_days;
}

// 기본 할인율 가져오기
export function getDefaultDiscountRate() {
  const settings = getSystemSettings();
  return settings.default_discount_rate;
}
