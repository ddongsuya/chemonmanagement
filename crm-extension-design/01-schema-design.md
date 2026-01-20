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
