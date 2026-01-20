// Settings API functions
import { getAccessToken } from './auth-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ============ Types ============

export interface SystemSettings {
  allowRegistration: boolean;
  defaultUserRole: string;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
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
  changedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ============ API Helper ============

async function settingsFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const accessToken = getAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: '네트워크 오류가 발생했습니다.',
      },
    };
  }
}

// ============ Settings APIs ============

/**
 * Get system settings
 */
export async function getSystemSettings(): Promise<ApiResponse<SystemSettings>> {
  return settingsFetch<SystemSettings>('/api/admin/settings');
}

/**
 * Update system settings
 */
export async function updateSystemSettings(
  settings: Partial<SystemSettings>
): Promise<ApiResponse<SystemSettings>> {
  return settingsFetch<SystemSettings>('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

/**
 * Get settings change history
 */
export async function getSettingsHistory(
  limit: number = 50
): Promise<ApiResponse<SettingChange[]>> {
  return settingsFetch<SettingChange[]>(`/api/admin/settings/history?limit=${limit}`);
}
