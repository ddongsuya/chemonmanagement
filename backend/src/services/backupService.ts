import { PrismaClient } from '@prisma/client';
import { AppError, ErrorCodes } from '../types/error';
import {
  BackupFilters,
  CreateBackupDTO,
  PaginatedBackupResult,
  BackupResponse,
  BackupStatus,
  BackupType,
} from '../types/backup';

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
   * Collect data from database tables for backup
   */
  private async collectBackupData(tables?: string[]): Promise<Record<string, unknown>> {
    const backupData: Record<string, unknown> = {
      metadata: {
        createdAt: new Date().toISOString(),
        version: '1.0',
      },
    };

    // Default tables to backup
    const defaultTables = [
      'users',
      'customers',
      'quotations',
      'announcements',
      'notifications',
      'systemSettings',
    ];

    const tablesToBackup = tables && tables.length > 0 ? tables : defaultTables;

    for (const table of tablesToBackup) {
      try {
        switch (table) {
          case 'users':
            backupData.users = await this.prisma.user.findMany({
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
                department: true,
                createdAt: true,
                updatedAt: true,
              },
            });
            break;
          case 'customers':
            backupData.customers = await this.prisma.customer.findMany({
              where: { deletedAt: null },
            });
            break;
          case 'quotations':
            backupData.quotations = await this.prisma.quotation.findMany({
              where: { deletedAt: null },
            });
            break;
          case 'announcements':
            backupData.announcements = await this.prisma.announcement.findMany({
              where: { deletedAt: null },
            });
            break;
          case 'notifications':
            backupData.notifications = await this.prisma.notification.findMany();
            break;
          case 'systemSettings':
            backupData.systemSettings = await this.prisma.systemSetting.findMany();
            break;
        }
      } catch {
        // Skip tables that don't exist or have errors
        console.warn(`Warning: Could not backup table ${table}`);
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
