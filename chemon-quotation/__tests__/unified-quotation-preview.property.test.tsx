/**
 * Property-Based Tests for UnifiedQuotationPreview Component
 * 
 * **Feature: unified-quotation-code, Property 3: 미리보기 정보 포함**
 * **Validates: Requirements 2.1, 2.2, 2.4, 2.5**
 * 
 * Property 3 from design.md:
 * "For any test type quotation preview, the rendered output must include 
 * quotation number and company info (company name, address, contact). 
 * All fields of the input company info must be present in the output."
 * 
 * Requirements:
 * - 2.1: Preview page SHALL display quotation number in header area
 * - 2.2: Preview page SHALL load and display company name, address, contact, logo from CompanyInfo
 * - 2.4: When exporting to PDF, quotation number and company info SHALL be included
 * - 2.5: Clinical pathology quotation preview SHALL display quotation number and company info in same format as toxicity quotation
 */

import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import UnifiedQuotationPreview, {
  CompanyInfo,
  CustomerInfo,
  QuotationItem,
  QuotationAmounts,
  UnifiedQuotationPreviewProps,
} from '@/components/quotation/UnifiedQuotationPreview';

// Type definitions
type QuotationType = 'TOXICITY' | 'EFFICACY' | 'CLINICAL';

// ============================================================================
// Arbitraries (Test Data Generators)
// ============================================================================

/**
 * Generator for quotation types
 */
const quotationTypeArb: fc.Arbitrary<QuotationType> = fc.constantFrom(
  'TOXICITY',
  'EFFICACY',
  'CLINICAL'
);

/**
 * Generator for valid quotation numbers (YY-UC-MM-NNNN format)
 */
const quotationNumberArb = fc.tuple(
  fc.integer({ min: 20, max: 99 }),  // Year (YY)
  fc.string({ minLength: 2, maxLength: 2 }).filter(s => /^[A-Z]{2}$/.test(s)),  // User code
  fc.integer({ min: 1, max: 12 }),   // Month
  fc.integer({ min: 1, max: 9999 })  // Sequence
).map(([year, code, month, seq]) => 
  `${year}-${code}-${String(month).padStart(2, '0')}-${String(seq).padStart(4, '0')}`
);

/**
 * Generator for non-empty strings (for required fields)
 * Filters out strings that are only whitespace
 */
const nonEmptyStringArb = (maxLength: number = 50) => 
  fc.string({ minLength: 1, maxLength })
    .filter(s => s.trim().length > 0)
    .map(s => s.trim());

/**
 * Generator for company info with required fields
 * Ensures all required fields have non-empty values
 */
const companyInfoArb: fc.Arbitrary<CompanyInfo> = fc.record({
  name: nonEmptyStringArb(50),
  nameEn: fc.option(nonEmptyStringArb(50), { nil: undefined }),
  address: nonEmptyStringArb(100),
  addressEn: fc.option(nonEmptyStringArb(100), { nil: undefined }),
  tel: nonEmptyStringArb(20),
  fax: fc.option(nonEmptyStringArb(20), { nil: undefined }),
  email: fc.option(fc.emailAddress(), { nil: undefined }),
  logo: fc.option(fc.webUrl(), { nil: undefined }),
  businessNumber: fc.option(nonEmptyStringArb(20), { nil: undefined }),
  ceoName: fc.option(nonEmptyStringArb(30), { nil: undefined }),
});

/**
 * Generator for customer info
 */
const customerInfoArb: fc.Arbitrary<CustomerInfo> = fc.record({
  id: fc.option(fc.uuid(), { nil: undefined }),
  name: nonEmptyStringArb(50),
  projectName: fc.option(nonEmptyStringArb(50), { nil: undefined }),
  contactPerson: fc.option(nonEmptyStringArb(30), { nil: undefined }),
  email: fc.option(fc.emailAddress(), { nil: undefined }),
  phone: fc.option(nonEmptyStringArb(20), { nil: undefined }),
  address: fc.option(nonEmptyStringArb(100), { nil: undefined }),
});

/**
 * Generator for quotation items
 */
const quotationItemArb: fc.Arbitrary<QuotationItem> = fc.record({
  id: fc.uuid(),
  name: nonEmptyStringArb(100),
  category: fc.option(fc.constantFrom('동물비', '사육비', '측정', '조직병리', '분석', '기타'), { nil: undefined }),
  unitPrice: fc.integer({ min: 1000, max: 10000000 }),
  quantity: fc.integer({ min: 1, max: 100 }),
  multiplier: fc.option(fc.integer({ min: 1, max: 10 }), { nil: undefined }),
  amount: fc.integer({ min: 1000, max: 100000000 }),
  isOption: fc.option(fc.boolean(), { nil: undefined }),
  isDefault: fc.option(fc.boolean(), { nil: undefined }),
  glpStatus: fc.option(fc.constantFrom('GLP', 'Non-GLP', '-'), { nil: undefined }),
  parentItemId: fc.option(fc.uuid(), { nil: null }),
});

/**
 * Generator for quotation amounts
 */
const quotationAmountsArb: fc.Arbitrary<QuotationAmounts> = fc.record({
  subtotal: fc.integer({ min: 10000, max: 1000000000 }),
  subtotalByCategory: fc.option(
    fc.dictionary(
      fc.constantFrom('동물비', '사육비', '측정', '조직병리', '분석', '기타'),
      fc.integer({ min: 1000, max: 100000000 })
    ),
    { nil: undefined }
  ),
  discountRate: fc.option(fc.integer({ min: 0, max: 50 }), { nil: undefined }),
  discountAmount: fc.option(fc.integer({ min: 0, max: 100000000 }), { nil: undefined }),
  vat: fc.option(fc.integer({ min: 0, max: 100000000 }), { nil: undefined }),
  total: fc.integer({ min: 10000, max: 1000000000 }),
});

// ============================================================================
// Property Tests
// ============================================================================

describe('UnifiedQuotationPreview Property Tests', () => {
  /**
   * Property 3: 미리보기 정보 포함 (Preview information inclusion)
   * Feature: unified-quotation-code
   * 
   * For any test type quotation preview, the rendered output must include
   * quotation number and company info (company name, address, contact).
   * All fields of the input company info must be present in the output.
   * 
   * **Validates: Requirements 2.1, 2.2, 2.4, 2.5**
   */
  describe('Property 3: Preview information inclusion', () => {
    /**
     * Test: Quotation number should be displayed for all test types
     * **Validates: Requirements 2.1**
     */
    it('should include quotation number in rendered output for all test types', () => {
      fc.assert(
        fc.property(
          quotationTypeArb,
          quotationNumberArb,
          companyInfoArb,
          customerInfoArb,
          fc.array(quotationItemArb, { minLength: 1, maxLength: 5 }),
          quotationAmountsArb,
          (quotationType, quotationNumber, companyInfo, customerInfo, items, amounts) => {
            const { container } = render(
              <UnifiedQuotationPreview
                quotationType={quotationType}
                quotationNumber={quotationNumber}
                companyInfo={companyInfo}
                customerInfo={customerInfo}
                items={items}
                amounts={amounts}
              />
            );

            // Property: Quotation number must be present in the rendered output
            expect(container.textContent).toContain(quotationNumber);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Company name should be displayed for all test types
     * **Validates: Requirements 2.2**
     */
    it('should include company name in rendered output for all test types', () => {
      fc.assert(
        fc.property(
          quotationTypeArb,
          quotationNumberArb,
          companyInfoArb,
          customerInfoArb,
          fc.array(quotationItemArb, { minLength: 1, maxLength: 5 }),
          quotationAmountsArb,
          (quotationType, quotationNumber, companyInfo, customerInfo, items, amounts) => {
            const { container } = render(
              <UnifiedQuotationPreview
                quotationType={quotationType}
                quotationNumber={quotationNumber}
                companyInfo={companyInfo}
                customerInfo={customerInfo}
                items={items}
                amounts={amounts}
              />
            );

            // Property: Company name must be present in the rendered output
            expect(container.textContent).toContain(companyInfo.name);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Company address should be displayed for all test types
     * **Validates: Requirements 2.2**
     */
    it('should include company address in rendered output for all test types', () => {
      fc.assert(
        fc.property(
          quotationTypeArb,
          quotationNumberArb,
          companyInfoArb,
          customerInfoArb,
          fc.array(quotationItemArb, { minLength: 1, maxLength: 5 }),
          quotationAmountsArb,
          (quotationType, quotationNumber, companyInfo, customerInfo, items, amounts) => {
            const { container } = render(
              <UnifiedQuotationPreview
                quotationType={quotationType}
                quotationNumber={quotationNumber}
                companyInfo={companyInfo}
                customerInfo={customerInfo}
                items={items}
                amounts={amounts}
              />
            );

            // Property: Company address must be present in the rendered output
            expect(container.textContent).toContain(companyInfo.address);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Company telephone should be displayed for all test types
     * **Validates: Requirements 2.2**
     */
    it('should include company tel in rendered output for all test types', () => {
      fc.assert(
        fc.property(
          quotationTypeArb,
          quotationNumberArb,
          companyInfoArb,
          customerInfoArb,
          fc.array(quotationItemArb, { minLength: 1, maxLength: 5 }),
          quotationAmountsArb,
          (quotationType, quotationNumber, companyInfo, customerInfo, items, amounts) => {
            const { container } = render(
              <UnifiedQuotationPreview
                quotationType={quotationType}
                quotationNumber={quotationNumber}
                companyInfo={companyInfo}
                customerInfo={customerInfo}
                items={items}
                amounts={amounts}
              />
            );

            // Property: Company tel must be present in the rendered output
            expect(container.textContent).toContain(companyInfo.tel);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: All required company info fields should be present
     * **Validates: Requirements 2.2, 2.4, 2.5**
     */
    it('should include all required company info fields (name, address, tel) for all test types', () => {
      fc.assert(
        fc.property(
          quotationTypeArb,
          quotationNumberArb,
          companyInfoArb,
          customerInfoArb,
          fc.array(quotationItemArb, { minLength: 1, maxLength: 5 }),
          quotationAmountsArb,
          (quotationType, quotationNumber, companyInfo, customerInfo, items, amounts) => {
            const { container } = render(
              <UnifiedQuotationPreview
                quotationType={quotationType}
                quotationNumber={quotationNumber}
                companyInfo={companyInfo}
                customerInfo={customerInfo}
                items={items}
                amounts={amounts}
              />
            );

            const textContent = container.textContent || '';

            // Property: All required fields must be present
            // Quotation number
            expect(textContent).toContain(quotationNumber);
            // Company name
            expect(textContent).toContain(companyInfo.name);
            // Company address
            expect(textContent).toContain(companyInfo.address);
            // Company tel
            expect(textContent).toContain(companyInfo.tel);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Preview format should be consistent across all quotation types
     * **Validates: Requirements 2.5**
     * 
     * Clinical pathology quotation preview SHALL display quotation number 
     * and company info in same format as toxicity quotation
     */
    it('should display quotation number and company info in same format for all test types', () => {
      fc.assert(
        fc.property(
          quotationNumberArb,
          companyInfoArb,
          customerInfoArb,
          fc.array(quotationItemArb, { minLength: 1, maxLength: 3 }),
          quotationAmountsArb,
          (quotationNumber, companyInfo, customerInfo, items, amounts) => {
            // Render for each quotation type
            const types: QuotationType[] = ['TOXICITY', 'EFFICACY', 'CLINICAL'];
            
            const renderedContents = types.map(quotationType => {
              const { container } = render(
                <UnifiedQuotationPreview
                  quotationType={quotationType}
                  quotationNumber={quotationNumber}
                  companyInfo={companyInfo}
                  customerInfo={customerInfo}
                  items={items}
                  amounts={amounts}
                />
              );
              return container.textContent || '';
            });

            // Property: All types should contain the same quotation number
            renderedContents.forEach(content => {
              expect(content).toContain(quotationNumber);
            });

            // Property: All types should contain the same company info
            renderedContents.forEach(content => {
              expect(content).toContain(companyInfo.name);
              expect(content).toContain(companyInfo.address);
              expect(content).toContain(companyInfo.tel);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property tests for preview rendering
   */
  describe('Preview rendering properties', () => {
    /**
     * Test: Optional company info fields should be displayed when provided
     */
    it('should display optional company info fields when provided', () => {
      fc.assert(
        fc.property(
          quotationTypeArb,
          quotationNumberArb,
          // Generate company info with all optional fields filled
          fc.record({
            name: nonEmptyStringArb(50),
            nameEn: nonEmptyStringArb(50),
            address: nonEmptyStringArb(100),
            addressEn: nonEmptyStringArb(100),
            tel: nonEmptyStringArb(20),
            fax: nonEmptyStringArb(20),
            email: fc.emailAddress(),
            businessNumber: nonEmptyStringArb(20),
            ceoName: nonEmptyStringArb(30),
          }),
          customerInfoArb,
          fc.array(quotationItemArb, { minLength: 1, maxLength: 3 }),
          quotationAmountsArb,
          (quotationType, quotationNumber, companyInfo, customerInfo, items, amounts) => {
            const { container } = render(
              <UnifiedQuotationPreview
                quotationType={quotationType}
                quotationNumber={quotationNumber}
                companyInfo={companyInfo}
                customerInfo={customerInfo}
                items={items}
                amounts={amounts}
              />
            );

            const textContent = container.textContent || '';

            // Property: Optional fields should be displayed when provided
            if (companyInfo.fax) {
              expect(textContent).toContain(companyInfo.fax);
            }
            if (companyInfo.email) {
              expect(textContent).toContain(companyInfo.email);
            }
            if (companyInfo.businessNumber) {
              expect(textContent).toContain(companyInfo.businessNumber);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Customer info should be displayed
     */
    it('should display customer name in rendered output', () => {
      fc.assert(
        fc.property(
          quotationTypeArb,
          quotationNumberArb,
          companyInfoArb,
          customerInfoArb,
          fc.array(quotationItemArb, { minLength: 1, maxLength: 3 }),
          quotationAmountsArb,
          (quotationType, quotationNumber, companyInfo, customerInfo, items, amounts) => {
            const { container } = render(
              <UnifiedQuotationPreview
                quotationType={quotationType}
                quotationNumber={quotationNumber}
                companyInfo={companyInfo}
                customerInfo={customerInfo}
                items={items}
                amounts={amounts}
              />
            );

            // Property: Customer name should be present
            expect(container.textContent).toContain(customerInfo.name);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Quotation type title should be displayed correctly
     */
    it('should display correct quotation type title', () => {
      const expectedTitles: Record<QuotationType, string> = {
        TOXICITY: '독성시험 견적서',
        EFFICACY: '효력시험 견적서',
        CLINICAL: '임상병리시험 견적서',
      };

      fc.assert(
        fc.property(
          quotationTypeArb,
          quotationNumberArb,
          companyInfoArb,
          customerInfoArb,
          fc.array(quotationItemArb, { minLength: 1, maxLength: 3 }),
          quotationAmountsArb,
          (quotationType, quotationNumber, companyInfo, customerInfo, items, amounts) => {
            const { container } = render(
              <UnifiedQuotationPreview
                quotationType={quotationType}
                quotationNumber={quotationNumber}
                companyInfo={companyInfo}
                customerInfo={customerInfo}
                items={items}
                amounts={amounts}
              />
            );

            // Property: Correct title should be displayed for each type
            expect(container.textContent).toContain(expectedTitles[quotationType]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
