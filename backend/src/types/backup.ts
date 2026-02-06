import { z } from 'zod';

// Backup status enum
export type BackupStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
export type BackupType = 'AUTO' | 'MANUAL';

// Backup interface
export interface Backup {
  id: string;
  filename: string;
  size: bigint;
  status: BackupStatus;
  type: BackupType;
  tables?: string[];
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Create backup request schema
export const createBackupSchema = z.object({
  tables: z.array(z.string()).optional(),
  description: z.string().optional(),
});

export type CreateBackupDTO = z.infer<typeof createBackupSchema>;

// Backup list filters schema
export const backupFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.enum(['AUTO', 'MANUAL']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']).optional(),
});

export type BackupFilters = z.infer<typeof backupFiltersSchema>;

// Backup response
export interface BackupResponse {
  id: string;
  filename: string;
  size: string; // BigInt converted to string for JSON
  status: BackupStatus;
  type: BackupType;
  tables?: string[];
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Paginated backup result
export interface PaginatedBackupResult {
  data: BackupResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Restore options interface (Requirements 1.3.3)
export interface RestoreOptions {
  tables?: string[];  // 선택적 복구
  dryRun?: boolean;   // 미리보기 모드
}

// Restore result interface (Requirements 1.3.4)
export interface RestoreResult {
  success: boolean;
  restoredTables: string[];
  recordCounts: Record<string, number>;
  errors?: string[];
  dryRun?: boolean;
}

// Restore request schema
export const restoreBackupSchema = z.object({
  tables: z.array(z.string()).optional(),
  dryRun: z.boolean().optional().default(false),
});
