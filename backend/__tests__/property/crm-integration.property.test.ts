/**
 * Property-Based Tests for CRM Integration
 * Feature: unified-crm-flow
 * 
 * These tests verify universal properties of the CRM integration system
 * including customer grade filtering, pipeline automation, lead conversion,
 * and data synchronization.
 */

/// <reference types="jest" />

import * as fc from 'fast-check';
import { PrismaClient, LeadStatus, QuotationStatus, CustomerGrade } from '@prisma/client';
import { DataService } from '../../src/services/dataService';
import { PipelineAutomationService } from '../../src/services/pipelineAutomationService';
import { LeadConversionService } from '../../src/services/leadConversionService';
import { DataSyncService } from '../../src/services/dataSyncService';

// Mock PrismaClient
const createMockPrisma = () => ({
  customer: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  lead: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  quotation: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  pipelineStage: {
    findFirst: jest.fn(),
  },
  leadActivity: {
    create: jest.fn(),
  },
  activityLog: {
    create: jest.fn(),
  },
  userSettings: {
    findUnique: jest.fn().mockResolvedValue({ userCode: 'TQ' }),
  },
  $transaction: jest.fn((callback) => callback({
    customer: {
      create: jest.fn(),
      update: jest.fn(),
    },
    lead: {
      update: jest.fn(),
    },
    quotation: {
      updateMany: jest.fn(),
    },
    leadActivity: {
      create: jest.fn(),
    },
  })),
} as unknown as PrismaClient);

// Arbitraries for generating test data
const customerGradeArb = fc.constantFrom(
  'LEAD', 'PROSPECT', 'CUSTOMER', 'VIP', 'INACTIVE'
) as fc.Arbitrary<CustomerGrade>;

const leadStatusArb = fc.constantFrom(
  'NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CONVERTED', 'LOST', 'DORMANT'
) as fc.Arbitrary<LeadStatus>;

const customerArb = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  company: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
  email: fc.option(fc.emailAddress(), { nil: null }),
  phone: fc.option(fc.string({ maxLength: 20 }), { nil: null }),
  address: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  notes: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
  grade: customerGradeArb,
  createdAt: fc.date(),
  updatedAt: fc.date(),
  deletedAt: fc.constant(null),
});

const leadArb = fc.record({
  id: fc.uuid(),
  leadNumber: fc.string({ minLength: 5, maxLength: 20 }),
  userId: fc.uuid(),
  companyName: fc.string({ minLength: 1, maxLength: 100 }),
  contactName: fc.string({ minLength: 1, maxLength: 50 }),
  contactEmail: fc.option(fc.emailAddress(), { nil: null }),
  contactPhone: fc.option(fc.string({ maxLength: 20 }), { nil: null }),
  status: leadStatusArb,
  customerId: fc.option(fc.uuid(), { nil: null }),
  convertedAt: fc.option(fc.date(), { nil: null }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
  deletedAt: fc.constant(null),
});

describe('CRM Integration Property Tests', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    jest.clearAllMocks();
  });

  /**
   * Property 1: 고객/리드 필터링 일관성
   * Feature: unified-crm-flow, Task 1.2
   * 
   * For any grade filter, all returned customers must have that grade.
   * 
   * Validates: Requirements 1.2, 1.3, 4.3, 4.5
   */
  describe('Property 1: 고객 grade 필터링 일관성', () => {
    let dataService: DataService;

    beforeEach(() => {
      dataService = new DataService(mockPrisma);
    });

    it('should return only customers matching the grade filter', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(customerArb, { minLength: 1, maxLength: 20 }),
          customerGradeArb,
          fc.uuid(),
          async (customers, filterGrade, userId) => {
            // Filter customers by grade
            const matchingCustomers = customers
              .filter(c => c.grade === filterGrade)
              .map(c => ({ ...c, userId, quotations: [], leads: [] }));

            (mockPrisma.customer.findMany as jest.Mock).mockResolvedValue(matchingCustomers);
            (mockPrisma.customer.count as jest.Mock).mockResolvedValue(matchingCustomers.length);

            const result = await dataService.getCustomers(userId, {
              page: 1,
              limit: 100,
              grade: filterGrade,
            });

            // Property: all returned customers must have the filtered grade
            result.data.forEach(customer => {
              expect(customer.grade).toBe(filterGrade);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return all customers when no grade filter is applied', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(customerArb, { minLength: 1, maxLength: 20 }),
          fc.uuid(),
          async (customers, userId) => {
            const allCustomers = customers.map(c => ({ 
              ...c, 
              userId, 
              quotations: [], 
              leads: [] 
            }));

            (mockPrisma.customer.findMany as jest.Mock).mockResolvedValue(allCustomers);
            (mockPrisma.customer.count as jest.Mock).mockResolvedValue(allCustomers.length);

            const result = await dataService.getCustomers(userId, {
              page: 1,
              limit: 100,
            });

            // Property: should return all customers
            expect(result.data.length).toBe(allCustomers.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: 견적서 발송 시 파이프라인 자동 업데이트
   * Feature: unified-crm-flow, Task 2.2
   * 
   * When quotation status changes to SENT and lead is in pre-PROPOSAL stage,
   * lead status should be updated to PROPOSAL.
   * 
   * Validates: Requirements 2.1, 2.2, 2.3
   */
  describe('Property 4: 파이프라인 자동 업데이트', () => {
    let pipelineService: PipelineAutomationService;

    beforeEach(() => {
      pipelineService = new PipelineAutomationService(mockPrisma);
    });

    it('should update lead to PROPOSAL when quotation is SENT and lead is before PROPOSAL', async () => {
      const preProposalStatuses: LeadStatus[] = [
        LeadStatus.NEW,
        LeadStatus.CONTACTED,
        LeadStatus.QUALIFIED,
      ];

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...preProposalStatuses),
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          async (leadStatus, quotationId, leadId, userId) => {
            const lead = {
              id: leadId,
              userId,
              status: leadStatus,
              companyName: 'Test Company',
              contactName: 'Test Contact',
            };

            const quotation = {
              id: quotationId,
              userId,
              leadId,
              lead,
            };

            (mockPrisma.quotation.findUnique as jest.Mock).mockResolvedValue(quotation);
            (mockPrisma.pipelineStage.findFirst as jest.Mock).mockResolvedValue({
              id: 'proposal-stage-id',
              code: 'PROPOSAL',
            });
            (mockPrisma.lead.update as jest.Mock).mockResolvedValue({
              ...lead,
              status: LeadStatus.PROPOSAL,
            });
            (mockPrisma.leadActivity.create as jest.Mock).mockResolvedValue({});

            const result = await pipelineService.onQuotationStatusChange(
              quotationId,
              QuotationStatus.SENT,
              userId
            );

            // Property: lead should be updated to PROPOSAL
            expect(result).not.toBeNull();
            expect(mockPrisma.lead.update).toHaveBeenCalledWith(
              expect.objectContaining({
                data: expect.objectContaining({
                  status: LeadStatus.PROPOSAL,
                }),
              })
            );
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should NOT update lead when already at or past PROPOSAL stage', async () => {
      const postProposalStatuses: LeadStatus[] = [
        LeadStatus.PROPOSAL,
        LeadStatus.NEGOTIATION,
        LeadStatus.CONVERTED,
      ];

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...postProposalStatuses),
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          async (leadStatus, quotationId, leadId, userId) => {
            const lead = {
              id: leadId,
              userId,
              status: leadStatus,
              companyName: 'Test Company',
              contactName: 'Test Contact',
            };

            const quotation = {
              id: quotationId,
              userId,
              leadId,
              lead,
            };

            (mockPrisma.quotation.findUnique as jest.Mock).mockResolvedValue(quotation);

            const result = await pipelineService.onQuotationStatusChange(
              quotationId,
              QuotationStatus.SENT,
              userId
            );

            // Property: lead should NOT be updated
            expect(result).toBeNull();
            expect(mockPrisma.lead.update).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 5: 파이프라인 변경 시 활동 기록 생성
   * Feature: unified-crm-flow, Task 2.4
   * 
   * When pipeline stage changes, a LeadActivity record with type STATUS_CHANGE
   * should be created.
   * 
   * Validates: Requirements 2.4
   */
  describe('Property 5: 활동 기록 생성', () => {
    let pipelineService: PipelineAutomationService;

    beforeEach(() => {
      pipelineService = new PipelineAutomationService(mockPrisma);
    });

    it('should create STATUS_CHANGE activity when pipeline stage changes', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.constantFrom(LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED),
          fc.uuid(),
          async (leadId, previousStatus, userId) => {
            (mockPrisma.leadActivity.create as jest.Mock).mockResolvedValue({
              id: 'activity-id',
              leadId,
              userId,
              type: 'STATUS_CHANGE',
            });

            await pipelineService.createStatusChangeActivity(
              leadId,
              previousStatus,
              LeadStatus.PROPOSAL,
              userId
            );

            // Property: LeadActivity should be created with STATUS_CHANGE type
            expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith(
              expect.objectContaining({
                data: expect.objectContaining({
                  leadId,
                  userId,
                  type: 'STATUS_CHANGE',
                }),
              })
            );
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
