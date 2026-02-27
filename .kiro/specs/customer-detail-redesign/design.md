# 기술 설계: 고객 상세 페이지 재구성 및 캘린더 연동

## 개요

고객 상세 페이지(`/customers/[id]`)를 탭 기반 UI로 재구성한다. 백엔드 API는 이미 전부 구현되어 있으므로 프론트엔드 작업만 진행한다.

## 아키텍처

### 컴포넌트 구조

```
customers/[id]/page.tsx (메인 페이지)
├── PageHeader (기존 컴포넌트 재사용)
├── CustomerSummaryHeader (신규 - 고객 요약 헤더)
├── Tabs (shadcn/ui tabs)
│   ├── OverviewTab (신규 - 개요 탭)
│   ├── CalendarView (기존 컴포넌트 재사용, customerId prop)
│   ├── MeetingRecordTab (신규 - 미팅 기록 탭)
│   ├── TestReceptionTab (신규 - 시험 접수 탭)
│   ├── InvoiceScheduleTab (신규 - 세금계산서 탭)
│   └── RequesterTab (신규 - 의뢰자 탭)
└── CustomerForm Dialog (기존 수정 다이얼로그)
```

### 파일 구조

```
chemon-quotation/
├── app/(dashboard)/customers/[id]/
│   └── page.tsx                          # 메인 페이지 (재작성)
└── components/customer-detail/
    ├── CustomerSummaryHeader.tsx          # 고객 요약 헤더
    ├── OverviewTab.tsx                    # 개요 탭
    ├── MeetingRecordTab.tsx              # 미팅 기록 탭
    ├── TestReceptionTab.tsx              # 시험 접수 탭
    ├── InvoiceScheduleTab.tsx            # 세금계산서 탭
    └── RequesterTab.tsx                  # 의뢰자 탭
```

## 상세 설계

### 1. 메인 페이지 (`page.tsx`)

- 고객 데이터 로드 (`getCustomerById`)
- `Tabs` 컴포넌트로 6개 탭 렌더링
- 각 탭은 lazy loading: 탭 전환 시 해당 탭 데이터만 로드
- 탭 상태는 `useState`로 관리

```typescript
// 탭 정의
type TabType = 'overview' | 'calendar' | 'meetings' | 'tests' | 'invoices' | 'requesters';
```

### 2. CustomerSummaryHeader

고객 기본 정보를 요약 표시하는 헤더 컴포넌트.

Props:
```typescript
interface CustomerSummaryHeaderProps {
  customer: Customer;
  onGradeChange: (grade: string) => void;
  gradeUpdating: boolean;
  onEdit: () => void;
}
```

표시 항목: 회사명, 등급 셀렉트, 담당자, 연락처, 수정 버튼

### 3. OverviewTab

개요 탭. 기본 정보 + 진행 단계 + 최근 활동 요약.

Props:
```typescript
interface OverviewTabProps {
  customer: Customer;
  customerId: string;
  onTabChange: (tab: TabType) => void;
}
```

- `progressStageApi.getByCustomerId` → 진행 단계 표시
- `meetingRecordApi.getByCustomerId` → 최근 3건 표시
- `calendarEventApi.getByCustomerId` → 다가오는 3건 표시
- 각 섹션에 "더보기" 링크 → `onTabChange`로 해당 탭 전환

### 4. MeetingRecordTab

미팅 기록 목록. 날짜 최신순 정렬.

Props:
```typescript
interface MeetingRecordTabProps {
  customerId: string;
}
```

- `meetingRecordApi.getByCustomerId` 호출
- 유형별 아이콘: meeting(👥), call(📞), email(📧), visit(🏢)
- 클릭 시 상세 내용 확장 (Collapsible 또는 Dialog)
- 빈 상태 메시지 처리

### 5. TestReceptionTab

시험 접수 현황 테이블.

Props:
```typescript
interface TestReceptionTabProps {
  customerId: string;
}
```

- `testReceptionApi.getByCustomerId` 호출
- 상태별 배지: received(파랑), in_progress(노랑), completed(초록), cancelled(빨강)
- 금액 정보 표시 (총액/납부/잔액)
- 빈 상태 메시지 처리

### 6. InvoiceScheduleTab

세금계산서 일정 테이블.

Props:
```typescript
interface InvoiceScheduleTabProps {
  customerId: string;
}
```

- `invoiceScheduleApi.getByCustomerId` 호출
- 상태별 배지: pending(회색), issued(파랑), paid(초록), overdue(빨강)
- 발행예정일 기준 정렬
- 빈 상태 메시지 처리

### 7. RequesterTab

의뢰자 목록.

Props:
```typescript
interface RequesterTabProps {
  customerId: string;
}
```

- `requesterApi.getByCustomerId` 호출
- 주 담당자 배지 표시
- 비활성 의뢰자 opacity 처리
- 빈 상태 메시지 처리

### 8. 캘린더 탭

기존 `CalendarView` 컴포넌트를 `customerId` prop으로 재사용. 추가 개발 불필요.

## 데이터 로딩 전략

- 각 탭 컴포넌트 내부에서 `useEffect`로 데이터 로드
- 탭 전환 시 이미 마운트된 탭은 재렌더링하지 않음 (탭 컨텐츠를 조건부 `hidden` 처리 대신 조건부 렌더링)
- 로딩 중 스켈레톤 UI 표시
- API 실패 시 오류 메시지 + 재시도 버튼

## 사용 기술

- shadcn/ui: Tabs, Card, Badge, Button, Select, Dialog, Skeleton, Collapsible
- lucide-react: 아이콘
- 기존 API: `customer-data-api.ts`의 모든 API 함수
- 기존 컴포넌트: CalendarView, CustomerForm, PageHeader
