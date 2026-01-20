/**
 * Property-Based Tests for Settings Service
 * Feature: backend-admin-system
 * 
 * These tests verify universal properties of the settings management system
 * using fast-check for property-based testing.
 */

/// <reference types="jest" />

import * as fc from 'fast-check';
import { SettingsService } from '../../src/services/settingsService';
import { PrismaClient } from '@prisma/client';
import { SystemSettings, DEFAULT_SETTINGS, SETTING_KEYS } from '../../src/types/settings';

// Mock PrismaClient for unit testing
const createMockPrisma = () => {
  const mockTransaction = jest.fn();
  
  return {
    user: {
      findUnique: jest.fn(),
    },
    systemSetting: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      create: jest.fn(),
    },
    settingHistory: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: mockTransaction,
  } as unknown as PrismaClient;
};

describe('Settings Property Tests', () => {
  let settingsService: SettingsService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    settingsService = new SettingsService(mockPrisma);
    jest.clearAllMocks();
  });

  /**
   * Property 20: 설정 변경 이력 기록
   * Feature: backend-admin-system, Property 20: 설정 변경 이력 기록
   * 
   * For any system setting change, SettingHistory should record:
   * - The previous value (oldValue)
   * - The new value (newValue)
   * - Who made the change (changedBy)
   * - When the change was made (changedAt)
   * 
   * Validates: Requirements 9.3
   */
  describe('Property 20: 설정 변경 이력 기록', () => {
    // Arbitrary for generating valid admin user
    const adminUserArb = fc.record({
      id: fc.uuid(),
      email: fc.emailAddress(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      role: fc.constant('ADMIN'),
      status: fc.constant('ACTIVE'),
    });

    // Arbitrary for generating valid session timeout values (1-1440 minutes)
    const sessionTimeoutArb = fc.integer({ min: 1, max: 1440 });

    // Arbitrary for generating valid max login attempts (1-10)
    const maxLoginAttemptsArb = fc.integer({ min: 1, max: 10 });

    // Arbitrary for generating valid lockout duration (1-1440 minutes)
    const lockoutDurationArb = fc.integer({ min: 1, max: 1440 });

    // Arbitrary for generating valid SMTP port (1-65535)
    const smtpPortArb = fc.integer({ min: 1, max: 65535 });

    // Arbitrary for generating boolean settings
    const booleanSettingArb = fc.boolean();

    // Arbitrary for generating string settings
    const stringSettingArb = fc.string({ minLength: 0, maxLength: 100 });

    it('should record history entry for each changed setting', async () => {
      await fc.assert(
        fc.asyncProperty(
          adminUserArb,
          sessionTimeoutArb,
          sessionTimeoutArb,
          async (admin, oldTimeout, newTimeout) => {
            // Skip if values are the same (no change to record)
            if (oldTimeout === newTimeout) return;

            const historyEntries: Array<{
              key: string;
              oldValue: string | null;
              newValue: string;
              changedBy: string;
            }> = [];

            // Mock admin user exists
            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(admin);

            // Mock current settings
            (mockPrisma.systemSetting.findMany as jest.Mock).mockResolvedValue([
              { key: SETTING_KEYS.SESSION_TIMEOUT, value: String(oldTimeout) },
            ]);

            // Mock transaction to capture history entries
            (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
              const txMock = {
                systemSetting: {
                  upsert: jest.fn().mockResolvedValue({}),
                },
                settingHistory: {
                  create: jest.fn().mockImplementation(({ data }) => {
                    historyEntries.push(data);
                    return Promise.resolve({ id: 'history-id', ...data, changedAt: new Date() });
                  }),
                },
              };
              return callback(txMock);
            });

            // Update the setting
            await settingsService.update(admin.id, { sessionTimeout: newTimeout });

            // Property: A history entry should be created for the changed setting
            expect(historyEntries.length).toBe(1);
            
            // Property: History entry should contain correct old value
            expect(historyEntries[0].oldValue).toBe(String(oldTimeout));
            
            // Property: History entry should contain correct new value
            expect(historyEntries[0].newValue).toBe(String(newTimeout));
            
            // Property: History entry should contain correct changer ID
            expect(historyEntries[0].changedBy).toBe(admin.id);
            
            // Property: History entry should have correct key
            expect(historyEntries[0].key).toBe(SETTING_KEYS.SESSION_TIMEOUT);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should record history for multiple settings changed at once', async () => {
      await fc.assert(
        fc.asyncProperty(
          adminUserArb,
          fc.record({
            oldSessionTimeout: sessionTimeoutArb,
            newSessionTimeout: sessionTimeoutArb,
            oldMaxLoginAttempts: maxLoginAttemptsArb,
            newMaxLoginAttempts: maxLoginAttemptsArb,
            oldLockoutDuration: lockoutDurationArb,
            newLockoutDuration: lockoutDurationArb,
          }),
          async (admin, settings) => {
            const historyEntries: Array<{
              key: string;
              oldValue: string | null;
              newValue: string;
              changedBy: string;
            }> = [];

            // Count how many settings actually changed
            const changedSettings: string[] = [];
            if (settings.oldSessionTimeout !== settings.newSessionTimeout) {
              changedSettings.push(SETTING_KEYS.SESSION_TIMEOUT);
            }
            if (settings.oldMaxLoginAttempts !== settings.newMaxLoginAttempts) {
              changedSettings.push(SETTING_KEYS.MAX_LOGIN_ATTEMPTS);
            }
            if (settings.oldLockoutDuration !== settings.newLockoutDuration) {
              changedSettings.push(SETTING_KEYS.LOCKOUT_DURATION);
            }

            // Skip if no settings changed
            if (changedSettings.length === 0) return;

            // Mock admin user exists
            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(admin);

            // Mock current settings
            (mockPrisma.systemSetting.findMany as jest.Mock).mockResolvedValue([
              { key: SETTING_KEYS.SESSION_TIMEOUT, value: String(settings.oldSessionTimeout) },
              { key: SETTING_KEYS.MAX_LOGIN_ATTEMPTS, value: String(settings.oldMaxLoginAttempts) },
              { key: SETTING_KEYS.LOCKOUT_DURATION, value: String(settings.oldLockoutDuration) },
            ]);

            // Mock transaction to capture history entries
            (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
              const txMock = {
                systemSetting: {
                  upsert: jest.fn().mockResolvedValue({}),
                },
                settingHistory: {
                  create: jest.fn().mockImplementation(({ data }) => {
                    historyEntries.push(data);
                    return Promise.resolve({ id: 'history-id', ...data, changedAt: new Date() });
                  }),
                },
              };
              return callback(txMock);
            });

            // Update multiple settings
            await settingsService.update(admin.id, {
              sessionTimeout: settings.newSessionTimeout,
              maxLoginAttempts: settings.newMaxLoginAttempts,
              lockoutDuration: settings.newLockoutDuration,
            });

            // Property: Number of history entries should match number of changed settings
            expect(historyEntries.length).toBe(changedSettings.length);

            // Property: All history entries should have the correct changer ID
            historyEntries.forEach(entry => {
              expect(entry.changedBy).toBe(admin.id);
            });

            // Property: Each changed setting should have a corresponding history entry
            changedSettings.forEach(key => {
              const entry = historyEntries.find(e => e.key === key);
              expect(entry).toBeDefined();
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not create history entry when value does not change', async () => {
      await fc.assert(
        fc.asyncProperty(
          adminUserArb,
          sessionTimeoutArb,
          async (admin, timeout) => {
            const historyEntries: Array<{
              key: string;
              oldValue: string | null;
              newValue: string;
              changedBy: string;
            }> = [];

            // Mock admin user exists
            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(admin);

            // Mock current settings with same value as update
            (mockPrisma.systemSetting.findMany as jest.Mock).mockResolvedValue([
              { key: SETTING_KEYS.SESSION_TIMEOUT, value: String(timeout) },
            ]);

            // Mock transaction to capture history entries
            (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
              const txMock = {
                systemSetting: {
                  upsert: jest.fn().mockResolvedValue({}),
                },
                settingHistory: {
                  create: jest.fn().mockImplementation(({ data }) => {
                    historyEntries.push(data);
                    return Promise.resolve({ id: 'history-id', ...data, changedAt: new Date() });
                  }),
                },
              };
              return callback(txMock);
            });

            // Update with same value
            await settingsService.update(admin.id, { sessionTimeout: timeout });

            // Property: No history entry should be created when value doesn't change
            expect(historyEntries.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should record correct old and new values for boolean settings', async () => {
      await fc.assert(
        fc.asyncProperty(
          adminUserArb,
          booleanSettingArb,
          async (admin, oldValue) => {
            const newValue = !oldValue; // Ensure value changes
            const historyEntries: Array<{
              key: string;
              oldValue: string | null;
              newValue: string;
              changedBy: string;
            }> = [];

            // Mock admin user exists
            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(admin);

            // Mock current settings
            (mockPrisma.systemSetting.findMany as jest.Mock).mockResolvedValue([
              { key: SETTING_KEYS.ALLOW_REGISTRATION, value: String(oldValue) },
            ]);

            // Mock transaction to capture history entries
            (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
              const txMock = {
                systemSetting: {
                  upsert: jest.fn().mockResolvedValue({}),
                },
                settingHistory: {
                  create: jest.fn().mockImplementation(({ data }) => {
                    historyEntries.push(data);
                    return Promise.resolve({ id: 'history-id', ...data, changedAt: new Date() });
                  }),
                },
              };
              return callback(txMock);
            });

            // Update the boolean setting
            await settingsService.update(admin.id, { allowRegistration: newValue });

            // Property: History entry should be created
            expect(historyEntries.length).toBe(1);
            
            // Property: Old value should be string representation of boolean
            expect(historyEntries[0].oldValue).toBe(String(oldValue));
            
            // Property: New value should be string representation of boolean
            expect(historyEntries[0].newValue).toBe(String(newValue));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should record correct old and new values for string settings', async () => {
      await fc.assert(
        fc.asyncProperty(
          adminUserArb,
          stringSettingArb,
          stringSettingArb.filter(s => s.length > 0), // Ensure new value is different
          async (admin, oldSmtpHost, newSmtpHost) => {
            // Skip if values are the same
            if (oldSmtpHost === newSmtpHost) return;

            const historyEntries: Array<{
              key: string;
              oldValue: string | null;
              newValue: string;
              changedBy: string;
            }> = [];

            // Mock admin user exists
            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(admin);

            // Mock current settings
            (mockPrisma.systemSetting.findMany as jest.Mock).mockResolvedValue([
              { key: SETTING_KEYS.SMTP_HOST, value: oldSmtpHost },
            ]);

            // Mock transaction to capture history entries
            (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
              const txMock = {
                systemSetting: {
                  upsert: jest.fn().mockResolvedValue({}),
                },
                settingHistory: {
                  create: jest.fn().mockImplementation(({ data }) => {
                    historyEntries.push(data);
                    return Promise.resolve({ id: 'history-id', ...data, changedAt: new Date() });
                  }),
                },
              };
              return callback(txMock);
            });

            // Update the string setting
            await settingsService.update(admin.id, { smtpHost: newSmtpHost });

            // Property: History entry should be created
            expect(historyEntries.length).toBe(1);
            
            // Property: Old value should match original
            expect(historyEntries[0].oldValue).toBe(oldSmtpHost);
            
            // Property: New value should match update
            expect(historyEntries[0].newValue).toBe(newSmtpHost);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should retrieve change history in descending order by changedAt', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              key: fc.constantFrom(
                SETTING_KEYS.SESSION_TIMEOUT,
                SETTING_KEYS.MAX_LOGIN_ATTEMPTS,
                SETTING_KEYS.LOCKOUT_DURATION
              ),
              oldValue: fc.string({ minLength: 1, maxLength: 10 }),
              newValue: fc.string({ minLength: 1, maxLength: 10 }),
              changedBy: fc.uuid(),
              changedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          async (historyRecords) => {
            // Sort records by changedAt descending (as the service should return)
            const sortedRecords = [...historyRecords].sort(
              (a, b) => b.changedAt.getTime() - a.changedAt.getTime()
            );

            // Mock the history query
            (mockPrisma.settingHistory.findMany as jest.Mock).mockResolvedValue(sortedRecords);

            const result = await settingsService.getChangeHistory(50);

            // Property: Results should be in descending order by changedAt
            for (let i = 1; i < result.length; i++) {
              expect(result[i - 1].changedAt.getTime()).toBeGreaterThanOrEqual(
                result[i].changedAt.getTime()
              );
            }

            // Property: All records should be returned (up to limit)
            expect(result.length).toBe(Math.min(sortedRecords.length, 50));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should respect limit parameter when retrieving change history', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 50 }),
          async (totalRecords, limit) => {
            // Generate mock history records
            const historyRecords = Array.from({ length: totalRecords }, (_, i) => ({
              id: `id-${i}`,
              key: SETTING_KEYS.SESSION_TIMEOUT,
              oldValue: String(i),
              newValue: String(i + 1),
              changedBy: 'admin-id',
              changedAt: new Date(Date.now() - i * 1000),
            }));

            // Mock returns only up to limit
            const limitedRecords = historyRecords.slice(0, limit);
            (mockPrisma.settingHistory.findMany as jest.Mock).mockResolvedValue(limitedRecords);

            const result = await settingsService.getChangeHistory(limit);

            // Property: Result length should not exceed limit
            expect(result.length).toBeLessThanOrEqual(limit);

            // Property: Result length should be min(totalRecords, limit)
            expect(result.length).toBe(Math.min(totalRecords, limit));
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
