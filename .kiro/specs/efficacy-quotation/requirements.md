# Requirements Document

## Introduction

효력시험 견적 모듈은 CHEMON의 효력시험(Efficacy Study) 서비스에 대한 견적서를 생성하는 시스템입니다. 기존 독성시험 견적 시스템과 달리, 효력시험은 질환 모델을 선택하고 해당 모델에서 사용 가능한 항목들을 조합하여 견적을 산출하는 방식입니다.

22개의 질환 모델(피부, 항암, 대사, 신경, 근골격 등)과 182개의 단가 항목을 기반으로, 사용자가 모델을 선택하면 기본 항목이 자동 로드되고 옵션 항목을 추가 선택하여 견적을 완성합니다.

## Glossary

- **Efficacy_Quotation_System**: 효력시험 견적 생성 및 관리 시스템
- **Model**: 질환 모델 (예: 당뇨, 관절염, 고형암 등 22개)
- **Price_Master**: 모든 단가 항목의 마스터 데이터 (182개 항목)
- **Model_Item_Pool**: 각 모델에서 사용 가능한 항목 목록
- **Default_Item**: 모델 선택 시 자동으로 포함되는 기본 항목 (is_default = Y)
- **Optional_Item**: 사용자가 선택적으로 추가할 수 있는 옵션 항목 (is_default = N)
- **Quantity**: 항목의 수량 (예: 동물 수)
- **Multiplier**: 항목의 횟수 (예: 측정 횟수, 사육 일수)
- **Item_Amount**: 항목별 금액 = unit_price × quantity × multiplier
- **User**: 견적서를 작성하는 CHEMON 직원

## Requirements

### Requirement 1: 효력시험 모델 선택

**User Story:** As a User, I want to select an efficacy test model from a categorized list, so that I can start creating a quotation based on the appropriate disease model.

#### Acceptance Criteria

1. WHEN a User accesses the efficacy quotation creation page, THE Efficacy_Quotation_System SHALL display all active Models grouped by category (피부, 항암, 대사, 신경, 근골격 등).
2. WHEN a User selects a Model, THE Efficacy_Quotation_System SHALL load all Default_Items for that Model with their typical_qty and typical_mult values pre-filled.
3. WHEN a User selects a Model, THE Efficacy_Quotation_System SHALL display the Model's indication and description for reference.
4. WHEN a User changes the selected Model, THE Efficacy_Quotation_System SHALL clear the current item selection and load the new Model's Default_Items.

### Requirement 2: 기본 항목 관리

**User Story:** As a User, I want to see and manage default items automatically loaded for the selected model, so that I can adjust quantities and remove unnecessary items.

#### Acceptance Criteria

1. WHEN Default_Items are loaded, THE Efficacy_Quotation_System SHALL display each item with item_name, unit_price, unit, quantity, multiplier, and calculated Item_Amount.
2. WHEN a User modifies the quantity or multiplier of a Default_Item, THE Efficacy_Quotation_System SHALL recalculate the Item_Amount immediately.
3. WHEN a User removes a Default_Item from the quotation, THE Efficacy_Quotation_System SHALL exclude that item from the total calculation.
4. WHEN displaying Default_Items, THE Efficacy_Quotation_System SHALL visually distinguish them from Optional_Items (예: 연녹색 배경).

### Requirement 3: 옵션 항목 추가

**User Story:** As a User, I want to browse and add optional items available for the selected model, so that I can customize the quotation based on specific study requirements.

#### Acceptance Criteria

1. WHEN a User views the optional items panel, THE Efficacy_Quotation_System SHALL display all Optional_Items for the selected Model with their usage_note.
2. WHEN a User adds an Optional_Item, THE Efficacy_Quotation_System SHALL add it to the quotation with typical_qty and typical_mult as default values.
3. WHEN a User searches for an optional item by name, THE Efficacy_Quotation_System SHALL filter the Optional_Items list to show matching results.
4. WHEN an Optional_Item is added to the quotation, THE Efficacy_Quotation_System SHALL allow the User to modify its quantity and multiplier.

### Requirement 4: 견적 금액 계산

**User Story:** As a User, I want the system to automatically calculate the total quotation amount, so that I can provide accurate pricing to customers.

#### Acceptance Criteria

1. WHEN items are added or modified, THE Efficacy_Quotation_System SHALL calculate each Item_Amount as unit_price × quantity × multiplier.
2. WHEN the quotation contains items, THE Efficacy_Quotation_System SHALL display a subtotal grouped by category (동물비, 사육비, 측정, 조직병리 등).
3. WHEN displaying the total, THE Efficacy_Quotation_System SHALL show subtotal, VAT (10%), and grand total separately.
4. WHEN any item's quantity, multiplier, or selection changes, THE Efficacy_Quotation_System SHALL update all calculations within 100 milliseconds.

### Requirement 5: 견적서 저장 및 관리

**User Story:** As a User, I want to save and manage efficacy quotations, so that I can retrieve and modify them later.

#### Acceptance Criteria

1. WHEN a User saves a quotation, THE Efficacy_Quotation_System SHALL generate a unique quotation number with format "EQ-YYYY-NNNN".
2. WHEN a User saves a quotation, THE Efficacy_Quotation_System SHALL store the selected Model, all items with quantities/multipliers, customer information, and calculated amounts.
3. WHEN a User views the quotation list, THE Efficacy_Quotation_System SHALL display efficacy quotations separately from toxicity quotations with a filter option.
4. WHEN a User opens a saved quotation, THE Efficacy_Quotation_System SHALL restore all selections and allow modifications.

### Requirement 6: 견적서 미리보기 및 출력

**User Story:** As a User, I want to preview and export the quotation, so that I can share it with customers in a professional format.

#### Acceptance Criteria

1. WHEN a User requests a preview, THE Efficacy_Quotation_System SHALL display the quotation in a print-ready format with company header, model information, itemized list, and totals.
2. WHEN a User exports the quotation, THE Efficacy_Quotation_System SHALL generate a PDF file with all quotation details.
3. WHEN displaying the preview, THE Efficacy_Quotation_System SHALL group items by category for better readability.
4. WHEN the quotation includes remarks or usage_notes, THE Efficacy_Quotation_System SHALL display them in a notes section.

### Requirement 7: 마스터 데이터 관리

**User Story:** As a User, I want to manage the efficacy master data, so that I can add new items or models and update prices.

#### Acceptance Criteria

1. WHEN a User accesses the efficacy settings page, THE Efficacy_Quotation_System SHALL display the Price_Master with options to add, edit, or deactivate items.
2. WHEN a User adds a new item to Price_Master, THE Efficacy_Quotation_System SHALL require item_id, category, item_name, unit_price, and unit fields.
3. WHEN a User modifies a Model's item pool, THE Efficacy_Quotation_System SHALL allow adding or removing items and setting is_default status.
4. WHEN master data is modified, THE Efficacy_Quotation_System SHALL persist changes to localStorage immediately.

### Requirement 8: 고객 정보 및 기본 정보 입력

**User Story:** As a User, I want to enter customer and project information before creating a quotation, so that the quotation includes proper identification and context.

#### Acceptance Criteria

1. WHEN a User starts a new efficacy quotation, THE Efficacy_Quotation_System SHALL require customer selection or new customer registration.
2. WHEN a User enters basic information, THE Efficacy_Quotation_System SHALL capture project name, validity period, and optional notes.
3. WHEN a User selects validity period, THE Efficacy_Quotation_System SHALL calculate and display the expiration date.
4. WHEN required fields are missing, THE Efficacy_Quotation_System SHALL display validation errors and prevent progression.

### Requirement 9: 견적서 복사 및 수정

**User Story:** As a User, I want to copy an existing quotation and modify it, so that I can quickly create similar quotations without starting from scratch.

#### Acceptance Criteria

1. WHEN a User copies an efficacy quotation, THE Efficacy_Quotation_System SHALL create a new quotation with all items, quantities, and multipliers duplicated.
2. WHEN a User copies a quotation, THE Efficacy_Quotation_System SHALL generate a new quotation number and reset the creation date.
3. WHEN a User edits a saved quotation, THE Efficacy_Quotation_System SHALL allow modification of all fields including model selection and items.
4. WHEN a User deletes a quotation, THE Efficacy_Quotation_System SHALL request confirmation before permanent removal.

### Requirement 10: 계약서 및 상담기록지 연동

**User Story:** As a User, I want to generate contracts and consultation records from efficacy quotations, so that I can streamline the documentation workflow.

#### Acceptance Criteria

1. WHEN a User requests contract generation from an efficacy quotation, THE Efficacy_Quotation_System SHALL pre-fill contract form with quotation data.
2. WHEN a User requests consultation record generation, THE Efficacy_Quotation_System SHALL categorize items appropriately for efficacy tests.
3. WHEN generating documents, THE Efficacy_Quotation_System SHALL include model name and indication in the output.
4. WHEN an efficacy quotation is linked to a contract, THE Efficacy_Quotation_System SHALL display the relationship in both quotation and contract views.

### Requirement 11: 독성시험/효력시험 통합 네비게이션

**User Story:** As a User, I want to easily switch between toxicity and efficacy quotation systems, so that I can work efficiently across different test types.

#### Acceptance Criteria

1. WHEN a User accesses the quotation menu, THE Efficacy_Quotation_System SHALL display separate options for toxicity and efficacy quotations.
2. WHEN viewing the quotation list, THE Efficacy_Quotation_System SHALL allow filtering by quotation type (toxicity/efficacy).
3. WHEN displaying dashboard statistics, THE Efficacy_Quotation_System SHALL show separate counts and amounts for toxicity and efficacy quotations.
4. WHEN a User creates a new quotation, THE Efficacy_Quotation_System SHALL allow selection of quotation type at the beginning.
