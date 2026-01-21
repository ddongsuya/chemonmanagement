// Clinical Pathology Types
// 임상병리검사 견적서 및 시험의뢰서 타입 정의

// ==================== Enums ====================

export type SampleType = 'WHOLE_BLOOD' | 'SERUM' | 'PLASMA' | 'URINE';

export type ClinicalTestCategory = 
  | 'CBC'
  | 'DIFF'
  | 'RETIC'
  | 'CHEMISTRY_GENERAL'
  | 'ELECTROLYTE'
  | 'CHEMISTRY_ADDITIONAL'
  | 'COAGULATION'
  | 'URINALYSIS'
  | 'URINE_CHEMISTRY';

export type ClinicalQuotationStatus = 
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CONVERTED';

export type ClinicalTestRequestStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'RECEIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type ClinicalReportType = 'SUMMARY' | 'FULL' | 'FULL_WITH_STAT';

export type SampleDisposal = 'RETURN' | 'DISPOSE';

// ==================== 검사항목 마스터 ====================

export interface ClinicalTestItem {
  id: string;
  category: ClinicalTestCategory;
  code: string;
  nameKr: string;
  nameEn: string;
  unit: string | null;
  method: string | null;
  unitPrice: number;
  isPackage: boolean;
  packageItems: string[];
  requiredSampleTypes: SampleType[];
  minSampleVolume: number | null;
  requiresItem: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalQcSetting {
  id: string;
  category: ClinicalTestCategory;
  thresholdCount: number;
  qcFee: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== 견적서 ====================

export interface ClinicalQuotation {
  id: string;
  quotationNumber: string;
  customerId: string | null;
  customer?: {
    id: string;
    name: string;
    company: string | null;
  } | null;
  customerName: string;
  contactPersonId: string | null;
  contactPerson?: {
    id: string;
    name: string;
  } | null;
  contactName: string;
  contactPhone: string | null;
  contactEmail: string | null;
  testStandard: string;
  animalSpecies: string;
  sampleTypes: SampleType[];
  totalSamples: number;
  maleSamples: number;
  femaleSamples: number;
  items?: ClinicalQuotationItem[];
  subtotal: number;
  qcFees: Record<string, number> | null;
  totalQcFee: number;
  discountType: string | null;
  discountValue: number | null;
  discountAmount: number;
  discountReason: string | null;
  totalBeforeVat: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  validDays: number;
  validUntil: string;
  notes: string | null;
  status: ClinicalQuotationStatus;
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  acceptedAt: string | null;
  testRequest?: ClinicalTestRequest | null;
  _count?: {
    items: number;
  };
}

export interface ClinicalQuotationItem {
  id: string;
  quotationId: string;
  testItemId: string;
  testItem?: ClinicalTestItem;
  category: ClinicalTestCategory;
  code: string;
  nameKr: string;
  nameEn: string;
  unit: string | null;
  method: string | null;
  isPackage: boolean;
  unitPrice: number;
  quantity: number;
  amount: number;
  displayOrder: number;
  createdAt: string;
}

// ==================== 시험의뢰서 ====================

export interface ClinicalTestRequest {
  id: string;
  testNumber: string | null;
  quotationId: string;
  quotation?: ClinicalQuotation;
  customerName: string;
  contactName: string;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  postalCode: string | null;
  fax: string | null;
  requestDate: string;
  desiredCompletionDate: string | null;
  reportType: ClinicalReportType;
  includeStatistics: boolean;
  animalSpecies: string;
  sampleTypes: SampleType[];
  totalSamples: number;
  maleSamples: number;
  femaleSamples: number;
  sampleSendDate: string | null;
  items?: ClinicalTestRequestItem[];
  sampleDisposal: SampleDisposal;
  returnAddress: string | null;
  testDescription: string | null;
  receivedDate: string | null;
  testDirectorId: string | null;
  testDirector?: { id: string; name: string } | null;
  receiverId: string | null;
  receiver?: { id: string; name: string } | null;
  operationManagerId: string | null;
  operationManager?: { id: string; name: string } | null;
  approvalDate: string | null;
  status: ClinicalTestRequestStatus;
  createdById: string;
  createdBy?: { id: string; name: string; email?: string };
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  completedAt: string | null;
  _count?: {
    items: number;
  };
}

export interface ClinicalTestRequestItem {
  id: string;
  requestId: string;
  testItemId: string;
  testItem?: ClinicalTestItem;
  category: ClinicalTestCategory;
  code: string;
  nameKr: string;
  nameEn: string;
  isSelected: boolean;
  displayOrder: number;
  createdAt: string;
}


// ==================== API Request/Response Types ====================

export interface CreateQuotationRequest {
  customerId?: string;
  customerName: string;
  contactPersonId?: string;
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  testStandard: 'GLP' | 'NON_GLP';
  animalSpecies: string;
  sampleTypes: SampleType[];
  totalSamples: number;
  maleSamples: number;
  femaleSamples: number;
  items: Array<{ testItemId: string; quantity: number }>;
  discountType?: 'RATE' | 'AMOUNT';
  discountValue?: number;
  discountReason?: string;
  vatRate?: number;
  validDays?: number;
  notes?: string;
}

export interface UpdateQuotationRequest extends Partial<CreateQuotationRequest> {}

export interface QuotationsListResponse {
  quotations: ClinicalQuotation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TestRequestsListResponse {
  requests: ClinicalTestRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CalculateRequest {
  totalSamples: number;
  items: Array<{ testItemId: string; quantity: number }>;
  discountType?: 'RATE' | 'AMOUNT';
  discountValue?: number;
  vatRate?: number;
}

export interface CalculateResponse {
  items: Array<{
    testItemId: string;
    code: string;
    nameKr: string;
    category: ClinicalTestCategory;
    unitPrice: number;
    quantity: number;
    amount: number;
  }>;
  subtotal: number;
  qcFees: Record<string, number>;
  totalQcFee: number;
  discountAmount: number;
  totalBeforeVat: number;
  vatAmount: number;
  totalAmount: number;
}

export interface TestItemsListResponse {
  items: ClinicalTestItem[];
  groupedByCategory: Record<ClinicalTestCategory, ClinicalTestItem[]>;
}

export interface ReceiveRequestData {
  testNumber: string;
  testDirectorId: string;
  receiverId: string;
  operationManagerId?: string;
}

export interface ClinicalStatistics {
  quotations: {
    total: number;
    draft: number;
    sent: number;
    accepted: number;
  };
  testRequests: {
    total: number;
    inProgress: number;
    completed: number;
  };
  monthly: {
    count: number;
    amount: number;
  };
}

// ==================== Constants ====================

export const SAMPLE_TYPE_LABELS: Record<SampleType, string> = {
  WHOLE_BLOOD: '전혈 (EDTA)',
  SERUM: '혈청',
  PLASMA: '혈장',
  URINE: '요',
};

export const CATEGORY_LABELS: Record<ClinicalTestCategory, string> = {
  CBC: '일반혈액학 (CBC)',
  DIFF: '백혈구감별 (DIFF)',
  RETIC: '망상적혈구 (RETIC)',
  CHEMISTRY_GENERAL: '혈액생화학 - 일반',
  ELECTROLYTE: '전해질',
  CHEMISTRY_ADDITIONAL: '혈액생화학 - 추가',
  COAGULATION: '혈액응고검사',
  URINALYSIS: '요검사',
  URINE_CHEMISTRY: '요 생화학',
};

export const QUOTATION_STATUS_LABELS: Record<ClinicalQuotationStatus, string> = {
  DRAFT: '작성중',
  SENT: '발송완료',
  ACCEPTED: '승인됨',
  REJECTED: '거절됨',
  EXPIRED: '만료됨',
  CONVERTED: '의뢰서 전환됨',
};

export const REQUEST_STATUS_LABELS: Record<ClinicalTestRequestStatus, string> = {
  DRAFT: '작성중',
  SUBMITTED: '제출됨',
  RECEIVED: '접수완료',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
  CANCELLED: '취소',
};

export const REPORT_TYPE_LABELS: Record<ClinicalReportType, string> = {
  SUMMARY: '요약',
  FULL: '결과보고서',
  FULL_WITH_STAT: '결과보고서 (통계포함)',
};

export const SAMPLE_DISPOSAL_LABELS: Record<SampleDisposal, string> = {
  RETURN: '반환',
  DISPOSE: '폐기',
};

export const ANIMAL_SPECIES = [
  { value: 'RAT', label: 'Rat (랫드)' },
  { value: 'MOUSE', label: 'Mouse (마우스)' },
  { value: 'RABBIT', label: 'Rabbit (토끼)' },
  { value: 'DOG', label: 'Dog (개)' },
  { value: 'MONKEY', label: 'Monkey (원숭이)' },
  { value: 'MINIPIG', label: 'Minipig (미니피그)' },
  { value: 'GUINEA_PIG', label: 'Guinea pig (기니피그)' },
  { value: 'HAMSTER', label: 'Hamster (햄스터)' },
  { value: 'OTHER', label: '기타' },
];

// 검체 종류별 활성화되는 검사 카테고리
export const SAMPLE_TYPE_CATEGORIES: Record<SampleType, ClinicalTestCategory[]> = {
  WHOLE_BLOOD: ['CBC', 'DIFF', 'RETIC'],
  SERUM: ['CHEMISTRY_GENERAL', 'ELECTROLYTE', 'CHEMISTRY_ADDITIONAL', 'COAGULATION'],
  PLASMA: ['CHEMISTRY_GENERAL', 'ELECTROLYTE', 'CHEMISTRY_ADDITIONAL', 'COAGULATION'],
  URINE: ['URINALYSIS', 'URINE_CHEMISTRY'],
};
