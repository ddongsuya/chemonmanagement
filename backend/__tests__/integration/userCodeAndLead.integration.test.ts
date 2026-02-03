/**
 * Integration Tests for User Code and Lead APIs
 * 
 * 핵심 시나리오:
 * 1. 코드 검증 API 테스트 (User Code Validation API)
 * 2. 코드 저장 API 테스트 (User Code Save API)
 * 3. 리드 생성 API 테스트 (Lead Creation API)
 * 
 * Requirements:
 * - 3.1: 새 리드 생성 시 사용자의 User_Code를 접두사로 사용하여 Lead_Number 생성
 * - 3.4: User_Code 미설정 시 오류 메시지 표시
 * - 4.1: 새 User_Code 설정 시 다른 사용자가 이미 사용 중인 코드인지 확인
 * - 4.2: 중복 시 오류 메시지 표시
 */

/// <reference types="jest" />

import { PrismaClient } from '@prisma/client';
import { UserCodeValidator } from '../../src/services/userCodeValidator';
import { LeadNumberService, UserCodeNotSetError } from '../../src/services/leadNumberService';
import { AuthService } from '../../src/services/authService';

// Test database connection
const prisma = new PrismaClient();
let userCodeValidator: UserCodeValidator;
let leadNumberService: LeadNumberService;
let authService: AuthService;

// Test user data
let testUser1Id: string;
let testUser2Id: string;
let testStageId: string;

describe('User Code and Lead API Integration Tests', () => {
  beforeAll(async () => {
    userCodeValidator = new UserCodeValidator(prisma);
    leadNumberService = new LeadNumberService(prisma);
    authService = new AuthService(prisma);

    // Create test user 1
    const hashedPassword1 = await authService.hashPassword('testPassword123!');
    const testUser1 = await prisma.user.create({
      data: {
        email: `test-usercode-1-${Date.now()}@example.com`,
        password: hashedPassword1,
        name: 'Test User 1',
        role: 'USER',
        status: 'ACTIVE',
      },
    });
    testUser1Id = testUser1.id;

    // Create test user 2
    const hashedPassword2 = await authService.hashPassword('testPassword456!');
    const testUser2 = await prisma.user.create({
      data: {
        email: `test-usercode-2-${Date.now()}@example.com`,
        password: hashedPassword2,
        name: 'Test User 2',
        role: 'USER',
        status: 'ACTIVE',
      },
    });
    testUser2Id = testUser2.id;

    // Create or find a test pipeline stage for lead creation
    const existingStage = await prisma.pipelineStage.findFirst({
      where: { isActive: true },
    });

    if (existingStage) {
      testStageId = existingStage.id;
    } else {
      const newStage = await prisma.pipelineStage.create({
        data: {
          name: 'Test Stage',
          code: 'TEST',
          order: 1,
          isDefault: true,
          isActive: true,
        },
      });
      testStageId = newStage.id;
    }
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.lead.deleteMany({ 
      where: { 
        userId: { in: [testUser1Id, testUser2Id] } 
      } 
    });
    await prisma.userSettings.deleteMany({ 
      where: { 
        userId: { in: [testUser1Id, testUser2Id] } 
      } 
    });
    await prisma.user.deleteMany({ 
      where: { 
        id: { in: [testUser1Id, testUser2Id] } 
      } 
    });
    await prisma.$disconnect();
  });

  describe('Scenario 1: 코드 검증 API 테스트 (User Code Validation)', () => {
    beforeEach(async () => {
      // Clean up user settings before each test
      await prisma.userSettings.deleteMany({
        where: { userId: { in: [testUser1Id, testUser2Id] } },
      });
    });

    /**
     * Requirement 4.1: 새 User_Code 설정 시 다른 사용자가 이미 사용 중인 코드인지 확인
     */
    it('should validate user code format - valid 2-letter code', async () => {
      const isValid = userCodeValidator.isValidFormat('DL');
      expect(isValid).toBe(true);
    });

    it('should validate user code format - lowercase is valid', async () => {
      const isValid = userCodeValidator.isValidFormat('dl');
      expect(isValid).toBe(true);
    });

    it('should reject invalid user code format - single letter', async () => {
      const isValid = userCodeValidator.isValidFormat('D');
      expect(isValid).toBe(false);
    });

    it('should reject invalid user code format - three letters', async () => {
      const isValid = userCodeValidator.isValidFormat('DLK');
      expect(isValid).toBe(false);
    });

    it('should reject invalid user code format - numbers', async () => {
      const isValid = userCodeValidator.isValidFormat('D1');
      expect(isValid).toBe(false);
    });

    it('should reject invalid user code format - empty string', async () => {
      const isValid = userCodeValidator.isValidFormat('');
      expect(isValid).toBe(false);
    });

    /**
     * Requirement 4.1, 4.2: 중복 검사 - 다른 사용자가 사용 중인 코드
     */
    it('should detect duplicate user code used by another user', async () => {
      // User 1 sets code 'AB'
      await prisma.userSettings.create({
        data: {
          userId: testUser1Id,
          userCode: 'AB',
        },
      });

      // User 2 tries to use the same code
      const result = await userCodeValidator.validateUniqueness('AB', testUser2Id);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('이미 사용 중인 견적서 코드입니다');
    });

    /**
     * Requirement 4.3: 대소문자 구분 없이 중복 검사
     */
    it('should detect duplicate case-insensitively', async () => {
      // User 1 sets code 'CD' (uppercase)
      await prisma.userSettings.create({
        data: {
          userId: testUser1Id,
          userCode: 'CD',
        },
      });

      // User 2 tries to use 'cd' (lowercase) - should be detected as duplicate
      const result = await userCodeValidator.validateUniqueness('cd', testUser2Id);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('이미 사용 중인 견적서 코드입니다');
    });

    /**
     * Requirement 4.5: 자신의 기존 코드와 동일한 경우 중복 오류 없이 허용
     */
    it('should allow user to keep their own existing code', async () => {
      // User 1 sets code 'EF'
      await prisma.userSettings.create({
        data: {
          userId: testUser1Id,
          userCode: 'EF',
        },
      });

      // User 1 validates the same code - should be allowed
      const result = await userCodeValidator.validateUniqueness('EF', testUser1Id);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should allow unique code that no one is using', async () => {
      // No one has 'GH' code
      const result = await userCodeValidator.validateUniqueness('GH', testUser1Id);

      expect(result.isValid).toBe(true);
      expect(result.normalizedCode).toBe('GH');
    });

    /**
     * Requirement 4.6: 코드 정규화 - 대문자로 변환
     */
    it('should normalize code to uppercase', () => {
      expect(userCodeValidator.normalizeCode('dl')).toBe('DL');
      expect(userCodeValidator.normalizeCode('Dl')).toBe('DL');
      expect(userCodeValidator.normalizeCode('dL')).toBe('DL');
      expect(userCodeValidator.normalizeCode('DL')).toBe('DL');
    });
  });

  describe('Scenario 2: 코드 저장 API 테스트 (User Code Save)', () => {
    beforeEach(async () => {
      // Clean up user settings before each test
      await prisma.userSettings.deleteMany({
        where: { userId: { in: [testUser1Id, testUser2Id] } },
      });
    });

    /**
     * Requirement 4.6: 저장 시 대문자로 정규화
     */
    it('should save user code as uppercase', async () => {
      // Validate first
      const validationResult = await userCodeValidator.validateUniqueness('ij', testUser1Id);
      expect(validationResult.isValid).toBe(true);

      // Save with lowercase
      const normalizedCode = userCodeValidator.normalizeCode('ij');
      await prisma.userSettings.create({
        data: {
          userId: testUser1Id,
          userCode: normalizedCode,
        },
      });

      // Verify it's saved as uppercase
      const savedSettings = await prisma.userSettings.findUnique({
        where: { userId: testUser1Id },
      });

      expect(savedSettings?.userCode).toBe('IJ');
    });

    /**
     * Requirement 4.1, 4.2: 저장 전 중복 검사 수행
     */
    it('should reject saving duplicate code', async () => {
      // User 1 sets code 'KL'
      await prisma.userSettings.create({
        data: {
          userId: testUser1Id,
          userCode: 'KL',
        },
      });

      // User 2 tries to save the same code - validation should fail
      const validationResult = await userCodeValidator.validateUniqueness('KL', testUser2Id);

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.error).toBe('이미 사용 중인 견적서 코드입니다');
    });

    /**
     * Requirement 4.5: 자신의 코드 업데이트 허용
     */
    it('should allow updating own code to the same value', async () => {
      // User 1 sets code 'MN'
      await prisma.userSettings.create({
        data: {
          userId: testUser1Id,
          userCode: 'MN',
        },
      });

      // User 1 validates and updates to the same code
      const validationResult = await userCodeValidator.validateUniqueness('MN', testUser1Id);
      expect(validationResult.isValid).toBe(true);

      // Update should succeed
      await prisma.userSettings.update({
        where: { userId: testUser1Id },
        data: { userCode: 'MN' },
      });

      const savedSettings = await prisma.userSettings.findUnique({
        where: { userId: testUser1Id },
      });

      expect(savedSettings?.userCode).toBe('MN');
    });

    it('should allow changing to a new unique code', async () => {
      // User 1 sets code 'OP'
      await prisma.userSettings.create({
        data: {
          userId: testUser1Id,
          userCode: 'OP',
        },
      });

      // User 1 validates new code 'QR'
      const validationResult = await userCodeValidator.validateUniqueness('QR', testUser1Id);
      expect(validationResult.isValid).toBe(true);

      // Update to new code
      await prisma.userSettings.update({
        where: { userId: testUser1Id },
        data: { userCode: 'QR' },
      });

      const savedSettings = await prisma.userSettings.findUnique({
        where: { userId: testUser1Id },
      });

      expect(savedSettings?.userCode).toBe('QR');
    });
  });

  describe('Scenario 3: 리드 생성 API 테스트 (Lead Creation)', () => {
    beforeEach(async () => {
      // Clean up leads and user settings before each test
      await prisma.lead.deleteMany({
        where: { userId: { in: [testUser1Id, testUser2Id] } },
      });
      await prisma.userSettings.deleteMany({
        where: { userId: { in: [testUser1Id, testUser2Id] } },
      });
    });

    /**
     * Requirement 3.1: 새 리드 생성 시 사용자의 User_Code를 접두사로 사용하여 Lead_Number 생성
     */
    it('should generate lead number with user code prefix', async () => {
      // Set user code 'ST'
      await prisma.userSettings.create({
        data: {
          userId: testUser1Id,
          userCode: 'ST',
        },
      });

      // Generate lead number
      const leadNumber = await leadNumberService.generateLeadNumber(testUser1Id);

      // Format: UC-YYYY-NNNN (e.g., ST-2025-0001)
      const currentYear = new Date().getFullYear();
      expect(leadNumber).toMatch(new RegExp(`^ST-${currentYear}-\\d{4}$`));
      expect(leadNumber).toBe(`ST-${currentYear}-0001`);
    });

    /**
     * Requirement 3.1: 리드 번호 형식 검증 (UC-YYYY-NNNN)
     */
    it('should generate lead number in correct format UC-YYYY-NNNN', async () => {
      // Set user code 'UV'
      await prisma.userSettings.create({
        data: {
          userId: testUser1Id,
          userCode: 'UV',
        },
      });

      const leadNumber = await leadNumberService.generateLeadNumber(testUser1Id);

      // Verify format: UC-YYYY-NNNN
      const parts = leadNumber.split('-');
      expect(parts.length).toBe(3);
      expect(parts[0]).toBe('UV'); // User code
      expect(parts[1]).toMatch(/^\d{4}$/); // 4-digit year
      expect(parts[2]).toMatch(/^\d{4}$/); // 4-digit sequence
    });

    /**
     * Requirement 3.4: User_Code 미설정 시 오류 메시지 표시
     */
    it('should throw error when user code is not set', async () => {
      // No user settings created - user code is not set

      await expect(
        leadNumberService.generateLeadNumber(testUser1Id)
      ).rejects.toThrow(UserCodeNotSetError);

      await expect(
        leadNumberService.generateLeadNumber(testUser1Id)
      ).rejects.toThrow('견적서 코드가 설정되지 않았습니다');
    });

    /**
     * Requirement 3.3: 리드 번호 생성 시 일련번호 순차 증가
     */
    it('should increment lead sequence number', async () => {
      // Set user code 'WX'
      await prisma.userSettings.create({
        data: {
          userId: testUser1Id,
          userCode: 'WX',
        },
      });

      const currentYear = new Date().getFullYear();

      // Generate first lead number
      const leadNumber1 = await leadNumberService.generateLeadNumber(testUser1Id);
      expect(leadNumber1).toBe(`WX-${currentYear}-0001`);

      // Create lead with this number to simulate actual lead creation
      await prisma.lead.create({
        data: {
          leadNumber: leadNumber1,
          userId: testUser1Id,
          companyName: 'Test Company 1',
          contactName: 'Test Contact 1',
          status: 'NEW',
          stageId: testStageId,
        },
      });

      // Generate second lead number
      const leadNumber2 = await leadNumberService.generateLeadNumber(testUser1Id);
      expect(leadNumber2).toBe(`WX-${currentYear}-0002`);

      // Create second lead
      await prisma.lead.create({
        data: {
          leadNumber: leadNumber2,
          userId: testUser1Id,
          companyName: 'Test Company 2',
          contactName: 'Test Contact 2',
          status: 'NEW',
          stageId: testStageId,
        },
      });

      // Generate third lead number
      const leadNumber3 = await leadNumberService.generateLeadNumber(testUser1Id);
      expect(leadNumber3).toBe(`WX-${currentYear}-0003`);
    });

    /**
     * Requirement 3.1: 다른 사용자는 독립적인 리드 번호 시퀀스를 가짐
     */
    it('should maintain separate lead sequences for different users', async () => {
      // Set user codes for both users
      await prisma.userSettings.create({
        data: {
          userId: testUser1Id,
          userCode: 'YZ',
        },
      });

      await prisma.userSettings.create({
        data: {
          userId: testUser2Id,
          userCode: 'AA',
        },
      });

      const currentYear = new Date().getFullYear();

      // Generate lead for user 1
      const leadNumber1 = await leadNumberService.generateLeadNumber(testUser1Id);
      expect(leadNumber1).toBe(`YZ-${currentYear}-0001`);

      // Create lead for user 1
      await prisma.lead.create({
        data: {
          leadNumber: leadNumber1,
          userId: testUser1Id,
          companyName: 'User1 Company',
          contactName: 'User1 Contact',
          status: 'NEW',
          stageId: testStageId,
        },
      });

      // Generate lead for user 2 - should start at 0001, not 0002
      const leadNumber2 = await leadNumberService.generateLeadNumber(testUser2Id);
      expect(leadNumber2).toBe(`AA-${currentYear}-0001`);
    });

    /**
     * Full integration test: Create lead with database
     */
    it('should create lead with generated lead number in database', async () => {
      // Set user code 'BB'
      await prisma.userSettings.create({
        data: {
          userId: testUser1Id,
          userCode: 'BB',
        },
      });

      // Generate lead number
      const leadNumber = await leadNumberService.generateLeadNumber(testUser1Id);

      // Create lead in database
      const lead = await prisma.lead.create({
        data: {
          leadNumber,
          userId: testUser1Id,
          companyName: 'Integration Test Company',
          contactName: 'Integration Test Contact',
          contactEmail: 'test@integration.com',
          contactPhone: '010-1234-5678',
          status: 'NEW',
          stageId: testStageId,
        },
      });

      // Verify lead was created with correct lead number
      expect(lead.leadNumber).toBe(leadNumber);
      expect(lead.leadNumber).toMatch(/^BB-\d{4}-0001$/);

      // Verify lead can be retrieved
      const retrievedLead = await prisma.lead.findUnique({
        where: { id: lead.id },
      });

      expect(retrievedLead).not.toBeNull();
      expect(retrievedLead?.leadNumber).toBe(leadNumber);
    });
  });

  describe('Scenario 4: 통합 시나리오 (End-to-End Flow)', () => {
    beforeEach(async () => {
      // Clean up leads and user settings before each test
      await prisma.lead.deleteMany({
        where: { userId: { in: [testUser1Id, testUser2Id] } },
      });
      await prisma.userSettings.deleteMany({
        where: { userId: { in: [testUser1Id, testUser2Id] } },
      });
    });

    /**
     * Full flow: Validate code → Save code → Create lead
     */
    it('should complete full flow: validate, save code, and create lead', async () => {
      const userCode = 'CC';
      const currentYear = new Date().getFullYear();

      // Step 1: Validate user code
      const validationResult = await userCodeValidator.validateUniqueness(userCode, testUser1Id);
      expect(validationResult.isValid).toBe(true);

      // Step 2: Save user code (normalized to uppercase)
      const normalizedCode = userCodeValidator.normalizeCode(userCode);
      await prisma.userSettings.create({
        data: {
          userId: testUser1Id,
          userCode: normalizedCode,
        },
      });

      // Step 3: Generate lead number
      const leadNumber = await leadNumberService.generateLeadNumber(testUser1Id);
      expect(leadNumber).toBe(`CC-${currentYear}-0001`);

      // Step 4: Create lead
      const lead = await prisma.lead.create({
        data: {
          leadNumber,
          userId: testUser1Id,
          companyName: 'E2E Test Company',
          contactName: 'E2E Test Contact',
          status: 'NEW',
          stageId: testStageId,
        },
      });

      expect(lead.leadNumber).toBe(`CC-${currentYear}-0001`);
    });

    /**
     * Error flow: Try to create lead without user code
     */
    it('should fail to create lead when user code is not set', async () => {
      // No user settings - user code not set

      // Attempt to generate lead number should fail
      await expect(
        leadNumberService.generateLeadNumber(testUser1Id)
      ).rejects.toThrow('견적서 코드가 설정되지 않았습니다');
    });

    /**
     * Error flow: Try to save duplicate code
     */
    it('should prevent duplicate code and lead creation', async () => {
      // User 1 sets code 'DD'
      await prisma.userSettings.create({
        data: {
          userId: testUser1Id,
          userCode: 'DD',
        },
      });

      // User 2 tries to validate the same code
      const validationResult = await userCodeValidator.validateUniqueness('DD', testUser2Id);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.error).toBe('이미 사용 중인 견적서 코드입니다');

      // User 2 cannot create lead without valid user code
      await expect(
        leadNumberService.generateLeadNumber(testUser2Id)
      ).rejects.toThrow('견적서 코드가 설정되지 않았습니다');
    });
  });
});
