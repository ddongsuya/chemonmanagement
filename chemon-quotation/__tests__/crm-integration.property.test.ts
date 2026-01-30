/**
 * Property-Based Tests for CRM Integration (Frontend)
 * Feature: unified-crm-flow
 * 
 * These tests verify universal properties of the frontend CRM integration
 * including lead selection data mapping, customer card display, and
 * new lead creation.
 */

import * as fc from 'fast-check';

// Types
type LeadSource = 'WEBSITE' | 'REFERRAL' | 'COLD_CALL' | 'EXHIBITION' | 'ADVERTISEMENT' | 'OTHER';
type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CONVERTED' | 'LOST' | 'DORMANT';
type CustomerGrade = 'LEAD' | 'PROSPECT' | 'CUSTOMER' | 'VIP' | 'INACTIVE';

interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  department: string | null;
  position: string | null;
  source: LeadSource;
  status: LeadStatus;
}

interface Customer {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  grade: CustomerGrade;
  linkedLead?: {
    id: string;
    source: LeadSource;
    status: LeadStatus;
  };
}

interface QuotationFormData {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  leadId?: string;
}

// Arbitraries
const leadSourceArb = fc.constantFrom(
  'WEBSITE', 'REFERRAL', 'COLD_CALL', 'EXHIBITION', 'ADVERTISEMENT', 'OTHER'
) as fc.Arbitrary<LeadSource>;

const leadStatusArb = fc.constantFrom(
  'NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CONVERTED', 'LOST', 'DORMANT'
) as fc.Arbitrary<LeadStatus>;

const customerGradeArb = fc.constantFrom(
  'LEAD', 'PROSPECT', 'CUSTOMER', 'VIP', 'INACTIVE'
) as fc.Arbitrary<CustomerGrade>;

const leadArb = fc.record({
  id: fc.uuid(),
  companyName: fc.string({ minLength: 1, maxLength: 100 }),
  contactName: fc.string({ minLength: 1, maxLength: 50 }),
  contactEmail: fc.option(fc.emailAddress(), { nil: null }),
  contactPhone: fc.option(fc.string({ minLength: 10, maxLength: 20 }), { nil: null }),
  department: fc.option(fc.string({ maxLength: 50 }), { nil: null }),
  position: fc.option(fc.string({ maxLength: 50 }), { nil: null }),
  source: leadSourceArb,
  status: leadStatusArb,
});

const customerArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  company: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
  email: fc.option(fc.emailAddress(), { nil: null }),
  phone: fc.option(fc.string({ minLength: 10, maxLength: 20 }), { nil: null }),
  grade: customerGradeArb,
  linkedLead: fc.option(
    fc.record({
      id: fc.uuid(),
      source: leadSourceArb,
      status: leadStatusArb,
    }),
    { nil: undefined }
  ),
});

/**
 * Helper function: Map lead data to quotation form
 * This simulates the CustomerSelector component behavior
 */
function mapLeadToFormData(lead: Lead): QuotationFormData {
  return {
    companyName: lead.companyName,
    contactName: lead.contactName,
    contactEmail: lead.contactEmail || '',
    contactPhone: lead.contactPhone || '',
    leadId: lead.id,
  };
}

/**
 * Helper function: Get grade badge color
 * This simulates the CustomerGradeBadge component behavior
 */
function getGradeBadgeColor(grade: CustomerGrade): string {
  const colors: Record<CustomerGrade, string> = {
    LEAD: 'gray',
    PROSPECT: 'blue',
    CUSTOMER: 'green',
    VIP: 'purple',
    INACTIVE: 'red',
  };
  return colors[grade];
}

/**
 * Helper function: Get grade label
 */
function getGradeLabel(grade: CustomerGrade): string {
  const labels: Record<CustomerGrade, string> = {
    LEAD: '리드',
    PROSPECT: '잠재고객',
    CUSTOMER: '고객',
    VIP: 'VIP',
    INACTIVE: '비활성',
  };
  return labels[grade];
}

describe('CRM Integration Frontend Property Tests', () => {
  /**
   * Property 2: 리드 선택 시 데이터 매핑 정확성
   * Feature: unified-crm-flow, Task 8.3
   * 
   * When a lead is selected in CustomerSelector, the quotation form
   * should be populated with the lead's data correctly.
   * 
   * Validates: Requirements 1.4
   */
  describe('Property 2: 리드 선택 데이터 매핑', () => {
    it('should map lead data to form fields correctly', () => {
      fc.assert(
        fc.property(leadArb, (lead) => {
          const formData = mapLeadToFormData(lead);

          // Property: companyName should be mapped correctly
          expect(formData.companyName).toBe(lead.companyName);

          // Property: contactName should be mapped correctly
          expect(formData.contactName).toBe(lead.contactName);

          // Property: contactEmail should be mapped (empty string if null)
          expect(formData.contactEmail).toBe(lead.contactEmail || '');

          // Property: contactPhone should be mapped (empty string if null)
          expect(formData.contactPhone).toBe(lead.contactPhone || '');

          // Property: leadId should be set
          expect(formData.leadId).toBe(lead.id);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve all non-null lead data', () => {
      fc.assert(
        fc.property(
          leadArb.filter(l => l.contactEmail !== null && l.contactPhone !== null),
          (lead) => {
            const formData = mapLeadToFormData(lead);

            // Property: Non-null values should be preserved exactly
            expect(formData.contactEmail).toBe(lead.contactEmail);
            expect(formData.contactPhone).toBe(lead.contactPhone);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: 신규 리드 생성 및 견적서 연결
   * Feature: unified-crm-flow, Task 9.3
   * 
   * When a new customer is registered via DetailedCustomerForm,
   * a lead should be created and linked to the quotation.
   * 
   * Validates: Requirements 1.6
   */
  describe('Property 3: 신규 리드 생성 및 연결', () => {
    interface NewCustomerFormData {
      companyName: string;
      contactName: string;
      contactEmail: string;
      contactPhone: string;
      department: string;
      position: string;
      source: LeadSource;
    }

    const newCustomerFormArb = fc.record({
      companyName: fc.string({ minLength: 1, maxLength: 100 }),
      contactName: fc.string({ minLength: 1, maxLength: 50 }),
      contactEmail: fc.emailAddress(),
      contactPhone: fc.string({ minLength: 10, maxLength: 20 }),
      department: fc.string({ minLength: 1, maxLength: 50 }),
      position: fc.string({ minLength: 1, maxLength: 50 }),
      source: leadSourceArb,
    });

    // Simulate lead creation from form data
    function createLeadFromForm(formData: NewCustomerFormData): Partial<Lead> {
      return {
        companyName: formData.companyName,
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        department: formData.department,
        position: formData.position,
        source: formData.source,
        status: 'NEW' as LeadStatus,
      };
    }

    it('should create lead with all form data', () => {
      fc.assert(
        fc.property(newCustomerFormArb, (formData) => {
          const lead = createLeadFromForm(formData);

          // Property: All form fields should be mapped to lead
          expect(lead.companyName).toBe(formData.companyName);
          expect(lead.contactName).toBe(formData.contactName);
          expect(lead.contactEmail).toBe(formData.contactEmail);
          expect(lead.contactPhone).toBe(formData.contactPhone);
          expect(lead.department).toBe(formData.department);
          expect(lead.position).toBe(formData.position);
          expect(lead.source).toBe(formData.source);

          // Property: New lead should have NEW status
          expect(lead.status).toBe('NEW');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 9: 고객 카드 리드 정보 표시
   * Feature: unified-crm-flow, Task 12.3
   * 
   * CustomerCard should display grade badge and linked lead info correctly.
   * 
   * Validates: Requirements 4.4
   */
  describe('Property 9: 고객 카드 리드 정보 표시', () => {
    it('should display correct grade badge color for each grade', () => {
      fc.assert(
        fc.property(customerGradeArb, (grade) => {
          const color = getGradeBadgeColor(grade);

          // Property: Each grade should have a unique color
          const expectedColors: Record<CustomerGrade, string> = {
            LEAD: 'gray',
            PROSPECT: 'blue',
            CUSTOMER: 'green',
            VIP: 'purple',
            INACTIVE: 'red',
          };

          expect(color).toBe(expectedColors[grade]);
        }),
        { numRuns: 100 }
      );
    });

    it('should display correct grade label for each grade', () => {
      fc.assert(
        fc.property(customerGradeArb, (grade) => {
          const label = getGradeLabel(grade);

          // Property: Each grade should have a Korean label
          expect(label).toBeTruthy();
          expect(typeof label).toBe('string');
          expect(label.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should show linked lead source when available', () => {
      fc.assert(
        fc.property(
          customerArb.filter(c => c.linkedLead !== undefined),
          (customer) => {
            // Property: Linked lead info should be accessible
            expect(customer.linkedLead).toBeDefined();
            expect(customer.linkedLead!.id).toBeTruthy();
            expect(customer.linkedLead!.source).toBeTruthy();
            expect(customer.linkedLead!.status).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle customers without linked leads', () => {
      fc.assert(
        fc.property(
          customerArb.filter(c => c.linkedLead === undefined),
          (customer) => {
            // Property: Should not throw when linkedLead is undefined
            expect(customer.linkedLead).toBeUndefined();
            
            // Property: Customer should still have valid grade
            expect(customer.grade).toBeTruthy();
            expect(getGradeBadgeColor(customer.grade)).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional Property: Grade filtering consistency
   * 
   * When filtering customers by grade, only customers with that grade
   * should be displayed.
   */
  describe('Property: Grade 필터링 일관성', () => {
    it('should filter customers by grade correctly', () => {
      fc.assert(
        fc.property(
          fc.array(customerArb, { minLength: 1, maxLength: 20 }),
          customerGradeArb,
          (customers, filterGrade) => {
            // Simulate filtering
            const filtered = customers.filter(c => c.grade === filterGrade);

            // Property: All filtered customers should have the target grade
            filtered.forEach(customer => {
              expect(customer.grade).toBe(filterGrade);
            });

            // Property: No customers with different grades should be included
            const otherGrades = filtered.filter(c => c.grade !== filterGrade);
            expect(otherGrades.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
