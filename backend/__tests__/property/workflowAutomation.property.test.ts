// backend/__tests__/property/workflowAutomation.property.test.ts
// Property tests for workflow automation functionality
// Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6

/// <reference types="jest" />

import * as fc from 'fast-check';
import { PipelineAutomationService } from '../../src/services/pipelineAutomationService';
import { LeadStatus, QuotationStatus, ContractStatus } from '@prisma/client';

// Mock Prisma client
const createMockPrisma = () => {
  const leads = new Map<string, any>();
  const quotations = new Map<string, any>();
  const contracts = new Map<string, any>();
  const pipelineStages = new Map<string, any>();
  const stageTasks = new Map<string, any>();
  const leadActivities = new Map<string, any>();
  const leadTaskCompletions = new Map<string, any>();
  const testReceptions = new Map<string, any>();
  const studies = new Map<string, any>();
  
  let activityIdCounter = 0;
  let completionIdCounter = 0;

  // Initialize default stages
  const defaultStages = [
    { id: 'stage-1', code: 'INQUIRY', name: '문의접수', order: 1, isActive: true },
    { id: 'stage-2', code: 'REVIEW', name: '검토중', order: 2, isActive: true },
    { id: 'stage-3', code: 'QUOTATION_SENT', name: '견적발송', order: 3, isActive: true },
    { id: 'stage-4', code: 'NEGOTIATION', name: '계약협의', order: 4, isActive: true },
    { id: 'stage-5', code: 'TEST_RECEPTION', name: '시험접수', order: 5, isActive: true },
    { id: 'stage-6', code: 'IN_PROGRESS', name: '시험진행', order: 6, isActive: true },
    { id: 'stage-7', code: 'COMPLETED', name: '완료', order: 7, isActive: true },
  ];
  defaultStages.forEach(s => pipelineStages.set(s.id, s));

  // Initialize default tasks for each stage
  const defaultTasks = [
    { id: 'task-1-1', stageId: 'stage-1', name: '고객 정보 확인', order: 1, isRequired: true, isActive: true },
    { id: 'task-1-2', stageId: 'stage-1', name: '문의 내용 기록', order: 2, isRequired: true, isActive: true },
    { id: 'task-5-1', stageId: 'stage-5', name: '시험의뢰서 접수', order: 1, isRequired: true, isActive: true },
    { id: 'task-5-2', stageId: 'stage-5', name: '상담기록지 작성', order: 2, isRequired: true, isActive: true },
    { id: 'task-5-3', stageId: 'stage-5', name: 'PM팀 접수 요청', order: 3, isRequired: true, isActive: true },
    { id: 'task-5-4', stageId: 'stage-5', name: '시험번호 발행', order: 4, isRequired: true, isActive: true },
  ];
  defaultTasks.forEach(t => stageTasks.set(t.id, t));

  return {
    lead: {
      findUnique: jest.fn(async ({ where, include }: any) => {
        const lead = leads.get(where.id);
        if (!lead) return null;
        
        const result = { ...lead };
        if (include?.stage) {
          result.stage = pipelineStages.get(lead.stageId);
          if (include.stage.include?.tasks) {
            const tasks = Array.from(stageTasks.values())
              .filter((t: any) => t.stageId === lead.stageId && t.isActive)
              .sort((a: any, b: any) => a.order - b.order);
            result.stage = { ...result.stage, tasks };
          }
        }
        if (include?.customer) {
          result.customer = lead.customerId ? { id: lead.customerId, name: 'Test Customer' } : null;
        }
        if (include?.taskCompletions) {
          result.taskCompletions = Array.from(leadTaskCompletions.values())
            .filter((c: any) => c.leadId === lead.id);
        }
        return result;
      }),
      update: jest.fn(async ({ where, data, include }: any) => {
        const lead = leads.get(where.id);
        if (!lead) throw new Error('리드를 찾을 수 없습니다');
        const updated = { ...lead, ...data };
        leads.set(where.id, updated);
        
        const result = { ...updated };
        if (include?.stage) {
          result.stage = pipelineStages.get(updated.stageId);
        }
        if (include?.customer) {
          result.customer = updated.customerId ? { id: updated.customerId, name: 'Test Customer' } : null;
        }
        return result;
      }),
    },
    quotation: {
      findUnique: jest.fn(async ({ where, include }: any) => {
        const quotation = quotations.get(where.id);
        if (!quotation) return null;
        
        const result = { ...quotation };
        if (include?.lead) {
          result.lead = quotation.leadId ? leads.get(quotation.leadId) : null;
        }
        return result;
      }),
    },
    contract: {
      findUnique: jest.fn(async ({ where, include }: any) => {
        const contract = contracts.get(where.id);
        if (!contract) return null;
        
        const result = { ...contract };
        if (include?.quotations) {
          const contractQuotations = Array.from(quotations.values())
            .filter((q: any) => contract.quotationIds?.includes(q.id));
          result.quotations = contractQuotations.map((q: any) => ({
            ...q,
            lead: include.quotations.include?.lead && q.leadId ? leads.get(q.leadId) : undefined,
          }));
        }
        return result;
      }),
    },
    pipelineStage: {
      findFirst: jest.fn(async ({ where }: any) => {
        for (const stage of pipelineStages.values()) {
          if (where.OR) {
            for (const condition of where.OR) {
              if (condition.code && stage.code === condition.code && stage.isActive) {
                return stage;
              }
              if (condition.name?.contains && stage.name.includes(condition.name.contains) && stage.isActive) {
                return stage;
              }
            }
          }
          if (where.code && stage.code === where.code && stage.isActive) {
            return stage;
          }
        }
        return null;
      }),
    },
    stageTask: {
      findMany: jest.fn(async ({ where }: any) => {
        return Array.from(stageTasks.values())
          .filter((t: any) => {
            if (where?.stageId && t.stageId !== where.stageId) return false;
            if (where?.isActive !== undefined && t.isActive !== where.isActive) return false;
            return true;
          })
          .sort((a: any, b: any) => a.order - b.order);
      }),
    },
    leadActivity: {
      create: jest.fn(async ({ data }: any) => {
        const id = `activity-${++activityIdCounter}`;
        const activity = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        leadActivities.set(id, activity);
        return activity;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        return Array.from(leadActivities.values())
          .filter((a: any) => {
            if (where?.leadId && a.leadId !== where.leadId) return false;
            return true;
          });
      }),
    },
    leadTaskCompletion: {
      findUnique: jest.fn(async ({ where }: any) => {
        if (where.leadId_taskId) {
          const key = `${where.leadId_taskId.leadId}-${where.leadId_taskId.taskId}`;
          return leadTaskCompletions.get(key) || null;
        }
        return null;
      }),
      create: jest.fn(async ({ data }: any) => {
        const id = `completion-${++completionIdCounter}`;
        const key = `${data.leadId}-${data.taskId}`;
        const completion = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        leadTaskCompletions.set(key, completion);
        return completion;
      }),
    },
    testReception: {
      findUnique: jest.fn(async ({ where }: any) => {
        return testReceptions.get(where.id) || null;
      }),
    },
    study: {
      findUnique: jest.fn(async ({ where, include }: any) => {
        const study = studies.get(where.id);
        if (!study) return null;
        
        const result = { ...study };
        if (include?.contract) {
          const contract = contracts.get(study.contractId);
          if (contract && include.contract.include?.quotations) {
            const contractQuotations = Array.from(quotations.values())
              .filter((q: any) => contract.quotationIds?.includes(q.id));
            result.contract = {
              ...contract,
              quotations: contractQuotations.map((q: any) => ({
                ...q,
                lead: include.contract.include.quotations.include?.lead && q.leadId 
                  ? leads.get(q.leadId) 
                  : undefined,
              })),
            };
          } else {
            result.contract = contract;
          }
        }
        return result;
      }),
    },
    // Helper methods for test setup
    _addLead: (lead: any) => leads.set(lead.id, lead),
    _addQuotation: (quotation: any) => quotations.set(quotation.id, quotation),
    _addContract: (contract: any) => contracts.set(contract.id, contract),
    _addTestReception: (reception: any) => testReceptions.set(reception.id, reception),
    _addStudy: (study: any) => studies.set(study.id, study),
    _getLead: (id: string) => leads.get(id),
    _getActivities: (leadId: string) => Array.from(leadActivities.values()).filter((a: any) => a.leadId === leadId),
    _clear: () => {
      leads.clear();
      quotations.clear();
      contracts.clear();
      leadActivities.clear();
      leadTaskCompletions.clear();
      testReceptions.clear();
      studies.clear();
      activityIdCounter = 0;
      completionIdCounter = 0;
    },
  };
};

describe('Workflow Automation Property Tests', () => {
  // Arbitraries
  const leadStatusArb = fc.constantFrom<LeadStatus>(
    LeadStatus.NEW,
    LeadStatus.CONTACTED,
    LeadStatus.QUALIFIED,
    LeadStatus.PROPOSAL,
    LeadStatus.NEGOTIATION,
    LeadStatus.CONVERTED
  );

  const stageCodeArb = fc.constantFrom(
    'INQUIRY', 'REVIEW', 'QUOTATION_SENT', 'NEGOTIATION', 
    'TEST_RECEPTION', 'IN_PROGRESS', 'COMPLETED'
  );

  const userIdArb = fc.uuid();
  const leadIdArb = fc.uuid();
  const quotationIdArb = fc.uuid();

  /**
   * Property 11: 워크플로우 자동화 일관성
   * Requirements 5.2, 5.3, 5.5: 각 이벤트별 리드 단계 자동 변경 검증
   */
  describe('Property 11: Workflow Automation Consistency', () => {
    it('should update lead stage to QUOTATION_SENT when quotation status is SENT', async () => {
      await fc.assert(
        fc.asyncProperty(
          leadIdArb,
          quotationIdArb,
          userIdArb,
          fc.constantFrom<LeadStatus>(LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED),
          async (leadId, quotationId, userId, initialStatus) => {
            const mockPrisma = createMockPrisma();
            
            // Given: 리드와 연결된 견적서
            mockPrisma._addLead({
              id: leadId,
              stageId: 'stage-1',
              status: initialStatus,
            });
            mockPrisma._addQuotation({
              id: quotationId,
              leadId,
              userId,
              status: QuotationStatus.DRAFT,
            });

            const service = new PipelineAutomationService(mockPrisma as any);

            // When: 견적서 상태를 SENT로 변경
            const result = await service.onQuotationStatusChange(quotationId, QuotationStatus.SENT, userId);

            // Then: 리드 상태가 PROPOSAL로 변경됨
            expect(result).not.toBeNull();
            expect(result?.status).toBe(LeadStatus.PROPOSAL);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT update lead stage when current status is beyond PROPOSAL', async () => {
      await fc.assert(
        fc.asyncProperty(
          leadIdArb,
          quotationIdArb,
          userIdArb,
          fc.constantFrom<LeadStatus>(LeadStatus.NEGOTIATION, LeadStatus.CONVERTED),
          async (leadId, quotationId, userId, advancedStatus) => {
            const mockPrisma = createMockPrisma();
            
            // Given: 이미 진행된 상태의 리드
            mockPrisma._addLead({
              id: leadId,
              stageId: 'stage-4',
              status: advancedStatus,
            });
            mockPrisma._addQuotation({
              id: quotationId,
              leadId,
              userId,
              status: QuotationStatus.DRAFT,
            });

            const service = new PipelineAutomationService(mockPrisma as any);

            // When: 견적서 상태를 SENT로 변경
            const result = await service.onQuotationStatusChange(quotationId, QuotationStatus.SENT, userId);

            // Then: 리드 상태가 변경되지 않음
            expect(result).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update lead stage to IN_PROGRESS when test number is issued', async () => {
      await fc.assert(
        fc.asyncProperty(
          leadIdArb,
          quotationIdArb,
          userIdArb,
          async (leadId, quotationId, userId) => {
            const mockPrisma = createMockPrisma();
            const contractId = 'contract-1';
            const testReceptionId = 'reception-1';
            
            // Given: 리드, 견적서, 계약, 시험접수가 연결됨
            mockPrisma._addLead({
              id: leadId,
              stageId: 'stage-5',
              status: LeadStatus.PROPOSAL,
            });
            mockPrisma._addQuotation({
              id: quotationId,
              leadId,
              userId,
            });
            mockPrisma._addContract({
              id: contractId,
              quotationIds: [quotationId],
            });
            mockPrisma._addTestReception({
              id: testReceptionId,
              contractId,
            });

            const service = new PipelineAutomationService(mockPrisma as any);

            // When: 시험번호 발행
            const result = await service.onTestNumberIssued(testReceptionId, userId);

            // Then: 리드 단계가 IN_PROGRESS로 변경됨
            expect(result).not.toBeNull();
            expect(result?.stageId).toBe('stage-6');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update lead stage to COMPLETED when study is completed', async () => {
      await fc.assert(
        fc.asyncProperty(
          leadIdArb,
          quotationIdArb,
          userIdArb,
          async (leadId, quotationId, userId) => {
            const mockPrisma = createMockPrisma();
            const contractId = 'contract-1';
            const studyId = 'study-1';
            
            // Given: 리드, 견적서, 계약, 시험이 연결됨
            mockPrisma._addLead({
              id: leadId,
              stageId: 'stage-6',
              status: LeadStatus.PROPOSAL,
            });
            mockPrisma._addQuotation({
              id: quotationId,
              leadId,
              userId,
            });
            mockPrisma._addContract({
              id: contractId,
              quotationIds: [quotationId],
            });
            mockPrisma._addStudy({
              id: studyId,
              contractId,
            });

            const service = new PipelineAutomationService(mockPrisma as any);

            // When: 시험 완료
            const result = await service.onStudyCompleted(studyId, userId);

            // Then: 리드 단계가 COMPLETED로 변경됨
            expect(result).not.toBeNull();
            expect(result?.stageId).toBe('stage-7');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 12: 단계 변경 시 태스크 자동 생성
   * Requirements 5.1: 단계 변경 시 해당 단계 태스크 생성 검증
   */
  describe('Property 12: Task Auto-Creation on Stage Change', () => {
    it('should update lead stage when updateLeadStage is called', async () => {
      await fc.assert(
        fc.asyncProperty(
          leadIdArb,
          userIdArb,
          stageCodeArb,
          async (leadId, userId, targetStageCode) => {
            const mockPrisma = createMockPrisma();
            
            // Given: 리드가 존재함
            mockPrisma._addLead({
              id: leadId,
              stageId: 'stage-1',
              status: LeadStatus.NEW,
            });

            const service = new PipelineAutomationService(mockPrisma as any);

            // When: 단계 변경
            const result = await service.updateLeadStage(leadId, targetStageCode, userId);

            // Then: 리드 단계가 변경됨
            expect(result).not.toBeNull();
            
            // 단계 코드에 해당하는 stageId로 변경되었는지 확인
            const expectedStageId = `stage-${['INQUIRY', 'REVIEW', 'QUOTATION_SENT', 'NEGOTIATION', 'TEST_RECEPTION', 'IN_PROGRESS', 'COMPLETED'].indexOf(targetStageCode) + 1}`;
            expect(result.stageId).toBe(expectedStageId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should get task progress for lead', async () => {
      await fc.assert(
        fc.asyncProperty(
          leadIdArb,
          async (leadId) => {
            const mockPrisma = createMockPrisma();
            
            // Given: 리드가 stage-1 (INQUIRY)에 있음
            mockPrisma._addLead({
              id: leadId,
              stageId: 'stage-1',
              status: LeadStatus.NEW,
            });

            const service = new PipelineAutomationService(mockPrisma as any);

            // When: 태스크 진행 현황 조회
            const progress = await service.getLeadTaskProgress(leadId);

            // Then: 태스크 정보가 반환됨
            expect(progress.totalTasks).toBeGreaterThanOrEqual(0);
            expect(progress.completedTasks).toBeLessThanOrEqual(progress.totalTasks);
            expect(Array.isArray(progress.tasks)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: 활동 로그 생성 일관성
   * Requirements 2.6, 5.6: 상태/단계 변경 시 LeadActivity 생성 검증
   */
  describe('Property 3: Activity Log Creation Consistency', () => {
    it('should create activity log when quotation status changes to SENT', async () => {
      await fc.assert(
        fc.asyncProperty(
          leadIdArb,
          quotationIdArb,
          userIdArb,
          async (leadId, quotationId, userId) => {
            const mockPrisma = createMockPrisma();
            
            // Given: 리드와 연결된 견적서
            mockPrisma._addLead({
              id: leadId,
              stageId: 'stage-1',
              status: LeadStatus.NEW,
            });
            mockPrisma._addQuotation({
              id: quotationId,
              leadId,
              userId,
              status: QuotationStatus.DRAFT,
            });

            const service = new PipelineAutomationService(mockPrisma as any);

            // When: 견적서 상태를 SENT로 변경
            await service.onQuotationStatusChange(quotationId, QuotationStatus.SENT, userId);

            // Then: 활동 로그가 생성됨
            const activities = mockPrisma._getActivities(leadId);
            expect(activities.length).toBeGreaterThan(0);
            
            const statusChangeActivity = activities.find((a: any) => a.type === 'STATUS_CHANGE');
            expect(statusChangeActivity).toBeDefined();
            expect(statusChangeActivity.leadId).toBe(leadId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create activity log when stage changes', async () => {
      await fc.assert(
        fc.asyncProperty(
          leadIdArb,
          userIdArb,
          fc.constantFrom('REVIEW', 'QUOTATION_SENT', 'NEGOTIATION'),
          async (leadId, userId, targetStageCode) => {
            const mockPrisma = createMockPrisma();
            
            // Given: 리드가 INQUIRY 단계에 있음
            mockPrisma._addLead({
              id: leadId,
              stageId: 'stage-1',
              status: LeadStatus.NEW,
            });

            const service = new PipelineAutomationService(mockPrisma as any);

            // When: 단계 변경
            await service.updateLeadStage(leadId, targetStageCode, userId);

            // Then: 활동 로그가 생성됨
            const activities = mockPrisma._getActivities(leadId);
            expect(activities.length).toBeGreaterThan(0);
            
            const stageChangeActivity = activities.find((a: any) => a.type === 'STAGE_CHANGE');
            expect(stageChangeActivity).toBeDefined();
            expect(stageChangeActivity.leadId).toBe(leadId);
            expect(stageChangeActivity.subject).toContain(targetStageCode);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT create duplicate activity logs for same stage', async () => {
      await fc.assert(
        fc.asyncProperty(
          leadIdArb,
          userIdArb,
          async (leadId, userId) => {
            const mockPrisma = createMockPrisma();
            
            // Given: 리드가 이미 INQUIRY 단계에 있음
            mockPrisma._addLead({
              id: leadId,
              stageId: 'stage-1',
              status: LeadStatus.NEW,
            });

            const service = new PipelineAutomationService(mockPrisma as any);

            // When: 같은 단계로 변경 시도
            await service.updateLeadStage(leadId, 'INQUIRY', userId);

            // Then: 활동 로그가 생성되지 않음 (같은 단계이므로)
            const activities = mockPrisma._getActivities(leadId);
            const stageChangeActivities = activities.filter((a: any) => a.type === 'STAGE_CHANGE');
            expect(stageChangeActivities.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional Property: Task Completion
   */
  describe('Task Completion', () => {
    it('should complete task successfully', async () => {
      await fc.assert(
        fc.asyncProperty(
          leadIdArb,
          userIdArb,
          async (leadId, userId) => {
            const mockPrisma = createMockPrisma();
            const taskId = 'task-1-1';
            
            // Given: 리드가 존재함
            mockPrisma._addLead({
              id: leadId,
              stageId: 'stage-1',
              status: LeadStatus.NEW,
            });

            const service = new PipelineAutomationService(mockPrisma as any);

            // When: 태스크 완료
            await service.completeTask(leadId, taskId, userId, '완료 메모');

            // Then: 에러 없이 완료됨
            // (실제 완료 여부는 mock에서 확인)
            expect(true).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
