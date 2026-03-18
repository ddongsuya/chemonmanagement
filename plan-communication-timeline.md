# 고객사 커뮤니케이션 타임라인 기능 개선 계획

## 현재 상태 분석

현재 고객사 상세 페이지에는 커뮤니케이션 관련 기능이 여러 탭에 분산되어 있음:
- **미팅 탭**: 미팅/통화/이메일/방문 기록 (MeetingRecord 모델)
- **상담 탭**: 공식 상담 기록 (ConsultationRecord 모델)
- **활동 타임라인 탭**: 모든 활동을 시간순으로 보여주지만 **읽기 전용** (입력 불가)
- **메모 탭**: 단순 텍스트 메모

## 문제점
1. 커뮤니케이션 기록을 남기려면 "미팅" 탭으로 이동해서 다이얼로그를 열어야 함
2. 활동 타임라인은 읽기 전용이라 바로 기록을 남길 수 없음
3. 담당자별 필터링이 미팅 탭에만 적용되고 타임라인에는 미적용

## 개선 방향

기존 **활동 타임라인 탭**을 **커뮤니케이션 허브**로 업그레이드:
- 상단에 빠른 입력 폼 (채팅 스타일 입력창)
- 아래에 시간순 타임라인 (기존 유지 + 개선)
- 담당자(requester) 필터링 연동

## 구현 상세

### 1. ActivityTimelineTab 개선 — 인라인 빠른 입력 추가

타임라인 상단에 간단한 입력 영역 추가. 유형(통화/이메일/미팅/방문/메모) 선택 후 바로 기록 가능.

```tsx
// ActivityTimelineTab.tsx 상단에 추가할 빠른 입력 영역
<div className="border rounded-lg p-3 mb-4 bg-muted/30">
  <div className="flex items-center gap-2 mb-2">
    {/* 유형 선택 필 */}
    {['call', 'email', 'meeting', 'visit', 'note'].map(type => (
      <button
        key={type}
        onClick={() => setQuickType(type)}
        className={cn(
          'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
          quickType === type ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
        )}
      >
        {TYPE_LABELS[type]}
      </button>
    ))}
  </div>
  <div className="flex gap-2">
    <Input
      placeholder="커뮤니케이션 내용을 입력하세요..."
      value={quickContent}
      onChange={(e) => setQuickContent(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleQuickSubmit()}
      className="flex-1"
    />
    <Button size="sm" onClick={handleQuickSubmit} disabled={!quickContent.trim() || saving}>
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
    </Button>
  </div>
</div>
```

### 2. 빠른 입력 처리 로직

유형에 따라 적절한 API 호출:
- `call/email/meeting/visit` → `meetingRecordApi.create()` (MeetingRecord 생성)
- `note` → `createNote()` (CustomerNote 생성)

```tsx
const handleQuickSubmit = async () => {
  if (!quickContent.trim()) return;
  setSaving(true);
  try {
    if (quickType === 'note') {
      await createNote(customerId, quickContent);
    } else {
      await meetingRecordApi.create(customerId, {
        title: `${TYPE_LABELS[quickType]} - ${new Date().toLocaleDateString('ko-KR')}`,
        type: quickType,
        date: new Date().toISOString().split('T')[0],
        content: quickContent,
        attendees: [],
        ...(requesterId ? { requesterId } : {}),
      });
    }
    setQuickContent('');
    loadTimeline(); // 타임라인 새로고침
    toast({ title: '기록이 추가되었습니다' });
  } catch {
    toast({ title: '오류', description: '저장에 실패했습니다', variant: 'destructive' });
  } finally {
    setSaving(false);
  }
};
```

### 3. 담당자(requester) 필터링 연동

ActivityTimelineTab에 `requesterId` prop 추가하여 선택된 담당자의 활동만 필터링.

```tsx
interface ActivityTimelineTabProps {
  customerId: string;
  requesterId?: string | null; // 추가
}
```

타임라인 데이터 로드 시 미팅 기록은 requesterId로 필터링하고, 
타임라인 아이템에도 requester 정보가 있으면 필터링 적용.

### 4. 고객사 상세 페이지 연동

- `ActivityTimelineTab`에 `requesterId` prop 전달
- 탭 이름을 "활동" → "커뮤니케이션" 으로 변경하여 의미 명확화

### 5. MeetingRecord 생성 시 requesterId 연동

InlineMeetingForm에서 현재 선택된 담당자의 requesterId를 함께 전달하도록 수정.
빠른 입력에서도 동일하게 requesterId 포함.

## 변경 파일 목록

1. `chemon-quotation/components/customer-detail/ActivityTimelineTab.tsx` — 빠른 입력 추가 + requesterId 필터링
2. `chemon-quotation/app/(dashboard)/customers/[id]/page.tsx` — 탭 이름 변경 + requesterId 전달
3. `chemon-quotation/components/customer-detail/InlineMeetingForm.tsx` — requesterId 전달 지원

## 변경하지 않는 것

- DB 스키마 변경 없음 (기존 MeetingRecord, CustomerNote 모델 활용)
- 백엔드 API 변경 없음 (기존 API 그대로 사용)
- 기존 미팅 탭, 상담 탭은 그대로 유지 (상세 조회용)
