/**
 * Property-Based Tests for Progress Stage Checklist Completion
 * 
 * **Feature: customer-management, Property 15: 체크리스트 완료 시 단계 진행 가능**
 * **Validates: Requirements 4.4**
 * 
 * Property: For any 진행 단계의 체크리스트, 모든 항목이 완료 상태이면 다음 단계 진행이 가능하다
 */

import * as fc from 'fast-check';
import {
  createProgressStage,
  getProgressStageById,
  updateChecklist,
  isStageChecklistComplete,
  canAdvanceToNextStage,
  advanceToNextStage,
  getChecklistByStage,
  WORKFLOW_STAGES,
  WorkflowStage,
} from '@/lib/progress-stage-storage';

// Arbitrary generator for customer ID
const customerIdArb = fc.uuid();

// Arbitrary generator for user name (who completed the checklist)
const userNameArb = fc.string({ minLength: 1, maxLength: 30 });

describe('Progress Stage Checklist Completion - Property 15', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * **Feature: customer-management, Property 15: 체크리스트 완료 시 단계 진행 가능**
   * **Validates: Requirements 4.4**
   * 
   * Property: When all checklist items for a stage are completed, 
   * canAdvanceToNextStage returns true
   */
  it('should allow advancing when all checklist items are completed', () => {
    fc.assert(
      fc.property(customerIdArb, userNameArb, (customerId, userName) => {
        localStorage.clear();
        
        // Create a progress stage (starts at 'inquiry')
        const progress = createProgressStage(customerId);
        
        // Initially, checklist is not complete
        expect(isStageChecklistComplete(progress.id, 'inquiry')).toBe(false);
        expect(canAdvanceToNextStage(progress.id)).toBe(false);
        
        // Get all checklist items for the current stage
        const checklist = getChecklistByStage(progress.id, 'inquiry');
        expect(checklist.length).toBeGreaterThan(0);
        
        // Complete all checklist items
        for (const item of checklist) {
          updateChecklist(progress.id, item.id, true, userName);
        }
        
        // Now checklist should be complete
        expect(isStageChecklistComplete(progress.id, 'inquiry')).toBe(true);
        expect(canAdvanceToNextStage(progress.id)).toBe(true);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 15: 체크리스트 완료 시 단계 진행 가능**
   * **Validates: Requirements 4.4**
   * 
   * Property: When at least one checklist item is incomplete,
   * canAdvanceToNextStage returns false
   */
  it('should not allow advancing when any checklist item is incomplete', () => {
    fc.assert(
      fc.property(customerIdArb, userNameArb, (customerId, userName) => {
        localStorage.clear();
        
        // Create a progress stage
        const progress = createProgressStage(customerId);
        
        // Get all checklist items for the current stage
        const checklist = getChecklistByStage(progress.id, 'inquiry');
        
        if (checklist.length <= 1) {
          // If only one item, complete it and verify we can advance
          if (checklist.length === 1) {
            updateChecklist(progress.id, checklist[0].id, true, userName);
            expect(canAdvanceToNextStage(progress.id)).toBe(true);
          }
          return true;
        }
        
        // Complete all but the last item
        for (let i = 0; i < checklist.length - 1; i++) {
          updateChecklist(progress.id, checklist[i].id, true, userName);
        }
        
        // Should not be able to advance
        expect(isStageChecklistComplete(progress.id, 'inquiry')).toBe(false);
        expect(canAdvanceToNextStage(progress.id)).toBe(false);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 15: 체크리스트 완료 시 단계 진행 가능**
   * **Validates: Requirements 4.4**
   * 
   * Property: advanceToNextStage succeeds when checklist is complete
   */
  it('should successfully advance when checklist is complete', () => {
    fc.assert(
      fc.property(customerIdArb, userNameArb, (customerId, userName) => {
        localStorage.clear();
        
        // Create a progress stage
        const progress = createProgressStage(customerId);
        
        // Complete all checklist items for the current stage
        const checklist = getChecklistByStage(progress.id, 'inquiry');
        for (const item of checklist) {
          updateChecklist(progress.id, item.id, true, userName);
        }
        
        // Advance to next stage (without force)
        const result = advanceToNextStage(progress.id, false);
        
        expect(result.success).toBe(true);
        expect(result.progress).not.toBeNull();
        expect(result.progress?.current_stage).toBe('quotation_sent');
        expect(result.warning).toBeUndefined();
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 15: 체크리스트 완료 시 단계 진행 가능**
   * **Validates: Requirements 4.4, 4.5**
   * 
   * Property: advanceToNextStage fails when checklist is incomplete (without force)
   */
  it('should fail to advance when checklist is incomplete without force', () => {
    fc.assert(
      fc.property(customerIdArb, (customerId) => {
        localStorage.clear();
        
        // Create a progress stage
        const progress = createProgressStage(customerId);
        
        // Don't complete any checklist items
        
        // Try to advance without force
        const result = advanceToNextStage(progress.id, false);
        
        expect(result.success).toBe(false);
        expect(result.progress).not.toBeNull();
        expect(result.progress?.current_stage).toBe('inquiry'); // Still at inquiry
        expect(result.warning).toBeDefined();
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 15: 체크리스트 완료 시 단계 진행 가능**
   * **Validates: Requirements 4.5**
   * 
   * Property: advanceToNextStage succeeds with force even when checklist is incomplete
   */
  it('should advance with force even when checklist is incomplete', () => {
    fc.assert(
      fc.property(customerIdArb, (customerId) => {
        localStorage.clear();
        
        // Create a progress stage
        const progress = createProgressStage(customerId);
        
        // Don't complete any checklist items
        
        // Force advance
        const result = advanceToNextStage(progress.id, true);
        
        expect(result.success).toBe(true);
        expect(result.progress).not.toBeNull();
        expect(result.progress?.current_stage).toBe('quotation_sent');
        expect(result.warning).toBeDefined(); // Warning about incomplete checklist
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 15: 체크리스트 완료 시 단계 진행 가능**
   * **Validates: Requirements 4.4**
   * 
   * Property: Checklist completion status is correctly tracked per stage
   */
  it('should track checklist completion status per stage independently', () => {
    fc.assert(
      fc.property(customerIdArb, userNameArb, (customerId, userName) => {
        localStorage.clear();
        
        // Create a progress stage
        const progress = createProgressStage(customerId);
        
        // Complete inquiry stage checklist
        const inquiryChecklist = getChecklistByStage(progress.id, 'inquiry');
        for (const item of inquiryChecklist) {
          updateChecklist(progress.id, item.id, true, userName);
        }
        
        // Verify inquiry is complete
        expect(isStageChecklistComplete(progress.id, 'inquiry')).toBe(true);
        
        // Verify other stages are not complete
        expect(isStageChecklistComplete(progress.id, 'quotation_sent')).toBe(false);
        expect(isStageChecklistComplete(progress.id, 'contract_signed')).toBe(false);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 15: 체크리스트 완료 시 단계 진행 가능**
   * **Validates: Requirements 4.4**
   * 
   * Property: Completing checklist items records completion timestamp and user
   */
  it('should record completion timestamp and user when completing checklist items', () => {
    fc.assert(
      fc.property(customerIdArb, userNameArb, (customerId, userName) => {
        localStorage.clear();
        
        // Create a progress stage
        const progress = createProgressStage(customerId);
        
        // Get a checklist item
        const checklist = getChecklistByStage(progress.id, 'inquiry');
        expect(checklist.length).toBeGreaterThan(0);
        
        const itemToComplete = checklist[0];
        
        // Initially not completed
        expect(itemToComplete.is_completed).toBe(false);
        expect(itemToComplete.completed_at).toBeUndefined();
        expect(itemToComplete.completed_by).toBeUndefined();
        
        // Complete the item
        const updated = updateChecklist(progress.id, itemToComplete.id, true, userName);
        expect(updated).not.toBeNull();
        
        // Verify completion details
        const updatedChecklist = getChecklistByStage(updated!.id, 'inquiry');
        const completedItem = updatedChecklist.find(i => i.id === itemToComplete.id);
        
        expect(completedItem).toBeDefined();
        expect(completedItem?.is_completed).toBe(true);
        expect(completedItem?.completed_at).toBeDefined();
        expect(completedItem?.completed_by).toBe(userName);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 15: 체크리스트 완료 시 단계 진행 가능**
   * **Validates: Requirements 4.4**
   * 
   * Property: Uncompleting a checklist item removes completion details
   */
  it('should remove completion details when uncompleting a checklist item', () => {
    fc.assert(
      fc.property(customerIdArb, userNameArb, (customerId, userName) => {
        localStorage.clear();
        
        // Create a progress stage
        const progress = createProgressStage(customerId);
        
        // Get a checklist item
        const checklist = getChecklistByStage(progress.id, 'inquiry');
        const itemToToggle = checklist[0];
        
        // Complete the item
        updateChecklist(progress.id, itemToToggle.id, true, userName);
        
        // Uncomplete the item
        const updated = updateChecklist(progress.id, itemToToggle.id, false);
        expect(updated).not.toBeNull();
        
        // Verify completion details are removed
        const updatedChecklist = getChecklistByStage(updated!.id, 'inquiry');
        const uncompletedItem = updatedChecklist.find(i => i.id === itemToToggle.id);
        
        expect(uncompletedItem).toBeDefined();
        expect(uncompletedItem?.is_completed).toBe(false);
        expect(uncompletedItem?.completed_at).toBeUndefined();
        expect(uncompletedItem?.completed_by).toBeUndefined();
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
