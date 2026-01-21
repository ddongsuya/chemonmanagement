// Dashboard Service - 대시보드 및 위젯 관리
import prisma from '../lib/prisma';
import { WidgetType, Department } from '@prisma/client';

interface CreateDashboardInput {
  name: string;
  description?: string;
  layout?: any;
  isDefault?: boolean;
  isPublic?: boolean;
  ownerId: string;
}

// 사용자 권한 정보
interface UserPermissions {
  userId: string;
  department?: Department | null;
  canViewAllData: boolean;
  canViewAllSales: boolean;
  isAdmin: boolean;
}

// 데이터 필터링을 위한 조건 생성
function buildUserFilter(permissions: UserPermissions, userIdField: string = 'userId') {
  // Admin이거나 전체 데이터 조회 권한이 있으면 필터 없음
  if (permissions.isAdmin || permissions.canViewAllData) {
    return {};
  }
  // 그 외에는 본인 데이터만
  return { [userIdField]: permissions.userId };
}

// 부서 기반 필터링 조건 생성
async function buildDepartmentFilter(permissions: UserPermissions, userIdField: string = 'userId') {
  // Admin이거나 전체 데이터 조회 권한이 있으면 필터 없음
  if (permissions.isAdmin || permissions.canViewAllData) {
    return {};
  }
  
  // 부서가 있으면 같은 부서 사용자들의 데이터
  if (permissions.department) {
    const departmentUsers = await prisma.user.findMany({
      where: { department: permissions.department },
      select: { id: true }
    });
    return { [userIdField]: { in: departmentUsers.map(u => u.id) } };
  }
  
  // 부서가 없으면 본인 데이터만
  return { [userIdField]: permissions.userId };
}

interface CreateWidgetInput {
  dashboardId: string;
  name: string;
  type: WidgetType;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  dataSource: string;
  query?: any;
  aggregation?: any;
  config?: any;
  filters?: any;
  dateRange?: string;
}

export class DashboardService {
  // 대시보드 목록 조회
  async getDashboards(userId: string) {
    const dashboards = await prisma.dashboard.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { isPublic: true },
          { sharedWith: { has: userId } }
        ]
      },
      include: {
        widgets: true
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    const defaultDashboard = dashboards.find(d => d.isDefault && d.ownerId === userId);

    return {
      dashboards,
      defaultDashboardId: defaultDashboard?.id
    };
  }

  // 대시보드 생성
  async createDashboard(input: CreateDashboardInput) {
    // 기본 대시보드로 설정 시 기존 기본 대시보드 해제
    if (input.isDefault) {
      await prisma.dashboard.updateMany({
        where: { ownerId: input.ownerId, isDefault: true },
        data: { isDefault: false }
      });
    }

    return prisma.dashboard.create({
      data: {
        name: input.name,
        description: input.description,
        layout: input.layout || {},
        isDefault: input.isDefault || false,
        isPublic: input.isPublic || false,
        ownerId: input.ownerId
      },
      include: { widgets: true }
    });
  }

  // 대시보드 상세 조회
  async getDashboardById(id: string, userId: string) {
    const dashboard = await prisma.dashboard.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          { isPublic: true },
          { sharedWith: { has: userId } }
        ]
      },
      include: { widgets: true }
    });

    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    return dashboard;
  }

  // 대시보드 수정
  async updateDashboard(id: string, userId: string, data: Partial<CreateDashboardInput>) {
    const dashboard = await prisma.dashboard.findFirst({
      where: { id, ownerId: userId }
    });

    if (!dashboard) {
      throw new Error('Dashboard not found or access denied');
    }

    // 기본 대시보드로 설정 시 기존 기본 대시보드 해제
    if (data.isDefault) {
      await prisma.dashboard.updateMany({
        where: { ownerId: userId, isDefault: true, id: { not: id } },
        data: { isDefault: false }
      });
    }

    return prisma.dashboard.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        layout: data.layout,
        isDefault: data.isDefault,
        isPublic: data.isPublic
      },
      include: { widgets: true }
    });
  }

  // 대시보드 삭제
  async deleteDashboard(id: string, userId: string) {
    const dashboard = await prisma.dashboard.findFirst({
      where: { id, ownerId: userId }
    });

    if (!dashboard) {
      throw new Error('Dashboard not found or access denied');
    }

    return prisma.dashboard.delete({ where: { id } });
  }

  // 대시보드 복제
  async duplicateDashboard(id: string, userId: string) {
    const original = await this.getDashboardById(id, userId);

    const newDashboard = await prisma.dashboard.create({
      data: {
        name: `${original.name} (복사본)`,
        description: original.description,
        layout: original.layout as any,
        isDefault: false,
        isPublic: false,
        ownerId: userId
      }
    });

    // 위젯 복제
    if (original.widgets.length > 0) {
      await prisma.dashboardWidget.createMany({
        data: original.widgets.map(w => ({
          dashboardId: newDashboard.id,
          name: w.name,
          type: w.type,
          x: w.x,
          y: w.y,
          width: w.width,
          height: w.height,
          dataSource: w.dataSource,
          query: w.query as any,
          aggregation: w.aggregation as any,
          config: w.config as any,
          filters: w.filters as any,
          dateRange: w.dateRange
        }))
      });
    }

    return this.getDashboardById(newDashboard.id, userId);
  }

  // 레이아웃 업데이트
  async updateLayout(id: string, userId: string, layout: any) {
    const dashboard = await prisma.dashboard.findFirst({
      where: { id, ownerId: userId }
    });

    if (!dashboard) {
      throw new Error('Dashboard not found or access denied');
    }

    return prisma.dashboard.update({
      where: { id },
      data: { layout },
      include: { widgets: true }
    });
  }

  // 위젯 추가
  async addWidget(input: CreateWidgetInput, userId: string) {
    const dashboard = await prisma.dashboard.findFirst({
      where: { id: input.dashboardId, ownerId: userId }
    });

    if (!dashboard) {
      throw new Error('Dashboard not found or access denied');
    }

    return prisma.dashboardWidget.create({
      data: {
        dashboardId: input.dashboardId,
        name: input.name,
        type: input.type,
        x: input.x || 0,
        y: input.y || 0,
        width: input.width || 4,
        height: input.height || 3,
        dataSource: input.dataSource,
        query: input.query,
        aggregation: input.aggregation,
        config: input.config || {},
        filters: input.filters,
        dateRange: input.dateRange
      }
    });
  }

  // 위젯 수정
  async updateWidget(widgetId: string, userId: string, data: Partial<CreateWidgetInput>) {
    const widget = await prisma.dashboardWidget.findFirst({
      where: { id: widgetId },
      include: { dashboard: true }
    });

    if (!widget || widget.dashboard.ownerId !== userId) {
      throw new Error('Widget not found or access denied');
    }

    return prisma.dashboardWidget.update({
      where: { id: widgetId },
      data: {
        name: data.name,
        type: data.type,
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
        dataSource: data.dataSource,
        query: data.query,
        aggregation: data.aggregation,
        config: data.config,
        filters: data.filters,
        dateRange: data.dateRange
      }
    });
  }

  // 위젯 삭제
  async deleteWidget(widgetId: string, userId: string) {
    const widget = await prisma.dashboardWidget.findFirst({
      where: { id: widgetId },
      include: { dashboard: true }
    });

    if (!widget || widget.dashboard.ownerId !== userId) {
      throw new Error('Widget not found or access denied');
    }

    return prisma.dashboardWidget.delete({ where: { id: widgetId } });
  }

  // 위젯 데이터 조회 (사용자 권한 기반 필터링)
  async getWidgetData(widgetId: string, userId: string, params?: { dateRange?: string; filters?: any }) {
    const widget = await prisma.dashboardWidget.findFirst({
      where: { id: widgetId },
      include: { dashboard: true }
    });

    if (!widget) {
      throw new Error('Widget not found');
    }

    // 사용자 권한 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        department: true, 
        canViewAllData: true, 
        canViewAllSales: true,
        role: true 
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const permissions: UserPermissions = {
      userId: user.id,
      department: user.department,
      canViewAllData: user.canViewAllData,
      canViewAllSales: user.canViewAllSales,
      isAdmin: user.role === 'ADMIN'
    };

    // 데이터 소스에 따라 데이터 조회 (권한 기반 필터링)
    const data = await this.fetchWidgetData(widget, permissions, params);
    return data;
  }

  // 위젯 데이터 페칭 (권한 기반 필터링 적용)
  private async fetchWidgetData(widget: any, permissions: UserPermissions, params?: { dateRange?: string; filters?: any }) {
    const { dataSource, query, aggregation } = widget;
    const dateRange = params?.dateRange || widget.dateRange || '30d';
    
    // 날짜 범위 계산
    const endDate = new Date();
    const startDate = new Date();
    const days = parseInt(dateRange) || 30;
    startDate.setDate(startDate.getDate() - days);

    switch (dataSource) {
      case 'leads':
        return this.getLeadStats(startDate, endDate, permissions, query);
      case 'quotations':
        return this.getQuotationStats(startDate, endDate, permissions, query);
      case 'contracts':
        return this.getContractStats(startDate, endDate, permissions, query);
      case 'studies':
        return this.getStudyStats(startDate, endDate, permissions, query);
      case 'revenue':
        return this.getRevenueStats(startDate, endDate, permissions, query);
      default:
        return { value: 0, data: [] };
    }
  }

  // 리드 통계 (사용자/부서 필터링)
  private async getLeadStats(startDate: Date, endDate: Date, permissions: UserPermissions, query?: any) {
    const userFilter = buildUserFilter(permissions);
    
    const where: any = {
      createdAt: { gte: startDate, lte: endDate },
      deletedAt: null,
      ...userFilter
    };

    const [total, byStatus, bySource] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.groupBy({
        by: ['status'],
        where,
        _count: true
      }),
      prisma.lead.groupBy({
        by: ['source'],
        where,
        _count: true
      })
    ]);

    return {
      value: total,
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count })),
      bySource: bySource.map(s => ({ source: s.source, count: s._count }))
    };
  }

  // 견적서 통계 (사용자/부서 필터링)
  private async getQuotationStats(startDate: Date, endDate: Date, permissions: UserPermissions, query?: any) {
    const userFilter = buildUserFilter(permissions);
    
    const where: any = {
      createdAt: { gte: startDate, lte: endDate },
      deletedAt: null,
      ...userFilter
    };

    const [total, byStatus, totalAmount] = await Promise.all([
      prisma.quotation.count({ where }),
      prisma.quotation.groupBy({
        by: ['status'],
        where,
        _count: true
      }),
      prisma.quotation.aggregate({
        where,
        _sum: { totalAmount: true }
      })
    ]);

    return {
      value: total,
      totalAmount: totalAmount._sum.totalAmount || 0,
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count }))
    };
  }

  // 계약 통계 (사용자/부서 필터링)
  private async getContractStats(startDate: Date, endDate: Date, permissions: UserPermissions, query?: any) {
    const userFilter = buildUserFilter(permissions);
    
    const where: any = {
      createdAt: { gte: startDate, lte: endDate },
      deletedAt: null,
      ...userFilter
    };

    const [total, byStatus, totalAmount] = await Promise.all([
      prisma.contract.count({ where }),
      prisma.contract.groupBy({
        by: ['status'],
        where,
        _count: true
      }),
      prisma.contract.aggregate({
        where,
        _sum: { totalAmount: true }
      })
    ]);

    return {
      value: total,
      totalAmount: totalAmount._sum.totalAmount || 0,
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count }))
    };
  }

  // 시험 통계 (사용자/부서 필터링 - Contract 관계를 통해)
  private async getStudyStats(startDate: Date, endDate: Date, permissions: UserPermissions, query?: any) {
    // Study는 Contract를 통해 userId에 연결됨
    let contractFilter: any = {};
    if (!permissions.isAdmin && !permissions.canViewAllData) {
      contractFilter = { contract: { userId: permissions.userId } };
    }
    
    const where: any = {
      createdAt: { gte: startDate, lte: endDate },
      ...contractFilter
    };

    const [total, byStatus, delayed] = await Promise.all([
      prisma.study.count({ where }),
      prisma.study.groupBy({
        by: ['status'],
        where,
        _count: true
      }),
      prisma.study.count({
        where: {
          ...where,
          expectedEndDate: { lt: new Date() },
          status: { notIn: ['COMPLETED', 'SUSPENDED'] }
        }
      })
    ]);

    return {
      value: total,
      delayed,
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count }))
    };
  }

  // 매출 통계 (사용자/부서 필터링 + canViewAllSales 권한 체크)
  private async getRevenueStats(startDate: Date, endDate: Date, permissions: UserPermissions, query?: any) {
    // 매출 조회는 canViewAllSales 권한도 체크
    let userFilter: any = {};
    if (!permissions.isAdmin && !permissions.canViewAllData && !permissions.canViewAllSales) {
      userFilter = { userId: permissions.userId };
    }
    
    const contracts = await prisma.contract.findMany({
      where: {
        signedDate: { gte: startDate, lte: endDate },
        status: { in: ['SIGNED', 'IN_PROGRESS', 'COMPLETED'] },
        deletedAt: null,
        ...userFilter
      },
      select: {
        signedDate: true,
        totalAmount: true
      }
    });

    // 월별 집계
    const monthlyData: Record<string, number> = {};
    contracts.forEach(c => {
      if (c.signedDate) {
        const month = c.signedDate.toISOString().slice(0, 7);
        monthlyData[month] = (monthlyData[month] || 0) + Number(c.totalAmount);
      }
    });

    const totalRevenue = contracts.reduce((sum, c) => sum + Number(c.totalAmount), 0);

    return {
      value: totalRevenue,
      monthly: Object.entries(monthlyData).map(([month, amount]) => ({ month, amount }))
    };
  }

  // 위젯 템플릿 목록
  async getWidgetTemplates() {
    const templates = await prisma.widgetTemplate.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });

    const categories = [...new Set(templates.map(t => t.category))];

    return { templates, categories };
  }
}

export const dashboardService = new DashboardService();
