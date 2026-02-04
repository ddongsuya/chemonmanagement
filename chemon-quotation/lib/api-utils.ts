// 공통 API 유틸리티 - 토큰 관리 및 에러 핸들링
import { getAccessToken, getRefreshToken, clearTokens } from './auth-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const ACCESS_TOKEN_KEY = 'access_token';

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

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 토큰 갱신 시도
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

// 로그인 페이지로 리다이렉트
function redirectToLogin(): void {
  if (typeof window !== 'undefined') {
    // 현재 페이지가 이미 로그인 페이지가 아닌 경우에만 리다이렉트
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }
}

/**
 * 공통 API fetch 함수
 * - 자동 토큰 첨부
 * - 401 에러 시 토큰 갱신 후 재시도
 * - 토큰 갱신 실패 시 로그인 페이지로 리다이렉트
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  skipAuthRedirect = false
): Promise<ApiResponse<T>> {
  // endpoint가 /api로 시작하지 않으면 자동으로 추가
  const normalizedEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;
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

    // 401 에러 처리 - 토큰 갱신 시도
    if (response.status === 401 && accessToken) {
      const refreshed = await tryRefreshToken();
      
      if (refreshed) {
        // 새 토큰으로 재시도
        const newAccessToken = getAccessToken();
        (headers as Record<string, string>)['Authorization'] = `Bearer ${newAccessToken}`;
        
        const retryResponse = await fetch(url, { ...options, headers });
        const retryData = await retryResponse.json();
        
        // 재시도도 실패하면 에러 반환
        if (!retryResponse.ok) {
          return {
            success: false,
            error: {
              code: retryData.error?.code || 'REQUEST_FAILED',
              message: retryData.error?.message || retryData.message || '요청 처리에 실패했습니다.',
            },
          };
        }
        
        return retryData;
      } else {
        // 토큰 갱신 실패 - 로그인 페이지로 리다이렉트
        if (!skipAuthRedirect) {
          redirectToLogin();
        }
        return {
          success: false,
          error: {
            code: 'AUTH_TOKEN_EXPIRED',
            message: '세션이 만료되었습니다. 다시 로그인해주세요.',
          },
        };
      }
    }

    const data = await response.json();

    // 응답이 실패인 경우 에러 형식으로 반환
    if (!response.ok) {
      return {
        success: false,
        error: {
          code: data.error?.code || 'REQUEST_FAILED',
          message: data.error?.message || data.message || '요청 처리에 실패했습니다.',
        },
      };
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

/**
 * 쿼리 스트링 빌더
 */
export function buildQueryString(filters: Record<string, unknown> | object): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  return params.toString();
}

export { API_BASE_URL };
