# 고객사 관리 모듈 리디자인 — Monday Sales CRM 스타일

## 개요

현재 고객사 관리 모듈(`/customers`, `/customers/[id]`)을 Monday Sales CRM의 디자인 철학을 참고하여 전면 리디자인한다.

**핵심 방향:**
- 테이블 중심 뷰 (스프레드시트 느낌)
- 뷰 탭 상단 배치 (카드/테이블/칸반)
- KPI 대시보드 축소 → 접이식 요약 바
- 컬럼 커스터마이징 가능한 테이블
- 색상 코딩된 상태 셀
- 미니멀 필터 바
- 상세 페이지: 3컬럼 → 리드 상세 페이지 스타일 통일

**참고 디자인:** 리드 상세 페이지 (`/leads/[id]`) — sticky 헤더, 파이프라인 스테퍼, 좌측 사이드바 + 우측 탭 콘텐츠

---

## Phase 1: 리스트 페이지 (`/customers`) 리디자인

### 1.1 KPI 대시보드 → 접이식 요약 바

**현재:** 4개 StatCard + 4개 차트 (PieChart, BarChart, LineChart, FunnelChart) → 세로 공간 과다 사용

**변경:** 한 줄 요약 바 + 접이식 차트 패널

```tsx
// components/customer/CustomerSummaryBar.tsx
'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Users, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getKPIData } from '@/lib/unified-customer-api';

interface SummaryBarProps {
  onFilterByGrade?: (grade: string) => void;
}

export function CustomerSummaryBar({ onFilterByGrade }: SummaryBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [kpi, setKpi] = useState<any>(null);

  useEffect(() => {
    getKPIData().then(res => {
      if (res.success && res.data) setKpi(res.data);
    });
  }, []);

  const newCount = typeof kpi?.newCustomers === 'object'
    ? kpi.newCustomers.count : (kpi?.newCustomers ?? 0);

  return (
    <div className="mb-4">
      {/* 한 줄 요약 */}
      <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-2.5">
        <div className="flex items-center gap-6 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            신규 <span className="font-semibold text-foreground">{newCount}</span>
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            활성 거래 <span className="font-semibold text-foreground">{kpi?.activeDeals ?? 0}</span>
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" />
            미수금 <span className="font-semibold text-foreground">₩{(kpi?.outstandingAmount ?? 0).toLocaleString()}</span>
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5" />
            등급 <span className="font-semibold text-foreground">{kpi?.gradeDistribution?.length ?? 0}개</span>
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="h-7 px-2">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* 접이식 차트 패널 — 기존 KPIDashboard 차트 4개를 여기에 배치 */}
      {expanded && (
        <div className="mt-2 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 기존 recharts 차트 4개 재사용 */}
        </div>
      )}
    </div>
  );
}
```

### 1.2 뷰 탭 + 필터 바 통합

**현재:** Card 안에 ViewModeToggle + SortControl + FilterPresetManager + AdvancedFilterPanel이 중첩

**변경:** Monday 스타일 — 상단에 뷰 탭, 그 아래 인라인 필터 바

```tsx
// 리스트 페이지 상단 구조 (page.tsx 내부)
<div className="space-y-3">
  {/* 페이지 헤더 + 액션 버튼 */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-lg font-semibold">고객사 관리</h1>
      <p className="text-xs text-muted-foreground">리드와 고객을 통합하여 관리합니다</p>
    </div>
    <div className="flex items-center gap-2">
      <ImportExportPanel onImportSuccess={loadData} />
      <Button variant="outline" size="sm" onClick={loadData}>
        <RefreshCw className="w-4 h-4 mr-1" /> 새로고침
      </Button>
      <Button size="sm"><Plus className="w-4 h-4 mr-1" /> 신규 등록</Button>
    </div>
  </div>

  {/* 요약 바 */}
  <CustomerSummaryBar />

  {/* 뷰 탭 + 인라인 필터 */}
  <div className="rounded-lg border bg-card">
    <div className="flex items-center justify-between border-b px-3 py-2">
      <ViewModeToggle />
      <div className="flex items-center gap-2">
        <SortControl filters={filters} onFilterChange={handleFilterChange} />
        <FilterPresetManager filters={filters} onApplyPreset={handleFilterChange} />
      </div>
    </div>
    <div className="px-3 py-2">
      <AdvancedFilterPanel filters={filters} stages={stages}
        onFilterChange={handleFilterChange} loading={loading || stagesLoading} />
    </div>
  </div>

  {/* 일괄 작업 바 */}
  <BulkActionBar ... />

  {/* 엔티티 목록 (카드/테이블/칸반) */}
  {/* ... */}
</div>
```

### 1.3 테이블 뷰 개선 — Monday 스프레드시트 스타일

**현재:** 기본 테이블 + 정렬 기능

**변경:**
- 행 높이 축소 (py-2 → py-1.5)
- 상태 셀에 색상 배경 (Monday 스타일 컬러 셀)
- 인라인 등급 변경 (셀 클릭 → 드롭다운)
- 고정 첫 번째 열 (회사명)
- 행 호버 시 빠른 액션 아이콘 표시

```tsx
// TableView.tsx 개선 포인트

// 1. 상태/등급 셀 — 색상 배경 적용
{
  accessorKey: 'displayStage',
  header: '단계',
  cell: ({ row }) => (
    <span
      className="inline-block rounded px-2.5 py-1 text-xs font-medium"
      style={{
        backgroundColor: row.original.stageColor + '15',
        color: row.original.stageColor,
        borderLeft: `3px solid ${row.original.stageColor}`,
      }}
    >
      {row.original.displayStage}
    </span>
  ),
}

// 2. 등급 셀 — 인라인 드롭다운
{
  accessorKey: 'grade',
  header: '등급',
  cell: ({ row }) => (
    <InlineGradeSelect
      value={row.original.grade}
      onChange={(grade) => onGradeChange?.(row.original, grade)}
    />
  ),
}

// 3. 행 호버 시 빠른 액션
// 마지막 열에 opacity-0 group-hover:opacity-100 으로 전화/이메일/더보기 아이콘
```

### 1.4 카드 뷰 개선

**현재:** VirtualizedCardGrid 사용 중

**변경:** 카드 디자인을 더 컴팩트하게, 정보 밀도 높이기
- 카드 상단: 회사명 + 등급 배지
- 카드 중간: 담당자, 연락처 (한 줄)
- 카드 하단: 단계 + 건강도 + 최근활동
- 카드 크기 축소, 3→4열 그리드

---

## Phase 2: 상세 페이지 (`/customers/[id]`) 리디자인

### 2.1 레이아웃 변경 — 리드 상세 페이지 스타일 통일

**현재:** CustomerSummaryHeader + 가로 탭 14개 (overflow-x-auto)

**변경:** 리드 상세 페이지와 동일한 3컬럼 레이아웃

```
┌─────────────────────────────────────────────────────┐
│ 브레드크럼: 고객사 관리 > (주)ABC                      │
│ [이니셜 아바타] (주)ABC  [등급 배지] [등급 Select]      │
│ 담당자: 홍길동 · 010-1234-5678 · hong@abc.com         │
│ [파이프라인 스테퍼 — 진행 단계 시각화]                   │
├──────────────┬──────────────────────────────────────┤
│ 좌측 사이드바  │ 우측 메인 콘텐츠 (탭)                  │
│ (1/3 너비)    │ (2/3 너비)                            │
│              │                                       │
│ ■ 핵심 지표   │ [개요] [미팅] [견적서] [계약] [시험접수]  │
│  건강도: 85   │ [세금계산서] [상담] [활동] [메모] [문서]  │
│  이탈위험: 20  │ [변경이력] [의뢰자]                     │
│  데이터: 90   │                                       │
│              │ ┌─────────────────────────────────┐   │
│ ■ 기본 정보   │ │ 탭 콘텐츠 영역                    │   │
│  회사명       │ │                                 │   │
│  주소         │ │                                 │   │
│  등록일       │ └─────────────────────────────────┘   │
│              │                                       │
│ ■ 담당자 정보  │                                       │
│  이름/전화/   │                                       │
│  이메일       │                                       │
│              │                                       │
│ ■ 거래 요약   │                                       │
│  견적 N건     │                                       │
│  계약 N건     │                                       │
│  미수금 ₩N   │                                       │
└──────────────┴──────────────────────────────────────┘
```

### 2.2 Sticky 헤더 + 브레드크럼

```tsx
// CustomerDetailPage 상단 구조
<div className="min-h-screen bg-slate-50/50">
  {/* Sticky 헤더 */}
  <div className="bg-white border-b sticky top-0 z-10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      {/* 브레드크럼 */}
      <div className="flex items-center gap-2 py-2.5 text-sm text-muted-foreground">
        <button onClick={() => router.push('/customers')} className="hover:text-foreground transition-colors">
          고객사 관리
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium truncate">{customer.company}</span>
      </div>

      {/* 메인 헤더 — 리드 상세와 동일 패턴 */}
      <div className="flex items-start justify-between pb-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900
            flex items-center justify-center text-white font-bold text-lg shrink-0">
            {(customer.company || customer.name).charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 truncate">
                {customer.company || customer.name}
              </h1>
              <GradeBadge grade={customer.grade} />
              <GradeSelect value={customer.grade} onChange={handleGradeChange} disabled={gradeUpdating} />
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span>{customer.name}</span>
              <span>·</span>
              <span>{daysSinceCreated}일 거래</span>
              {customer.phone && <><span>·</span><span>{customer.phone}</span></>}
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Edit className="w-3.5 h-3.5 mr-1.5" /> 수정
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><MoreHorizontal className="w-4 h-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>삭제</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 진행 단계 스테퍼 (ProgressStage 기반) */}
      <CustomerProgressStepper customerId={customerId} />
    </div>
  </div>

  {/* 본문: 3컬럼 레이아웃 */}
  <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 좌측 사이드바 */}
      <div className="lg:col-span-1 space-y-4">
        {/* 핵심 지표 */}
        <ScoreGaugePanel customerId={customerId} />
        {/* 기본 정보 */}
        <CustomerInfoPanel customer={customer} />
        {/* 거래 요약 */}
        <DealSummaryPanel customerId={customerId} />
      </div>

      {/* 우측 메인 콘텐츠 */}
      <div className="lg:col-span-2">
        <CustomerDetailTabs customerId={customerId} customer={customer} />
      </div>
    </div>
  </div>
</div>
```

### 2.3 좌측 사이드바 컴포넌트

```tsx
// components/customer-detail/ScoreGaugePanel.tsx
// 건강도, 이탈위험, 데이터품질 — MiniGauge 3개를 세로 배치

// components/customer-detail/CustomerInfoPanel.tsx
// 리드 상세의 InfoRow 패턴 재사용
// 회사명, 주소, 등록일, 수정일 등

// components/customer-detail/DealSummaryPanel.tsx
// 견적 N건, 계약 N건, 미수금 ₩N — 간결한 수치 표시
```

### 2.4 탭 구조 정리

**현재:** 14개 탭이 가로 스크롤

**변경:** 주요 탭 7개 + "더보기" 드롭다운

```tsx
// 주요 탭 (항상 표시)
const PRIMARY_TABS = [
  { value: 'overview', label: '개요' },
  { value: 'meetings', label: '미팅' },
  { value: 'quotations', label: '견적서' },
  { value: 'contracts', label: '계약' },
  { value: 'tests', label: '시험접수' },
  { value: 'consultations', label: '상담' },
  { value: 'activity-timeline', label: '활동' },
];

// 더보기 탭 (드롭다운)
const SECONDARY_TABS = [
  { value: 'calendar', label: '캘린더' },
  { value: 'invoices', label: '세금계산서' },
  { value: 'notes', label: '메모' },
  { value: 'documents', label: '문서' },
  { value: 'audit-log', label: '변경이력' },
  { value: 'requesters', label: '의뢰자' },
];
```

탭 스타일도 리드 상세와 동일하게:
```tsx
<TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
  <TabsTrigger value="overview"
    className="rounded-none border-b-2 border-transparent
      data-[state=active]:border-slate-900
      data-[state=active]:bg-transparent
      data-[state=active]:shadow-none
      px-4 py-3 text-sm">
    개요
  </TabsTrigger>
  {/* ... */}
  {/* 더보기 드롭다운 */}
  <DropdownMenu>
    <DropdownMenuTrigger className="px-4 py-3 text-sm text-muted-foreground hover:text-foreground">
      더보기 <ChevronDown className="w-3 h-3 ml-1 inline" />
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      {SECONDARY_TABS.map(tab => (
        <DropdownMenuItem key={tab.value} onClick={() => setActiveTab(tab.value)}>
          {tab.label}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
</TabsList>
```

### 2.5 개요 탭 개선

**현재:** 2컬럼 그리드에 8개 카드 (기본정보, 진행단계, 미팅, 일정, 견적, 계약, 건강도, 메모, 타임라인)

**변경:** 좌측 사이드바로 기본정보/건강도 이동 → 개요 탭은 핵심 요약만

```tsx
// 개요 탭 내용
<div className="p-5 space-y-6">
  {/* 최근 활동 미리보기 (리드 상세와 동일 패턴) */}
  <RecentActivityPreview customerId={customerId} onViewAll={() => setActiveTab('activity-timeline')} />

  {/* 다가오는 일정 */}
  <UpcomingEventsPreview customerId={customerId} onViewAll={() => setActiveTab('calendar')} />

  {/* 고정 메모 */}
  <PinnedNotesPreview customerId={customerId} onViewAll={() => setActiveTab('notes')} />
</div>
```

---

## Phase 3: 공통 컴포넌트

### 3.1 InlineGradeSelect — 테이블 셀 내 등급 변경

```tsx
// components/customer/InlineGradeSelect.tsx
function InlineGradeSelect({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const config = GRADE_CONFIG[value || 'CUSTOMER'];
  return (
    <Select value={value || 'CUSTOMER'} onValueChange={onChange}>
      <SelectTrigger className="h-7 w-24 border-0 bg-transparent text-xs font-medium px-2"
        style={{ color: config.color }}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {GRADE_OPTIONS.map(g => (
          <SelectItem key={g.value} value={g.value}>
            <span style={{ color: g.color }}>{g.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### 3.2 CustomerProgressStepper — 진행 단계 시각화

리드 상세의 PipelineStepper와 동일한 패턴이지만, 고객 진행 단계(문의접수→견적송부→시험의뢰→계약체결→시험접수→시험관리→자금관리) 사용

```tsx
const CUSTOMER_STAGES = [
  { key: 'inquiry', label: '문의접수' },
  { key: 'quotation_sent', label: '견적송부' },
  { key: 'test_request', label: '시험의뢰' },
  { key: 'contract_signed', label: '계약체결' },
  { key: 'test_reception', label: '시험접수' },
  { key: 'test_management', label: '시험관리' },
  { key: 'fund_management', label: '자금관리' },
];
```

---

## 구현 순서

1. **Phase 1.1** — `CustomerSummaryBar` 생성, `KPIDashboard` 교체
2. **Phase 1.2** — 리스트 페이지 레이아웃 재구성 (뷰탭+필터 통합)
3. **Phase 1.3** — `TableView` 개선 (Monday 스프레드시트 스타일)
4. **Phase 2.1~2.2** — 상세 페이지 레이아웃 변경 (3컬럼 + sticky 헤더)
5. **Phase 2.3** — 좌측 사이드바 컴포넌트 분리
6. **Phase 2.4** — 탭 구조 정리 (주요 7개 + 더보기)
7. **Phase 2.5** — 개요 탭 개선
8. **Phase 3** — 공통 컴포넌트 (InlineGradeSelect, CustomerProgressStepper)

## 디자인 원칙 준수 사항

- `.kiro/steering/design-guidelines.md` 엄격 준수
- 그라데이션 배경 금지 (이니셜 아바타의 from-slate-700 to-slate-900은 리드 상세와 통일이므로 예외)
- shadow-sm 까지만, hover translate 금지
- 색상: slate 기반 + 절제된 블루 액센트
- font-bold 금지 → font-semibold 까지만
- glass morphism 금지
