// Dashboard Service - 대시보드 및 위젯 관리
import prisma from '../lib/prisma';
import { WidgetType, Department, Position, Title } from '@prisma/client';

interface CreateDashboardInput {
  name: string;
  description?: string;
  layout?: any;
  isDefault?: boolean;
  isPublic?: boolean;
  ownerId: string;
}

// 대시보드 접근 레벨
export type DashboardAccessLevel = 'PERSONAL' | 'TEAM' | 'FULL';

// 사용자 권한 정보
interface UserPermissions {
  userId: string;
  department?: Department | null;
  position?: Position | null;
  title?: Title | null;
  canViewAllData: boolean;
  canViewAllSales: boolean;
  isAdmin: boolean;
}

// 전사 데이터 열람 가능 직급 (센터장 이상)
const FULL_ACCESS_POSITIONS: Position[] = ['CENTER_HEAD', 'DIVISION_HEAD', 'CEO', 'CHAIRMAN'];

// 전사 데이터 열람 가능 직책
const FULL_ACCESS_TITLES: Title[] = ['TEAM_LEADER'];

// 전사 데이터 열람 가능 부서
const FULL_ACCESS_DEPARTMENTS: Department[] = ['SUPPORT'];

// 사용자의 대시보드 접근 레벨 결정
function getDashboardAccessLevel(permissions: UserPermissions): DashboardAccessLevel {
  // 1. ADMIN → 전사 열람
  if (permissions.isAdmin) return 'FULL';

  // 2. 사업지원팀 → 전사 열람
  if (permissions.department && FULL_ACCESS_DEPARTMENTS.includes(permissions.department)) {
    return 'FULL';
  }

  // 3. 직책 팀장 → 전사 열람
  if (permissions.title && FULL_ACCESS_TITLES.includes(permissions.title)) {
    return 'FULL';
  }

  // 4. 직급 센터장 이상 → 전사 열람
  if (permissions.position && FULL_ACCESS_POSITIONS.includes(permissions.position)) {
    return 'FULL';
  }

  // 5. canViewAllData 또는 canViewAllSales 권한 → 전사 열람
  if (permissions.canViewAllData || permissions.canViewAllSales) {
    return 'FULL';
  }

  // 6. 부서 소속 일반 사용자 → 개인 + 소속 부서
  if (permissions.department) {
    return 'TEAM';
  }

  // 7. 부서 미지정 → 본인만
  return 'PERSONAL';
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

  // ==================== 권한 기반 대시보드 통계 ====================

  /**
   * 권한 기반 대시보드 통계 조회
   */
  async getDashboardStats(userId: string, params?: { year?: number; month?: number; quarter?: number }) {
    // 사용자 권한 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        department: true,
        position: true,
        title: true,
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
      position: user.position,
      title: user.title,
      canViewAllData: user.canViewAllData,
      canViewAllSales: user.canViewAllSales,
      isAdmin: user.role === 'ADMIN'
    };

    const accessLevel = getDashboardAccessLevel(permissions);

    // 기간 설정
    const now = new Date();
    const year = params?.year || now.getFullYear();
    const month = params?.month || now.getMonth() + 1;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // 개인 데이터
    const personalData = await this.getStatsForUser(userId, startDate, endDate);

    // 전사 데이터 (FULL 권한만)
    let companyData = null;
    let departmentData = null;
    let userRanking = null;

    if (accessLevel === 'FULL') {
      companyData = await this.getCompanyStats(startDate, endDate);
      departmentData = await this.getDepartmentStats(startDate, endDate);
      userRanking = await this.getUserRanking(startDate, endDate);
    }

    return {
      accessLevel,
      user: {
        id: user.id,
        name: user.name,
        department: user.department,
        position: user.position,
        title: user.title
      },
      period: {
        year,
        month,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      personal: personalData,
      company: companyData,
      byDepartment: departmentData,
      userRanking
    };
  }

  /**
   * 특정 사용자의 통계
   */
  private async getStatsForUser(userId: string, startDate: Date, endDate: Date) {
    const [quotations, contracts, leads, leadGradeCustomers] = await Promise.all([
      // 견적서 통계
      prisma.quotation.aggregate({
        where: {
          userId,
          createdAt: { gte: startDate, lte: endDate },
          deletedAt: null
        },
        _count: true,
        _sum: { totalAmount: true }
      }),
      // 계약 통계
      prisma.contract.aggregate({
        where: {
          userId,
          createdAt: { gte: startDate, lte: endDate },
          deletedAt: null
        },
        _count: true,
        _sum: { totalAmount: true }
      }),
      // 리드 통계 (Lead 테이블)
      prisma.lead.count({
        where: {
          userId,
          createdAt: { gte: startDate, lte: endDate },
          deletedAt: null
        }
      }),
      // grade=LEAD 고객 수 (연결된 Lead가 없는 경우만 - 중복 방지)
      prisma.customer.count({
        where: {
          userId,
          grade: 'LEAD',
          deletedAt: null,
          leads: { none: { deletedAt: null } },
        }
      })
    ]);

    // 견적서 상태별 통계
    const quotationsByStatus = await prisma.quotation.groupBy({
      by: ['status'],
      where: {
        userId,
        createdAt: { gte: startDate, lte: endDate },
        deletedAt: null
      },
      _count: true,
      _sum: { totalAmount: true }
    });

    const statusMap: Record<string, { count: number; amount: number }> = {};
    quotationsByStatus.forEach(q => {
      statusMap[q.status] = {
        count: q._count,
        amount: Number(q._sum.totalAmount || 0)
      };
    });

    const won = statusMap['ACCEPTED']?.count || 0;
    const lost = statusMap['REJECTED']?.count || 0;
    const totalDecided = won + lost;
    const conversionRate = totalDecided > 0 ? (won / totalDecided) * 100 : 0;

    return {
      quotation: {
        count: quotations._count,
        amount: Number(quotations._sum.totalAmount || 0),
        byStatus: statusMap
      },
      contract: {
        count: contracts._count,
        amount: Number(contracts._sum.totalAmount || 0)
      },
      lead: {
        count: leads + leadGradeCustomers
      },
      kpi: {
        conversionRate: Math.round(conversionRate * 10) / 10,
        won,
        lost
      }
    };
  }

  /**
   * 전사 통계
   */
  private async getCompanyStats(startDate: Date, endDate: Date) {
    const [quotations, contracts, leads, leadGradeCustomers] = await Promise.all([
      prisma.quotation.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          deletedAt: null
        },
        _count: true,
        _sum: { totalAmount: true }
      }),
      prisma.contract.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          deletedAt: null
        },
        _count: true,
        _sum: { totalAmount: true }
      }),
      prisma.lead.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          deletedAt: null
        }
      }),
      // grade=LEAD 고객 수 (연결된 Lead가 없는 경우만)
      prisma.customer.count({
        where: {
          grade: 'LEAD',
          deletedAt: null,
          leads: { none: { deletedAt: null } },
        }
      })
    ]);

    // 견적서 상태별 통계
    const quotationsByStatus = await prisma.quotation.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
        deletedAt: null
      },
      _count: true,
      _sum: { totalAmount: true }
    });

    const statusMap: Record<string, { count: number; amount: number }> = {};
    quotationsByStatus.forEach(q => {
      statusMap[q.status] = {
        count: q._count,
        amount: Number(q._sum.totalAmount || 0)
      };
    });

    const won = statusMap['ACCEPTED']?.count || 0;
    const lost = statusMap['REJECTED']?.count || 0;
    const totalDecided = won + lost;
    const conversionRate = totalDecided > 0 ? (won / totalDecided) * 100 : 0;

    return {
      quotation: {
        count: quotations._count,
        amount: Number(quotations._sum.totalAmount || 0),
        byStatus: statusMap
      },
      contract: {
        count: contracts._count,
        amount: Number(contracts._sum.totalAmount || 0)
      },
      lead: {
        count: leads + leadGradeCustomers
      },
      kpi: {
        conversionRate: Math.round(conversionRate * 10) / 10,
        won,
        lost
      }
    };
  }

  /**
   * 부서별 통계
   */
  private async getDepartmentStats(startDate: Date, endDate: Date) {
    const departments: Department[] = ['BD1', 'BD2', 'SUPPORT'];
    const results = [];

    for (const dept of departments) {
      // 해당 부서 사용자 ID 목록
      const deptUsers = await prisma.user.findMany({
        where: { department: dept },
        select: { id: true }
      });
      const userIds = deptUsers.map(u => u.id);

      if (userIds.length === 0) {
        results.push({
          department: dept,
          departmentName: this.getDepartmentName(dept),
          quotation: { count: 0, amount: 0 },
          contract: { count: 0, amount: 0 },
          conversionRate: 0
        });
        continue;
      }

      const [quotations, contracts] = await Promise.all([
        prisma.quotation.aggregate({
          where: {
            userId: { in: userIds },
            createdAt: { gte: startDate, lte: endDate },
            deletedAt: null
          },
          _count: true,
          _sum: { totalAmount: true }
        }),
        prisma.contract.aggregate({
          where: {
            userId: { in: userIds },
            createdAt: { gte: startDate, lte: endDate },
            deletedAt: null
          },
          _count: true,
          _sum: { totalAmount: true }
        })
      ]);

      // 수주/실주 통계
      const wonLost = await prisma.quotation.groupBy({
        by: ['status'],
        where: {
          userId: { in: userIds },
          createdAt: { gte: startDate, lte: endDate },
          deletedAt: null,
          status: { in: ['ACCEPTED', 'REJECTED'] }
        },
        _count: true
      });

      const won = wonLost.find(w => w.status === 'ACCEPTED')?._count || 0;
      const lost = wonLost.find(w => w.status === 'REJECTED')?._count || 0;
      const totalDecided = won + lost;
      const conversionRate = totalDecided > 0 ? (won / totalDecided) * 100 : 0;

      results.push({
        department: dept,
        departmentName: this.getDepartmentName(dept),
        quotation: {
          count: quotations._count,
          amount: Number(quotations._sum.totalAmount || 0)
        },
        contract: {
          count: contracts._count,
          amount: Number(contracts._sum.totalAmount || 0)
        },
        conversionRate: Math.round(conversionRate * 10) / 10
      });
    }

    return results;
  }

  /**
   * 사용자별 순위
   */
  private async getUserRanking(startDate: Date, endDate: Date, limit: number = 10) {
    // 견적 금액 기준 상위 사용자
    const quotationRanking = await prisma.quotation.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
        deletedAt: null
      },
      _count: true,
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: limit
    });

    // 사용자 정보 조회
    const userIds = quotationRanking.map(q => q.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, department: true, position: true }
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return quotationRanking.map((q, index) => {
      const user = userMap.get(q.userId);
      return {
        rank: index + 1,
        userId: q.userId,
        userName: user?.name || 'Unknown',
        department: user?.department,
        departmentName: user?.department ? this.getDepartmentName(user.department) : null,
        position: user?.position,
        quotationCount: q._count,
        quotationAmount: Number(q._sum.totalAmount || 0)
      };
    });
  }

  private getDepartmentName(dept: Department): string {
    const names: Record<Department, string> = {
      BD1: '사업개발 1센터',
      BD2: '사업개발 2센터',
      SUPPORT: '사업지원팀'
    };
    return names[dept] || dept;
  }

  // ==================== 업무 대시보드 ====================

  /**
   * 업무 대시보드 항목 조회 (개인 업무 도우미)
   */
  async getWorkItems(userId: string) {
    const now = new Date();
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [upcomingMeetings, pendingQuotations, upcomingInvoices, upcomingTests, pendingFollowUps] = await Promise.all([
      // 1. 다가오는 미팅 (향후 7일)
      prisma.meetingRecord.findMany({
        where: {
          date: { gte: now, lte: sevenDaysLater },
          customer: { userId }
        },
        select: {
          id: true, title: true, date: true, time: true, type: true,
          customer: { select: { id: true, name: true, company: true } }
        },
        orderBy: { date: 'asc' },
        take: 10
      }),

      // 2. 견적서 후속 조치 (SENT 후 7일 이상 미응답)
      prisma.quotation.findMany({
        where: {
          userId,
          status: 'SENT',
          createdAt: { lte: sevenDaysAgo },
          deletedAt: null
        },
        select: {
          id: true, quotationNumber: true, customerName: true,
          totalAmount: true, createdAt: true, quotationType: true
        },
        orderBy: { createdAt: 'asc' },
        take: 10
      }),

      // 3. 세금계산서 임박 (7일 이내 발행 예정)
      prisma.invoiceSchedule.findMany({
        where: {
          scheduledDate: { gte: now, lte: sevenDaysLater },
          status: 'pending',
          customer: { userId }
        },
        select: {
          id: true, amount: true, scheduledDate: true, invoiceNumber: true,
          customer: { select: { id: true, name: true, company: true } },
          testReception: { select: { id: true, testNumber: true, testTitle: true } }
        },
        orderBy: { scheduledDate: 'asc' },
        take: 10
      }),

      // 4. 시험 완료 예정 (7일 이내)
      prisma.testReception.findMany({
        where: {
          expectedCompletionDate: { gte: now, lte: sevenDaysLater },
          status: { in: ['received', 'in_progress'] },
          customer: { userId }
        },
        select: {
          id: true, testNumber: true, testTitle: true,
          expectedCompletionDate: true, status: true,
          customer: { select: { id: true, name: true, company: true } }
        },
        orderBy: { expectedCompletionDate: 'asc' },
        take: 10
      }),

      // 5. 후속 조치 필요 (미완료 요청사항)
      prisma.meetingRecord.findMany({
        where: {
          customer: { userId },
          isRequest: true,
          requestStatus: { in: ['pending', 'in_progress'] }
        },
        select: {
          id: true, title: true, date: true, followUpActions: true,
          requestStatus: true,
          customer: { select: { id: true, name: true, company: true } }
        },
        orderBy: { date: 'desc' },
        take: 10
      })
    ]);

    // 응답 데이터 변환 (company || name → companyName)
    const mapCustomer = (c: { id: string; name: string; company: string | null }) => ({
      id: c.id, companyName: c.company || c.name
    });

    return {
      upcomingMeetings: upcomingMeetings.map(m => ({ ...m, customer: mapCustomer(m.customer) })),
      pendingQuotations,
      upcomingInvoices: upcomingInvoices.map(m => ({ ...m, customer: mapCustomer(m.customer) })),
      upcomingTests: upcomingTests.map(m => ({ ...m, customer: mapCustomer(m.customer) })),
      pendingFollowUps: pendingFollowUps.map(m => ({ ...m, customer: mapCustomer(m.customer) })),
      summary: {
        meetings: upcomingMeetings.length,
        quotations: pendingQuotations.length,
        invoices: upcomingInvoices.length,
        tests: upcomingTests.length,
        followUps: pendingFollowUps.length,
        total: upcomingMeetings.length + pendingQuotations.length + upcomingInvoices.length + upcomingTests.length + pendingFollowUps.length
      }
    };
  }

  // ==================== 매출 대시보드 ====================

  /**
   * 매출 대시보드 통계 조회 (권한별 데이터 범위)
   */
  async getSalesStats(userId: string, params?: { year?: number; scope?: string; department?: string }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, department: true, position: true, title: true,
        canViewAllData: true, canViewAllSales: true, role: true
      }
    });

    if (!user) throw new Error('User not found');

    const permissions: UserPermissions = {
      userId: user.id, department: user.department, position: user.position,
      title: user.title, canViewAllData: user.canViewAllData,
      canViewAllSales: user.canViewAllSales, isAdmin: user.role === 'ADMIN'
    };

    const accessLevel = getDashboardAccessLevel(permissions);
    const year = params?.year || new Date().getFullYear();
    const scope = params?.scope || 'personal';
    const requestedDept = params?.department as Department | undefined;

    // 스코프별 사용자 ID 목록 결정
    let targetUserIds: string[] = [userId];

    if (scope === 'department') {
      const dept = requestedDept || user.department;
      if (dept && (accessLevel === 'FULL' || user.department === dept)) {
        const deptUsers = await prisma.user.findMany({
          where: { department: dept },
          select: { id: true }
        });
        targetUserIds = deptUsers.map(u => u.id);
      }
    } else if (scope === 'company' && accessLevel === 'FULL') {
      targetUserIds = []; // 빈 배열 = 전체
    }

    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);

    const userFilter = targetUserIds.length > 0 ? { userId: { in: targetUserIds } } : {};

    // 월별 견적/계약 데이터
    const [quotations, contracts] = await Promise.all([
      prisma.quotation.findMany({
        where: { ...userFilter, createdAt: { gte: yearStart, lte: yearEnd }, deletedAt: null },
        select: { id: true, totalAmount: true, status: true, createdAt: true, modality: true, quotationType: true }
      }),
      prisma.contract.findMany({
        where: { ...userFilter, createdAt: { gte: yearStart, lte: yearEnd }, deletedAt: null },
        select: { id: true, totalAmount: true, status: true, createdAt: true, signedDate: true, contractType: true }
      })
    ]);

    // 월별 집계
    const monthly: Record<number, { quotationAmount: number; quotationCount: number; contractAmount: number; contractCount: number; won: number; lost: number }> = {};
    for (let m = 1; m <= 12; m++) {
      monthly[m] = { quotationAmount: 0, quotationCount: 0, contractAmount: 0, contractCount: 0, won: 0, lost: 0 };
    }

    let totalQuotationAmount = 0, totalContractAmount = 0, totalWon = 0, totalLost = 0;
    const modalityMap: Record<string, number> = {};

    quotations.forEach(q => {
      const m = q.createdAt.getMonth() + 1;
      const amt = Number(q.totalAmount);
      monthly[m].quotationAmount += amt;
      monthly[m].quotationCount++;
      totalQuotationAmount += amt;
      if (q.status === 'ACCEPTED') { monthly[m].won++; totalWon++; }
      if (q.status === 'REJECTED') { monthly[m].lost++; totalLost++; }
      const mod = q.modality || q.quotationType || 'OTHER';
      modalityMap[mod] = (modalityMap[mod] || 0) + amt;
    });

    contracts.forEach(c => {
      const m = c.createdAt.getMonth() + 1;
      const amt = Number(c.totalAmount);
      monthly[m].contractAmount += amt;
      monthly[m].contractCount++;
      totalContractAmount += amt;
    });

    const totalDecided = totalWon + totalLost;
    const conversionRate = totalDecided > 0 ? Math.round((totalWon / totalDecided) * 1000) / 10 : 0;

    // 분기별 집계
    const quarterly: Record<number, { quotationAmount: number; contractAmount: number; conversionRate: number }> = {};
    for (let q = 1; q <= 4; q++) {
      const months = [q * 3 - 2, q * 3 - 1, q * 3];
      let qAmt = 0, cAmt = 0, qWon = 0, qLost = 0;
      months.forEach(m => {
        qAmt += monthly[m].quotationAmount;
        cAmt += monthly[m].contractAmount;
        qWon += monthly[m].won;
        qLost += monthly[m].lost;
      });
      const qDecided = qWon + qLost;
      quarterly[q] = {
        quotationAmount: qAmt,
        contractAmount: cAmt,
        conversionRate: qDecided > 0 ? Math.round((qWon / qDecided) * 1000) / 10 : 0
      };
    }

    // 담당자별 순위 (전사 스코프만)
    let userRanking = null;
    if (scope === 'company' && accessLevel === 'FULL') {
      userRanking = await this.getUserRanking(yearStart, yearEnd);
    }

    // 부서별 현황 (전사 스코프만)
    let departmentStats = null;
    if (scope === 'company' && accessLevel === 'FULL') {
      departmentStats = await this.getDepartmentStats(yearStart, yearEnd);
    }

    return {
      accessLevel,
      user: { id: user.id, name: user.name, department: user.department },
      year,
      scope,
      totals: {
        quotationAmount: totalQuotationAmount,
        quotationCount: quotations.length,
        contractAmount: totalContractAmount,
        contractCount: contracts.length,
        conversionRate,
        won: totalWon,
        lost: totalLost
      },
      monthly: Object.entries(monthly).map(([m, data]) => ({ month: parseInt(m), ...data })),
      quarterly: Object.entries(quarterly).map(([q, data]) => ({ quarter: parseInt(q), ...data })),
      modality: Object.entries(modalityMap).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount),
      userRanking,
      departmentStats
    };
  }
}

export const dashboardService = new DashboardService();
