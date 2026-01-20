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
