# Implementation Plan

## Phase 1: Foundation

- [ ] 1. Set up types and data layer

  - [x] 1.1 Create efficacy type definitions

    - Create `types/efficacy.ts` with PriceItem, EfficacyModel, ModelItem, SelectedEfficacyItem, SavedEfficacyQuotation interfaces
    - _Requirements: 1.1, 2.1, 5.2_

  - [x] 1.2 Create efficacy storage utilities

    - Create `lib/efficacy-storage.ts` with CRUD functions for quotations and master data
    - Implement localStorage persistence with keys: chemon_efficacy_quotations, chemon_efficacy_master_data
    - _Requirements: 5.1, 5.2, 7.4_

  - [x] 1.3 Write property test for quotation number format

    - **Property 9: Quotation Number Format**
    - **Validates: Requirements 5.1**

  - [x] 1.4 Write property test for save/load round trip

    - **Property 10: Quotation Save/Load Round Trip**
    - **Validates: Requirements 5.2, 5.4**

- [x] 2. Create Zustand store for efficacy quotations

  - [x] 2.1 Implement efficacyQuotationStore

    - Create `stores/efficacyQuotationStore.ts` with state and actions
    - Include customer info, model selection, items, calculations, navigation
    - _Requirements: 1.2, 2.2, 4.1_

  - [x] 2.2 Write property test for item amount calculation

    - **Property 1: Item Amount Calculation Invariant**
    - **Validates: Requirements 2.2, 4.1**

  - [x] 2.3 Write property test for category subtotal consistency

    - **Property 2: Category Subtotal Consistency**
    - **Validates: Requirements 4.2**

  - [x] 2.4 Write property test for VAT calculation

    - **Property 3: VAT and Grand Total Calculation**
    - **Validates: Requirements 4.3**

- [x] 3. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: Model Selection

- [x] 4. Create model selection components

  - [x] 4.1 Create ModelCard component

    - Create `components/efficacy-quotation/ModelCard.tsx`
    - Display model_name, category, indication, description
    - _Requirements: 1.1, 1.3_

  - [x] 4.2 Create StepModelSelection component

    - Create `components/efficacy-quotation/StepModelSelection.tsx`
    - Group models by category, handle selection
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 4.3 Write property test for model selection loads defaults

    - **Property 4: Model Selection Loads Correct Defaults**
    - **Validates: Requirements 1.2, 3.2**

  - [x] 4.4 Write property test for model change clears selection

    - **Property 5: Model Change Clears Previous Selection**
    - **Validates: Requirements 1.4**

  - [x] 4.5 Write property test for active models filter

    - **Property 13: Active Models Only Display**
    - **Validates: Requirements 1.1**

## Phase 3: Item Configuration

- [x] 5. Create item configuration components

  - [x] 5.1 Create ItemCard component

    - Create `components/efficacy-quotation/ItemCard.tsx`
    - Display item info, quantity/multiplier inputs, calculated amount
    - Visual distinction for default vs optional items
    - _Requirements: 2.1, 2.4, 3.4_

  - [x] 5.2 Create StepItemConfiguration component

    - Create `components/efficacy-quotation/StepItemConfiguration.tsx`
    - Split view: selected items (left) and optional items panel (right)
    - Search functionality for optional items
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_

  - [x] 5.3 Write property test for item removal

    - **Property 6: Item Removal Decreases Total**
    - **Validates: Requirements 2.3**

  - [x] 5.4 Write property test for optional items filter

    - **Property 7: Optional Items Filter by Model**
    - **Validates: Requirements 3.1**

  - [x] 5.5 Write property test for search filter

    - **Property 8: Search Filter Returns Matching Items**
    - **Validates: Requirements 3.3**

- [x] 6. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Calculation and Preview

- [x] 7. Create calculation and preview components

  - [x] 7.1 Create StepCalculation component

    - Create `components/efficacy-quotation/StepCalculation.tsx`
    - Display items grouped by category with subtotals
    - Show subtotal, VAT, grand total
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 7.2 Create StepPreview component

    - Create `components/efficacy-quotation/StepPreview.tsx`
    - Print-ready format with company header, model info, itemized list
    - Save quotation functionality
    - _Requirements: 5.1, 5.2, 6.1, 6.3, 6.4_

  - [x] 7.3 Create EfficacyQuotationPDF component

    - Create `components/efficacy-quotation/EfficacyQuotationPDF.tsx`
    - PDF generation using existing PDF infrastructure
    - _Requirements: 6.2_

## Phase 5: Wizard and Pages

- [x] 8. Create wizard and page components

  - [x] 8.1 Create EfficacyQuotationWizard component

    - Create `components/efficacy-quotation/EfficacyQuotationWizard.tsx`
    - 5-step progress indicator
    - _Requirements: 1.1, 8.1_

  - [x] 8.2 Create efficacy quotation creation page

    - Create `app/(dashboard)/efficacy-quotations/new/page.tsx`
    - Integrate all step components
    - _Requirements: 1.1, 8.1, 8.2, 8.3_

  - [x] 8.3 Write property test for required field validation

    - **Property 14: Required Field Validation**
    - **Validates: Requirements 8.4**

- [x] 9. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: List and Detail Pages

- [x] 10. Create list and detail pages

  - [x] 10.1 Create efficacy quotation list page

    - Create `app/(dashboard)/efficacy-quotations/page.tsx`
    - Display quotations with filter, search, status
    - Copy, edit, delete actions
    - _Requirements: 5.3, 9.1, 9.3, 9.4_

  - [x] 10.2 Create efficacy quotation detail page

    - Create `app/(dashboard)/efficacy-quotations/[id]/page.tsx`
    - Display full quotation details
    - Contract and consultation generation links
    - _Requirements: 5.4, 10.1, 10.2_

  - [x] 10.3 Write property test for quotation type filter

    - **Property 11: Quotation Type Filter**
    - **Validates: Requirements 5.3**

  - [x] 10.4 Write property test for copy operation

    - **Property 12: Copy Preserves Items But Changes Identity**
    - **Validates: Requirements 9.1, 9.2**

## Phase 7: Settings and Integration

- [-] 11. Create settings page

  - [-] 11.1 Create efficacy master data settings page

    - Create `app/(dashboard)/settings/efficacy/page.tsx`
    - Price master management (add, edit, deactivate)
    - Model item pool management
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 12. Update navigation and integration

  - [x] 12.1 Update Sidebar navigation
    - Add "효력시험 견적" menu items under quotation section
    - _Requirements: 11.1_
  - [x] 12.2 Update dashboard statistics
    - Add efficacy quotation counts and amounts
    - _Requirements: 11.3_
  - [x] 12.3 Integrate with contract generation
    - Update contract form to accept efficacy quotation data
    - _Requirements: 10.1, 10.3_
  - [x] 12.4 Integrate with consultation record generation
    - Update consultation form for efficacy test categorization
    - _Requirements: 10.2_

- [x] 13. Final Checkpoint - Ensure all tests pass
  - All 62 tests passed successfully.
