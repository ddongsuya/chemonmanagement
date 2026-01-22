/**
 * Integration Tests for Quotation Management
 * 
 * 핵심 시나리오:
 * 1. 견적서 생성 (Create Quotation)
 * 2. 견적서 조회 (Get Quotation)
 * 3. 견적서 수정 (Update Quotation)
 * 4. 견적서 상태 변경 (Status Change: DRAFT → SENT → ACCEPTED)
 * 5. 견적서 삭제 (Delete Quotation)
 */

import { PrismaClient } from '@prisma/client';
import { DataService } from '../../src/services/dataService';
import { AuthService } from '../../src/services/authService';

// Test database connection
const prisma = new PrismaClient();
let dataService: DataService;
let authService: AuthService;

// Test user data
let testUserId: string;
let testCustomerId: string;

describe('Quotation Integration Tests', () => {
  beforeAll(async () => {
    dataService = new DataService(prisma);
    authService = new AuthService(prisma);

    // Create test user
    const hashedPassword = await authService.hashPassword('testPassword123!');
    const testUser = await prisma.user.create({
      data: {
        email: `test-quotation-${Date.now()}@example.com`,
        password: hashedPassword,
        name: 'Test User',
        role: 'USER',
        status: 'ACTIVE',
      },
    });
    testUserId = testUser.id;

    // Create test customer
    const testCustomer = await prisma.customer.create({
      data: {
        userId: testUserId,
        name: 'Test Customer',
        company: 'Test Company',
        email: 'customer@test.com',
        phone: '010-1234-5678',
      },
    });
    testCustomerId = testCustomer.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.quotation.deleteMany({ where: { userId: testUserId } });
    await prisma.customer.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  describe('Scenario 1: 견적서 생성 (Create Quotation)', () => {
    it('should create a new quotation with valid data', async () => {
      const quotationData = {
        quotationType: 'TOXICITY' as const,
        customerId: testCustomerId,
        customerName: 'Test Customer',
        projectName: 'Test Project',
        modality: 'Small Molecule',
        items: [
          {
            test_name: '단회투여독성시험',
            species: 'Rat',
            duration: '14일',
            unit_price: 5000000,
            quantity: 1,
            total_price: 5000000,
          },
        ],
        subtotalTest: 5000000,
        subtotalAnalysis: 1000000,
        subtotal: 6000000,
        discountRate: 0,
        discountAmount: 0,
        totalAmount: 6000000,
        validDays: 30,
        notes: 'Test quotation',
        status: 'DRAFT' as const,
      };

      const result = await dataService.createQuotation(testUserId, quotationData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.quotationNumber).toMatch(/^TQ-\d{4}-\d{4}$/);
      expect(result.quotationType).toBe('TOXICITY');
      expect(result.customerName).toBe('Test Customer');
      expect(result.projectName).toBe('Test Project');
      expect(result.totalAmount).toBe(6000000);
      expect(result.status).toBe('DRAFT');
    });

    it('should generate unique quotation numbers', async () => {
      const quotationData = {
        quotationType: 'TOXICITY' as const,
        customerName: 'Test Customer 2',
        projectName: 'Test Project 2',
        items: [],
        totalAmount: 1000000,
        validDays: 30,
      };

      const result1 = await dataService.createQuotation(testUserId, quotationData);
      const result2 = await dataService.createQuotation(testUserId, quotationData);

      expect(result1.quotationNumber).not.toBe(result2.quotationNumber);
    });

    it('should create efficacy quotation with EQ prefix', async () => {
      const quotationData = {
        quotationType: 'EFFICACY' as const,
        customerName: 'Test Customer',
        projectName: 'Efficacy Test Project',
        items: [],
        totalAmount: 3000000,
        validDays: 30,
      };

      const result = await dataService.createQuotation(testUserId, quotationData);

      expect(result.quotationNumber).toMatch(/^EQ-\d{4}-\d{4}$/);
      expect(result.quotationType).toBe('EFFICACY');
    });
  });

  describe('Scenario 2: 견적서 조회 (Get Quotation)', () => {
    let createdQuotationId: string;

    beforeAll(async () => {
      const quotation = await dataService.createQuotation(testUserId, {
        quotationType: 'TOXICITY',
        customerName: 'Query Test Customer',
        projectName: 'Query Test Project',
        items: [],
        totalAmount: 2000000,
        validDays: 30,
      });
      createdQuotationId = quotation.id;
    });

    it('should get quotation by ID', async () => {
      const result = await dataService.getQuotationById(testUserId, createdQuotationId);

      expect(result).toBeDefined();
      expect(result.id).toBe(createdQuotationId);
      expect(result.customerName).toBe('Query Test Customer');
    });

    it('should throw error for non-existent quotation', async () => {
      await expect(
        dataService.getQuotationById(testUserId, 'non-existent-id')
      ).rejects.toThrow('견적서를 찾을 수 없습니다');
    });

    it('should get quotations list with pagination', async () => {
      const result = await dataService.getQuotations(testUserId, {
        page: 1,
        limit: 10,
      });

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it('should filter quotations by search term', async () => {
      const result = await dataService.getQuotations(testUserId, {
        page: 1,
        limit: 10,
        search: 'Query Test',
      });

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.some(q => q.customerName.includes('Query Test'))).toBe(true);
    });
  });

  describe('Scenario 3: 견적서 수정 (Update Quotation)', () => {
    let quotationToUpdate: { id: string; quotationNumber: string };

    beforeAll(async () => {
      quotationToUpdate = await dataService.createQuotation(testUserId, {
        quotationType: 'TOXICITY',
        customerName: 'Update Test Customer',
        projectName: 'Update Test Project',
        items: [],
        totalAmount: 1500000,
        validDays: 30,
      });
    });

    it('should update quotation details', async () => {
      const result = await dataService.updateQuotation(testUserId, quotationToUpdate.id, {
        customerName: 'Updated Customer Name',
        projectName: 'Updated Project Name',
        totalAmount: 2500000,
        notes: 'Updated notes',
      });

      expect(result.customerName).toBe('Updated Customer Name');
      expect(result.projectName).toBe('Updated Project Name');
      expect(result.totalAmount).toBe(2500000);
      expect(result.notes).toBe('Updated notes');
    });

    it('should not change quotation number on update', async () => {
      const result = await dataService.updateQuotation(testUserId, quotationToUpdate.id, {
        customerName: 'Another Update',
      });

      expect(result.quotationNumber).toBe(quotationToUpdate.quotationNumber);
    });
  });

  describe('Scenario 4: 견적서 상태 변경 (Status Change)', () => {
    let quotationForStatus: { id: string };

    beforeAll(async () => {
      quotationForStatus = await dataService.createQuotation(testUserId, {
        quotationType: 'TOXICITY',
        customerName: 'Status Test Customer',
        projectName: 'Status Test Project',
        items: [],
        totalAmount: 3000000,
        validDays: 30,
        status: 'DRAFT',
      });
    });

    it('should change status from DRAFT to SENT', async () => {
      const result = await dataService.updateQuotation(testUserId, quotationForStatus.id, {
        status: 'SENT',
      });

      expect(result.status).toBe('SENT');
    });

    it('should change status from SENT to ACCEPTED', async () => {
      const result = await dataService.updateQuotation(testUserId, quotationForStatus.id, {
        status: 'ACCEPTED',
      });

      expect(result.status).toBe('ACCEPTED');
    });

    it('should allow status change to REJECTED', async () => {
      // Create new quotation for rejection test
      const quotation = await dataService.createQuotation(testUserId, {
        quotationType: 'TOXICITY',
        customerName: 'Rejection Test',
        projectName: 'Rejection Project',
        items: [],
        totalAmount: 1000000,
        validDays: 30,
        status: 'SENT',
      });

      const result = await dataService.updateQuotation(testUserId, quotation.id, {
        status: 'REJECTED',
      });

      expect(result.status).toBe('REJECTED');
    });
  });

  describe('Scenario 5: 견적서 삭제 (Delete Quotation)', () => {
    it('should soft delete quotation', async () => {
      const quotation = await dataService.createQuotation(testUserId, {
        quotationType: 'TOXICITY',
        customerName: 'Delete Test Customer',
        projectName: 'Delete Test Project',
        items: [],
        totalAmount: 500000,
        validDays: 30,
      });

      await dataService.deleteQuotation(testUserId, quotation.id);

      // Should not be found after deletion
      await expect(
        dataService.getQuotationById(testUserId, quotation.id)
      ).rejects.toThrow('견적서를 찾을 수 없습니다');
    });

    it('should not delete quotation of another user', async () => {
      // Create another user
      const anotherUser = await prisma.user.create({
        data: {
          email: `another-user-${Date.now()}@example.com`,
          password: 'hashedPassword',
          name: 'Another User',
          role: 'USER',
          status: 'ACTIVE',
        },
      });

      const quotation = await dataService.createQuotation(anotherUser.id, {
        quotationType: 'TOXICITY',
        customerName: 'Another User Customer',
        projectName: 'Another User Project',
        items: [],
        totalAmount: 1000000,
        validDays: 30,
      });

      // Try to delete with different user
      await expect(
        dataService.deleteQuotation(testUserId, quotation.id)
      ).rejects.toThrow('접근 권한이 없습니다');

      // Cleanup
      await prisma.quotation.deleteMany({ where: { userId: anotherUser.id } });
      await prisma.user.delete({ where: { id: anotherUser.id } });
    });
  });

  describe('Scenario 6: 동시성 테스트 (Concurrency)', () => {
    it('should handle concurrent quotation creation', async () => {
      const createPromises = Array(5).fill(null).map((_, index) =>
        dataService.createQuotation(testUserId, {
          quotationType: 'TOXICITY',
          customerName: `Concurrent Customer ${index}`,
          projectName: `Concurrent Project ${index}`,
          items: [],
          totalAmount: 1000000 + index * 100000,
          validDays: 30,
        })
      );

      const results = await Promise.all(createPromises);

      // All quotations should be created with unique numbers
      const quotationNumbers = results.map(r => r.quotationNumber);
      const uniqueNumbers = new Set(quotationNumbers);
      
      expect(uniqueNumbers.size).toBe(5);
    });
  });
});
