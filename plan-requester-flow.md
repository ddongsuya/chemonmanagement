# 고객사 상세 — 담당자(의뢰자) 선택 흐름 추가

## 개요

고객사 상세 페이지 진입 시 흐름을 변경:
**고객사 → 담당자(Requester) 선택 → 해당 담당자 기준 정보 표시**

## 현재 구조

- `Customer` → `Requester[]` (1:N) 관계 이미 존재
- `MeetingRecord`, `TestReception`에 `requesterId` FK 존재
- 현재 상세 페이지는 고객사 전체 데이터를 보여줌 (담당자 필터 없음)

## 변경 사항

### UI 변경 — 상세 페이지 헤더 아래에 담당자 선택 바 추가

```
┌─────────────────────────────────────────────────────┐
│ [Sticky 헤더 — 고객사 정보]                           │
├─────────────────────────────────────────────────────┤
│ 담당자: [전체 ▼] [홍길동(주)] [김영희] [박철수] [+ 추가] │
├──────────────┬──────────────────────────────────────┤
│ 좌측 사이드바  │ 우측 탭 콘텐츠 (선택된 담당자 기준)     │
│              │                                       │
```

- 헤더와 본문 사이에 담당자 선택 바 (pill 형태 토글)
- "전체" 선택 시 기존처럼 고객사 전체 데이터
- 특정 담당자 선택 시 해당 담당자 관련 데이터만 필터링
- 좌측 사이드바의 연락처 정보도 선택된 담당자 기준으로 변경

### 필터링 대상

| 탭 | 필터 방식 |
|---|---|
| 개요 | 선택된 담당자의 미팅/시험접수만 표시 |
| 미팅 기록 | `requesterId` 필터 |
| 시험접수 | `requesterId` 필터 |
| 견적서 | 담당자 연결 없음 → 전체 표시 |
| 계약 | 담당자 연결 없음 → 전체 표시 |
| 상담기록 | 전체 표시 |
| 활동 타임라인 | 전체 표시 |

### 컴포넌트

```tsx
// components/customer-detail/RequesterSelector.tsx
interface RequesterSelectorProps {
  customerId: string;
  selectedRequesterId: string | null; // null = 전체
  onSelect: (requesterId: string | null) => void;
}

export function RequesterSelector({ customerId, selectedRequesterId, onSelect }: RequesterSelectorProps) {
  const [requesters, setRequesters] = useState<Requester[]>([]);

  useEffect(() => {
    requesterApi.getByCustomerId(customerId, true).then(setRequesters);
  }, [customerId]);

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b bg-white overflow-x-auto no-scrollbar">
      <span className="text-xs text-muted-foreground shrink-0">담당자:</span>
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'rounded-full px-3 py-1 text-xs font-medium transition-colors shrink-0',
          !selectedRequesterId
            ? 'bg-slate-900 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        )}
      >
        전체
      </button>
      {requesters.map(r => (
        <button
          key={r.id}
          onClick={() => onSelect(r.id)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition-colors shrink-0',
            selectedRequesterId === r.id
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          {r.name}{r.is_primary ? ' (주)' : ''}
        </button>
      ))}
      <InlineRequesterForm customerId={customerId} onSuccess={() => {
        requesterApi.getByCustomerId(customerId, true).then(setRequesters);
      }} />
    </div>
  );
}
```

### 상세 페이지 변경

```tsx
// page.tsx 내부
const [selectedRequesterId, setSelectedRequesterId] = useState<string | null>(null);

// 헤더 아래에 추가
<RequesterSelector
  customerId={customerId}
  selectedRequesterId={selectedRequesterId}
  onSelect={setSelectedRequesterId}
/>

// 좌측 사이드바 연락처 — 선택된 담당자 기준
{selectedRequester ? (
  <InfoRow icon={User} label="담당자" value={selectedRequester.name} />
  <InfoRow icon={Phone} label="전화" value={selectedRequester.phone} />
  <InfoRow icon={Mail} label="이메일" value={selectedRequester.email} />
) : (
  // 기존 customer 기본 연락처
)}

// 탭에 requesterId 전달
<MeetingRecordTab customerId={customerId} requesterId={selectedRequesterId} />
<TestReceptionTab customerId={customerId} requesterId={selectedRequesterId} />
```

### 탭 컴포넌트 변경

MeetingRecordTab, TestReceptionTab에 `requesterId?: string | null` prop 추가.
API 호출 시 requesterId가 있으면 쿼리 파라미터로 전달.

## 구현 순서

1. `RequesterSelector` 컴포넌트 생성
2. 상세 페이지에 담당자 선택 상태 + RequesterSelector 추가
3. 좌측 사이드바 연락처를 선택된 담당자 기준으로 변경
4. MeetingRecordTab에 requesterId 필터 추가
5. TestReceptionTab에 requesterId 필터 추가
6. OverviewTab에 requesterId 필터 전달
