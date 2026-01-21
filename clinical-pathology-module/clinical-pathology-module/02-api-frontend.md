# 임상병리검사 견적서 모듈 - API & 프론트엔드

---

## 2. API 엔드포인트

### 2.1 API 구조

```
/api/clinical-pathology
├── /quotations              # 견적서
├── /test-requests           # 시험의뢰서
├── /master                  # 마스터데이터
└── /settings                # 설정
```

### 2.2 견적서 API

```typescript
// ==================== 견적서 API ====================

// GET /api/clinical-pathology/quotations
// 견적서 목록 조회
interface QuotationsListQuery {
  status?: ClinicalQuotationStatus;
  customerId?: string;
  search?: string;           // 견적번호, 고객명 검색
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

interface QuotationsListResponse {
  quotations: ClinicalQuotationSummary[];
  pagination: Pagination;
}

// GET /api/clinical-pathology/quotations/:id
// 견적서 상세 조회
interface QuotationDetailResponse {
  quotation: ClinicalQuotation;
  items: ClinicalQuotationItem[];
  testRequest?: TestRequest;   // 연결된 시험의뢰서
}

// POST /api/clinical-pathology/quotations
// 견적서 생성
interface CreateQuotationRequest {
  // 고객 정보
  customerId?: string;
  customerName: string;
  contactPersonId?: string;
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  
  // 시험 기준
  testStandard: 'GLP' | 'NON_GLP';
  
  // 검체 정보
  animalSpecies: string;
  sampleTypes: SampleType[];
  totalSamples: number;
  maleSamples: number;
  femaleSamples: number;
  
  // 검사 항목
  items: Array<{
    testItemId: string;
    quantity: number;
  }>;
  
  // 할인
  discountType?: 'RATE' | 'AMOUNT';
  discountValue?: number;
  discountReason?: string;
  
  // 부가세
  vatRate?: number;
  
  // 유효기간
  validDays?: number;
  
  // 비고
  notes?: string;
}

interface CreateQuotationResponse {
  quotation: ClinicalQuotation;
  quotationNumber: string;
}

// PUT /api/clinical-pathology/quotations/:id
// 견적서 수정

// DELETE /api/clinical-pathology/quotations/:id
// 견적서 삭제 (DRAFT 상태만)

// POST /api/clinical-pathology/quotations/:id/send
// 견적서 발송 (상태 변경: DRAFT → SENT)
interface SendQuotationResponse {
  quotation: ClinicalQuotation;
  sentAt: string;
}

// POST /api/clinical-pathology/quotations/:id/accept
// 견적서 승인 (상태 변경: SENT → ACCEPTED)

// POST /api/clinical-pathology/quotations/:id/reject
// 견적서 거절 (상태 변경: SENT → REJECTED)

// POST /api/clinical-pathology/quotations/:id/copy
// 견적서 복사
interface CopyQuotationResponse {
  newQuotation: ClinicalQuotation;
}

// GET /api/clinical-pathology/quotations/:id/pdf
// 견적서 PDF 생성
// Response: PDF binary

// POST /api/clinical-pathology/quotations/:id/convert-to-request
// 견적서 → 시험의뢰서 전환
interface ConvertToRequestResponse {
  testRequest: TestRequest;
  quotation: ClinicalQuotation;  // status: CONVERTED
}
```

### 2.3 시험의뢰서 API

```typescript
// ==================== 시험의뢰서 API ====================

// GET /api/clinical-pathology/test-requests
// 시험의뢰서 목록 조회
interface TestRequestsListQuery {
  status?: TestRequestStatus;
  quotationId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

// GET /api/clinical-pathology/test-requests/:id
// 시험의뢰서 상세 조회

// POST /api/clinical-pathology/test-requests
// 시험의뢰서 생성 (견적서 없이 직접 생성)
interface CreateTestRequestRequest {
  // 의뢰기관 정보
  customerName: string;
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  postalCode?: string;
  fax?: string;
  
  // 의뢰 정보
  desiredCompletionDate?: string;
  reportType: ReportType;
  includeStatistics?: boolean;
  
  // 검체 정보
  animalSpecies: string;
  sampleTypes: SampleType[];
  totalSamples: number;
  maleSamples: number;
  femaleSamples: number;
  sampleSendDate?: string;
  
  // 검사 항목
  items: Array<{
    testItemId: string;
  }>;
  
  // 검체 처리
  sampleDisposal: SampleDisposal;
  returnAddress?: string;
  
  // 시험 내용
  testDescription?: string;
}

// PUT /api/clinical-pathology/test-requests/:id
// 시험의뢰서 수정

// DELETE /api/clinical-pathology/test-requests/:id
// 시험의뢰서 삭제 (DRAFT 상태만)

// POST /api/clinical-pathology/test-requests/:id/submit
// 시험의뢰서 제출

// POST /api/clinical-pathology/test-requests/:id/receive
// 시험의뢰서 접수 (수탁기관)
interface ReceiveRequestRequest {
  testNumber: string;
  testDirectorId: string;
  receiverId: string;
  operationManagerId?: string;
}

// POST /api/clinical-pathology/test-requests/:id/complete
// 시험 완료

// GET /api/clinical-pathology/test-requests/:id/pdf
// 시험의뢰서 PDF 생성
```

### 2.4 마스터데이터 API

```typescript
// ==================== 마스터데이터 API ====================

// GET /api/clinical-pathology/master/test-items
// 검사항목 목록 조회
interface TestItemsListQuery {
  category?: ClinicalTestCategory;
  isActive?: boolean;
  search?: string;
}

interface TestItemsListResponse {
  items: ClinicalTestItem[];
  groupedByCategory: Record<ClinicalTestCategory, ClinicalTestItem[]>;
}

// GET /api/clinical-pathology/master/test-items/:id
// 검사항목 상세

// POST /api/clinical-pathology/master/test-items
// 검사항목 생성 (관리자)
interface CreateTestItemRequest {
  category: ClinicalTestCategory;
  code: string;
  nameKr: string;
  nameEn: string;
  unit?: string;
  method?: string;
  unitPrice: number;
  isPackage?: boolean;
  packageItems?: string[];
  requiredSampleTypes?: SampleType[];
  minSampleVolume?: number;
  requiresItem?: string;
  displayOrder?: number;
}

// PUT /api/clinical-pathology/master/test-items/:id
// 검사항목 수정 (관리자)

// DELETE /api/clinical-pathology/master/test-items/:id
// 검사항목 삭제 (관리자, 사용 이력 없는 경우)

// PATCH /api/clinical-pathology/master/test-items/:id/toggle
// 검사항목 활성화/비활성화

// GET /api/clinical-pathology/master/qc-settings
// QC 설정 조회

// PUT /api/clinical-pathology/master/qc-settings
// QC 설정 수정 (관리자)
interface UpdateQcSettingsRequest {
  settings: Array<{
    category: ClinicalTestCategory;
    thresholdCount: number;
    qcFee: number;
  }>;
}
```

### 2.5 금액 계산 API

```typescript
// POST /api/clinical-pathology/calculate
// 금액 계산 (실시간)
interface CalculateRequest {
  totalSamples: number;
  items: Array<{
    testItemId: string;
    quantity: number;
  }>;
  discountType?: 'RATE' | 'AMOUNT';
  discountValue?: number;
  vatRate?: number;
}

interface CalculateResponse {
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
  qcFees: Record<ClinicalTestCategory, number>;
  totalQcFee: number;
  discountAmount: number;
  totalBeforeVat: number;
  vatAmount: number;
  totalAmount: number;
}
```

---

## 3. 프론트엔드 구조

### 3.1 디렉토리 구조

```
src/
├── app/
│   └── (dashboard)/
│       └── clinical-pathology/
│           ├── page.tsx                    # 메인 (대시보드/목록)
│           ├── layout.tsx
│           │
│           ├── quotations/
│           │   ├── page.tsx                # 견적서 목록
│           │   ├── new/page.tsx            # 견적서 작성
│           │   └── [id]/
│           │       ├── page.tsx            # 견적서 상세
│           │       └── edit/page.tsx       # 견적서 수정
│           │
│           ├── test-requests/
│           │   ├── page.tsx                # 시험의뢰서 목록
│           │   ├── new/page.tsx            # 시험의뢰서 작성
│           │   └── [id]/
│           │       ├── page.tsx            # 시험의뢰서 상세
│           │       └── edit/page.tsx       # 시험의뢰서 수정
│           │
│           └── settings/
│               ├── page.tsx                # 설정 메인
│               ├── test-items/page.tsx     # 검사항목 관리
│               └── qc-settings/page.tsx    # QC 설정 관리
│
├── components/
│   └── clinical-pathology/
│       ├── quotations/
│       │   ├── QuotationList.tsx           # 견적서 목록
│       │   ├── QuotationForm.tsx           # 견적서 폼 (생성/수정)
│       │   ├── QuotationDetail.tsx         # 견적서 상세
│       │   ├── QuotationPDF.tsx            # 견적서 PDF
│       │   └── TestItemSelector.tsx        # 검사항목 선택기
│       │
│       ├── test-requests/
│       │   ├── TestRequestList.tsx         # 의뢰서 목록
│       │   ├── TestRequestForm.tsx         # 의뢰서 폼
│       │   ├── TestRequestDetail.tsx       # 의뢰서 상세
│       │   └── TestRequestPDF.tsx          # 의뢰서 PDF
│       │
│       ├── shared/
│       │   ├── SampleInfoForm.tsx          # 검체 정보 입력
│       │   ├── CustomerSelector.tsx        # 고객 선택
│       │   ├── PriceCalculator.tsx         # 금액 계산기
│       │   ├── DiscountInput.tsx           # 할인 입력
│       │   └── CategoryCheckbox.tsx        # 카테고리별 체크박스
│       │
│       └── settings/
│           ├── TestItemManager.tsx         # 검사항목 관리
│           └── QcSettingManager.tsx        # QC 설정 관리
│
├── hooks/
│   └── clinical-pathology/
│       ├── useQuotations.ts
│       ├── useQuotation.ts
│       ├── useTestRequests.ts
│       ├── useTestItems.ts
│       └── useCalculate.ts
│
├── types/
│   └── clinical-pathology.ts
│
└── lib/
    └── clinical-pathology/
        ├── api.ts
        ├── constants.ts
        └── utils.ts
```

### 3.2 견적서 작성 UI 흐름

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  임상병리검사 견적서 작성                                    [임시저장] [저장] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Step 1: 기본정보                                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  의뢰기관 ┌──────────────────────────────────────┐ [검색] [직접입력]       │
│          │ 식품의약품안전처                       │                        │
│          └──────────────────────────────────────┘                         │
│                                                                             │
│  의뢰자   ┌────────────────┐  연락처 ┌────────────────┐                   │
│          │ 배얘지           │        │ 010-5932-0396   │                   │
│          └────────────────┘        └────────────────┘                    │
│                                                                             │
│  이메일   ┌────────────────────────────────────────┐                       │
│          │ Yeji0124@korea.kr                       │                       │
│          └────────────────────────────────────────┘                       │
│                                                                             │
│  시험기준  ○ GLP   ● Non-GLP                                               │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Step 2: 검체 정보                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  동물 종  ┌────────────────┐                                               │
│          │ Rat        ▼   │                                               │
│          └────────────────┘                                               │
│                                                                             │
│  검체 종류 (복수 선택 가능)                                                 │
│  ☑ 전혈 (EDTA)   ☑ 혈청   ☐ 혈장   ☐ 요                                   │
│                                                                             │
│  검체 수  총 ┌──────┐ 개   ( 수컷 ┌──────┐  암컷 ┌──────┐ )              │
│             │ 130  │         │ 50   │      │ 80   │                     │
│             └──────┘         └──────┘      └──────┘                     │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Step 3: 검사항목 선택                                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─ 혈액학검사 ──────────────────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  │  ☑ CBC (50,000원)                                                    │ │
│  │    WBC, RBC, HGB, HCT, MCV, MCH, MCHC, RDW, HDW, PLT, MPV            │ │
│  │                                                                       │ │
│  │  ☑ DIFF (50,000원) ⚠️ CBC 필수                                       │ │
│  │    NEU, LYM, MONO, EOS, BASO, LUC                                    │ │
│  │                                                                       │ │
│  │  ☑ RETIC (30,000원)                                                  │ │
│  │    Reticulocyte                                                      │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─ 혈액생화학검사 - 일반 (10,000원/항목) ───────────────────────────────┐ │
│  │                                                                       │ │
│  │  ☑ AST    ☑ ALT    ☑ ALP    ☑ BUN    ☑ CRE    ☑ GLU               │ │
│  │  ☑ TCHO   ☑ TPRO   ☑ CPK    ☑ ALB    ☑ TBIL   ☑ TG                │ │
│  │  ☑ IP     ☑ Ca     ☑ A/G    ☐ LDH                                  │ │
│  │                                                                       │ │
│  │  [전체선택] [전체해제]                                                │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─ 전해질검사 ────────────────────────────────────────────────────────┐  │
│  │                                                                       │ │
│  │  ☑ 전해질 (30,000원)                                                 │ │
│  │    Na⁺, K⁺, Cl⁻                                                      │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─ 혈액생화학검사 - 추가 ────────────────────────────────────────────┐   │
│  │                                                                       │ │
│  │  20,000원/항목:  ☑ LDL    ☑ HDL    ☑ γ-GTP                          │ │
│  │                                                                       │ │
│  │  30,000원/항목:  ☐ CRP    ☐ UA     ☐ MA      ☐ BICABO              │ │
│  │                 ☐ CRP-L  ☐ micro-ALB  ☐ HbA1c                       │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─ 혈액응고검사 (10,000원/항목) ───────────────────────────────────────┐ │
│  │                                                                       │ │
│  │  ☐ PT    ☐ APTT    ☐ FIB                                            │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─ 요검사 ──────────────────────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  │  ☐ 일반검사 (10,000원)    ☐ 요침사검사 (20,000원)                    │ │
│  │                                                                       │ │
│  │  요 생화학 (30,000원/항목):                                          │ │
│  │  ☐ U-UA   ☐ U-MA   ☐ U-BUN   ☐ U-CRE   ☐ U-TP   ☐ U-Ca            │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Step 4: 금액 확인                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  항목                                    │ 단가      │ 수량 │ 금액     │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │  [혈액학검사]                            │           │      │          │ │
│  │  CBC                                     │ 50,000    │ 130  │ 6,500,000│ │
│  │  DIFF                                    │ 50,000    │ 130  │ 6,500,000│ │
│  │  RETIC                                   │ 30,000    │ 130  │ 3,900,000│ │
│  │  [혈액생화학검사 - 일반] (15항목)        │           │      │          │ │
│  │  AST, ALT, ALP, BUN, CRE, GLU...        │ 10,000    │ 130  │19,500,000│ │
│  │  [전해질검사]                            │           │      │          │ │
│  │  Na⁺/K⁺/Cl⁻                             │ 30,000    │ 130  │ 3,900,000│ │
│  │  [혈액생화학검사 - 추가]                 │           │      │          │ │
│  │  LDL                                     │ 20,000    │ 130  │ 2,600,000│ │
│  │  HDL                                     │ 20,000    │ 130  │ 2,600,000│ │
│  │  γ-GTP                                   │ 20,000    │ 130  │ 2,600,000│ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │  소계                                                    │48,100,000  │ │
│  │  QC 비용 (혈액학 400,000 + 생화학 400,000 + ...)         │ 1,600,000  │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │  합계                                                    │49,700,000  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  할인  ○ 할인율(%)  ● 할인금액(원)                                         │
│       ┌──────────┐                                                         │
│       │ 5        │ %   →  할인금액: 2,485,000원                           │
│       └──────────┘                                                         │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  견적가                                              │  49,700,000원  │ │
│  │  할인 (5%)                                           │  -2,485,000원  │ │
│  │  할인 견적가                                         │  47,215,000원  │ │
│  │  부가세 (10%)                                        │   4,721,500원  │ │
│  │  ─────────────────────────────────────────────────────────────────── │ │
│  │  최종 금액                                           │ 51,936,500원  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  유효기간: 60일 (2025.05.10까지)                                           │
│                                                                             │
│  비고 ┌────────────────────────────────────────────────────────────────┐  │
│       │                                                                │  │
│       └────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                                        [취소]  [임시저장]  [미리보기]  [저장] │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 견적서 상세 페이지 액션

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  견적서 상세                                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  견적번호: 25-DL-03-0009                    상태: [발송완료]                │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  [PDF 다운로드]  [수정]  [복사]  [삭제]  [견적 발송]                  │   │
│  │                                                                      │   │
│  │  견적 승인 후: [시험의뢰서 생성]                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ... 견적서 상세 내용 ...                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. 비즈니스 로직

### 4.1 검체 종류 - 검사항목 연결

```typescript
// 검체 종류별 활성화되는 검사 카테고리
const SAMPLE_TYPE_CATEGORIES: Record<SampleType, ClinicalTestCategory[]> = {
  WHOLE_BLOOD: ['CBC', 'DIFF', 'RETIC'],
  SERUM: ['CHEMISTRY_GENERAL', 'ELECTROLYTE', 'CHEMISTRY_ADDITIONAL', 'COAGULATION'],
  PLASMA: ['CHEMISTRY_GENERAL', 'ELECTROLYTE', 'CHEMISTRY_ADDITIONAL', 'COAGULATION'],
  URINE: ['URINALYSIS', 'URINE_CHEMISTRY'],
};

// 선택된 검체 종류에 따라 검사항목 활성화
function getAvailableCategories(sampleTypes: SampleType[]): ClinicalTestCategory[] {
  const categories = new Set<ClinicalTestCategory>();
  sampleTypes.forEach(type => {
    SAMPLE_TYPE_CATEGORIES[type].forEach(cat => categories.add(cat));
  });
  return Array.from(categories);
}
```

### 4.2 DIFF 의존성 체크

```typescript
// DIFF 선택 시 CBC 필수 체크
function validateDiffSelection(selectedItems: string[]): ValidationResult {
  const hasDiff = selectedItems.includes('DIFF');
  const hasCbc = selectedItems.includes('CBC');
  
  if (hasDiff && !hasCbc) {
    return {
      valid: false,
      error: 'DIFF(백혈구감별)는 CBC(일반혈액학) 없이 단독 검사가 불가능합니다.',
    };
  }
  return { valid: true };
}
```

### 4.3 QC 비용 계산

```typescript
// QC 비용 계산 (카테고리별)
function calculateQcFees(
  items: QuotationItem[],
  totalSamples: number,
  qcSettings: QcSetting[]
): Record<ClinicalTestCategory, number> {
  const fees: Record<string, number> = {};
  
  // 사용된 카테고리 추출
  const usedCategories = new Set(items.map(item => item.category));
  
  usedCategories.forEach(category => {
    const setting = qcSettings.find(s => s.category === category);
    if (setting && totalSamples < setting.thresholdCount) {
      fees[category] = setting.qcFee;
    }
  });
  
  return fees;
}
```

### 4.4 금액 계산 전체 흐름

```typescript
function calculateQuotation(params: CalculateParams): CalculationResult {
  const { items, totalSamples, discountType, discountValue, vatRate = 10 } = params;
  
  // 1. 항목별 금액 계산
  const itemsWithAmount = items.map(item => ({
    ...item,
    amount: item.unitPrice * totalSamples,
  }));
  
  // 2. 소계
  const subtotal = itemsWithAmount.reduce((sum, item) => sum + item.amount, 0);
  
  // 3. QC 비용
  const qcFees = calculateQcFees(itemsWithAmount, totalSamples, qcSettings);
  const totalQcFee = Object.values(qcFees).reduce((sum, fee) => sum + fee, 0);
  
  // 4. 합계 (할인 전)
  const totalBeforeDiscount = subtotal + totalQcFee;
  
  // 5. 할인 계산
  let discountAmount = 0;
  if (discountType === 'RATE' && discountValue) {
    discountAmount = Math.round(totalBeforeDiscount * (discountValue / 100));
  } else if (discountType === 'AMOUNT' && discountValue) {
    discountAmount = discountValue;
  }
  
  // 6. VAT 전 금액
  const totalBeforeVat = totalBeforeDiscount - discountAmount;
  
  // 7. 부가세
  const vatAmount = Math.round(totalBeforeVat * (vatRate / 100));
  
  // 8. 최종 금액
  const totalAmount = totalBeforeVat + vatAmount;
  
  return {
    items: itemsWithAmount,
    subtotal,
    qcFees,
    totalQcFee,
    discountAmount,
    totalBeforeVat,
    vatAmount,
    totalAmount,
  };
}
```

### 4.5 견적서 → 시험의뢰서 전환

```typescript
async function convertToTestRequest(quotationId: string, userId: string) {
  const quotation = await prisma.clinicalQuotation.findUnique({
    where: { id: quotationId },
    include: { items: true, customer: true },
  });
  
  if (quotation.status !== 'ACCEPTED') {
    throw new Error('승인된 견적서만 시험의뢰서로 전환할 수 있습니다.');
  }
  
  // 트랜잭션으로 처리
  const result = await prisma.$transaction(async (tx) => {
    // 1. 시험의뢰서 생성
    const testRequest = await tx.testRequest.create({
      data: {
        quotationId: quotation.id,
        customerName: quotation.customerName,
        contactName: quotation.contactName,
        contactPhone: quotation.contactPhone,
        contactEmail: quotation.contactEmail,
        address: quotation.customer?.address,
        animalSpecies: quotation.animalSpecies,
        sampleTypes: quotation.sampleTypes,
        totalSamples: quotation.totalSamples,
        maleSamples: quotation.maleSamples,
        femaleSamples: quotation.femaleSamples,
        reportType: 'FULL',
        sampleDisposal: 'DISPOSE',
        status: 'DRAFT',
        createdById: userId,
        items: {
          create: quotation.items.map(item => ({
            testItemId: item.testItemId,
            category: item.category,
            code: item.code,
            nameKr: item.nameKr,
            nameEn: item.nameEn,
            isSelected: true,
            displayOrder: item.displayOrder,
          })),
        },
      },
    });
    
    // 2. 견적서 상태 변경
    await tx.clinicalQuotation.update({
      where: { id: quotationId },
      data: { status: 'CONVERTED' },
    });
    
    return testRequest;
  });
  
  return result;
}
```

---

*다음: PDF 출력 및 마스터데이터 초기값*
