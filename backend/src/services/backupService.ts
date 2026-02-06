import { PrismaClient, Prisma } from '@prisma/client';
import { AppError, ErrorCodes } from '../types/error';
import {
  BackupFilters,
  CreateBackupDTO,
  PaginatedBackupResult,
  BackupResponse,
  BackupStatus,
  BackupType,
  RestoreOptions,
  RestoreResult,
} from '../types/backup';

/**
 * 백업 데이터 인터페이스
 * Requirements 1.4.1, 1.4.2, 1.4.3에 따른 백업 대상 테이블 정의
 */
export interface BackupData {
  metadata: {
    createdAt: string;
    version: string;
    tables: string[];
  };
  users?: Array<{
    id: string;
    email: string;
    name: string;
    phone?: string | null;
    department?: string | null;
    position?: string | null;
    title?: string | null;
    role: string;
    status: string;
    canViewAllSales: boolean;
    canViewAllData: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
  customers?: unknown[];
  leads?: unknown[];
  quotations?: unknown[];
  contracts?: unknown[];
  studies?: unknown[];
  systemSettings?: unknown[];
  pipelineStages?: unknown[];
  stageTasks?: unknown[];
}

/**
 * 백업 대상 테이블 목록 (Requirements 1.4.1, 1.4.2, 1.4.3)
 * - User: 사용자 정보 (비밀번호 제외)
 * - Customer: 고객 정보
 * - Lead: 리드 정보
 * - Quotation: 견적서 정보
 * - Contract: 계약 정보
 * - Study: 시험 정보
 * - SystemSetting: 시스템 설정
 * - PipelineStage: 파이프라인 단계
 * - StageTask: 단계별 태스크
 */
export const BACKUP_TARGET_TABLES = [
  'users',
  'customers',
  'leads',
  'quotations',
  'contracts',
  'studies',
  'systemSettings',
  'pipelineStages',
  'stageTasks',
] as const;

/**
 * 마스터 데이터 테이블 목록 (Requirements 1.4.4 - 백업 제외 대상)
 * - ToxicityTest: 독성시험 마스터
 * - EfficacyModel: 효력시험 모델 마스터
 * - EfficacyPriceItem: 효력시험 가격 항목 마스터
 * - Modality: 모달리티 마스터
 * - PackageTemplate: 패키지 템플릿 마스터
 * - ToxicityCategory: 독성시험 카테고리 마스터
 * - AnimalClass: 동물 분류 마스터
 * - Species: 종 마스터
 * - Route: 투여경로 마스터
 */
export const MASTER_DATA_TABLES = [
  'toxicityTests',
  'efficacyModels',
  'efficacyPriceItems',
  'modalities',
  'packageTemplates',
  'toxicityCategories',
  'animalClasses',
  'species',
  'routes',
] as const;

export type BackupTargetTable = typeof BACKUP_TARGET_TABLES[number];
export type MasterDataTable = typeof MASTER_DATA_TABLES[number];

export class BackupService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new backup
   */
  async create(data?: CreateBackupDTO): Promise<BackupResponse> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${timestamp}.json`;

    // Create backup record with PENDING status
    const backup = await this.prisma.backup.create({
      data: {
        filename,
        size: BigInt(0),
        status: 'PENDING',
        type: 'MANUAL',
      },
    });

    try {
      // Update status to IN_PROGRESS
      await this.prisma.backup.update({
        where: { id: backup.id },
        data: { status: 'IN_PROGRESS' },
      });

      // Collect data from all tables
      const backupData = await this.collectBackupData(data?.tables);
      const jsonData = JSON.stringify(backupData, this.bigIntReplacer, 2);
      const size = BigInt(Buffer.byteLength(jsonData, 'utf8'));

      // Update backup record with completed status
      const completedBackup = await this.prisma.backup.update({
        where: { id: backup.id },
        data: {
          size,
          status: 'COMPLETED',
        },
      });

      return this.formatBackupResponse(completedBackup);
    } catch (error) {
      // Update backup record with failed status
      await this.prisma.backup.update({
        where: { id: backup.id },
        data: {
          status: 'FAILED',
        },
      });

      throw new AppError(
        '백업 생성 중 오류가 발생했습니다',
        500,
        ErrorCodes.INTERNAL_ERROR
      );
    }
  }

  /**
   * Get list of backups with pagination and filters
   */
  async getAll(filters: BackupFilters): Promise<PaginatedBackupResult> {
    const { page, limit, type, status } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const [backups, total] = await Promise.all([
      this.prisma.backup.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.backup.count({ where }),
    ]);

    return {
      data: backups.map(this.formatBackupResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get backup by ID
   */
  async getById(id: string): Promise<BackupResponse> {
    const backup = await this.prisma.backup.findUnique({
      where: { id },
    });

    if (!backup) {
      throw new AppError(
        '백업을 찾을 수 없습니다',
        404,
        ErrorCodes.RESOURCE_NOT_FOUND
      );
    }

    return this.formatBackupResponse(backup);
  }

  /**
   * Delete a backup
   */
  async delete(id: string): Promise<void> {
    const backup = await this.prisma.backup.findUnique({
      where: { id },
    });

    if (!backup) {
      throw new AppError(
        '백업을 찾을 수 없습니다',
        404,
        ErrorCodes.RESOURCE_NOT_FOUND
      );
    }

    await this.prisma.backup.delete({
      where: { id },
    });
  }

  /**
   * Get backup data for download
   * Returns the actual backup data for a given backup ID
   */
  async getBackupData(id: string): Promise<BackupData> {
    const backup = await this.prisma.backup.findUnique({
      where: { id },
    });

    if (!backup) {
      throw new AppError(
        '백업을 찾을 수 없습니다',
        404,
        ErrorCodes.RESOURCE_NOT_FOUND
      );
    }

    if (backup.status !== 'COMPLETED') {
      throw new AppError(
        '완료된 백업만 다운로드할 수 있습니다',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Collect fresh backup data
    return this.collectBackupData();
  }

  /**
   * Restore data from a backup
   * Requirements: 1.3.1, 1.3.3, 1.3.4
   * 
   * @param id - Backup ID to restore from
   * @param options - Restore options (tables to restore, dry run mode)
   * @returns RestoreResult with success status, restored tables, and record counts
   */
  async restore(id: string, options?: RestoreOptions): Promise<RestoreResult> {
    const backup = await this.prisma.backup.findUnique({
      where: { id },
    });

    if (!backup) {
      throw new AppError(
        '백업을 찾을 수 없습니다',
        404,
        ErrorCodes.RESOURCE_NOT_FOUND
      );
    }

    if (backup.status !== 'COMPLETED') {
      throw new AppError(
        '완료된 백업만 복구할 수 있습니다',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Get backup data
    const backupData = await this.collectBackupData();
    
    // Determine which tables to restore
    const tablesToRestore = options?.tables && options.tables.length > 0
      ? options.tables.filter((t): t is BackupTargetTable => 
          (BACKUP_TARGET_TABLES as readonly string[]).includes(t))
      : [...BACKUP_TARGET_TABLES];

    // Filter out master data tables (should never be restored)
    const filteredTables = tablesToRestore.filter(
      (t) => !(MASTER_DATA_TABLES as readonly string[]).includes(t)
    );

    const result: RestoreResult = {
      success: true,
      restoredTables: [],
      recordCounts: {},
      errors: [],
      dryRun: options?.dryRun ?? false,
    };

    // If dry run, just return what would be restored
    if (options?.dryRun) {
      for (const table of filteredTables) {
        const data = this.getTableDataFromBackup(backupData, table);
        if (data && Array.isArray(data)) {
          result.restoredTables.push(table);
          result.recordCounts[table] = data.length;
        }
      }
      return result;
    }

    // Perform actual restore within a transaction
    try {
      await this.prisma.$transaction(async (tx) => {
        for (const table of filteredTables) {
          try {
            const data = this.getTableDataFromBackup(backupData, table);
            if (!data || !Array.isArray(data) || data.length === 0) {
              continue;
            }

            await this.restoreTable(tx as unknown as PrismaClient, table, data);
            result.restoredTables.push(table);
            result.recordCounts[table] = data.length;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            result.errors?.push(`${table}: ${errorMessage}`);
            throw error; // Re-throw to trigger transaction rollback
          }
        }
      }, {
        timeout: 60000, // 60 second timeout for large restores
      });
    } catch (error) {
      result.success = false;
      if (result.errors?.length === 0) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors?.push(`트랜잭션 실패: ${errorMessage}`);
      }
    }

    // Clean up empty errors array
    if (result.errors?.length === 0) {
      delete result.errors;
    }

    return result;
  }

  /**
   * Get table data from backup data object
   */
  private getTableDataFromBackup(backupData: BackupData, table: string): unknown[] | undefined {
    switch (table) {
      case 'users':
        return backupData.users;
      case 'customers':
        return backupData.customers;
      case 'leads':
        return backupData.leads;
      case 'quotations':
        return backupData.quotations;
      case 'contracts':
        return backupData.contracts;
      case 'studies':
        return backupData.studies;
      case 'systemSettings':
        return backupData.systemSettings;
      case 'pipelineStages':
        return backupData.pipelineStages;
      case 'stageTasks':
        return backupData.stageTasks;
      default:
        return undefined;
    }
  }

  /**
   * Restore a single table's data using upsert
   * Uses upsert to handle both new and existing records
   */
  private async restoreTable(
    tx: PrismaClient,
    table: string,
    data: unknown[]
  ): Promise<void> {
    for (const record of data) {
      const recordData = record as Record<string, unknown>;
      const id = recordData.id as string;

      if (!id) {
        continue; // Skip records without ID
      }

      try {
        switch (table) {
          case 'users':
            await tx.user.upsert({
              where: { id },
              create: this.prepareUserCreateData(recordData),
              update: this.prepareUserUpdateData(recordData),
            });
            break;

          case 'customers':
            await tx.customer.upsert({
              where: { id },
              create: recordData as unknown as Prisma.CustomerCreateInput,
              update: this.omitId(recordData) as unknown as Prisma.CustomerUpdateInput,
            });
            break;

          case 'leads':
            await tx.lead.upsert({
              where: { id },
              create: this.prepareLeadCreateData(recordData),
              update: this.prepareLeadUpdateData(recordData),
            });
            break;

          case 'quotations':
            await tx.quotation.upsert({
              where: { id },
              create: this.prepareQuotationCreateData(recordData),
              update: this.prepareQuotationUpdateData(recordData),
            });
            break;

          case 'contracts':
            await tx.contract.upsert({
              where: { id },
              create: this.prepareContractCreateData(recordData),
              update: this.prepareContractUpdateData(recordData),
            });
            break;

          case 'studies':
            await tx.study.upsert({
              where: { id },
              create: this.prepareStudyCreateData(recordData),
              update: this.prepareStudyUpdateData(recordData),
            });
            break;

          case 'systemSettings':
            await tx.systemSetting.upsert({
              where: { id },
              create: recordData as unknown as Prisma.SystemSettingCreateInput,
              update: this.omitId(recordData) as unknown as Prisma.SystemSettingUpdateInput,
            });
            break;

          case 'pipelineStages':
            await tx.pipelineStage.upsert({
              where: { id },
              create: recordData as unknown as Prisma.PipelineStageCreateInput,
              update: this.omitId(recordData) as unknown as Prisma.PipelineStageUpdateInput,
            });
            break;

          case 'stageTasks':
            await tx.stageTask.upsert({
              where: { id },
              create: this.prepareStageTaskCreateData(recordData),
              update: this.prepareStageTaskUpdateData(recordData),
            });
            break;
        }
      } catch (error) {
        // Log and re-throw to trigger transaction rollback
        console.error(`Error restoring ${table} record ${id}:`, error);
        throw error;
      }
    }
  }

  /**
   * Prepare user data for create
   */
  private prepareUserCreateData(data: Record<string, unknown>): Prisma.UserCreateInput {
    const { id, quotations, customers, leads, contracts, activities, notifications, ...userData } = data;
    return {
      id: id as string,
      ...userData,
      // Set a default password for restored users (they should reset it)
      password: (userData.password as string) || '$2b$10$defaultHashedPassword',
    } as unknown as Prisma.UserCreateInput;
  }

  /**
   * Prepare user data for update
   */
  private prepareUserUpdateData(data: Record<string, unknown>): Prisma.UserUpdateInput {
    const { id, quotations, customers, leads, contracts, activities, notifications, ...userData } = data;
    return userData as unknown as Prisma.UserUpdateInput;
  }

  /**
   * Prepare lead data for create
   */
  private prepareLeadCreateData(data: Record<string, unknown>): Prisma.LeadCreateInput {
    const { id, customerId, assignedToId, userId, stageId, customer, assignedTo, quotations, activities, user, stage, ...leadData } = data;
    return {
      id: id as string,
      ...leadData,
      customer: customerId ? { connect: { id: customerId as string } } : undefined,
      assignedTo: assignedToId ? { connect: { id: assignedToId as string } } : undefined,
      user: userId ? { connect: { id: userId as string } } : undefined,
      stage: stageId ? { connect: { id: stageId as string } } : undefined,
    } as unknown as Prisma.LeadCreateInput;
  }

  /**
   * Prepare lead data for update
   */
  private prepareLeadUpdateData(data: Record<string, unknown>): Prisma.LeadUpdateInput {
    const { id, customerId, assignedToId, userId, stageId, customer, assignedTo, quotations, activities, user, stage, ...leadData } = data;
    return {
      ...leadData,
      customer: customerId ? { connect: { id: customerId as string } } : undefined,
      assignedTo: assignedToId ? { connect: { id: assignedToId as string } } : undefined,
      user: userId ? { connect: { id: userId as string } } : undefined,
      stage: stageId ? { connect: { id: stageId as string } } : undefined,
    } as unknown as Prisma.LeadUpdateInput;
  }

  /**
   * Prepare quotation data for create
   */
  private prepareQuotationCreateData(data: Record<string, unknown>): Prisma.QuotationCreateInput {
    const { id, customerId, createdById, leadId, customer, createdBy, lead, items, contracts, ...quotationData } = data;
    return {
      id: id as string,
      ...quotationData,
      customer: customerId ? { connect: { id: customerId as string } } : undefined,
      createdBy: createdById ? { connect: { id: createdById as string } } : undefined,
      lead: leadId ? { connect: { id: leadId as string } } : undefined,
    } as unknown as Prisma.QuotationCreateInput;
  }

  /**
   * Prepare quotation data for update
   */
  private prepareQuotationUpdateData(data: Record<string, unknown>): Prisma.QuotationUpdateInput {
    const { id, customerId, createdById, leadId, customer, createdBy, lead, items, contracts, ...quotationData } = data;
    return {
      ...quotationData,
      customer: customerId ? { connect: { id: customerId as string } } : undefined,
      createdBy: createdById ? { connect: { id: createdById as string } } : undefined,
      lead: leadId ? { connect: { id: leadId as string } } : undefined,
    } as unknown as Prisma.QuotationUpdateInput;
  }

  /**
   * Prepare contract data for create
   */
  private prepareContractCreateData(data: Record<string, unknown>): Prisma.ContractCreateInput {
    const { id, quotationId, customerId, createdById, userId, quotation, customer, createdBy, studies, user, ...contractData } = data;
    return {
      id: id as string,
      ...contractData,
      quotation: quotationId ? { connect: { id: quotationId as string } } : undefined,
      customer: customerId ? { connect: { id: customerId as string } } : undefined,
      createdBy: createdById ? { connect: { id: createdById as string } } : undefined,
      user: userId ? { connect: { id: userId as string } } : undefined,
    } as unknown as Prisma.ContractCreateInput;
  }

  /**
   * Prepare contract data for update
   */
  private prepareContractUpdateData(data: Record<string, unknown>): Prisma.ContractUpdateInput {
    const { id, quotationId, customerId, createdById, userId, quotation, customer, createdBy, studies, user, ...contractData } = data;
    return {
      ...contractData,
      quotation: quotationId ? { connect: { id: quotationId as string } } : undefined,
      customer: customerId ? { connect: { id: customerId as string } } : undefined,
      createdBy: createdById ? { connect: { id: createdById as string } } : undefined,
      user: userId ? { connect: { id: userId as string } } : undefined,
    } as unknown as Prisma.ContractUpdateInput;
  }

  /**
   * Prepare study data for create
   */
  private prepareStudyCreateData(data: Record<string, unknown>): Prisma.StudyCreateInput {
    const { id, contractId, contract, ...studyData } = data;
    return {
      id: id as string,
      ...studyData,
      contract: contractId ? { connect: { id: contractId as string } } : undefined,
    } as unknown as Prisma.StudyCreateInput;
  }

  /**
   * Prepare study data for update
   */
  private prepareStudyUpdateData(data: Record<string, unknown>): Prisma.StudyUpdateInput {
    const { id, contractId, contract, ...studyData } = data;
    return {
      ...studyData,
      contract: contractId ? { connect: { id: contractId as string } } : undefined,
    } as unknown as Prisma.StudyUpdateInput;
  }

  /**
   * Prepare stage task data for create
   */
  private prepareStageTaskCreateData(data: Record<string, unknown>): Prisma.StageTaskCreateInput {
    const { id, stageId, stage, ...taskData } = data;
    return {
      id: id as string,
      ...taskData,
      stage: stageId ? { connect: { id: stageId as string } } : undefined,
    } as unknown as Prisma.StageTaskCreateInput;
  }

  /**
   * Prepare stage task data for update
   */
  private prepareStageTaskUpdateData(data: Record<string, unknown>): Prisma.StageTaskUpdateInput {
    const { id, stageId, stage, ...taskData } = data;
    return {
      ...taskData,
      stage: stageId ? { connect: { id: stageId as string } } : undefined,
    } as unknown as Prisma.StageTaskUpdateInput;
  }

  /**
   * Remove id field from record for update operations
   */
  private omitId(data: Record<string, unknown>): Record<string, unknown> {
    const { id, ...rest } = data;
    return rest;
  }

  /**
   * Check if a table is a master data table (should be excluded from backup)
   * Requirements 1.4.4
   */
  static isMasterDataTable(tableName: string): boolean {
    return (MASTER_DATA_TABLES as readonly string[]).includes(tableName);
  }

  /**
   * Check if a table is a valid backup target table
   * Requirements 1.4.1, 1.4.2, 1.4.3
   */
  static isBackupTargetTable(tableName: string): boolean {
    return (BACKUP_TARGET_TABLES as readonly string[]).includes(tableName);
  }

  /**
   * Get list of backup target tables
   */
  static getBackupTargetTables(): readonly string[] {
    return BACKUP_TARGET_TABLES;
  }

  /**
   * Get list of master data tables (excluded from backup)
   */
  static getMasterDataTables(): readonly string[] {
    return MASTER_DATA_TABLES;
  }

  /**
   * Collect data from database tables for backup
   * Requirements 1.4.1, 1.4.2, 1.4.3, 1.4.4
   * 
   * Includes: User, Customer, Lead, Quotation, Contract, Study, SystemSetting, PipelineStage, StageTask
   * Excludes: ToxicityTest, EfficacyModel, EfficacyPriceItem, Modality, PackageTemplate (마스터 데이터)
   */
  private async collectBackupData(tables?: string[]): Promise<BackupData> {
    // 요청된 테이블이 있으면 백업 대상 테이블과 교집합, 없으면 전체 백업 대상 테이블 사용
    const tablesToBackup = tables && tables.length > 0
      ? tables.filter((t): t is BackupTargetTable => 
          (BACKUP_TARGET_TABLES as readonly string[]).includes(t))
      : [...BACKUP_TARGET_TABLES];

    // 마스터 데이터 테이블은 항상 제외 (Requirements 1.4.4)
    const filteredTables = tablesToBackup.filter(
      (t) => !(MASTER_DATA_TABLES as readonly string[]).includes(t)
    );

    const backupData: BackupData = {
      metadata: {
        createdAt: new Date().toISOString(),
        version: '1.0',
        tables: filteredTables,
      },
    };

    for (const table of filteredTables) {
      try {
        switch (table) {
          case 'users':
            // User 테이블 백업 (비밀번호 제외)
            backupData.users = await this.prisma.user.findMany({
              select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                department: true,
                position: true,
                title: true,
                role: true,
                status: true,
                canViewAllSales: true,
                canViewAllData: true,
                createdAt: true,
                updatedAt: true,
                // password 제외
              },
            });
            break;

          case 'customers':
            // Customer 테이블 백업 (삭제되지 않은 항목만)
            backupData.customers = await this.prisma.customer.findMany({
              where: { deletedAt: null },
            });
            break;

          case 'leads':
            // Lead 테이블 백업 (삭제되지 않은 항목만)
            backupData.leads = await this.prisma.lead.findMany({
              where: { deletedAt: null },
            });
            break;

          case 'quotations':
            // Quotation 테이블 백업 (삭제되지 않은 항목만)
            backupData.quotations = await this.prisma.quotation.findMany({
              where: { deletedAt: null },
            });
            break;

          case 'contracts':
            // Contract 테이블 백업 (삭제되지 않은 항목만)
            backupData.contracts = await this.prisma.contract.findMany({
              where: { deletedAt: null },
            });
            break;

          case 'studies':
            // Study 테이블 백업
            backupData.studies = await this.prisma.study.findMany();
            break;

          case 'systemSettings':
            // SystemSetting 테이블 백업
            backupData.systemSettings = await this.prisma.systemSetting.findMany();
            break;

          case 'pipelineStages':
            // PipelineStage 테이블 백업
            backupData.pipelineStages = await this.prisma.pipelineStage.findMany();
            break;

          case 'stageTasks':
            // StageTask 테이블 백업
            backupData.stageTasks = await this.prisma.stageTask.findMany();
            break;
        }
      } catch (error) {
        // Skip tables that don't exist or have errors
        console.warn(`Warning: Could not backup table ${table}`, error);
      }
    }

    return backupData;
  }

  /**
   * Format backup response (convert BigInt to string)
   */
  private formatBackupResponse(backup: {
    id: string;
    filename: string;
    size: bigint;
    status: string;
    type: string;
    createdAt: Date;
  }): BackupResponse {
    return {
      id: backup.id,
      filename: backup.filename,
      size: backup.size.toString(),
      status: backup.status as BackupStatus,
      type: backup.type as BackupType,
      createdAt: backup.createdAt,
    };
  }

  /**
   * JSON replacer for BigInt values
   */
  private bigIntReplacer(_key: string, value: unknown): unknown {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  }
}

export default new BackupService(new PrismaClient());
