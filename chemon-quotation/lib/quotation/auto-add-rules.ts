import type { WorkflowSelectedTest } from '@/types/workflow-quotation';

export interface AutoAddRule {
  id: string;
  modalityPatterns: string[]; // 적용 모달리티 패턴
  triggerStage?: string; // 트리거 워크플로우 단계
  triggerTestType?: string; // 트리거 시험 유형
  autoAddTests: AutoAddTest[]; // 자동 추가 시험
  recommendTests: AutoAddTest[]; // 추천 시험
}

export interface AutoAddTest {
  testType: string;
  testName: string;
  reason: string;
}

export const autoAddRules: AutoAddRule[] = [
  // 바이오의약품 - 반복투여독성 시 ADA 자동 추가
  {
    id: 'BIO_ADA',
    modalityPatterns: ['BIO-AB', 'BIO-RP', 'BIO-PEP'],
    triggerStage: 'REPEAT',
    autoAddTests: [
      { testType: 'ADA', testName: 'ADA 분석', reason: '바이오의약품 필수' },
      { testType: 'FORM_ANALYSIS', testName: '조제물분석', reason: 'GLP 시험 필수' },
    ],
    recommendTests: [
      { testType: 'NAB', testName: 'NAb 분석', reason: 'ADA 양성 시 권장' },
      { testType: 'TCR', testName: '조직교차반응', reason: '항체의약품 권장' },
    ],
  },

  // 세포치료제 - 생체분포 자동 추가
  {
    id: 'CELL_BIODIST',
    modalityPatterns: ['CELL'],
    autoAddTests: [
      { testType: 'BIODIST', testName: '생체분포시험', reason: '세포치료제 필수' },
    ],
    recommendTests: [
      {
        testType: 'TUMORIGENICITY',
        testName: '종양원성시험',
        reason: '줄기세포 유래 시 필수',
      },
    ],
  },

  // 유전자치료제 (바이러스 벡터) - 배출, 생체분포 자동 추가
  {
    id: 'GENE_VIR',
    modalityPatterns: ['GENE-VIR'],
    autoAddTests: [
      { testType: 'BIODIST', testName: '생체분포시험', reason: '유전자치료제 필수' },
      { testType: 'SHEDDING', testName: '바이러스 배출시험', reason: '바이러스 벡터 필수' },
      { testType: 'GERMLINE', testName: '생식세포 분포', reason: '유전자치료제 필수' },
    ],
    recommendTests: [
      { testType: 'INSERTIONAL', testName: '삽입돌연변이', reason: '통합형 벡터 필수' },
    ],
  },

  // 유전자편집 - Off-target 분석 자동 추가
  {
    id: 'GENE_EDT',
    modalityPatterns: ['GENE-EDT'],
    autoAddTests: [
      { testType: 'OFFTARGET', testName: 'Off-target 분석', reason: '유전자편집 필수' },
      { testType: 'ONTARGET', testName: 'On-target 분석', reason: '유전자편집 필수' },
      { testType: 'BIODIST', testName: '생체분포시험', reason: '유전자치료제 필수' },
    ],
    recommendTests: [],
  },

  // 온콜리틱 바이러스
  {
    id: 'ADV_ONC',
    modalityPatterns: ['ADV-ONC'],
    autoAddTests: [
      {
        testType: 'SELECTIVITY',
        testName: 'In vitro 종양선택성',
        reason: '온콜리틱 바이러스 필수',
      },
      {
        testType: 'SHEDDING',
        testName: '바이러스 배출시험',
        reason: '온콜리틱 바이러스 필수',
      },
      { testType: 'ATTENUATION', testName: '약독화 안정성', reason: '온콜리틱 바이러스 필수' },
      { testType: 'BIODIST', testName: '생체분포시험', reason: '온콜리틱 바이러스 필수' },
    ],
    recommendTests: [
      {
        testType: 'NEUROVIRULENCE',
        testName: '신경독성',
        reason: '신경친화성 바이러스 시 필수',
      },
    ],
  },

  // 마이크로바이옴
  {
    id: 'MICRO_LBP',
    modalityPatterns: ['MICRO-LBP', 'MICRO-SYN'],
    autoAddTests: [
      { testType: 'STRAIN_CHAR', testName: '균주 특성화', reason: '생균치료제 필수' },
      {
        testType: 'IMMUNOCOMPROMISED',
        testName: '면역저하 모델 시험',
        reason: '생균치료제 필수',
      },
      { testType: 'AMR_TRANSFER', testName: '항생제 내성 전달', reason: '생균치료제 필수' },
    ],
    recommendTests: [],
  },

  // 핵산치료제 (ASO, siRNA)
  {
    id: 'OLIGO',
    modalityPatterns: ['OLIGO-ASO', 'OLIGO-SIR'],
    triggerStage: 'REPEAT',
    autoAddTests: [
      { testType: 'TISSUE_DIST', testName: '조직분포시험', reason: '핵산치료제 필수' },
    ],
    recommendTests: [],
  },

  // 방사성의약품
  {
    id: 'RADIO',
    modalityPatterns: ['RADIO'],
    autoAddTests: [
      { testType: 'BIODIST', testName: '생체분포시험', reason: '방사성의약품 필수' },
      { testType: 'DOSIMETRY', testName: '선량측정', reason: '방사성의약품 필수' },
    ],
    recommendTests: [],
  },
];

// 모달리티에 해당하는 자동 추가 규칙 찾기
export function getAutoAddRules(modalityLevel2: string): AutoAddRule[] {
  return autoAddRules.filter((rule) =>
    rule.modalityPatterns.some((pattern) => modalityLevel2.startsWith(pattern))
  );
}

// 자동 추가할 시험 목록 반환
export function getAutoAddTests(
  modalityLevel2: string,
  currentTests: WorkflowSelectedTest[],
  triggerStage?: string
): { autoAdd: AutoAddTest[]; recommend: AutoAddTest[] } {
  const rules = getAutoAddRules(modalityLevel2);
  const autoAdd: AutoAddTest[] = [];
  const recommend: AutoAddTest[] = [];

  for (const rule of rules) {
    // 트리거 조건 확인
    if (rule.triggerStage && rule.triggerStage !== triggerStage) continue;

    // 자동 추가 시험 (이미 있는 것 제외)
    for (const test of rule.autoAddTests) {
      const alreadyExists = currentTests.some(
        (t) =>
          t.subcategory === test.testType || t.testCode?.includes(test.testType)
      );
      if (!alreadyExists) {
        autoAdd.push(test);
      }
    }

    // 추천 시험 (이미 있는 것 제외)
    for (const test of rule.recommendTests) {
      const alreadyExists = currentTests.some(
        (t) =>
          t.subcategory === test.testType || t.testCode?.includes(test.testType)
      );
      if (!alreadyExists) {
        recommend.push(test);
      }
    }
  }

  return { autoAdd, recommend };
}
