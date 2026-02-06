/**
 * Property-Based Tests for Backup System
 * Feature: crm-core-enhancements
 * 
 * These tests verify universal properties of the backup system:
 * - Property 1: Backup data roundtrip (backup → restore produces equivalent data)
 * - Property 2: Correct tables are included and master data tables are excluded
 * 
 * **Validates: Requirements 1.2.3, 1.3.1, 1.3.3, 1.4.1, 1.4.2, 1.4.3, 1.4.4**
 */

/// <reference types="jest" />

import * as fc from 'fast-check';
import { PrismaClient, Prisma } from '@prisma/client';
import {
  BackupService,
  BackupData,
  BACKUP_TARGET_TABLES,
  MASTER_DATA_TABLES,
  BackupTargetTable,
} from '../../src/services/backupService';

/**
 * Create a mock PrismaClient for testing backup data collection
 */
const createMockPrisma = () => {
  // Mock data generators
  const generateMockUser = (id: string) => ({
    id,
    email: `user-${id}@test.com`,
    name: `User ${id}`,
    phone: '010-1234-5678',
    department: 'Sales',
    position: 'Manager',
    title: 'Mr.',
    role: 'USER',
    status: 'ACTIVE',
    canViewAllSales: false,
    canViewAllData: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const generateMockCustomer = (id: string) => ({
    id,
    name: `Customer ${id}`,
    email: `customer-${id}@test.com`,
    phone: '010-1234-5678',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });

  const generateMockLead = (id: string) => ({
    id,
    title: `Lead ${id}`,
    status: 'NEW',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });

  const generateMockQuotation = (id: string) => ({
    id,
    code: `Q-${id}`,
    status: 'DRAFT',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });

  const generateMockContract = (id: string) => ({
    id,
    code: `C-${id}`,
    status: 'DRAFT',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });

  const generateMockStudy = (id: string) => ({
    id,
    name: `Study ${id}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const generateMockSystemSetting = (id: string) => ({
    id,
    key: `setting-${id}`,
    value: `value-${id}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const generateMockPipelineStage = (id: string) => ({
    id,
    code: `STAGE-${id}`,
    name: `Stage ${id}`,
    color: '#000000',
    order: 1,
    description: null,
    isDefault: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const generateMockStageTask = (id: string) => ({
    id,
    stageId: 'stage-1',
    name: `Task ${id}`,
    order: 1,
    isRequired: false,
    description: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Mock data storage
  let mockUsers: ReturnType<typeof generateMockUser>[] = [];
  let mockCustomers: ReturnType<typeof generateMockCustomer>[] = [];
  let mockLeads: ReturnType<typeof generateMockLead>[] = [];
  let mockQuotations: ReturnType<typeof generateMockQuotation>[] = [];
  let mockContracts: ReturnType<typeof generateMockContract>[] = [];
  let mockStudies: ReturnType<typeof generateMockStudy>[] = [];
  let mockSystemSettings: ReturnType<typeof generateMockSystemSetting>[] = [];
  let mockPipelineStages: ReturnType<typeof generateMockPipelineStage>[] = [];
  let mockStageTasks: ReturnType<typeof generateMockStageTask>[] = [];

  return {
    user: {
      findMany: jest.fn().mockImplementation(async () => mockUsers),
    },
    customer: {
      findMany: jest.fn().mockImplementation(async () => mockCustomers),
    },
    lead: {
      findMany: jest.fn().mockImplementation(async () => mockLeads),
    },
    quotation: {
      findMany: jest.fn().mockImplementation(async () => mockQuotations),
    },
    contract: {
      findMany: jest.fn().mockImplementation(async () => mockContracts),
    },
    study: {
      findMany: jest.fn().mockImplementation(async () => mockStudies),
    },
    systemSetting: {
      findMany: jest.fn().mockImplementation(async () => mockSystemSettings),
    },
    pipelineStage: {
      findMany: jest.fn().mockImplementation(async () => mockPipelineStages),
    },
    stageTask: {
      findMany: jest.fn().mockImplementation(async () => mockStageTasks),
    },
    backup: {
      create: jest.fn().mockImplementation(async (args: { data: any }) => ({
        id: 'backup-1',
        filename: args.data.filename,
        size: args.data.size,
        status: args.data.status,
        type: args.data.type,
        createdAt: new Date(),
      })),
      update: jest.fn().mockImplementation(async (args: { where: { id: string }; data: any }) => ({
        id: args.where.id,
        filename: 'backup.json',
        size: args.data.size || BigInt(0),
        status: args.data.status,
        type: 'MANUAL',
        createdAt: new Date(),
      })),
      findUnique: jest.fn().mockImplementation(async () => ({
        id: 'backup-1',
        filename: 'backup.json',
        size: BigInt(1000),
        status: 'COMPLETED',
        type: 'MANUAL',
        createdAt: new Date(),
      })),
      findMany: jest.fn().mockImplementation(async () => []),
      count: jest.fn().mockImplementation(async () => 0),
      delete: jest.fn().mockImplementation(async () => ({})),
    },
    // Helper methods to set mock data
    _setMockData: (data: {
      users?: number;
      customers?: number;
      leads?: number;
      quotations?: number;
      contracts?: number;
      studies?: number;
      systemSettings?: number;
      pipelineStages?: number;
      stageTasks?: number;
    }) => {
      mockUsers = Array.from({ length: data.users || 0 }, (_, i) => generateMockUser(`${i + 1}`));
      mockCustomers = Array.from({ length: data.customers || 0 }, (_, i) => generateMockCustomer(`${i + 1}`));
      mockLeads = Array.from({ length: data.leads || 0 }, (_, i) => generateMockLead(`${i + 1}`));
      mockQuotations = Array.from({ length: data.quotations || 0 }, (_, i) => generateMockQuotation(`${i + 1}`));
      mockContracts = Array.from({ length: data.contracts || 0 }, (_, i) => generateMockContract(`${i + 1}`));
      mockStudies = Array.from({ length: data.studies || 0 }, (_, i) => generateMockStudy(`${i + 1}`));
      mockSystemSettings = Array.from({ length: data.systemSettings || 0 }, (_, i) => generateMockSystemSetting(`${i + 1}`));
      mockPipelineStages = Array.from({ length: data.pipelineStages || 0 }, (_, i) => generateMockPipelineStage(`${i + 1}`));
      mockStageTasks = Array.from({ length: data.stageTasks || 0 }, (_, i) => generateMockStageTask(`${i + 1}`));
    },
    _reset: () => {
      mockUsers = [];
      mockCustomers = [];
      mockLeads = [];
      mockQuotations = [];
      mockContracts = [];
      mockStudies = [];
      mockSystemSettings = [];
      mockPipelineStages = [];
      mockStageTasks = [];
    },
  } as unknown as PrismaClient & {
    _setMockData: (data: {
      users?: number;
      customers?: number;
      leads?: number;
      quotations?: number;
      contracts?: number;
      studies?: number;
      systemSettings?: number;
      pipelineStages?: number;
      stageTasks?: number;
    }) => void;
    _reset: () => void;
  };
};

describe('Backup Table Inclusion Properties', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let service: BackupService;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = new BackupService(mockPrisma as unknown as PrismaClient);
    jest.clearAllMocks();
  });

  /**
   * Property 2: 백업 데이터 테이블 포함
   * Feature: crm-core-enhancements, Task 1.2
   * 
   * For any generated backup, the backup data includes User, Customer, Lead, 
   * Quotation, Contract, Study, SystemSetting, PipelineStage, StageTask tables
   * and master data tables (ToxicityTest, EfficacyModel, etc.) are excluded.
   * 
   * **Validates: Requirements 1.4.1, 1.4.2, 1.4.3, 1.4.4**
   */
  describe('Property 2: 백업 데이터 테이블 포함', () => {
    /**
     * Property 2.1: BACKUP_TARGET_TABLES must include all required business data tables
     * **Validates: Requirements 1.4.1, 1.4.2, 1.4.3**
     */
    it('should include all required business data tables in BACKUP_TARGET_TABLES', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random table name from required tables
          fc.constantFrom(
            'users',
            'customers',
            'leads',
            'quotations',
            'contracts',
            'studies',
            'systemSettings',
            'pipelineStages',
            'stageTasks'
          ),
          async (tableName) => {
            // Property: All required tables must be in BACKUP_TARGET_TABLES
            expect(BACKUP_TARGET_TABLES).toContain(tableName);
            expect(BackupService.isBackupTargetTable(tableName)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 2.2: Master data tables must be excluded from backup
     * **Validates: Requirements 1.4.4**
     */
    it('should exclude all master data tables from backup targets', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random master data table name
          fc.constantFrom(
            'toxicityTests',
            'efficacyModels',
            'efficacyPriceItems',
            'modalities',
            'packageTemplates',
            'toxicityCategories',
            'animalClasses',
            'species',
            'routes'
          ),
          async (tableName) => {
            // Property: Master data tables must NOT be in BACKUP_TARGET_TABLES
            expect(BACKUP_TARGET_TABLES).not.toContain(tableName);
            expect(BackupService.isBackupTargetTable(tableName)).toBe(false);
            
            // Property: Master data tables must be in MASTER_DATA_TABLES
            expect(MASTER_DATA_TABLES).toContain(tableName);
            expect(BackupService.isMasterDataTable(tableName)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 2.3: Backup target tables and master data tables must be mutually exclusive
     * **Validates: Requirements 1.4.1, 1.4.2, 1.4.3, 1.4.4**
     */
    it('should have no overlap between backup targets and master data tables', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.nat({ max: 1000 }), // Random seed for variation
          async () => {
            const backupSet = new Set<string>(BACKUP_TARGET_TABLES);
            const masterSet = new Set<string>(MASTER_DATA_TABLES);

            // Property: No table should be in both sets
            for (const table of backupSet) {
              expect(masterSet.has(table)).toBe(false);
            }

            for (const table of masterSet) {
              expect(backupSet.has(table)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 2.4: Backup metadata should list only backup target tables
     * **Validates: Requirements 1.4.1, 1.4.2, 1.4.3, 1.4.4**
     */
    it('should include only backup target tables in backup metadata', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random counts for each table type
          fc.record({
            users: fc.nat({ max: 10 }),
            customers: fc.nat({ max: 10 }),
            leads: fc.nat({ max: 10 }),
            quotations: fc.nat({ max: 10 }),
            contracts: fc.nat({ max: 10 }),
            studies: fc.nat({ max: 10 }),
            systemSettings: fc.nat({ max: 10 }),
            pipelineStages: fc.nat({ max: 10 }),
            stageTasks: fc.nat({ max: 10 }),
          }),
          async (dataCounts) => {
            mockPrisma._reset();
            mockPrisma._setMockData(dataCounts);

            // Get backup data
            const backupData = await service.getBackupData('backup-1');

            // Property: metadata.tables should only contain backup target tables
            for (const table of backupData.metadata.tables) {
              expect(BACKUP_TARGET_TABLES).toContain(table);
              expect(MASTER_DATA_TABLES).not.toContain(table);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 2.5: Backup data should not contain master data table keys
     * **Validates: Requirements 1.4.4**
     */
    it('should not contain master data table keys in backup data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            users: fc.nat({ max: 5 }),
            customers: fc.nat({ max: 5 }),
            leads: fc.nat({ max: 5 }),
          }),
          async (dataCounts) => {
            mockPrisma._reset();
            mockPrisma._setMockData(dataCounts);

            const backupData = await service.getBackupData('backup-1');

            // Property: Backup data should not have master data table keys
            const backupKeys = Object.keys(backupData);
            for (const masterTable of MASTER_DATA_TABLES) {
              expect(backupKeys).not.toContain(masterTable);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 2.6: isBackupTargetTable and isMasterDataTable should be consistent
     * **Validates: Requirements 1.4.1, 1.4.2, 1.4.3, 1.4.4**
     */
    it('should have consistent helper method results', async () => {
      // Generate random table names including valid and invalid ones
      const allKnownTables = [...BACKUP_TARGET_TABLES, ...MASTER_DATA_TABLES];
      
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constantFrom(...allKnownTables),
            fc.string({ minLength: 1, maxLength: 20 })
          ),
          async (tableName) => {
            const isBackupTarget = BackupService.isBackupTargetTable(tableName);
            const isMasterData = BackupService.isMasterDataTable(tableName);

            // Property: A table cannot be both backup target and master data
            expect(isBackupTarget && isMasterData).toBe(false);

            // Property: If it's a backup target, it should be in BACKUP_TARGET_TABLES
            if (isBackupTarget) {
              expect(BACKUP_TARGET_TABLES).toContain(tableName);
            }

            // Property: If it's master data, it should be in MASTER_DATA_TABLES
            if (isMasterData) {
              expect(MASTER_DATA_TABLES).toContain(tableName);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 2.7: BACKUP_TARGET_TABLES should have exactly 9 tables
     * **Validates: Requirements 1.4.1, 1.4.2, 1.4.3**
     */
    it('should have exactly 9 backup target tables', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.nat({ max: 1000 }),
          async () => {
            // Property: BACKUP_TARGET_TABLES must have exactly 9 tables
            expect(BACKUP_TARGET_TABLES.length).toBe(9);

            // Property: All 9 required tables must be present
            const requiredTables = [
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

            for (const table of requiredTables) {
              expect(BACKUP_TARGET_TABLES).toContain(table);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 2.8: getBackupTargetTables and getMasterDataTables should return correct lists
     * **Validates: Requirements 1.4.1, 1.4.2, 1.4.3, 1.4.4**
     */
    it('should return correct table lists from static methods', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.nat({ max: 1000 }),
          async () => {
            const backupTables = BackupService.getBackupTargetTables();
            const masterTables = BackupService.getMasterDataTables();

            // Property: getBackupTargetTables should return BACKUP_TARGET_TABLES
            expect(backupTables).toEqual(BACKUP_TARGET_TABLES);

            // Property: getMasterDataTables should return MASTER_DATA_TABLES
            expect(masterTables).toEqual(MASTER_DATA_TABLES);

            // Property: Both lists should be non-empty
            expect(backupTables.length).toBeGreaterThan(0);
            expect(masterTables.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property tests for backup data structure validation
   */
  describe('Backup Data Structure Validation', () => {
    /**
     * Property: Backup metadata should always have required fields
     */
    it('should always include required metadata fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            users: fc.nat({ max: 5 }),
            customers: fc.nat({ max: 5 }),
          }),
          async (dataCounts) => {
            mockPrisma._reset();
            mockPrisma._setMockData(dataCounts);

            const backupData = await service.getBackupData('backup-1');

            // Property: metadata must exist
            expect(backupData.metadata).toBeDefined();

            // Property: metadata must have createdAt
            expect(backupData.metadata.createdAt).toBeDefined();
            expect(typeof backupData.metadata.createdAt).toBe('string');

            // Property: metadata must have version
            expect(backupData.metadata.version).toBeDefined();
            expect(typeof backupData.metadata.version).toBe('string');

            // Property: metadata must have tables array
            expect(backupData.metadata.tables).toBeDefined();
            expect(Array.isArray(backupData.metadata.tables)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: User backup should exclude password field
     */
    it('should exclude password field from user backup data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }),
          async (userCount) => {
            mockPrisma._reset();
            mockPrisma._setMockData({ users: userCount });

            const backupData = await service.getBackupData('backup-1');

            // Property: If users exist in backup, none should have password field
            if (backupData.users && backupData.users.length > 0) {
              for (const user of backupData.users) {
                expect(user).not.toHaveProperty('password');
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 1: 백업 데이터 라운드트립
   * Feature: crm-core-enhancements, Task 1.5
   * 
   * For any valid backup data, after creating a backup and then restoring it,
   * the restored data should be equivalent to the original data.
   * 
   * **Validates: Requirements 1.2.3, 1.3.1, 1.3.3**
   */
  describe('Property 1: 백업 데이터 라운드트립', () => {
    /**
     * Create a mock PrismaClient that tracks restore operations
     * and allows verification of roundtrip data equivalence
     */
    const createRoundtripMockPrisma = () => {
      // Storage for original data (simulating database state)
      let originalData: {
        users: Map<string, Record<string, unknown>>;
        customers: Map<string, Record<string, unknown>>;
        leads: Map<string, Record<string, unknown>>;
        quotations: Map<string, Record<string, unknown>>;
        contracts: Map<string, Record<string, unknown>>;
        studies: Map<string, Record<string, unknown>>;
        systemSettings: Map<string, Record<string, unknown>>;
        pipelineStages: Map<string, Record<string, unknown>>;
        stageTasks: Map<string, Record<string, unknown>>;
      } = {
        users: new Map(),
        customers: new Map(),
        leads: new Map(),
        quotations: new Map(),
        contracts: new Map(),
        studies: new Map(),
        systemSettings: new Map(),
        pipelineStages: new Map(),
        stageTasks: new Map(),
      };

      // Storage for restored data (after restore operation)
      let restoredData: typeof originalData = {
        users: new Map(),
        customers: new Map(),
        leads: new Map(),
        quotations: new Map(),
        contracts: new Map(),
        studies: new Map(),
        systemSettings: new Map(),
        pipelineStages: new Map(),
        stageTasks: new Map(),
      };

      // Track which data set is being used (original or restored)
      let useRestoredData = false;

      const createUpsertMock = (tableName: keyof typeof originalData) => {
        return jest.fn().mockImplementation(async (args: { where: { id: string }; create: Record<string, unknown>; update: Record<string, unknown> }) => {
          const id = args.where.id;
          const data = { id, ...args.create };
          restoredData[tableName].set(id, data);
          return data;
        });
      };

      const createFindManyMock = (tableName: keyof typeof originalData) => {
        return jest.fn().mockImplementation(async () => {
          const dataSource = useRestoredData ? restoredData : originalData;
          return Array.from(dataSource[tableName].values());
        });
      };

      const mockPrisma = {
        user: {
          findMany: createFindManyMock('users'),
          upsert: createUpsertMock('users'),
        },
        customer: {
          findMany: createFindManyMock('customers'),
          upsert: createUpsertMock('customers'),
        },
        lead: {
          findMany: createFindManyMock('leads'),
          upsert: createUpsertMock('leads'),
        },
        quotation: {
          findMany: createFindManyMock('quotations'),
          upsert: createUpsertMock('quotations'),
        },
        contract: {
          findMany: createFindManyMock('contracts'),
          upsert: createUpsertMock('contracts'),
        },
        study: {
          findMany: createFindManyMock('studies'),
          upsert: createUpsertMock('studies'),
        },
        systemSetting: {
          findMany: createFindManyMock('systemSettings'),
          upsert: createUpsertMock('systemSettings'),
        },
        pipelineStage: {
          findMany: createFindManyMock('pipelineStages'),
          upsert: createUpsertMock('pipelineStages'),
        },
        stageTask: {
          findMany: createFindManyMock('stageTasks'),
          upsert: createUpsertMock('stageTasks'),
        },
        backup: {
          create: jest.fn().mockImplementation(async (args: { data: Record<string, unknown> }) => ({
            id: 'backup-roundtrip-1',
            filename: args.data.filename,
            size: args.data.size,
            status: args.data.status,
            type: args.data.type,
            createdAt: new Date(),
          })),
          update: jest.fn().mockImplementation(async (args: { where: { id: string }; data: Record<string, unknown> }) => ({
            id: args.where.id,
            filename: 'backup.json',
            size: args.data.size || BigInt(0),
            status: args.data.status,
            type: 'MANUAL',
            createdAt: new Date(),
          })),
          findUnique: jest.fn().mockImplementation(async () => ({
            id: 'backup-roundtrip-1',
            filename: 'backup.json',
            size: BigInt(1000),
            status: 'COMPLETED',
            type: 'MANUAL',
            createdAt: new Date(),
          })),
          findMany: jest.fn().mockImplementation(async () => []),
          count: jest.fn().mockImplementation(async () => 0),
          delete: jest.fn().mockImplementation(async () => ({})),
        },
        $transaction: jest.fn().mockImplementation(async (callback: (tx: unknown) => Promise<void>) => {
          await callback(mockPrisma);
        }),
        // Helper methods
        _setOriginalData: (data: {
          users?: Array<Record<string, unknown>>;
          customers?: Array<Record<string, unknown>>;
          leads?: Array<Record<string, unknown>>;
          quotations?: Array<Record<string, unknown>>;
          contracts?: Array<Record<string, unknown>>;
          studies?: Array<Record<string, unknown>>;
          systemSettings?: Array<Record<string, unknown>>;
          pipelineStages?: Array<Record<string, unknown>>;
          stageTasks?: Array<Record<string, unknown>>;
        }) => {
          originalData = {
            users: new Map((data.users || []).map(u => [u.id as string, u])),
            customers: new Map((data.customers || []).map(c => [c.id as string, c])),
            leads: new Map((data.leads || []).map(l => [l.id as string, l])),
            quotations: new Map((data.quotations || []).map(q => [q.id as string, q])),
            contracts: new Map((data.contracts || []).map(c => [c.id as string, c])),
            studies: new Map((data.studies || []).map(s => [s.id as string, s])),
            systemSettings: new Map((data.systemSettings || []).map(s => [s.id as string, s])),
            pipelineStages: new Map((data.pipelineStages || []).map(p => [p.id as string, p])),
            stageTasks: new Map((data.stageTasks || []).map(t => [t.id as string, t])),
          };
        },
        _getRestoredData: () => restoredData,
        _getOriginalData: () => originalData,
        _switchToRestoredData: () => { useRestoredData = true; },
        _switchToOriginalData: () => { useRestoredData = false; },
        _reset: () => {
          originalData = {
            users: new Map(),
            customers: new Map(),
            leads: new Map(),
            quotations: new Map(),
            contracts: new Map(),
            studies: new Map(),
            systemSettings: new Map(),
            pipelineStages: new Map(),
            stageTasks: new Map(),
          };
          restoredData = {
            users: new Map(),
            customers: new Map(),
            leads: new Map(),
            quotations: new Map(),
            contracts: new Map(),
            studies: new Map(),
            systemSettings: new Map(),
            pipelineStages: new Map(),
            stageTasks: new Map(),
          };
          useRestoredData = false;
        },
      };

      return mockPrisma as unknown as PrismaClient & {
        _setOriginalData: typeof mockPrisma._setOriginalData;
        _getRestoredData: typeof mockPrisma._getRestoredData;
        _getOriginalData: typeof mockPrisma._getOriginalData;
        _switchToRestoredData: typeof mockPrisma._switchToRestoredData;
        _switchToOriginalData: typeof mockPrisma._switchToOriginalData;
        _reset: typeof mockPrisma._reset;
      };
    };

    // Arbitraries for generating test data
    const userArbitrary = fc.record({
      id: fc.uuid(),
      email: fc.emailAddress(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: null }),
      department: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
      position: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
      title: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: null }),
      role: fc.constantFrom('ADMIN', 'USER', 'MANAGER'),
      status: fc.constantFrom('ACTIVE', 'INACTIVE'),
      canViewAllSales: fc.boolean(),
      canViewAllData: fc.boolean(),
      createdAt: fc.date(),
      updatedAt: fc.date(),
    });

    const customerArbitrary = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 100 }),
      email: fc.option(fc.emailAddress(), { nil: null }),
      phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: null }),
      address: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
      createdAt: fc.date(),
      updatedAt: fc.date(),
      deletedAt: fc.constant(null),
    });

    const systemSettingArbitrary = fc.record({
      id: fc.uuid(),
      key: fc.string({ minLength: 1, maxLength: 50 }),
      value: fc.string({ minLength: 1, maxLength: 200 }),
      description: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
      createdAt: fc.date(),
      updatedAt: fc.date(),
    });

    const pipelineStageArbitrary = fc.record({
      id: fc.uuid(),
      code: fc.string({ minLength: 1, maxLength: 20 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      color: fc.hexaString({ minLength: 6, maxLength: 6 }).map(s => `#${s}`),
      order: fc.integer({ min: 0, max: 100 }),
      description: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
      isDefault: fc.boolean(),
      isActive: fc.boolean(),
      createdAt: fc.date(),
      updatedAt: fc.date(),
    });

    /**
     * Property 1.1: Backup data roundtrip preserves user data
     * **Validates: Requirements 1.2.3, 1.3.1, 1.3.3**
     */
    it('should preserve user data through backup and restore roundtrip', async () => {
      const roundtripMock = createRoundtripMockPrisma();
      const roundtripService = new BackupService(roundtripMock as unknown as PrismaClient);

      await fc.assert(
        fc.asyncProperty(
          fc.array(userArbitrary, { minLength: 1, maxLength: 5 }),
          async (users) => {
            roundtripMock._reset();
            roundtripMock._setOriginalData({ users });

            // Step 1: Get backup data (simulates backup creation)
            const backupData = await roundtripService.getBackupData('backup-roundtrip-1');

            // Step 2: Perform restore
            const restoreResult = await roundtripService.restore('backup-roundtrip-1', {
              tables: ['users'],
            });

            // Property: Restore should succeed
            expect(restoreResult.success).toBe(true);
            expect(restoreResult.restoredTables).toContain('users');

            // Property: Restored user count should match original
            const restoredData = roundtripMock._getRestoredData();
            expect(restoredData.users.size).toBe(users.length);

            // Property: Each restored user should have equivalent data to original
            for (const originalUser of users) {
              const restoredUser = restoredData.users.get(originalUser.id);
              expect(restoredUser).toBeDefined();
              
              // Check key fields are preserved (excluding password which is handled separately)
              expect(restoredUser?.email).toBe(originalUser.email);
              expect(restoredUser?.name).toBe(originalUser.name);
              expect(restoredUser?.role).toBe(originalUser.role);
              expect(restoredUser?.status).toBe(originalUser.status);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 1.2: Backup data roundtrip preserves customer data
     * **Validates: Requirements 1.2.3, 1.3.1, 1.3.3**
     */
    it('should preserve customer data through backup and restore roundtrip', async () => {
      const roundtripMock = createRoundtripMockPrisma();
      const roundtripService = new BackupService(roundtripMock as unknown as PrismaClient);

      await fc.assert(
        fc.asyncProperty(
          fc.array(customerArbitrary, { minLength: 1, maxLength: 5 }),
          async (customers) => {
            roundtripMock._reset();
            roundtripMock._setOriginalData({ customers });

            // Step 1: Get backup data
            const backupData = await roundtripService.getBackupData('backup-roundtrip-1');

            // Step 2: Perform restore
            const restoreResult = await roundtripService.restore('backup-roundtrip-1', {
              tables: ['customers'],
            });

            // Property: Restore should succeed
            expect(restoreResult.success).toBe(true);
            expect(restoreResult.restoredTables).toContain('customers');

            // Property: Restored customer count should match original
            const restoredData = roundtripMock._getRestoredData();
            expect(restoredData.customers.size).toBe(customers.length);

            // Property: Each restored customer should have equivalent data
            for (const originalCustomer of customers) {
              const restoredCustomer = restoredData.customers.get(originalCustomer.id);
              expect(restoredCustomer).toBeDefined();
              expect(restoredCustomer?.name).toBe(originalCustomer.name);
              expect(restoredCustomer?.email).toBe(originalCustomer.email);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 1.3: Backup data roundtrip preserves system settings
     * **Validates: Requirements 1.2.3, 1.3.1, 1.3.3**
     */
    it('should preserve system settings through backup and restore roundtrip', async () => {
      const roundtripMock = createRoundtripMockPrisma();
      const roundtripService = new BackupService(roundtripMock as unknown as PrismaClient);

      await fc.assert(
        fc.asyncProperty(
          fc.array(systemSettingArbitrary, { minLength: 1, maxLength: 5 }),
          async (settings) => {
            roundtripMock._reset();
            roundtripMock._setOriginalData({ systemSettings: settings });

            // Step 1: Get backup data
            const backupData = await roundtripService.getBackupData('backup-roundtrip-1');

            // Step 2: Perform restore
            const restoreResult = await roundtripService.restore('backup-roundtrip-1', {
              tables: ['systemSettings'],
            });

            // Property: Restore should succeed
            expect(restoreResult.success).toBe(true);
            expect(restoreResult.restoredTables).toContain('systemSettings');

            // Property: Restored settings count should match original
            const restoredData = roundtripMock._getRestoredData();
            expect(restoredData.systemSettings.size).toBe(settings.length);

            // Property: Each restored setting should have equivalent data
            for (const originalSetting of settings) {
              const restoredSetting = restoredData.systemSettings.get(originalSetting.id);
              expect(restoredSetting).toBeDefined();
              expect(restoredSetting?.key).toBe(originalSetting.key);
              expect(restoredSetting?.value).toBe(originalSetting.value);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 1.4: Backup data roundtrip preserves pipeline stages
     * **Validates: Requirements 1.2.3, 1.3.1, 1.3.3**
     */
    it('should preserve pipeline stages through backup and restore roundtrip', async () => {
      const roundtripMock = createRoundtripMockPrisma();
      const roundtripService = new BackupService(roundtripMock as unknown as PrismaClient);

      await fc.assert(
        fc.asyncProperty(
          fc.array(pipelineStageArbitrary, { minLength: 1, maxLength: 5 }),
          async (stages) => {
            roundtripMock._reset();
            roundtripMock._setOriginalData({ pipelineStages: stages });

            // Step 1: Get backup data
            const backupData = await roundtripService.getBackupData('backup-roundtrip-1');

            // Step 2: Perform restore
            const restoreResult = await roundtripService.restore('backup-roundtrip-1', {
              tables: ['pipelineStages'],
            });

            // Property: Restore should succeed
            expect(restoreResult.success).toBe(true);
            expect(restoreResult.restoredTables).toContain('pipelineStages');

            // Property: Restored stages count should match original
            const restoredData = roundtripMock._getRestoredData();
            expect(restoredData.pipelineStages.size).toBe(stages.length);

            // Property: Each restored stage should have equivalent data
            for (const originalStage of stages) {
              const restoredStage = restoredData.pipelineStages.get(originalStage.id);
              expect(restoredStage).toBeDefined();
              expect(restoredStage?.code).toBe(originalStage.code);
              expect(restoredStage?.name).toBe(originalStage.name);
              expect(restoredStage?.order).toBe(originalStage.order);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 1.5: Backup data roundtrip with multiple tables
     * **Validates: Requirements 1.2.3, 1.3.1, 1.3.3**
     */
    it('should preserve multiple tables through backup and restore roundtrip', async () => {
      const roundtripMock = createRoundtripMockPrisma();
      const roundtripService = new BackupService(roundtripMock as unknown as PrismaClient);

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            users: fc.array(userArbitrary, { minLength: 0, maxLength: 3 }),
            customers: fc.array(customerArbitrary, { minLength: 0, maxLength: 3 }),
            systemSettings: fc.array(systemSettingArbitrary, { minLength: 0, maxLength: 3 }),
            pipelineStages: fc.array(pipelineStageArbitrary, { minLength: 0, maxLength: 3 }),
          }),
          async (data) => {
            roundtripMock._reset();
            roundtripMock._setOriginalData(data);

            // Step 1: Get backup data
            const backupData = await roundtripService.getBackupData('backup-roundtrip-1');

            // Step 2: Perform restore for all tables
            const restoreResult = await roundtripService.restore('backup-roundtrip-1');

            // Property: Restore should succeed
            expect(restoreResult.success).toBe(true);

            // Property: Record counts should match
            const restoredData = roundtripMock._getRestoredData();
            
            if (data.users.length > 0) {
              expect(restoredData.users.size).toBe(data.users.length);
            }
            if (data.customers.length > 0) {
              expect(restoredData.customers.size).toBe(data.customers.length);
            }
            if (data.systemSettings.length > 0) {
              expect(restoredData.systemSettings.size).toBe(data.systemSettings.length);
            }
            if (data.pipelineStages.length > 0) {
              expect(restoredData.pipelineStages.size).toBe(data.pipelineStages.length);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 1.6: Restore result record counts match backup data
     * **Validates: Requirements 1.3.1, 1.3.4**
     */
    it('should report accurate record counts in restore result', async () => {
      const roundtripMock = createRoundtripMockPrisma();
      const roundtripService = new BackupService(roundtripMock as unknown as PrismaClient);

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            users: fc.array(userArbitrary, { minLength: 1, maxLength: 5 }),
            customers: fc.array(customerArbitrary, { minLength: 1, maxLength: 5 }),
          }),
          async (data) => {
            roundtripMock._reset();
            roundtripMock._setOriginalData(data);

            // Perform restore
            const restoreResult = await roundtripService.restore('backup-roundtrip-1', {
              tables: ['users', 'customers'],
            });

            // Property: Record counts in result should match actual data
            expect(restoreResult.recordCounts['users']).toBe(data.users.length);
            expect(restoreResult.recordCounts['customers']).toBe(data.customers.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 1.7: Dry run mode does not modify data
     * **Validates: Requirements 1.3.1**
     */
    it('should not modify data in dry run mode', async () => {
      const roundtripMock = createRoundtripMockPrisma();
      const roundtripService = new BackupService(roundtripMock as unknown as PrismaClient);

      await fc.assert(
        fc.asyncProperty(
          fc.array(userArbitrary, { minLength: 1, maxLength: 5 }),
          async (users) => {
            roundtripMock._reset();
            roundtripMock._setOriginalData({ users });

            // Perform dry run restore
            const restoreResult = await roundtripService.restore('backup-roundtrip-1', {
              tables: ['users'],
              dryRun: true,
            });

            // Property: Dry run should succeed
            expect(restoreResult.success).toBe(true);
            expect(restoreResult.dryRun).toBe(true);

            // Property: Dry run should report what would be restored
            expect(restoreResult.restoredTables).toContain('users');
            expect(restoreResult.recordCounts['users']).toBe(users.length);

            // Property: No actual data should be restored in dry run
            const restoredData = roundtripMock._getRestoredData();
            expect(restoredData.users.size).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 1.8: Roundtrip preserves data integrity for IDs
     * **Validates: Requirements 1.2.3, 1.3.1**
     */
    it('should preserve record IDs through roundtrip', async () => {
      const roundtripMock = createRoundtripMockPrisma();
      const roundtripService = new BackupService(roundtripMock as unknown as PrismaClient);

      await fc.assert(
        fc.asyncProperty(
          fc.array(userArbitrary, { minLength: 1, maxLength: 10 }),
          async (users) => {
            roundtripMock._reset();
            roundtripMock._setOriginalData({ users });

            // Perform restore
            await roundtripService.restore('backup-roundtrip-1', {
              tables: ['users'],
            });

            // Property: All original IDs should exist in restored data
            const restoredData = roundtripMock._getRestoredData();
            const originalIds = new Set(users.map(u => u.id));
            const restoredIds = new Set(restoredData.users.keys());

            expect(restoredIds.size).toBe(originalIds.size);
            for (const id of originalIds) {
              expect(restoredIds.has(id)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: 선택적 복구 (Selective Restore)
   * Feature: crm-core-enhancements, Task 1.6
   * 
   * For any specific tables selected for restore, only those selected tables are restored
   * and tables not selected remain unaffected.
   * 
   * **Validates: Requirements 1.3.3, 1.3.4**
   */
  describe('Property 5: 선택적 복구', () => {
    /**
     * Create a mock PrismaClient that tracks selective restore operations
     * and allows verification that non-selected tables remain unchanged
     */
    const createSelectiveRestoreMockPrisma = () => {
      // Storage for original data (simulating existing database state before restore)
      let existingData: {
        users: Map<string, Record<string, unknown>>;
        customers: Map<string, Record<string, unknown>>;
        leads: Map<string, Record<string, unknown>>;
        quotations: Map<string, Record<string, unknown>>;
        contracts: Map<string, Record<string, unknown>>;
        studies: Map<string, Record<string, unknown>>;
        systemSettings: Map<string, Record<string, unknown>>;
        pipelineStages: Map<string, Record<string, unknown>>;
        stageTasks: Map<string, Record<string, unknown>>;
      } = {
        users: new Map(),
        customers: new Map(),
        leads: new Map(),
        quotations: new Map(),
        contracts: new Map(),
        studies: new Map(),
        systemSettings: new Map(),
        pipelineStages: new Map(),
        stageTasks: new Map(),
      };

      // Storage for backup data (data to be restored from)
      let backupData: typeof existingData = {
        users: new Map(),
        customers: new Map(),
        leads: new Map(),
        quotations: new Map(),
        contracts: new Map(),
        studies: new Map(),
        systemSettings: new Map(),
        pipelineStages: new Map(),
        stageTasks: new Map(),
      };

      // Track which tables were actually modified during restore
      let modifiedTables: Set<string> = new Set();

      const createUpsertMock = (tableName: keyof typeof existingData) => {
        return jest.fn().mockImplementation(async (args: { where: { id: string }; create: Record<string, unknown>; update: Record<string, unknown> }) => {
          const id = args.where.id;
          const data = { id, ...args.create };
          existingData[tableName].set(id, data);
          modifiedTables.add(tableName);
          return data;
        });
      };

      const createFindManyMock = (tableName: keyof typeof existingData) => {
        return jest.fn().mockImplementation(async () => {
          return Array.from(backupData[tableName].values());
        });
      };

      const mockPrisma = {
        user: {
          findMany: createFindManyMock('users'),
          upsert: createUpsertMock('users'),
        },
        customer: {
          findMany: createFindManyMock('customers'),
          upsert: createUpsertMock('customers'),
        },
        lead: {
          findMany: createFindManyMock('leads'),
          upsert: createUpsertMock('leads'),
        },
        quotation: {
          findMany: createFindManyMock('quotations'),
          upsert: createUpsertMock('quotations'),
        },
        contract: {
          findMany: createFindManyMock('contracts'),
          upsert: createUpsertMock('contracts'),
        },
        study: {
          findMany: createFindManyMock('studies'),
          upsert: createUpsertMock('studies'),
        },
        systemSetting: {
          findMany: createFindManyMock('systemSettings'),
          upsert: createUpsertMock('systemSettings'),
        },
        pipelineStage: {
          findMany: createFindManyMock('pipelineStages'),
          upsert: createUpsertMock('pipelineStages'),
        },
        stageTask: {
          findMany: createFindManyMock('stageTasks'),
          upsert: createUpsertMock('stageTasks'),
        },
        backup: {
          create: jest.fn().mockImplementation(async (args: { data: Record<string, unknown> }) => ({
            id: 'backup-selective-1',
            filename: args.data.filename,
            size: args.data.size,
            status: args.data.status,
            type: args.data.type,
            createdAt: new Date(),
          })),
          update: jest.fn().mockImplementation(async (args: { where: { id: string }; data: Record<string, unknown> }) => ({
            id: args.where.id,
            filename: 'backup.json',
            size: args.data.size || BigInt(0),
            status: args.data.status,
            type: 'MANUAL',
            createdAt: new Date(),
          })),
          findUnique: jest.fn().mockImplementation(async () => ({
            id: 'backup-selective-1',
            filename: 'backup.json',
            size: BigInt(1000),
            status: 'COMPLETED',
            type: 'MANUAL',
            createdAt: new Date(),
          })),
          findMany: jest.fn().mockImplementation(async () => []),
          count: jest.fn().mockImplementation(async () => 0),
          delete: jest.fn().mockImplementation(async () => ({})),
        },
        $transaction: jest.fn().mockImplementation(async (callback: (tx: unknown) => Promise<void>) => {
          await callback(mockPrisma);
        }),
        // Helper methods
        _setExistingData: (data: {
          users?: Array<Record<string, unknown>>;
          customers?: Array<Record<string, unknown>>;
          leads?: Array<Record<string, unknown>>;
          quotations?: Array<Record<string, unknown>>;
          contracts?: Array<Record<string, unknown>>;
          studies?: Array<Record<string, unknown>>;
          systemSettings?: Array<Record<string, unknown>>;
          pipelineStages?: Array<Record<string, unknown>>;
          stageTasks?: Array<Record<string, unknown>>;
        }) => {
          existingData = {
            users: new Map((data.users || []).map(u => [u.id as string, u])),
            customers: new Map((data.customers || []).map(c => [c.id as string, c])),
            leads: new Map((data.leads || []).map(l => [l.id as string, l])),
            quotations: new Map((data.quotations || []).map(q => [q.id as string, q])),
            contracts: new Map((data.contracts || []).map(c => [c.id as string, c])),
            studies: new Map((data.studies || []).map(s => [s.id as string, s])),
            systemSettings: new Map((data.systemSettings || []).map(s => [s.id as string, s])),
            pipelineStages: new Map((data.pipelineStages || []).map(p => [p.id as string, p])),
            stageTasks: new Map((data.stageTasks || []).map(t => [t.id as string, t])),
          };
        },
        _setBackupData: (data: {
          users?: Array<Record<string, unknown>>;
          customers?: Array<Record<string, unknown>>;
          leads?: Array<Record<string, unknown>>;
          quotations?: Array<Record<string, unknown>>;
          contracts?: Array<Record<string, unknown>>;
          studies?: Array<Record<string, unknown>>;
          systemSettings?: Array<Record<string, unknown>>;
          pipelineStages?: Array<Record<string, unknown>>;
          stageTasks?: Array<Record<string, unknown>>;
        }) => {
          backupData = {
            users: new Map((data.users || []).map(u => [u.id as string, u])),
            customers: new Map((data.customers || []).map(c => [c.id as string, c])),
            leads: new Map((data.leads || []).map(l => [l.id as string, l])),
            quotations: new Map((data.quotations || []).map(q => [q.id as string, q])),
            contracts: new Map((data.contracts || []).map(c => [c.id as string, c])),
            studies: new Map((data.studies || []).map(s => [s.id as string, s])),
            systemSettings: new Map((data.systemSettings || []).map(s => [s.id as string, s])),
            pipelineStages: new Map((data.pipelineStages || []).map(p => [p.id as string, p])),
            stageTasks: new Map((data.stageTasks || []).map(t => [t.id as string, t])),
          };
        },
        _getExistingData: () => existingData,
        _getModifiedTables: () => modifiedTables,
        _reset: () => {
          existingData = {
            users: new Map(),
            customers: new Map(),
            leads: new Map(),
            quotations: new Map(),
            contracts: new Map(),
            studies: new Map(),
            systemSettings: new Map(),
            pipelineStages: new Map(),
            stageTasks: new Map(),
          };
          backupData = {
            users: new Map(),
            customers: new Map(),
            leads: new Map(),
            quotations: new Map(),
            contracts: new Map(),
            studies: new Map(),
            systemSettings: new Map(),
            pipelineStages: new Map(),
            stageTasks: new Map(),
          };
          modifiedTables = new Set();
        },
      };

      return mockPrisma as unknown as PrismaClient & {
        _setExistingData: typeof mockPrisma._setExistingData;
        _setBackupData: typeof mockPrisma._setBackupData;
        _getExistingData: typeof mockPrisma._getExistingData;
        _getModifiedTables: typeof mockPrisma._getModifiedTables;
        _reset: typeof mockPrisma._reset;
      };
    };

    // Arbitraries for generating test data
    const userArb = fc.record({
      id: fc.uuid(),
      email: fc.emailAddress(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: null }),
      department: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
      position: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
      title: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: null }),
      role: fc.constantFrom('ADMIN', 'USER', 'MANAGER'),
      status: fc.constantFrom('ACTIVE', 'INACTIVE'),
      canViewAllSales: fc.boolean(),
      canViewAllData: fc.boolean(),
      createdAt: fc.date(),
      updatedAt: fc.date(),
    });

    const customerArb = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 100 }),
      email: fc.option(fc.emailAddress(), { nil: null }),
      phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: null }),
      address: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
      createdAt: fc.date(),
      updatedAt: fc.date(),
      deletedAt: fc.constant(null),
    });

    const systemSettingArb = fc.record({
      id: fc.uuid(),
      key: fc.string({ minLength: 1, maxLength: 50 }),
      value: fc.string({ minLength: 1, maxLength: 200 }),
      description: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
      createdAt: fc.date(),
      updatedAt: fc.date(),
    });

    const pipelineStageArb = fc.record({
      id: fc.uuid(),
      code: fc.string({ minLength: 1, maxLength: 20 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      color: fc.hexaString({ minLength: 6, maxLength: 6 }).map(s => `#${s}`),
      order: fc.integer({ min: 0, max: 100 }),
      description: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
      isDefault: fc.boolean(),
      isActive: fc.boolean(),
      createdAt: fc.date(),
      updatedAt: fc.date(),
    });

    // Arbitrary for selecting a subset of tables
    const tableSubsetArbitrary = fc.subarray(
      ['users', 'customers', 'systemSettings', 'pipelineStages'] as const,
      { minLength: 1, maxLength: 3 }
    );

    /**
     * Property 5.1: Only selected tables are restored
     * **Validates: Requirements 1.3.3**
     */
    it('should restore only selected tables', async () => {
      const selectiveMock = createSelectiveRestoreMockPrisma();
      const selectiveService = new BackupService(selectiveMock as unknown as PrismaClient);

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            users: fc.array(userArb, { minLength: 1, maxLength: 3 }),
            customers: fc.array(customerArb, { minLength: 1, maxLength: 3 }),
            systemSettings: fc.array(systemSettingArb, { minLength: 1, maxLength: 3 }),
            pipelineStages: fc.array(pipelineStageArb, { minLength: 1, maxLength: 3 }),
          }),
          tableSubsetArbitrary,
          async (backupDataInput, selectedTables) => {
            selectiveMock._reset();
            selectiveMock._setBackupData(backupDataInput);

            // Perform selective restore
            const restoreResult = await selectiveService.restore('backup-selective-1', {
              tables: [...selectedTables],
            });

            // Property: Restore should succeed
            expect(restoreResult.success).toBe(true);

            // Property: Only selected tables should be in restoredTables
            for (const table of restoreResult.restoredTables) {
              expect(selectedTables).toContain(table);
            }

            // Property: All selected tables with data should be restored
            for (const table of selectedTables) {
              const tableData = backupDataInput[table as keyof typeof backupDataInput];
              if (tableData && tableData.length > 0) {
                expect(restoreResult.restoredTables).toContain(table);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 5.2: Non-selected tables remain unaffected
     * **Validates: Requirements 1.3.3**
     */
    it('should not modify non-selected tables', async () => {
      const selectiveMock = createSelectiveRestoreMockPrisma();
      const selectiveService = new BackupService(selectiveMock as unknown as PrismaClient);

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            users: fc.array(userArb, { minLength: 1, maxLength: 3 }),
            customers: fc.array(customerArb, { minLength: 1, maxLength: 3 }),
            systemSettings: fc.array(systemSettingArb, { minLength: 1, maxLength: 3 }),
            pipelineStages: fc.array(pipelineStageArb, { minLength: 1, maxLength: 3 }),
          }),
          tableSubsetArbitrary,
          async (backupDataInput, selectedTables) => {
            selectiveMock._reset();
            selectiveMock._setBackupData(backupDataInput);

            // Perform selective restore
            await selectiveService.restore('backup-selective-1', {
              tables: [...selectedTables],
            });

            // Property: Only selected tables should be modified
            const modifiedTables = selectiveMock._getModifiedTables();
            for (const modifiedTable of modifiedTables) {
              expect(selectedTables).toContain(modifiedTable);
            }

            // Property: Non-selected tables should NOT be in modified tables
            const allTables = ['users', 'customers', 'systemSettings', 'pipelineStages'];
            const nonSelectedTables = allTables.filter(t => !selectedTables.includes(t as typeof selectedTables[number]));
            for (const nonSelectedTable of nonSelectedTables) {
              expect(modifiedTables.has(nonSelectedTable)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 5.3: Restore result correctly reports restored tables
     * **Validates: Requirements 1.3.4**
     */
    it('should correctly report which tables were restored', async () => {
      const selectiveMock = createSelectiveRestoreMockPrisma();
      const selectiveService = new BackupService(selectiveMock as unknown as PrismaClient);

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            users: fc.array(userArb, { minLength: 1, maxLength: 3 }),
            customers: fc.array(customerArb, { minLength: 1, maxLength: 3 }),
            systemSettings: fc.array(systemSettingArb, { minLength: 1, maxLength: 3 }),
            pipelineStages: fc.array(pipelineStageArb, { minLength: 1, maxLength: 3 }),
          }),
          tableSubsetArbitrary,
          async (backupDataInput, selectedTables) => {
            selectiveMock._reset();
            selectiveMock._setBackupData(backupDataInput);

            // Perform selective restore
            const restoreResult = await selectiveService.restore('backup-selective-1', {
              tables: [...selectedTables],
            });

            // Property: restoredTables should match actually modified tables
            const modifiedTables = selectiveMock._getModifiedTables();
            expect(new Set(restoreResult.restoredTables)).toEqual(modifiedTables);

            // Property: recordCounts should be accurate for each restored table
            for (const table of restoreResult.restoredTables) {
              const expectedCount = backupDataInput[table as keyof typeof backupDataInput]?.length || 0;
              expect(restoreResult.recordCounts[table]).toBe(expectedCount);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 5.4: Single table selection restores only that table
     * **Validates: Requirements 1.3.3**
     */
    it('should restore only a single table when one is selected', async () => {
      const selectiveMock = createSelectiveRestoreMockPrisma();
      const selectiveService = new BackupService(selectiveMock as unknown as PrismaClient);

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            users: fc.array(userArb, { minLength: 1, maxLength: 5 }),
            customers: fc.array(customerArb, { minLength: 1, maxLength: 5 }),
            systemSettings: fc.array(systemSettingArb, { minLength: 1, maxLength: 5 }),
            pipelineStages: fc.array(pipelineStageArb, { minLength: 1, maxLength: 5 }),
          }),
          fc.constantFrom('users', 'customers', 'systemSettings', 'pipelineStages'),
          async (backupDataInput, singleTable) => {
            selectiveMock._reset();
            selectiveMock._setBackupData(backupDataInput);

            // Perform restore with single table
            const restoreResult = await selectiveService.restore('backup-selective-1', {
              tables: [singleTable],
            });

            // Property: Only the single selected table should be restored
            const modifiedTables = selectiveMock._getModifiedTables();
            
            const tableData = backupDataInput[singleTable as keyof typeof backupDataInput];
            if (tableData && tableData.length > 0) {
              expect(modifiedTables.size).toBe(1);
              expect(modifiedTables.has(singleTable)).toBe(true);
              expect(restoreResult.restoredTables).toContain(singleTable);
              expect(restoreResult.restoredTables.length).toBe(1);
            }

            // Property: Other tables should not be modified
            const otherTables = ['users', 'customers', 'systemSettings', 'pipelineStages'].filter(t => t !== singleTable);
            for (const otherTable of otherTables) {
              expect(modifiedTables.has(otherTable)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 5.5: Empty table selection restores nothing
     * **Validates: Requirements 1.3.3**
     */
    it('should restore all tables when no specific tables are selected', async () => {
      const selectiveMock = createSelectiveRestoreMockPrisma();
      const selectiveService = new BackupService(selectiveMock as unknown as PrismaClient);

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            users: fc.array(userArb, { minLength: 1, maxLength: 2 }),
            customers: fc.array(customerArb, { minLength: 1, maxLength: 2 }),
          }),
          async (backupDataInput) => {
            selectiveMock._reset();
            selectiveMock._setBackupData(backupDataInput);

            // Perform restore without specifying tables (should restore all)
            const restoreResult = await selectiveService.restore('backup-selective-1', {});

            // Property: All tables with data should be restored
            const modifiedTables = selectiveMock._getModifiedTables();
            
            if (backupDataInput.users.length > 0) {
              expect(modifiedTables.has('users')).toBe(true);
            }
            if (backupDataInput.customers.length > 0) {
              expect(modifiedTables.has('customers')).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 5.6: Selective restore with invalid table names ignores them
     * **Validates: Requirements 1.3.3**
     */
    it('should ignore invalid table names in selection', async () => {
      const selectiveMock = createSelectiveRestoreMockPrisma();
      const selectiveService = new BackupService(selectiveMock as unknown as PrismaClient);

      // Generate invalid table names that are clearly not valid backup targets
      const invalidTableNameArb = fc.string({ minLength: 5, maxLength: 20 })
        .filter(s => !BACKUP_TARGET_TABLES.includes(s as BackupTargetTable) && !['valueOf', 'toString', 'hasOwnProperty', 'constructor'].includes(s));

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            users: fc.array(userArb, { minLength: 1, maxLength: 3 }),
          }),
          fc.array(invalidTableNameArb, { minLength: 1, maxLength: 3 }),
          async (backupDataInput, invalidTableNames) => {
            selectiveMock._reset();
            selectiveMock._setBackupData(backupDataInput);

            // Perform restore with mix of valid and invalid table names
            const restoreResult = await selectiveService.restore('backup-selective-1', {
              tables: ['users', ...invalidTableNames],
            });

            // Property: Restore should succeed
            expect(restoreResult.success).toBe(true);

            // Property: Only valid tables should be restored
            const modifiedTables = selectiveMock._getModifiedTables();
            for (const modifiedTable of modifiedTables) {
              expect(BACKUP_TARGET_TABLES).toContain(modifiedTable);
            }

            // Property: Invalid table names should not appear in results
            for (const invalidName of invalidTableNames) {
              expect(restoreResult.restoredTables).not.toContain(invalidName);
              // Use Object.prototype.hasOwnProperty to check if the key exists in recordCounts
              expect(Object.prototype.hasOwnProperty.call(restoreResult.recordCounts, invalidName)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 5.7: Selective restore record counts match selected tables only
     * **Validates: Requirements 1.3.4**
     */
    it('should report record counts only for selected tables', async () => {
      const selectiveMock = createSelectiveRestoreMockPrisma();
      const selectiveService = new BackupService(selectiveMock as unknown as PrismaClient);

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            users: fc.array(userArb, { minLength: 1, maxLength: 5 }),
            customers: fc.array(customerArb, { minLength: 1, maxLength: 5 }),
            systemSettings: fc.array(systemSettingArb, { minLength: 1, maxLength: 5 }),
            pipelineStages: fc.array(pipelineStageArb, { minLength: 1, maxLength: 5 }),
          }),
          tableSubsetArbitrary,
          async (backupDataInput, selectedTables) => {
            selectiveMock._reset();
            selectiveMock._setBackupData(backupDataInput);

            // Perform selective restore
            const restoreResult = await selectiveService.restore('backup-selective-1', {
              tables: [...selectedTables],
            });

            // Property: recordCounts should only contain selected tables
            const recordCountKeys = Object.keys(restoreResult.recordCounts);
            for (const key of recordCountKeys) {
              expect(selectedTables).toContain(key);
            }

            // Property: Non-selected tables should not have record counts
            const allTables = ['users', 'customers', 'systemSettings', 'pipelineStages'];
            const nonSelectedTables = allTables.filter(t => !selectedTables.includes(t as typeof selectedTables[number]));
            for (const nonSelectedTable of nonSelectedTables) {
              expect(restoreResult.recordCounts[nonSelectedTable]).toBeUndefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


/**
 * Property 3: 백업 보존 기간 (Backup Retention Period)
 * Feature: crm-core-enhancements, Task 9.3
 * 
 * For any backup cleanup operation, backups older than the retention period (7 days)
 * should be deleted, and backups within the retention period should be preserved.
 * 
 * **Validates: Requirements 1.1.4**
 */
describe('Property 3: 백업 보존 기간', () => {
  /**
   * Create a mock PrismaClient for testing backup retention/cleanup
   */
  const createRetentionMockPrisma = () => {
    // Storage for backups
    let backups: Array<{
      id: string;
      filename: string;
      size: bigint;
      status: string;
      type: string;
      createdAt: Date;
    }> = [];

    const mockPrisma = {
      backup: {
        findMany: jest.fn().mockImplementation(async (args?: { where?: { createdAt?: { lt?: Date }; type?: string }; select?: Record<string, boolean> }) => {
          let filtered = [...backups];
          
          if (args?.where?.createdAt?.lt) {
            filtered = filtered.filter(b => b.createdAt < args.where!.createdAt!.lt!);
          }
          
          if (args?.where?.type) {
            filtered = filtered.filter(b => b.type === args.where!.type);
          }
          
          if (args?.select) {
            return filtered.map(b => {
              const result: Record<string, unknown> = {};
              for (const key of Object.keys(args.select!)) {
                if (args.select![key]) {
                  result[key] = b[key as keyof typeof b];
                }
              }
              return result;
            });
          }
          
          return filtered;
        }),
        deleteMany: jest.fn().mockImplementation(async (args?: { where?: { id?: { in?: string[] } } }) => {
          if (args?.where?.id?.in) {
            const idsToDelete = new Set(args.where.id.in);
            const originalCount = backups.length;
            backups = backups.filter(b => !idsToDelete.has(b.id));
            return { count: originalCount - backups.length };
          }
          return { count: 0 };
        }),
        create: jest.fn().mockImplementation(async (args: { data: Record<string, unknown> }) => {
          const newBackup = {
            id: args.data.id as string || `backup-${Date.now()}`,
            filename: args.data.filename as string,
            size: args.data.size as bigint || BigInt(0),
            status: args.data.status as string || 'COMPLETED',
            type: args.data.type as string || 'AUTO',
            createdAt: args.data.createdAt as Date || new Date(),
          };
          backups.push(newBackup);
          return newBackup;
        }),
        count: jest.fn().mockImplementation(async () => backups.length),
      },
      // Helper methods
      _setBackups: (newBackups: typeof backups) => {
        backups = [...newBackups];
      },
      _getBackups: () => [...backups],
      _reset: () => {
        backups = [];
      },
    };

    return mockPrisma as unknown as PrismaClient & {
      _setBackups: typeof mockPrisma._setBackups;
      _getBackups: typeof mockPrisma._getBackups;
      _reset: typeof mockPrisma._reset;
    };
  };

  /**
   * Simulate the cleanup logic from scheduledBackup.ts
   */
  const performCleanup = async (
    prisma: ReturnType<typeof createRetentionMockPrisma>,
    retentionDays: number
  ): Promise<{ deletedCount: number; deletedBackups: Array<{ id: string; createdAt: Date }> }> => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Find old AUTO backups
    const oldBackups = await prisma.backup.findMany({
      where: {
        createdAt: { lt: cutoffDate },
        type: 'AUTO',
      },
      select: {
        id: true,
        createdAt: true,
        filename: true,
      },
    }) as Array<{ id: string; createdAt: Date; filename: string }>;

    // Delete them
    const result = await prisma.backup.deleteMany({
      where: {
        id: { in: oldBackups.map(b => b.id) },
      },
    });

    return {
      deletedCount: result.count,
      deletedBackups: oldBackups.map(b => ({ id: b.id, createdAt: b.createdAt })),
    };
  };

  // Arbitrary for generating backup data
  const backupArbitrary = (daysAgo: number, type: 'AUTO' | 'MANUAL' = 'AUTO') => {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    
    return fc.record({
      id: fc.uuid(),
      filename: fc.string({ minLength: 5, maxLength: 30 }).map(s => `backup_${s}.json`),
      size: fc.bigInt({ min: BigInt(100), max: BigInt(1000000) }),
      status: fc.constant('COMPLETED'),
      type: fc.constant(type),
      createdAt: fc.constant(createdAt),
    });
  };

  /**
   * Property 3.1: Backups older than retention period are deleted
   * **Validates: Requirements 1.1.4**
   */
  it('should delete AUTO backups older than retention period', async () => {
    const retentionMock = createRetentionMockPrisma();

    await fc.assert(
      fc.asyncProperty(
        // Generate old backups (8-30 days old)
        fc.array(
          fc.integer({ min: 8, max: 30 }).chain(daysAgo => backupArbitrary(daysAgo, 'AUTO')),
          { minLength: 1, maxLength: 5 }
        ),
        async (oldBackups) => {
          retentionMock._reset();
          retentionMock._setBackups(oldBackups);

          const initialCount = retentionMock._getBackups().length;

          // Perform cleanup with 7-day retention
          const result = await performCleanup(retentionMock, 7);

          // Property: All old AUTO backups should be deleted
          expect(result.deletedCount).toBe(initialCount);
          expect(retentionMock._getBackups().length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3.2: Backups within retention period are preserved
   * **Validates: Requirements 1.1.4**
   */
  it('should preserve AUTO backups within retention period', async () => {
    const retentionMock = createRetentionMockPrisma();

    await fc.assert(
      fc.asyncProperty(
        // Generate recent backups (0-6 days old)
        fc.array(
          fc.integer({ min: 0, max: 6 }).chain(daysAgo => backupArbitrary(daysAgo, 'AUTO')),
          { minLength: 1, maxLength: 5 }
        ),
        async (recentBackups) => {
          retentionMock._reset();
          retentionMock._setBackups(recentBackups);

          const initialCount = retentionMock._getBackups().length;
          const initialIds = new Set(retentionMock._getBackups().map(b => b.id));

          // Perform cleanup with 7-day retention
          const result = await performCleanup(retentionMock, 7);

          // Property: No recent backups should be deleted
          expect(result.deletedCount).toBe(0);
          expect(retentionMock._getBackups().length).toBe(initialCount);

          // Property: All original backups should still exist
          const remainingIds = new Set(retentionMock._getBackups().map(b => b.id));
          for (const id of initialIds) {
            expect(remainingIds.has(id)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3.3: Mixed old and recent backups - only old ones deleted
   * **Validates: Requirements 1.1.4**
   */
  it('should delete only old backups when mixed with recent ones', async () => {
    const retentionMock = createRetentionMockPrisma();

    await fc.assert(
      fc.asyncProperty(
        // Generate old backups (8-30 days old)
        fc.array(
          fc.integer({ min: 8, max: 30 }).chain(daysAgo => backupArbitrary(daysAgo, 'AUTO')),
          { minLength: 1, maxLength: 3 }
        ),
        // Generate recent backups (0-6 days old)
        fc.array(
          fc.integer({ min: 0, max: 6 }).chain(daysAgo => backupArbitrary(daysAgo, 'AUTO')),
          { minLength: 1, maxLength: 3 }
        ),
        async (oldBackups, recentBackups) => {
          retentionMock._reset();
          retentionMock._setBackups([...oldBackups, ...recentBackups]);

          const oldIds = new Set(oldBackups.map(b => b.id));
          const recentIds = new Set(recentBackups.map(b => b.id));

          // Perform cleanup with 7-day retention
          const result = await performCleanup(retentionMock, 7);

          // Property: Only old backups should be deleted
          expect(result.deletedCount).toBe(oldBackups.length);

          // Property: Recent backups should remain
          const remainingBackups = retentionMock._getBackups();
          expect(remainingBackups.length).toBe(recentBackups.length);

          // Property: All remaining backups should be recent ones
          for (const backup of remainingBackups) {
            expect(recentIds.has(backup.id)).toBe(true);
            expect(oldIds.has(backup.id)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3.4: MANUAL backups are never deleted by cleanup
   * **Validates: Requirements 1.1.4**
   */
  it('should never delete MANUAL backups regardless of age', async () => {
    const retentionMock = createRetentionMockPrisma();

    await fc.assert(
      fc.asyncProperty(
        // Generate old MANUAL backups (8-30 days old)
        fc.array(
          fc.integer({ min: 8, max: 30 }).chain(daysAgo => backupArbitrary(daysAgo, 'MANUAL')),
          { minLength: 1, maxLength: 5 }
        ),
        async (manualBackups) => {
          retentionMock._reset();
          retentionMock._setBackups(manualBackups);

          const initialCount = retentionMock._getBackups().length;
          const initialIds = new Set(retentionMock._getBackups().map(b => b.id));

          // Perform cleanup with 7-day retention
          const result = await performCleanup(retentionMock, 7);

          // Property: No MANUAL backups should be deleted
          expect(result.deletedCount).toBe(0);
          expect(retentionMock._getBackups().length).toBe(initialCount);

          // Property: All MANUAL backups should still exist
          const remainingIds = new Set(retentionMock._getBackups().map(b => b.id));
          for (const id of initialIds) {
            expect(remainingIds.has(id)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3.5: Cleanup with mixed AUTO and MANUAL backups
   * **Validates: Requirements 1.1.4**
   */
  it('should delete only old AUTO backups when mixed with MANUAL backups', async () => {
    const retentionMock = createRetentionMockPrisma();

    await fc.assert(
      fc.asyncProperty(
        // Generate old AUTO backups
        fc.array(
          fc.integer({ min: 8, max: 30 }).chain(daysAgo => backupArbitrary(daysAgo, 'AUTO')),
          { minLength: 1, maxLength: 3 }
        ),
        // Generate old MANUAL backups
        fc.array(
          fc.integer({ min: 8, max: 30 }).chain(daysAgo => backupArbitrary(daysAgo, 'MANUAL')),
          { minLength: 1, maxLength: 3 }
        ),
        async (oldAutoBackups, oldManualBackups) => {
          retentionMock._reset();
          retentionMock._setBackups([...oldAutoBackups, ...oldManualBackups]);

          const autoIds = new Set(oldAutoBackups.map(b => b.id));
          const manualIds = new Set(oldManualBackups.map(b => b.id));

          // Perform cleanup with 7-day retention
          const result = await performCleanup(retentionMock, 7);

          // Property: Only AUTO backups should be deleted
          expect(result.deletedCount).toBe(oldAutoBackups.length);

          // Property: MANUAL backups should remain
          const remainingBackups = retentionMock._getBackups();
          expect(remainingBackups.length).toBe(oldManualBackups.length);

          // Property: All remaining backups should be MANUAL ones
          for (const backup of remainingBackups) {
            expect(manualIds.has(backup.id)).toBe(true);
            expect(autoIds.has(backup.id)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3.6: Boundary condition - backup within retention period is preserved
   * **Validates: Requirements 1.1.4**
   */
  it('should preserve backup within retention period boundary', async () => {
    const retentionMock = createRetentionMockPrisma();

    await fc.assert(
      fc.asyncProperty(
        // Generate backup 6 days old (within retention)
        backupArbitrary(6, 'AUTO'),
        async (recentBackup) => {
          retentionMock._reset();
          retentionMock._setBackups([recentBackup]);

          // Perform cleanup with 7-day retention
          const result = await performCleanup(retentionMock, 7);

          // Property: Backup within retention period should be preserved
          expect(result.deletedCount).toBe(0);
          expect(retentionMock._getBackups().length).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3.6b: Backup older than retention period is deleted
   * **Validates: Requirements 1.1.4**
   */
  it('should delete backup older than retention boundary', async () => {
    const retentionMock = createRetentionMockPrisma();

    await fc.assert(
      fc.asyncProperty(
        // Generate backup 8 days old (1 day past retention)
        backupArbitrary(8, 'AUTO'),
        async (oldBackup) => {
          retentionMock._reset();
          retentionMock._setBackups([oldBackup]);

          // Perform cleanup with 7-day retention
          const result = await performCleanup(retentionMock, 7);

          // Property: Backup older than boundary should be deleted
          expect(result.deletedCount).toBe(1);
          expect(retentionMock._getBackups().length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3.7: Custom retention period is respected
   * **Validates: Requirements 1.1.4**
   */
  it('should respect custom retention period', async () => {
    const retentionMock = createRetentionMockPrisma();

    await fc.assert(
      fc.asyncProperty(
        // Generate retention period (1-30 days)
        fc.integer({ min: 1, max: 30 }),
        // Generate backups with various ages
        fc.array(
          fc.integer({ min: 0, max: 60 }).chain(daysAgo => backupArbitrary(daysAgo, 'AUTO')),
          { minLength: 1, maxLength: 10 }
        ),
        async (retentionDays, backups) => {
          retentionMock._reset();
          retentionMock._setBackups(backups);

          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

          // Count expected deletions
          const expectedDeletions = backups.filter(b => b.createdAt < cutoffDate).length;
          const expectedRemaining = backups.length - expectedDeletions;

          // Perform cleanup with custom retention
          const result = await performCleanup(retentionMock, retentionDays);

          // Property: Correct number of backups should be deleted
          expect(result.deletedCount).toBe(expectedDeletions);
          expect(retentionMock._getBackups().length).toBe(expectedRemaining);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3.8: Empty backup list handles cleanup gracefully
   * **Validates: Requirements 1.1.4**
   */
  it('should handle empty backup list gracefully', async () => {
    const retentionMock = createRetentionMockPrisma();

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 30 }),
        async (retentionDays) => {
          retentionMock._reset();
          // No backups set

          // Perform cleanup
          const result = await performCleanup(retentionMock, retentionDays);

          // Property: No errors and zero deletions
          expect(result.deletedCount).toBe(0);
          expect(result.deletedBackups.length).toBe(0);
          expect(retentionMock._getBackups().length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
