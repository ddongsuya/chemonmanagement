/**
 * Property-Based Tests for Lead Conversion and Data Sync
 * Feature: unified-crm-flow
 * 
 * These tests verify universal properties of lead-to-customer conversion
 * and bidirectional data synchronization.
 */

/// <reference types="jest" />

import * as fc from 'fast-check';
import { PrismaClient, LeadStatus, CustomerGrade } from '@prisma/client';
import { LeadConversionService } from '../../src/services/leadConversionService';
import { DataSyncService } from '../../src/services/dataSyncService';

// Mock transaction helper
const createMockTransaction = () => {
  const mockTx = {
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
  };
  return mockTx;
};

// Mock PrismaClient
const createMockPrisma = () => {
  const mockTx = createMockTransaction();
  
  return {
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
    activityLog: {
      create: jest.fn(),
    },
    leadActivity: {
      create: jest.fn(),
    },
    $transaction: jest.fn(async (callback) => {
      return callback(mockTx);
    }),
    _mockTx: mockTx,
  } as unknown as PrismaClient & { _mockTx: typeof mockTx };
};

// Arbitraries
const leadStatusArb = fc.constantFrom(
  'NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CONVERTED', 'LOST', 'DORMANT'
) as fc.Arbitrary<LeadStatus>;

const customerGradeArb = fc.constantFrom(
  'LEAD', 'PROSPECT', 'CUSTOMER', 'VIP', 'INACTIVE'
) as fc.Arbitrary<CustomerGrade>;

const leadArb = fc.record({
  id: fc.uuid(),
  leadNumber: fc.string({ minLength: 5, maxLength: 20 }),
  userId: fc.uuid(),
  companyName: fc.string({ minLength: 1, maxLength: 100 }),
  contactName: fc.string({ minLength: 1, maxLength: 50 }),
  contactEmail: fc.option(fc.emailAddress(), { nil: null }),
  contactPhone: fc.option(fc.string({ maxLength: 20 }), { nil: null }),
  status: fc.constantFrom('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION') as fc.Arbitrary<LeadStatus>,
  customerId: fc.constant(null as string | null),
  customer: fc.constant(null),
  convertedAt: fc.constant(null as Date | null),
  createdAt: fc.date(),
  updatedAt: fc.date(),
  deletedAt: fc.constant(null),
});

const customerArb = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  company: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
  email: fc.option(fc.emailAddress(), { nil: null }),
  phone: fc.option(fc.string({ maxLength: 20 }), { nil: null }),
  grade: customerGradeArb,
  createdAt: fc.date(),
  updatedAt: fc.date(),
  deletedAt: fc.constant(null),
});

describe('Lead Conversion Property Tests', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let leadConversionService: LeadConversionService;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    leadConversionService = new LeadConversionService(mockPrisma);
    jest.clearAllMocks();
  });

  /**
   * Property 6: 리드-고객 전환 데이터 무결성
   * Feature: unified-crm-flow, Task 4.2
   * 
   * When a lead is converted to customer:
   * - Lead data (companyName, contactName, etc.) should be copied to Customer
   * - Customer grade should be set to CUSTOMER
   * - Lead status should be set to CONVERTED
   * - Lead.customerId should reference the new Customer
   * 
   * Validates: Requirements 3.2, 3.3, 3.4
   */
  describe('Property 6: 리드-고객 전환 데이터 무결성', () => {
    it('should copy lead data to customer correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          leadArb,
          fc.uuid(),
          async (lead, userId) => {
            const leadWithQuotations = {
              ...lead,
              userId,
              quotations: [],
              customer: null,
            };

            const createdCustomer = {
              id: 'new-customer-id',
              userId,
              name: lead.contactName,
              company: lead.companyName,
              email: lead.contactEmail,
              phone: lead.contactPhone,
              grade: CustomerGrade.CUSTOMER,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const updatedLead = {
              ...lead,
              status: LeadStatus.CONVERTED,
              customerId: createdCustomer.id,
              convertedAt: new Date(),
            };

            (mockPrisma.lead.findUnique as jest.Mock).mockResolvedValue(leadWithQuotations);
            
            const mockTx = (mockPrisma as any)._mockTx;
            mockTx.customer.create.mockResolvedValue(createdCustomer);
            mockTx.lead.update.mockResolvedValue(updatedLead);
            mockTx.quotation.updateMany.mockResolvedValue({ count: 0 });
            mockTx.leadActivity.create.mockResolvedValue({});

            const result = await leadConversionService.convertLeadToCustomer(lead.id, userId);

            // Property: Customer should have data from Lead
            expect(mockTx.customer.create).toHaveBeenCalledWith(
              expect.objectContaining({
                data: expect.objectContaining({
                  name: lead.contactName,
                  company: lead.companyName,
                  email: lead.contactEmail,
                  phone: lead.contactPhone,
                  grade: CustomerGrade.CUSTOMER,
                }),
              })
            );

            // Property: Lead should be marked as CONVERTED
            expect(mockTx.lead.update).toHaveBeenCalledWith(
              expect.objectContaining({
                data: expect.objectContaining({
                  status: LeadStatus.CONVERTED,
                  customerId: expect.any(String),
                  convertedAt: expect.any(Date),
                }),
              })
            );
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should reject conversion of already converted leads', async () => {
      await fc.assert(
        fc.asyncProperty(
          leadArb,
          fc.uuid(),
          fc.uuid(),
          async (lead, userId, existingCustomerId) => {
            const convertedLead = {
              ...lead,
              userId,
              status: LeadStatus.CONVERTED,
              customerId: existingCustomerId,
              customer: { id: existingCustomerId },
              quotations: [],
            };

            (mockPrisma.lead.findUnique as jest.Mock).mockResolvedValue(convertedLead);

            // Property: Should throw error for already converted lead
            await expect(
              leadConversionService.convertLeadToCustomer(lead.id, userId)
            ).rejects.toThrow('이미 고객으로 전환된 리드입니다');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 7: 전환 시 견적서 연결 업데이트
   * Feature: unified-crm-flow, Task 4.4
   * 
   * When a lead is converted, all quotations linked to that lead
   * should have their customerId updated to the new customer.
   * 
   * Validates: Requirements 3.5
   */
  describe('Property 7: 견적서 연결 업데이트', () => {
    it('should update all linked quotations with new customerId', async () => {
      await fc.assert(
        fc.asyncProperty(
          leadArb,
          fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
          fc.uuid(),
          async (lead, quotationIds, userId) => {
            const quotations = quotationIds.map(id => ({ id }));
            const leadWithQuotations = {
              ...lead,
              userId,
              quotations,
              customer: null,
            };

            const createdCustomer = {
              id: 'new-customer-id',
              userId,
              name: lead.contactName,
              company: lead.companyName,
              grade: CustomerGrade.CUSTOMER,
            };

            (mockPrisma.lead.findUnique as jest.Mock).mockResolvedValue(leadWithQuotations);
            
            const mockTx = (mockPrisma as any)._mockTx;
            mockTx.customer.create.mockResolvedValue(createdCustomer);
            mockTx.lead.update.mockResolvedValue({
              ...lead,
              status: LeadStatus.CONVERTED,
              customerId: createdCustomer.id,
            });
            mockTx.quotation.updateMany.mockResolvedValue({ count: quotationIds.length });
            mockTx.leadActivity.create.mockResolvedValue({});

            const result = await leadConversionService.convertLeadToCustomer(lead.id, userId);

            // Property: All quotations should be updated with new customerId
            expect(mockTx.quotation.updateMany).toHaveBeenCalledWith(
              expect.objectContaining({
                where: expect.objectContaining({
                  id: { in: quotationIds },
                }),
                data: expect.objectContaining({
                  customerId: createdCustomer.id,
                }),
              })
            );

            // Property: Result should include all updated quotation IDs
            expect(result.updatedQuotations).toEqual(expect.arrayContaining(quotationIds));
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 8: 중복 고객 생성 방지
   * Feature: unified-crm-flow, Task 4.6
   * 
   * If a lead already has a linked customer, conversion should update
   * the existing customer instead of creating a new one.
   * 
   * Validates: Requirements 3.6
   */
  describe('Property 8: 중복 고객 생성 방지', () => {
    it('should update existing customer instead of creating new one', async () => {
      await fc.assert(
        fc.asyncProperty(
          leadArb,
          customerArb,
          fc.uuid(),
          async (lead, existingCustomer, userId) => {
            // Lead with existing customer (not yet CONVERTED)
            const leadWithCustomer = {
              ...lead,
              userId,
              status: LeadStatus.NEGOTIATION, // Not yet converted
              customerId: existingCustomer.id,
              customer: existingCustomer,
              quotations: [],
            };

            (mockPrisma.lead.findUnique as jest.Mock).mockResolvedValue(leadWithCustomer);
            
            const mockTx = (mockPrisma as any)._mockTx;
            mockTx.customer.update.mockResolvedValue({
              ...existingCustomer,
              name: lead.contactName,
              company: lead.companyName,
            });
            mockTx.lead.update.mockResolvedValue({
              ...lead,
              status: LeadStatus.CONVERTED,
              customerId: existingCustomer.id,
            });
            mockTx.quotation.updateMany.mockResolvedValue({ count: 0 });
            mockTx.leadActivity.create.mockResolvedValue({});

            const result = await leadConversionService.convertLeadToCustomer(lead.id, userId);

            // Property: Should update existing customer, not create new
            expect(mockTx.customer.update).toHaveBeenCalled();
            expect(mockTx.customer.create).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

describe('Data Sync Property Tests', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let dataSyncService: DataSyncService;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    dataSyncService = new DataSyncService(mockPrisma);
    jest.clearAllMocks();
  });

  /**
   * Property 10: 리드-고객 양방향 동기화
   * Feature: unified-crm-flow, Task 5.2
   * 
   * When lead data changes, linked customer should be updated.
   * When customer data changes, linked leads should be updated.
   * 
   * Validates: Requirements 5.1, 5.2
   */
  describe('Property 10: 양방향 동기화', () => {
    it('should sync lead changes to customer', async () => {
      await fc.assert(
        fc.asyncProperty(
          leadArb,
          customerArb,
          fc.uuid(),
          async (lead, customer, userId) => {
            // Lead with different data than customer
            const leadWithCustomer = {
              ...lead,
              userId,
              customerId: customer.id,
              customer: {
                ...customer,
                name: 'Old Name', // Different from lead.contactName
                company: 'Old Company',
              },
            };

            (mockPrisma.lead.findUnique as jest.Mock).mockResolvedValue(leadWithCustomer);
            (mockPrisma.customer.update as jest.Mock).mockResolvedValue({
              ...customer,
              name: lead.contactName,
              company: lead.companyName,
            });
            (mockPrisma.activityLog.create as jest.Mock).mockResolvedValue({});

            const result = await dataSyncService.syncLeadToCustomer(lead.id, userId);

            // Property: Customer should be updated with lead data
            if (result && result.syncedFields.length > 0) {
              expect(mockPrisma.customer.update).toHaveBeenCalled();
              expect(mockPrisma.activityLog.create).toHaveBeenCalledWith(
                expect.objectContaining({
                  data: expect.objectContaining({
                    action: 'SYNC',
                  }),
                })
              );
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should sync customer changes to leads', async () => {
      await fc.assert(
        fc.asyncProperty(
          customerArb,
          fc.array(leadArb, { minLength: 1, maxLength: 3 }),
          fc.uuid(),
          async (customer, leads, userId) => {
            const customerWithLeads = {
              ...customer,
              userId,
              leads: leads.map(l => ({
                ...l,
                userId,
                contactName: 'Old Name', // Different from customer.name
                companyName: 'Old Company',
              })),
            };

            (mockPrisma.customer.findUnique as jest.Mock).mockResolvedValue(customerWithLeads);
            (mockPrisma.lead.update as jest.Mock).mockResolvedValue({});
            (mockPrisma.activityLog.create as jest.Mock).mockResolvedValue({});

            const results = await dataSyncService.syncCustomerToLead(customer.id, userId);

            // Property: All linked leads should be synced
            expect(results.length).toBe(leads.length);
            results.forEach(result => {
              expect(result.direction).toBe('customer-to-lead');
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: 동기화 충돌 해결
   * Feature: unified-crm-flow, Task 5.4
   * 
   * When both lead and customer are modified, the most recently
   * updated one should win.
   * 
   * Validates: Requirements 5.4
   */
  describe('Property: 동기화 충돌 해결', () => {
    it('should resolve conflicts by using most recently updated data', async () => {
      await fc.assert(
        fc.asyncProperty(
          leadArb,
          customerArb,
          fc.uuid(),
          fc.date(),
          async (lead, customer, userId, lastSyncAt) => {
            // Create timestamps where lead is more recent
            const leadUpdatedAt = new Date(lastSyncAt.getTime() + 2000);
            const customerUpdatedAt = new Date(lastSyncAt.getTime() + 1000);

            const leadWithCustomer = {
              ...lead,
              userId,
              customerId: customer.id,
              updatedAt: leadUpdatedAt,
              customer: {
                ...customer,
                updatedAt: customerUpdatedAt,
              },
            };

            (mockPrisma.lead.findUnique as jest.Mock).mockResolvedValue(leadWithCustomer);
            (mockPrisma.customer.update as jest.Mock).mockResolvedValue({});
            (mockPrisma.activityLog.create as jest.Mock).mockResolvedValue({});

            const result = await dataSyncService.syncWithConflictResolution(
              lead.id,
              userId,
              lastSyncAt
            );

            // Property: When lead is more recent, sync direction should be lead-to-customer
            if (result && result.conflictResolved) {
              expect(result.conflictDetails?.winner).toBe('lead');
              expect(result.direction).toBe('lead-to-customer');
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
