// Authentication API functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  department: string | null;
  position: string | null;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  department?: string;
  position?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  unreadNotifications: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Token management functions
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}


// API request helper with authentication
async function authFetch<T>(
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

    if (!response.ok) {
      // Handle token expiration - try to refresh
      if (response.status === 401 && accessToken) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          // Retry the original request with new token
          const newAccessToken = getAccessToken();
          (headers as Record<string, string>)['Authorization'] = `Bearer ${newAccessToken}`;
          const retryResponse = await fetch(url, { ...options, headers });
          return retryResponse.json();
        }
      }
      return data;
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: '네트워크 오류가 발생했습니다. 서버 연결을 확인해주세요.',
      },
    };
  }
}

// Try to refresh the access token
async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return false;
    }

    const data: ApiResponse<{ accessToken: string }> = await response.json();
    if (data.success && data.data?.accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, data.data.accessToken);
      return true;
    }

    clearTokens();
    return false;
  } catch {
    clearTokens();
    return false;
  }
}

// Auth API functions
export async function login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  const response = await authFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  if (response.success && response.data) {
    setTokens(response.data.accessToken, response.data.refreshToken);
  }

  return response;
}

export async function register(data: RegisterRequest): Promise<ApiResponse<{ user: AuthUser }>> {
  return authFetch<{ user: AuthUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function logout(): Promise<ApiResponse<void>> {
  const refreshToken = getRefreshToken();
  const response = await authFetch<void>('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
  clearTokens();
  return response;
}

export async function getCurrentUser(): Promise<ApiResponse<{ user: AuthUser }>> {
  return authFetch<{ user: AuthUser }>('/api/auth/me');
}

export async function changePassword(data: ChangePasswordRequest): Promise<ApiResponse<void>> {
  return authFetch<void>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function refreshAccessToken(): Promise<ApiResponse<{ accessToken: string }>> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return {
      success: false,
      error: {
        code: 'NO_REFRESH_TOKEN',
        message: '리프레시 토큰이 없습니다',
      },
    };
  }

  const response = await authFetch<{ accessToken: string }>('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });

  if (response.success && response.data?.accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, response.data.accessToken);
  }

  return response;
}
