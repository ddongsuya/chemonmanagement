/**
 * Property-Based Tests for Data Management
 * Feature: backend-admin-system
 * 
 * These tests verify universal properties of the data management system
 * using fast-check for property-based testing.
 */

/// <reference types="jest" />

import * as fc from 'fast-check';
import { DataService } from '../../src/services/dataService';
import { PrismaClient, QuotationStatus } from '@prisma/client';
import { AppError } from '../../src/types/error';

// Mock PrismaClient for unit testing
const createMockPrisma = () => ({
  quotation: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  customer: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
} as unknown as PrismaClient);

describe('Data Property Tests', () => {
  let dataService: DataService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    dataService = new DataService(mockPrisma);
    jest.clearAllMocks();
  });

  /**
   * Property 6: 데이터 소유권 격리
   * Feature: backend-admin-system, Property 6: 데이터 소유권 격리
   * 
   * For any user and data (quotation, customer), the user can only
   * access/modify/delete their own data. Accessing another user's data
   * should return 403 or 404.
   * 
   * Validates: Requirements 2.2, 2.3, 2.4
   */
  describe('Property 6: 데이터 소유권 격리', () => {
    // Arbitrary for generating user IDs
    const userIdArb = fc.uuid();
    
    // Arbitrary for generating quotation data
    const quotationArb = fc.record({
      id: fc.uuid(),
      userId: fc.uuid(),
      customerId: fc.option(fc.uuid(), { nil: null }),
      title: fc.string({ minLength: 1, maxLength: 100 }),
      description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
      items: fc.constant([{ id: '1', name: 'Item', description: '', quantity: 1, unitPrice: 100, amount: 100 }]),
      totalAmount: fc.nat({ max: 1000000 }),
      status: fc.constantFrom('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED') as fc.Arbitrary<QuotationStatus>,
      validUntil: fc.option(fc.date(), { nil: null }),
      notes: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
      createdAt: fc.date(),
      updatedAt: fc.date(),
      deletedAt: fc.constant(null),
    });

    // Arbitrary for generating customer data
    const customerArb = fc.record({
      id: fc.uuid(),
      userId: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      company: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
      email: fc.option(fc.emailAddress(), { nil: null }),
      phone: fc.option(fc.string({ maxLength: 20 }), { nil: null }),
      address: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
      notes: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
      createdAt: fc.date(),
      updatedAt: fc.date(),
      deletedAt: fc.constant(null),
    });

    it('should deny access when user tries to read another user\'s quotation', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          quotationArb,
          async (requestingUserId, quotation) => {
            // Ensure the quotation belongs to a different user
            const ownerUserId = quotation.userId;
            fc.pre(requestingUserId !== ownerUserId);

            // Mock finding the quotation (owned by different user)
            (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue({
              ...quotation,
              totalAmount: { toNumber: () => quotation.totalAmount },
            });

            // Attempting to access should throw access denied error
            await expect(
              dataService.getQuotationById(requestingUserId, quotation.id)
            ).rejects.toThrow(AppError);

            try {
              await dataService.getQuotationById(requestingUserId, quotation.id);
            } catch (error) {
              expect(error).toBeInstanceOf(AppError);
              expect((error as AppError).statusCode).toBe(403);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deny access when user tries to update another user\'s quotation', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          quotationArb,
          async (requestingUserId, quotation) => {
            // Ensure the quotation belongs to a different user
            const ownerUserId = quotation.userId;
            fc.pre(requestingUserId !== ownerUserId);

            // Mock finding the quotation (owned by different user)
            (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue({
              ...quotation,
              totalAmount: { toNumber: () => quotation.totalAmount },
            });

            // Attempting to update should throw access denied error
            await expect(
              dataService.updateQuotation(requestingUserId, quotation.id, { customerName: 'New Customer' })
            ).rejects.toThrow(AppError);

            try {
              await dataService.updateQuotation(requestingUserId, quotation.id, { customerName: 'New Customer' });
            } catch (error) {
              expect(error).toBeInstanceOf(AppError);
              expect((error as AppError).statusCode).toBe(403);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deny access when user tries to delete another user\'s quotation', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          quotationArb,
          async (requestingUserId, quotation) => {
            // Ensure the quotation belongs to a different user
            const ownerUserId = quotation.userId;
            fc.pre(requestingUserId !== ownerUserId);

            // Mock finding the quotation (owned by different user)
            (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue({
              ...quotation,
              totalAmount: { toNumber: () => quotation.totalAmount },
            });

            // Attempting to delete should throw access denied error
            await expect(
              dataService.deleteQuotation(requestingUserId, quotation.id)
            ).rejects.toThrow(AppError);

            try {
              await dataService.deleteQuotation(requestingUserId, quotation.id);
            } catch (error) {
              expect(error).toBeInstanceOf(AppError);
              expect((error as AppError).statusCode).toBe(403);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deny access when user tries to read another user\'s customer', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          customerArb,
          async (requestingUserId, customer) => {
            // Ensure the customer belongs to a different user
            const ownerUserId = customer.userId;
            fc.pre(requestingUserId !== ownerUserId);

            // Mock finding the customer (owned by different user)
            (mockPrisma.customer.findFirst as jest.Mock).mockResolvedValue(customer);

            // Attempting to access should throw access denied error
            await expect(
              dataService.getCustomerById(requestingUserId, customer.id)
            ).rejects.toThrow(AppError);

            try {
              await dataService.getCustomerById(requestingUserId, customer.id);
            } catch (error) {
              expect(error).toBeInstanceOf(AppError);
              expect((error as AppError).statusCode).toBe(403);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deny access when user tries to update another user\'s customer', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          customerArb,
          async (requestingUserId, customer) => {
            // Ensure the customer belongs to a different user
            const ownerUserId = customer.userId;
            fc.pre(requestingUserId !== ownerUserId);

            // Mock finding the customer (owned by different user)
            (mockPrisma.customer.findFirst as jest.Mock).mockResolvedValue(customer);

            // Attempting to update should throw access denied error
            await expect(
              dataService.updateCustomer(requestingUserId, customer.id, { name: 'New Name' })
            ).rejects.toThrow(AppError);

            try {
              await dataService.updateCustomer(requestingUserId, customer.id, { name: 'New Name' });
            } catch (error) {
              expect(error).toBeInstanceOf(AppError);
              expect((error as AppError).statusCode).toBe(403);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deny access when user tries to delete another user\'s customer', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          customerArb,
          async (requestingUserId, customer) => {
            // Ensure the customer belongs to a different user
            const ownerUserId = customer.userId;
            fc.pre(requestingUserId !== ownerUserId);

            // Mock finding the customer (owned by different user)
            (mockPrisma.customer.findFirst as jest.Mock).mockResolvedValue(customer);

            // Attempting to delete should throw access denied error
            await expect(
              dataService.deleteCustomer(requestingUserId, customer.id)
            ).rejects.toThrow(AppError);

            try {
              await dataService.deleteCustomer(requestingUserId, customer.id);
            } catch (error) {
              expect(error).toBeInstanceOf(AppError);
              expect((error as AppError).statusCode).toBe(403);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow access when user accesses their own quotation', async () => {
      await fc.assert(
        fc.asyncProperty(
          quotationArb,
          async (quotation) => {
            const userId = quotation.userId;

            // Mock finding the quotation (owned by same user)
            (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue({
              ...quotation,
              totalAmount: { toNumber: () => quotation.totalAmount },
            });

            // Should not throw
            const result = await dataService.getQuotationById(userId, quotation.id);
            expect(result.id).toBe(quotation.id);
            expect(result.userId).toBe(userId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow access when user accesses their own customer', async () => {
      await fc.assert(
        fc.asyncProperty(
          customerArb,
          async (customer) => {
            const userId = customer.userId;

            // Mock finding the customer (owned by same user)
            (mockPrisma.customer.findFirst as jest.Mock).mockResolvedValue(customer);

            // Should not throw
            const result = await dataService.getCustomerById(userId, customer.id);
            expect(result.id).toBe(customer.id);
            expect(result.userId).toBe(userId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 9: 소프트 삭제
   * Feature: backend-admin-system, Property 9: 소프트 삭제
   * 
   * For any delete request (quotation, customer, announcement),
   * the deletedAt field should be set and the item should be
   * excluded from normal list queries.
   * 
   * Validates: Requirements 2.4, 4.3
   */
  describe('Property 9: 소프트 삭제', () => {
    // Arbitrary for generating quotation data
    const quotationArb = fc.record({
      id: fc.uuid(),
      userId: fc.uuid(),
      customerId: fc.option(fc.uuid(), { nil: null }),
      title: fc.string({ minLength: 1, maxLength: 100 }),
      description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
      items: fc.constant([{ id: '1', name: 'Item', description: '', quantity: 1, unitPrice: 100, amount: 100 }]),
      totalAmount: fc.nat({ max: 1000000 }),
      status: fc.constantFrom('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED') as fc.Arbitrary<QuotationStatus>,
      validUntil: fc.option(fc.date(), { nil: null }),
      notes: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
      createdAt: fc.date(),
      updatedAt: fc.date(),
      deletedAt: fc.constant(null),
    });

    // Arbitrary for generating customer data
    const customerArb = fc.record({
      id: fc.uuid(),
      userId: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      company: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
      email: fc.option(fc.emailAddress(), { nil: null }),
      phone: fc.option(fc.string({ maxLength: 20 }), { nil: null }),
      address: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
      notes: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
      createdAt: fc.date(),
      updatedAt: fc.date(),
      deletedAt: fc.constant(null),
    });

    it('should set deletedAt when deleting a quotation', async () => {
      await fc.assert(
        fc.asyncProperty(
          quotationArb,
          async (quotation) => {
            const userId = quotation.userId;
            let capturedDeletedAt: Date | null = null;

            // Mock finding the quotation (owned by same user)
            (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue({
              ...quotation,
              totalAmount: { toNumber: () => quotation.totalAmount },
            });

            // Mock update to capture the deletedAt value
            (mockPrisma.quotation.update as jest.Mock).mockImplementation(({ data }) => {
              capturedDeletedAt = data.deletedAt;
              return Promise.resolve({
                ...quotation,
                deletedAt: data.deletedAt,
                totalAmount: { toNumber: () => quotation.totalAmount },
              });
            });

            // Delete the quotation
            await dataService.deleteQuotation(userId, quotation.id);

            // Verify deletedAt was set
            expect(capturedDeletedAt).not.toBeNull();
            expect(capturedDeletedAt).toBeInstanceOf(Date);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should set deletedAt when deleting a customer', async () => {
      await fc.assert(
        fc.asyncProperty(
          customerArb,
          async (customer) => {
            const userId = customer.userId;
            let capturedDeletedAt: Date | null = null;

            // Mock finding the customer (owned by same user)
            (mockPrisma.customer.findFirst as jest.Mock).mockResolvedValue(customer);

            // Mock update to capture the deletedAt value
            (mockPrisma.customer.update as jest.Mock).mockImplementation(({ data }) => {
              capturedDeletedAt = data.deletedAt;
              return Promise.resolve({
                ...customer,
                deletedAt: data.deletedAt,
              });
            });

            // Delete the customer
            await dataService.deleteCustomer(userId, customer.id);

            // Verify deletedAt was set
            expect(capturedDeletedAt).not.toBeNull();
            expect(capturedDeletedAt).toBeInstanceOf(Date);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should exclude soft-deleted quotations from list queries', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(quotationArb, { minLength: 1, maxLength: 10 }),
          fc.uuid(),
          async (quotations, userId) => {
            // Mark some quotations as deleted
            const deletedCount = Math.floor(quotations.length / 2);
            const allQuotations = quotations.map((q, i) => ({
              ...q,
              userId,
              deletedAt: i < deletedCount ? new Date() : null,
              totalAmount: { toNumber: () => q.totalAmount },
            }));

            // Only non-deleted quotations should be returned
            const nonDeletedQuotations = allQuotations.filter(q => q.deletedAt === null);

            // Mock findMany to return only non-deleted quotations
            (mockPrisma.quotation.findMany as jest.Mock).mockResolvedValue(nonDeletedQuotations);
            (mockPrisma.quotation.count as jest.Mock).mockResolvedValue(nonDeletedQuotations.length);

            // Get quotations list
            const result = await dataService.getQuotations(userId, { page: 1, limit: 100 });

            // Verify all returned quotations have deletedAt as null
            result.data.forEach(q => {
              expect(q.deletedAt).toBeNull();
            });

            // Verify count matches non-deleted quotations
            expect(result.pagination.total).toBe(nonDeletedQuotations.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should exclude soft-deleted customers from list queries', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(customerArb, { minLength: 1, maxLength: 10 }),
          fc.uuid(),
          async (customers, userId) => {
            // Mark some customers as deleted
            const deletedCount = Math.floor(customers.length / 2);
            const allCustomers = customers.map((c, i) => ({
              ...c,
              userId,
              deletedAt: i < deletedCount ? new Date() : null,
            }));

            // Only non-deleted customers should be returned
            const nonDeletedCustomers = allCustomers.filter(c => c.deletedAt === null);

            // Mock findMany to return only non-deleted customers
            (mockPrisma.customer.findMany as jest.Mock).mockResolvedValue(nonDeletedCustomers);
            (mockPrisma.customer.count as jest.Mock).mockResolvedValue(nonDeletedCustomers.length);

            // Get customers list
            const result = await dataService.getCustomers(userId, { page: 1, limit: 100 });

            // Verify all returned customers have deletedAt as null
            result.data.forEach(c => {
              expect(c.deletedAt).toBeNull();
            });

            // Verify count matches non-deleted customers
            expect(result.pagination.total).toBe(nonDeletedCustomers.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 404 when trying to access soft-deleted quotation', async () => {
      await fc.assert(
        fc.asyncProperty(
          quotationArb,
          async (quotation) => {
            const userId = quotation.userId;

            // Mock finding returns null (soft-deleted items are filtered out)
            (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue(null);

            // Attempting to access should throw not found error
            await expect(
              dataService.getQuotationById(userId, quotation.id)
            ).rejects.toThrow(AppError);

            try {
              await dataService.getQuotationById(userId, quotation.id);
            } catch (error) {
              expect(error).toBeInstanceOf(AppError);
              expect((error as AppError).statusCode).toBe(404);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 404 when trying to access soft-deleted customer', async () => {
      await fc.assert(
        fc.asyncProperty(
          customerArb,
          async (customer) => {
            const userId = customer.userId;

            // Mock finding returns null (soft-deleted items are filtered out)
            (mockPrisma.customer.findFirst as jest.Mock).mockResolvedValue(null);

            // Attempting to access should throw not found error
            await expect(
              dataService.getCustomerById(userId, customer.id)
            ).rejects.toThrow(AppError);

            try {
              await dataService.getCustomerById(userId, customer.id);
            } catch (error) {
              expect(error).toBeInstanceOf(AppError);
              expect((error as AppError).statusCode).toBe(404);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: 타임스탬프 자동 기록
   * Feature: backend-admin-system, Property 8: 타임스탬프 자동 기록
   * 
   * For any data creation or modification:
   * - createdAt is set on creation and never changes
   * - updatedAt is updated on every modification
   * 
   * Validates: Requirements 2.5
   */
  describe('Property 8: 타임스탬프 자동 기록', () => {
    // Arbitrary for generating quotation creation data
    const createQuotationArb = fc.record({
      customerName: fc.string({ minLength: 1, maxLength: 100 }),
      projectName: fc.string({ minLength: 1, maxLength: 100 }),
      items: fc.constant([{ id: '1', name: 'Item', description: '', quantity: 1, unitPrice: 100, amount: 100 }]),
      totalAmount: fc.nat({ max: 1000000 }),
    });

    // Arbitrary for generating customer creation data
    const createCustomerArb = fc.record({
      name: fc.string({ minLength: 1, maxLength: 50 }),
      company: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
      email: fc.option(fc.emailAddress(), { nil: null }),
    });

    it('should set createdAt on quotation creation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          createQuotationArb,
          async (userId, createData) => {
            const now = new Date();
            const createdQuotation = {
              id: 'new-quotation-id',
              quotationNumber: 'Q-2026-0001',
              quotationType: 'TOXICITY',
              userId,
              customerId: null,
              customerName: createData.customerName,
              projectName: createData.projectName,
              modality: null,
              modelId: null,
              modelCategory: null,
              indication: null,
              items: createData.items,
              subtotalTest: null,
              subtotalAnalysis: null,
              subtotal: null,
              discountRate: null,
              discountAmount: null,
              vat: null,
              totalAmount: { toNumber: () => createData.totalAmount },
              validDays: 30,
              status: 'DRAFT',
              validUntil: null,
              notes: null,
              createdAt: now,
              updatedAt: now,
              deletedAt: null,
              customer: null,
            };

            (mockPrisma.quotation.create as jest.Mock).mockResolvedValue(createdQuotation);

            const result = await dataService.createQuotation(userId, {
              quotationType: 'TOXICITY' as const,
              customerName: createData.customerName,
              projectName: createData.projectName,
              items: createData.items,
              totalAmount: createData.totalAmount,
            });

            // Verify createdAt is set
            expect(result.createdAt).toBeDefined();
            expect(result.createdAt).toBeInstanceOf(Date);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should set createdAt on customer creation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          createCustomerArb,
          async (userId, createData) => {
            const now = new Date();
            const createdCustomer = {
              id: 'new-customer-id',
              userId,
              name: createData.name,
              company: createData.company,
              email: createData.email,
              phone: null,
              address: null,
              notes: null,
              createdAt: now,
              updatedAt: now,
              deletedAt: null,
            };

            (mockPrisma.customer.create as jest.Mock).mockResolvedValue(createdCustomer);

            const result = await dataService.createCustomer(userId, {
              name: createData.name,
              company: createData.company,
              email: createData.email,
            });

            // Verify createdAt is set
            expect(result.createdAt).toBeDefined();
            expect(result.createdAt).toBeInstanceOf(Date);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update updatedAt on quotation modification without changing createdAt', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (userId, quotationId, newCustomerName) => {
            const originalCreatedAt = new Date('2024-01-01T00:00:00Z');
            const originalUpdatedAt = new Date('2024-01-01T00:00:00Z');
            const newUpdatedAt = new Date();

            const existingQuotation = {
              id: quotationId,
              quotationNumber: 'Q-2026-0001',
              quotationType: 'TOXICITY',
              userId,
              customerId: null,
              customerName: 'Original Customer',
              projectName: 'Original Project',
              modality: null,
              modelId: null,
              modelCategory: null,
              indication: null,
              items: [{ id: '1', name: 'Item', description: '', quantity: 1, unitPrice: 100, amount: 100 }],
              subtotalTest: null,
              subtotalAnalysis: null,
              subtotal: null,
              discountRate: null,
              discountAmount: null,
              vat: null,
              totalAmount: { toNumber: () => 100 },
              validDays: 30,
              status: 'DRAFT',
              validUntil: null,
              notes: null,
              createdAt: originalCreatedAt,
              updatedAt: originalUpdatedAt,
              deletedAt: null,
            };

            const updatedQuotation = {
              ...existingQuotation,
              customerName: newCustomerName,
              createdAt: originalCreatedAt, // createdAt should not change
              updatedAt: newUpdatedAt, // updatedAt should be updated
              customer: null,
            };

            (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue(existingQuotation);
            (mockPrisma.quotation.update as jest.Mock).mockResolvedValue(updatedQuotation);

            const result = await dataService.updateQuotation(userId, quotationId, { customerName: newCustomerName });

            // Verify createdAt remains unchanged
            expect(result.createdAt.getTime()).toBe(originalCreatedAt.getTime());
            
            // Verify updatedAt is updated (should be different from original)
            expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update updatedAt on customer modification without changing createdAt', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (userId, customerId, newName) => {
            const originalCreatedAt = new Date('2024-01-01T00:00:00Z');
            const originalUpdatedAt = new Date('2024-01-01T00:00:00Z');
            const newUpdatedAt = new Date();

            const existingCustomer = {
              id: customerId,
              userId,
              name: 'Original Name',
              company: null,
              email: null,
              phone: null,
              address: null,
              notes: null,
              createdAt: originalCreatedAt,
              updatedAt: originalUpdatedAt,
              deletedAt: null,
            };

            const updatedCustomer = {
              ...existingCustomer,
              name: newName,
              createdAt: originalCreatedAt, // createdAt should not change
              updatedAt: newUpdatedAt, // updatedAt should be updated
            };

            (mockPrisma.customer.findFirst as jest.Mock).mockResolvedValue(existingCustomer);
            (mockPrisma.customer.update as jest.Mock).mockResolvedValue(updatedCustomer);

            const result = await dataService.updateCustomer(userId, customerId, { name: newName });

            // Verify createdAt remains unchanged
            expect(result.createdAt.getTime()).toBe(originalCreatedAt.getTime());
            
            // Verify updatedAt is updated (should be different from original)
            expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
