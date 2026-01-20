import { PrismaClient, Prisma, ReportType } from '@prisma/client';
import { AppError, ErrorCodes } from '../types/error';
import { PaginatedResult } from '../types';

export { ReportType } from '@prisma/client';

export interface ReportDefinition {
  id: string;
  name: string;
  description: string | null;
  type: ReportType;
  dataSources: Record<string, unknown>;
  columns: Record<string, unknown>[];
  filters: Record<string, unknown>[] | null;
  groupBy: Record<string, unknown>[] | null;
  orderBy: Record<string, unknown>[] | null;
  charts: Record<string, unknown>[] | null;
  isSystem: boolean;
  isPublic: boolean;
  ownerId: string;
  sharedWith: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportExport {
  id: string;
  reportId: string;
  format: string;
  filters: Record<string, unknown> | null;
  dateRange: Record<string, unknown> | null;
  fileName: string;
  fileUrl: string | null;
  fileSize: number | null;
  status: string;
  error: string | null;
  exportedBy: string;
  exportedAt: Date;
  completedAt: Date | null;
}

export interface CreateReportDTO {
  name: string;
  description?: string;
  type: ReportType;
  dataSources: Record<string, unknown>;
  columns: Record<string, unknown>[];
  filters?: Record<string, unknown>[];
  groupBy?: Record<string, unknown>[];
  orderBy?: Record<string, unknown>[];
  charts?: Record<string, unknown>[];
  isPublic?: boolean;
}

export interface ExecuteReportDTO {
  filters?: Record<string, unknown>;
  dateRange?: { start: string; end: string };
  page?: number;
  limit?: number;
}

export interface ExportReportDTO {
  format: 'PDF' | 'EXCEL' | 'CSV';
  filters?: Record<string, unknown>;
  dateRange?: { start: string; end: string };
  includeCharts?: boolean;
}

export interface ReportsFilters {
  type?: ReportType;
  isSystem?: boolean;
  search?: string;
  page: number;
  limit: number;
}

// System report templates
export const SYSTEM_REPORTS = [
  {
    id: 'sales-summary',
    name: '매출 요약 리포트',
    description: '기간별 매출 현황을 요약합니다',
    type: ReportType.SALES_SUMMARY,
    dataSources: { primary: 'Contract' },
    columns: [
      { field: 'period', label: '기간', type: 'date' },
      { field: 'totalAmount', label: '총 매출', type: 'currency' },
      { field: 'count', label: '계약 건수', type: 'number' },
      { field: 'avgAmount', label: '평균 계약금액', type: 'currency' },
    ],
  },
  {
    id: 'pipeline-status',
    name: '파이프라인 현황 리포트',
    description: '리드 파이프라인 단계별 현황을 보여줍니다',
    type: ReportType.PIPELINE_STATUS,
    dataSources: { primary: 'Lead' },
    columns: [
      { field: 'stage', label: '단계', type: 'string' },
      { field: 'count', label: '건수', type: 'number' },
      { field: 'expectedAmount', label: '예상 금액', type: 'currency' },
      { field: 'avgDaysInStage', label: '평균 체류일', type: 'number' },
    ],
  },
  {
    id: 'conversion-rate',
    name: '전환율 분석 리포트',
    description: '리드에서 계약까지의 전환율을 분석합니다',
    type: ReportType.CONVERSION_RATE,
    dataSources: { primary: 'Lead', secondary: 'Contract' },
    columns: [
      { field: 'fromStage', label: '시작 단계', type: 'string' },
      { field: 'toStage', label: '종료 단계', type: 'string' },
      { field: 'conversionRate', label: '전환율', type: 'percent' },
      { field: 'avgDays', label: '평균 소요일', type: 'number' },
    ],
  },
  {
    id: 'study-status',
    name: '시험 현황 리포트',
    description: '시험 진행 현황을 보여줍니다',
    type: ReportType.STUDY_STATUS,
    dataSources: { primary: 'Study' },
    columns: [
      { field: 'status', label: '상태', type: 'string' },
      { field: 'count', label: '건수', type: 'number' },
      { field: 'delayed', label: '지연 건수', type: 'number' },
      { field: 'avgProgress', label: '평균 진행률', type: 'percent' },
    ],
  },
];

export class ReportService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ==================== Report Definitions CRUD ====================

  async getReports(userId: string, filters: ReportsFilters): Promise<PaginatedResult<ReportDefinition>> {
    const { page, limit, type, isSystem, search } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ReportDefinitionWhereInput = {
      ...(type && { type }),
      ...(isSystem !== undefined && { isSystem }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      }),
      OR: [
        { ownerId: userId },
        { isPublic: true },
        { sharedWith: { has: userId } },
      ],
    };

    const [reports, total] = await Promise.all([
      this.prisma.reportDefinition.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isSystem: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.reportDefinition.count({ where }),
    ]);

    return {
      data: reports.map(this.toReportDefinition),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getReportById(id: string, userId: string): Promise<ReportDefinition> {
    const report = await this.prisma.reportDefinition.findUnique({ where: { id } });

    if (!report) {
      throw new AppError('리포트를 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    // Check access
    if (report.ownerId !== userId && !report.isPublic && !report.sharedWith.includes(userId)) {
      throw new AppError('리포트에 접근할 수 없습니다', 403, ErrorCodes.RESOURCE_ACCESS_DENIED);
    }

    return this.toReportDefinition(report);
  }

  async createReport(userId: string, data: CreateReportDTO): Promise<ReportDefinition> {
    const report = await this.prisma.reportDefinition.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        dataSources: data.dataSources as Prisma.InputJsonValue,
        columns: data.columns as Prisma.InputJsonValue,
        filters: data.filters as Prisma.InputJsonValue,
        groupBy: data.groupBy as Prisma.InputJsonValue,
        orderBy: data.orderBy as Prisma.InputJsonValue,
        charts: data.charts as Prisma.InputJsonValue,
        isPublic: data.isPublic || false,
        ownerId: userId,
      },
    });

    return this.toReportDefinition(report);
  }

  async updateReport(id: string, userId: string, data: Partial<CreateReportDTO>): Promise<ReportDefinition> {
    const existing = await this.prisma.reportDefinition.findUnique({ where: { id } });
    
    if (!existing) {
      throw new AppError('리포트를 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    if (existing.ownerId !== userId) {
      throw new AppError('리포트를 수정할 권한이 없습니다', 403, ErrorCodes.RESOURCE_ACCESS_DENIED);
    }

    if (existing.isSystem) {
      throw new AppError('시스템 리포트는 수정할 수 없습니다', 400, ErrorCodes.VALIDATION_ERROR);
    }

    const report = await this.prisma.reportDefinition.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type && { type: data.type }),
        ...(data.dataSources && { dataSources: data.dataSources as Prisma.InputJsonValue }),
        ...(data.columns && { columns: data.columns as Prisma.InputJsonValue }),
        ...(data.filters !== undefined && { filters: data.filters as Prisma.InputJsonValue }),
        ...(data.groupBy !== undefined && { groupBy: data.groupBy as Prisma.InputJsonValue }),
        ...(data.orderBy !== undefined && { orderBy: data.orderBy as Prisma.InputJsonValue }),
        ...(data.charts !== undefined && { charts: data.charts as Prisma.InputJsonValue }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
      },
    });

    return this.toReportDefinition(report);
  }

  async deleteReport(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.reportDefinition.findUnique({ where: { id } });
    
    if (!existing) {
      throw new AppError('리포트를 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    if (existing.ownerId !== userId) {
      throw new AppError('리포트를 삭제할 권한이 없습니다', 403, ErrorCodes.RESOURCE_ACCESS_DENIED);
    }

    if (existing.isSystem) {
      throw new AppError('시스템 리포트는 삭제할 수 없습니다', 400, ErrorCodes.VALIDATION_ERROR);
    }

    await this.prisma.reportDefinition.delete({ where: { id } });
  }

  // ==================== Report Execution ====================

  async executeReport(id: string, userId: string, options: ExecuteReportDTO): Promise<{
    data: Record<string, unknown>[];
    columns: Record<string, unknown>[];
    summary: Record<string, unknown>;
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const report = await this.getReportById(id, userId);
    const { filters, dateRange, page = 1, limit = 50 } = options;

    // Build query based on report type
    const result = await this.executeReportQuery(report, { filters, dateRange, page, limit });

    return result;
  }

  private async executeReportQuery(
    report: ReportDefinition,
    options: { filters?: Record<string, unknown>; dateRange?: { start: string; end: string }; page: number; limit: number }
  ): Promise<{
    data: Record<string, unknown>[];
    columns: Record<string, unknown>[];
    summary: Record<string, unknown>;
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { page, limit, dateRange } = options;
    const skip = (page - 1) * limit;

    let data: Record<string, unknown>[] = [];
    let total = 0;
    let summary: Record<string, unknown> = {};

    const dateFilter = dateRange ? {
      createdAt: {
        gte: new Date(dateRange.start),
        lte: new Date(dateRange.end),
      },
    } : {};

    switch (report.type) {
      case ReportType.SALES_SUMMARY:
        const contracts = await this.prisma.contract.findMany({
          where: { ...dateFilter, status: 'COMPLETED' },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        });
        total = await this.prisma.contract.count({ where: { ...dateFilter, status: 'COMPLETED' } });
        
        const totalAmount = await this.prisma.contract.aggregate({
          where: { ...dateFilter, status: 'COMPLETED' },
          _sum: { totalAmount: true },
          _avg: { totalAmount: true },
        });

        data = contracts.map(c => ({
          id: c.id,
          contractNumber: c.contractNumber,
          title: c.title,
          totalAmount: c.totalAmount,
          signedDate: c.signedDate,
          status: c.status,
        }));

        summary = {
          totalRevenue: totalAmount._sum.totalAmount || 0,
          avgDealSize: totalAmount._avg.totalAmount || 0,
          count: total,
        };
        break;

      case ReportType.PIPELINE_STATUS:
        const stages = await this.prisma.pipelineStage.findMany({
          where: { isActive: true },
          orderBy: { order: 'asc' },
        });

        const leadCounts = await Promise.all(
          stages.map(async (stage) => {
            const count = await this.prisma.lead.count({
              where: { stageId: stage.id, ...dateFilter },
            });
            const expectedAmount = await this.prisma.lead.aggregate({
              where: { stageId: stage.id, ...dateFilter },
              _sum: { expectedAmount: true },
            });
            return {
              stageId: stage.id,
              stageName: stage.name,
              count,
              expectedAmount: expectedAmount._sum.expectedAmount || 0,
            };
          })
        );

        data = leadCounts;
        total = stages.length;
        summary = {
          totalLeads: leadCounts.reduce((sum, s) => sum + s.count, 0),
          totalExpectedAmount: leadCounts.reduce((sum, s) => sum + Number(s.expectedAmount), 0),
        };
        break;

      case ReportType.STUDY_STATUS:
        const studies = await this.prisma.study.findMany({
          where: dateFilter,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { contract: { include: { customer: true } } },
        });
        total = await this.prisma.study.count({ where: dateFilter });

        const statusCounts = await this.prisma.study.groupBy({
          by: ['status'],
          where: dateFilter,
          _count: true,
        });

        data = studies.map(s => ({
          id: s.id,
          studyNumber: s.studyNumber,
          testName: s.testName,
          status: s.status,
          customerName: s.contract.customer.name,
          expectedEndDate: s.expectedEndDate,
          actualEndDate: s.actualEndDate,
        }));

        summary = {
          byStatus: statusCounts.reduce((acc, s) => ({ ...acc, [s.status]: s._count }), {}),
          total,
        };
        break;

      default:
        // Generic query for custom reports
        data = [];
        total = 0;
        summary = {};
    }

    return {
      data,
      columns: report.columns,
      summary,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ==================== Report Export ====================

  async exportReport(id: string, userId: string, options: ExportReportDTO): Promise<ReportExport> {
    const report = await this.getReportById(id, userId);

    const fileName = `${report.name}_${new Date().toISOString().split('T')[0]}.${options.format.toLowerCase()}`;

    const exportRecord = await this.prisma.reportExport.create({
      data: {
        reportId: id,
        format: options.format,
        filters: options.filters as Prisma.InputJsonValue,
        dateRange: options.dateRange as Prisma.InputJsonValue,
        fileName,
        status: 'PENDING',
        exportedBy: userId,
      },
    });

    // In a real implementation, this would trigger an async job
    // For now, we'll mark it as completed immediately
    const updatedExport = await this.prisma.reportExport.update({
      where: { id: exportRecord.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        fileUrl: `/exports/${fileName}`, // Placeholder URL
        fileSize: 0,
      },
    });

    return this.toReportExport(updatedExport);
  }

  async getExportStatus(exportId: string, userId: string): Promise<ReportExport> {
    const exportRecord = await this.prisma.reportExport.findUnique({
      where: { id: exportId },
    });

    if (!exportRecord) {
      throw new AppError('내보내기 기록을 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    if (exportRecord.exportedBy !== userId) {
      throw new AppError('내보내기 기록에 접근할 수 없습니다', 403, ErrorCodes.RESOURCE_ACCESS_DENIED);
    }

    return this.toReportExport(exportRecord);
  }

  async getExports(userId: string, page: number = 1, limit: number = 20): Promise<PaginatedResult<ReportExport>> {
    const skip = (page - 1) * limit;

    const [exports, total] = await Promise.all([
      this.prisma.reportExport.findMany({
        where: { exportedBy: userId },
        skip,
        take: limit,
        orderBy: { exportedAt: 'desc' },
      }),
      this.prisma.reportExport.count({ where: { exportedBy: userId } }),
    ]);

    return {
      data: exports.map(this.toReportExport),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ==================== System Reports ====================

  getSystemReports() {
    return SYSTEM_REPORTS;
  }

  // ==================== Helpers ====================

  private toReportDefinition(report: Record<string, unknown>): ReportDefinition {
    return {
      id: report.id as string,
      name: report.name as string,
      description: report.description as string | null,
      type: report.type as ReportType,
      dataSources: report.dataSources as Record<string, unknown>,
      columns: report.columns as Record<string, unknown>[],
      filters: report.filters as Record<string, unknown>[] | null,
      groupBy: report.groupBy as Record<string, unknown>[] | null,
      orderBy: report.orderBy as Record<string, unknown>[] | null,
      charts: report.charts as Record<string, unknown>[] | null,
      isSystem: report.isSystem as boolean,
      isPublic: report.isPublic as boolean,
      ownerId: report.ownerId as string,
      sharedWith: report.sharedWith as string[],
      createdAt: report.createdAt as Date,
      updatedAt: report.updatedAt as Date,
    };
  }

  private toReportExport(exportRecord: Record<string, unknown>): ReportExport {
    return {
      id: exportRecord.id as string,
      reportId: exportRecord.reportId as string,
      format: exportRecord.format as string,
      filters: exportRecord.filters as Record<string, unknown> | null,
      dateRange: exportRecord.dateRange as Record<string, unknown> | null,
      fileName: exportRecord.fileName as string,
      fileUrl: exportRecord.fileUrl as string | null,
      fileSize: exportRecord.fileSize as number | null,
      status: exportRecord.status as string,
      error: exportRecord.error as string | null,
      exportedBy: exportRecord.exportedBy as string,
      exportedAt: exportRecord.exportedAt as Date,
      completedAt: exportRecord.completedAt as Date | null,
    };
  }
}

export default ReportService;
