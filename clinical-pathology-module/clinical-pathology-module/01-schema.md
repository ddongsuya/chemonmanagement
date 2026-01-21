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
