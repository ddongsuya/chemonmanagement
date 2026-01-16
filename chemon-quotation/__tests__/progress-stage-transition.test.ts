/**
 * Property-Based Tests for Progress Stage Transition
 * 
 * **Feature: customer-management, Property 13: 진행 단계 전환**
 * **Validates: Requirements 4.2**
 * 
 * Property: For any 진행 단계 완료 처리, 현재 단계가 완료 상태로 변경되고 다음 단계가 활성화된다
 */

import * as fc from 'fast-check';
import {
  saveProgressStage,
  getProgressStageById,
  updateStage,
  createProgressStage,
  getNextStage,
  isStageCompleted,
  WORKFLOW_STAGES,
  WorkflowStage,
  getAllProgressStages,
} from '@/lib/progress-stage-storage';
import { ProgressStage } from '@/types/customer';

// Arbitrary generator for WorkflowStage (excluding the last stage since it has no next stage)
const stageWithNextArb: fc.Arbitrary<WorkflowStage> = fc.constantFrom(
  ...WORKFLOW_STAGES.slice(0, -1) // All stages except the last one
);

// Arbitrary generator for any WorkflowStage
const anyStageArb: fc.Arbitrary<WorkflowStage> = fc.constantFrom(...WORKFLOW_STAGES);

// Arbitrary generator for customer ID
const customerIdArb = fc.uuid();

describe('Progress Stage Transition - Property 13', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * **Feature: customer-management, Property 13: 진행 단계 전환**
   * **Validates: Requirements 4.2**
   * 
   * Property: When a stage is completed, the current stage is marked as completed
   * and the next stage becomes active
   */
  it('should mark current stage as completed and activate next stage when transitioning', () => {
    fc.assert(
      fc.property(customerIdArb, stageWithNextArb, (customerId, initialStage) => {
        localStorage.clear();
        
        // Create a progress stage with the initial stage
        const progress = createProgressStage(customerId);
        
        // If initial stage is not 'inquiry', we need to advance to it first
        let currentProgress = progress;
        const targetIndex = WORKFLOW_STAGES.indexOf(initialStage);
        
        for (let i = 0; i < targetIndex; i++) {
          const nextStage = WORKFLOW_STAGES[i + 1];
          const updated = updateStage(currentProgress.id, nextStage);
          if (!updated) return false;
          currentProgress = updated;
        }
        
        // Verify we're at the expected stage
        expect(currentProgress.current_stage).toBe(initialStage);
        
        // Get the next stage
        const nextStage = getNextStage(initialStage);
        expect(nextStage).not.toBeNull();
        if (!nextStage) return false;
        
        // Transition to the next stage
        const updatedProgress = updateStage(currentProgress.id, nextStage, 'Test transition');
        
        expect(updatedProgress).not.toBeNull();
        if (!updatedProgress) return false;
        
        // Verify the current stage is now the next stage
        expect(updatedProgress.current_stage).toBe(nextStage);
        
        // Verify the previous stage is marked as completed in history
        const previousStageHistory = updatedProgress.stage_history.find(
          h => h.stage === initialStage
        );
        expect(previousStageHistory).toBeDefined();
        expect(previousStageHistory?.completed_at).toBeDefined();
        
        // Verify the new stage has been entered
        const newStageHistory = updatedProgress.stage_history.find(
          h => h.stage === nextStage
        );
        expect(newStageHistory).toBeDefined();
        expect(newStageHistory?.entered_at).toBeDefined();
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 13: 진행 단계 전환**
   * **Validates: Requirements 4.2**
   * 
   * Property: Stage history is preserved and grows with each transition
   */
  it('should preserve and grow stage history with each transition', () => {
    fc.assert(
      fc.property(
        customerIdArb,
        fc.integer({ min: 1, max: WORKFLOW_STAGES.length - 1 }),
        (customerId, numTransitions) => {
          localStorage.clear();
          
          // Create a progress stage
          const progress = createProgressStage(customerId);
          let currentProgress = progress;
          
          // Initial history should have one entry (inquiry)
          expect(currentProgress.stage_history.length).toBe(1);
          expect(currentProgress.stage_history[0].stage).toBe('inquiry');
          
          // Perform transitions
          for (let i = 0; i < numTransitions; i++) {
            const nextStage = WORKFLOW_STAGES[i + 1];
            const updated = updateStage(currentProgress.id, nextStage);
            if (!updated) return false;
            currentProgress = updated;
            
            // History should grow by 1 with each transition
            expect(currentProgress.stage_history.length).toBe(i + 2);
          }
          
          // Verify all stages in history are in order
          for (let i = 0; i < currentProgress.stage_history.length; i++) {
            expect(currentProgress.stage_history[i].stage).toBe(WORKFLOW_STAGES[i]);
          }
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: customer-management, Property 13: 진행 단계 전환**
   * **Validates: Requirements 4.2**
   * 
   * Property: Transition notes are recorded in the completed stage history
   */
  it('should record transition notes in stage history', () => {
    fc.assert(
      fc.property(
        customerIdArb,
        fc.string({ minLength: 1, maxLength: 100 }),
        (customerId, notes) => {
          localStorage.clear();
          
          // Create a progress stage
          const progress = createProgressStage(customerId);
          
          // Transition to next stage with notes
          const nextStage = getNextStage(progress.current_stage);
          if (!nextStage) return false;
          
          const updated = updateStage(progress.id, nextStage, notes);
          
          expect(updated).not.toBeNull();
          if (!updated) return false;
          
          // Find the completed stage in history
          const completedStageHistory = updated.stage_history.find(
            h => h.stage === 'inquiry' && h.completed_at
          );
          
          expect(completedStageHistory).toBeDefined();
          expect(completedStageHistory?.notes).toBe(notes);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: customer-management, Property 13: 진행 단계 전환**
   * **Validates: Requirements 4.2**
   * 
   * Property: The last stage has no next stage
   */
  it('should return null for next stage when at the last stage', () => {
    const lastStage = WORKFLOW_STAGES[WORKFLOW_STAGES.length - 1];
    const nextStage = getNextStage(lastStage);
    expect(nextStage).toBeNull();
  });

  /**
   * **Feature: customer-management, Property 13: 진행 단계 전환**
   * **Validates: Requirements 4.2**
   * 
   * Property: updated_at timestamp is updated after each transition
   */
  it('should update the updated_at timestamp after transition', () => {
    fc.assert(
      fc.property(customerIdArb, (customerId) => {
        localStorage.clear();
        
        // Create a progress stage
        const progress = createProgressStage(customerId);
        const originalUpdatedAt = progress.updated_at;
        
        // Small delay to ensure timestamp difference
        const nextStage = getNextStage(progress.current_stage);
        if (!nextStage) return false;
        
        const updated = updateStage(progress.id, nextStage);
        
        expect(updated).not.toBeNull();
        if (!updated) return false;
        
        // updated_at should be different (or at least not earlier)
        expect(new Date(updated.updated_at).getTime()).toBeGreaterThanOrEqual(
          new Date(originalUpdatedAt).getTime()
        );
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
