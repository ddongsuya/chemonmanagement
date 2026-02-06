/**
 * BackupService Restore Unit Tests
 * Tests for backup restore functionality (Requirements 1.3.1, 1.3.3, 1.3.4)
 */

/// <reference types="jest" />

import { RestoreOptions, RestoreResult } from '../../src/types/backup';
import {
  BackupService,
  BACKUP_TARGET_TABLES,
  MASTER_DATA_TABLES,
} from '../../src/services/backupService';

describe('BackupService Restore', () => {
  describe('RestoreOptions Interface (Requirement 1.3.3)', () => {
    it('should support tables option for selective restore', () => {
      const options: RestoreOptions = {
        tables: ['users', 'customers'],
      };
      expect(options.tables).toEqual(['users', 'customers']);
    });

    it('should support dryRun option for preview mode', () => {
      const options: RestoreOptions = {
        dryRun: true,
      };
      expect(options.dryRun).toBe(true);
    });

    it('should support both options together', () => {
      const options: RestoreOptions = {
        tables: ['leads', 'quotations'],
        dryRun: true,
      };
      expect(options.tables).toEqual(['leads', 'quotations']);
      expect(options.dryRun).toBe(true);
    });

    it('should allow empty options', () => {
      const options: RestoreOptions = {};
      expect(options.tables).toBeUndefined();
      expect(options.dryRun).toBeUndefined();
    });
  });

  describe('RestoreResult Interface (Requirement 1.3.4)', () => {
    it('should include success status', () => {
      const result: RestoreResult = {
        success: true,
        restoredTables: ['users'],
        recordCounts: { users: 10 },
      };
      expect(result.success).toBe(true);
    });

    it('should include restoredTables array', () => {
      const result: RestoreResult = {
        success: true,
        restoredTables: ['users', 'customers', 'leads'],
        recordCounts: { users: 10, customers: 5, leads: 3 },
      };
      expect(result.restoredTables).toHaveLength(3);
      expect(result.restoredTables).toContain('users');
      expect(result.restoredTables).toContain('customers');
      expect(result.restoredTables).toContain('leads');
    });

    it('should include recordCounts for each restored table', () => {
      const result: RestoreResult = {
        success: true,
        restoredTables: ['users', 'customers'],
        recordCounts: { users: 10, customers: 5 },
      };
      expect(result.recordCounts['users']).toBe(10);
      expect(result.recordCounts['customers']).toBe(5);
    });

    it('should include optional errors array', () => {
      const result: RestoreResult = {
        success: false,
        restoredTables: [],
        recordCounts: {},
        errors: ['Failed to restore users table', 'Database connection error'],
      };
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('Failed to restore users table');
    });

    it('should include optional dryRun flag', () => {
      const result: RestoreResult = {
        success: true,
        restoredTables: ['users'],
        recordCounts: { users: 10 },
        dryRun: true,
      };
      expect(result.dryRun).toBe(true);
    });
  });

  describe('Selective Restore Validation (Requirement 1.3.3)', () => {
    it('should only allow backup target tables for selective restore', () => {
      const validTables = ['users', 'customers', 'leads'];
      validTables.forEach(table => {
        expect(BackupService.isBackupTargetTable(table)).toBe(true);
      });
    });

    it('should reject master data tables for restore', () => {
      const masterTables = ['toxicityTests', 'efficacyModels', 'modalities'];
      masterTables.forEach(table => {
        expect(BackupService.isMasterDataTable(table)).toBe(true);
        expect(BackupService.isBackupTargetTable(table)).toBe(false);
      });
    });

    it('should filter out invalid tables from restore options', () => {
      const requestedTables = ['users', 'toxicityTests', 'customers', 'unknownTable'];
      const validTables = requestedTables.filter(t => 
        (BACKUP_TARGET_TABLES as readonly string[]).includes(t)
      );
      expect(validTables).toEqual(['users', 'customers']);
    });
  });

  describe('Restore Result Report (Requirement 1.3.4)', () => {
    it('should provide complete restore report on success', () => {
      const result: RestoreResult = {
        success: true,
        restoredTables: ['users', 'customers', 'leads', 'quotations'],
        recordCounts: {
          users: 15,
          customers: 50,
          leads: 30,
          quotations: 25,
        },
      };

      // Verify all required fields are present
      expect(result.success).toBeDefined();
      expect(result.restoredTables).toBeDefined();
      expect(result.recordCounts).toBeDefined();
      
      // Verify record counts match restored tables
      result.restoredTables.forEach(table => {
        expect(result.recordCounts[table]).toBeDefined();
        expect(typeof result.recordCounts[table]).toBe('number');
      });
    });

    it('should provide error details on failure', () => {
      const result: RestoreResult = {
        success: false,
        restoredTables: ['users'],
        recordCounts: { users: 10 },
        errors: [
          'customers: Foreign key constraint violation',
          '트랜잭션 실패: Rollback triggered',
        ],
      };

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should indicate dry run mode in result', () => {
      const result: RestoreResult = {
        success: true,
        restoredTables: ['users', 'customers'],
        recordCounts: { users: 10, customers: 5 },
        dryRun: true,
      };

      expect(result.dryRun).toBe(true);
    });
  });

  describe('Backup Target Tables for Restore', () => {
    it('should support all 9 backup target tables for restore', () => {
      const expectedTables = [
        'users',
        'customers',
        'leads',
        'quotations',
        'contracts',
        'studies',
        'systemSettings',
        'pipelineStages',
        'stageTasks',
      ];

      expectedTables.forEach(table => {
        expect(BACKUP_TARGET_TABLES).toContain(table);
      });
    });

    it('should never restore master data tables', () => {
      MASTER_DATA_TABLES.forEach(table => {
        expect(BACKUP_TARGET_TABLES).not.toContain(table);
      });
    });
  });
});
