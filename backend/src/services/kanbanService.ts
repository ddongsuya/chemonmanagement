// Kanban Service - 칸반 뷰 데이터 관리
import prisma from '../lib/prisma';

// 칸반 컬럼 설정
const KANBAN_CONFIGS = {
  lead: {
    groupByField: 'stageId',
    columns: [
      { id: 'INQUIRY', name: '문의접수', color: '#3B82F6' },
      { id: 'REVIEW', name: '검토', color: '#F59E0B' },
      { id: 'QUOTATION', name: '견적송부', color: '#8B5CF6' },
      { id: 'LAB_CHECK_1', name: '연구소현황', color: '#EC4899' },
      { id: 'TEST_REVIEW', name: '시험의뢰검토', color: '#14B8A6' },
      { id: 'CONTRACT', name: '계약진행', color: '#10B981' },
      { id: 'LAB_CHECK_2', name: '연구소현황2', color: '#F97316' },
      { id: 'TEST_RECEIPT', name: '시험접수', color: '#6366F1' },
      { id: 'MANAGEMENT', name: '관리', color: '#6B7280' }
    ],
    cardFields: ['companyName', 'contactName', 'expectedAmount', 'user', 'createdAt']
  },
  quotation: {
    groupByField: 'status',
    columns: [
      { id: 'DRAFT', name: '작성중', color: '#6B7280' },
      { id: 'SENT', name: '발송완료', color: '#3B82F6' },
      { id: 'ACCEPTED', name: '승인', color: '#10B981' },
      { id: 'REJECTED', name: '거절', color: '#EF4444' },
      { id: 'EXPIRED', name: '만료', color: '#9CA3AF' }
    ],
    cardFields: ['customerName', 'projectName', 'totalAmount', 'validUntil', 'user']
  },
  contract: {
    groupByField: 'status',
    columns: [
      { id: 'NEGOTIATING', name: '협의중', color: '#F59E0B' },
      { id: 'SIGNED', name: '체결', color: '#3B82F6' },
      { id: 'TEST_RECEIVED', name: '시험접수', color: '#8B5CF6' },
      { id: 'IN_PROGRESS', name: '진행중', color: '#10B981' },
      { id: 'COMPLETED', name: '완료', color: '#6B7280' }
    ],
    cardFields: ['customer.name', 'title', 'totalAmount', 'endDate']
  },
  study: {
    groupByField: 'status',
    columns: [
      { id: 'REGISTERED', name: '접수', color: '#6B7280' },
      { id: 'PREPARING', name: '준비중', color: '#F59E0B' },
      { id: 'IN_PROGRESS', name: '진행중', color: '#3B82F6' },
      { id: 'ANALYSIS', name: '분석중', color: '#8B5CF6' },
      { id: 'REPORT_DRAFT', name: '보고서작성', color: '#EC4899' },
      { id: 'REPORT_REVIEW', name: '보고서검토', color: '#F97316' },
      { id: 'COMPLETED', name: '완료', color: '#10B981' }
    ],
    cardFields: ['studyNumber', 'testName', 'contract.customer.name', 'expectedEndDate']
  }
};

export class KanbanService {
  // 칸반 뷰 데이터 조회
  async getKanbanView(
    entityType: 'lead' | 'quotation' | 'contract' | 'study',
    userId: string,
    filters?: Record<string, any>
  ) {
    const config = KANBAN_CONFIGS[entityType];
    if (!config) {
      throw new Error(`Invalid entity type: ${entityType}`);
    }

    // 사용자 설정 조회
    const userSettings = await prisma.kanbanViewSetting.findUnique({
      where: { userId_entityType: { userId, entityType } }
    });

    const groupByField = userSettings?.groupByField || config.groupByField;
    const cardFields = (userSettings?.cardFields || config.cardFields) as string[];

    // 엔티티별 데이터 조회
    let items: any[] = [];
    
    switch (entityType) {
      case 'lead':
        items = await this.getLeadItems(userId, filters);
        break;
      case 'quotation':
        items = await this.getQuotationItems(userId, filters);
        break;
      case 'contract':
        items = await this.getContractItems(userId, filters);
        break;
      case 'study':
        items = await this.getStudyItems(userId, filters);
        break;
    }

    // 컬럼별로 그룹핑
    const columns = config.columns.map(col => {
      const columnItems = items.filter(item => {
        const value = this.getNestedValue(item, groupByField);
        return value === col.id || (value?.code === col.id);
      });

      return {
        ...col,
        items: columnItems.map(item => this.formatKanbanItem(item, entityType, cardFields)),
        count: columnItems.length,
        totalAmount: columnItems.reduce((sum, item) => {
          const amount = Number(item.totalAmount || item.expectedAmount || 0);
          return sum + amount;
        }, 0)
      };
    });

    return {
      columns,
      settings: {
        groupByField,
        cardFields,
        filters: userSettings?.filters || {}
      }
    };
  }

  // 리드 아이템 조회
  private async getLeadItems(userId: string, filters?: Record<string, any>) {
    const where: any = { deletedAt: null };
    
    if (filters?.userId) {
      where.userId = filters.userId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    return prisma.lead.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        stage: true,
        customer: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // 견적서 아이템 조회
  private async getQuotationItems(userId: string, filters?: Record<string, any>) {
    const where: any = { deletedAt: null };
    
    if (filters?.userId) {
      where.userId = filters.userId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    return prisma.quotation.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // 계약 아이템 조회
  private async getContractItems(userId: string, filters?: Record<string, any>) {
    const where: any = { deletedAt: null };
    
    if (filters?.userId) {
      where.userId = filters.userId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    return prisma.contract.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // 시험 아이템 조회
  private async getStudyItems(userId: string, filters?: Record<string, any>) {
    const where: any = {};
    
    if (filters?.status) {
      where.status = filters.status;
    }

    return prisma.study.findMany({
      where,
      include: {
        contract: {
          include: {
            customer: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // 칸반 아이템 이동
  async moveItem(
    entityType: 'lead' | 'quotation' | 'contract' | 'study',
    itemId: string,
    targetColumn: string,
    userId: string
  ) {
    const config = KANBAN_CONFIGS[entityType];
    if (!config) {
      throw new Error(`Invalid entity type: ${entityType}`);
    }

    let updatedItem: any;

    switch (entityType) {
      case 'lead':
        // 파이프라인 단계 조회
        const stage = await prisma.pipelineStage.findFirst({
          where: { code: targetColumn }
        });
        if (!stage) {
          throw new Error(`Invalid stage: ${targetColumn}`);
        }
        updatedItem = await prisma.lead.update({
          where: { id: itemId },
          data: { stageId: stage.id },
          include: { user: true, stage: true }
        });
        break;

      case 'quotation':
        updatedItem = await prisma.quotation.update({
          where: { id: itemId },
          data: { status: targetColumn as any },
          include: { user: true }
        });
        break;

      case 'contract':
        updatedItem = await prisma.contract.update({
          where: { id: itemId },
          data: { status: targetColumn as any },
          include: { user: true, customer: true }
        });
        break;

      case 'study':
        updatedItem = await prisma.study.update({
          where: { id: itemId },
          data: { status: targetColumn as any },
          include: { contract: { include: { customer: true } } }
        });
        break;
    }

    // 활동 기록 생성
    await prisma.activity.create({
      data: {
        entityType: entityType.toUpperCase(),
        entityId: itemId,
        type: 'STATUS_CHANGE',
        subject: `상태 변경: ${targetColumn}`,
        userId,
        isAutoGenerated: true
      }
    });

    return {
      success: true,
      item: updatedItem
    };
  }

  // 칸반 설정 저장
  async saveSettings(
    userId: string,
    entityType: string,
    settings: {
      groupByField?: string;
      columns?: any[];
      cardFields?: string[];
      filters?: Record<string, any>;
    }
  ) {
    return prisma.kanbanViewSetting.upsert({
      where: { userId_entityType: { userId, entityType } },
      update: {
        groupByField: settings.groupByField,
        columns: settings.columns || [],
        cardFields: settings.cardFields || [],
        filters: settings.filters
      },
      create: {
        userId,
        entityType,
        groupByField: settings.groupByField || 'status',
        columns: settings.columns || [],
        cardFields: settings.cardFields || [],
        filters: settings.filters
      }
    });
  }

  // 칸반 설정 조회
  async getSettings(userId: string, entityType: string) {
    const settings = await prisma.kanbanViewSetting.findUnique({
      where: { userId_entityType: { userId, entityType } }
    });

    const config = KANBAN_CONFIGS[entityType as keyof typeof KANBAN_CONFIGS];
    
    return settings || {
      groupByField: config?.groupByField || 'status',
      columns: config?.columns || [],
      cardFields: config?.cardFields || [],
      filters: {}
    };
  }

  // 중첩 객체 값 가져오기
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // 칸반 아이템 포맷팅
  private formatKanbanItem(item: any, entityType: string, cardFields: string[]): any {
    const base = {
      id: item.id,
      title: '',
      subtitle: '',
      fields: {} as Record<string, any>,
      assignee: item.user ? { id: item.user.id, name: item.user.name } : undefined,
      dueDate: undefined as string | undefined,
      priority: undefined as string | undefined,
      tags: [] as string[]
    };

    switch (entityType) {
      case 'lead':
        base.title = item.companyName;
        base.subtitle = item.contactName;
        base.dueDate = item.expectedDate?.toISOString();
        base.fields = {
          expectedAmount: item.expectedAmount,
          inquiryType: item.inquiryType,
          source: item.source
        };
        break;

      case 'quotation':
        base.title = item.customerName;
        base.subtitle = item.projectName;
        base.dueDate = item.validUntil?.toISOString();
        base.fields = {
          totalAmount: item.totalAmount,
          quotationNumber: item.quotationNumber,
          quotationType: item.quotationType
        };
        break;

      case 'contract':
        base.title = item.customer?.name || '';
        base.subtitle = item.title;
        base.dueDate = item.endDate?.toISOString();
        base.fields = {
          totalAmount: item.totalAmount,
          contractNumber: item.contractNumber,
          contractType: item.contractType
        };
        break;

      case 'study':
        base.title = item.studyNumber;
        base.subtitle = item.testName;
        base.dueDate = item.expectedEndDate?.toISOString();
        base.fields = {
          studyType: item.studyType,
          customerName: item.contract?.customer?.name
        };
        break;
    }

    return base;
  }
}

export const kanbanService = new KanbanService();
