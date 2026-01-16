import { PrismaClient } from '@prisma/client';
import { AppError, ErrorCodes } from '../types/error';
import {
  SystemSettings,
  SettingChange,
  DEFAULT_SETTINGS,
  SETTING_KEYS,
  SettingKey,
} from '../types/settings';

export class SettingsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get all system settings
   * Returns default values for any settings not found in database
   */
  async get(): Promise<SystemSettings> {
    const dbSettings = await this.prisma.systemSetting.findMany();
    
    const settingsMap = new Map<string, string>();
    for (const setting of dbSettings) {
      settingsMap.set(setting.key, setting.value);
    }

    return {
      allowRegistration: this.parseBoolean(
        settingsMap.get(SETTING_KEYS.ALLOW_REGISTRATION),
        DEFAULT_SETTINGS.allowRegistration
      ),
      defaultUserRole: 'USER', // Always USER as per design
      sessionTimeout: this.parseNumber(
        settingsMap.get(SETTING_KEYS.SESSION_TIMEOUT),
        DEFAULT_SETTINGS.sessionTimeout
      ),
      maxLoginAttempts: this.parseNumber(
        settingsMap.get(SETTING_KEYS.MAX_LOGIN_ATTEMPTS),
        DEFAULT_SETTINGS.maxLoginAttempts
      ),
      lockoutDuration: this.parseNumber(
        settingsMap.get(SETTING_KEYS.LOCKOUT_DURATION),
        DEFAULT_SETTINGS.lockoutDuration
      ),
      smtpHost: settingsMap.get(SETTING_KEYS.SMTP_HOST) ?? DEFAULT_SETTINGS.smtpHost,
      smtpPort: this.parseNumber(
        settingsMap.get(SETTING_KEYS.SMTP_PORT),
        DEFAULT_SETTINGS.smtpPort
      ),
      smtpUser: settingsMap.get(SETTING_KEYS.SMTP_USER) ?? DEFAULT_SETTINGS.smtpUser,
      smtpFrom: settingsMap.get(SETTING_KEYS.SMTP_FROM) ?? DEFAULT_SETTINGS.smtpFrom,
    };
  }

  /**
   * Update system settings
   * Records change history for each modified setting
   */
  async update(
    adminId: string,
    settings: Partial<SystemSettings>
  ): Promise<SystemSettings> {
    // Validate the admin exists
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new AppError('관리자를 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    // Validate settings values
    this.validateSettings(settings);

    // Get current settings for comparison
    const currentSettings = await this.get();

    // Update each setting that was provided
    const updates: Array<{ key: SettingKey; oldValue: string | null; newValue: string }> = [];

    for (const [key, value] of Object.entries(settings)) {
      if (value === undefined) continue;
      
      const settingKey = key as SettingKey;
      const newValue = String(value);
      const oldValue = String(currentSettings[key as keyof SystemSettings]);

      // Only update if value changed
      if (newValue !== oldValue) {
        updates.push({ key: settingKey, oldValue, newValue });
      }
    }

    // Perform updates in a transaction
    if (updates.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        for (const update of updates) {
          // Upsert the setting
          await tx.systemSetting.upsert({
            where: { key: update.key },
            update: { value: update.newValue },
            create: { key: update.key, value: update.newValue },
          });

          // Record the change history
          await tx.settingHistory.create({
            data: {
              key: update.key,
              oldValue: update.oldValue,
              newValue: update.newValue,
              changedBy: adminId,
            },
          });
        }
      });
    }

    // Return updated settings
    return this.get();
  }

  /**
   * Get setting change history
   */
  async getChangeHistory(limit: number = 50): Promise<SettingChange[]> {
    const history = await this.prisma.settingHistory.findMany({
      take: limit,
      orderBy: { changedAt: 'desc' },
    });

    return history.map((h) => ({
      id: h.id,
      key: h.key,
      oldValue: h.oldValue,
      newValue: h.newValue,
      changedBy: h.changedBy,
      changedAt: h.changedAt,
    }));
  }

  /**
   * Get a single setting value
   */
  async getSetting(key: SettingKey): Promise<string | null> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });
    return setting?.value ?? null;
  }

  /**
   * Initialize default settings if they don't exist
   */
  async initializeDefaults(): Promise<void> {
    const existingSettings = await this.prisma.systemSetting.findMany();
    const existingKeys = new Set(existingSettings.map((s) => s.key));

    const defaultEntries = Object.entries(DEFAULT_SETTINGS);
    
    for (const [key, value] of defaultEntries) {
      if (!existingKeys.has(key)) {
        await this.prisma.systemSetting.create({
          data: {
            key,
            value: String(value),
          },
        });
      }
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Parse boolean from string
   */
  private parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
    if (value === undefined) return defaultValue;
    return value === 'true';
  }

  /**
   * Parse number from string
   */
  private parseNumber(value: string | undefined, defaultValue: number): number {
    if (value === undefined) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Validate settings values
   */
  private validateSettings(settings: Partial<SystemSettings>): void {
    const errors: Record<string, string[]> = {};

    if (settings.sessionTimeout !== undefined) {
      if (settings.sessionTimeout < 1 || settings.sessionTimeout > 1440) {
        errors.sessionTimeout = ['세션 타임아웃은 1분에서 1440분(24시간) 사이여야 합니다'];
      }
    }

    if (settings.maxLoginAttempts !== undefined) {
      if (settings.maxLoginAttempts < 1 || settings.maxLoginAttempts > 10) {
        errors.maxLoginAttempts = ['최대 로그인 시도 횟수는 1에서 10 사이여야 합니다'];
      }
    }

    if (settings.lockoutDuration !== undefined) {
      if (settings.lockoutDuration < 1 || settings.lockoutDuration > 1440) {
        errors.lockoutDuration = ['잠금 기간은 1분에서 1440분(24시간) 사이여야 합니다'];
      }
    }

    if (settings.smtpPort !== undefined) {
      if (settings.smtpPort < 1 || settings.smtpPort > 65535) {
        errors.smtpPort = ['SMTP 포트는 1에서 65535 사이여야 합니다'];
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new AppError(
        '잘못된 설정 값이 입력되었습니다',
        400,
        ErrorCodes.VALIDATION_ERROR,
        errors
      );
    }
  }
}

export default SettingsService;
