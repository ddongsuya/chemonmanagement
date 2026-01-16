/**
 * Property-Based Tests for Efficacy Quotation Required Field Validation
 * 
 * **Feature: efficacy-quotation, Property 14: Required Field Validation**
 * **Validates: Requirements 8.4**
 * 
 * Property: For any quotation save attempt, if customer_id is empty OR project_name is empty 
 * OR model_id is null OR items array is empty, the save SHALL be rejected with appropriate error.
 */

import * as fc from 'fast-check';
import { validateEfficacyQuotation, ValidationResult } from '@/lib/efficacy-storage';

// Arbitrary generators for validation test data
const validCustomerId = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
const validProjectName = fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0);
const validModelId = fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0);

const validItemArb = fc.record({
  quantity: fc.integer({ min: 1, max: 10000 }),
  multiplier: fc.integer({ min: 1, max: 1000 }),
});

const invalidQuantityItemArb = fc.record({
  quantity: fc.integer({ min: -1000, max: 0 }),
  multiplier: fc.integer({ min: 1, max: 1000 }),
});

const invalidMultiplierItemArb = fc.record({
  quantity: fc.integer({ min: 1, max: 10000 }),
  multiplier: fc.integer({ min: -1000, max: 0 }),
});

// Empty/whitespace string generators
const emptyOrWhitespaceString = fc.constantFrom('', ' ', '  ', '\t', '\n', '   \t\n  ');

describe('Efficacy Required Field Validation - Property 14', () => {
  /**
   * **Feature: efficacy-quotation, Property 14: Required Field Validation**
   * **Validates: Requirements 8.4**
   * 
   * Property: Valid data should pass validation
   */
  it('should pass validation when all required fields are provided', () => {
    fc.assert(
      fc.property(
        validCustomerId,
        validProjectName,
        validModelId,
        fc.array(validItemArb, { minLength: 1, maxLength: 20 }),
        (customerId, projectName, modelId, items) => {
          const result = validateEfficacyQuotation({
            customer_id: customerId,
            project_name: projectName,
            model_id: modelId,
            items,
          });

          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 14: Required Field Validation**
   * **Validates: Requirements 8.4, E001**
   * 
   * Property: Empty customer_id should fail validation with E001
   */
  it('should reject when customer_id is empty', () => {
    fc.assert(
      fc.property(
        emptyOrWhitespaceString,
        validProjectName,
        validModelId,
        fc.array(validItemArb, { minLength: 1, maxLength: 20 }),
        (customerId, projectName, modelId, items) => {
          const result = validateEfficacyQuotation({
            customer_id: customerId,
            project_name: projectName,
            model_id: modelId,
            items,
          });

          expect(result.isValid).toBe(false);
          expect(result.errors.some(e => e.code === 'E001')).toBe(true);
          expect(result.errors.some(e => e.field === 'customer_id')).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 14: Required Field Validation**
   * **Validates: Requirements 8.4, E002**
   * 
   * Property: Empty project_name should fail validation with E002
   */
  it('should reject when project_name is empty', () => {
    fc.assert(
      fc.property(
        validCustomerId,
        emptyOrWhitespaceString,
        validModelId,
        fc.array(validItemArb, { minLength: 1, maxLength: 20 }),
        (customerId, projectName, modelId, items) => {
          const result = validateEfficacyQuotation({
            customer_id: customerId,
            project_name: projectName,
            model_id: modelId,
            items,
          });

          expect(result.isValid).toBe(false);
          expect(result.errors.some(e => e.code === 'E002')).toBe(true);
          expect(result.errors.some(e => e.field === 'project_name')).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 14: Required Field Validation**
   * **Validates: Requirements 8.4, E003**
   * 
   * Property: Null or empty model_id should fail validation with E003
   */
  it('should reject when model_id is null or empty', () => {
    fc.assert(
      fc.property(
        validCustomerId,
        validProjectName,
        fc.constantFrom(null, '', ' ', '  '),
        fc.array(validItemArb, { minLength: 1, maxLength: 20 }),
        (customerId, projectName, modelId, items) => {
          const result = validateEfficacyQuotation({
            customer_id: customerId,
            project_name: projectName,
            model_id: modelId,
            items,
          });

          expect(result.isValid).toBe(false);
          expect(result.errors.some(e => e.code === 'E003')).toBe(true);
          expect(result.errors.some(e => e.field === 'model_id')).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 14: Required Field Validation**
   * **Validates: Requirements 8.4, E004**
   * 
   * Property: Empty items array should fail validation with E004
   */
  it('should reject when items array is empty', () => {
    fc.assert(
      fc.property(
        validCustomerId,
        validProjectName,
        validModelId,
        (customerId, projectName, modelId) => {
          const result = validateEfficacyQuotation({
            customer_id: customerId,
            project_name: projectName,
            model_id: modelId,
            items: [],
          });

          expect(result.isValid).toBe(false);
          expect(result.errors.some(e => e.code === 'E004')).toBe(true);
          expect(result.errors.some(e => e.field === 'items')).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 14: Required Field Validation**
   * **Validates: Requirements 8.4, E005**
   * 
   * Property: Items with quantity < 1 should fail validation with E005
   */
  it('should reject when item quantity is less than 1', () => {
    fc.assert(
      fc.property(
        validCustomerId,
        validProjectName,
        validModelId,
        fc.array(invalidQuantityItemArb, { minLength: 1, maxLength: 5 }),
        (customerId, projectName, modelId, items) => {
          const result = validateEfficacyQuotation({
            customer_id: customerId,
            project_name: projectName,
            model_id: modelId,
            items,
          });

          expect(result.isValid).toBe(false);
          expect(result.errors.some(e => e.code === 'E005')).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 14: Required Field Validation**
   * **Validates: Requirements 8.4, E006**
   * 
   * Property: Items with multiplier < 1 should fail validation with E006
   */
  it('should reject when item multiplier is less than 1', () => {
    fc.assert(
      fc.property(
        validCustomerId,
        validProjectName,
        validModelId,
        fc.array(invalidMultiplierItemArb, { minLength: 1, maxLength: 5 }),
        (customerId, projectName, modelId, items) => {
          const result = validateEfficacyQuotation({
            customer_id: customerId,
            project_name: projectName,
            model_id: modelId,
            items,
          });

          expect(result.isValid).toBe(false);
          expect(result.errors.some(e => e.code === 'E006')).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 14: Required Field Validation**
   * **Validates: Requirements 8.4**
   * 
   * Property: Multiple validation errors should all be reported
   */
  it('should report all validation errors when multiple fields are invalid', () => {
    fc.assert(
      fc.property(
        emptyOrWhitespaceString,
        emptyOrWhitespaceString,
        fc.constantFrom(null, '', ' '),
        (customerId, projectName, modelId) => {
          const result = validateEfficacyQuotation({
            customer_id: customerId,
            project_name: projectName,
            model_id: modelId,
            items: [],
          });

          expect(result.isValid).toBe(false);
          // Should have at least 4 errors: E001, E002, E003, E004
          expect(result.errors.length).toBeGreaterThanOrEqual(4);
          expect(result.errors.some(e => e.code === 'E001')).toBe(true);
          expect(result.errors.some(e => e.code === 'E002')).toBe(true);
          expect(result.errors.some(e => e.code === 'E003')).toBe(true);
          expect(result.errors.some(e => e.code === 'E004')).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 14: Required Field Validation**
   * **Validates: Requirements 8.4**
   * 
   * Property: Validation result structure is always consistent
   */
  it('should always return consistent validation result structure', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        fc.option(fc.string(), { nil: null }),
        fc.array(fc.record({
          quantity: fc.integer(),
          multiplier: fc.integer(),
        })),
        (customerId, projectName, modelId, items) => {
          const result = validateEfficacyQuotation({
            customer_id: customerId,
            project_name: projectName,
            model_id: modelId,
            items,
          });

          // Result should always have isValid and errors properties
          expect(result).toHaveProperty('isValid');
          expect(result).toHaveProperty('errors');
          expect(typeof result.isValid).toBe('boolean');
          expect(Array.isArray(result.errors)).toBe(true);

          // If valid, errors should be empty
          if (result.isValid) {
            expect(result.errors).toHaveLength(0);
          }

          // If invalid, errors should not be empty
          if (!result.isValid) {
            expect(result.errors.length).toBeGreaterThan(0);
          }

          // Each error should have required properties
          for (const error of result.errors) {
            expect(error).toHaveProperty('code');
            expect(error).toHaveProperty('message');
            expect(error).toHaveProperty('field');
            expect(typeof error.code).toBe('string');
            expect(typeof error.message).toBe('string');
            expect(typeof error.field).toBe('string');
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
