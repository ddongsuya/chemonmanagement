import { PrismaClient, Prisma, AutomationTriggerType, AutomationActionType, AutomationStatus, UserRole } from '@prisma/client';
import { AppError, ErrorCodes } from '../types/error';
import { PaginatedResult } from '../types';

// Re-export enums for use in routes
export { AutomationTriggerType, AutomationActionType, AutomationStatus } from '@prisma/client';

// Types
export interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  triggerType: AutomationTriggerType;
  triggerConfig: Record<string, unknown>;
  conditions: Record<string, unknown>[] | null;
  status: AutomationStatus;
  priority: number;
  executionCount: number;
  lastExecutedAt: Date | null;
  lastError: string | null;
  createdBy: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  actions?: AutomationAction[];
}

export interface AutomationAction {
  id: string;
  ruleId: string;
  actionType: AutomationActionType;
  actionConfig: Record<string, unknown>;
  order: number;
  delayMinutes: number | null;
}

export interface AutomationExecution {
  id: string;
  ruleId: string;
  triggerData: Record<string, unknown>;
  targetModel: string;
  targetId: string;
  status: string;
  results: Record<string, unknown>[] | null;
  error: string | null;
  startedAt: Date;
  completedAt: Date | null;
}

export interface CreateAutomationRuleDTO {
  name: string;
  description?: string;
  triggerType: AutomationTriggerType;
  triggerConfig: Record<string, unknown>;
  conditions?: Record<string, unknown>[];
  actions: CreateAutomationActionDTO[];
  status?: AutomationStatus;
  priority?: number;
}

export interface CreateAutomationActionDTO {
  actionType: AutomationActionType;
  actionConfig: Record<string, unknown>;
  order?: number;
  delayMinutes?: number;
}

export interface AutomationRulesFilters {
  status?: AutomationStatus | 'ALL';
  triggerType?: AutomationTriggerType;
  search?: string;
  page: number;
  limit: number;
}

export interface AutomationExecutionsFilters {
  ruleId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
}

// Automation Templates
export const AUTOMATION_TEMPLATES: Array<{
  id: string;
  name: string;
  description: string;
  category: string;
  triggerType: AutomationTriggerType;
  defaultConfig: CreateAutomationRuleDTO;
}> = [
  {
    id: 'lead-status-notification',
    name: '리드 상태 변경 알림',
    description: '리드 상태가 변경되면 담당자에게 알림을 발송합니다',
    category: '리드관리',
    triggerType: AutomationTriggerType.STATUS_CHANGE,
    defaultConfig: {
      name: '리드 상태 변경 알림',
      triggerType: AutomationTriggerType.STATUS_CHANGE,
      triggerConfig: { model: 'Lead', field: 'status' },
      actions: [
        {
          actionType: AutomationActionType.SEND_NOTIFICATION,
          actionConfig: {
            recipientType: 'owner',
            title: '리드 상태 변경',
            message: '{{leadName}} 리드의 상태가 {{newStatus}}(으)로 변경되었습니다.',
          },
        },
      ],
    },
  },
  {
    id: 'contract-created-notification',
    name: '계약 생성 알림',
    description: '새 계약이 생성되면 관리자에게 알림을 발송합니다',
    category: '계약관리',
    triggerType: AutomationTriggerType.ITEM_CREATED,
    defaultConfig: {
      name: '계약 생성 알림',
      triggerType: AutomationTriggerType.ITEM_CREATED,
      triggerConfig: { model: 'Contract' },
      actions: [
        {
          actionType: AutomationActionType.SEND_NOTIFICATION,
          actionConfig: {
            recipientType: 'role',
            recipientRole: 'ADMIN',
            title: '새 계약 생성',
            message: '{{customerName}}과의 새 계약이 생성되었습니다. 금액: {{totalAmount}}원',
          },
        },
      ],
    },
  },
  {
    id: 'study-delay-alert',
    name: '시험 지연 알림',
    description: '시험이 예정일을 초과하면 담당자에게 알림을 발송합니다',
    category: '시험관리',
    triggerType: AutomationTriggerType.DATE_REACHED,
    defaultConfig: {
      name: '시험 지연 알림',
      triggerType: AutomationTriggerType.DATE_REACHED,
      triggerConfig: { model: 'Study', field: 'expectedEndDate' },
      conditions: [{ field: 'status', operator: 'ne', value: 'COMPLETED' }],
      actions: [
        {
          actionType: AutomationActionType.SEND_NOTIFICATION,
          actionConfig: {
            recipientType: 'owner',
            title: '시험 지연 알림',
            message: '{{studyNumber}} 시험이 예정 종료일을 초과했습니다.',
          },
        },
      ],
    },
  },
  {
    id: 'quotation-expiry-reminder',
    name: '견적 만료 알림',
    description: '견적 유효기간 만료 7일 전 알림을 발송합니다',
    category: '견적관리',
    triggerType: AutomationTriggerType.DATE_REACHED,
    defaultConfig: {
      name: '견적 만료 알림',
      triggerType: AutomationTriggerType.DATE_REACHED,
      triggerConfig: { model: 'Quotation', field: 'validUntil', daysBefore: 7 },
      conditions: [{ field: 'status', operator: 'eq', value: 'SENT' }],
      actions: [
        {
          actionType: AutomationActionType.SEND_NOTIFICATION,
          actionConfig: {
            recipientType: 'owner',
            title: '견적 만료 임박',
            message: '{{quotationNumber}} 견적의 유효기간이 7일 후 만료됩니다.',
          },
        },
      ],
    },
  },
];

export class AutomationService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ==================== Rules CRUD ====================

  async getRules(filters: AutomationRulesFilters): Promise<PaginatedResult<AutomationRule>> {
    const { page, limit, status, triggerType, search } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.AutomationRuleWhereInput = {
      ...(status && status !== 'ALL' && { status: status as AutomationStatus }),
      ...(triggerType && { triggerType }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      }),
    };

    const [rules, total] = await Promise.all([
      this.prisma.automationRule.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: { actions: { orderBy: { order: 'asc' } } },
      }),
      this.prisma.automationRule.count({ where }),
    ]);

    return {
      data: rules.map(this.toAutomationRule),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getRuleById(id: string): Promise<AutomationRule> {
    const rule = await this.prisma.automationRule.findUnique({
      where: { id },
      include: { actions: { orderBy: { order: 'asc' } } },
    });

    if (!rule) {
      throw new AppError('자동화 규칙을 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    return this.toAutomationRule(rule);
  }

  async createRule(userId: string, data: CreateAutomationRuleDTO): Promise<AutomationRule> {
    const rule = await this.prisma.automationRule.create({
      data: {
        name: data.name,
        description: data.description,
        triggerType: data.triggerType,
        triggerConfig: data.triggerConfig as Prisma.InputJsonValue,
        conditions: data.conditions as Prisma.InputJsonValue,
        status: data.status || AutomationStatus.ACTIVE,
        priority: data.priority || 0,
        createdBy: userId,
        actions: {
          create: data.actions.map((action, index) => ({
            actionType: action.actionType,
            actionConfig: action.actionConfig as Prisma.InputJsonValue,
            order: action.order ?? index,
            delayMinutes: action.delayMinutes,
          })),
        },
      },
      include: { actions: { orderBy: { order: 'asc' } } },
    });

    return this.toAutomationRule(rule);
  }

  async updateRule(id: string, data: Partial<CreateAutomationRuleDTO>): Promise<AutomationRule> {
    const existing = await this.prisma.automationRule.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('자동화 규칙을 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    // Update rule and actions in transaction
    const rule = await this.prisma.$transaction(async (tx) => {
      // Delete existing actions if new actions provided
      if (data.actions) {
        await tx.automationAction.deleteMany({ where: { ruleId: id } });
      }

      const updateData: Prisma.AutomationRuleUpdateInput = {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.triggerType && { triggerType: data.triggerType }),
        ...(data.triggerConfig && { triggerConfig: data.triggerConfig as Prisma.InputJsonValue }),
        ...(data.conditions !== undefined && { conditions: data.conditions as Prisma.InputJsonValue }),
        ...(data.status && { status: data.status }),
        ...(data.priority !== undefined && { priority: data.priority }),
      };

      if (data.actions) {
        updateData.actions = {
          create: data.actions.map((action, index) => ({
            actionType: action.actionType,
            actionConfig: action.actionConfig as Prisma.InputJsonValue,
            order: action.order ?? index,
            delayMinutes: action.delayMinutes,
          })),
        };
      }

      return tx.automationRule.update({
        where: { id },
        data: updateData,
        include: { actions: { orderBy: { order: 'asc' } } },
      });
    });

    return this.toAutomationRule(rule);
  }

  async deleteRule(id: string): Promise<void> {
    const existing = await this.prisma.automationRule.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('자동화 규칙을 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    if (existing.isSystem) {
      throw new AppError('시스템 규칙은 삭제할 수 없습니다', 400, ErrorCodes.VALIDATION_ERROR);
    }

    await this.prisma.automationRule.delete({ where: { id } });
  }

  async toggleRule(id: string): Promise<AutomationRule> {
    const existing = await this.prisma.automationRule.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('자동화 규칙을 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    const newStatus = existing.status === AutomationStatus.ACTIVE ? AutomationStatus.INACTIVE : AutomationStatus.ACTIVE;
    const rule = await this.prisma.automationRule.update({
      where: { id },
      data: { status: newStatus },
      include: { actions: { orderBy: { order: 'asc' } } },
    });

    return this.toAutomationRule(rule);
  }


  // ==================== Execution ====================

  async executeRule(
    ruleId: string,
    targetModel: string,
    targetId: string,
    triggerData: Record<string, unknown>
  ): Promise<AutomationExecution> {
    const rule = await this.prisma.automationRule.findUnique({
      where: { id: ruleId },
      include: { actions: { orderBy: { order: 'asc' } } },
    });

    if (!rule || rule.status !== AutomationStatus.ACTIVE) {
      throw new AppError('활성화된 자동화 규칙을 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    // Create execution record
    const execution = await this.prisma.automationExecution.create({
      data: {
        ruleId,
        targetModel,
        targetId,
        triggerData: triggerData as Prisma.InputJsonValue,
        status: 'PENDING',
      },
    });

    try {
      // Check conditions
      const conditionsMet = await this.checkConditions(rule.conditions as Record<string, unknown>[] | null, targetModel, targetId);
      if (!conditionsMet) {
        await this.prisma.automationExecution.update({
          where: { id: execution.id },
          data: { status: 'SKIPPED', completedAt: new Date() },
        });
        return this.toAutomationExecution(execution);
      }

      // Execute actions
      const results: Record<string, unknown>[] = [];
      for (const action of rule.actions) {
        const result = await this.executeAction(action, targetModel, targetId, triggerData);
        results.push({ actionId: action.id, actionType: action.actionType, ...result });
      }

      // Update execution and rule
      const updatedExecution = await this.prisma.automationExecution.update({
        where: { id: execution.id },
        data: {
          status: 'SUCCESS',
          results: results as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      });

      await this.prisma.automationRule.update({
        where: { id: ruleId },
        data: {
          executionCount: { increment: 1 },
          lastExecutedAt: new Date(),
          lastError: null,
        },
      });

      return this.toAutomationExecution(updatedExecution);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.prisma.automationExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          error: errorMessage,
          completedAt: new Date(),
        },
      });

      await this.prisma.automationRule.update({
        where: { id: ruleId },
        data: { lastError: errorMessage },
      });

      throw error;
    }
  }

  private async checkConditions(
    conditions: Record<string, unknown>[] | null,
    targetModel: string,
    targetId: string
  ): Promise<boolean> {
    if (!conditions || conditions.length === 0) return true;

    // Get target entity
    const entity = await this.getTargetEntity(targetModel, targetId);
    if (!entity) return false;

    for (const condition of conditions) {
      const { field, operator, value } = condition as { field: string; operator: string; value: unknown };
      const entityValue = (entity as Record<string, unknown>)[field];

      let met = false;
      switch (operator) {
        case 'eq': met = entityValue === value; break;
        case 'ne': met = entityValue !== value; break;
        case 'gt': met = Number(entityValue) > Number(value); break;
        case 'gte': met = Number(entityValue) >= Number(value); break;
        case 'lt': met = Number(entityValue) < Number(value); break;
        case 'lte': met = Number(entityValue) <= Number(value); break;
        case 'contains': met = String(entityValue).includes(String(value)); break;
        case 'in': met = Array.isArray(value) && value.includes(entityValue); break;
        default: met = true;
      }

      if (!met) return false;
    }

    return true;
  }

  private async getTargetEntity(model: string, id: string): Promise<Record<string, unknown> | null> {
    switch (model) {
      case 'Lead':
        return this.prisma.lead.findUnique({ where: { id } }) as Promise<Record<string, unknown> | null>;
      case 'Contract':
        return this.prisma.contract.findUnique({ where: { id } }) as Promise<Record<string, unknown> | null>;
      case 'Quotation':
        return this.prisma.quotation.findUnique({ where: { id } }) as Promise<Record<string, unknown> | null>;
      case 'Study':
        return this.prisma.study.findUnique({ where: { id } }) as Promise<Record<string, unknown> | null>;
      case 'Customer':
        return this.prisma.customer.findUnique({ where: { id } }) as Promise<Record<string, unknown> | null>;
      default:
        return null;
    }
  }

  private async executeAction(
    action: { actionType: string; actionConfig: Prisma.JsonValue },
    targetModel: string,
    targetId: string,
    triggerData: Record<string, unknown>
  ): Promise<{ success: boolean; message?: string }> {
    const config = action.actionConfig as Record<string, unknown>;

    switch (action.actionType) {
      case 'SEND_NOTIFICATION':
        return this.executeNotificationAction(config, targetModel, targetId, triggerData);
      case 'UPDATE_STATUS':
        return this.executeUpdateStatusAction(config, targetModel, targetId);
      case 'CREATE_ACTIVITY':
        return this.executeCreateActivityAction(config, targetModel, targetId, triggerData);
      default:
        return { success: true, message: `Action type ${action.actionType} not implemented` };
    }
  }

  private async executeNotificationAction(
    config: Record<string, unknown>,
    targetModel: string,
    targetId: string,
    triggerData: Record<string, unknown>
  ): Promise<{ success: boolean; message?: string }> {
    const entity = await this.getTargetEntity(targetModel, targetId);
    if (!entity) return { success: false, message: 'Target entity not found' };

    // Replace template variables
    let title = String(config.title || '');
    let message = String(config.message || '');
    
    const variables = { ...entity, ...triggerData };
    for (const [key, value] of Object.entries(variables)) {
      title = title.replace(new RegExp(`{{${key}}}`, 'g'), String(value || ''));
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), String(value || ''));
    }

    // Get recipients
    const recipientIds: string[] = [];
    const recipientType = config.recipientType as string;

    if (recipientType === 'owner' && entity.userId) {
      recipientIds.push(entity.userId as string);
    } else if (recipientType === 'specific' && Array.isArray(config.recipientIds)) {
      recipientIds.push(...(config.recipientIds as string[]));
    } else if (recipientType === 'role') {
      const users = await this.prisma.user.findMany({
        where: { role: config.recipientRole as UserRole, status: 'ACTIVE' },
        select: { id: true },
      });
      recipientIds.push(...users.map(u => u.id));
    }

    // Create notifications
    for (const userId of recipientIds) {
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'SYSTEM',
          title,
          message,
          link: config.link as string || null,
        },
      });
    }

    return { success: true, message: `Sent ${recipientIds.length} notifications` };
  }

  private async executeUpdateStatusAction(
    config: Record<string, unknown>,
    targetModel: string,
    targetId: string
  ): Promise<{ success: boolean; message?: string }> {
    const field = config.field as string || 'status';
    const value = config.value;

    switch (targetModel) {
      case 'Lead':
        await this.prisma.lead.update({ where: { id: targetId }, data: { [field]: value } });
        break;
      case 'Contract':
        await this.prisma.contract.update({ where: { id: targetId }, data: { [field]: value } });
        break;
      case 'Quotation':
        await this.prisma.quotation.update({ where: { id: targetId }, data: { [field]: value } });
        break;
      case 'Study':
        await this.prisma.study.update({ where: { id: targetId }, data: { [field]: value } });
        break;
      default:
        return { success: false, message: `Model ${targetModel} not supported` };
    }

    return { success: true, message: `Updated ${field} to ${value}` };
  }

  private async executeCreateActivityAction(
    config: Record<string, unknown>,
    targetModel: string,
    targetId: string,
    triggerData: Record<string, unknown>
  ): Promise<{ success: boolean; message?: string }> {
    const entity = await this.getTargetEntity(targetModel, targetId);
    if (!entity) return { success: false, message: 'Target entity not found' };

    let subject = String(config.subject || '자동 생성된 활동');
    const variables = { ...entity, ...triggerData };
    for (const [key, value] of Object.entries(variables)) {
      subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), String(value || ''));
    }

    await this.prisma.activity.create({
      data: {
        entityType: targetModel.toUpperCase(),
        entityId: targetId,
        type: 'SYSTEM',
        subject,
        content: config.content as string || null,
        userId: entity.userId as string,
        isAutoGenerated: true,
      },
    });

    return { success: true, message: 'Activity created' };
  }

  // ==================== Executions Query ====================

  async getExecutions(filters: AutomationExecutionsFilters): Promise<PaginatedResult<AutomationExecution>> {
    const { page, limit, ruleId, status, startDate, endDate } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.AutomationExecutionWhereInput = {
      ...(ruleId && { ruleId }),
      ...(status && { status }),
      ...(startDate && { startedAt: { gte: startDate } }),
      ...(endDate && { startedAt: { lte: endDate } }),
    };

    const [executions, total] = await Promise.all([
      this.prisma.automationExecution.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: { rule: { select: { name: true } } },
      }),
      this.prisma.automationExecution.count({ where }),
    ]);

    return {
      data: executions.map(this.toAutomationExecution),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getExecutionById(id: string): Promise<AutomationExecution> {
    const execution = await this.prisma.automationExecution.findUnique({
      where: { id },
      include: { rule: { select: { name: true } } },
    });

    if (!execution) {
      throw new AppError('실행 로그를 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    return this.toAutomationExecution(execution);
  }

  // ==================== Templates ====================

  getTemplates() {
    return AUTOMATION_TEMPLATES;
  }

  async applyTemplate(userId: string, templateId: string): Promise<AutomationRule> {
    const template = AUTOMATION_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      throw new AppError('템플릿을 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    return this.createRule(userId, template.defaultConfig as CreateAutomationRuleDTO);
  }

  // ==================== Helpers ====================

  private toAutomationRule(rule: Record<string, unknown>): AutomationRule {
    return {
      id: rule.id as string,
      name: rule.name as string,
      description: rule.description as string | null,
      triggerType: rule.triggerType as AutomationTriggerType,
      triggerConfig: rule.triggerConfig as Record<string, unknown>,
      conditions: rule.conditions as Record<string, unknown>[] | null,
      status: rule.status as AutomationStatus,
      priority: rule.priority as number,
      executionCount: rule.executionCount as number,
      lastExecutedAt: rule.lastExecutedAt as Date | null,
      lastError: rule.lastError as string | null,
      createdBy: rule.createdBy as string,
      isSystem: rule.isSystem as boolean,
      createdAt: rule.createdAt as Date,
      updatedAt: rule.updatedAt as Date,
      actions: (rule.actions as Record<string, unknown>[])?.map(a => ({
        id: a.id as string,
        ruleId: a.ruleId as string,
        actionType: a.actionType as AutomationActionType,
        actionConfig: a.actionConfig as Record<string, unknown>,
        order: a.order as number,
        delayMinutes: a.delayMinutes as number | null,
      })),
    };
  }

  private toAutomationExecution(execution: Record<string, unknown>): AutomationExecution {
    return {
      id: execution.id as string,
      ruleId: execution.ruleId as string,
      triggerData: execution.triggerData as Record<string, unknown>,
      targetModel: execution.targetModel as string,
      targetId: execution.targetId as string,
      status: execution.status as string,
      results: execution.results as Record<string, unknown>[] | null,
      error: execution.error as string | null,
      startedAt: execution.startedAt as Date,
      completedAt: execution.completedAt as Date | null,
    };
  }
}

export default AutomationService;
