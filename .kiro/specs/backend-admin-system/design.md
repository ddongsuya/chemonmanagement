# Design Document: Backend & Admin System

## Overview

CHEMON 견적관리시스템의 백엔드 API 서버, 사용자 인증 시스템, 관리자 페이지를 구축합니다. 기존 Next.js 프론트엔드와 통합되며, PostgreSQL 데이터베이스와 Express.js 기반 REST API를 사용합니다.

### 기술 스택

- **Backend Framework**: Express.js (Node.js)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (Access Token + Refresh Token)
- **Password Hashing**: bcrypt
- **Validation**: Zod
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest + fast-check (property-based testing)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  User Pages  │  │ Admin Panel  │  │  Auth Components     │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Gateway (Express.js)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Auth Routes │  │  API Routes  │  │  Admin Routes        │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Middleware Layer                       │  │
│  │  [Auth] [RateLimit] [Validation] [ErrorHandler] [Logger] │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │AuthService │ │UserService │ │AdminService│ │NotifyService│  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer (Prisma)                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    PostgreSQL Database                      │ │
│  │  [Users] [Quotations] [Customers] [Announcements] [Logs]   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Authentication Module

```typescript
// types/auth.ts
interface User {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "INACTIVE" | "LOCKED";
  createdAt: Date;
  updatedAt: Date;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, "password">;
  unreadNotifications: number;
}

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// services/authService.ts
interface AuthService {
  login(credentials: LoginRequest): Promise<LoginResponse>;
  register(data: RegisterRequest): Promise<User>;
  refreshToken(refreshToken: string): Promise<{ accessToken: string }>;
  logout(userId: string): Promise<void>;
  changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void>;
  resetPassword(userId: string): Promise<string>; // returns temp password
}
```

### 2. User Data Management Module

```typescript
// types/quotation.ts
interface Quotation {
  id: string;
  userId: string;
  customerId: string;
  title: string;
  items: QuotationItem[];
  totalAmount: number;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface Customer {
  id: string;
  userId: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// services/dataService.ts
interface DataService {
  // Quotations
  createQuotation(userId: string, data: CreateQuotationDTO): Promise<Quotation>;
  getQuotations(
    userId: string,
    filters: QuotationFilters
  ): Promise<PaginatedResult<Quotation>>;
  getQuotationById(userId: string, id: string): Promise<Quotation | null>;
  updateQuotation(
    userId: string,
    id: string,
    data: UpdateQuotationDTO
  ): Promise<Quotation>;
  deleteQuotation(userId: string, id: string): Promise<void>;

  // Customers
  createCustomer(userId: string, data: CreateCustomerDTO): Promise<Customer>;
  getCustomers(
    userId: string,
    filters: CustomerFilters
  ): Promise<PaginatedResult<Customer>>;
  updateCustomer(
    userId: string,
    id: string,
    data: UpdateCustomerDTO
  ): Promise<Customer>;
  deleteCustomer(userId: string, id: string): Promise<void>;
}
```

### 3. Admin Module

```typescript
// types/admin.ts
interface UserListFilters {
  search?: string;
  status?: "ACTIVE" | "INACTIVE" | "LOCKED";
  role?: "USER" | "ADMIN";
  page: number;
  limit: number;
}

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  todayQuotations: number;
  totalQuotations: number;
  recentActivity: ActivityLog[];
}

interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: Date;
  ipAddress: string;
}

// services/adminService.ts
interface AdminService {
  // User Management
  getUsers(filters: UserListFilters): Promise<PaginatedResult<User>>;
  getUserById(id: string): Promise<User | null>;
  updateUserStatus(id: string, status: "ACTIVE" | "INACTIVE"): Promise<User>;
  updateUserRole(id: string, role: "USER" | "ADMIN"): Promise<User>;
  resetUserPassword(id: string): Promise<string>;

  // Statistics
  getSystemStats(): Promise<SystemStats>;
  getUsageStats(
    period: "day" | "week" | "month",
    startDate: Date,
    endDate: Date
  ): Promise<UsageStats>;
  getActivityLogs(
    filters: ActivityLogFilters
  ): Promise<PaginatedResult<ActivityLog>>;
}
```

### 4. Announcement Module

```typescript
// types/announcement.ts
interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  viewCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface CreateAnnouncementDTO {
  title: string;
  content: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  startDate: Date;
  endDate: Date;
}

// services/announcementService.ts
interface AnnouncementService {
  create(adminId: string, data: CreateAnnouncementDTO): Promise<Announcement>;
  update(id: string, data: UpdateAnnouncementDTO): Promise<Announcement>;
  delete(id: string): Promise<void>;
  getAll(filters: AnnouncementFilters): Promise<PaginatedResult<Announcement>>;
  getActive(): Promise<Announcement[]>;
  incrementViewCount(id: string): Promise<void>;
  getViewStats(id: string): Promise<AnnouncementViewStats>;
}
```

### 5. Notification Module

```typescript
// types/notification.ts
interface Notification {
  id: string;
  userId: string;
  type: "ANNOUNCEMENT" | "SYSTEM" | "REMINDER";
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

// services/notificationService.ts
interface NotificationService {
  create(userId: string, data: CreateNotificationDTO): Promise<Notification>;
  createBulk(userIds: string[], data: CreateNotificationDTO): Promise<void>;
  getByUser(
    userId: string,
    filters: NotificationFilters
  ): Promise<PaginatedResult<Notification>>;
  markAsRead(userId: string, notificationId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
  deleteOldNotifications(): Promise<number>; // cleanup job
}
```

### 6. Settings Module

```typescript
// types/settings.ts
interface SystemSettings {
  allowRegistration: boolean;
  defaultUserRole: "USER";
  sessionTimeout: number; // minutes
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpFrom: string;
}

interface SettingChange {
  id: string;
  key: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedAt: Date;
}

// services/settingsService.ts
interface SettingsService {
  get(): Promise<SystemSettings>;
  update(
    adminId: string,
    settings: Partial<SystemSettings>
  ): Promise<SystemSettings>;
  getChangeHistory(limit: number): Promise<SettingChange[]>;
}
```

## Data Models

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  USER
  ADMIN
}

enum UserStatus {
  ACTIVE
  INACTIVE
  LOCKED
}

enum QuotationStatus {
  DRAFT
  SENT
  ACCEPTED
  REJECTED
}

enum AnnouncementPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum NotificationType {
  ANNOUNCEMENT
  SYSTEM
  REMINDER
}

model User {
  id            String       @id @default(uuid())
  email         String       @unique
  password      String
  name          String
  role          UserRole     @default(USER)
  status        UserStatus   @default(ACTIVE)
  loginAttempts Int          @default(0)
  lockedUntil   DateTime?
  lastLoginAt   DateTime?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  quotations    Quotation[]
  customers     Customer[]
  notifications Notification[]
  activityLogs  ActivityLog[]
  announcements Announcement[] @relation("CreatedAnnouncements")
  refreshTokens RefreshToken[]
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model Customer {
  id        String    @id @default(uuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  company   String?
  email     String?
  phone     String?
  address   String?
  notes     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  quotations Quotation[]
}

model Quotation {
  id          String          @id @default(uuid())
  userId      String
  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  customerId  String?
  customer    Customer?       @relation(fields: [customerId], references: [id])
  title       String
  description String?
  items       Json
  totalAmount Decimal         @db.Decimal(15, 2)
  status      QuotationStatus @default(DRAFT)
  validUntil  DateTime?
  notes       String?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  deletedAt   DateTime?
}

model Announcement {
  id        String               @id @default(uuid())
  title     String
  content   String
  priority  AnnouncementPriority @default(NORMAL)
  startDate DateTime
  endDate   DateTime
  isActive  Boolean              @default(true)
  viewCount Int                  @default(0)
  createdBy String
  creator   User                 @relation("CreatedAnnouncements", fields: [createdBy], references: [id])
  createdAt DateTime             @default(now())
  updatedAt DateTime             @updatedAt
  deletedAt DateTime?

  views     AnnouncementView[]
}

model AnnouncementView {
  id             String       @id @default(uuid())
  announcementId String
  announcement   Announcement @relation(fields: [announcementId], references: [id], onDelete: Cascade)
  userId         String
  viewedAt       DateTime     @default(now())

  @@unique([announcementId, userId])
}

model Notification {
  id        String           @id @default(uuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      NotificationType
  title     String
  message   String
  isRead    Boolean          @default(false)
  link      String?
  createdAt DateTime         @default(now())
}

model ActivityLog {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  action     String
  resource   String
  resourceId String?
  details    Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())
}

model SystemSetting {
  id        String   @id @default(uuid())
  key       String   @unique
  value     String
  updatedAt DateTime @updatedAt
}

model SettingHistory {
  id        String   @id @default(uuid())
  key       String
  oldValue  String?
  newValue  String
  changedBy String
  changedAt DateTime @default(now())
}

model Backup {
  id        String   @id @default(uuid())
  filename  String
  size      BigInt
  status    String   @default("COMPLETED")
  type      String   @default("AUTO")
  createdAt DateTime @default(now())
}
```

## API Endpoints

### Authentication Routes

```
POST   /api/auth/register     - 회원가입
POST   /api/auth/login        - 로그인
POST   /api/auth/logout       - 로그아웃
POST   /api/auth/refresh      - 토큰 갱신
POST   /api/auth/change-password - 비밀번호 변경
GET    /api/auth/me           - 현재 사용자 정보
```

### User Data Routes

```
GET    /api/quotations        - 견적서 목록 조회
POST   /api/quotations        - 견적서 생성
GET    /api/quotations/:id    - 견적서 상세 조회
PUT    /api/quotations/:id    - 견적서 수정
DELETE /api/quotations/:id    - 견적서 삭제

GET    /api/customers         - 고객 목록 조회
POST   /api/customers         - 고객 생성
GET    /api/customers/:id     - 고객 상세 조회
PUT    /api/customers/:id     - 고객 수정
DELETE /api/customers/:id     - 고객 삭제
```

### Admin Routes

```
GET    /api/admin/users       - 사용자 목록 조회
GET    /api/admin/users/:id   - 사용자 상세 조회
PATCH  /api/admin/users/:id/status - 사용자 상태 변경
PATCH  /api/admin/users/:id/role   - 사용자 권한 변경
POST   /api/admin/users/:id/reset-password - 비밀번호 초기화

GET    /api/admin/stats       - 시스템 통계
GET    /api/admin/stats/usage - 사용량 통계
GET    /api/admin/logs        - 활동 로그

GET    /api/admin/announcements     - 공지사항 목록 (관리자)
POST   /api/admin/announcements     - 공지사항 생성
PUT    /api/admin/announcements/:id - 공지사항 수정
DELETE /api/admin/announcements/:id - 공지사항 삭제

GET    /api/admin/settings    - 시스템 설정 조회
PUT    /api/admin/settings    - 시스템 설정 변경

GET    /api/admin/backups     - 백업 목록
POST   /api/admin/backups     - 수동 백업 생성
POST   /api/admin/backups/:id/restore - 백업 복구
```

### Public Routes

```
GET    /api/announcements     - 활성 공지사항 목록
GET    /api/announcements/:id - 공지사항 상세
```

### Notification Routes

```
GET    /api/notifications     - 알림 목록
PATCH  /api/notifications/:id/read - 알림 읽음 처리
POST   /api/notifications/read-all - 전체 읽음 처리
GET    /api/notifications/unread-count - 읽지 않은 알림 수
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: 유효한 자격 증명으로 로그인 시 토큰 발급

_For any_ 유효한 이메일/비밀번호 조합, 로그인 요청 시 유효한 JWT 토큰이 반환되어야 하며, 해당 토큰으로 인증된 API 요청이 성공해야 한다.

**Validates: Requirements 1.1**

### Property 2: 무효한 토큰 거부

_For any_ 무효한 토큰(만료, 변조, 빈 값, 로그아웃된 토큰), 해당 토큰으로 인증이 필요한 API 요청 시 401 Unauthorized 응답을 반환해야 한다.

**Validates: Requirements 1.3, 1.5**

### Property 3: 비밀번호 암호화 저장

_For any_ 회원가입 또는 비밀번호 변경 요청, 저장된 비밀번호는 원본 비밀번호와 다르며 bcrypt 해시 형식이어야 한다.

**Validates: Requirements 1.2, 8.6**

### Property 4: 비밀번호 변경 라운드트립

_For any_ 비밀번호 변경 요청, 변경 후 새 비밀번호로 로그인이 성공하고 이전 비밀번호로 로그인이 실패해야 한다.

**Validates: Requirements 1.4**

### Property 5: 계정 잠금

_For any_ 사용자 계정, 5회 연속 로그인 실패 시 계정이 잠금 상태가 되고, 잠금 기간 내 올바른 비밀번호로도 로그인이 거부되어야 한다.

**Validates: Requirements 1.6**

### Property 6: 데이터 소유권 격리

_For any_ 사용자와 데이터(견적서, 고객), 해당 사용자는 자신이 소유한 데이터만 조회/수정/삭제할 수 있으며, 다른 사용자의 데이터에 접근 시 403 또는 404 응답을 받아야 한다.

**Validates: Requirements 2.2, 2.3, 2.4**

### Property 7: 데이터 생성 시 사용자 연결

_For any_ 데이터 생성 요청, 생성된 데이터의 userId는 요청한 사용자의 ID와 일치해야 한다.

**Validates: Requirements 2.1**

### Property 8: 타임스탬프 자동 기록

_For any_ 데이터 생성 또는 수정, createdAt은 생성 시 설정되고 변경되지 않으며, updatedAt은 수정 시마다 갱신되어야 한다.

**Validates: Requirements 2.5**

### Property 9: 소프트 삭제

_For any_ 삭제 요청(견적서, 고객, 공지사항), deletedAt 필드가 설정되고 일반 목록 조회에서 제외되어야 한다.

**Validates: Requirements 2.4, 4.3**

### Property 10: 페이지네이션 정확성

_For any_ 페이지네이션 요청(page, limit), 반환되는 결과 수는 limit 이하이고, 전체 결과를 순회하면 모든 데이터가 중복 없이 포함되어야 한다.

**Validates: Requirements 3.1**

### Property 11: 검색 필터 정확성

_For any_ 검색 필터(이름, 이메일, 상태), 반환된 모든 결과는 해당 필터 조건을 만족해야 한다.

**Validates: Requirements 3.2**

### Property 12: 계정 상태와 로그인

_For any_ 사용자 계정, 상태가 INACTIVE인 경우 로그인이 거부되고, ACTIVE인 경우 올바른 자격 증명으로 로그인이 성공해야 한다.

**Validates: Requirements 3.3, 3.4**

### Property 13: 공지사항 게시 기간 필터링

_For any_ 공지사항 목록 조회, 반환된 모든 공지사항은 현재 날짜가 startDate와 endDate 사이에 있고 isActive가 true여야 한다.

**Validates: Requirements 4.4**

### Property 14: 중요 공지 알림 생성

_For any_ HIGH 또는 URGENT 우선순위의 공지사항 생성, 모든 ACTIVE 상태 사용자에게 알림이 생성되어야 한다.

**Validates: Requirements 4.5**

### Property 15: 알림 정렬

_For any_ 알림 목록 조회, 반환된 알림은 createdAt 기준 내림차순(최신순)으로 정렬되어야 한다.

**Validates: Requirements 6.3**

### Property 16: 알림 읽음 상태 변경

_For any_ 알림 읽음 처리 요청, 해당 알림의 isRead가 true로 변경되어야 한다.

**Validates: Requirements 6.2**

### Property 17: 로그인 응답에 읽지 않은 알림 수 포함

_For any_ 성공적인 로그인, 응답에 해당 사용자의 읽지 않은 알림 개수가 포함되어야 한다.

**Validates: Requirements 6.5**

### Property 18: Rate Limiting

_For any_ 클라이언트, 분당 100회 초과 요청 시 429 Too Many Requests 응답을 받아야 한다.

**Validates: Requirements 8.1**

### Property 19: 입력 유효성 검사

_For any_ API 요청, 스키마에 맞지 않는 입력에 대해 400 Bad Request 응답과 상세 오류 메시지를 반환해야 한다.

**Validates: Requirements 8.3**

### Property 20: 설정 변경 이력 기록

_For any_ 시스템 설정 변경, SettingHistory에 이전 값, 새 값, 변경자, 변경 시간이 기록되어야 한다.

**Validates: Requirements 9.3**

## Error Handling

### HTTP Status Codes

| Status Code | Usage                           |
| ----------- | ------------------------------- |
| 200         | 성공적인 GET, PUT, PATCH 요청   |
| 201         | 성공적인 POST (리소스 생성)     |
| 204         | 성공적인 DELETE                 |
| 400         | 잘못된 요청 (유효성 검사 실패)  |
| 401         | 인증 실패 (토큰 없음/만료/무효) |
| 403         | 권한 없음 (접근 거부)           |
| 404         | 리소스 없음                     |
| 409         | 충돌 (이메일 중복 등)           |
| 429         | Rate Limit 초과                 |
| 500         | 서버 내부 오류                  |

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// Example
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력 데이터가 유효하지 않습니다",
    "details": {
      "email": ["유효한 이메일 형식이 아닙니다"],
      "password": ["비밀번호는 8자 이상이어야 합니다"]
    }
  }
}
```

### Error Codes

- `AUTH_INVALID_CREDENTIALS` - 잘못된 이메일 또는 비밀번호
- `AUTH_TOKEN_EXPIRED` - 토큰 만료
- `AUTH_TOKEN_INVALID` - 유효하지 않은 토큰
- `AUTH_ACCOUNT_LOCKED` - 계정 잠금
- `AUTH_ACCOUNT_INACTIVE` - 비활성화된 계정
- `VALIDATION_ERROR` - 입력 유효성 검사 실패
- `RESOURCE_NOT_FOUND` - 리소스 없음
- `RESOURCE_ACCESS_DENIED` - 접근 권한 없음
- `DUPLICATE_RESOURCE` - 중복 리소스
- `RATE_LIMIT_EXCEEDED` - Rate Limit 초과
- `INTERNAL_ERROR` - 서버 내부 오류

## Testing Strategy

### Unit Tests

단위 테스트는 개별 함수와 서비스의 특정 동작을 검증합니다:

- 서비스 메서드의 정상 동작
- 에러 케이스 처리
- 엣지 케이스 (빈 입력, 경계값 등)
- 미들웨어 동작

### Property-Based Tests

속성 기반 테스트는 fast-check 라이브러리를 사용하여 다양한 입력에 대한 불변 속성을 검증합니다:

- 최소 100회 반복 실행
- 각 테스트는 설계 문서의 속성 번호 참조
- 태그 형식: `Feature: backend-admin-system, Property N: [속성 설명]`

### Test Structure

```
backend/
├── __tests__/
│   ├── unit/
│   │   ├── services/
│   │   │   ├── authService.test.ts
│   │   │   ├── dataService.test.ts
│   │   │   ├── adminService.test.ts
│   │   │   └── notificationService.test.ts
│   │   └── middleware/
│   │       ├── auth.test.ts
│   │       └── validation.test.ts
│   ├── property/
│   │   ├── auth.property.test.ts
│   │   ├── data.property.test.ts
│   │   ├── admin.property.test.ts
│   │   └── notification.property.test.ts
│   └── integration/
│       ├── auth.integration.test.ts
│       └── api.integration.test.ts
```

### Test Coverage Goals

- 단위 테스트: 핵심 비즈니스 로직 90% 이상
- 속성 테스트: 모든 정의된 속성 커버
- 통합 테스트: 주요 API 엔드포인트
