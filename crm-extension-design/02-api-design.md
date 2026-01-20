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
