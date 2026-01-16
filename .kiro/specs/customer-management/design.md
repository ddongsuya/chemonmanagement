# Design Document: Customer Management Module

## Overview

고객사 관리 모듈의 대규모 업데이트로, 기존 단순 고객사 정보 관리에서 의뢰자 관리, 시험 접수, 세금계산서 발행 일정, 진행 단계 워크플로우, 미팅 기록, 캘린더 연동까지 확장된 통합 고객 관계 관리(CRM) 시스템을 구축합니다.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Customer Management Module                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Customer   │  │  Requester  │  │    Test     │             │
│  │   Detail    │  │  Management │  │  Reception  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│         │                │                │                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Progress   │  │   Meeting   │  │  Invoice    │             │
│  │  Workflow   │  │   Records   │  │  Schedule   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                          │                                      │
│                  ┌─────────────┐                                │
│                  │  Calendar   │                                │
│                  │   Module    │                                │
│                  └─────────────┘                                │
├─────────────────────────────────────────────────────────────────┤
│                      Storage Layer                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  localStorage: customers, requesters, test_receptions,   │   │
│  │  invoice_schedules, meeting_records, calendar_events     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. 페이지 컴포넌트

#### CustomerDetailPage (업데이트)

- 경로: `/customers/[id]`
- 탭 기반 레이아웃으로 변경
- 탭: 개요, 의뢰자, 시험접수, 세금계산서, 미팅기록, 타임라인

#### CalendarPage (신규)

- 경로: `/calendar`
- 월간/주간/일간 뷰 전환
- 이벤트 유형별 색상 구분

### 2. 컴포넌트 구조

```
components/customer/
├── CustomerDetailTabs.tsx      # 탭 컨테이너
├── tabs/
│   ├── OverviewTab.tsx         # 개요 탭 (회사정보, 통계, 진행단계)
│   ├── RequesterTab.tsx        # 의뢰자 관리 탭
│   ├── TestReceptionTab.tsx    # 시험 접수 탭
│   ├── InvoiceScheduleTab.tsx  # 세금계산서 일정 탭
│   ├── MeetingRecordTab.tsx    # 미팅 기록 탭
│   └── TimelineTab.tsx         # 활동 타임라인 탭
├── RequesterForm.tsx           # 의뢰자 등록/수정 폼
├── RequesterCard.tsx           # 의뢰자 카드
├── TestReceptionForm.tsx       # 시험 접수 폼
├── TestReceptionTable.tsx      # 시험 목록 테이블
├── InvoiceScheduleForm.tsx     # 세금계산서 일정 폼
├── InvoiceScheduleTable.tsx    # 세금계산서 목록 테이블
├── MeetingRecordForm.tsx       # 미팅 기록 폼
├── MeetingRecordList.tsx       # 미팅 기록 목록
├── ProgressWorkflow.tsx        # 진행 단계 워크플로우
├── WorkflowChecklist.tsx       # 단계별 체크리스트
└── CustomerAlerts.tsx          # 긴급 알림 영역

components/calendar/
├── CalendarView.tsx            # 캘린더 메인 뷰
├── CalendarHeader.tsx          # 캘린더 헤더 (뷰 전환, 네비게이션)
├── MonthView.tsx               # 월간 뷰
├── WeekView.tsx                # 주간 뷰
├── DayView.tsx                 # 일간 뷰
├── EventCard.tsx               # 이벤트 카드
├── EventForm.tsx               # 이벤트 등록/수정 폼
└── EventDetailModal.tsx        # 이벤트 상세 모달
```

### 3. 인터페이스 정의

```typescript
// types/customer.ts

// 의뢰자
interface Requester {
  id: string;
  customer_id: string;
  name: string;
  position: string; // 직책
  department: string; // 부서
  phone: string;
  email: string;
  is_primary: boolean; // 주 담당자 여부
  is_active: boolean; // 활성화 상태
  created_at: string;
  updated_at: string;
}

// 시험 접수
interface TestReception {
  id: string;
  customer_id: string;
  requester_id: string;
  contract_id: string;
  quotation_id: string;

  // 헤더 정보
  substance_code: string; // 물질코드
  project_code: string; // 프로젝트코드
  substance_name: string; // 시험물질명
  institution_name: string; // 의뢰기관명
  test_number: string; // 시험번호
  test_title: string; // 시험제목
  test_director: string; // 시험책임자

  // 금액 정보
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;

  // 상태
  status: "received" | "in_progress" | "completed" | "cancelled";
  reception_date: string;
  expected_completion_date: string;
  actual_completion_date?: string;

  created_at: string;
  updated_at: string;
}

// 세금계산서 발행 일정
interface InvoiceSchedule {
  id: string;
  test_reception_id: string;
  customer_id: string;

  amount: number;
  scheduled_date: string; // 발행 예정일
  issued_date?: string; // 실제 발행일
  invoice_number?: string; // 세금계산서 번호

  payment_type: "full" | "partial"; // 전액/분할
  installment_number?: number; // 분할 회차
  total_installments?: number; // 총 분할 횟수

  status: "pending" | "issued" | "paid" | "overdue";
  notes?: string;

  created_at: string;
  updated_at: string;
}

// 진행 단계
interface ProgressStage {
  id: string;
  customer_id: string;
  quotation_id?: string;
  contract_id?: string;

  current_stage:
    | "inquiry" // 문의접수
    | "quotation_sent" // 견적서 송부
    | "test_request" // 시험 의뢰 요청
    | "contract_signed" // 계약 체결
    | "test_reception" // 시험접수
    | "test_management" // 시험관리
    | "fund_management"; // 자금관리

  checklist: ChecklistItem[];

  stage_history: StageHistoryItem[];

  created_at: string;
  updated_at: string;
}

interface ChecklistItem {
  id: string;
  stage: string;
  title: string;
  description?: string;
  is_completed: boolean;
  completed_at?: string;
  completed_by?: string;
}

interface StageHistoryItem {
  stage: string;
  entered_at: string;
  completed_at?: string;
  notes?: string;
}

// 미팅 기록
interface MeetingRecord {
  id: string;
  customer_id: string;
  requester_id?: string;

  type: "meeting" | "call" | "email" | "visit";
  date: string;
  time?: string;
  duration?: number; // 분 단위

  title: string;
  attendees: string[];
  content: string; // 리치 텍스트
  follow_up_actions?: string;

  attachments?: Attachment[];

  // 요청사항 관련
  is_request: boolean;
  request_status?: "pending" | "in_progress" | "completed";
  request_completed_at?: string;
  request_response?: string;

  created_at: string;
  updated_at: string;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

// 캘린더 이벤트
interface CalendarEvent {
  id: string;
  customer_id?: string;
  test_reception_id?: string;
  invoice_schedule_id?: string;
  meeting_record_id?: string;

  type: "meeting" | "invoice" | "deadline" | "reminder" | "other";
  title: string;
  description?: string;

  start_date: string;
  end_date?: string;
  all_day: boolean;

  color?: string;

  reminder_before?: number; // 분 단위

  created_at: string;
  updated_at: string;
}
```

## Data Models

### Storage Abstraction Layer (백엔드 연동 대비)

현재는 localStorage를 사용하지만, 추후 백엔드 API 연동을 위해 추상화 레이어를 구성합니다.

```typescript
// lib/storage/storage-interface.ts
interface StorageAdapter {
  get<T>(key: string, id: string): Promise<T | null>;
  getAll<T>(key: string): Promise<T[]>;
  save<T>(key: string, data: T): Promise<T>;
  update<T>(key: string, id: string, data: Partial<T>): Promise<T>;
  delete(key: string, id: string): Promise<boolean>;
  query<T>(key: string, filter: QueryFilter): Promise<T[]>;
}

// 현재 구현: localStorage
// lib/storage/local-storage-adapter.ts
class LocalStorageAdapter implements StorageAdapter { ... }

// 추후 구현: API 연동
// lib/storage/api-storage-adapter.ts
class ApiStorageAdapter implements StorageAdapter { ... }

// 팩토리 패턴으로 전환 용이하게
// lib/storage/index.ts
export const storage = createStorageAdapter(
  process.env.NEXT_PUBLIC_USE_API === 'true' ? 'api' : 'local'
);
```

### API 엔드포인트 설계 (추후 백엔드 연동용)

```typescript
// 의뢰자 API
GET    /api/customers/:customerId/requesters
POST   /api/customers/:customerId/requesters
PUT    /api/requesters/:id
DELETE /api/requesters/:id

// 시험 접수 API
GET    /api/customers/:customerId/test-receptions
POST   /api/test-receptions
PUT    /api/test-receptions/:id
GET    /api/test-receptions/:id

// 세금계산서 일정 API
GET    /api/customers/:customerId/invoice-schedules
POST   /api/invoice-schedules
PUT    /api/invoice-schedules/:id
GET    /api/invoice-schedules/upcoming?days=7

// 미팅 기록 API
GET    /api/customers/:customerId/meeting-records
POST   /api/meeting-records
PUT    /api/meeting-records/:id
DELETE /api/meeting-records/:id

// 캘린더 이벤트 API
GET    /api/calendar-events?start=:date&end=:date
POST   /api/calendar-events
PUT    /api/calendar-events/:id
DELETE /api/calendar-events/:id

// 진행 단계 API
GET    /api/customers/:customerId/progress
PUT    /api/progress/:id/stage
PUT    /api/progress/:id/checklist/:itemId
```

### localStorage 키 구조 (현재 구현)

```typescript
// 저장소 키
const STORAGE_KEYS = {
  CUSTOMERS: "chemon_customers",
  REQUESTERS: "chemon_requesters",
  TEST_RECEPTIONS: "chemon_test_receptions",
  INVOICE_SCHEDULES: "chemon_invoice_schedules",
  PROGRESS_STAGES: "chemon_progress_stages",
  MEETING_RECORDS: "chemon_meeting_records",
  CALENDAR_EVENTS: "chemon_calendar_events",
};
```

### 데이터 관계

```
Customer (1) ──── (N) Requester
    │
    ├──── (N) Quotation
    │         │
    │         └──── (1) Contract
    │                   │
    │                   └──── (N) TestReception
    │                              │
    │                              └──── (N) InvoiceSchedule
    │
    ├──── (N) MeetingRecord
    │
    ├──── (1) ProgressStage
    │
    └──── (N) CalendarEvent
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: 데이터 저장 라운드트립

_For any_ 의뢰자, 시험접수, 미팅기록, 캘린더이벤트 데이터, 저장 후 조회하면 원본 데이터와 동일한 값을 반환하고, 연결된 ID(customer_id, contract_id, requester_id 등)가 올바르게 유지된다
**Validates: Requirements 1.2, 2.3, 8.1, 8.2, 8.3, 8.4**

### Property 2: 의뢰자별 데이터 필터링

_For any_ 고객사와 해당 고객사의 의뢰자 목록, 특정 의뢰자로 필터링한 견적/계약/시험접수 목록은 해당 의뢰자의 데이터만 포함한다
**Validates: Requirements 1.3**

### Property 3: 의뢰자 수정 시 데이터 무결성

_For any_ 의뢰자 정보 수정, 수정 전후 연관된 견적/계약 데이터의 requester_id는 변경되지 않고 유지된다
**Validates: Requirements 1.4**

### Property 4: 의뢰자 삭제 정책

_For any_ 의뢰자 삭제 요청, 연관된 견적/계약이 있으면 is_active가 false로 변경되고, 연관 데이터가 없으면 완전 삭제된다
**Validates: Requirements 1.5**

### Property 5: 시험 접수 연결 관계

_For any_ 시험 접수 데이터, 저장 후 조회 시 contract_id, requester_id, customer_id가 모두 유효한 값으로 연결되어 있다
**Validates: Requirements 2.3**

### Property 6: 조회 결과 필수 필드 포함

_For any_ 시험 목록 또는 세금계산서 일정 조회, 반환된 모든 항목은 필수 필드(시험번호, 금액, 상태 등)를 포함한다
**Validates: Requirements 2.4, 3.3**

### Property 7: 시험 수정 시 타임스탬프 갱신

_For any_ 시험 정보 수정, 수정 후 updated_at 필드는 수정 전보다 이후 시간이다
**Validates: Requirements 2.5**

### Property 8: 세금계산서 발행 예정일 자동 계산

_For any_ 시험 접수 등록, 기본 발행 예정일은 접수일로부터 30일 후이다
**Validates: Requirements 3.1**

### Property 9: 세금계산서 발행 예정일 커스텀 설정

_For any_ 별도 지급 조건이 설정된 계약, 세금계산서 발행 예정일은 해당 조건에 따라 설정된다
**Validates: Requirements 3.2**

### Property 10: 임박 발행 일정 필터링

_For any_ 세금계산서 발행 일정 목록, 발행 예정일이 현재 날짜로부터 7일 이내인 항목은 임박 항목으로 분류된다
**Validates: Requirements 3.4**

### Property 11: 세금계산서 발행 완료 상태 변경

_For any_ 세금계산서 발행 완료 처리, 상태는 'issued'로 변경되고 issued_date와 invoice_number가 기록된다
**Validates: Requirements 3.5**

### Property 12: 분할 지급 개별 관리

_For any_ 분할 지급 조건이 설정된 시험, 분할 횟수만큼의 InvoiceSchedule 레코드가 생성되고 각각 개별 금액과 발행 예정일을 가진다
**Validates: Requirements 3.6**

### Property 13: 진행 단계 전환

_For any_ 진행 단계 완료 처리, 현재 단계가 완료 상태로 변경되고 다음 단계가 활성화된다
**Validates: Requirements 4.2**

### Property 14: 단계별 체크리스트 조회

_For any_ 진행 단계, 해당 단계에 정의된 체크리스트 항목 목록을 반환한다
**Validates: Requirements 4.3**

### Property 15: 체크리스트 완료 시 단계 진행 가능

_For any_ 진행 단계의 체크리스트, 모든 항목이 완료 상태이면 다음 단계 진행이 가능하다
**Validates: Requirements 4.4**

### Property 16: 타임라인 시간순 정렬

_For any_ 미팅 기록 또는 활동 타임라인 조회, 반환된 목록은 날짜 기준 내림차순(최신순)으로 정렬된다
**Validates: Requirements 5.2, 7.4**

### Property 17: 요청사항 상태 관리

_For any_ 요청사항 등록, 초기 상태는 'pending'이고, 처리 완료 시 'completed'로 변경되며 처리일이 기록된다
**Validates: Requirements 5.4, 5.5**

### Property 18: 자동 캘린더 이벤트 생성

_For any_ 미팅 일정 또는 세금계산서 발행 예정일 등록, 해당 날짜에 캘린더 이벤트가 자동으로 생성된다
**Validates: Requirements 6.2, 6.3**

### Property 19: 캘린더 이벤트 날짜 범위 검색

_For any_ 날짜 범위 검색 요청, 해당 범위 내의 모든 캘린더 이벤트가 반환된다
**Validates: Requirements 8.4**

### Property 20: 긴급 항목 필터링

_For any_ 고객사 상세 조회, 발행 예정일 임박, 미처리 요청사항 등 긴급 처리가 필요한 항목이 알림 목록에 포함된다
**Validates: Requirements 7.2**

### Property 21: 데이터 조인 통합 뷰

_For any_ 고객사 ID로 조회 요청, 해당 고객사의 의뢰자, 견적, 계약, 시험접수, 미팅기록이 모두 연결되어 반환된다
**Validates: Requirements 8.5**

## Error Handling

### 데이터 저장 오류

- localStorage 용량 초과 시 사용자에게 알림 표시
- 필수 필드 누락 시 저장 전 유효성 검사 실패 메시지 표시

### 데이터 조회 오류

- 존재하지 않는 ID 조회 시 null 반환 및 적절한 UI 표시
- 연결된 데이터가 삭제된 경우 graceful degradation

### 날짜 계산 오류

- 유효하지 않은 날짜 입력 시 기본값 사용 또는 오류 메시지 표시

## Testing Strategy

### Property-Based Testing

- fast-check 라이브러리 사용
- 각 correctness property에 대해 최소 100회 반복 테스트
- 테스트 파일: `__tests__/customer-management-*.test.ts`

### Unit Tests

- 각 storage 함수에 대한 단위 테스트
- 날짜 계산 유틸리티 함수 테스트
- 필터링 및 정렬 로직 테스트

### Integration Tests

- 컴포넌트 렌더링 테스트
- 폼 제출 및 데이터 저장 플로우 테스트
- 탭 전환 및 데이터 로딩 테스트
