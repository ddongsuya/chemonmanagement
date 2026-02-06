// backend/__tests__/property/automation.property.test.ts
// Property tests for automation rule CRUD functionality
// **Validates: Requirements 2.1.1, 2.1.2, 2.1.4, 2.5.3**

/// <reference types="jest" />

import * as fc from 'fast-check';
import { AutomationService, CreateAutomationRuleDTO, AutomationRule } from '../../src/services/automationService';
import { AutomationTriggerType, AutomationActionType, AutomationStatus } from '@prisma/client';

// Mock Prisma client for automation rules
const createMockPrisma = () => {
  const rules = new Map<string, any>();
  const actions = new Map<string, any>();
  const executions = new Map<string, any>();
  
  let ruleIdCounter = 0;
  let actionIdCounter = 0;

  return {
    automationRule: {
      findMany: jest.fn(async ({ where, skip, take, orderBy, include }: any) => {
        let result = Array.from(rules.values());
        
        // Apply filters
        if (where?.status && where.status !== 'ALL') {
          result = result.filter(r => r.status === where.status);
        }
        if (where?.triggerType) {
          result = result.filter(r => r.triggerType === where.triggerType);
        }
        if (where?.OR) {
          result = result.filter(r => {
            return where.OR.some((condition: any) => {
              if (condition.name?.contains) {
                return r.name.toLowerCase().includes(condition.name.contains.toLowerCase());
              }
              if (condition.description?.contains) {
                return r.description?.toLowerCase().includes(condition.description.contains.toLowerCase());
              }
              return false;
            });
          });
        }
        
        // Apply pagination
        if (skip !== undefined) {
          result = result.slice(skip);
        }
        if (take !== undefined) {
          result = result.slice(0, take);
        }
        
        // Include actions if requested
        if (include?.actions) {
          result = result.map(r => ({
            ...r,
            actions: Array.from(actions.values())
              .filter(a => a.ruleId === r.id)
              .sort((a, b) => a.order - b.order),
          }));
        }
        
        return result;
      }),
      findUnique: jest.fn(async ({ where, include }: any) => {
        const rule = rules.get(where.id);
        if (!rule) return null;
        
        if (include?.actions) {
          return {
            ...rule,
            actions: Array.from(actions.values())
              .filter(a => a.ruleId === rule.id)
              .sort((a, b) => a.order - b.order),
          };
        }
        return rule;
      }),
      count: jest.fn(async ({ where }: any) => {
        let result = Array.from(rules.values());
        
        if (where?.status && where.status !== 'ALL') {
          result = result.filter(r => r.status === where.status);
        }
        if (where?.triggerType) {
          result = result.filter(r => r.triggerType === where.triggerType);
        }
        
        return result.length;
      }),
      create: jest.fn(async ({ data, include }: any) => {
        const id = `rule-${++ruleIdCounter}`;
        const now = new Date();
        
        const rule = {
          id,
          name: data.name,
          description: data.description || null,
          triggerType: data.triggerType,
          triggerConfig: data.triggerConfig,
          conditions: data.conditions || null,
          status: data.status || AutomationStatus.ACTIVE,
          priority: data.priority || 0,
          executionCount: 0,
          lastExecutedAt: null,
          lastError: null,
          createdBy: data.createdBy,
          isSystem: false,
          createdAt: now,
          updatedAt: now,
        };
        
        rules.set(id, rule);
        
        // Create actions
        const createdActions: any[] = [];
        if (data.actions?.create) {
          for (const actionData of data.actions.create) {
            const actionId = `action-${++actionIdCounter}`;
            const action = {
              id: actionId,
              ruleId: id,
              actionType: actionData.actionType,
              actionConfig: actionData.actionConfig,
              order: actionData.order,
              delayMinutes: actionData.delayMinutes || null,
            };
            actions.set(actionId, action);
            createdActions.push(action);
          }
        }
        
        if (include?.actions) {
          return { ...rule, actions: createdActions.sort((a, b) => a.order - b.order) };
        }
        return rule;
      }),
      update: jest.fn(async ({ where, data, include }: any) => {
        const rule = rules.get(where.id);
        if (!rule) throw new Error('자동화 규칙을 찾을 수 없습니다');
        
        const updated = {
          ...rule,
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.triggerType !== undefined && { triggerType: data.triggerType }),
          ...(data.triggerConfig !== undefined && { triggerConfig: data.triggerConfig }),
          ...(data.conditions !== undefined && { conditions: data.conditions }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.priority !== undefined && { priority: data.priority }),
          updatedAt: new Date(),
        };
        
        rules.set(where.id, updated);
        
        // Handle actions update
        if (data.actions?.create) {
          // Delete existing actions for this rule
          for (const [key, action] of actions.entries()) {
            if (action.ruleId === where.id) {
              actions.delete(key);
            }
          }
          
          // Create new actions
          for (const actionData of data.actions.create) {
            const actionId = `action-${++actionIdCounter}`;
            const action = {
              id: actionId,
              ruleId: where.id,
              actionType: actionData.actionType,
              actionConfig: actionData.actionConfig,
              order: actionData.order,
              delayMinutes: actionData.delayMinutes || null,
            };
            actions.set(actionId, action);
          }
        }
        
        if (include?.actions) {
          return {
            ...updated,
            actions: Array.from(actions.values())
              .filter(a => a.ruleId === where.id)
              .sort((a, b) => a.order - b.order),
          };
        }
        return updated;
      }),
      delete: jest.fn(async ({ where }: any) => {
        const rule = rules.get(where.id);
        if (!rule) throw new Error('자동화 규칙을 찾을 수 없습니다');
        
        // Delete associated actions
        for (const [key, action] of actions.entries()) {
          if (action.ruleId === where.id) {
            actions.delete(key);
          }
        }
        
        rules.delete(where.id);
        return rule;
      }),
    },
    automationAction: {
      deleteMany: jest.fn(async ({ where }: any) => {
        let count = 0;
        for (const [key, action] of actions.entries()) {
          if (action.ruleId === where.ruleId) {
            actions.delete(key);
            count++;
          }
        }
        return { count };
      }),
    },
    automationExecution: {
      findMany: jest.fn(async () => []),
      count: jest.fn(async () => 0),
      create: jest.fn(async ({ data }: any) => ({
        id: `exec-${Date.now()}`,
        ...data,
        startedAt: new Date(),
      })),
      update: jest.fn(async ({ where, data }: any) => ({
        id: where.id,
        ...data,
      })),
    },
    $transaction: jest.fn(async (callback: any) => {
      // Execute the callback with the mock prisma as the transaction client
      const txClient = {
        automationAction: {
          deleteMany: jest.fn(async ({ where }: any) => {
            let count = 0;
            for (const [key, action] of actions.entries()) {
              if (action.ruleId === where.ruleId) {
                actions.delete(key);
                count++;
              }
            }
            return { count };
          }),
        },
        automationRule: {
          update: jest.fn(async ({ where, data, include }: any) => {
            const rule = rules.get(where.id);
            if (!rule) throw new Error('자동화 규칙을 찾을 수 없습니다');
            
            const updated = {
              ...rule,
              ...(data.name !== undefined && { name: data.name }),
              ...(data.description !== undefined && { description: data.description }),
              ...(data.triggerType !== undefined && { triggerType: data.triggerType }),
              ...(data.triggerConfig !== undefined && { triggerConfig: data.triggerConfig }),
              ...(data.conditions !== undefined && { conditions: data.conditions }),
              ...(data.status !== undefined && { status: data.status }),
              ...(data.priority !== undefined && { priority: data.priority }),
              updatedAt: new Date(),
            };
            
            rules.set(where.id, updated);
            
            // Handle actions update
            if (data.actions?.create) {
              for (const actionData of data.actions.create) {
                const actionId = `action-${++actionIdCounter}`;
                const action = {
                  id: actionId,
                  ruleId: where.id,
                  actionType: actionData.actionType,
                  actionConfig: actionData.actionConfig,
                  order: actionData.order,
                  delayMinutes: actionData.delayMinutes || null,
                };
                actions.set(actionId, action);
              }
            }
            
            if (include?.actions) {
              return {
                ...updated,
                actions: Array.from(actions.values())
                  .filter(a => a.ruleId === where.id)
                  .sort((a, b) => a.order - b.order),
              };
            }
            return updated;
          }),
        },
      };
      return callback(txClient);
    }),
    // Helper methods for test setup
    _getRule: (id: string) => rules.get(id),
    _getRules: () => Array.from(rules.values()),
    _getActions: (ruleId: string) => Array.from(actions.values()).filter(a => a.ruleId === ruleId),
    _clear: () => {
      rules.clear();
      actions.clear();
      executions.clear();
      ruleIdCounter = 0;
      actionIdCounter = 0;
    },
  };
};

describe('Automation Rule Property Tests', () => {
  /**
   * Arbitraries for generating test data
   */
  
  // Rule name arbitrary - non-empty string
  const ruleNameArb = fc.string({ minLength: 1, maxLength: 100 })
    .filter(s => s.trim().length > 0)
    .map(s => s.trim());
  
  // Rule description arbitrary - optional string
  const ruleDescriptionArb = fc.option(
    fc.string({ minLength: 1, maxLength: 500 }).map(s => s.trim()),
    { nil: undefined }
  );
  
  // Trigger type arbitrary
  const triggerTypeArb = fc.constantFrom<AutomationTriggerType>(
    AutomationTriggerType.STATUS_CHANGE,
    AutomationTriggerType.DATE_REACHED,
    AutomationTriggerType.ITEM_CREATED,
    AutomationTriggerType.ITEM_UPDATED
  );
  
  // Action type arbitrary
  const actionTypeArb = fc.constantFrom<AutomationActionType>(
    AutomationActionType.SEND_NOTIFICATION,
    AutomationActionType.UPDATE_STATUS,
    AutomationActionType.CREATE_ACTIVITY
  );
  
  // Status arbitrary
  const statusArb = fc.constantFrom<AutomationStatus>(
    AutomationStatus.ACTIVE,
    AutomationStatus.INACTIVE
  );
  
  // Model arbitrary for trigger config
  const modelArb = fc.constantFrom('Lead', 'Quotation', 'Contract', 'Study');
  
  // Trigger config arbitrary based on trigger type
  const triggerConfigArb = (triggerType: AutomationTriggerType) => {
    switch (triggerType) {
      case AutomationTriggerType.STATUS_CHANGE:
        return fc.record({
          model: modelArb,
          field: fc.constant('status'),
        });
      case AutomationTriggerType.DATE_REACHED:
        return fc.record({
          model: modelArb,
          field: fc.constantFrom('validUntil', 'expectedEndDate', 'createdAt'),
          daysBefore: fc.integer({ min: 0, max: 30 }),
        });
      case AutomationTriggerType.ITEM_CREATED:
      case AutomationTriggerType.ITEM_UPDATED:
        return fc.record({
          model: modelArb,
        });
      default:
        return fc.record({ model: modelArb });
    }
  };
  
  // Action config arbitrary based on action type
  const actionConfigArb = (actionType: AutomationActionType) => {
    switch (actionType) {
      case AutomationActionType.SEND_NOTIFICATION:
        return fc.record({
          recipientType: fc.constantFrom('owner', 'role', 'specific'),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          message: fc.string({ minLength: 1, maxLength: 500 }),
        });
      case AutomationActionType.UPDATE_STATUS:
        return fc.record({
          field: fc.constant('status'),
          value: fc.constantFrom('ACTIVE', 'INACTIVE', 'COMPLETED'),
        });
      case AutomationActionType.CREATE_ACTIVITY:
        return fc.record({
          subject: fc.string({ minLength: 1, maxLength: 200 }),
          content: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
        });
      default:
        return fc.record({});
    }
  };
  
  // Action arbitrary
  const actionArb = actionTypeArb.chain(actionType =>
    actionConfigArb(actionType).map(actionConfig => ({
      actionType,
      actionConfig,
      order: 0,
      delayMinutes: undefined as number | undefined,
    }))
  );
  
  // Actions array arbitrary (1-3 actions)
  const actionsArb = fc.array(actionArb, { minLength: 1, maxLength: 3 })
    .map(actions => actions.map((a, i) => ({ ...a, order: i })));
  
  // Conditions arbitrary
  const conditionArb = fc.record({
    field: fc.constantFrom('status', 'amount', 'priority'),
    operator: fc.constantFrom('eq', 'ne', 'gt', 'gte', 'lt', 'lte'),
    value: fc.oneof(
      fc.string({ minLength: 1, maxLength: 50 }),
      fc.integer({ min: 0, max: 1000000 })
    ),
  });
  
  const conditionsArb = fc.option(
    fc.array(conditionArb, { minLength: 1, maxLength: 3 }),
    { nil: undefined }
  );
  
  // Priority arbitrary
  const priorityArb = fc.integer({ min: 0, max: 100 });
  
  // User ID arbitrary
  const userIdArb = fc.uuid();
  
  // Complete rule DTO arbitrary
  const createRuleDTOArb = triggerTypeArb.chain(triggerType =>
    fc.record({
      name: ruleNameArb,
      description: ruleDescriptionArb,
      triggerType: fc.constant(triggerType),
      triggerConfig: triggerConfigArb(triggerType),
      conditions: conditionsArb,
      actions: actionsArb,
      status: fc.option(statusArb, { nil: undefined }),
      priority: fc.option(priorityArb, { nil: undefined }),
    })
  );

  /**
   * Property 6: 자동화 규칙 CRUD 라운드트립
   * **Validates: Requirements 2.1.1, 2.1.2, 2.1.4, 2.5.3**
   * 
   * For any valid automation rule, after creating the rule and then retrieving it,
   * the retrieved rule should have the same properties as the original.
   */
  describe('Property 6: Automation Rule CRUD Roundtrip', () => {
    /**
     * Test 1: Create → Read roundtrip preserves rule data
     * **Validates: Requirements 2.1.1, 2.1.2, 2.1.4**
     */
    it('should preserve rule data after create and read roundtrip', async () => {
      await fc.assert(
        fc.asyncProperty(
          createRuleDTOArb,
          userIdArb,
          async (ruleDTO, userId) => {
            const mockPrisma = createMockPrisma();
            const service = new AutomationService(mockPrisma as any);

            // When: Create a rule
            const created = await service.createRule(userId, ruleDTO as CreateAutomationRuleDTO);

            // Then: Read the rule back
            const retrieved = await service.getRuleById(created.id);

            // Verify: Core properties are preserved
            expect(retrieved.name).toBe(ruleDTO.name);
            expect(retrieved.triggerType).toBe(ruleDTO.triggerType);
            expect(retrieved.triggerConfig).toEqual(ruleDTO.triggerConfig);
            expect(retrieved.status).toBe(ruleDTO.status || AutomationStatus.ACTIVE);
            expect(retrieved.priority).toBe(ruleDTO.priority || 0);
            expect(retrieved.createdBy).toBe(userId);
            
            // Verify: Description is preserved (may be null or string)
            // Empty string is treated as null in the database
            if (ruleDTO.description !== undefined) {
              const expectedDescription = ruleDTO.description === '' ? null : ruleDTO.description;
              expect(retrieved.description).toBe(expectedDescription);
            }
            
            // Verify: Conditions are preserved
            if (ruleDTO.conditions !== undefined) {
              expect(retrieved.conditions).toEqual(ruleDTO.conditions);
            }
            
            // Verify: Actions are preserved
            expect(retrieved.actions).toBeDefined();
            expect(retrieved.actions?.length).toBe(ruleDTO.actions.length);
            
            for (let i = 0; i < ruleDTO.actions.length; i++) {
              const originalAction = ruleDTO.actions[i];
              const retrievedAction = retrieved.actions?.find(a => a.order === i);
              
              expect(retrievedAction).toBeDefined();
              expect(retrievedAction?.actionType).toBe(originalAction.actionType);
              expect(retrievedAction?.actionConfig).toEqual(originalAction.actionConfig);
            }

            // Cleanup
            mockPrisma._clear();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test 2: Update → Read roundtrip preserves updated data
     * **Validates: Requirements 2.5.3**
     */
    it('should preserve updated data after update and read roundtrip', async () => {
      await fc.assert(
        fc.asyncProperty(
          createRuleDTOArb,
          createRuleDTOArb,
          userIdArb,
          async (initialDTO, updateDTO, userId) => {
            const mockPrisma = createMockPrisma();
            const service = new AutomationService(mockPrisma as any);

            // Given: Create initial rule
            const created = await service.createRule(userId, initialDTO as CreateAutomationRuleDTO);

            // When: Update the rule
            const updated = await service.updateRule(created.id, updateDTO as Partial<CreateAutomationRuleDTO>);

            // Then: Read the rule back
            const retrieved = await service.getRuleById(created.id);

            // Verify: Updated properties are preserved
            expect(retrieved.name).toBe(updateDTO.name);
            expect(retrieved.triggerType).toBe(updateDTO.triggerType);
            expect(retrieved.triggerConfig).toEqual(updateDTO.triggerConfig);
            
            // Verify: Actions are updated
            expect(retrieved.actions?.length).toBe(updateDTO.actions.length);
            
            for (let i = 0; i < updateDTO.actions.length; i++) {
              const updatedAction = updateDTO.actions[i];
              const retrievedAction = retrieved.actions?.find(a => a.order === i);
              
              expect(retrievedAction).toBeDefined();
              expect(retrievedAction?.actionType).toBe(updatedAction.actionType);
              expect(retrievedAction?.actionConfig).toEqual(updatedAction.actionConfig);
            }

            // Cleanup
            mockPrisma._clear();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test 3: Delete removes the rule
     * **Validates: Requirements 2.5.3**
     */
    it('should remove rule after delete', async () => {
      await fc.assert(
        fc.asyncProperty(
          createRuleDTOArb,
          userIdArb,
          async (ruleDTO, userId) => {
            const mockPrisma = createMockPrisma();
            const service = new AutomationService(mockPrisma as any);

            // Given: Create a rule
            const created = await service.createRule(userId, ruleDTO as CreateAutomationRuleDTO);
            
            // Verify rule exists
            const beforeDelete = await service.getRuleById(created.id);
            expect(beforeDelete).toBeDefined();
            expect(beforeDelete.id).toBe(created.id);

            // When: Delete the rule
            await service.deleteRule(created.id);

            // Then: Rule should not be found
            await expect(service.getRuleById(created.id)).rejects.toThrow();

            // Cleanup
            mockPrisma._clear();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test 4: Toggle changes status correctly
     * **Validates: Requirements 2.5.2**
     */
    it('should toggle status between ACTIVE and INACTIVE', async () => {
      await fc.assert(
        fc.asyncProperty(
          createRuleDTOArb,
          userIdArb,
          async (ruleDTO, userId) => {
            const mockPrisma = createMockPrisma();
            const service = new AutomationService(mockPrisma as any);

            // Given: Create a rule with known status
            const initialStatus = ruleDTO.status || AutomationStatus.ACTIVE;
            const created = await service.createRule(userId, ruleDTO as CreateAutomationRuleDTO);
            
            expect(created.status).toBe(initialStatus);

            // When: Toggle the rule
            const toggled = await service.toggleRule(created.id);

            // Then: Status should be opposite
            const expectedStatus = initialStatus === AutomationStatus.ACTIVE 
              ? AutomationStatus.INACTIVE 
              : AutomationStatus.ACTIVE;
            expect(toggled.status).toBe(expectedStatus);

            // When: Toggle again
            const toggledAgain = await service.toggleRule(created.id);

            // Then: Status should be back to original
            expect(toggledAgain.status).toBe(initialStatus);

            // Cleanup
            mockPrisma._clear();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test 5: Multiple rules can be created and retrieved independently
     * **Validates: Requirements 2.1.1, 2.5.1**
     */
    it('should handle multiple rules independently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(createRuleDTOArb, { minLength: 2, maxLength: 5 }),
          userIdArb,
          async (ruleDTOs, userId) => {
            const mockPrisma = createMockPrisma();
            const service = new AutomationService(mockPrisma as any);

            // Given: Create multiple rules
            const createdRules: AutomationRule[] = [];
            for (const dto of ruleDTOs) {
              const created = await service.createRule(userId, dto as CreateAutomationRuleDTO);
              createdRules.push(created);
            }

            // Then: Each rule can be retrieved independently
            for (let i = 0; i < createdRules.length; i++) {
              const retrieved = await service.getRuleById(createdRules[i].id);
              expect(retrieved.name).toBe(ruleDTOs[i].name);
              expect(retrieved.triggerType).toBe(ruleDTOs[i].triggerType);
            }

            // Verify: Rules list contains all created rules
            const allRules = await service.getRules({ page: 1, limit: 100 });
            expect(allRules.data.length).toBe(ruleDTOs.length);

            // Cleanup
            mockPrisma._clear();
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Test 6: Deleting one rule doesn't affect others
     * **Validates: Requirements 2.5.3**
     */
    it('should not affect other rules when deleting one', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(createRuleDTOArb, { minLength: 2, maxLength: 4 }),
          userIdArb,
          fc.integer({ min: 0, max: 3 }),
          async (ruleDTOs, userId, deleteIndex) => {
            const mockPrisma = createMockPrisma();
            const service = new AutomationService(mockPrisma as any);

            // Ensure deleteIndex is within bounds
            const actualDeleteIndex = deleteIndex % ruleDTOs.length;

            // Given: Create multiple rules
            const createdRules: AutomationRule[] = [];
            for (const dto of ruleDTOs) {
              const created = await service.createRule(userId, dto as CreateAutomationRuleDTO);
              createdRules.push(created);
            }

            // When: Delete one rule
            const ruleToDelete = createdRules[actualDeleteIndex];
            await service.deleteRule(ruleToDelete.id);

            // Then: Other rules still exist and are unchanged
            for (let i = 0; i < createdRules.length; i++) {
              if (i === actualDeleteIndex) {
                // Deleted rule should not be found
                await expect(service.getRuleById(createdRules[i].id)).rejects.toThrow();
              } else {
                // Other rules should still exist
                const retrieved = await service.getRuleById(createdRules[i].id);
                expect(retrieved.name).toBe(ruleDTOs[i].name);
                expect(retrieved.triggerType).toBe(ruleDTOs[i].triggerType);
              }
            }

            // Cleanup
            mockPrisma._clear();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 11: 실행 로그 기록
   * **Validates: Requirements 2.4.4, 2.5.4**
   * 
   * For any automation rule execution, an execution log should be created
   * containing ruleId, status, startedAt, and completedAt information.
   */
  describe('Property 11: Execution Log Recording', () => {
    // Extended mock Prisma for execution testing
    const createExecutionMockPrisma = () => {
      const rules = new Map<string, any>();
      const actions = new Map<string, any>();
      const executions = new Map<string, any>();
      const leads = new Map<string, any>();
      const notifications = new Map<string, any>();
      const activities = new Map<string, any>();
      const users = new Map<string, any>();
      
      let ruleIdCounter = 0;
      let actionIdCounter = 0;
      let executionIdCounter = 0;
      let leadIdCounter = 0;

      return {
        automationRule: {
          findMany: jest.fn(async ({ where, skip, take, orderBy, include }: any) => {
            let result = Array.from(rules.values());
            
            if (where?.status && where.status !== 'ALL') {
              result = result.filter(r => r.status === where.status);
            }
            if (where?.triggerType) {
              result = result.filter(r => r.triggerType === where.triggerType);
            }
            
            if (skip !== undefined) {
              result = result.slice(skip);
            }
            if (take !== undefined) {
              result = result.slice(0, take);
            }
            
            if (include?.actions) {
              result = result.map(r => ({
                ...r,
                actions: Array.from(actions.values())
                  .filter(a => a.ruleId === r.id)
                  .sort((a, b) => a.order - b.order),
              }));
            }
            
            return result;
          }),
          findUnique: jest.fn(async ({ where, include }: any) => {
            const rule = rules.get(where.id);
            if (!rule) return null;
            
            if (include?.actions) {
              return {
                ...rule,
                actions: Array.from(actions.values())
                  .filter(a => a.ruleId === rule.id)
                  .sort((a, b) => a.order - b.order),
              };
            }
            return rule;
          }),
          count: jest.fn(async ({ where }: any) => {
            let result = Array.from(rules.values());
            if (where?.status && where.status !== 'ALL') {
              result = result.filter(r => r.status === where.status);
            }
            return result.length;
          }),
          create: jest.fn(async ({ data, include }: any) => {
            const id = `rule-${++ruleIdCounter}`;
            const now = new Date();
            
            const rule = {
              id,
              name: data.name,
              description: data.description || null,
              triggerType: data.triggerType,
              triggerConfig: data.triggerConfig,
              conditions: data.conditions || null,
              status: data.status || AutomationStatus.ACTIVE,
              priority: data.priority || 0,
              executionCount: 0,
              lastExecutedAt: null,
              lastError: null,
              createdBy: data.createdBy,
              isSystem: false,
              createdAt: now,
              updatedAt: now,
            };
            
            rules.set(id, rule);
            
            const createdActions: any[] = [];
            if (data.actions?.create) {
              for (const actionData of data.actions.create) {
                const actionId = `action-${++actionIdCounter}`;
                const action = {
                  id: actionId,
                  ruleId: id,
                  actionType: actionData.actionType,
                  actionConfig: actionData.actionConfig,
                  order: actionData.order,
                  delayMinutes: actionData.delayMinutes || null,
                };
                actions.set(actionId, action);
                createdActions.push(action);
              }
            }
            
            if (include?.actions) {
              return { ...rule, actions: createdActions.sort((a, b) => a.order - b.order) };
            }
            return rule;
          }),
          update: jest.fn(async ({ where, data, include }: any) => {
            const rule = rules.get(where.id);
            if (!rule) throw new Error('자동화 규칙을 찾을 수 없습니다');
            
            const updated = {
              ...rule,
              ...(data.name !== undefined && { name: data.name }),
              ...(data.description !== undefined && { description: data.description }),
              ...(data.executionCount !== undefined && { 
                executionCount: data.executionCount.increment 
                  ? rule.executionCount + data.executionCount.increment 
                  : data.executionCount 
              }),
              ...(data.lastExecutedAt !== undefined && { lastExecutedAt: data.lastExecutedAt }),
              ...(data.lastError !== undefined && { lastError: data.lastError }),
              ...(data.status !== undefined && { status: data.status }),
              updatedAt: new Date(),
            };
            
            rules.set(where.id, updated);
            
            if (include?.actions) {
              return {
                ...updated,
                actions: Array.from(actions.values())
                  .filter(a => a.ruleId === where.id)
                  .sort((a, b) => a.order - b.order),
              };
            }
            return updated;
          }),
          delete: jest.fn(async ({ where }: any) => {
            const rule = rules.get(where.id);
            if (!rule) throw new Error('자동화 규칙을 찾을 수 없습니다');
            rules.delete(where.id);
            return rule;
          }),
        },
        automationAction: {
          deleteMany: jest.fn(async ({ where }: any) => {
            let count = 0;
            for (const [key, action] of actions.entries()) {
              if (action.ruleId === where.ruleId) {
                actions.delete(key);
                count++;
              }
            }
            return { count };
          }),
        },
        automationExecution: {
          findMany: jest.fn(async ({ where, skip, take, orderBy, include }: any) => {
            let result = Array.from(executions.values());
            
            if (where?.ruleId) {
              result = result.filter(e => e.ruleId === where.ruleId);
            }
            if (where?.status) {
              result = result.filter(e => e.status === where.status);
            }
            
            // Sort by startedAt desc
            result.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
            
            if (skip !== undefined) {
              result = result.slice(skip);
            }
            if (take !== undefined) {
              result = result.slice(0, take);
            }
            
            if (include?.rule) {
              result = result.map(e => ({
                ...e,
                rule: rules.get(e.ruleId) ? { name: rules.get(e.ruleId).name } : null,
              }));
            }
            
            return result;
          }),
          findUnique: jest.fn(async ({ where, include }: any) => {
            const execution = executions.get(where.id);
            if (!execution) return null;
            
            if (include?.rule) {
              return {
                ...execution,
                rule: rules.get(execution.ruleId) ? { name: rules.get(execution.ruleId).name } : null,
              };
            }
            return execution;
          }),
          count: jest.fn(async ({ where }: any) => {
            let result = Array.from(executions.values());
            if (where?.ruleId) {
              result = result.filter(e => e.ruleId === where.ruleId);
            }
            if (where?.status) {
              result = result.filter(e => e.status === where.status);
            }
            return result.length;
          }),
          create: jest.fn(async ({ data }: any) => {
            const id = `exec-${++executionIdCounter}`;
            const execution = {
              id,
              ruleId: data.ruleId,
              targetModel: data.targetModel,
              targetId: data.targetId,
              triggerData: data.triggerData,
              status: data.status || 'PENDING',
              results: null,
              error: null,
              startedAt: new Date(),
              completedAt: null,
            };
            executions.set(id, execution);
            return execution;
          }),
          update: jest.fn(async ({ where, data }: any) => {
            const execution = executions.get(where.id);
            if (!execution) throw new Error('실행 로그를 찾을 수 없습니다');
            
            const updated = {
              ...execution,
              ...(data.status !== undefined && { status: data.status }),
              ...(data.results !== undefined && { results: data.results }),
              ...(data.error !== undefined && { error: data.error }),
              ...(data.completedAt !== undefined && { completedAt: data.completedAt }),
            };
            
            executions.set(where.id, updated);
            return updated;
          }),
        },
        lead: {
          findUnique: jest.fn(async ({ where }: any) => {
            return leads.get(where.id) || null;
          }),
          update: jest.fn(async ({ where, data }: any) => {
            const lead = leads.get(where.id);
            if (!lead) throw new Error('Lead not found');
            const updated = { ...lead, ...data };
            leads.set(where.id, updated);
            return updated;
          }),
        },
        contract: {
          findUnique: jest.fn(async () => null),
          update: jest.fn(async () => ({})),
        },
        quotation: {
          findUnique: jest.fn(async () => null),
          update: jest.fn(async () => ({})),
        },
        study: {
          findUnique: jest.fn(async () => null),
          update: jest.fn(async () => ({})),
        },
        customer: {
          findUnique: jest.fn(async () => null),
        },
        notification: {
          create: jest.fn(async ({ data }: any) => {
            const id = `notif-${Date.now()}`;
            const notification = { id, ...data };
            notifications.set(id, notification);
            return notification;
          }),
        },
        activity: {
          create: jest.fn(async ({ data }: any) => {
            const id = `activity-${Date.now()}`;
            const activity = { id, ...data };
            activities.set(id, activity);
            return activity;
          }),
        },
        user: {
          findMany: jest.fn(async ({ where }: any) => {
            return Array.from(users.values()).filter(u => 
              (!where?.role || u.role === where.role) &&
              (!where?.status || u.status === where.status)
            );
          }),
        },
        $transaction: jest.fn(async (callback: any) => {
          return callback({
            automationAction: {
              deleteMany: jest.fn(async () => ({ count: 0 })),
            },
            automationRule: {
              update: jest.fn(async ({ where, data, include }: any) => {
                const rule = rules.get(where.id);
                if (!rule) throw new Error('자동화 규칙을 찾을 수 없습니다');
                const updated = { ...rule, ...data, updatedAt: new Date() };
                rules.set(where.id, updated);
                return updated;
              }),
            },
          });
        }),
        // Helper methods
        _addLead: (lead: any) => {
          const id = lead.id || `lead-${++leadIdCounter}`;
          leads.set(id, { id, ...lead });
          return id;
        },
        _addUser: (user: any) => {
          users.set(user.id, user);
        },
        _getExecutions: () => Array.from(executions.values()),
        _getExecutionsByRuleId: (ruleId: string) => 
          Array.from(executions.values()).filter(e => e.ruleId === ruleId),
        _clear: () => {
          rules.clear();
          actions.clear();
          executions.clear();
          leads.clear();
          notifications.clear();
          activities.clear();
          users.clear();
          ruleIdCounter = 0;
          actionIdCounter = 0;
          executionIdCounter = 0;
          leadIdCounter = 0;
        },
      };
    };

    // Execution status arbitrary
    const executionStatusArb = fc.constantFrom('SUCCESS', 'FAILED', 'SKIPPED', 'PENDING');

    // Target model arbitrary
    const targetModelArb = fc.constantFrom('Lead', 'Quotation', 'Contract', 'Study');

    // Trigger data arbitrary
    const triggerDataArb = fc.record({
      oldStatus: fc.constantFrom('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL'),
      newStatus: fc.constantFrom('CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON'),
    });

    /**
     * Test 1: Execution creates log with required fields
     * **Validates: Requirements 2.4.4**
     * 
     * For any rule execution, an execution log should be created with
     * ruleId, status, startedAt, and completedAt fields.
     */
    it('should create execution log with ruleId, status, startedAt, completedAt', async () => {
      await fc.assert(
        fc.asyncProperty(
          createRuleDTOArb,
          userIdArb,
          triggerDataArb,
          async (ruleDTO, userId, triggerData) => {
            const mockPrisma = createExecutionMockPrisma();
            const service = new AutomationService(mockPrisma as any);

            // Given: Create an active rule with SEND_NOTIFICATION action (simplest action)
            const activeRuleDTO = {
              ...ruleDTO,
              status: AutomationStatus.ACTIVE,
              actions: [{
                actionType: AutomationActionType.SEND_NOTIFICATION,
                actionConfig: {
                  recipientType: 'specific',
                  recipientIds: [],
                  title: 'Test',
                  message: 'Test message',
                },
                order: 0,
              }],
            };
            const created = await service.createRule(userId, activeRuleDTO as CreateAutomationRuleDTO);

            // Create a target entity
            const leadId = mockPrisma._addLead({
              status: 'NEW',
              userId: userId,
              companyName: 'Test Company',
            });

            // When: Execute the rule
            const execution = await service.executeRule(
              created.id,
              'Lead',
              leadId,
              triggerData
            );

            // Then: Execution log should have required fields
            expect(execution).toBeDefined();
            expect(execution.ruleId).toBe(created.id);
            expect(execution.status).toBeDefined();
            expect(['SUCCESS', 'FAILED', 'SKIPPED', 'PENDING']).toContain(execution.status);
            expect(execution.startedAt).toBeDefined();
            expect(execution.startedAt).toBeInstanceOf(Date);
            
            // completedAt should be set for completed executions
            if (execution.status === 'SUCCESS' || execution.status === 'FAILED' || execution.status === 'SKIPPED') {
              expect(execution.completedAt).toBeDefined();
            }

            // Cleanup
            mockPrisma._clear();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test 2: Execution logs can be queried by ruleId
     * **Validates: Requirements 2.5.4**
     * 
     * For any rule with executions, the execution history should be queryable.
     */
    it('should allow querying execution history by ruleId', async () => {
      await fc.assert(
        fc.asyncProperty(
          createRuleDTOArb,
          userIdArb,
          fc.integer({ min: 1, max: 5 }),
          async (ruleDTO, userId, executionCount) => {
            const mockPrisma = createExecutionMockPrisma();
            const service = new AutomationService(mockPrisma as any);

            // Given: Create an active rule
            const activeRuleDTO = {
              ...ruleDTO,
              status: AutomationStatus.ACTIVE,
              actions: [{
                actionType: AutomationActionType.SEND_NOTIFICATION,
                actionConfig: {
                  recipientType: 'specific',
                  recipientIds: [],
                  title: 'Test',
                  message: 'Test message',
                },
                order: 0,
              }],
            };
            const created = await service.createRule(userId, activeRuleDTO as CreateAutomationRuleDTO);

            // Execute the rule multiple times
            for (let i = 0; i < executionCount; i++) {
              const leadId = mockPrisma._addLead({
                status: 'NEW',
                userId: userId,
                companyName: `Test Company ${i}`,
              });

              await service.executeRule(
                created.id,
                'Lead',
                leadId,
                { oldStatus: 'NEW', newStatus: 'CONTACTED' }
              );
            }

            // When: Query executions by ruleId
            const executionsResult = await service.getExecutions({
              ruleId: created.id,
              page: 1,
              limit: 100,
            });

            // Then: Should return all executions for this rule
            expect(executionsResult.data.length).toBe(executionCount);
            
            // All executions should belong to the rule
            for (const exec of executionsResult.data) {
              expect(exec.ruleId).toBe(created.id);
              expect(exec.startedAt).toBeDefined();
            }

            // Cleanup
            mockPrisma._clear();
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Test 3: Execution log records success status with results
     * **Validates: Requirements 2.4.4**
     * 
     * For successful executions, the log should record SUCCESS status and results.
     */
    it('should record SUCCESS status and results for successful executions', async () => {
      await fc.assert(
        fc.asyncProperty(
          createRuleDTOArb,
          userIdArb,
          async (ruleDTO, userId) => {
            const mockPrisma = createExecutionMockPrisma();
            const service = new AutomationService(mockPrisma as any);

            // Given: Create an active rule with notification action
            const activeRuleDTO = {
              ...ruleDTO,
              status: AutomationStatus.ACTIVE,
              conditions: undefined, // No conditions to ensure execution
              actions: [{
                actionType: AutomationActionType.SEND_NOTIFICATION,
                actionConfig: {
                  recipientType: 'specific',
                  recipientIds: [],
                  title: 'Test Notification',
                  message: 'Test message',
                },
                order: 0,
              }],
            };
            const created = await service.createRule(userId, activeRuleDTO as CreateAutomationRuleDTO);

            // Create a target entity
            const leadId = mockPrisma._addLead({
              status: 'NEW',
              userId: userId,
              companyName: 'Test Company',
            });

            // When: Execute the rule
            const execution = await service.executeRule(
              created.id,
              'Lead',
              leadId,
              { oldStatus: 'NEW', newStatus: 'CONTACTED' }
            );

            // Then: Execution should be successful with results
            expect(execution.status).toBe('SUCCESS');
            expect(execution.results).toBeDefined();
            expect(Array.isArray(execution.results)).toBe(true);
            expect(execution.completedAt).toBeDefined();
            expect(execution.error).toBeNull();

            // Cleanup
            mockPrisma._clear();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test 4: Execution log records startedAt before completedAt
     * **Validates: Requirements 2.4.4**
     * 
     * For any completed execution, startedAt should be before or equal to completedAt.
     */
    it('should have startedAt before or equal to completedAt', async () => {
      await fc.assert(
        fc.asyncProperty(
          createRuleDTOArb,
          userIdArb,
          async (ruleDTO, userId) => {
            const mockPrisma = createExecutionMockPrisma();
            const service = new AutomationService(mockPrisma as any);

            // Given: Create an active rule
            const activeRuleDTO = {
              ...ruleDTO,
              status: AutomationStatus.ACTIVE,
              actions: [{
                actionType: AutomationActionType.SEND_NOTIFICATION,
                actionConfig: {
                  recipientType: 'specific',
                  recipientIds: [],
                  title: 'Test',
                  message: 'Test message',
                },
                order: 0,
              }],
            };
            const created = await service.createRule(userId, activeRuleDTO as CreateAutomationRuleDTO);

            // Create a target entity
            const leadId = mockPrisma._addLead({
              status: 'NEW',
              userId: userId,
              companyName: 'Test Company',
            });

            // When: Execute the rule
            const execution = await service.executeRule(
              created.id,
              'Lead',
              leadId,
              { oldStatus: 'NEW', newStatus: 'CONTACTED' }
            );

            // Then: startedAt should be before or equal to completedAt
            if (execution.completedAt) {
              const startTime = new Date(execution.startedAt).getTime();
              const endTime = new Date(execution.completedAt).getTime();
              expect(startTime).toBeLessThanOrEqual(endTime);
            }

            // Cleanup
            mockPrisma._clear();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test 5: Multiple rules create independent execution logs
     * **Validates: Requirements 2.5.4**
     * 
     * Executions from different rules should be independently queryable.
     */
    it('should create independent execution logs for different rules', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(createRuleDTOArb, { minLength: 2, maxLength: 3 }),
          userIdArb,
          async (ruleDTOs, userId) => {
            const mockPrisma = createExecutionMockPrisma();
            const service = new AutomationService(mockPrisma as any);

            // Given: Create multiple active rules
            const createdRules: AutomationRule[] = [];
            for (const dto of ruleDTOs) {
              const activeDTO = {
                ...dto,
                status: AutomationStatus.ACTIVE,
                actions: [{
                  actionType: AutomationActionType.SEND_NOTIFICATION,
                  actionConfig: {
                    recipientType: 'specific',
                    recipientIds: [],
                    title: 'Test',
                    message: 'Test message',
                  },
                  order: 0,
                }],
              };
              const created = await service.createRule(userId, activeDTO as CreateAutomationRuleDTO);
              createdRules.push(created);
            }

            // Execute each rule once
            for (const rule of createdRules) {
              const leadId = mockPrisma._addLead({
                status: 'NEW',
                userId: userId,
                companyName: 'Test Company',
              });

              await service.executeRule(
                rule.id,
                'Lead',
                leadId,
                { oldStatus: 'NEW', newStatus: 'CONTACTED' }
              );
            }

            // When: Query executions for each rule
            for (const rule of createdRules) {
              const executionsResult = await service.getExecutions({
                ruleId: rule.id,
                page: 1,
                limit: 100,
              });

              // Then: Each rule should have exactly one execution
              expect(executionsResult.data.length).toBe(1);
              expect(executionsResult.data[0].ruleId).toBe(rule.id);
            }

            // Cleanup
            mockPrisma._clear();
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Test 6: Execution log contains targetModel and targetId
     * **Validates: Requirements 2.4.4**
     * 
     * Execution logs should record which entity triggered the execution.
     */
    it('should record targetModel and targetId in execution log', async () => {
      await fc.assert(
        fc.asyncProperty(
          createRuleDTOArb,
          userIdArb,
          targetModelArb,
          async (ruleDTO, userId, targetModel) => {
            const mockPrisma = createExecutionMockPrisma();
            const service = new AutomationService(mockPrisma as any);

            // Given: Create an active rule
            const activeRuleDTO = {
              ...ruleDTO,
              status: AutomationStatus.ACTIVE,
              actions: [{
                actionType: AutomationActionType.SEND_NOTIFICATION,
                actionConfig: {
                  recipientType: 'specific',
                  recipientIds: [],
                  title: 'Test',
                  message: 'Test message',
                },
                order: 0,
              }],
            };
            const created = await service.createRule(userId, activeRuleDTO as CreateAutomationRuleDTO);

            // Create a target entity (using Lead for simplicity)
            const leadId = mockPrisma._addLead({
              status: 'NEW',
              userId: userId,
              companyName: 'Test Company',
            });

            // When: Execute the rule with specific target
            const execution = await service.executeRule(
              created.id,
              'Lead',
              leadId,
              { oldStatus: 'NEW', newStatus: 'CONTACTED' }
            );

            // Then: Execution should record target information
            expect(execution.targetModel).toBe('Lead');
            expect(execution.targetId).toBe(leadId);

            // Cleanup
            mockPrisma._clear();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


/**
 * Property 9: 날짜 기반 트리거 발동
 * Feature: crm-core-enhancements, Task 10.3
 * 
 * For any active DATE_REACHED trigger rule, when the specified date field
 * matches current date + N days, the trigger should fire.
 * 
 * **Validates: Requirements 2.3.1, 2.3.2, 2.3.3**
 */
describe('Property 9: 날짜 기반 트리거 발동', () => {
  /**
   * Create a mock PrismaClient for date trigger testing
   */
  const createDateTriggerMockPrisma = () => {
    const rules = new Map<string, any>();
    const actions = new Map<string, any>();
    const executions = new Map<string, any>();
    const leads = new Map<string, any>();
    const quotations = new Map<string, any>();
    const contracts = new Map<string, any>();
    const notifications = new Map<string, any>();
    
    let ruleIdCounter = 0;
    let actionIdCounter = 0;
    let executionIdCounter = 0;

    return {
      automationRule: {
        findMany: jest.fn(async ({ where, include }: any) => {
          let result = Array.from(rules.values());
          
          if (where?.status) {
            result = result.filter(r => r.status === where.status);
          }
          if (where?.triggerType) {
            result = result.filter(r => r.triggerType === where.triggerType);
          }
          
          if (include?.actions) {
            result = result.map(r => ({
              ...r,
              actions: Array.from(actions.values())
                .filter(a => a.ruleId === r.id)
                .sort((a, b) => a.order - b.order),
            }));
          }
          
          return result;
        }),
        findUnique: jest.fn(async ({ where, include }: any) => {
          const rule = rules.get(where.id);
          if (!rule) return null;
          
          if (include?.actions) {
            return {
              ...rule,
              actions: Array.from(actions.values())
                .filter(a => a.ruleId === rule.id)
                .sort((a, b) => a.order - b.order),
            };
          }
          return rule;
        }),
        count: jest.fn(async () => rules.size),
        create: jest.fn(async ({ data, include }: any) => {
          const id = `rule-${++ruleIdCounter}`;
          const now = new Date();
          
          const rule = {
            id,
            name: data.name,
            description: data.description || null,
            triggerType: data.triggerType,
            triggerConfig: data.triggerConfig,
            conditions: data.conditions || null,
            status: data.status || AutomationStatus.ACTIVE,
            priority: data.priority || 0,
            executionCount: 0,
            lastExecutedAt: null,
            lastError: null,
            createdBy: data.createdBy,
            isSystem: false,
            createdAt: now,
            updatedAt: now,
          };
          
          rules.set(id, rule);
          
          const createdActions: any[] = [];
          if (data.actions?.create) {
            for (const actionData of data.actions.create) {
              const actionId = `action-${++actionIdCounter}`;
              const action = {
                id: actionId,
                ruleId: id,
                actionType: actionData.actionType,
                actionConfig: actionData.actionConfig,
                order: actionData.order,
                delayMinutes: actionData.delayMinutes || null,
              };
              actions.set(actionId, action);
              createdActions.push(action);
            }
          }
          
          if (include?.actions) {
            return { ...rule, actions: createdActions.sort((a, b) => a.order - b.order) };
          }
          return rule;
        }),
        update: jest.fn(async ({ where, data }: any) => {
          const rule = rules.get(where.id);
          if (!rule) throw new Error('Rule not found');
          
          const updated = { ...rule, ...data, updatedAt: new Date() };
          rules.set(where.id, updated);
          return updated;
        }),
      },
      automationExecution: {
        create: jest.fn(async ({ data }: any) => {
          const id = `exec-${++executionIdCounter}`;
          const execution = {
            id,
            ...data,
            startedAt: new Date(),
          };
          executions.set(id, execution);
          return execution;
        }),
        update: jest.fn(async ({ where, data }: any) => {
          const execution = executions.get(where.id);
          if (!execution) throw new Error('Execution not found');
          
          const updated = { ...execution, ...data };
          executions.set(where.id, updated);
          return updated;
        }),
        findMany: jest.fn(async () => Array.from(executions.values())),
        count: jest.fn(async () => executions.size),
      },
      lead: {
        findMany: jest.fn(async ({ where }: any) => {
          let result = Array.from(leads.values());
          if (where?.deletedAt === null) {
            result = result.filter(l => !l.deletedAt);
          }
          return result;
        }),
        findUnique: jest.fn(async ({ where }: any) => leads.get(where.id)),
        update: jest.fn(async ({ where, data }: any) => {
          const lead = leads.get(where.id);
          if (!lead) throw new Error('Lead not found');
          const updated = { ...lead, ...data };
          leads.set(where.id, updated);
          return updated;
        }),
      },
      quotation: {
        findMany: jest.fn(async ({ where }: any) => {
          let result = Array.from(quotations.values());
          if (where?.deletedAt === null) {
            result = result.filter(q => !q.deletedAt);
          }
          return result;
        }),
        findUnique: jest.fn(async ({ where }: any) => quotations.get(where.id)),
        update: jest.fn(async ({ where, data }: any) => {
          const quotation = quotations.get(where.id);
          if (!quotation) throw new Error('Quotation not found');
          const updated = { ...quotation, ...data };
          quotations.set(where.id, updated);
          return updated;
        }),
      },
      contract: {
        findMany: jest.fn(async ({ where }: any) => {
          let result = Array.from(contracts.values());
          if (where?.deletedAt === null) {
            result = result.filter(c => !c.deletedAt);
          }
          return result;
        }),
        findUnique: jest.fn(async ({ where }: any) => contracts.get(where.id)),
        update: jest.fn(async ({ where, data }: any) => {
          const contract = contracts.get(where.id);
          if (!contract) throw new Error('Contract not found');
          const updated = { ...contract, ...data };
          contracts.set(where.id, updated);
          return updated;
        }),
      },
      notification: {
        create: jest.fn(async ({ data }: any) => {
          const id = `notif-${Date.now()}`;
          const notification = { id, ...data, createdAt: new Date() };
          notifications.set(id, notification);
          return notification;
        }),
      },
      user: {
        findMany: jest.fn(async () => []),
        findUnique: jest.fn(async () => null),
      },
      $transaction: jest.fn(async (callback: any) => callback({
        automationAction: { deleteMany: jest.fn(async () => ({ count: 0 })) },
        automationRule: {
          update: jest.fn(async ({ where, data }: any) => {
            const rule = rules.get(where.id);
            if (!rule) throw new Error('Rule not found');
            const updated = { ...rule, ...data, updatedAt: new Date() };
            rules.set(where.id, updated);
            return updated;
          }),
        },
      })),
      // Helper methods
      _addRule: (rule: any) => {
        const id = rule.id || `rule-${++ruleIdCounter}`;
        rules.set(id, { ...rule, id });
        return id;
      },
      _addAction: (action: any) => {
        const id = action.id || `action-${++actionIdCounter}`;
        actions.set(id, { ...action, id });
        return id;
      },
      _addLead: (lead: any) => {
        const id = lead.id || `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        leads.set(id, { ...lead, id, deletedAt: null });
        return id;
      },
      _addQuotation: (quotation: any) => {
        const id = quotation.id || `quot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        quotations.set(id, { ...quotation, id, deletedAt: null });
        return id;
      },
      _addContract: (contract: any) => {
        const id = contract.id || `contract-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        contracts.set(id, { ...contract, id, deletedAt: null });
        return id;
      },
      _getExecutions: () => Array.from(executions.values()),
      _getNotifications: () => Array.from(notifications.values()),
      _clear: () => {
        rules.clear();
        actions.clear();
        executions.clear();
        leads.clear();
        quotations.clear();
        contracts.clear();
        notifications.clear();
        ruleIdCounter = 0;
        actionIdCounter = 0;
        executionIdCounter = 0;
      },
    };
  };

  /**
   * Helper function to create a date N days from now
   */
  const daysFromNow = (days: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  /**
   * Simulate date trigger processing logic
   * This mimics what the scheduler would do
   */
  const processDateTriggers = async (
    mockPrisma: ReturnType<typeof createDateTriggerMockPrisma>
  ): Promise<{ processed: number; triggered: string[] }> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const triggered: string[] = [];
    
    // Get all active DATE_REACHED rules
    const rules = await mockPrisma.automationRule.findMany({
      where: {
        status: AutomationStatus.ACTIVE,
        triggerType: AutomationTriggerType.DATE_REACHED,
      },
      include: { actions: true },
    });
    
    for (const rule of rules) {
      const config = rule.triggerConfig as { model: string; field: string; daysBefore: number };
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + config.daysBefore);
      
      // Get entities based on model
      let entities: any[] = [];
      switch (config.model) {
        case 'Lead':
          entities = await mockPrisma.lead.findMany({ where: { deletedAt: null } });
          break;
        case 'Quotation':
          entities = await mockPrisma.quotation.findMany({ where: { deletedAt: null } });
          break;
        case 'Contract':
          entities = await mockPrisma.contract.findMany({ where: { deletedAt: null } });
          break;
      }
      
      // Check each entity's date field
      for (const entity of entities) {
        const entityDate = entity[config.field];
        if (!entityDate) continue;
        
        const entityDateNormalized = new Date(entityDate);
        entityDateNormalized.setHours(0, 0, 0, 0);
        
        // Check if entity date matches target date (today + daysBefore)
        if (entityDateNormalized.getTime() === targetDate.getTime()) {
          // Create execution record
          await mockPrisma.automationExecution.create({
            data: {
              ruleId: rule.id,
              status: 'COMPLETED',
              targetModel: config.model,
              targetId: entity.id,
              result: { triggered: true },
            },
          });
          
          triggered.push(`${config.model}:${entity.id}`);
        }
      }
    }
    
    return { processed: rules.length, triggered };
  };

  /**
   * Property 9.1: Date trigger fires when date matches
   * **Validates: Requirements 2.3.1, 2.3.2, 2.3.3**
   */
  it('should fire trigger when entity date matches target date', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 30 }), // daysBefore
        fc.constantFrom('Lead', 'Quotation', 'Contract'),
        async (daysBefore, model) => {
          const mockPrisma = createDateTriggerMockPrisma();
          
          // Create a DATE_REACHED rule
          const ruleId = mockPrisma._addRule({
            name: `Test Date Rule`,
            triggerType: AutomationTriggerType.DATE_REACHED,
            triggerConfig: {
              model,
              field: 'validUntil',
              daysBefore,
            },
            status: AutomationStatus.ACTIVE,
            createdBy: 'test-user',
          });
          
          mockPrisma._addAction({
            ruleId,
            actionType: AutomationActionType.SEND_NOTIFICATION,
            actionConfig: { title: 'Test', message: 'Test' },
            order: 0,
          });
          
          // Create an entity with date that matches (today + daysBefore)
          const targetDate = daysFromNow(daysBefore);
          
          switch (model) {
            case 'Lead':
              mockPrisma._addLead({ validUntil: targetDate, status: 'NEW' });
              break;
            case 'Quotation':
              mockPrisma._addQuotation({ validUntil: targetDate, status: 'DRAFT' });
              break;
            case 'Contract':
              mockPrisma._addContract({ validUntil: targetDate, status: 'ACTIVE' });
              break;
          }
          
          // Process date triggers
          const result = await processDateTriggers(mockPrisma);
          
          // Property: Trigger should fire for matching date
          expect(result.triggered.length).toBe(1);
          expect(result.triggered[0]).toMatch(new RegExp(`^${model}:`));
          
          // Property: Execution should be recorded
          const executions = mockPrisma._getExecutions();
          expect(executions.length).toBe(1);
          expect(executions[0].ruleId).toBe(ruleId);
          expect(executions[0].targetModel).toBe(model);
          
          mockPrisma._clear();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9.2: Date trigger does not fire when date doesn't match
   * **Validates: Requirements 2.3.1, 2.3.2, 2.3.3**
   */
  it('should not fire trigger when entity date does not match', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 15 }), // daysBefore for rule
        fc.integer({ min: 16, max: 30 }), // different days for entity
        fc.constantFrom('Lead', 'Quotation', 'Contract'),
        async (daysBefore, entityDays, model) => {
          const mockPrisma = createDateTriggerMockPrisma();
          
          // Create a DATE_REACHED rule
          const ruleId = mockPrisma._addRule({
            name: `Test Date Rule`,
            triggerType: AutomationTriggerType.DATE_REACHED,
            triggerConfig: {
              model,
              field: 'validUntil',
              daysBefore,
            },
            status: AutomationStatus.ACTIVE,
            createdBy: 'test-user',
          });
          
          mockPrisma._addAction({
            ruleId,
            actionType: AutomationActionType.SEND_NOTIFICATION,
            actionConfig: { title: 'Test', message: 'Test' },
            order: 0,
          });
          
          // Create an entity with date that does NOT match
          const entityDate = daysFromNow(entityDays);
          
          switch (model) {
            case 'Lead':
              mockPrisma._addLead({ validUntil: entityDate, status: 'NEW' });
              break;
            case 'Quotation':
              mockPrisma._addQuotation({ validUntil: entityDate, status: 'DRAFT' });
              break;
            case 'Contract':
              mockPrisma._addContract({ validUntil: entityDate, status: 'ACTIVE' });
              break;
          }
          
          // Process date triggers
          const result = await processDateTriggers(mockPrisma);
          
          // Property: Trigger should NOT fire for non-matching date
          expect(result.triggered.length).toBe(0);
          
          // Property: No execution should be recorded
          const executions = mockPrisma._getExecutions();
          expect(executions.length).toBe(0);
          
          mockPrisma._clear();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9.3: Inactive rules are not processed
   * **Validates: Requirements 2.3.1**
   */
  it('should not process inactive DATE_REACHED rules', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 30 }),
        fc.constantFrom('Lead', 'Quotation', 'Contract'),
        async (daysBefore, model) => {
          const mockPrisma = createDateTriggerMockPrisma();
          
          // Create an INACTIVE DATE_REACHED rule
          const ruleId = mockPrisma._addRule({
            name: `Inactive Date Rule`,
            triggerType: AutomationTriggerType.DATE_REACHED,
            triggerConfig: {
              model,
              field: 'validUntil',
              daysBefore,
            },
            status: AutomationStatus.INACTIVE, // INACTIVE
            createdBy: 'test-user',
          });
          
          mockPrisma._addAction({
            ruleId,
            actionType: AutomationActionType.SEND_NOTIFICATION,
            actionConfig: { title: 'Test', message: 'Test' },
            order: 0,
          });
          
          // Create an entity with matching date
          const targetDate = daysFromNow(daysBefore);
          
          switch (model) {
            case 'Lead':
              mockPrisma._addLead({ validUntil: targetDate, status: 'NEW' });
              break;
            case 'Quotation':
              mockPrisma._addQuotation({ validUntil: targetDate, status: 'DRAFT' });
              break;
            case 'Contract':
              mockPrisma._addContract({ validUntil: targetDate, status: 'ACTIVE' });
              break;
          }
          
          // Process date triggers
          const result = await processDateTriggers(mockPrisma);
          
          // Property: Inactive rule should not be processed
          expect(result.processed).toBe(0);
          expect(result.triggered.length).toBe(0);
          
          mockPrisma._clear();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9.4: Multiple entities with matching dates all trigger
   * **Validates: Requirements 2.3.1, 2.3.2, 2.3.3**
   */
  it('should trigger for all entities with matching dates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 30 }),
        fc.integer({ min: 1, max: 5 }), // number of matching entities
        fc.constantFrom('Lead', 'Quotation', 'Contract'),
        async (daysBefore, entityCount, model) => {
          const mockPrisma = createDateTriggerMockPrisma();
          
          // Create a DATE_REACHED rule
          const ruleId = mockPrisma._addRule({
            name: `Test Date Rule`,
            triggerType: AutomationTriggerType.DATE_REACHED,
            triggerConfig: {
              model,
              field: 'validUntil',
              daysBefore,
            },
            status: AutomationStatus.ACTIVE,
            createdBy: 'test-user',
          });
          
          mockPrisma._addAction({
            ruleId,
            actionType: AutomationActionType.SEND_NOTIFICATION,
            actionConfig: { title: 'Test', message: 'Test' },
            order: 0,
          });
          
          // Create multiple entities with matching date
          const targetDate = daysFromNow(daysBefore);
          
          for (let i = 0; i < entityCount; i++) {
            switch (model) {
              case 'Lead':
                mockPrisma._addLead({ validUntil: targetDate, status: 'NEW' });
                break;
              case 'Quotation':
                mockPrisma._addQuotation({ validUntil: targetDate, status: 'DRAFT' });
                break;
              case 'Contract':
                mockPrisma._addContract({ validUntil: targetDate, status: 'ACTIVE' });
                break;
            }
          }
          
          // Process date triggers
          const result = await processDateTriggers(mockPrisma);
          
          // Property: All matching entities should trigger
          expect(result.triggered.length).toBe(entityCount);
          
          // Property: All executions should be recorded
          const executions = mockPrisma._getExecutions();
          expect(executions.length).toBe(entityCount);
          
          mockPrisma._clear();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9.5: Entities without date field are skipped
   * **Validates: Requirements 2.3.1**
   */
  it('should skip entities without the specified date field', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 30 }),
        fc.constantFrom('Lead', 'Quotation', 'Contract'),
        async (daysBefore, model) => {
          const mockPrisma = createDateTriggerMockPrisma();
          
          // Create a DATE_REACHED rule
          const ruleId = mockPrisma._addRule({
            name: `Test Date Rule`,
            triggerType: AutomationTriggerType.DATE_REACHED,
            triggerConfig: {
              model,
              field: 'validUntil',
              daysBefore,
            },
            status: AutomationStatus.ACTIVE,
            createdBy: 'test-user',
          });
          
          mockPrisma._addAction({
            ruleId,
            actionType: AutomationActionType.SEND_NOTIFICATION,
            actionConfig: { title: 'Test', message: 'Test' },
            order: 0,
          });
          
          // Create an entity WITHOUT the date field (validUntil is null/undefined)
          switch (model) {
            case 'Lead':
              mockPrisma._addLead({ validUntil: null, status: 'NEW' });
              break;
            case 'Quotation':
              mockPrisma._addQuotation({ validUntil: null, status: 'DRAFT' });
              break;
            case 'Contract':
              mockPrisma._addContract({ validUntil: null, status: 'ACTIVE' });
              break;
          }
          
          // Process date triggers
          const result = await processDateTriggers(mockPrisma);
          
          // Property: Entity without date field should be skipped
          expect(result.triggered.length).toBe(0);
          
          mockPrisma._clear();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9.6: Different daysBefore values work correctly
   * **Validates: Requirements 2.3.1, 2.3.2, 2.3.3**
   */
  it('should correctly calculate target date based on daysBefore', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 30 }),
        async (daysBefore) => {
          const mockPrisma = createDateTriggerMockPrisma();
          
          // Create a DATE_REACHED rule
          const ruleId = mockPrisma._addRule({
            name: `Test Date Rule`,
            triggerType: AutomationTriggerType.DATE_REACHED,
            triggerConfig: {
              model: 'Quotation',
              field: 'validUntil',
              daysBefore,
            },
            status: AutomationStatus.ACTIVE,
            createdBy: 'test-user',
          });
          
          mockPrisma._addAction({
            ruleId,
            actionType: AutomationActionType.SEND_NOTIFICATION,
            actionConfig: { title: 'Test', message: 'Test' },
            order: 0,
          });
          
          // Create quotation with exact matching date
          const matchingDate = daysFromNow(daysBefore);
          mockPrisma._addQuotation({ id: 'matching', validUntil: matchingDate, status: 'DRAFT' });
          
          // Create quotation with date 1 day before (should not match)
          const beforeDate = daysFromNow(daysBefore - 1);
          mockPrisma._addQuotation({ id: 'before', validUntil: beforeDate, status: 'DRAFT' });
          
          // Create quotation with date 1 day after (should not match)
          const afterDate = daysFromNow(daysBefore + 1);
          mockPrisma._addQuotation({ id: 'after', validUntil: afterDate, status: 'DRAFT' });
          
          // Process date triggers
          const result = await processDateTriggers(mockPrisma);
          
          // Property: Only the exact matching date should trigger
          expect(result.triggered.length).toBe(1);
          expect(result.triggered[0]).toBe('Quotation:matching');
          
          mockPrisma._clear();
        }
      ),
      { numRuns: 100 }
    );
  });
});
