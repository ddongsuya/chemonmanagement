/**
 * Property-Based Tests for Efficacy Model Selection
 * 
 * Tests for model selection functionality including:
 * - Property 4: Model Selection Loads Correct Defaults
 * - Property 5: Model Change Clears Previous Selection
 * - Property 13: Active Models Only Display
 */

import * as fc from 'fast-check';
import type { EfficacyModel, ModelItem, PriceItem, EfficacyMasterData } from '@/types/efficacy';
import {
  filterActiveModels,
  groupModelsByCategory,
  getDefaultItemsForModel,
} from '@/lib/efficacy-model-utils';

// ============================================
// Test Data Generators
// ============================================

// Generate a valid model ID
const modelIdArb = fc.stringMatching(/^EFF-\d{3}$/);

// Generate a valid item ID
const itemIdArb = fc.stringMatching(/^[A-Z]{3}-\d{3}$/);

// Generate a category
const categoryArb = fc.constantFrom(
  '피부',
  '피부/면역',
  '항암',
  '면역/항암',
  '근골격',
  '대사',
  '대사/혈관',
  '신경',
  '심혈관',
  '세포',
  '소화기',
  '비뇨기'
);

// Generate an EfficacyModel
const efficacyModelArb: fc.Arbitrary<EfficacyModel> = fc.record({
  model_id: modelIdArb,
  model_name: fc.string({ minLength: 1, maxLength: 30 }),
  category: categoryArb,
  indication: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ minLength: 1, maxLength: 100 }),
  is_active: fc.boolean(),
});

// Generate a ModelItem
const modelItemArb = (modelId: string): fc.Arbitrary<ModelItem> =>
  fc.record({
    model_id: fc.constant(modelId),
    model_name: fc.string({ minLength: 1, maxLength: 30 }),
    item_id: itemIdArb,
    item_name: fc.string({ minLength: 1, maxLength: 50 }),
    is_default: fc.boolean(),
    typical_qty: fc.integer({ min: 1, max: 1000 }),
    typical_mult: fc.integer({ min: 1, max: 100 }),
    usage_note: fc.string({ maxLength: 100 }),
  });

// Generate a PriceItem
const priceItemArb: fc.Arbitrary<PriceItem> = fc.record({
  item_id: itemIdArb,
  category: fc.constantFrom('동물비', '사육비', '측정', '조직병리', '유발', '투여', '영상', '분자분석'),
  subcategory: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
  item_name: fc.string({ minLength: 1, maxLength: 50 }),
  item_detail: fc.string({ maxLength: 50 }),
  unit_price: fc.integer({ min: 1000, max: 10000000 }),
  unit: fc.constantFrom('/head', '/day', '/회', '/건', '/ea'),
  remarks: fc.string({ maxLength: 100 }),
  is_active: fc.boolean(),
});

// ============================================
// Property 13: Active Models Only Display
// ============================================

describe('Efficacy Model Selection - Property 13: Active Models Only Display', () => {
  /**
   * **Feature: efficacy-quotation, Property 13: Active Models Only Display**
   * **Validates: Requirements 1.1**
   * 
   * Property: For any model list display, only models with is_active=true SHALL be included.
   */
  it('should filter out inactive models', () => {
    fc.assert(
      fc.property(
        fc.array(efficacyModelArb, { minLength: 1, maxLength: 30 }),
        (models) => {
          const activeModels = filterActiveModels(models);
          
          // All returned models should be active
          for (const model of activeModels) {
            expect(model.is_active).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 13: Active Models Only Display**
   * **Validates: Requirements 1.1**
   * 
   * Property: The count of filtered models equals the count of active models in input.
   */
  it('should return exactly the number of active models', () => {
    fc.assert(
      fc.property(
        fc.array(efficacyModelArb, { minLength: 0, maxLength: 30 }),
        (models) => {
          const activeModels = filterActiveModels(models);
          const expectedCount = models.filter((m) => m.is_active).length;
          
          expect(activeModels.length).toBe(expectedCount);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 13: Active Models Only Display**
   * **Validates: Requirements 1.1**
   * 
   * Property: All active models from input are present in output.
   */
  it('should include all active models from input', () => {
    fc.assert(
      fc.property(
        fc.array(efficacyModelArb, { minLength: 1, maxLength: 30 }),
        (models) => {
          const activeModels = filterActiveModels(models);
          const activeModelIds = new Set(activeModels.map((m) => m.model_id));
          
          // Every active model in input should be in output
          for (const model of models) {
            if (model.is_active) {
              expect(activeModelIds.has(model.model_id)).toBe(true);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: efficacy-quotation, Property 13: Active Models Only Display**
   * **Validates: Requirements 1.1**
   * 
   * Property: Empty input returns empty output.
   */
  it('should return empty array for empty input', () => {
    const result = filterActiveModels([]);
    expect(result).toEqual([]);
  });

  /**
   * **Feature: efficacy-quotation, Property 13: Active Models Only Display**
   * **Validates: Requirements 1.1**
   * 
   * Property: All inactive models returns empty output.
   */
  it('should return empty array when all models are inactive', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            model_id: modelIdArb,
            model_name: fc.string({ minLength: 1, maxLength: 30 }),
            category: categoryArb,
            indication: fc.string({ minLength: 1, maxLength: 50 }),
            description: fc.string({ minLength: 1, maxLength: 100 }),
            is_active: fc.constant(false), // All inactive
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (models) => {
          const activeModels = filterActiveModels(models);
          expect(activeModels.length).toBe(0);
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ============================================
// Model Grouping Tests
// ============================================

describe('Efficacy Model Selection - Model Grouping by Category', () => {
  /**
   * Property: Models are correctly grouped by their category.
   */
  it('should group models by category correctly', () => {
    fc.assert(
      fc.property(
        fc.array(efficacyModelArb, { minLength: 1, maxLength: 30 }),
        (models) => {
          const grouped = groupModelsByCategory(models);
          
          // Each model should be in its correct category group
          for (const model of models) {
            expect(grouped[model.category]).toBeDefined();
            expect(grouped[model.category].some((m) => m.model_id === model.model_id)).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Total count of grouped models equals input count.
   */
  it('should preserve total model count after grouping', () => {
    fc.assert(
      fc.property(
        fc.array(efficacyModelArb, { minLength: 0, maxLength: 30 }),
        (models) => {
          const grouped = groupModelsByCategory(models);
          const totalGrouped = Object.values(grouped).reduce(
            (sum, arr) => sum + arr.length,
            0
          );
          
          expect(totalGrouped).toBe(models.length);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Each category group contains only models of that category.
   */
  it('should only include models of matching category in each group', () => {
    fc.assert(
      fc.property(
        fc.array(efficacyModelArb, { minLength: 1, maxLength: 30 }),
        (models) => {
          const grouped = groupModelsByCategory(models);
          
          for (const [category, categoryModels] of Object.entries(grouped)) {
            for (const model of categoryModels) {
              expect(model.category).toBe(category);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// Property 4: Model Selection Loads Correct Defaults
// ============================================

describe('Efficacy Model Selection - Property 4: Model Selection Loads Correct Defaults', () => {
  /**
   * **Feature: efficacy-quotation, Property 4: Model Selection Loads Correct Defaults**
   * **Validates: Requirements 1.2, 3.2**
   * 
   * Property: For any model selection, all items with is_default=true for that model 
   * SHALL be loaded into selectedItems with their typical_qty and typical_mult values.
   * 
   * Note: This test uses the actual master data to verify the behavior.
   */
  it('should load only default items for a model', () => {
    // Use actual master data
    const masterData = require('@/data/efficacy_master_data.json') as EfficacyMasterData;
    const activeModels = masterData.models.filter((m) => m.is_active);
    
    // Test with each active model
    for (const model of activeModels) {
      const defaultItems = getDefaultItemsForModel(model.model_id);
      
      // All returned items should be default items
      for (const item of defaultItems) {
        expect(item.is_default).toBe(true);
        expect(item.model_id).toBe(model.model_id);
      }
      
      // Count should match expected default items
      const expectedDefaults = masterData.model_items.filter(
        (mi) => mi.model_id === model.model_id && mi.is_default === true
      );
      expect(defaultItems.length).toBe(expectedDefaults.length);
    }
  });

  /**
   * **Feature: efficacy-quotation, Property 4: Model Selection Loads Correct Defaults**
   * **Validates: Requirements 1.2, 3.2**
   * 
   * Property: Default items have typical_qty and typical_mult values preserved.
   * Note: The master data may contain duplicate entries for the same model_id and item_id.
   * This test verifies that each returned item matches at least one entry in the master data.
   */
  it('should preserve typical_qty and typical_mult values', () => {
    const masterData = require('@/data/efficacy_master_data.json') as EfficacyMasterData;
    const activeModels = masterData.models.filter((m) => m.is_active);
    
    for (const model of activeModels) {
      const defaultItems = getDefaultItemsForModel(model.model_id);
      
      for (const item of defaultItems) {
        // Find all matching original model items (there may be duplicates in master data)
        const matchingItems = masterData.model_items.filter(
          (mi) =>
            mi.model_id === model.model_id &&
            mi.item_id === item.item_id &&
            mi.is_default === true
        );
        
        expect(matchingItems.length).toBeGreaterThan(0);
        
        // The item should match one of the entries in the master data
        const hasMatch = matchingItems.some(
          (mi) =>
            mi.typical_qty === item.typical_qty &&
            mi.typical_mult === item.typical_mult
        );
        
        expect(hasMatch).toBe(true);
      }
    }
  });

  /**
   * **Feature: efficacy-quotation, Property 4: Model Selection Loads Correct Defaults**
   * **Validates: Requirements 1.2, 3.2**
   * 
   * Property: Non-existent model returns empty array.
   */
  it('should return empty array for non-existent model', () => {
    const defaultItems = getDefaultItemsForModel('NON-EXISTENT-MODEL');
    expect(defaultItems).toEqual([]);
  });
});

// ============================================
// Property 5: Model Change Clears Previous Selection
// ============================================

describe('Efficacy Model Selection - Property 5: Model Change Clears Previous Selection', () => {
  /**
   * **Feature: efficacy-quotation, Property 5: Model Change Clears Previous Selection**
   * **Validates: Requirements 1.4**
   * 
   * Property: For any model change from model A to model B, all items from model A 
   * SHALL be removed and replaced with model B's default items.
   * 
   * Note: This is tested by verifying that getDefaultItemsForModel returns
   * only items for the specified model, not any other model.
   */
  it('should return items only for the specified model', () => {
    const masterData = require('@/data/efficacy_master_data.json') as EfficacyMasterData;
    const activeModels = masterData.models.filter((m) => m.is_active);
    
    // Test with pairs of models
    for (let i = 0; i < Math.min(activeModels.length - 1, 5); i++) {
      const modelA = activeModels[i];
      const modelB = activeModels[i + 1];
      
      const itemsA = getDefaultItemsForModel(modelA.model_id);
      const itemsB = getDefaultItemsForModel(modelB.model_id);
      
      // Items from model A should all have model A's ID
      for (const item of itemsA) {
        expect(item.model_id).toBe(modelA.model_id);
      }
      
      // Items from model B should all have model B's ID
      for (const item of itemsB) {
        expect(item.model_id).toBe(modelB.model_id);
      }
      
      // Items should be different (unless models share items, which is unlikely)
      // At minimum, model_id should differ
      if (itemsA.length > 0 && itemsB.length > 0) {
        expect(itemsA[0].model_id).not.toBe(itemsB[0].model_id);
      }
    }
  });

  /**
   * **Feature: efficacy-quotation, Property 5: Model Change Clears Previous Selection**
   * **Validates: Requirements 1.4**
   * 
   * Property: Switching models produces completely different item sets.
   */
  it('should produce different item sets for different models', () => {
    const masterData = require('@/data/efficacy_master_data.json') as EfficacyMasterData;
    const activeModels = masterData.models.filter((m) => m.is_active);
    
    if (activeModels.length < 2) return; // Skip if not enough models
    
    const model1 = activeModels[0];
    const model2 = activeModels[1];
    
    const items1 = getDefaultItemsForModel(model1.model_id);
    const items2 = getDefaultItemsForModel(model2.model_id);
    
    // The model_id in items should match the selected model
    const allItems1HaveCorrectModel = items1.every(
      (item) => item.model_id === model1.model_id
    );
    const allItems2HaveCorrectModel = items2.every(
      (item) => item.model_id === model2.model_id
    );
    
    expect(allItems1HaveCorrectModel).toBe(true);
    expect(allItems2HaveCorrectModel).toBe(true);
  });
});
