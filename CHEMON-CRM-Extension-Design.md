# CHEMON CRM 확장 기능 상세 설계 문서

> 칸반뷰, 자동화 엔진, 대시보드, 활동 타임라인, 시험 현황, 리포트 기능 구현

---

## 목차

1. [데이터베이스 스키마 추가/수정](#1-데이터베이스-스키마-추가수정)
2. [API 엔드포인트 설계](#2-api-엔드포인트-설계)
3. [프론트엔드 컴포넌트 구조](#3-프론트엔드-컴포넌트-구조)
4. [각 기능별 상세 명세](#4-각-기능별-상세-명세)

---

## 1. 데이터베이스 스키마 추가/수정

### 1.1 신규 Enum 추가

```prisma
// 자동화 관련
enum AutomationTriggerType {
  STATUS_CHANGE      // 상태 변경
  DATE_REACHED       // 날짜 도달
  ITEM_CREATED       // 항목 생성
  ITEM_UPDATED       // 항목 수정
  FIELD_CHANGE       // 필드 변경
  SCHEDULE           // 정기 스케줄
}

enum AutomationActionType {
  SEND_NOTIFICATION  // 알림 발송
  SEND_EMAIL         // 이메일 발송
  UPDATE_STATUS      // 상태 업데이트
  ASSIGN_USER        // 담당자 배정
  CREATE_TASK        // 태스크 생성
  CREATE_ACTIVITY    // 활동 생성
  WEBHOOK            // 웹훅 호출
}

enum AutomationStatus {
  ACTIVE
  INACTIVE
  ERROR
}

// 활동 타입 (기존 LeadActivity 확장)
enum ActivityType {
  CALL              // 통화
  EMAIL             // 이메일
  MEETING           // 미팅
  NOTE              // 메모
  TASK              // 태스크
  STATUS_CHANGE     // 상태 변경
  DOCUMENT          // 문서
  SYSTEM            // 시스템 자동
}

// 리포트 타입
enum ReportType {
  SALES_SUMMARY     // 매출 요약
  PIPELINE_STATUS   // 파이프라인 현황
  CONVERSION_RATE   // 전환율 분석
  LEAD_TIME         // 리드타임 분석
  TEAM_PERFORMANCE  // 팀 성과
  CUSTOMER_ANALYSIS // 고객 분석
  STUDY_STATUS      // 시험 현황
  CUSTOM            // 사용자 정의
}

// 대시보드 위젯 타입
enum WidgetType {
  KPI_CARD          // 숫자 카드
  BAR_CHART         // 막대 차트
  LINE_CHART        // 선 차트
  PIE_CHART         // 파이 차트
  FUNNEL_CHART      // 깔때기 차트
  TABLE             // 테이블
  TIMELINE          // 타임라인
  CALENDAR          // 캘린더
  LEADERBOARD       // 리더보드
  GAUGE             // 게이지
  PROGRESS          // 진행률
}
```

### 1.2 자동화 엔진 모델

```prisma
// ==================== Automation Engine ====================

// 자동화 규칙
model AutomationRule {
  id          String              @id @default(uuid())
  name        String                                    // 규칙명
  description String?                                   // 설명
  
  // 트리거
  triggerType AutomationTriggerType
  triggerConfig Json                                    // 트리거 설정 (대상 모델, 필드, 값 등)
  
  // 조건 (선택)
  conditions  Json?                                     // 조건 배열 [{field, operator, value}]
  
  // 액션
  actions     AutomationAction[]
  
  // 상태
  status      AutomationStatus    @default(ACTIVE)
  priority    Int                 @default(0)          // 실행 우선순위
  
  // 실행 통계
  executionCount Int              @default(0)
  lastExecutedAt DateTime?
  lastError     String?
  
  // 소유권
  createdBy   String
  isSystem    Boolean             @default(false)      // 시스템 기본 규칙 여부
  
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
  
  executions  AutomationExecution[]
}

// 자동화 액션
model AutomationAction {
  id          String              @id @default(uuid())
  ruleId      String
  rule        AutomationRule      @relation(fields: [ruleId], references: [id], onDelete: Cascade)
  
  actionType  AutomationActionType
  actionConfig Json                                     // 액션 설정
  order       Int                 @default(0)          // 실행 순서
  
  // 지연 실행 (선택)
  delayMinutes Int?                                     // n분 후 실행
  
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
}

// 자동화 실행 로그
model AutomationExecution {
  id          String              @id @default(uuid())
  ruleId      String
  rule        AutomationRule      @relation(fields: [ruleId], references: [id], onDelete: Cascade)
  
  // 트리거 정보
  triggerData Json                                      // 트리거 발생 데이터
  targetModel String                                    // 대상 모델 (Lead, Contract 등)
  targetId    String                                    // 대상 ID
  
  // 실행 결과
  status      String              @default("PENDING")   // PENDING, SUCCESS, FAILED
  results     Json?                                     // 각 액션별 실행 결과
  error       String?
  
  startedAt   DateTime            @default(now())
  completedAt DateTime?
}

// 예약된 자동화 작업 (지연 실행, 정기 스케줄)
model ScheduledAutomation {
  id          String              @id @default(uuid())
  ruleId      String
  
  // 실행 대상
  targetModel String
  targetId    String
  actionData  Json
  
  // 스케줄
  scheduledAt DateTime
  executed    Boolean             @default(false)
  executedAt  DateTime?
  
  createdAt   DateTime            @default(now())
}
```

### 1.3 활동 타임라인 모델 (확장)

```prisma
// ==================== Activity Timeline (확장) ====================

// 통합 활동 기록 (모든 엔티티에 대한 활동)
model Activity {
  id          String       @id @default(uuid())
  
  // 대상 엔티티 (polymorphic)
  entityType  String                                    // LEAD, CUSTOMER, CONTRACT, STUDY, QUOTATION
  entityId    String
  
  // 활동 정보
  type        ActivityType
  subject     String                                    // 제목/요약
  content     String?                                   // 상세 내용
  
  // 메타데이터
  metadata    Json?                                     // 추가 정보 (이전값, 변경값 등)
  
  // 연락 정보 (CALL, EMAIL, MEETING인 경우)
  contactName String?
  contactInfo String?                                   // 전화번호 또는 이메일
  duration    Int?                                      // 통화/미팅 시간 (분)
  
  // 일정 관련
  activityDate DateTime    @default(now())              // 활동 일시
  nextAction   String?                                  // 다음 액션
  nextDate     DateTime?                                // 다음 일정
  
  // 첨부파일
  attachments Json?                                     // [{name, url, size}]
  
  // 소유권
  userId      String
  user        User         @relation(fields: [userId], references: [id])
  
  // 자동 생성 여부
  isAutoGenerated Boolean   @default(false)             // 시스템 자동 생성
  automationRuleId String?                              // 자동화 규칙 ID
  
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  @@index([entityType, entityId])
  @@index([userId])
  @@index([activityDate])
}
```

### 1.4 대시보드 & 위젯 모델

```prisma
// ==================== Dashboard & Widgets ====================

// 대시보드
model Dashboard {
  id          String        @id @default(uuid())
  name        String
  description String?
  
  // 레이아웃
  layout      Json                                      // 그리드 레이아웃 설정
  
  // 권한
  isDefault   Boolean       @default(false)             // 기본 대시보드 여부
  isPublic    Boolean       @default(false)             // 전체 공개 여부
  ownerId     String                                    // 소유자
  sharedWith  String[]                                  // 공유 대상 사용자 ID
  
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  
  widgets     DashboardWidget[]
}

// 대시보드 위젯
model DashboardWidget {
  id          String        @id @default(uuid())
  dashboardId String
  dashboard   Dashboard     @relation(fields: [dashboardId], references: [id], onDelete: Cascade)
  
  // 위젯 정보
  name        String
  type        WidgetType
  
  // 위치 & 크기 (그리드 기반)
  x           Int           @default(0)
  y           Int           @default(0)
  width       Int           @default(4)                 // 그리드 단위
  height      Int           @default(3)
  
  // 데이터 설정
  dataSource  String                                    // 데이터 소스 (모델명 또는 커스텀)
  query       Json?                                     // 쿼리 조건
  aggregation Json?                                     // 집계 설정
  
  // 표시 설정
  config      Json                                      // 차트 설정, 컬러, 포맷 등
  
  // 필터
  filters     Json?                                     // 기본 필터
  dateRange   String?                                   // 날짜 범위 (7d, 30d, 90d, custom)
  
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

// 위젯 템플릿 (미리 정의된 위젯)
model WidgetTemplate {
  id          String        @id @default(uuid())
  name        String
  description String?
  type        WidgetType
  category    String                                    // 카테고리 (영업, 시험, 고객 등)
  
  // 기본 설정
  defaultConfig Json
  
  // 미리보기
  thumbnail   String?
  
  isSystem    Boolean       @default(true)
  isActive    Boolean       @default(true)
  
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}
```

### 1.5 리포트 모델

```prisma
// ==================== Reports ====================

// 리포트 정의
model ReportDefinition {
  id          String        @id @default(uuid())
  name        String
  description String?
  type        ReportType
  
  // 데이터 설정
  dataSources Json                                      // 사용할 데이터 소스들
  columns     Json                                      // 표시할 컬럼들
  filters     Json?                                     // 필터 조건
  groupBy     Json?                                     // 그룹핑
  orderBy     Json?                                     // 정렬
  
  // 차트 설정 (선택)
  charts      Json?                                     // 포함할 차트들
  
  // 권한
  isSystem    Boolean       @default(false)             // 시스템 기본 리포트
  isPublic    Boolean       @default(false)
  ownerId     String
  sharedWith  String[]
  
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  
  exports     ReportExport[]
}

// 리포트 내보내기 기록
model ReportExport {
  id          String           @id @default(uuid())
  reportId    String
  report      ReportDefinition @relation(fields: [reportId], references: [id], onDelete: Cascade)
  
  // 내보내기 정보
  format      String                                    // PDF, EXCEL, CSV
  filters     Json?                                     // 적용된 필터
  dateRange   Json?                                     // 적용된 기간
  
  // 파일 정보
  fileName    String
  fileUrl     String?
  fileSize    Int?
  
  // 상태
  status      String           @default("PENDING")      // PENDING, PROCESSING, COMPLETED, FAILED
  error       String?
  
  exportedBy  String
  exportedAt  DateTime         @default(now())
  completedAt DateTime?
}
```

### 1.6 칸반 뷰 설정 모델

```prisma
// ==================== Kanban View Settings ====================

// 칸반 뷰 설정 (사용자별)
model KanbanViewSetting {
  id          String        @id @default(uuid())
  userId      String
  
  // 대상
  entityType  String                                    // LEAD, QUOTATION, CONTRACT, STUDY
  
  // 칸반 설정
  groupByField String       @default("status")          // 그룹핑 필드
  columns     Json                                      // 컬럼 순서 및 표시 여부
  cardFields  Json                                      // 카드에 표시할 필드
  
  // 필터
  filters     Json?
  
  // 정렬
  sortBy      String?
  sortOrder   String        @default("asc")
  
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  
  @@unique([userId, entityType])
}
```

### 1.7 기존 모델 수정사항

```prisma
// User 모델에 관계 추가
model User {
  // ... 기존 필드 ...
  
  // 신규 관계 추가
  activities      Activity[]
  dashboards      Dashboard[]      @relation("OwnedDashboards")
  
  // 칸반 설정
  kanbanSettings  KanbanViewSetting[]
}

// Lead 모델에 Lost 분석 필드 추가
model Lead {
  // ... 기존 필드 ...
  
  // Lost 분석용 추가 필드
  lostReason      String?                               // 실패 사유 (기존)
  lostCategory    String?                               // 실패 분류 (PRICE, SCHEDULE, COMPETITOR, OTHER)
  competitorName  String?                               // 경쟁사명 (경쟁 패배 시)
  lostDate        DateTime?                             // 실패 처리일
  
  // 전환율 분석용
  stageHistory    Json?                                 // 단계 이력 [{stage, enteredAt, exitedAt}]
}

// Contract 모델에 분석용 필드 추가
model Contract {
  // ... 기존 필드 ...
  
  // 리드타임 분석용
  firstContactDate DateTime?                            // 최초 접촉일
  proposalDate     DateTime?                            // 견적 발송일
  negotiationStartDate DateTime?                        // 협상 시작일
  
  // 영업 성과용
  salesRepId      String?                               // 영업 담당자 (별도 관리 시)
}

// Study 모델에 분석용 필드 추가
model Study {
  // ... 기존 필드 ...
  
  // 시험 현황 분석용
  labId           String?                               // 연구소/시험실 ID
  equipment       String?                               // 사용 장비
  
  // 지연 분석
  delayDays       Int?                                  // 지연일수
  delayReason     String?                               // 지연 사유
  
  // 보고서 현황
  reportVersion   Int           @default(1)             // 보고서 버전
  reportHistory   Json?                                 // 보고서 이력
}
```

### 1.8 시스템 설정 추가

```prisma
// 시스템 설정에 추가할 키들 (SystemSetting 모델 활용)

// 자동화 관련 설정
// - automation_enabled: true/false
// - automation_max_daily_executions: 1000
// - automation_email_enabled: true/false

// 대시보드 관련 설정
// - dashboard_default_date_range: 30d
// - dashboard_refresh_interval: 300 (초)

// 리포트 관련 설정
// - report_max_export_rows: 10000
// - report_retention_days: 90

// 시험 현황 관련 설정
// - study_delay_threshold_days: 7 (지연 판정 기준일)
// - study_workload_capacity: 100 (연구소 최대 처리량)
```

---

## 스키마 마이그레이션 SQL (참고)

```sql
-- 신규 Enum 타입 생성
CREATE TYPE "AutomationTriggerType" AS ENUM (
  'STATUS_CHANGE', 'DATE_REACHED', 'ITEM_CREATED', 
  'ITEM_UPDATED', 'FIELD_CHANGE', 'SCHEDULE'
);

CREATE TYPE "AutomationActionType" AS ENUM (
  'SEND_NOTIFICATION', 'SEND_EMAIL', 'UPDATE_STATUS',
  'ASSIGN_USER', 'CREATE_TASK', 'CREATE_ACTIVITY', 'WEBHOOK'
);

CREATE TYPE "AutomationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR');

CREATE TYPE "ActivityType" AS ENUM (
  'CALL', 'EMAIL', 'MEETING', 'NOTE', 
  'TASK', 'STATUS_CHANGE', 'DOCUMENT', 'SYSTEM'
);

CREATE TYPE "ReportType" AS ENUM (
  'SALES_SUMMARY', 'PIPELINE_STATUS', 'CONVERSION_RATE',
  'LEAD_TIME', 'TEAM_PERFORMANCE', 'CUSTOMER_ANALYSIS',
  'STUDY_STATUS', 'CUSTOM'
);

CREATE TYPE "WidgetType" AS ENUM (
  'KPI_CARD', 'BAR_CHART', 'LINE_CHART', 'PIE_CHART',
  'FUNNEL_CHART', 'TABLE', 'TIMELINE', 'CALENDAR',
  'LEADERBOARD', 'GAUGE', 'PROGRESS'
);
```

---

*다음 섹션: API 엔드포인트 설계*
# CHEMON CRM 확장 기능 - API 엔드포인트 설계

---

## 2. API 엔드포인트 설계

### 2.1 API 구조 개요

```
/api
├── /kanban                    # 칸반 뷰
├── /automation                # 자동화 엔진
├── /dashboard                 # 대시보드
├── /widgets                   # 위젯
├── /activities                # 활동 타임라인
├── /reports                   # 리포트
├── /analytics                 # 분석 데이터
└── /study-dashboard           # 시험 현황
```

---

### 2.2 칸반 뷰 API

```typescript
// ==================== Kanban View API ====================

// GET /api/kanban/:entityType
// 칸반 뷰 데이터 조회
// entityType: lead | quotation | contract | study
interface KanbanViewRequest {
  groupBy?: string;          // 그룹핑 필드 (기본: status)
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface KanbanViewResponse {
  columns: KanbanColumn[];
  settings: KanbanSettings;
}

interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  items: KanbanItem[];
  count: number;
  totalAmount?: number;      // 금액 합계 (견적/계약)
}

interface KanbanItem {
  id: string;
  title: string;
  subtitle?: string;
  fields: Record<string, any>;
  assignee?: { id: string; name: string; avatar?: string };
  dueDate?: string;
  priority?: string;
  tags?: string[];
}

// PUT /api/kanban/:entityType/:id/move
// 칸반 아이템 이동 (드래그앤드롭)
interface KanbanMoveRequest {
  targetColumn: string;      // 이동할 컬럼 ID
  targetIndex: number;       // 컬럼 내 순서
}

interface KanbanMoveResponse {
  success: boolean;
  item: KanbanItem;
  automation?: {             // 자동화 실행 결과
    triggered: boolean;
    actions: string[];
  };
}

// GET /api/kanban/:entityType/settings
// 사용자별 칸반 설정 조회

// PUT /api/kanban/:entityType/settings
// 사용자별 칸반 설정 저장
interface KanbanSettingsRequest {
  groupByField: string;
  columns: Array<{
    id: string;
    visible: boolean;
    order: number;
  }>;
  cardFields: string[];      // 카드에 표시할 필드
  filters?: Record<string, any>;
}
```

---

### 2.3 자동화 엔진 API

```typescript
// ==================== Automation Engine API ====================

// ----- 자동화 규칙 CRUD -----

// GET /api/automation/rules
// 자동화 규칙 목록 조회
interface AutomationRulesQuery {
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL';
  triggerType?: AutomationTriggerType;
  search?: string;
  page?: number;
  limit?: number;
}

// POST /api/automation/rules
// 자동화 규칙 생성
interface CreateAutomationRuleRequest {
  name: string;
  description?: string;
  triggerType: AutomationTriggerType;
  triggerConfig: TriggerConfig;
  conditions?: Condition[];
  actions: ActionConfig[];
  status?: 'ACTIVE' | 'INACTIVE';
}

interface TriggerConfig {
  model: 'Lead' | 'Quotation' | 'Contract' | 'Study';
  field?: string;            // 필드 변경 트리거 시
  fromValue?: any;           // 이전 값
  toValue?: any;             // 변경 값
  schedule?: string;         // cron 표현식 (스케줄 트리거)
}

interface Condition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: any;
  logic?: 'AND' | 'OR';
}

interface ActionConfig {
  type: AutomationActionType;
  config: Record<string, any>;
  delayMinutes?: number;
}

// GET /api/automation/rules/:id
// PUT /api/automation/rules/:id
// DELETE /api/automation/rules/:id

// POST /api/automation/rules/:id/toggle
// 자동화 규칙 활성/비활성 토글

// POST /api/automation/rules/:id/test
// 자동화 규칙 테스트 실행
interface TestAutomationRequest {
  testData: Record<string, any>;  // 테스트용 더미 데이터
}

// ----- 자동화 실행 로그 -----

// GET /api/automation/executions
// 자동화 실행 로그 조회
interface AutomationExecutionsQuery {
  ruleId?: string;
  status?: 'SUCCESS' | 'FAILED' | 'PENDING';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// GET /api/automation/executions/:id
// 특정 실행 로그 상세 조회

// ----- 자동화 템플릿 -----

// GET /api/automation/templates
// 미리 정의된 자동화 템플릿 목록
interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;          // 리드관리, 계약관리 등
  triggerType: AutomationTriggerType;
  defaultConfig: CreateAutomationRuleRequest;
}

// POST /api/automation/templates/:id/apply
// 템플릿으로 자동화 규칙 생성
```

#### 자동화 액션 타입별 설정 예시

```typescript
// 알림 발송
interface NotificationActionConfig {
  type: 'SEND_NOTIFICATION';
  config: {
    recipientType: 'owner' | 'specific' | 'role';
    recipientIds?: string[];    // specific일 때
    recipientRole?: string;     // role일 때
    title: string;              // 템플릿 변수 사용 가능: {{leadName}}
    message: string;
    link?: string;
  };
}

// 이메일 발송
interface EmailActionConfig {
  type: 'SEND_EMAIL';
  config: {
    to: 'owner' | 'customer' | 'specific';
    toEmail?: string;
    subject: string;
    template?: string;          // 이메일 템플릿 ID
    body?: string;              // 직접 입력 시
  };
}

// 상태 업데이트
interface UpdateStatusActionConfig {
  type: 'UPDATE_STATUS';
  config: {
    model: string;
    field: string;
    value: any;
  };
}

// 담당자 배정
interface AssignUserActionConfig {
  type: 'ASSIGN_USER';
  config: {
    assignmentType: 'specific' | 'round_robin' | 'least_loaded';
    userId?: string;            // specific일 때
    userPool?: string[];        // round_robin, least_loaded일 때
  };
}
```

---

### 2.4 대시보드 & 위젯 API

```typescript
// ==================== Dashboard API ====================

// ----- 대시보드 CRUD -----

// GET /api/dashboard
// 사용자의 대시보드 목록
interface DashboardListResponse {
  dashboards: Dashboard[];
  defaultDashboardId?: string;
}

// POST /api/dashboard
// 대시보드 생성
interface CreateDashboardRequest {
  name: string;
  description?: string;
  layout?: GridLayout;
  isDefault?: boolean;
}

// GET /api/dashboard/:id
// PUT /api/dashboard/:id
// DELETE /api/dashboard/:id

// POST /api/dashboard/:id/duplicate
// 대시보드 복제

// PUT /api/dashboard/:id/layout
// 레이아웃 업데이트 (위젯 위치/크기)
interface UpdateLayoutRequest {
  layout: GridLayout;
}

// ----- 위젯 CRUD -----

// GET /api/dashboard/:dashboardId/widgets
// POST /api/dashboard/:dashboardId/widgets
interface CreateWidgetRequest {
  name: string;
  type: WidgetType;
  x: number;
  y: number;
  width: number;
  height: number;
  dataSource: string;
  query?: Record<string, any>;
  aggregation?: AggregationConfig;
  config: WidgetConfig;
  filters?: Record<string, any>;
  dateRange?: string;
}

// GET /api/dashboard/:dashboardId/widgets/:widgetId
// PUT /api/dashboard/:dashboardId/widgets/:widgetId
// DELETE /api/dashboard/:dashboardId/widgets/:widgetId

// GET /api/dashboard/:dashboardId/widgets/:widgetId/data
// 위젯 데이터 조회 (실시간)
interface WidgetDataRequest {
  dateRange?: string;
  filters?: Record<string, any>;
}

// ----- 위젯 템플릿 -----

// GET /api/widgets/templates
// 위젯 템플릿 목록
interface WidgetTemplateListResponse {
  templates: WidgetTemplate[];
  categories: string[];
}

// POST /api/widgets/templates/:id/add
// 템플릿에서 위젯 추가
```

#### 위젯 설정 타입별 예시

```typescript
// KPI 카드
interface KpiCardConfig {
  type: 'KPI_CARD';
  config: {
    title: string;
    valueField: string;
    aggregation: 'count' | 'sum' | 'avg';
    format: 'number' | 'currency' | 'percent';
    icon?: string;
    color?: string;
    comparison?: {
      enabled: boolean;
      period: 'previous_period' | 'previous_year';
    };
  };
}

// 막대 차트
interface BarChartConfig {
  type: 'BAR_CHART';
  config: {
    title: string;
    xAxis: { field: string; label: string };
    yAxis: { field: string; label: string; aggregation: string };
    colors?: string[];
    stacked?: boolean;
    horizontal?: boolean;
  };
}

// 깔때기 차트 (전환율)
interface FunnelChartConfig {
  type: 'FUNNEL_CHART';
  config: {
    title: string;
    stages: Array<{
      name: string;
      field: string;
      value: any;
    }>;
    showConversionRate: boolean;
    colors?: string[];
  };
}

// 리더보드
interface LeaderboardConfig {
  type: 'LEADERBOARD';
  config: {
    title: string;
    groupByField: string;       // userId 등
    valueField: string;
    aggregation: 'count' | 'sum';
    format: 'number' | 'currency';
    limit: number;              // Top N
    showRank: boolean;
    showAvatar: boolean;
  };
}
```

---

### 2.5 활동 타임라인 API

```typescript
// ==================== Activity Timeline API ====================

// GET /api/activities
// 활동 목록 조회
interface ActivitiesQuery {
  entityType?: string;
  entityId?: string;
  type?: ActivityType;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

interface ActivitiesResponse {
  activities: Activity[];
  pagination: Pagination;
  summary?: {
    total: number;
    byType: Record<ActivityType, number>;
  };
}

// POST /api/activities
// 활동 생성
interface CreateActivityRequest {
  entityType: string;
  entityId: string;
  type: ActivityType;
  subject: string;
  content?: string;
  metadata?: Record<string, any>;
  contactName?: string;
  contactInfo?: string;
  duration?: number;
  activityDate?: string;
  nextAction?: string;
  nextDate?: string;
  attachments?: Attachment[];
}

// GET /api/activities/:id
// PUT /api/activities/:id
// DELETE /api/activities/:id

// GET /api/activities/timeline/:entityType/:entityId
// 특정 엔티티의 타임라인 조회
interface TimelineResponse {
  timeline: TimelineItem[];
  entity: EntitySummary;
}

interface TimelineItem {
  id: string;
  type: ActivityType;
  subject: string;
  content?: string;
  date: string;
  user: { id: string; name: string; avatar?: string };
  isAutoGenerated: boolean;
  metadata?: Record<string, any>;
}

// GET /api/activities/upcoming
// 예정된 활동 (다음 액션) 조회
interface UpcomingActivitiesQuery {
  days?: number;              // 향후 N일
  userId?: string;
}
```

---

### 2.6 리포트 API

```typescript
// ==================== Reports API ====================

// ----- 리포트 정의 CRUD -----

// GET /api/reports
// 리포트 목록
interface ReportsQuery {
  type?: ReportType;
  isSystem?: boolean;
  search?: string;
}

// POST /api/reports
// 리포트 정의 생성
interface CreateReportRequest {
  name: string;
  description?: string;
  type: ReportType;
  dataSources: DataSourceConfig[];
  columns: ColumnConfig[];
  filters?: FilterConfig[];
  groupBy?: GroupByConfig[];
  orderBy?: OrderByConfig[];
  charts?: ChartConfig[];
}

// GET /api/reports/:id
// PUT /api/reports/:id
// DELETE /api/reports/:id

// ----- 리포트 실행 -----

// POST /api/reports/:id/execute
// 리포트 실행 (데이터 조회)
interface ExecuteReportRequest {
  filters?: Record<string, any>;
  dateRange?: {
    start: string;
    end: string;
  };
  page?: number;
  limit?: number;
}

interface ExecuteReportResponse {
  data: any[];
  columns: ColumnMeta[];
  summary?: Record<string, any>;
  charts?: ChartData[];
  pagination: Pagination;
}

// ----- 리포트 내보내기 -----

// POST /api/reports/:id/export
// 리포트 내보내기
interface ExportReportRequest {
  format: 'PDF' | 'EXCEL' | 'CSV';
  filters?: Record<string, any>;
  dateRange?: {
    start: string;
    end: string;
  };
  includeCharts?: boolean;    // PDF일 때
}

interface ExportReportResponse {
  exportId: string;
  status: 'PENDING' | 'PROCESSING';
}

// GET /api/reports/exports/:exportId
// 내보내기 상태 확인
interface ExportStatusResponse {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress?: number;
  fileUrl?: string;           // COMPLETED일 때
  error?: string;             // FAILED일 때
}

// GET /api/reports/exports/:exportId/download
// 내보낸 파일 다운로드

// GET /api/reports/exports
// 내보내기 기록 조회
```

---

### 2.7 분석 데이터 API (고급 대시보드용)

```typescript
// ==================== Analytics API ====================

// ----- 매출 분석 -----

// GET /api/analytics/revenue
// 매출 분석 데이터
interface RevenueAnalyticsQuery {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  groupBy?: 'user' | 'customer' | 'type';
}

interface RevenueAnalyticsResponse {
  data: Array<{
    period: string;
    revenue: number;
    count: number;
    growth?: number;          // 전기 대비 성장률
  }>;
  summary: {
    totalRevenue: number;
    totalCount: number;
    avgDealSize: number;
    growth: number;
  };
  forecast?: Array<{          // 예측 데이터
    period: string;
    predictedRevenue: number;
    confidence: number;
  }>;
}

// ----- 전환율 분석 -----

// GET /api/analytics/conversion
// 전환율 분석 (Funnel)
interface ConversionAnalyticsQuery {
  entityType: 'lead' | 'quotation' | 'contract';
  startDate: string;
  endDate: string;
  groupBy?: 'user' | 'source';
}

interface ConversionAnalyticsResponse {
  funnel: Array<{
    stage: string;
    count: number;
    conversionRate: number;   // 이전 단계 대비
    avgDaysInStage: number;
  }>;
  overallConversionRate: number;
  comparison?: {
    previousPeriod: number;
    change: number;
  };
}

// ----- 리드타임 분석 -----

// GET /api/analytics/lead-time
// 리드타임 분석
interface LeadTimeAnalyticsQuery {
  startDate: string;
  endDate: string;
  groupBy?: 'user' | 'type' | 'source';
}

interface LeadTimeAnalyticsResponse {
  stages: Array<{
    from: string;
    to: string;
    avgDays: number;
    medianDays: number;
    minDays: number;
    maxDays: number;
  }>;
  totalCycle: {
    avgDays: number;
    medianDays: number;
  };
  bottleneck: {
    stage: string;
    avgDays: number;
  };
}

// ----- 영업 성과 분석 -----

// GET /api/analytics/performance
// 팀/개인 성과 분석
interface PerformanceAnalyticsQuery {
  startDate: string;
  endDate: string;
  userId?: string;
}

interface PerformanceAnalyticsResponse {
  leaderboard: Array<{
    userId: string;
    userName: string;
    revenue: number;
    dealCount: number;
    conversionRate: number;
    avgDealSize: number;
    rank: number;
  }>;
  teamSummary: {
    totalRevenue: number;
    totalDeals: number;
    target?: number;
    achievement?: number;
  };
}

// ----- Lost 분석 -----

// GET /api/analytics/lost
// 실패 분석
interface LostAnalyticsQuery {
  startDate: string;
  endDate: string;
  groupBy?: 'reason' | 'stage' | 'competitor';
}

interface LostAnalyticsResponse {
  byReason: Array<{
    reason: string;
    count: number;
    percentage: number;
    amount: number;
  }>;
  byStage: Array<{
    stage: string;
    count: number;
    percentage: number;
  }>;
  byCompetitor?: Array<{
    competitor: string;
    count: number;
    percentage: number;
  }>;
  recoverable: {
    count: number;
    amount: number;
  };
}
```

---

### 2.8 시험 현황 대시보드 API

```typescript
// ==================== Study Dashboard API ====================

// GET /api/study-dashboard/overview
// 시험 현황 개요
interface StudyOverviewResponse {
  summary: {
    total: number;
    byStatus: Record<StudyStatus, number>;
    inProgress: number;
    delayed: number;
    completedThisMonth: number;
  };
  recentCompletions: Study[];
  upcomingDeadlines: Study[];
}

// GET /api/study-dashboard/workload
// 연구소 가동률/워크로드
interface StudyWorkloadQuery {
  labId?: string;
  startDate?: string;
  endDate?: string;
}

interface StudyWorkloadResponse {
  currentWorkload: number;    // 현재 진행중 시험 수
  capacity: number;           // 최대 처리량
  utilizationRate: number;    // 가동률 (%)
  byLab?: Array<{
    labId: string;
    labName: string;
    workload: number;
    capacity: number;
    utilizationRate: number;
  }>;
  forecast: Array<{
    date: string;
    expectedWorkload: number;
  }>;
}

// GET /api/study-dashboard/delays
// 지연 시험 목록
interface DelayedStudiesQuery {
  thresholdDays?: number;     // 지연 판정 기준 (기본: 7일)
}

interface DelayedStudiesResponse {
  studies: Array<{
    id: string;
    studyNumber: string;
    testName: string;
    contractId: string;
    customerName: string;
    expectedEndDate: string;
    delayDays: number;
    delayReason?: string;
    status: StudyStatus;
  }>;
  summary: {
    totalDelayed: number;
    avgDelayDays: number;
    byReason: Record<string, number>;
  };
}

// GET /api/study-dashboard/reports
// 보고서 발행 현황
interface ReportStatusQuery {
  month?: string;             // YYYY-MM
}

interface ReportStatusResponse {
  summary: {
    draftInProgress: number;
    reviewInProgress: number;
    completedThisMonth: number;
    expectedThisMonth: number;
  };
  timeline: Array<{
    studyId: string;
    studyNumber: string;
    testName: string;
    reportDraftDate?: string;
    reportFinalDate?: string;
    status: 'DRAFT' | 'REVIEW' | 'COMPLETED' | 'PENDING';
  }>;
}

// GET /api/study-dashboard/calendar
// 시험 일정 캘린더
interface StudyCalendarQuery {
  startDate: string;
  endDate: string;
  labId?: string;
}

interface StudyCalendarResponse {
  events: Array<{
    id: string;
    studyId: string;
    studyNumber: string;
    title: string;
    type: 'START' | 'END' | 'REPORT_DRAFT' | 'REPORT_FINAL';
    date: string;
    status: StudyStatus;
  }>;
}
```

---

*다음 섹션: 프론트엔드 컴포넌트 구조*
# CHEMON CRM 확장 기능 - 프론트엔드 컴포넌트 구조

---

## 3. 프론트엔드 컴포넌트 구조

### 3.1 디렉토리 구조

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── leads/
│   │   │   ├── page.tsx                    # 리드 목록 (테이블/칸반 전환)
│   │   │   ├── [id]/page.tsx               # 리드 상세
│   │   │   └── kanban/page.tsx             # 리드 칸반 전용 페이지
│   │   ├── quotations/
│   │   │   ├── page.tsx
│   │   │   └── kanban/page.tsx
│   │   ├── contracts/
│   │   │   ├── page.tsx
│   │   │   └── kanban/page.tsx
│   │   ├── studies/
│   │   │   ├── page.tsx
│   │   │   ├── kanban/page.tsx
│   │   │   └── dashboard/page.tsx          # 시험 현황 대시보드
│   │   ├── dashboard/
│   │   │   ├── page.tsx                    # 메인 대시보드
│   │   │   ├── [id]/page.tsx               # 커스텀 대시보드
│   │   │   └── edit/[id]/page.tsx          # 대시보드 편집
│   │   ├── reports/
│   │   │   ├── page.tsx                    # 리포트 목록
│   │   │   ├── [id]/page.tsx               # 리포트 상세/실행
│   │   │   └── builder/page.tsx            # 리포트 빌더
│   │   ├── automation/
│   │   │   ├── page.tsx                    # 자동화 규칙 목록
│   │   │   ├── [id]/page.tsx               # 자동화 상세
│   │   │   ├── create/page.tsx             # 자동화 생성
│   │   │   └── logs/page.tsx               # 실행 로그
│   │   └── analytics/
│   │       ├── page.tsx                    # 분석 메인
│   │       ├── revenue/page.tsx            # 매출 분석
│   │       ├── conversion/page.tsx         # 전환율 분석
│   │       ├── lead-time/page.tsx          # 리드타임 분석
│   │       └── performance/page.tsx        # 성과 분석
│   └── api/
│       └── ... (API Routes)
│
├── components/
│   ├── kanban/                             # 칸반 뷰 컴포넌트
│   │   ├── KanbanBoard.tsx
│   │   ├── KanbanColumn.tsx
│   │   ├── KanbanCard.tsx
│   │   ├── KanbanHeader.tsx
│   │   ├── KanbanSettings.tsx
│   │   └── index.ts
│   │
│   ├── dashboard/                          # 대시보드 컴포넌트
│   │   ├── DashboardGrid.tsx
│   │   ├── DashboardHeader.tsx
│   │   ├── DashboardSidebar.tsx
│   │   └── index.ts
│   │
│   ├── widgets/                            # 위젯 컴포넌트
│   │   ├── base/
│   │   │   ├── WidgetWrapper.tsx
│   │   │   ├── WidgetHeader.tsx
│   │   │   └── WidgetLoading.tsx
│   │   ├── KpiCard.tsx
│   │   ├── BarChart.tsx
│   │   ├── LineChart.tsx
│   │   ├── PieChart.tsx
│   │   ├── FunnelChart.tsx
│   │   ├── TableWidget.tsx
│   │   ├── TimelineWidget.tsx
│   │   ├── Leaderboard.tsx
│   │   ├── GaugeWidget.tsx
│   │   ├── ProgressWidget.tsx
│   │   ├── CalendarWidget.tsx
│   │   ├── WidgetSelector.tsx              # 위젯 선택 모달
│   │   └── index.ts
│   │
│   ├── timeline/                           # 활동 타임라인 컴포넌트
│   │   ├── ActivityTimeline.tsx
│   │   ├── ActivityItem.tsx
│   │   ├── ActivityForm.tsx
│   │   ├── ActivityFilter.tsx
│   │   └── index.ts
│   │
│   ├── automation/                         # 자동화 컴포넌트
│   │   ├── AutomationBuilder.tsx
│   │   ├── TriggerSelector.tsx
│   │   ├── ConditionBuilder.tsx
│   │   ├── ActionBuilder.tsx
│   │   ├── AutomationCard.tsx
│   │   ├── ExecutionLog.tsx
│   │   └── index.ts
│   │
│   ├── reports/                            # 리포트 컴포넌트
│   │   ├── ReportBuilder.tsx
│   │   ├── ReportViewer.tsx
│   │   ├── ReportFilters.tsx
│   │   ├── ReportExport.tsx
│   │   ├── ColumnSelector.tsx
│   │   └── index.ts
│   │
│   ├── analytics/                          # 분석 차트 컴포넌트
│   │   ├── RevenueChart.tsx
│   │   ├── ConversionFunnel.tsx
│   │   ├── LeadTimeChart.tsx
│   │   ├── PerformanceTable.tsx
│   │   ├── LostAnalysisChart.tsx
│   │   └── index.ts
│   │
│   ├── study-dashboard/                    # 시험 현황 컴포넌트
│   │   ├── StudyOverview.tsx
│   │   ├── WorkloadGauge.tsx
│   │   ├── DelayedStudiesTable.tsx
│   │   ├── ReportStatusTimeline.tsx
│   │   ├── StudyCalendar.tsx
│   │   └── index.ts
│   │
│   └── shared/                             # 공통 컴포넌트
│       ├── DateRangePicker.tsx
│       ├── FilterPanel.tsx
│       ├── ExportButton.tsx
│       ├── ViewToggle.tsx                  # 테이블/칸반 뷰 전환
│       └── index.ts
│
├── hooks/
│   ├── useKanban.ts                        # 칸반 상태 관리
│   ├── useDashboard.ts                     # 대시보드 상태 관리
│   ├── useWidgetData.ts                    # 위젯 데이터 페칭
│   ├── useAutomation.ts                    # 자동화 훅
│   ├── useActivities.ts                    # 활동 타임라인 훅
│   ├── useReports.ts                       # 리포트 훅
│   ├── useAnalytics.ts                     # 분석 데이터 훅
│   └── useStudyDashboard.ts                # 시험 현황 훅
│
├── stores/
│   ├── kanbanStore.ts                      # 칸반 Zustand 스토어
│   ├── dashboardStore.ts                   # 대시보드 스토어
│   └── filterStore.ts                      # 필터 상태 스토어
│
├── types/
│   ├── kanban.ts
│   ├── dashboard.ts
│   ├── widget.ts
│   ├── automation.ts
│   ├── activity.ts
│   ├── report.ts
│   └── analytics.ts
│
└── lib/
    ├── kanban-utils.ts                     # 칸반 유틸리티
    ├── chart-config.ts                     # 차트 기본 설정
    ├── export-utils.ts                     # 내보내기 유틸리티
    └── date-utils.ts                       # 날짜 유틸리티
```

---

### 3.2 핵심 컴포넌트 상세

#### 3.2.1 칸반 보드 (KanbanBoard)

```tsx
// components/kanban/KanbanBoard.tsx

interface KanbanBoardProps {
  entityType: 'lead' | 'quotation' | 'contract' | 'study';
  groupBy?: string;
  filters?: Record<string, any>;
  onItemClick?: (item: KanbanItem) => void;
  onItemMove?: (item: KanbanItem, targetColumn: string) => void;
}

interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  items: KanbanItem[];
  count: number;
  totalAmount?: number;
}

interface KanbanItem {
  id: string;
  title: string;
  subtitle?: string;
  fields: Record<string, any>;
  assignee?: User;
  dueDate?: Date;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}

// 기능:
// - 드래그앤드롭 (react-beautiful-dnd 또는 @dnd-kit)
// - 컬럼별 접기/펼치기
// - 카드 빠른 편집
// - 무한 스크롤 (컬럼 내)
// - 필터 & 검색
// - 뷰 설정 (표시 필드, 정렬)
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔍 검색...                    [필터 ▼]  [설정 ⚙️]  [테이블 뷰 | 칸반 뷰]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │ 🔵 문의접수  │ │ 🟡 검토     │ │ 🟠 견적송부  │ │ 🟢 계약진행  │  ...      │
│ │ (15) ₩2.3억 │ │ (12) ₩1.8억 │ │ (8) ₩1.2억  │ │ (5) ₩0.8억  │            │
│ ├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤            │
│ │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │            │
│ │ │ A제약   │ │ │ │ B바이오 │ │ │ │ C헬스   │ │ │ │ D파마   │ │            │
│ │ │ 독성시험│ │ │ │ 효력시험│ │ │ │ 독성시험│ │ │ │ 효력시험│ │            │
│ │ │ ₩5,000만│ │ │ │ ₩3,000만│ │ │ │ ₩4,500만│ │ │ │ ₩2,800만│ │            │
│ │ │ 👤 김담당│ │ │ │ 👤 이담당│ │ │ │ 👤 박담당│ │ │ │ 👤 최담당│ │            │
│ │ │ 📅 01/25 │ │ │ │ 📅 01/22 │ │ │ │ 📅 01/28 │ │ │ │ 📅 01/30 │ │            │
│ │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │            │
│ │ ┌─────────┐ │ │ ┌─────────┐ │ │             │ │             │            │
│ │ │ E제약   │ │ │ │ ...     │ │ │             │ │             │            │
│ │ │ ...     │ │ │ └─────────┘ │ │             │ │             │            │
│ │ └─────────┘ │ │             │ │             │ │             │            │
│ │ + 새 리드   │ │             │ │             │ │             │            │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3.2.2 대시보드 그리드 (DashboardGrid)

```tsx
// components/dashboard/DashboardGrid.tsx

interface DashboardGridProps {
  dashboardId: string;
  widgets: Widget[];
  editable?: boolean;
  onLayoutChange?: (layout: GridLayout) => void;
  onWidgetAdd?: () => void;
  onWidgetRemove?: (widgetId: string) => void;
  onWidgetEdit?: (widgetId: string) => void;
}

// 기능:
// - react-grid-layout 기반 드래그앤드롭 레이아웃
// - 위젯 크기 조절
// - 반응형 레이아웃
// - 편집 모드 토글
// - 위젯 추가/삭제/수정
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📊 영업 대시보드                    [기간: 이번 달 ▼]  [편집]  [+ 위젯]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│ │ 신규 리드 │ │ 진행 견적 │ │ 진행 계약 │ │ 이번달   │                        │
│ │    12    │ │     8    │ │     5    │ │   매출   │                        │
│ │  ▲ 20%  │ │  ▼ 5%   │ │  ▲ 15%  │ │  ₩2.3억  │                        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘                        │
│                                                                             │
│ ┌────────────────────────────────────┐ ┌───────────────────────────────┐   │
│ │        📈 월별 매출 추이            │ │     🏆 영업 성과 리더보드     │   │
│ │                                    │ │                               │   │
│ │   3억 ┤                    ╭───   │ │  1. 김영업  ₩4.2억  (12건)   │   │
│ │       │              ╭────╯       │ │  2. 이영업  ₩3.8억  (10건)   │   │
│ │   2억 ┤    ╭────────╯             │ │  3. 박영업  ₩2.1억  (7건)    │   │
│ │       ├────┴───────────────       │ │  4. 최영업  ₩1.5억  (5건)    │   │
│ │         1월  2월  3월  4월  5월    │ │                               │   │
│ └────────────────────────────────────┘ └───────────────────────────────┘   │
│                                                                             │
│ ┌───────────────────────────────────────────────────────────────────────┐  │
│ │                         🔄 전환율 Funnel                               │  │
│ │                                                                       │  │
│ │  ████████████████████████████████████ 리드 (100)           100%      │  │
│ │  ██████████████████████████████ 검토 (78)                   78%      │  │
│ │  ████████████████████ 견적 (52)                             52%      │  │
│ │  ████████████ 계약 (31)                                     31%      │  │
│ │  ████████ 완료 (18)                                         18%      │  │
│ │                                                                       │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3.2.3 활동 타임라인 (ActivityTimeline)

```tsx
// components/timeline/ActivityTimeline.tsx

interface ActivityTimelineProps {
  entityType: string;
  entityId: string;
  showForm?: boolean;
  onActivityAdd?: (activity: Activity) => void;
}

// 기능:
// - 활동 목록 시간순 표시
// - 활동 유형별 아이콘/색상
// - 활동 추가 폼
// - 필터 (유형별, 날짜별)
// - 무한 스크롤
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📋 활동 기록                                     [+ 활동 추가]  [필터 ▼]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ 오늘 ─────────────────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │  📞 10:30  전화 상담                                    김담당      │    │
│  │           "견적서 검토 완료, 일정 조율 필요"                        │    │
│  │           다음 액션: 미팅 일정 확정 (01/22)                         │    │
│  │                                                                     │    │
│  │  📧 09:15  이메일 발송                                  시스템      │    │
│  │           "견적서 발송 완료 (QT-2025-0042)"                         │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─ 어제 ─────────────────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │  🔄 14:00  상태 변경                                    시스템      │    │
│  │           검토 → 견적송부                                          │    │
│  │                                                                     │    │
│  │  📝 11:30  메모 추가                                    이담당      │    │
│  │           "담당자 부재, 내일 재연락 예정"                           │    │
│  │                                                                     │    │
│  │  📞 10:00  전화 상담                                    이담당      │    │
│  │           "초기 문의 - 독성시험 관심, 예산 5천만원 내외"            │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  [더 보기...]                                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3.2.4 자동화 빌더 (AutomationBuilder)

```tsx
// components/automation/AutomationBuilder.tsx

interface AutomationBuilderProps {
  rule?: AutomationRule;
  onSave: (rule: CreateAutomationRuleRequest) => void;
  onCancel: () => void;
}

// 기능:
// - 시각적 워크플로우 빌더
// - 트리거 선택
// - 조건 빌더 (AND/OR)
// - 액션 추가/순서 변경
// - 테스트 실행
// - 템플릿 적용
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚡ 자동화 규칙 생성                                           [테스트] [저장] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  규칙 이름: [리드 검토완료 시 담당자 알림________________]                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  🎯 트리거 (When)                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  상태 변경                                            [변경] │   │   │
│  │  │  모델: Lead  |  필드: status  |  값: NEW → QUALIFIED        │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  🔍 조건 (If) - 선택사항                                [+ 조건]    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  expectedAmount  >=  50,000,000                      [삭제] │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                          AND                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  inquiryType  =  TOXICITY                            [삭제] │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ⚡ 액션 (Then)                                         [+ 액션]    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  1. 알림 발송                                        [편집] │   │   │
│  │  │     수신: 담당자                                             │   │   │
│  │  │     제목: "{{leadName}} 리드가 검토완료 되었습니다"          │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │  2. 태스크 생성 (30분 후)                            [편집] │   │   │
│  │  │     내용: "견적서 작성 - {{companyName}}"                    │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3.2.5 시험 현황 대시보드 (StudyDashboard)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔬 시험 현황 대시보드                              [기간: 이번 달 ▼]       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ │ 전체시험 │ │ 진행중   │ │ 지연시험 │ │ 이번달   │ │ 보고서   │          │
│ │    42    │ │    28    │ │    3 ⚠️  │ │  완료    │ │  발행    │          │
│ │          │ │          │ │          │ │    8     │ │    6     │          │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                             │
│ ┌───────────────────────────────────┐ ┌──────────────────────────────────┐ │
│ │     🏭 연구소 가동률              │ │      📊 시험 상태 분포           │ │
│ │                                   │ │                                  │ │
│ │         ╭─────────╮               │ │  ■ 접수 (5)                     │ │
│ │       ╱           ╲              │ │  ■ 준비중 (8)                   │ │
│ │      │    85%     │              │ │  ■ 진행중 (15)                  │ │
│ │       ╲           ╱              │ │  ■ 분석중 (6)                   │ │
│ │         ╰─────────╯               │ │  ■ 보고서 (5)                   │ │
│ │      현재: 28 / 최대: 33          │ │  ■ 완료 (3)                     │ │
│ │                                   │ │                                  │ │
│ └───────────────────────────────────┘ └──────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │  ⚠️ 지연 시험 목록                                                      ││
│ ├─────────────────────────────────────────────────────────────────────────┤│
│ │  시험번호     │ 시험명           │ 고객사    │ 예정일   │ 지연 │ 사유   ││
│ ├─────────────────────────────────────────────────────────────────────────┤│
│ │  ST-2025-018 │ 28일 반복독성    │ A제약     │ 01/10   │ +10일│ 검체지연││
│ │  ST-2025-023 │ 단회독성시험     │ B바이오   │ 01/12   │ +8일 │ 장비점검││
│ │  ST-2025-029 │ 유전독성시험     │ C헬스     │ 01/15   │ +5일 │ -      ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │  📅 이번 주 일정                                                        ││
│ ├─────────────────────────────────────────────────────────────────────────┤│
│ │  월 │ 화 │ 수 │ 목 │ 금 │ 토 │ 일                                       ││
│ │  20 │ 21 │ 22 │ 23 │ 24 │ 25 │ 26                                       ││
│ │ ─── │ ─── │ ─── │ ─── │ ─── │    │                                       ││
│ │ 시작│ 종료│    │ 보고│ 시작│    │                                       ││
│ │  2  │  1 │    │  3  │  1 │    │                                       ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.3 공통 컴포넌트

#### 3.3.1 ViewToggle (뷰 전환)

```tsx
// components/shared/ViewToggle.tsx

interface ViewToggleProps {
  currentView: 'table' | 'kanban' | 'calendar';
  onChange: (view: string) => void;
  options?: Array<'table' | 'kanban' | 'calendar'>;
}

// 사용: <ViewToggle currentView={view} onChange={setView} />
```

#### 3.3.2 DateRangePicker (기간 선택)

```tsx
// components/shared/DateRangePicker.tsx

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  presets?: Array<'today' | 'yesterday' | '7d' | '30d' | '90d' | 'custom'>;
}

interface DateRange {
  start: Date;
  end: Date;
  preset?: string;
}
```

#### 3.3.3 FilterPanel (필터 패널)

```tsx
// components/shared/FilterPanel.tsx

interface FilterPanelProps {
  filters: FilterConfig[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  onReset: () => void;
}

interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'text';
  options?: Array<{ value: any; label: string }>;
}
```

#### 3.3.4 ExportButton (내보내기)

```tsx
// components/shared/ExportButton.tsx

interface ExportButtonProps {
  onExport: (format: 'PDF' | 'EXCEL' | 'CSV') => void;
  loading?: boolean;
  disabled?: boolean;
  formats?: Array<'PDF' | 'EXCEL' | 'CSV'>;
}
```

---

### 3.4 상태 관리 (Zustand Stores)

```typescript
// stores/kanbanStore.ts
interface KanbanStore {
  columns: KanbanColumn[];
  settings: KanbanSettings;
  isLoading: boolean;
  
  // Actions
  fetchKanban: (entityType: string, filters?: any) => Promise<void>;
  moveItem: (itemId: string, targetColumn: string, index: number) => Promise<void>;
  updateSettings: (settings: Partial<KanbanSettings>) => void;
}

// stores/dashboardStore.ts
interface DashboardStore {
  dashboards: Dashboard[];
  currentDashboard: Dashboard | null;
  widgets: Widget[];
  isEditing: boolean;
  
  // Actions
  fetchDashboards: () => Promise<void>;
  setCurrentDashboard: (id: string) => void;
  addWidget: (widget: CreateWidgetRequest) => Promise<void>;
  removeWidget: (widgetId: string) => Promise<void>;
  updateLayout: (layout: GridLayout) => Promise<void>;
  toggleEditMode: () => void;
}

// stores/filterStore.ts
interface FilterStore {
  globalFilters: {
    dateRange: DateRange;
    userId?: string;
  };
  pageFilters: Record<string, Record<string, any>>;
  
  // Actions
  setGlobalDateRange: (range: DateRange) => void;
  setPageFilters: (page: string, filters: Record<string, any>) => void;
  resetFilters: (page?: string) => void;
}
```

---

*다음 섹션: 각 기능별 상세 명세*
# CHEMON CRM 확장 기능 - 기능별 상세 명세

---

## 4. 각 기능별 상세 명세

### 4.1 칸반 뷰 (Kanban View)

#### 4.1.1 기능 요구사항

| 구분 | 요구사항 | 우선순위 |
|------|----------|----------|
| 필수 | 드래그앤드롭으로 상태 변경 | P0 |
| 필수 | 컬럼별 아이템 수/금액 합계 표시 | P0 |
| 필수 | 카드 클릭 시 상세 페이지 이동 | P0 |
| 필수 | 테이블 뷰 ↔ 칸반 뷰 전환 | P0 |
| 중요 | 필터 (담당자, 기간, 유형 등) | P1 |
| 중요 | 검색 | P1 |
| 중요 | 카드 표시 필드 커스터마이징 | P1 |
| 권장 | 컬럼 접기/펼치기 | P2 |
| 권장 | 무한 스크롤 | P2 |

#### 4.1.2 지원 엔티티별 칸반 설정

```typescript
// 리드 칸반 - 파이프라인 9단계
const leadKanbanConfig = {
  entityType: 'lead',
  groupByField: 'stageId',
  columns: [
    { id: 'INQUIRY', name: '문의접수', color: '#3B82F6' },
    { id: 'REVIEW', name: '검토', color: '#F59E0B' },
    { id: 'QUOTATION', name: '견적송부', color: '#8B5CF6' },
    { id: 'LAB_CHECK_1', name: '연구소현황', color: '#EC4899' },
    { id: 'TEST_REVIEW', name: '시험의뢰검토', color: '#14B8A6' },
    { id: 'CONTRACT', name: '계약진행', color: '#10B981' },
    { id: 'LAB_CHECK_2', name: '연구소현황2', color: '#F97316' },
    { id: 'TEST_RECEIPT', name: '시험접수', color: '#6366F1' },
    { id: 'MANAGEMENT', name: '관리', color: '#6B7280' }
  ],
  cardFields: ['companyName', 'contactName', 'expectedAmount', 'user', 'createdAt']
};

// 견적서 칸반
const quotationKanbanConfig = {
  entityType: 'quotation',
  groupByField: 'status',
  columns: [
    { id: 'DRAFT', name: '작성중', color: '#6B7280' },
    { id: 'SENT', name: '발송완료', color: '#3B82F6' },
    { id: 'ACCEPTED', name: '승인', color: '#10B981' },
    { id: 'REJECTED', name: '거절', color: '#EF4444' },
    { id: 'EXPIRED', name: '만료', color: '#9CA3AF' }
  ],
  cardFields: ['customerName', 'projectName', 'totalAmount', 'validUntil', 'user']
};

// 계약 칸반
const contractKanbanConfig = {
  entityType: 'contract',
  groupByField: 'status',
  columns: [
    { id: 'NEGOTIATING', name: '협의중', color: '#F59E0B' },
    { id: 'SIGNED', name: '체결', color: '#3B82F6' },
    { id: 'TEST_RECEIVED', name: '시험접수', color: '#8B5CF6' },
    { id: 'IN_PROGRESS', name: '진행중', color: '#10B981' },
    { id: 'COMPLETED', name: '완료', color: '#6B7280' }
  ],
  cardFields: ['customer.name', 'title', 'totalAmount', 'endDate']
};

// 시험 칸반
const studyKanbanConfig = {
  entityType: 'study',
  groupByField: 'status',
  columns: [
    { id: 'REGISTERED', name: '접수', color: '#6B7280' },
    { id: 'PREPARING', name: '준비중', color: '#F59E0B' },
    { id: 'IN_PROGRESS', name: '진행중', color: '#3B82F6' },
    { id: 'ANALYSIS', name: '분석중', color: '#8B5CF6' },
    { id: 'REPORT_DRAFT', name: '보고서작성', color: '#EC4899' },
    { id: 'REPORT_REVIEW', name: '보고서검토', color: '#F97316' },
    { id: 'COMPLETED', name: '완료', color: '#10B981' }
  ],
  cardFields: ['studyNumber', 'testName', 'contract.customer.name', 'expectedEndDate']
};
```

---

### 4.2 자동화 엔진 (Automation Engine)

#### 4.2.1 기능 요구사항

| 구분 | 요구사항 | 우선순위 |
|------|----------|----------|
| 필수 | 상태 변경 트리거 | P0 |
| 필수 | 알림 발송 액션 | P0 |
| 필수 | 자동화 규칙 CRUD | P0 |
| 중요 | 조건 설정 (AND/OR) | P1 |
| 중요 | 만료일 기반 트리거 | P1 |
| 중요 | 실행 로그 조회 | P1 |
| 권장 | 이메일 발송 액션 | P2 |
| 권장 | 담당자 자동 배정 | P2 |
| 권장 | 지연 실행 | P2 |

#### 4.2.2 기본 제공 자동화 템플릿

```typescript
const defaultAutomationTemplates = [
  // 리드 관련
  {
    id: 'lead-qualified-notify',
    name: '리드 검토완료 시 담당자 알림',
    category: '리드 관리',
    trigger: { model: 'Lead', event: 'statusChange', toValue: 'QUALIFIED' },
    actions: [{ type: 'SEND_NOTIFICATION', to: 'owner', message: '{{companyName}} 리드 검토완료' }]
  },
  
  // 견적서 관련
  {
    id: 'quotation-expiring',
    name: '견적서 만료 7일 전 알림',
    category: '견적 관리',
    trigger: { model: 'Quotation', event: 'dateReached', field: 'validUntil', daysBefore: 7 },
    conditions: [{ field: 'status', operator: 'eq', value: 'SENT' }],
    actions: [{ type: 'SEND_NOTIFICATION', to: 'owner', message: '{{quotationNumber}} 7일 후 만료' }]
  },
  
  // 계약 관련
  {
    id: 'contract-signed-notify',
    name: '계약 체결 시 팀 알림',
    category: '계약 관리',
    trigger: { model: 'Contract', event: 'statusChange', toValue: 'SIGNED' },
    actions: [{ type: 'SEND_NOTIFICATION', to: 'role:ADMIN', message: '{{customer.name}} 계약 체결 (₩{{totalAmount}})' }]
  },
  
  // 시험 관련
  {
    id: 'study-delayed-notify',
    name: '시험 지연 시 알림',
    category: '시험 관리',
    trigger: { model: 'Study', event: 'dateReached', field: 'expectedEndDate', daysAfter: 1 },
    conditions: [{ field: 'status', operator: 'ne', value: 'COMPLETED' }],
    actions: [{ type: 'SEND_NOTIFICATION', to: 'role:ADMIN', message: '{{studyNumber}} 시험 지연' }]
  }
];
```

#### 4.2.3 자동화 처리 흐름

```
이벤트 발생 → 트리거 매칭 → 조건 평가 → 액션 실행 → 로그 기록
```

---

### 4.3 대시보드 & 위젯

#### 4.3.1 기본 대시보드 위젯 구성

| 위젯 | 타입 | 데이터 소스 | 설명 |
|------|------|-------------|------|
| 신규 리드 | KPI_CARD | Lead | 이번 달 신규 리드 수 |
| 진행중 견적 | KPI_CARD | Quotation | 발송된 견적서 수 |
| 진행중 계약 | KPI_CARD | Contract | 체결/진행중 계약 수 |
| 이번달 매출 | KPI_CARD | Contract | 완료 계약 금액 합계 |
| 매출 추이 | LINE_CHART | analytics/revenue | 월별 매출 그래프 |
| 영업 리더보드 | LEADERBOARD | analytics/performance | 담당자별 성과 순위 |
| 전환율 | FUNNEL_CHART | analytics/conversion | 리드→계약 전환율 |

#### 4.3.2 고급 분석 위젯

| 위젯 | 타입 | 설명 |
|------|------|------|
| 리드타임 분석 | BAR_CHART | 단계별 평균 소요일 |
| Lost 분석 | PIE_CHART | 실패 사유 분포 |
| 목표 달성률 | GAUGE | 월 목표 대비 달성률 |
| 예측 매출 | LINE_CHART | 파이프라인 기반 예측 |

---

### 4.4 활동 타임라인

#### 4.4.1 활동 유형

| 유형 | 아이콘 | 색상 | 설명 |
|------|--------|------|------|
| CALL | Phone | Green | 전화 상담 |
| EMAIL | Mail | Blue | 이메일 |
| MEETING | Users | Purple | 미팅 |
| NOTE | FileText | Yellow | 메모 |
| STATUS_CHANGE | RefreshCw | Gray | 상태 변경 (자동) |
| DOCUMENT | File | Teal | 문서 (견적서 등) |

#### 4.4.2 자동 활동 기록

- 리드 상태 변경 시 → STATUS_CHANGE 활동 자동 생성
- 견적서 발송 시 → DOCUMENT 활동 자동 생성
- 계약 체결 시 → STATUS_CHANGE 활동 자동 생성

---

### 4.5 시험 현황 대시보드

#### 4.5.1 핵심 KPI

| 지표 | 설명 | 계산 |
|------|------|------|
| 전체 시험 | 총 시험 수 | COUNT(Study) |
| 진행중 | 현재 진행중인 시험 | status IN (PREPARING, IN_PROGRESS, ANALYSIS) |
| 지연 시험 | 예정일 초과 시험 | expectedEndDate < TODAY AND status != COMPLETED |
| 연구소 가동률 | 처리량 대비 진행량 | 진행중 시험 / 최대 처리량 × 100 |

#### 4.5.2 지연 시험 판정

```typescript
// 지연 = 예정 종료일 < 오늘 AND 상태 != 완료/중단
const isDelayed = (study) => {
  if (['COMPLETED', 'SUSPENDED'].includes(study.status)) return false;
  return new Date(study.expectedEndDate) < new Date();
};

// 지연일수 계산
const delayDays = (study) => {
  const diff = new Date() - new Date(study.expectedEndDate);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
```

---

### 4.6 리포트

#### 4.6.1 기본 제공 리포트

| 리포트 | 설명 | 주요 필터 |
|--------|------|----------|
| 매출 요약 | 기간별 매출 현황 | 기간, 담당자, 유형 |
| 파이프라인 현황 | 단계별 건수/금액 | 기간, 담당자 |
| 팀 성과 | 담당자별 실적 | 기간 |
| 시험 현황 | 시험 진행 상황 | 기간, 상태, 고객사 |
| 고객 분석 | 고객사별 거래 | 기간, 등급 |

#### 4.6.2 내보내기 형식

- **PDF**: 차트 포함, 인쇄용 (React PDF)
- **Excel**: 데이터 분석용, 피벗 가능 (xlsx)
- **CSV**: 간단한 데이터 추출

---

## 5. 구현 우선순위 & 일정

### Phase 1: 핵심 기능 (2-3주)
- [x] 스키마 설계
- [ ] 칸반 뷰 (리드, 견적, 계약, 시험)
- [ ] 기본 대시보드 (KPI 카드, 차트)
- [ ] 활동 타임라인

### Phase 2: 자동화 & 고급 대시보드 (2-3주)
- [ ] 자동화 엔진
- [ ] 고급 대시보드 위젯
- [ ] 시험 현황 대시보드

### Phase 3: 리포트 (1-2주)
- [ ] 리포트 조회/실행
- [ ] PDF/Excel 내보내기

### Phase 4: 고도화 (1-2주)
- [ ] 자동화 고급 기능
- [ ] 커스텀 대시보드/리포트

---

## 6. 기술 스택 (추가)

| 기능 | 라이브러리 | 용도 |
|------|-----------|------|
| 드래그앤드롭 | @dnd-kit/core | 칸반 드래그앤드롭 |
| 그리드 레이아웃 | react-grid-layout | 대시보드 위젯 배치 |
| 차트 | recharts | 대시보드 차트 |
| 날짜 선택 | react-day-picker | 기간 필터 |
| PDF 생성 | @react-pdf/renderer | 리포트 PDF |
| Excel 생성 | xlsx | 리포트 Excel |
| 스케줄러 | node-cron | 자동화 예약 실행 |

---

*문서 끝*
