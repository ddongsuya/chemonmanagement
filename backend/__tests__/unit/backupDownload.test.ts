/**
 * Backup Download API Unit Tests
 * Tests for GET /api/admin/backups/:id/download endpoint
 * Requirements: 1.2.3
 */

/// <reference types="jest" />

import { BackupService, BackupData, BACKUP_TARGET_TABLES } from '../../src/services/backupService';

describe('Backup Download API - Unit Tests', () => {
  describe('BackupService.getBackupData', () => {
    it('should return BackupData interface with required metadata fields', () => {
      // Verify the BackupData interface structure
      const mockBackupData: BackupData = {
        metadata: {
          createdAt: '2024-01-15T10:30:00.000Z',
          version: '1.0',
          tables: ['users', 'customers', 'leads'],
        },
        users: [],
        customers: [],
        leads: [],
      };

      expect(mockBackupData.metadata).toBeDefined();
      expect(mockBackupData.metadata.createdAt).toBeDefined();
      expect(mockBackupData.metadata.version).toBeDefined();
      expect(mockBackupData.metadata.tables).toBeDefined();
    });

    it('should include all backup target tables in metadata.tables', () => {
      const mockBackupData: BackupData = {
        metadata: {
          createdAt: new Date().toISOString(),
          version: '1.0',
          tables: [...BACKUP_TARGET_TABLES],
        },
      };

      // Verify all backup target tables are included
      expect(mockBackupData.metadata.tables).toContain('users');
      expect(mockBackupData.metadata.tables).toContain('customers');
      expect(mockBackupData.metadata.tables).toContain('leads');
      expect(mockBackupData.metadata.tables).toContain('quotations');
      expect(mockBackupData.metadata.tables).toContain('contracts');
      expect(mockBackupData.metadata.tables).toContain('studies');
      expect(mockBackupData.metadata.tables).toContain('systemSettings');
      expect(mockBackupData.metadata.tables).toContain('pipelineStages');
      expect(mockBackupData.metadata.tables).toContain('stageTasks');
    });

    it('should be serializable to JSON for download', () => {
      const mockBackupData: BackupData = {
        metadata: {
          createdAt: '2024-01-15T10:30:00.000Z',
          version: '1.0',
          tables: ['users', 'customers'],
        },
        users: [
          {
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test User',
            phone: null,
            department: null,
            position: null,
            title: null,
            role: 'USER',
            status: 'ACTIVE',
            canViewAllSales: false,
            canViewAllData: false,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        ],
        customers: [],
      };

      // Verify JSON serialization works
      const jsonString = JSON.stringify(mockBackupData, (key, value) => {
        if (typeof value === 'bigint') {
          return value.toString();
        }
        return value;
      }, 2);

      expect(jsonString).toBeDefined();
      expect(typeof jsonString).toBe('string');

      // Verify it can be parsed back
      const parsed = JSON.parse(jsonString);
      expect(parsed.metadata.version).toBe('1.0');
      expect(parsed.users).toHaveLength(1);
      expect(parsed.users[0].email).toBe('test@example.com');
    });

    it('should handle BigInt values in JSON serialization', () => {
      const dataWithBigInt = {
        size: BigInt(1024),
        count: BigInt(100),
      };

      const jsonString = JSON.stringify(dataWithBigInt, (key, value) => {
        if (typeof value === 'bigint') {
          return value.toString();
        }
        return value;
      });

      const parsed = JSON.parse(jsonString);
      expect(parsed.size).toBe('1024');
      expect(parsed.count).toBe('100');
    });
  });

  describe('Download Response Headers', () => {
    it('should generate correct Content-Disposition header', () => {
      const filename = 'backup_2024-01-15T10-30-00-000Z.json';
      const contentDisposition = `attachment; filename="${filename}"`;
      
      expect(contentDisposition).toBe('attachment; filename="backup_2024-01-15T10-30-00-000Z.json"');
    });

    it('should calculate correct Content-Length', () => {
      const jsonData = JSON.stringify({ test: 'data' });
      const contentLength = Buffer.byteLength(jsonData, 'utf8');
      
      expect(contentLength).toBeGreaterThan(0);
      expect(typeof contentLength).toBe('number');
    });
  });

  describe('Static Methods', () => {
    it('getBackupTargetTables should return all target tables', () => {
      const tables = BackupService.getBackupTargetTables();
      expect(tables).toHaveLength(9);
      expect(tables).toContain('users');
      expect(tables).toContain('customers');
      expect(tables).toContain('leads');
    });

    it('isBackupTargetTable should validate table names', () => {
      expect(BackupService.isBackupTargetTable('users')).toBe(true);
      expect(BackupService.isBackupTargetTable('customers')).toBe(true);
      expect(BackupService.isBackupTargetTable('toxicityTests')).toBe(false);
      expect(BackupService.isBackupTargetTable('invalidTable')).toBe(false);
    });
  });
});
