import { z } from 'zod';

// Settings types

export interface SystemSettings {
  allowRegistration: boolean;
  defaultUserRole: 'USER';
  sessionTimeout: number; // minutes
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpFrom: string;
}

export interface SettingChange {
  id: string;
  key: string;
  oldValue: string | null;
  newValue: string;
  changedBy: string;
  changedAt: Date;
}

// Default system settings
export const DEFAULT_SETTINGS: SystemSettings = {
  allowRegistration: true,
  defaultUserRole: 'USER',
  sessionTimeout: 60, // 60 minutes
  maxLoginAttempts: 5,
  lockoutDuration: 15, // 15 minutes
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpFrom: '',
};

// Setting keys for database storage
export const SETTING_KEYS = {
  ALLOW_REGISTRATION: 'allowRegistration',
  DEFAULT_USER_ROLE: 'defaultUserRole',
  SESSION_TIMEOUT: 'sessionTimeout',
  MAX_LOGIN_ATTEMPTS: 'maxLoginAttempts',
  LOCKOUT_DURATION: 'lockoutDuration',
  SMTP_HOST: 'smtpHost',
  SMTP_PORT: 'smtpPort',
  SMTP_USER: 'smtpUser',
  SMTP_FROM: 'smtpFrom',
} as const;

export type SettingKey = typeof SETTING_KEYS[keyof typeof SETTING_KEYS];

// Zod validation schemas for settings API

/**
 * Schema for updating system settings
 * All fields are optional since partial updates are allowed
 */
export const updateSettingsSchema = z.object({
  allowRegistration: z.boolean().optional(),
  sessionTimeout: z.number().int().min(1).max(1440).optional(),
  maxLoginAttempts: z.number().int().min(1).max(10).optional(),
  lockoutDuration: z.number().int().min(1).max(1440).optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().min(1).max(65535).optional(),
  smtpUser: z.string().optional(),
  smtpFrom: z.string().email().or(z.literal('')).optional(),
});

export type UpdateSettingsDTO = z.infer<typeof updateSettingsSchema>;

/**
 * Schema for settings history query parameters
 */
export const settingsHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type SettingsHistoryQuery = z.infer<typeof settingsHistoryQuerySchema>;
