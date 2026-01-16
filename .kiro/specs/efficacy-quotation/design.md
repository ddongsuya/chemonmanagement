# Design Document: 효력시험 견적 모듈

## Overview

효력시험 견적 모듈은 기존 독성시험 견적 시스템과 병행하여 운영되는 새로운 견적 생성 시스템입니다. 질환 모델 기반의 항목 선택 방식을 채택하여, 사용자가 모델을 선택하면 해당 모델에 적합한 기본 항목이 자동 로드되고, 옵션 항목을 추가하여 맞춤형 견적을 생성합니다.

### Key Differences from Toxicity Quotation

| 구분        | 독성시험 견적         | 효력시험 견적                    |
| ----------- | --------------------- | -------------------------------- |
| 선택 방식   | 모달리티 → 시험 선택  | 모델 → 항목 조합                 |
| 가격 구조   | 시험별 고정 가격      | 항목별 단가 × 수량 × 횟수        |
| 데이터 구조 | test_name, unit_price | item_name, unit_price, qty, mult |
| 번호 형식   | QT-YYYY-NNNN          | EQ-YYYY-NNNN                     |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                      │
├─────────────────────────────────────────────────────────────┤
│  EfficacyQuotationWizard                                    │
│  ├── StepBasicInfo (공통 컴포넌트 재사용)                    │
│  ├── StepModelSelection (모델 선택)                         │
│  ├── StepItemConfiguration (항목 구성)                      │
│  ├── StepCalculation (금액 계산)                            │
│  └── StepPreview (미리보기/출력)                            │
├─────────────────────────────────────────────────────────────┤
│                       State Management                       │
├─────────────────────────────────────────────────────────────┤
│  efficacyQuotationStore (Zustand)                           │
│  ├── selectedModel                                          │
│  ├── selectedItems[]                                        │
│  ├── customerInfo                                           │
│  └── calculations                                           │
├─────────────────────────────────────────────────────────────┤
│                        Data Layer                            │
├─────────────────────────────────────────────────────────────┤
│  efficacy-storage.ts                                        │
│  ├── getEfficacyQuotations()                                │
│  ├── saveEfficacyQuotation()                                │
│  ├── getEfficacyMasterData()                                │
│  └── updateEfficacyMasterData()                             │
├─────────────────────────────────────────────────────────────┤
│                     Master Data (JSON)                       │
├─────────────────────────────────────────────────────────────┤
│  efficacy_master_data.json                                  │
│  ├── price_master[] (182 items)                             │
│  ├── models[] (22 models)                                   │
│  └── model_items[] (202 mappings)                           │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Page Components

```typescript
// app/(dashboard)/efficacy-quotations/new/page.tsx
// 효력시험 견적 생성 페이지 - 5단계 위자드

// app/(dashboard)/efficacy-quotations/page.tsx
// 효력시험 견적 목록 페이지

// app/(dashboard)/efficacy-quotations/[id]/page.tsx
// 효력시험 견적 상세 페이지

// app/(dashboard)/settings/efficacy/page.tsx
// 효력시험 마스터 데이터 관리 페이지
```

### 2. Wizard Components

```typescript
// components/efficacy-quotation/EfficacyQuotationWizard.tsx
interface EfficacyWizardProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

// 5단계: 기본정보 → 모델선택 → 항목구성 → 계산 → 미리보기
```

### 3. Step Components

```typescript
// components/efficacy-quotation/StepModelSelection.tsx
interface StepModelSelectionProps {
  models: EfficacyModel[];
  selectedModelId: string | null;
  onModelSelect: (modelId: string) => void;
}

// components/efficacy-quotation/StepItemConfiguration.tsx
interface StepItemConfigurationProps {
  modelId: string;
  defaultItems: ModelItem[];
  optionalItems: ModelItem[];
  selectedItems: SelectedItem[];
  onItemAdd: (item: ModelItem) => void;
  onItemRemove: (itemId: string) => void;
  onItemUpdate: (itemId: string, qty: number, mult: number) => void;
}

// components/efficacy-quotation/ItemCard.tsx
interface ItemCardProps {
  item: SelectedItem;
  priceInfo: PriceItem;
  isDefault: boolean;
  onUpdate: (qty: number, mult: number) => void;
  onRemove: () => void;
}
```

### 4. Store Interface

```typescript
// stores/efficacyQuotationStore.ts
interface EfficacyQuotationState {
  // Step 1: Basic Info
  customerId: string;
  customerName: string;
  projectName: string;
  validDays: number;
  notes: string;

  // Step 2: Model Selection
  selectedModelId: string | null;
  selectedModel: EfficacyModel | null;

  // Step 3: Item Configuration
  selectedItems: SelectedEfficacyItem[];

  // Calculations
  subtotalByCategory: Record<string, number>;
  subtotal: number;
  vat: number;
  grandTotal: number;

  // Navigation
  currentStep: number;

  // Actions
  setCustomer: (id: string, name: string) => void;
  setModel: (modelId: string) => void;
  addItem: (item: ModelItem) => void;
  removeItem: (itemId: string) => void;
  updateItem: (itemId: string, qty: number, mult: number) => void;
  calculateTotals: () => void;
  reset: () => void;
  nextStep: () => void;
  prevStep: () => void;
}
```

## Data Models

### 1. Master Data Types

```typescript
// types/efficacy.ts

interface PriceItem {
  item_id: string; // "ANI-001"
  category: string; // "동물비"
  subcategory: string; // "설치류"
  item_name: string; // "SD랫드"
  item_detail: string; // "7주령"
  unit_price: number; // 22000
  unit: string; // "/head"
  remarks: string;
  is_active: boolean;
}

interface EfficacyModel {
  model_id: string; // "EFF-001"
  model_name: string; // "모발형성"
  category: string; // "피부"
  indication: string; // "탈모, 발모촉진"
  description: string; // "누드마우스 피내투여 후..."
  is_active: boolean;
}

interface ModelItem {
  model_id: string; // "EFF-001"
  model_name: string; // "모발형성"
  item_id: string; // "ANI-007"
  item_name: string; // "누드마우스"
  is_default: boolean; // true
  typical_qty: number; // 70
  typical_mult: number; // 1
  usage_note: string; // "기본 동물"
}

interface EfficacyMasterData {
  price_master: PriceItem[];
  models: EfficacyModel[];
  model_items: ModelItem[];
}
```

### 2. Quotation Data Types

```typescript
interface SelectedEfficacyItem {
  id: string; // unique id for this selection
  item_id: string; // reference to price_master
  item_name: string;
  category: string;
  unit_price: number;
  unit: string;
  quantity: number;
  multiplier: number;
  amount: number; // unit_price * quantity * multiplier
  is_default: boolean;
  usage_note: string;
}

interface SavedEfficacyQuotation {
  id: string;
  quotation_number: string; // "EQ-2024-0001"
  quotation_type: "efficacy";

  // Customer Info
  customer_id: string;
  customer_name: string;
  project_name: string;

  // Model Info
  model_id: string;
  model_name: string;
  model_category: string;
  indication: string;

  // Items
  items: SelectedEfficacyItem[];

  // Calculations
  subtotal_by_category: Record<string, number>;
  subtotal: number;
  vat: number;
  grand_total: number;

  // Metadata
  valid_days: number;
  valid_until: string;
  notes: string;
  status: "draft" | "sent" | "accepted" | "rejected";
  created_at: string;
  updated_at: string;
}
```

### 3. Storage Keys

```typescript
const STORAGE_KEYS = {
  EFFICACY_QUOTATIONS: "chemon_efficacy_quotations",
  EFFICACY_MASTER_DATA: "chemon_efficacy_master_data",
  EFFICACY_QUOTATION_COUNTER: "chemon_efficacy_quotation_counter",
};
```

## Error Handling

### Validation Errors

| Error Code | Condition             | User Message                          |
| ---------- | --------------------- | ------------------------------------- |
| E001       | Customer not selected | "고객사를 선택해주세요"               |
| E002       | Project name empty    | "프로젝트명을 입력해주세요"           |
| E003       | Model not selected    | "효력시험 모델을 선택해주세요"        |
| E004       | No items selected     | "최소 1개 이상의 항목을 선택해주세요" |
| E005       | Invalid quantity      | "수량은 1 이상이어야 합니다"          |
| E006       | Invalid multiplier    | "횟수는 1 이상이어야 합니다"          |

### Data Errors

| Error Code | Condition              | Recovery                             |
| ---------- | ---------------------- | ------------------------------------ |
| D001       | Master data not found  | Load from default JSON               |
| D002       | Quotation not found    | Show error message, redirect to list |
| D003       | Storage quota exceeded | Alert user, suggest cleanup          |

## Testing Strategy

### Unit Testing

- Jest + React Testing Library
- Test store actions and calculations
- Test component rendering and interactions

### Property-Based Testing

- fast-check library for property-based tests
- Test calculation invariants
- Test data transformation consistency

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Item Amount Calculation Invariant

_For any_ selected item with unit_price, quantity, and multiplier, the calculated amount SHALL equal unit_price × quantity × multiplier exactly.
**Validates: Requirements 2.2, 4.1**

### Property 2: Category Subtotal Consistency

_For any_ quotation with items, the sum of all category subtotals SHALL equal the overall subtotal.
**Validates: Requirements 4.2**

### Property 3: VAT and Grand Total Calculation

_For any_ subtotal value, VAT SHALL equal subtotal × 0.1 (rounded down), and grand_total SHALL equal subtotal + VAT.
**Validates: Requirements 4.3**

### Property 4: Model Selection Loads Correct Defaults

_For any_ model selection, all items with is_default=true for that model SHALL be loaded into selectedItems with their typical_qty and typical_mult values.
**Validates: Requirements 1.2, 3.2**

### Property 5: Model Change Clears Previous Selection

_For any_ model change from model A to model B, all items from model A SHALL be removed and replaced with model B's default items.
**Validates: Requirements 1.4**

### Property 6: Item Removal Decreases Total

_For any_ item removal, the new subtotal SHALL equal the previous subtotal minus the removed item's amount.
**Validates: Requirements 2.3**

### Property 7: Optional Items Filter by Model

_For any_ model, the optional items list SHALL contain only items where model_id matches and is_default=false.
**Validates: Requirements 3.1**

### Property 8: Search Filter Returns Matching Items

_For any_ search query string, all returned items SHALL contain the query string in their item_name (case-insensitive).
**Validates: Requirements 3.3**

### Property 9: Quotation Number Format

_For any_ saved efficacy quotation, the quotation_number SHALL match the pattern "EQ-YYYY-NNNN" where YYYY is a 4-digit year and NNNN is a 4-digit sequence.
**Validates: Requirements 5.1**

### Property 10: Quotation Save/Load Round Trip

_For any_ saved quotation, loading it back SHALL restore all fields (model, items, quantities, multipliers, customer info, calculations) to their original values.
**Validates: Requirements 5.2, 5.4**

### Property 11: Quotation Type Filter

_For any_ quotation list filtered by type='efficacy', all returned quotations SHALL have quotation_type='efficacy'.
**Validates: Requirements 5.3**

### Property 12: Copy Preserves Items But Changes Identity

_For any_ quotation copy operation, the new quotation SHALL have identical items (same item_id, quantity, multiplier) but different id and quotation_number.
**Validates: Requirements 9.1, 9.2**

### Property 13: Active Models Only Display

_For any_ model list display, only models with is_active=true SHALL be included.
**Validates: Requirements 1.1**

### Property 14: Required Field Validation

_For any_ quotation save attempt, if customer_id is empty OR project_name is empty OR model_id is null OR items array is empty, the save SHALL be rejected with appropriate error.
**Validates: Requirements 8.4, E001-E004**
