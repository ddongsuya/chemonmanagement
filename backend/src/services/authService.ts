import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient, User, UserStatus, Department, Position } from '@prisma/client';
import { AppError, ErrorCodes } from '../types/error';
import {
  RegisterRequest,
  LoginRequest,
  ChangePasswordRequest,
  LoginResponse,
  AuthUser,
  TokenPayload,
} from '../types/auth';

const SALT_ROUNDS = 10;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

// 부장급 이상 직급 (전체 데이터 조회 권한 부여)
const SENIOR_POSITIONS: Position[] = ['CENTER_HEAD', 'DIVISION_HEAD', 'CEO', 'CHAIRMAN'];

export class AuthService {
  private prisma: PrismaClient;
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiry: string;
  private refreshTokenExpiry: string;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    
    // 환경 변수에서 JWT 시크릿 로드
    const accessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    
    // 환경 변수 미설정 시 경고 (서버는 시작되도록)
    if (!accessSecret || !refreshSecret) {
      console.warn('⚠️  WARNING: JWT 시크릿 환경 변수가 설정되지 않았습니다. 기본값을 사용합니다.');
      if (process.env.NODE_ENV === 'production') {
        console.error('🚨 SECURITY WARNING: 프로덕션 환경에서는 반드시 JWT_ACCESS_SECRET, JWT_REFRESH_SECRET을 설정하세요!');
      }
    }
    
    this.accessTokenSecret = accessSecret || 'chemon-access-secret-change-in-production';
    this.refreshTokenSecret = refreshSecret || 'chemon-refresh-secret-change-in-production';
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  }

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate access token
   */
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload as object, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload as object, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
    } as jwt.SignOptions);
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.accessTokenSecret) as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('토큰이 만료되었습니다', 401, ErrorCodes.AUTH_TOKEN_EXPIRED);
      }
      throw new AppError('유효하지 않은 토큰입니다', 401, ErrorCodes.AUTH_TOKEN_INVALID);
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.refreshTokenSecret) as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('리프레시 토큰이 만료되었습니다', 401, ErrorCodes.AUTH_TOKEN_EXPIRED);
      }
      throw new AppError('유효하지 않은 리프레시 토큰입니다', 401, ErrorCodes.AUTH_TOKEN_INVALID);
    }
  }

  /**
   * Convert User to AuthUser (without password)
   */
  private toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      department: user.department,
      position: user.position,
      title: user.title,
      role: user.role,
      status: user.status,
      canViewAllSales: user.canViewAllSales,
      canViewAllData: user.canViewAllData,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Check if account is locked
   */
  private isAccountLocked(user: User): boolean {
    if (user.status === UserStatus.LOCKED && user.lockedUntil) {
      if (new Date() < user.lockedUntil) {
        return true;
      }
    }
    return false;
  }

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthUser> {
    // Check for existing email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('이미 사용 중인 이메일입니다', 409, ErrorCodes.DUPLICATE_RESOURCE);
    }

    // Hash password
    const hashedPassword = await this.hashPassword(data.password);

    // Validate and convert department to enum
    let departmentEnum: Department | null = null;
    if (data.department) {
      if (['BD1', 'BD2', 'SUPPORT'].includes(data.department)) {
        departmentEnum = data.department as Department;
      }
    }

    // Validate and convert position to enum
    let positionEnum: Position | null = null;
    if (data.position) {
      const validPositions = ['STAFF', 'SENIOR', 'ASSISTANT', 'MANAGER', 'DEPUTY', 'GENERAL', 'DIRECTOR', 'CEO', 'CHAIRMAN'];
      if (validPositions.includes(data.position)) {
        positionEnum = data.position as Position;
      }
    }

    // 전체 데이터 조회 권한 자동 설정
    // 1. 부장급 이상 (GENERAL, DIRECTOR, CEO, CHAIRMAN)
    // 2. 사업지원팀 (SUPPORT)
    const canViewAllData = 
      (positionEnum && SENIOR_POSITIONS.includes(positionEnum)) ||
      departmentEnum === 'SUPPORT';

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        phone: data.phone || null,
        department: departmentEnum,
        position: positionEnum,
        canViewAllData,
        canViewAllSales: canViewAllData, // 전체 데이터 조회 권한이 있으면 매출 조회 권한도 부여
      },
    });

    return this.toAuthUser(user);
  }

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError('이메일 또는 비밀번호가 올바르지 않습니다', 401, ErrorCodes.AUTH_INVALID_CREDENTIALS);
    }

    // Check if account is inactive
    if (user.status === UserStatus.INACTIVE) {
      throw new AppError('비활성화된 계정입니다', 401, ErrorCodes.AUTH_ACCOUNT_INACTIVE);
    }

    // Check if account is locked
    if (this.isAccountLocked(user)) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil!.getTime() - Date.now()) / (1000 * 60)
      );
      throw new AppError(
        `계정이 잠금 상태입니다. ${remainingMinutes}분 후에 다시 시도해주세요`,
        401,
        ErrorCodes.AUTH_ACCOUNT_LOCKED
      );
    }

    // Auto-unlock if lockout period has passed
    if (user.status === UserStatus.LOCKED && user.lockedUntil && new Date() >= user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          status: UserStatus.ACTIVE,
          loginAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(data.password, user.password);

    if (!isValidPassword) {
      // Increment login attempts
      const newAttempts = user.loginAttempts + 1;
      
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        // Lock account
        const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            loginAttempts: newAttempts,
            status: UserStatus.LOCKED,
            lockedUntil,
          },
        });
        throw new AppError(
          `로그인 시도가 ${MAX_LOGIN_ATTEMPTS}회 실패하여 계정이 ${LOCKOUT_DURATION_MINUTES}분간 잠금되었습니다`,
          401,
          ErrorCodes.AUTH_ACCOUNT_LOCKED
        );
      } else {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { loginAttempts: newAttempts },
        });
        throw new AppError(
          `이메일 또는 비밀번호가 올바르지 않습니다 (${newAttempts}/${MAX_LOGIN_ATTEMPTS})`,
          401,
          ErrorCodes.AUTH_INVALID_CREDENTIALS
        );
      }
    }

    // Reset login attempts on successful login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lastLoginAt: new Date(),
        status: user.status === UserStatus.LOCKED ? UserStatus.ACTIVE : user.status,
        lockedUntil: null,
      },
    });

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    // Store refresh token in database
    const refreshTokenExpiry = this.parseExpiry(this.refreshTokenExpiry);
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + refreshTokenExpiry),
      },
    });

    // Get unread notifications count
    const unreadNotifications = await this.prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: this.toAuthUser(user),
      unreadNotifications,
    };
  }

  /**
   * Parse expiry string to milliseconds
   */
  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 15 * 60 * 1000; // default 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 15 * 60 * 1000;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    // Verify refresh token
    const payload = this.verifyRefreshToken(refreshToken);

    // Check if refresh token exists in database
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new AppError('유효하지 않은 리프레시 토큰입니다', 401, ErrorCodes.AUTH_TOKEN_INVALID);
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new AppError('리프레시 토큰이 만료되었습니다', 401, ErrorCodes.AUTH_TOKEN_EXPIRED);
    }

    // Check user status
    if (storedToken.user.status === UserStatus.INACTIVE) {
      throw new AppError('비활성화된 계정입니다', 401, ErrorCodes.AUTH_ACCOUNT_INACTIVE);
    }

    if (this.isAccountLocked(storedToken.user)) {
      throw new AppError('계정이 잠금 상태입니다', 401, ErrorCodes.AUTH_ACCOUNT_LOCKED);
    }

    // Generate new access token
    const newAccessToken = this.generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: storedToken.user.role,
    });

    return { accessToken: newAccessToken };
  }

  /**
   * Logout user (invalidate refresh token)
   */
  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      // Delete specific refresh token
      await this.prisma.refreshToken.deleteMany({
        where: {
          userId,
          token: refreshToken,
        },
      });
    } else {
      // Delete all refresh tokens for user
      await this.prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }
  }

  /**
   * Change password
   */
  async changePassword(userId: string, data: ChangePasswordRequest): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('사용자를 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    // Verify old password
    const isValidPassword = await this.verifyPassword(data.oldPassword, user.password);
    if (!isValidPassword) {
      throw new AppError('현재 비밀번호가 올바르지 않습니다', 401, ErrorCodes.AUTH_INVALID_CREDENTIALS);
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(data.newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Invalidate all refresh tokens (force re-login)
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  /**
   * Get current user
   */
  async getCurrentUser(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('사용자를 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    return this.toAuthUser(user);
  }

  /**
   * Check if user is locked
   */
  async isUserLocked(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return false;
    return this.isAccountLocked(user);
  }

  /**
   * Get login attempts count
   */
  async getLoginAttempts(email: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user?.loginAttempts ?? 0;
  }
}

export default AuthService;
