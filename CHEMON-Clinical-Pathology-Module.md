# 임상병리검사 견적서 모듈 상세 설계서

> CHEMON 견적관리 시스템 확장 모듈

---

## 목차

1. [데이터베이스 스키마](#1-데이터베이스-스키마)
2. [API 엔드포인트](#2-api-엔드포인트)
3. [프론트엔드 구조](#3-프론트엔드-구조)
4. [비즈니스 로직](#4-비즈니스-로직)
5. [PDF 출력](#5-pdf-출력)

---

## 1. 데이터베이스 스키마

### 1.1 신규 Enum

```prisma
// 검체 종류
enum SampleType {
  WHOLE_BLOOD    // 전혈
  SERUM          // 혈청
  PLASMA         // 혈장
  URINE          // 요
}

// 임상병리 검사 카테고리
enum ClinicalTestCategory {
  CBC                    // 일반혈액학 (패키지)
  DIFF                   // 백혈구감별 (패키지)
  RETIC                  // 망상적혈구
  CHEMISTRY_GENERAL      // 혈액생화학 일반
  ELECTROLYTE            // 전해질 (패키지)
  CHEMISTRY_ADDITIONAL   // 혈액생화학 추가
  COAGULATION            // 혈액응고
  URINALYSIS             // 요검사
  URINE_CHEMISTRY        // 요 생화학
}

// 임상병리 견적서 상태
enum ClinicalQuotationStatus {
  DRAFT          // 작성중
  SENT           // 발송완료
  ACCEPTED       // 승인됨
  REJECTED       // 거절됨
  EXPIRED        // 만료됨
  CONVERTED      // 의뢰서 전환됨
}

// 시험의뢰서 상태
enum TestRequestStatus {
  DRAFT          // 작성중
  SUBMITTED      // 제출됨
  RECEIVED       // 접수완료
  IN_PROGRESS    // 진행중
  COMPLETED      // 완료
  CANCELLED      // 취소
}

// 결과 보고서 유형
enum ReportType {
  SUMMARY        // 요약
  FULL           // 결과보고서
  FULL_WITH_STAT // 결과보고서 (통계포함)
}

// 검체 처리 방법
enum SampleDisposal {
  RETURN         // 반환
  DISPOSE        // 폐기
}
```

### 1.2 마스터데이터: 임상병리 검사항목

```prisma
// 임상병리 검사항목 마스터
model ClinicalTestItem {
  id                String                @id @default(uuid())
  
  // 기본 정보
  category          ClinicalTestCategory
  code              String                @unique    // AST, ALT, CBC 등
  nameKr            String                           // 한글명
  nameEn            String                           // 영문명
  unit              String?                          // 단위 (U/L, mg/dL 등)
  method            String?                          // 측정 방법
  
  // 가격 정보
  unitPrice         Int                              // 단가 (원)
  isPackage         Boolean               @default(false)  // 패키지 여부
  packageItems      String[]              @default([])     // 패키지 포함 항목 코드
  
  // 검체 요구사항
  requiredSampleTypes SampleType[]        @default([])     // 필요 검체 종류
  minSampleVolume   Int?                             // 최소 검체량 (㎕)
  
  // 의존성
  requiresItem      String?                          // 필수 선행 항목 (DIFF → CBC)
  
  // 표시 순서
  displayOrder      Int                   @default(0)
  
  // 활성화 여부
  isActive          Boolean               @default(true)
  
  // 메타
  createdAt         DateTime              @default(now())
  updatedAt         DateTime              @updatedAt
  
  // 관계
  quotationItems    ClinicalQuotationItem[]
  requestItems      TestRequestItem[]
  
  @@index([category, isActive])
  @@index([code])
}

// QC 비용 설정
model ClinicalQcSetting {
  id                String                @id @default(uuid())
  
  category          ClinicalTestCategory
  thresholdCount    Int                   @default(100)  // 기준 검체 수
  qcFee             Int                   @default(400000)  // QC 비용
  
  isActive          Boolean               @default(true)
  
  createdAt         DateTime              @default(now())
  updatedAt         DateTime              @updatedAt
  
  @@unique([category])
}
```

### 1.3 임상병리 견적서

```prisma
// 임상병리 견적서
model ClinicalQuotation {
  id                  String                    @id @default(uuid())
  
  // 견적 번호 (기존 규칙: 25-DL-01-0001)
  quotationNumber     String                    @unique
  
  // 의뢰기관 정보
  customerId          String?
  customer            Customer?                 @relation(fields: [customerId], references: [id])
  customerName        String                    // 의뢰기관명 (직접입력 가능)
  
  // 의뢰자 정보
  contactPersonId     String?
  contactPerson       ContactPerson?            @relation(fields: [contactPersonId], references: [id])
  contactName         String                    // 의뢰자명
  contactPhone        String?
  contactEmail        String?
  
  // 시험 기준
  testStandard        String                    @default("NON_GLP")  // GLP, NON_GLP
  
  // 검체 정보
  animalSpecies       String                    // 동물 종 (Rat, Mouse, Dog 등)
  sampleTypes         SampleType[]              // 검체 종류 (복수 선택)
  totalSamples        Int                       // 총 검체 수
  maleSamples         Int                       @default(0)  // 수컷
  femaleSamples       Int                       @default(0)  // 암컷
  
  // 검사 항목
  items               ClinicalQuotationItem[]
  
  // 금액 계산
  subtotal            Int                       @default(0)  // 항목 합계
  qcFees              Json?                     // 카테고리별 QC 비용 { "CBC": 400000, ... }
  totalQcFee          Int                       @default(0)  // QC 비용 합계
  
  // 할인
  discountType        String?                   // RATE, AMOUNT
  discountValue       Float?                    // 할인율(%) 또는 할인금액(원)
  discountAmount      Int                       @default(0)  // 계산된 할인금액
  discountReason      String?                   // 할인 사유
  
  // 최종 금액
  totalBeforeVat      Int                       @default(0)  // VAT 전
  vatRate             Float                     @default(10) // 부가세율
  vatAmount           Int                       @default(0)  // 부가세
  totalAmount         Int                       @default(0)  // 최종 금액
  
  // 유효기간
  validDays           Int                       @default(60)
  validUntil          DateTime
  
  // 비고
  notes               String?                   @db.Text
  
  // 상태
  status              ClinicalQuotationStatus   @default(DRAFT)
  
  // 작성자
  createdById         String
  createdBy           User                      @relation(fields: [createdById], references: [id])
  
  // 타임스탬프
  createdAt           DateTime                  @default(now())
  updatedAt           DateTime                  @updatedAt
  sentAt              DateTime?                 // 발송일
  acceptedAt          DateTime?                 // 승인일
  
  // 관계
  testRequest         TestRequest?              // 연결된 시험의뢰서
  
  @@index([quotationNumber])
  @@index([customerId])
  @@index([status])
  @@index([createdById])
  @@index([createdAt])
}

// 임상병리 견적서 항목
model ClinicalQuotationItem {
  id                  String                    @id @default(uuid())
  
  // 소속 견적서
  quotationId         String
  quotation           ClinicalQuotation         @relation(fields: [quotationId], references: [id], onDelete: Cascade)
  
  // 검사 항목 참조
  testItemId          String
  testItem            ClinicalTestItem          @relation(fields: [testItemId], references: [id])
  
  // 항목 정보 (스냅샷)
  category            ClinicalTestCategory
  code                String
  nameKr              String
  nameEn              String
  unit                String?
  method              String?
  isPackage           Boolean                   @default(false)
  
  // 가격
  unitPrice           Int                       // 단가
  quantity            Int                       // 검체 수
  amount              Int                       // 금액 (단가 × 검체수)
  
  // 표시 순서
  displayOrder        Int                       @default(0)
  
  createdAt           DateTime                  @default(now())
  
  @@index([quotationId])
  @@index([category])
}
```

### 1.4 시험의뢰서

```prisma
// 임상병리 시험의뢰서
model TestRequest {
  id                  String                    @id @default(uuid())
  
  // 시험번호 (수탁기관에서 부여)
  testNumber          String?                   @unique
  
  // 연결된 견적서
  quotationId         String                    @unique
  quotation           ClinicalQuotation         @relation(fields: [quotationId], references: [id])
  
  // 의뢰기관 정보 (견적서에서 복사)
  customerName        String
  contactName         String
  contactPhone        String?
  contactEmail        String?
  address             String?
  postalCode          String?
  fax                 String?
  
  // 의뢰 정보
  requestDate         DateTime                  @default(now())  // 의뢰일
  desiredCompletionDate DateTime?               // 희망완료일
  
  // 결과 보고서 유형
  reportType          ReportType                @default(FULL)
  includeStatistics   Boolean                   @default(false)  // 통계 포함 여부
  
  // 검체 정보
  animalSpecies       String
  sampleTypes         SampleType[]
  totalSamples        Int
  maleSamples         Int                       @default(0)
  femaleSamples       Int                       @default(0)
  sampleSendDate      DateTime?                 // 검체 발송 날짜
  
  // 검사 항목
  items               TestRequestItem[]
  
  // 검체 처리
  sampleDisposal      SampleDisposal            @default(DISPOSE)
  returnAddress       String?                   // 반환 시 주소
  
  // 시험 구성 및 내용 (자유 기술)
  testDescription     String?                   @db.Text
  
  // 수탁기관 기재란
  receivedDate        DateTime?                 // 접수일
  testDirectorId      String?                   // 시험책임자
  testDirector        User?                     @relation("TestDirector", fields: [testDirectorId], references: [id])
  receiverId          String?                   // 접수자
  receiver            User?                     @relation("Receiver", fields: [receiverId], references: [id])
  operationManagerId  String?                   // 운영책임자
  operationManager    User?                     @relation("OperationManager", fields: [operationManagerId], references: [id])
  approvalDate        DateTime?                 // 승인일
  
  // 상태
  status              TestRequestStatus         @default(DRAFT)
  
  // 작성자
  createdById         String
  createdBy           User                      @relation("CreatedBy", fields: [createdById], references: [id])
  
  // 타임스탬프
  createdAt           DateTime                  @default(now())
  updatedAt           DateTime                  @updatedAt
  submittedAt         DateTime?                 // 제출일
  completedAt         DateTime?                 // 완료일
  
  @@index([testNumber])
  @@index([quotationId])
  @@index([status])
  @@index([createdAt])
}

// 시험의뢰서 검사항목
model TestRequestItem {
  id                  String                    @id @default(uuid())
  
  // 소속 의뢰서
  requestId           String
  request             TestRequest               @relation(fields: [requestId], references: [id], onDelete: Cascade)
  
  // 검사 항목 참조
  testItemId          String
  testItem            ClinicalTestItem          @relation(fields: [testItemId], references: [id])
  
  // 항목 정보
  category            ClinicalTestCategory
  code                String
  nameKr              String
  nameEn              String
  
  // 선택 여부 (의뢰서에서는 ○ 표시)
  isSelected          Boolean                   @default(true)
  
  // 표시 순서
  displayOrder        Int                       @default(0)
  
  createdAt           DateTime                  @default(now())
  
  @@index([requestId])
}
```

### 1.5 User 모델 관계 추가

```prisma
model User {
  // ... 기존 필드 ...
  
  // 임상병리 관계 추가
  clinicalQuotations       ClinicalQuotation[]
  
  // 시험의뢰서 관계
  testRequestsCreated      TestRequest[]        @relation("CreatedBy")
  testRequestsAsDirector   TestRequest[]        @relation("TestDirector")
  testRequestsAsReceiver   TestRequest[]        @relation("Receiver")
  testRequestsAsManager    TestRequest[]        @relation("OperationManager")
}
```

---

## 스키마 ERD 요약

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    임상병리검사 모듈 ERD                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   [마스터데이터]                                                        │
│   ClinicalTestItem (검사항목)                                           │
│   ClinicalQcSetting (QC 설정)                                          │
│                                                                         │
│   [견적서]                                                              │
│   ClinicalQuotation ─────┬──── ClinicalQuotationItem                   │
│         │                │            │                                │
│         │                │            └─── ClinicalTestItem (참조)     │
│         │                │                                             │
│         │                └──── Customer (선택적)                        │
│         │                └──── ContactPerson (선택적)                   │
│         │                └──── User (작성자)                            │
│         │                                                              │
│         ▼                                                              │
│   [시험의뢰서]                                                          │
│   TestRequest ───────────┬──── TestRequestItem                         │
│                          │            │                                │
│                          │            └─── ClinicalTestItem (참조)     │
│                          │                                             │
│                          └──── User (시험책임자, 접수자, 운영책임자)    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

*다음: API 엔드포인트*
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
# 임상병리검사 모듈 - 마스터데이터 시드

---

## 5. 마스터데이터 초기값

### 5.1 검사항목 시드 데이터

```typescript
// prisma/seed/clinical-pathology-items.ts

import { ClinicalTestCategory, SampleType } from '@prisma/client';

export const clinicalTestItems = [
  // ==================== CBC (일반혈액학) - 패키지 ====================
  {
    category: 'CBC',
    code: 'CBC',
    nameKr: 'CBC (일반혈액학)',
    nameEn: 'Complete Blood Count',
    unit: null,
    method: 'Flowcytometry',
    unitPrice: 50000,
    isPackage: true,
    packageItems: ['WBC', 'RBC', 'HGB', 'HCT', 'MCV', 'MCH', 'MCHC', 'RDW', 'HDW', 'PLT', 'MPV'],
    requiredSampleTypes: ['WHOLE_BLOOD'],
    minSampleVolume: 200,
    requiresItem: null,
    displayOrder: 1,
  },
  
  // ==================== DIFF (백혈구감별) - 패키지 ====================
  {
    category: 'DIFF',
    code: 'DIFF',
    nameKr: 'DIFF (백혈구감별계수)',
    nameEn: 'WBC Differential Count',
    unit: null,
    method: 'Flowcytometry, Peroxidase staining',
    unitPrice: 50000,
    isPackage: true,
    packageItems: ['NEU', 'LYM', 'MONO', 'EOS', 'BASO', 'LUC'],
    requiredSampleTypes: ['WHOLE_BLOOD'],
    minSampleVolume: 200,
    requiresItem: 'CBC',  // CBC 필수
    displayOrder: 2,
  },
  
  // ==================== RETIC (망상적혈구) ====================
  {
    category: 'RETIC',
    code: 'RETIC',
    nameKr: 'RETIC (망상적혈구)',
    nameEn: 'Reticulocyte',
    unit: '%',
    method: 'Flowcytometry, Isovolumetry',
    unitPrice: 30000,
    isPackage: false,
    packageItems: [],
    requiredSampleTypes: ['WHOLE_BLOOD'],
    minSampleVolume: 200,
    requiresItem: null,
    displayOrder: 3,
  },
  
  // ==================== 혈액생화학 - 일반 (10,000원/항목) ====================
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'AST',
    nameKr: 'AST',
    nameEn: 'Aspartate aminotransferase',
    unit: 'U/L',
    method: 'Kinetic UV법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 10,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'ALT',
    nameKr: 'ALT',
    nameEn: 'Alanine aminotransferase',
    unit: 'U/L',
    method: 'Kinetic UV법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 11,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'ALP',
    nameKr: 'ALP',
    nameEn: 'Alkaline phosphatase',
    unit: 'U/L',
    method: 'Kinetic colour법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 12,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'BUN',
    nameKr: 'BUN',
    nameEn: 'Blood urea nitrogen',
    unit: 'mg/dL',
    method: 'Urease-UV법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 13,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'CRE',
    nameKr: 'CRE',
    nameEn: 'Creatinine',
    unit: 'mg/dL',
    method: 'Jaffe법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 14,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'GLU',
    nameKr: 'GLU',
    nameEn: 'Glucose',
    unit: 'mg/dL',
    method: 'Enzymatic UV법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 15,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'TCHO',
    nameKr: 'TCHO',
    nameEn: 'Total cholesterol',
    unit: 'mg/dL',
    method: 'Kinetic colour법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 16,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'TPRO',
    nameKr: 'TPRO',
    nameEn: 'Total protein',
    unit: 'g/L',
    method: 'Biuret법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 17,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'CPK',
    nameKr: 'CPK',
    nameEn: 'Creatine phosphokinase',
    unit: 'U/L',
    method: 'Kinetic UV법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 18,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'ALB',
    nameKr: 'ALB',
    nameEn: 'Albumin',
    unit: 'g/dL',
    method: 'BCG 법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 19,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'TBIL',
    nameKr: 'TBIL',
    nameEn: 'Total bilirubin',
    unit: 'mg/dL',
    method: 'Photometric colour법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 20,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'TG',
    nameKr: 'TG',
    nameEn: 'Triglyceride',
    unit: 'mg/dL',
    method: 'Enzyme colour법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 21,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'IP',
    nameKr: 'IP',
    nameEn: 'Inorganic phosphorus',
    unit: 'mg/dL',
    method: 'Photometric UV법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 22,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'CA',
    nameKr: 'Ca',
    nameEn: 'Calcium',
    unit: 'mg/dL',
    method: 'O-CPC 법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 23,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'AG_RATIO',
    nameKr: 'A/G ratio',
    nameEn: 'Albumin/Globulin ratio',
    unit: 'ratio',
    method: 'PRO, ALB로 산출',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 24,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'LDH',
    nameKr: 'LDH',
    nameEn: 'Lactate dehydrogenase',
    unit: 'U/L',
    method: 'Kinetic UV법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 25,
  },
  
  // ==================== 전해질 - 패키지 (30,000원) ====================
  {
    category: 'ELECTROLYTE',
    code: 'ELECTROLYTE',
    nameKr: '전해질 (Na⁺/K⁺/Cl⁻)',
    nameEn: 'Electrolytes (Sodium/Potassium/Chloride)',
    unit: 'mmol/L',
    method: '이온 선택 전극법',
    unitPrice: 30000,
    isPackage: true,
    packageItems: ['NA', 'K', 'CL'],
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 30,
  },
  
  // ==================== 혈액생화학 - 추가 (20,000원/항목) ====================
  {
    category: 'CHEMISTRY_ADDITIONAL',
    code: 'LDL',
    nameKr: 'LDL',
    nameEn: 'Low density lipoprotein cholesterol',
    unit: 'mg/dL',
    method: 'Enzymatic colour법',
    unitPrice: 20000,
    isPackage: false,
    requiredSampleTypes: ['SERUM'],
    minSampleVolume: 300,
    displayOrder: 40,
  },
  {
    category: 'CHEMISTRY_ADDITIONAL',
    code: 'HDL',
    nameKr: 'HDL',
    nameEn: 'High density lipoprotein cholesterol',
    unit: 'mg/dL',
    method: 'Enzymatic colour법',
    unitPrice: 20000,
    isPackage: false,
    requiredSampleTypes: ['SERUM'],
    minSampleVolume: 300,
    displayOrder: 41,
  },
  {
    category: 'CHEMISTRY_ADDITIONAL',
    code: 'GGT',
    nameKr: 'γ-GTP',
    nameEn: 'Gamma Glutamyl transpeptidase',
    unit: 'U/L',
    method: 'Kinetic colour법',
    unitPrice: 20000,
    isPackage: false,
    requiredSampleTypes: ['SERUM'],
    minSampleVolume: 300,
    displayOrder: 42,
  },
  
  // ==================== 혈액생화학 - 추가 (30,000원/항목) ====================
  {
    category: 'CHEMISTRY_ADDITIONAL',
    code: 'CRP',
    nameKr: 'CRP',
    nameEn: 'C-reactive protein',
    unit: 'mg/L',
    method: 'Immunoturbidimetric',
    unitPrice: 30000,
    isPackage: false,
    requiredSampleTypes: ['SERUM'],
    minSampleVolume: 300,
    displayOrder: 50,
  },
  {
    category: 'CHEMISTRY_ADDITIONAL',
    code: 'UA',
    nameKr: 'UA',
    nameEn: 'Uric acid',
    unit: 'mg/dL',
    method: 'Enzymatic colour법',
    unitPrice: 30000,
    isPackage: false,
    requiredSampleTypes: ['SERUM'],
    minSampleVolume: 300,
    displayOrder: 51,
  },
  {
    category: 'CHEMISTRY_ADDITIONAL',
    code: 'MA',
    nameKr: 'MA',
    nameEn: 'Magnesium',
    unit: 'mg/dL',
    method: 'Xylidyl blue법',
    unitPrice: 30000,
    isPackage: false,
    requiredSampleTypes: ['SERUM'],
    minSampleVolume: 300,
    displayOrder: 52,
  },
  {
    category: 'CHEMISTRY_ADDITIONAL',
    code: 'BICABO',
    nameKr: 'BICABO',
    nameEn: 'Bicarbonate',
    unit: 'mmol/L',
    method: 'Enzymatic법',
    unitPrice: 30000,
    isPackage: false,
    requiredSampleTypes: ['SERUM'],
    minSampleVolume: 300,
    displayOrder: 53,
  },
  {
    category: 'CHEMISTRY_ADDITIONAL',
    code: 'CRP_L',
    nameKr: 'CRP-L',
    nameEn: 'C-reactive protein - Latex',
    unit: 'mg/L',
    method: 'Latex immunoturbidimetric',
    unitPrice: 30000,
    isPackage: false,
    requiredSampleTypes: ['SERUM'],
    minSampleVolume: 300,
    displayOrder: 54,
  },
  {
    category: 'CHEMISTRY_ADDITIONAL',
    code: 'MICRO_ALB',
    nameKr: 'micro-ALB',
    nameEn: 'Micro Albumin',
    unit: 'mg/L',
    method: 'Immunoturbidimetric',
    unitPrice: 30000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'URINE'],
    minSampleVolume: 300,
    displayOrder: 55,
  },
  {
    category: 'CHEMISTRY_ADDITIONAL',
    code: 'HBA1C',
    nameKr: 'HbA1c',
    nameEn: 'Hemoglobin A1c',
    unit: '%',
    method: 'HPLC',
    unitPrice: 30000,
    isPackage: false,
    requiredSampleTypes: ['WHOLE_BLOOD'],
    minSampleVolume: 200,
    displayOrder: 56,
  },
  
  // ==================== 혈액응고검사 (10,000원/항목) ====================
  {
    category: 'COAGULATION',
    code: 'PT',
    nameKr: 'PT',
    nameEn: 'Prothrombin Time',
    unit: 'sec',
    method: 'Clotting법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['PLASMA'],
    minSampleVolume: 300,
    displayOrder: 60,
  },
  {
    category: 'COAGULATION',
    code: 'APTT',
    nameKr: 'APTT',
    nameEn: 'Activated Partial Thromboplastin Time',
    unit: 'sec',
    method: 'Clotting법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['PLASMA'],
    minSampleVolume: 300,
    displayOrder: 61,
  },
  {
    category: 'COAGULATION',
    code: 'FIB',
    nameKr: 'FIB',
    nameEn: 'Fibrinogen',
    unit: 'mg/dL',
    method: 'Clauss법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['PLASMA'],
    minSampleVolume: 300,
    displayOrder: 62,
  },
  
  // ==================== 요검사 ====================
  {
    category: 'URINALYSIS',
    code: 'UA_GENERAL',
    nameKr: '요 일반검사',
    nameEn: 'Urinalysis - General',
    unit: null,
    method: 'Dipstick, Microscopy',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['URINE'],
    minSampleVolume: 500,
    displayOrder: 70,
  },
  {
    category: 'URINALYSIS',
    code: 'UA_SEDIMENT',
    nameKr: '요침사검사',
    nameEn: 'Urine Sediment',
    unit: null,
    method: 'Microscopy',
    unitPrice: 20000,
    isPackage: false,
    requiredSampleTypes: ['URINE'],
    minSampleVolume: 500,
    displayOrder: 71,
  },
  
  // ==================== 요 생화학 (30,000원/항목) ====================
  {
    category: 'URINE_CHEMISTRY',
    code: 'U_UA',
    nameKr: 'U-UA',
    nameEn: 'Urine Uric acid',
    unit: 'mg/dL',
    method: 'Enzymatic colour법',
    unitPrice: 30000,
    isPackage: false,
    requiredSampleTypes: ['URINE'],
    minSampleVolume: 300,
    displayOrder: 80,
  },
  {
    category: 'URINE_CHEMISTRY',
    code: 'U_MA',
    nameKr: 'U-MA',
    nameEn: 'Urine Magnesium',
    unit: 'mg/dL',
    method: 'Xylidyl blue법',
    unitPrice: 30000,
    isPackage: false,
    requiredSampleTypes: ['URINE'],
    minSampleVolume: 300,
    displayOrder: 81,
  },
  {
    category: 'URINE_CHEMISTRY',
    code: 'U_BUN',
    nameKr: 'U-BUN',
    nameEn: 'Urine Blood urea nitrogen',
    unit: 'mg/dL',
    method: 'Urease-UV법',
    unitPrice: 30000,
    isPackage: false,
    requiredSampleTypes: ['URINE'],
    minSampleVolume: 300,
    displayOrder: 82,
  },
  {
    category: 'URINE_CHEMISTRY',
    code: 'U_CRE',
    nameKr: 'U-CRE',
    nameEn: 'Urine Creatinine',
    unit: 'mg/dL',
    method: 'Jaffe법',
    unitPrice: 30000,
    isPackage: false,
    requiredSampleTypes: ['URINE'],
    minSampleVolume: 300,
    displayOrder: 83,
  },
  {
    category: 'URINE_CHEMISTRY',
    code: 'U_TP',
    nameKr: 'U-TP',
    nameEn: 'Urine Total protein',
    unit: 'mg/dL',
    method: 'Pyrogallol red법',
    unitPrice: 30000,
    isPackage: false,
    requiredSampleTypes: ['URINE'],
    minSampleVolume: 300,
    displayOrder: 84,
  },
  {
    category: 'URINE_CHEMISTRY',
    code: 'U_CA',
    nameKr: 'U-Ca',
    nameEn: 'Urine Calcium',
    unit: 'mg/dL',
    method: 'O-CPC 법',
    unitPrice: 30000,
    isPackage: false,
    requiredSampleTypes: ['URINE'],
    minSampleVolume: 300,
    displayOrder: 85,
  },
];
```

### 5.2 QC 설정 시드 데이터

```typescript
// prisma/seed/clinical-qc-settings.ts

export const clinicalQcSettings = [
  {
    category: 'CBC',
    thresholdCount: 100,
    qcFee: 400000,
  },
  {
    category: 'DIFF',
    thresholdCount: 100,
    qcFee: 400000,
  },
  {
    category: 'RETIC',
    thresholdCount: 100,
    qcFee: 400000,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    thresholdCount: 100,
    qcFee: 400000,
  },
  {
    category: 'ELECTROLYTE',
    thresholdCount: 100,
    qcFee: 400000,
  },
  {
    category: 'CHEMISTRY_ADDITIONAL',
    thresholdCount: 100,
    qcFee: 400000,
  },
  {
    category: 'COAGULATION',
    thresholdCount: 100,
    qcFee: 400000,
  },
  {
    category: 'URINALYSIS',
    thresholdCount: 100,
    qcFee: 400000,
  },
  {
    category: 'URINE_CHEMISTRY',
    thresholdCount: 100,
    qcFee: 400000,
  },
];
```

### 5.3 동물 종 옵션

```typescript
// constants/animal-species.ts

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
```

---

## 6. 카테고리별 가격 요약

| 카테고리 | 항목 수 | 가격 구조 | 단가(원) |
|----------|--------|----------|----------|
| CBC | 1 (11항목 패키지) | 패키지 | 50,000 |
| DIFF | 1 (6항목 패키지) | 패키지 | 50,000 |
| RETIC | 1 | 개별 | 30,000 |
| 일반 생화학 | 16 | 개별 | 10,000 |
| 전해질 | 1 (3항목 패키지) | 패키지 | 30,000 |
| 추가 생화학 (LDL, HDL, γ-GTP) | 3 | 개별 | 20,000 |
| 추가 생화학 (CRP, UA 등) | 7 | 개별 | 30,000 |
| 혈액응고검사 | 3 | 개별 | 10,000 |
| 요검사 - 일반 | 1 | 개별 | 10,000 |
| 요검사 - 요침사 | 1 | 개별 | 20,000 |
| 요 생화학 | 6 | 개별 | 30,000 |

**총 검사항목 수**: 40개

---

## 7. 구현 우선순위

### Phase 1: 기본 기능 (1주)
- [ ] 스키마 적용 (마이그레이션)
- [ ] 마스터데이터 시드
- [ ] 견적서 CRUD API
- [ ] 견적서 작성 UI

### Phase 2: 핵심 기능 (1주)
- [ ] 금액 자동 계산
- [ ] 검체-검사항목 연결 로직
- [ ] DIFF-CBC 의존성 체크
- [ ] QC 비용 자동 계산
- [ ] 할인 설정

### Phase 3: PDF & 연동 (1주)
- [ ] 견적서 PDF 생성 (기존 양식)
- [ ] 시험의뢰서 CRUD
- [ ] 견적서 → 시험의뢰서 전환
- [ ] 시험의뢰서 PDF 생성

### Phase 4: 관리 기능 (3일)
- [ ] 마스터데이터 관리 UI
- [ ] 검사항목 추가/수정/삭제
- [ ] QC 설정 관리
- [ ] 가격 일괄 수정

---

*문서 끝*
