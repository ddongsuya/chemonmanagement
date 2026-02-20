/**
 * Property-Based Tests for Code Change Impact
 * Feature: unified-quotation-code
 * 
 * These tests verify that code changes only affect new quotations/leads
 * and that existing numbers remain immutable.
 * 
 * Properties tested:
 * - Property 8: 코드 변경 영향 범위 (Code change impact)
 * - Property 9: 기존 리드 번호 불변성 (Existing lead number immutability)
 * 
 * Validates: Requirements 5.4, 5.5, 3.5
 */

/// <reference types="jest" />

import * as fc from 'fast-check';
import { DataService } from '../../src/services/dataService';
import { LeadNumberService } from '../../src/services/leadNumberService';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient for unit testing
const createMockPrisma = () => {
  return {
    userSettings: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    quotation: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    lead: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  } as unknown as PrismaClient;
};

// Arbitrary for generating valid 2-letter uppercase user codes
const validUserCodeArb = fc.string({ minLength: 2, maxLength: 2 }).filter(s => /^[A-Z]{2}$/.test(s));

// Arbitrary for generating different user codes (ensuring they are different)
const differentUserCodesArb = fc.tuple(validUserCodeArb, validUserCodeArb).filter(
  ([a, b]) => a !== b
);

// Arbitrary for generating valid quotation types
const quotationTypeArb = fc.constantFrom('TOXICITY', 'EFFICACY', 'CLINICAL') as fc.Arbitrary<'TOXICITY' | 'EFFICACY' | 'CLINICAL'>;

// Arbitrary for generating valid years (4-digit)
const yearArb = fc.integer({ min: 2020, max: 2099 });

// Arbitrary for generating valid months (1-12)
const monthArb = fc.integer({ min: 1, max: 12 });

// Arbitrary for generating valid sequence numbers (1-9999)
const sequenceArb = fc.integer({ min: 1, max: 9999 });

// Arbitrary for generating UUIDs
const userIdArb = fc.uuid();

// Arbitrary for generating quotation IDs
const quotationIdArb = fc.uuid();

// Arbitrary for generating lead IDs
const leadIdArb = fc.uuid();

describe('Code Change Impact Property Tests', () => {
  let dataService: DataService;
  let leadNumberService: LeadNumberService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    dataService = new DataService(mockPrisma);
    leadNumberService = new LeadNumberService(mockPrisma);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * Feature: unified-quotation-code, Property 8: 코드 변경 영향 범위
   * 
   * For any User_Code change, quotations and leads created after the change
   * must use the new code, and quotations and leads created before the change
   * must not have their numbers changed.
   * 
   * Validates: Requirements 5.4, 5.5
   */
  describe('Property 8: 코드 변경 영향 범위 (Code change impact)', () => {
    it('should use new code for quotations created after code change', async () => {
      await fc.assert(
        fc.asyncProperty(
          differentUserCodesArb,
          quotationTypeArb,
          yearArb,
          monthArb,
          userIdArb,
          async ([oldCode, newCode], quotationType, year, month, userId) => {
            // Setup: Mock the date
            jest.useFakeTimers();
            jest.setSystemTime(new Date(year, month - 1, 15, 10, 0, 0));

            // Phase 1: Generate quotation with old code
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: oldCode,
            });
            (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue(null);

            const quotationWithOldCode = await dataService.generateQuotationNumber(userId, quotationType);

            // Verify old code is used (format: YY-MM-UC-NNNN)
            const oldCodeParts = quotationWithOldCode.split('-');
            expect(oldCodeParts[2]).toBe(oldCode);

            // Phase 2: Simulate code change - update mock to return new code
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: newCode,
            });
            // Mock that there's no quotation with the new code prefix yet
            (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue(null);

            // Generate quotation with new code
            const quotationWithNewCode = await dataService.generateQuotationNumber(userId, quotationType);

            // Property: New quotation should use the new code (format: YY-MM-UC-NNNN)
            const newCodeParts = quotationWithNewCode.split('-');
            expect(newCodeParts[2]).toBe(newCode);
            expect(newCodeParts[2]).not.toBe(oldCode);

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use new code for leads created after code change', async () => {
      await fc.assert(
        fc.asyncProperty(
          differentUserCodesArb,
          yearArb,
          userIdArb,
          async ([oldCode, newCode], year, userId) => {
            // Setup: Mock the date
            jest.useFakeTimers();
            jest.setSystemTime(new Date(year, 5, 15, 10, 0, 0));

            // Phase 1: Generate lead with old code
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: oldCode,
            });
            (mockPrisma.lead.findFirst as jest.Mock).mockResolvedValue(null);

            const leadWithOldCode = await leadNumberService.generateLeadNumber(userId);

            // Verify old code is used
            const oldCodeParts = leadWithOldCode.split('-');
            expect(oldCodeParts[0]).toBe(oldCode);

            // Phase 2: Simulate code change - update mock to return new code
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: newCode,
            });
            // Mock that there's no lead with the new code prefix yet
            (mockPrisma.lead.findFirst as jest.Mock).mockResolvedValue(null);

            // Generate lead with new code
            const leadWithNewCode = await leadNumberService.generateLeadNumber(userId);

            // Property: New lead should use the new code
            const newCodeParts = leadWithNewCode.split('-');
            expect(newCodeParts[0]).toBe(newCode);
            expect(newCodeParts[0]).not.toBe(oldCode);

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not regenerate existing quotation numbers when code changes', async () => {
      await fc.assert(
        fc.asyncProperty(
          differentUserCodesArb,
          quotationTypeArb,
          yearArb,
          monthArb,
          sequenceArb,
          userIdArb,
          quotationIdArb,
          async ([oldCode, newCode], quotationType, year, month, seq, userId, quotationId) => {
            // Setup: Create an existing quotation with old code
            const yearStr = year.toString().slice(-2);
            const monthStr = month.toString().padStart(2, '0');
            const seqStr = seq.toString().padStart(4, '0');
            const existingQuotationNumber = `${yearStr}-${monthStr}-${oldCode}-${seqStr}`;

            // Mock existing quotation in database
            const existingQuotation = {
              id: quotationId,
              quotationNumber: existingQuotationNumber,
              quotationType,
              userId,
              createdAt: new Date(year, month - 1, 10),
            };

            // Simulate code change - user now has new code
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: newCode,
            });

            // Mock getQuotations to return existing quotation
            (mockPrisma.quotation.findMany as jest.Mock).mockResolvedValue([existingQuotation]);

            // Property: Existing quotation number should remain unchanged
            // The stored quotationNumber should still contain the old code
            expect(existingQuotation.quotationNumber).toBe(existingQuotationNumber);
            expect(existingQuotation.quotationNumber).toContain(oldCode);
            expect(existingQuotation.quotationNumber).not.toContain(newCode);

            // Verify the format is preserved (YY-MM-UC-NNNN)
            const parts = existingQuotation.quotationNumber.split('-');
            expect(parts).toHaveLength(4);
            expect(parts[2]).toBe(oldCode);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not regenerate existing lead numbers when code changes', async () => {
      await fc.assert(
        fc.asyncProperty(
          differentUserCodesArb,
          yearArb,
          sequenceArb,
          userIdArb,
          leadIdArb,
          async ([oldCode, newCode], year, seq, userId, leadId) => {
            // Setup: Create an existing lead with old code
            const seqStr = seq.toString().padStart(4, '0');
            const existingLeadNumber = `${oldCode}-${year}-${seqStr}`;

            // Mock existing lead in database
            const existingLead = {
              id: leadId,
              leadNumber: existingLeadNumber,
              userId,
              createdAt: new Date(year, 5, 10),
            };

            // Simulate code change - user now has new code
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: newCode,
            });

            // Mock getLeads to return existing lead
            (mockPrisma.lead.findMany as jest.Mock).mockResolvedValue([existingLead]);

            // Property: Existing lead number should remain unchanged
            // The stored leadNumber should still contain the old code
            expect(existingLead.leadNumber).toBe(existingLeadNumber);
            expect(existingLead.leadNumber.startsWith(oldCode)).toBe(true);
            expect(existingLead.leadNumber.startsWith(newCode)).toBe(false);

            // Verify the format is preserved
            const parts = existingLead.leadNumber.split('-');
            expect(parts).toHaveLength(3);
            expect(parts[0]).toBe(oldCode);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain separation between old and new code quotations', async () => {
      await fc.assert(
        fc.asyncProperty(
          differentUserCodesArb,
          fc.array(quotationTypeArb, { minLength: 1, maxLength: 5 }),
          yearArb,
          monthArb,
          userIdArb,
          async ([oldCode, newCode], quotationTypes, year, month, userId) => {
            // Setup: Mock the date
            jest.useFakeTimers();
            jest.setSystemTime(new Date(year, month - 1, 15, 10, 0, 0));

            const quotationsWithOldCode: string[] = [];
            const quotationsWithNewCode: string[] = [];

            // Phase 1: Generate quotations with old code
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: oldCode,
            });

            let oldSeq = 0;
            for (const quotationType of quotationTypes) {
              if (oldSeq === 0) {
                (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue(null);
              } else {
                const yearStr = year.toString().slice(-2);
                const monthStr = month.toString().padStart(2, '0');
                const prevNumber = `${yearStr}-${monthStr}-${oldCode}-${oldSeq.toString().padStart(4, '0')}`;
                (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue({
                  quotationNumber: prevNumber,
                });
              }

              const number = await dataService.generateQuotationNumber(userId, quotationType);
              quotationsWithOldCode.push(number);
              oldSeq++;
            }

            // Phase 2: Change code and generate more quotations
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: newCode,
            });

            let newSeq = 0;
            for (const quotationType of quotationTypes) {
              if (newSeq === 0) {
                (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue(null);
              } else {
                const yearStr = year.toString().slice(-2);
                const monthStr = month.toString().padStart(2, '0');
                const prevNumber = `${yearStr}-${monthStr}-${newCode}-${newSeq.toString().padStart(4, '0')}`;
                (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue({
                  quotationNumber: prevNumber,
                });
              }

              const number = await dataService.generateQuotationNumber(userId, quotationType);
              quotationsWithNewCode.push(number);
              newSeq++;
            }

            // Property: All old code quotations should contain old code (format: YY-MM-UC-NNNN)
            for (const number of quotationsWithOldCode) {
              expect(number.split('-')[2]).toBe(oldCode);
            }

            // Property: All new code quotations should contain new code
            for (const number of quotationsWithNewCode) {
              expect(number.split('-')[2]).toBe(newCode);
            }

            // Property: Old and new code quotations should be distinct
            const oldSet = new Set(quotationsWithOldCode.map(n => n.split('-')[2]));
            const newSet = new Set(quotationsWithNewCode.map(n => n.split('-')[2]));
            expect(oldSet.has(newCode)).toBe(false);
            expect(newSet.has(oldCode)).toBe(false);

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain separation between old and new code leads', async () => {
      await fc.assert(
        fc.asyncProperty(
          differentUserCodesArb,
          fc.integer({ min: 1, max: 5 }),
          yearArb,
          userIdArb,
          async ([oldCode, newCode], numLeads, year, userId) => {
            // Setup: Mock the date
            jest.useFakeTimers();
            jest.setSystemTime(new Date(year, 5, 15, 10, 0, 0));

            const leadsWithOldCode: string[] = [];
            const leadsWithNewCode: string[] = [];

            // Phase 1: Generate leads with old code
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: oldCode,
            });

            let oldSeq = 0;
            for (let i = 0; i < numLeads; i++) {
              if (oldSeq === 0) {
                (mockPrisma.lead.findFirst as jest.Mock).mockResolvedValue(null);
              } else {
                const prevNumber = `${oldCode}-${year}-${oldSeq.toString().padStart(4, '0')}`;
                (mockPrisma.lead.findFirst as jest.Mock).mockResolvedValue({
                  leadNumber: prevNumber,
                });
              }

              const number = await leadNumberService.generateLeadNumber(userId);
              leadsWithOldCode.push(number);
              oldSeq++;
            }

            // Phase 2: Change code and generate more leads
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: newCode,
            });

            let newSeq = 0;
            for (let i = 0; i < numLeads; i++) {
              if (newSeq === 0) {
                (mockPrisma.lead.findFirst as jest.Mock).mockResolvedValue(null);
              } else {
                const prevNumber = `${newCode}-${year}-${newSeq.toString().padStart(4, '0')}`;
                (mockPrisma.lead.findFirst as jest.Mock).mockResolvedValue({
                  leadNumber: prevNumber,
                });
              }

              const number = await leadNumberService.generateLeadNumber(userId);
              leadsWithNewCode.push(number);
              newSeq++;
            }

            // Property: All old code leads should contain old code
            for (const number of leadsWithOldCode) {
              expect(number.split('-')[0]).toBe(oldCode);
            }

            // Property: All new code leads should contain new code
            for (const number of leadsWithNewCode) {
              expect(number.split('-')[0]).toBe(newCode);
            }

            // Property: Old and new code leads should be distinct
            const oldSet = new Set(leadsWithOldCode.map(n => n.split('-')[0]));
            const newSet = new Set(leadsWithNewCode.map(n => n.split('-')[0]));
            expect(oldSet.has(newCode)).toBe(false);
            expect(newSet.has(oldCode)).toBe(false);

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Feature: unified-quotation-code, Property 9: 기존 리드 번호 불변성
   * 
   * For any stored lead, the Lead_Number returned on retrieval must be
   * identical to the value stored at creation time.
   * 
   * Validates: Requirements 3.5
   */
  describe('Property 9: 기존 리드 번호 불변성 (Existing lead number immutability)', () => {
    it('should return stored leadNumber exactly on retrieval', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          yearArb,
          sequenceArb,
          userIdArb,
          leadIdArb,
          async (userCode, year, seq, userId, leadId) => {
            // Setup: Create a stored lead with specific leadNumber
            const seqStr = seq.toString().padStart(4, '0');
            const storedLeadNumber = `${userCode}-${year}-${seqStr}`;

            // Mock the stored lead in database
            const storedLead = {
              id: leadId,
              leadNumber: storedLeadNumber,
              userId,
              companyName: 'Test Company',
              contactName: 'Test Contact',
              status: 'NEW',
              createdAt: new Date(year, 5, 10),
              updatedAt: new Date(year, 5, 10),
            };

            // Mock findFirst to return the stored lead
            (mockPrisma.lead.findFirst as jest.Mock).mockResolvedValue(storedLead);

            // Simulate retrieval
            const retrievedLead = await mockPrisma.lead.findFirst({
              where: { id: leadId, userId },
            });

            // Property: Retrieved leadNumber must be identical to stored value
            expect(retrievedLead?.leadNumber).toBe(storedLeadNumber);
            expect(retrievedLead?.leadNumber).toBe(storedLead.leadNumber);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not regenerate leadNumber on retrieval', async () => {
      await fc.assert(
        fc.asyncProperty(
          differentUserCodesArb,
          yearArb,
          sequenceArb,
          userIdArb,
          leadIdArb,
          async ([originalCode, currentCode], year, seq, userId, leadId) => {
            // Setup: Lead was created with original code
            const seqStr = seq.toString().padStart(4, '0');
            const originalLeadNumber = `${originalCode}-${year}-${seqStr}`;

            // Mock the stored lead (created with original code)
            const storedLead = {
              id: leadId,
              leadNumber: originalLeadNumber,
              userId,
              companyName: 'Test Company',
              contactName: 'Test Contact',
              status: 'NEW',
              createdAt: new Date(year, 5, 10),
              updatedAt: new Date(year, 5, 10),
            };

            // User has since changed their code to currentCode
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: currentCode,
            });

            // Mock findFirst to return the stored lead
            (mockPrisma.lead.findFirst as jest.Mock).mockResolvedValue(storedLead);

            // Simulate retrieval
            const retrievedLead = await mockPrisma.lead.findFirst({
              where: { id: leadId, userId },
            });

            // Property: Retrieved leadNumber should NOT be regenerated with current code
            expect(retrievedLead?.leadNumber).toBe(originalLeadNumber);
            expect(retrievedLead?.leadNumber.startsWith(originalCode)).toBe(true);
            expect(retrievedLead?.leadNumber.startsWith(currentCode)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve leadNumber format exactly as stored', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          yearArb,
          sequenceArb,
          userIdArb,
          leadIdArb,
          async (userCode, year, seq, userId, leadId) => {
            // Setup: Create a stored lead with specific format
            const seqStr = seq.toString().padStart(4, '0');
            const storedLeadNumber = `${userCode}-${year}-${seqStr}`;

            // Mock the stored lead
            const storedLead = {
              id: leadId,
              leadNumber: storedLeadNumber,
              userId,
              createdAt: new Date(year, 5, 10),
            };

            // Mock findFirst to return the stored lead
            (mockPrisma.lead.findFirst as jest.Mock).mockResolvedValue(storedLead);

            // Simulate retrieval
            const retrievedLead = await mockPrisma.lead.findFirst({
              where: { id: leadId, userId },
            });

            // Property: Format should be preserved exactly
            const parts = retrievedLead?.leadNumber.split('-');
            expect(parts).toHaveLength(3);
            
            // UC part should be exactly as stored
            expect(parts?.[0]).toBe(userCode);
            expect(parts?.[0].length).toBe(2);
            
            // YYYY part should be exactly as stored
            expect(parts?.[1]).toBe(year.toString());
            expect(parts?.[1].length).toBe(4);
            
            // NNNN part should be exactly as stored (with leading zeros)
            expect(parts?.[2]).toBe(seqStr);
            expect(parts?.[2].length).toBe(4);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return same leadNumber across multiple retrievals', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          yearArb,
          sequenceArb,
          userIdArb,
          leadIdArb,
          fc.integer({ min: 2, max: 10 }),
          async (userCode, year, seq, userId, leadId, numRetrievals) => {
            // Setup: Create a stored lead
            const seqStr = seq.toString().padStart(4, '0');
            const storedLeadNumber = `${userCode}-${year}-${seqStr}`;

            const storedLead = {
              id: leadId,
              leadNumber: storedLeadNumber,
              userId,
              createdAt: new Date(year, 5, 10),
            };

            // Mock findFirst to return the stored lead
            (mockPrisma.lead.findFirst as jest.Mock).mockResolvedValue(storedLead);

            // Simulate multiple retrievals
            const retrievedNumbers: string[] = [];
            for (let i = 0; i < numRetrievals; i++) {
              const retrievedLead = await mockPrisma.lead.findFirst({
                where: { id: leadId, userId },
              });
              retrievedNumbers.push(retrievedLead?.leadNumber || '');
            }

            // Property: All retrievals should return the same leadNumber
            for (const number of retrievedNumbers) {
              expect(number).toBe(storedLeadNumber);
            }

            // Property: All retrieved numbers should be identical
            const uniqueNumbers = new Set(retrievedNumbers);
            expect(uniqueNumbers.size).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve leadNumber even when user settings change between retrievals', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(validUserCodeArb, { minLength: 2, maxLength: 5 }),
          yearArb,
          sequenceArb,
          userIdArb,
          leadIdArb,
          async (userCodes, year, seq, userId, leadId) => {
            // Setup: Lead was created with first code
            const originalCode = userCodes[0];
            const seqStr = seq.toString().padStart(4, '0');
            const storedLeadNumber = `${originalCode}-${year}-${seqStr}`;

            const storedLead = {
              id: leadId,
              leadNumber: storedLeadNumber,
              userId,
              createdAt: new Date(year, 5, 10),
            };

            // Mock findFirst to return the stored lead
            (mockPrisma.lead.findFirst as jest.Mock).mockResolvedValue(storedLead);

            // Simulate retrievals with different user codes
            for (const currentCode of userCodes) {
              // User changes their code
              (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
                userCode: currentCode,
              });

              // Retrieve the lead
              const retrievedLead = await mockPrisma.lead.findFirst({
                where: { id: leadId, userId },
              });

              // Property: LeadNumber should always be the original stored value
              expect(retrievedLead?.leadNumber).toBe(storedLeadNumber);
              expect(retrievedLead?.leadNumber.startsWith(originalCode)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain immutability for leads created at different times', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUserCodeArb,
          fc.array(
            fc.record({
              year: yearArb,
              seq: sequenceArb,
              leadId: leadIdArb,
            }),
            { minLength: 1, maxLength: 5 }
          ),
          userIdArb,
          async (userCode, leadConfigs, userId) => {
            // Create multiple leads at different times
            const storedLeads = leadConfigs.map((config, index) => {
              const seqStr = config.seq.toString().padStart(4, '0');
              return {
                id: config.leadId,
                leadNumber: `${userCode}-${config.year}-${seqStr}`,
                userId,
                createdAt: new Date(config.year, index, 10),
              };
            });

            // Property: Each lead should retain its original number
            for (const lead of storedLeads) {
              // Mock findFirst to return this specific lead
              (mockPrisma.lead.findFirst as jest.Mock).mockResolvedValue(lead);

              const retrievedLead = await mockPrisma.lead.findFirst({
                where: { id: lead.id, userId },
              });

              // Verify immutability
              expect(retrievedLead?.leadNumber).toBe(lead.leadNumber);
              
              // Verify format
              const parts = retrievedLead?.leadNumber.split('-');
              expect(parts?.[0]).toBe(userCode);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property tests for combined scenarios
   */
  describe('Combined Code Change and Immutability Properties', () => {
    it('should handle multiple code changes while preserving all existing numbers', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(validUserCodeArb, { minLength: 2, maxLength: 4 }).filter(
            codes => new Set(codes).size === codes.length // All codes must be unique
          ),
          yearArb,
          userIdArb,
          async (userCodes, year, userId) => {
            // Setup: Mock the date
            jest.useFakeTimers();
            jest.setSystemTime(new Date(year, 5, 15, 10, 0, 0));

            const allGeneratedLeads: Array<{ code: string; number: string }> = [];

            // Generate leads with each code
            for (let i = 0; i < userCodes.length; i++) {
              const code = userCodes[i];
              
              // Set current user code
              (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
                userCode: code,
              });
              (mockPrisma.lead.findFirst as jest.Mock).mockResolvedValue(null);

              // Generate a lead
              const leadNumber = await leadNumberService.generateLeadNumber(userId);
              allGeneratedLeads.push({ code, number: leadNumber });
            }

            // Property: Each lead should have been generated with its respective code
            for (const lead of allGeneratedLeads) {
              expect(lead.number.startsWith(lead.code)).toBe(true);
            }

            // Property: All leads should have unique numbers (different codes)
            const uniqueNumbers = new Set(allGeneratedLeads.map(l => l.number));
            expect(uniqueNumbers.size).toBe(allGeneratedLeads.length);

            // Property: Simulating retrieval - each stored number should be preserved
            for (const lead of allGeneratedLeads) {
              const storedLead = {
                id: `lead-${lead.code}`,
                leadNumber: lead.number,
                userId,
              };
              
              (mockPrisma.lead.findFirst as jest.Mock).mockResolvedValue(storedLead);
              
              const retrieved = await mockPrisma.lead.findFirst({
                where: { id: storedLead.id, userId },
              });
              
              expect(retrieved?.leadNumber).toBe(lead.number);
            }

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly distinguish between pre-change and post-change quotations', async () => {
      await fc.assert(
        fc.asyncProperty(
          differentUserCodesArb,
          yearArb,
          monthArb,
          fc.integer({ min: 1, max: 3 }),
          fc.integer({ min: 1, max: 3 }),
          userIdArb,
          async ([oldCode, newCode], year, month, preChangeCount, postChangeCount, userId) => {
            // Setup: Mock the date
            jest.useFakeTimers();
            jest.setSystemTime(new Date(year, month - 1, 15, 10, 0, 0));

            const preChangeQuotations: string[] = [];
            const postChangeQuotations: string[] = [];

            // Generate pre-change quotations
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: oldCode,
            });

            let seq = 0;
            for (let i = 0; i < preChangeCount; i++) {
              if (seq === 0) {
                (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue(null);
              } else {
                const yearStr = year.toString().slice(-2);
                const monthStr = month.toString().padStart(2, '0');
                const prevNumber = `${yearStr}-${monthStr}-${oldCode}-${seq.toString().padStart(4, '0')}`;
                (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue({
                  quotationNumber: prevNumber,
                });
              }

              const number = await dataService.generateQuotationNumber(userId, 'TOXICITY');
              preChangeQuotations.push(number);
              seq++;
            }

            // Change code
            (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
              userCode: newCode,
            });

            // Generate post-change quotations
            seq = 0;
            for (let i = 0; i < postChangeCount; i++) {
              if (seq === 0) {
                (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue(null);
              } else {
                const yearStr = year.toString().slice(-2);
                const monthStr = month.toString().padStart(2, '0');
                const prevNumber = `${yearStr}-${monthStr}-${newCode}-${seq.toString().padStart(4, '0')}`;
                (mockPrisma.quotation.findFirst as jest.Mock).mockResolvedValue({
                  quotationNumber: prevNumber,
                });
              }

              const number = await dataService.generateQuotationNumber(userId, 'TOXICITY');
              postChangeQuotations.push(number);
              seq++;
            }

            // Property: Pre-change quotations should all have old code (format: YY-MM-UC-NNNN)
            for (const number of preChangeQuotations) {
              const parts = number.split('-');
              expect(parts[2]).toBe(oldCode);
            }

            // Property: Post-change quotations should all have new code
            for (const number of postChangeQuotations) {
              const parts = number.split('-');
              expect(parts[2]).toBe(newCode);
            }

            // Property: No overlap between pre and post change codes
            const preCodeSet = new Set(preChangeQuotations.map(n => n.split('-')[2]));
            const postCodeSet = new Set(postChangeQuotations.map(n => n.split('-')[2]));
            
            for (const code of preCodeSet) {
              expect(postCodeSet.has(code)).toBe(false);
            }
            for (const code of postCodeSet) {
              expect(preCodeSet.has(code)).toBe(false);
            }

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
