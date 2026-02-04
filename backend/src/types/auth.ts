import { z } from 'zod';

// 직급 Enum 값
export const POSITION_VALUES = ['MANAGER', 'CENTER_HEAD', 'DIVISION_HEAD', 'CEO', 'CHAIRMAN'] as const;
export type PositionType = typeof POSITION_VALUES[number];

// 직급 한글 라벨
export const POSITION_LABELS: Record<PositionType, string> = {
  MANAGER: '매니저',
  CENTER_HEAD: '센터장',
  DIVISION_HEAD: '본부장',
  CEO: '대표',
  CHAIRMAN: '회장',
};

// 직책 Enum 값
export const TITLE_VALUES = ['TEAM_LEADER'] as const;
export type TitleType = typeof TITLE_VALUES[number];

// 직책 한글 라벨
export const TITLE_LABELS: Record<TitleType, string> = {
  TEAM_LEADER: '팀장',
};

// Validation schemas
export const registerSchema = z.object({
  email: z.string().email('유효한 이메일 형식이 아닙니다'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  name: z.string().min(1, '이름은 필수입니다'),
  phone: z.string().optional(),
  department: z.enum(['BD1', 'BD2', 'SUPPORT']).optional(),
  position: z.enum(POSITION_VALUES).optional(),
  title: z.enum(TITLE_VALUES).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('유효한 이메일 형식이 아닙니다'),
  password: z.string().min(1, '비밀번호는 필수입니다'),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, '현재 비밀번호는 필수입니다'),
  newPassword: z.string().min(8, '새 비밀번호는 8자 이상이어야 합니다'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, '리프레시 토큰은 필수입니다'),
});

// Types
export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  department: 'BD1' | 'BD2' | 'SUPPORT' | null;
  position: PositionType | null;
  title: TitleType | null;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  canViewAllSales: boolean;
  canViewAllData: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  unreadNotifications: number;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface JwtConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
}
