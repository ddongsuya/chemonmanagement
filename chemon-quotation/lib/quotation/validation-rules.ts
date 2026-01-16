import type { WorkflowSelectedTest, ValidationResult } from '@/types/workflow-quotation';

export interface ValidationRule {
  id: string;
  type: 'error' | 'warning' | 'info';
  condition: (tests: WorkflowSelectedTest[], modalityLevel2: string) => boolean;
  message: string;
  action: 'block' | 'confirm' | 'suggest';
  suggestedTests?: string[];
}

export const validationRules: ValidationRule[] = [
  // DRF 없이 반복투여독성 진행
  {
    id: 'DRF_BEFORE_REPEAT',
    type: 'warning',
    condition: (tests, modality) => {
      const hasRepeat = tests.some((t) => t.workflowStage === 'REPEAT');
      const hasDRF = tests.some((t) => t.workflowStage === 'DRF');
      const applicableModalities = [
        'SM-SYN',
        'SM-NAT',
        'SM-CMB',
        'BIO-RP',
        'BIO-PEP',
        'OLIGO-ASO',
        'OLIGO-SIR',
      ];
      return (
        hasRepeat &&
        !hasDRF &&
        applicableModalities.some((m) => modality.startsWith(m))
      );
    },
    message:
      'DRF 없이 반복투여독성 진행 시 용량 설정 실패 위험이 있습니다. DRF 추가를 권장합니다.',
    action: 'confirm',
    suggestedTests: ['DRF'],
  },

  // 반복투여독성에 TK 미포함
  {
    id: 'TK_WITH_REPEAT',
    type: 'warning',
    condition: (tests) => {
      const repeatTests = tests.filter((t) => t.workflowStage === 'REPEAT');
      return repeatTests.some((t) => !t.options.includeTK);
    },
    message:
      'TK 없이 반복투여독성 진행 시 노출 평가가 어렵습니다. TK 포함을 권장합니다.',
    action: 'suggest',
  },

  // 바이오의약품 ADA 필수
  {
    id: 'ADA_FOR_BIOLOGICS',
    type: 'error',
    condition: (tests, modality) => {
      if (!modality.startsWith('BIO-AB') && !modality.startsWith('BIO-RP'))
        return false;
      const hasRepeat = tests.some((t) => t.workflowStage === 'REPEAT');
      const hasADA = tests.some((t) => t.subcategory === 'ADA');
      return hasRepeat && !hasADA;
    },
    message: '항체/재조합단백질 반복투여독성에는 ADA 분석이 필수입니다.',
    action: 'block',
    suggestedTests: ['ADA'],
  },

  // 세포/유전자치료제 생체분포 필수
  {
    id: 'BIODIST_FOR_CELL_GENE',
    type: 'error',
    condition: (tests, modality) => {
      const requiresBiodist =
        modality.startsWith('CELL') || modality.startsWith('GENE');
      if (!requiresBiodist) return false;
      const hasBiodist = tests.some((t) => t.workflowStage === 'BIODIST');
      return !hasBiodist;
    },
    message: '세포/유전자치료제는 생체분포 시험이 필수입니다.',
    action: 'block',
    suggestedTests: ['BIODIST'],
  },

  // 유전자치료제 배출시험 필수
  {
    id: 'SHEDDING_FOR_GENE',
    type: 'error',
    condition: (tests, modality) => {
      if (!modality.startsWith('GENE-VIR')) return false;
      const hasShedding = tests.some((t) => t.workflowStage === 'SHEDDING');
      return !hasShedding;
    },
    message: '바이러스 벡터 유전자치료제는 배출(Shedding) 시험이 필수입니다.',
    action: 'block',
    suggestedTests: ['SHEDDING'],
  },

  // 동물종 일관성 체크
  {
    id: 'SPECIES_CONSISTENCY',
    type: 'warning',
    condition: (tests) => {
      const drfTest = tests.find((t) => t.workflowStage === 'DRF');
      const repeatTest = tests.find((t) => t.workflowStage === 'REPEAT');
      if (!drfTest || !repeatTest) return false;
      return drfTest.options.species !== repeatTest.options.species;
    },
    message:
      'DRF와 반복투여독성의 동물종이 다릅니다. 의도한 설계인지 확인해주세요.',
    action: 'confirm',
  },

  // 투여경로 일관성 체크
  {
    id: 'ROUTE_CONSISTENCY',
    type: 'warning',
    condition: (tests) => {
      const drfTest = tests.find((t) => t.workflowStage === 'DRF');
      const repeatTest = tests.find((t) => t.workflowStage === 'REPEAT');
      if (!drfTest || !repeatTest) return false;
      return drfTest.options.route !== repeatTest.options.route;
    },
    message:
      'DRF와 반복투여독성의 투여경로가 다릅니다. 의도한 설계인지 확인해주세요.',
    action: 'confirm',
  },

  // 온콜리틱 바이러스 선택성 시험 필수
  {
    id: 'SELECTIVITY_FOR_OV',
    type: 'error',
    condition: (tests, modality) => {
      if (!modality.startsWith('ADV-ONC')) return false;
      const hasSelectivity = tests.some((t) => t.subcategory === '종양선택성');
      return !hasSelectivity;
    },
    message: '온콜리틱 바이러스는 In vitro 종양선택성 시험이 필수입니다.',
    action: 'block',
    suggestedTests: ['SELECTIVITY_INVITRO'],
  },

  // 마이크로바이옴 면역저하 모델 필수
  {
    id: 'IMMUNOCOMPROMISED_FOR_MICRO',
    type: 'error',
    condition: (tests, modality) => {
      if (!modality.startsWith('MICRO')) return false;
      const hasImmunocompromised = tests.some(
        (t) =>
          t.options.species?.includes('immunocompromised') ||
          t.options.species?.includes('SCID')
      );
      return !hasImmunocompromised;
    },
    message: '생균치료제는 면역저하 동물 모델 시험이 필수입니다.',
    action: 'block',
  },
];

// 검증 실행 함수
export function validateTests(
  tests: WorkflowSelectedTest[],
  modalityLevel2: string
): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const rule of validationRules) {
    if (rule.condition(tests, modalityLevel2)) {
      results.push({
        id: rule.id,
        type: rule.type,
        message: rule.message,
        action: rule.action,
        suggestedTests: rule.suggestedTests,
        acknowledged: false,
      });
    }
  }

  return results;
}

// 블로킹 에러 있는지 확인
export function hasBlockingErrors(results: ValidationResult[]): boolean {
  return results.some(
    (r) => r.type === 'error' && r.action === 'block' && !r.acknowledged
  );
}

// 확인 필요한 경고 있는지 확인
export function hasUnconfirmedWarnings(results: ValidationResult[]): boolean {
  return results.some(
    (r) => r.type === 'warning' && r.action === 'confirm' && !r.acknowledged
  );
}
