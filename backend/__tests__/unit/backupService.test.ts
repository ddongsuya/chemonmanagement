/**
 * BackupService Unit Tests
 * Tests for backup data scope definition (Requirements 1.4.1, 1.4.2, 1.4.3, 1.4.4)
 */

/// <reference types="jest" />

import {
  BackupService,
  BACKUP_TARGET_TABLES,
  MASTER_DATA_TABLES,
} from '../../src/services/backupService';

describe('BackupService', () => {
  describe('Backup Target Tables (Requirements 1.4.1, 1.4.2, 1.4.3)', () => {
    it('should include User table in backup targets', () => {
      expect(BACKUP_TARGET_TABLES).toContain('users');
    });

    it('should include Customer table in backup targets', () => {
      expect(BACKUP_TARGET_TABLES).toContain('customers');
    });

    it('should include Lead table in backup targets', () => {
      expect(BACKUP_TARGET_TABLES).toContain('leads');
    });

    it('should include Quotation table in backup targets', () => {
      expect(BACKUP_TARGET_TABLES).toContain('quotations');
    });

    it('should include Contract table in backup targets', () => {
      expect(BACKUP_TARGET_TABLES).toContain('contracts');
    });

    it('should include Study table in backup targets', () => {
      expect(BACKUP_TARGET_TABLES).toContain('studies');
    });

    it('should include SystemSetting table in backup targets (Requirement 1.4.2)', () => {
      expect(BACKUP_TARGET_TABLES).toContain('systemSettings');
    });

    it('should include PipelineStage table in backup targets (Requirement 1.4.3)', () => {
      expect(BACKUP_TARGET_TABLES).toContain('pipelineStages');
    });

    it('should include StageTask table in backup targets (Requirement 1.4.3)', () => {
      expect(BACKUP_TARGET_TABLES).toContain('stageTasks');
    });

    it('should have exactly 9 backup target tables', () => {
      expect(BACKUP_TARGET_TABLES).toHaveLength(9);
    });
  });

  describe('Master Data Tables Exclusion (Requirement 1.4.4)', () => {
    it('should include ToxicityTest in master data tables', () => {
      expect(MASTER_DATA_TABLES).toContain('toxicityTests');
    });

    it('should include EfficacyModel in master data tables', () => {
      expect(MASTER_DATA_TABLES).toContain('efficacyModels');
    });

    it('should include EfficacyPriceItem in master data tables', () => {
      expect(MASTER_DATA_TABLES).toContain('efficacyPriceItems');
    });

    it('should include Modality in master data tables', () => {
      expect(MASTER_DATA_TABLES).toContain('modalities');
    });

    it('should include PackageTemplate in master data tables', () => {
      expect(MASTER_DATA_TABLES).toContain('packageTemplates');
    });

    it('should include ToxicityCategory in master data tables', () => {
      expect(MASTER_DATA_TABLES).toContain('toxicityCategories');
    });

    it('should include AnimalClass in master data tables', () => {
      expect(MASTER_DATA_TABLES).toContain('animalClasses');
    });

    it('should include Species in master data tables', () => {
      expect(MASTER_DATA_TABLES).toContain('species');
    });

    it('should include Route in master data tables', () => {
      expect(MASTER_DATA_TABLES).toContain('routes');
    });
  });

  describe('Static Helper Methods', () => {
    describe('isMasterDataTable', () => {
      it('should return true for master data tables', () => {
        expect(BackupService.isMasterDataTable('toxicityTests')).toBe(true);
        expect(BackupService.isMasterDataTable('efficacyModels')).toBe(true);
        expect(BackupService.isMasterDataTable('efficacyPriceItems')).toBe(true);
        expect(BackupService.isMasterDataTable('modalities')).toBe(true);
        expect(BackupService.isMasterDataTable('packageTemplates')).toBe(true);
      });

      it('should return false for backup target tables', () => {
        expect(BackupService.isMasterDataTable('users')).toBe(false);
        expect(BackupService.isMasterDataTable('customers')).toBe(false);
        expect(BackupService.isMasterDataTable('leads')).toBe(false);
        expect(BackupService.isMasterDataTable('quotations')).toBe(false);
        expect(BackupService.isMasterDataTable('contracts')).toBe(false);
      });

      it('should return false for unknown tables', () => {
        expect(BackupService.isMasterDataTable('unknownTable')).toBe(false);
      });
    });

    describe('isBackupTargetTable', () => {
      it('should return true for backup target tables', () => {
        expect(BackupService.isBackupTargetTable('users')).toBe(true);
        expect(BackupService.isBackupTargetTable('customers')).toBe(true);
        expect(BackupService.isBackupTargetTable('leads')).toBe(true);
        expect(BackupService.isBackupTargetTable('quotations')).toBe(true);
        expect(BackupService.isBackupTargetTable('contracts')).toBe(true);
        expect(BackupService.isBackupTargetTable('studies')).toBe(true);
        expect(BackupService.isBackupTargetTable('systemSettings')).toBe(true);
        expect(BackupService.isBackupTargetTable('pipelineStages')).toBe(true);
        expect(BackupService.isBackupTargetTable('stageTasks')).toBe(true);
      });

      it('should return false for master data tables', () => {
        expect(BackupService.isBackupTargetTable('toxicityTests')).toBe(false);
        expect(BackupService.isBackupTargetTable('efficacyModels')).toBe(false);
      });

      it('should return false for unknown tables', () => {
        expect(BackupService.isBackupTargetTable('unknownTable')).toBe(false);
      });
    });

    describe('getBackupTargetTables', () => {
      it('should return all backup target tables', () => {
        const tables = BackupService.getBackupTargetTables();
        expect(tables).toEqual(BACKUP_TARGET_TABLES);
      });
    });

    describe('getMasterDataTables', () => {
      it('should return all master data tables', () => {
        const tables = BackupService.getMasterDataTables();
        expect(tables).toEqual(MASTER_DATA_TABLES);
      });
    });
  });

  describe('Table Separation', () => {
    it('should have no overlap between backup targets and master data', () => {
      const backupSet = new Set<string>(BACKUP_TARGET_TABLES);
      const masterSet = new Set<string>(MASTER_DATA_TABLES);
      
      for (const table of backupSet) {
        expect(masterSet.has(table)).toBe(false);
      }
      
      for (const table of masterSet) {
        expect(backupSet.has(table)).toBe(false);
      }
    });
  });
});
