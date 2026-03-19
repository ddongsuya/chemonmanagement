# 모바일 UX 종합 감사 및 수정 계획

## 1. 핵심 문제: 스크롤 불안정

### 1-1. `h-screen` (100vh) iOS Safari 문제
**파일**: `chemon-quotation/app/(dashboard)/layout.tsx`

**문제**: `h-screen`은 CSS `100vh`로 변환되는데, iOS Safari에서 100vh는 주소창을 포함한 전체 높이를 의미함. 주소창이 보이는 상태에서 콘텐츠가 화면 밖으로 밀려나고, 스크롤 시 주소창이 숨겨지면서 레이아웃이 점프함.

**수정**:
```tsx
// 변경 전
<div className="flex h-screen bg-background">

// 변경 후 — dvh(dynamic viewport height) 사용 + fallback
<div className="flex h-dvh bg-background">
```

`globals.css`에 fallback 추가:
```css
@supports not (height: 100dvh) {
  .h-dvh {
    height: -webkit-fill-available;
    height: 100vh;
  }
}
```

### 1-2. MobileBottomNav 이중 스크롤 컨테이너
**파일**: `chemon-quotation/components/layout/MobileBottomNav.tsx`

**문제**: 컴포넌트 하단에 `<div className="md:hidden h-14 pb-safe" />`가 렌더링됨. 이 div는 `layout.tsx`의 flex 컨테이너 **바깥**에 위치하여 별도의 스크롤 컨텍스트를 생성함. 동시에 `layout.tsx`의 `<main>`에 이미 `pb-20`이 적용되어 있어 이중 패딩 발생.

**수정**: spacer div 제거 (main의 `pb-20`이 이미 하단 네비 공간을 확보함)
```tsx
// 변경 전
return (
  <>
    <nav className="md:hidden fixed bottom-0 ...">...</nav>
    <div className="md:hidden h-14 pb-safe" />  {/* ← 제거 */}
  </>
);

// 변경 후
return (
  <nav className="md:hidden fixed bottom-0 ...">...</nav>
);
```

### 1-3. overscroll-behavior 전역 미적용
**파일**: `chemon-quotation/app/globals.css`

**문제**: `overscroll-behavior: contain`이 `.scroll-container` 클래스에만 적용됨. 메인 콘텐츠 영역(`<main>`)에는 적용되지 않아 iOS에서 rubber-band 스크롤이 발생하고 pull-to-refresh가 트리거될 수 있음.

**수정**: `<main>` 태그에 직접 적용
```tsx
// layout.tsx의 main 태그
<main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 overscroll-contain">
```

`globals.css`에 유틸리티 추가:
```css
.overscroll-contain {
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
```

---

## 2. viewport 메타 태그 점검

### 2-1. viewport-fit=cover 누락
**파일**: `chemon-quotation/app/layout.tsx`

**문제**: `viewport` 메타데이터에 `viewportFit: 'cover'`가 없음. 이로 인해 `env(safe-area-inset-*)` 값이 항상 0을 반환하여 노치/다이나믹 아일랜드 기기에서 `pb-safe` 등의 유틸리티가 작동하지 않음.

**수정**:
```tsx
viewport: {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",  // ← 추가
},
```

---

## 3. 고객 상세 페이지 모바일 최적화

### 3-1. sticky 헤더 + 탭 스크롤 충돌
**파일**: `chemon-quotation/app/(dashboard)/customers/[id]/page.tsx`

**문제**: 고객 상세 페이지는 `min-h-screen bg-slate-50/50`로 자체 배경을 가지며, sticky 헤더(`sticky top-0 z-10`)가 있음. 하지만 이 페이지는 `layout.tsx`의 `<main className="overflow-y-auto">` 안에 렌더링되므로, `sticky top-0`이 viewport가 아닌 `<main>` 스크롤 컨테이너 기준으로 동작함. 이는 의도된 동작이지만, 모바일에서 sticky 헤더 + 담당자 선택 바 + 탭 바가 화면의 상당 부분을 차지함.

**수정**:
- 모바일에서 sticky 헤더의 높이를 줄임 (이니셜 아바타 크기 축소, 점수 게이지 숨김은 이미 처리됨)
- 담당자 선택 바를 모바일에서 접을 수 있게 처리
- 탭 리스트의 `overflow-x-auto`에 `-webkit-overflow-scrolling: touch` 추가

```tsx
// 탭 리스트에 스크롤 힌트 추가
<TabsList className="... overflow-x-auto no-scrollbar scroll-smooth">
```

### 3-2. 3컬럼 → 1컬럼 전환 시 사이드바 정보 접근성
**현재 상태**: `grid-cols-1 lg:grid-cols-3`으로 모바일에서는 사이드바가 탭 콘텐츠 위에 표시됨. 이는 정상 동작이지만, 사이드바 정보(기본 정보, 연락처)가 길어서 탭 콘텐츠까지 스크롤이 많이 필요함.

**수정**: 모바일에서 사이드바 정보를 접을 수 있는 아코디언으로 변환
```tsx
// 모바일에서만 접기/펼치기
<div className="lg:col-span-1 space-y-4">
  <details className="lg:open" open>
    <summary className="lg:hidden cursor-pointer ...">기본 정보 보기</summary>
    {/* 기본 정보 + 연락처 카드들 */}
  </details>
</div>
```

---

## 4. 다이얼로그/시트 배경 스크롤 방지

### 4-1. Sheet/Dialog 열릴 때 body 스크롤
**관련 파일**: `MobileBottomNav.tsx` (Sheet), `Header.tsx` (모바일 검색 오버레이)

**문제**: Radix UI의 Sheet/Dialog는 기본적으로 body scroll lock을 처리하지만, iOS Safari에서 `position: fixed` 요소 뒤의 스크롤이 완전히 차단되지 않는 경우가 있음.

**수정**: `globals.css`에 body scroll lock 보조 스타일 추가
```css
/* Radix UI가 body에 추가하는 data attribute 활용 */
body[data-scroll-locked] {
  position: fixed !important;
  width: 100% !important;
  overflow: hidden !important;
}
```

---

## 5. 입력 필드 포커스 시 스크롤 점프

### 5-1. iOS 키보드 올라올 때 레이아웃 점프
**문제**: iOS에서 input 포커스 시 가상 키보드가 올라오면서 viewport가 줄어들고, `h-screen`(또는 `h-dvh`) 기반 레이아웃이 재계산되어 스크롤 위치가 점프함.

**수정**: 이미 `font-size: 16px !important`로 iOS 자동 줌은 방지됨. 추가로:
```css
/* iOS 키보드 대응 */
@supports (height: 100dvh) {
  .flex.h-dvh {
    min-height: 100dvh;
    height: auto;
  }
}
```

→ 이 부분은 `h-dvh`만으로 대부분 해결됨. dvh는 키보드 상태에 따라 동적으로 변함.

---

## 6. 터치 인터랙션 개선

### 6-1. 테이블 가로 스크롤
**관련 파일**: `TableView.tsx`, 각종 탭 컴포넌트

**문제**: 테이블이 모바일에서 가로로 넘칠 때 스크롤이 부자연스러울 수 있음.

**수정**: 이미 `overflow-x-auto`가 적용된 곳이 많지만, `-webkit-overflow-scrolling: touch` 추가 필요
```css
/* globals.css에 이미 .scroll-container에 있지만, 테이블 래퍼에도 적용 */
.overflow-x-auto {
  -webkit-overflow-scrolling: touch;
}
```

### 6-2. 드래그 앤 드롭 (파이프라인)
**파일**: `chemon-quotation/app/(dashboard)/pipeline/page.tsx`

**현재 상태**: 이미 모바일에서는 아코디언 리스트(`MobilePipelineStage`)를 사용하고, 데스크톱에서만 칸반 보드를 표시함. ✅ 정상 처리됨.

---

## 7. 모바일 검색 오버레이

### 7-1. Header 모바일 검색
**파일**: `chemon-quotation/components/layout/Header.tsx`

**현재 상태**: `fixed inset-0 z-50`으로 전체 화면 오버레이 사용. ✅ 기본 구조는 양호.

**개선점**: 검색 결과 영역의 `max-h-[calc(100vh-3.5rem)]`을 dvh로 변경
```tsx
<div className="overflow-y-auto max-h-[calc(100dvh-3.5rem)]">
```

---

## 8. 구현 순서 (우선순위)

| 순서 | 작업 | 파일 | 영향도 |
|------|------|------|--------|
| 1 | `h-screen` → `h-dvh` + CSS fallback | layout.tsx, globals.css | 🔴 높음 |
| 2 | MobileBottomNav spacer div 제거 | MobileBottomNav.tsx | 🔴 높음 |
| 3 | viewport-fit: cover 추가 | app/layout.tsx (root) | 🔴 높음 |
| 4 | main에 overscroll-contain 적용 | layout.tsx, globals.css | 🟡 중간 |
| 5 | body scroll lock 보조 CSS | globals.css | 🟡 중간 |
| 6 | 고객 상세 모바일 사이드바 접기 | customers/[id]/page.tsx | 🟡 중간 |
| 7 | 검색 오버레이 dvh 적용 | Header.tsx | 🟢 낮음 |
| 8 | overflow-x-auto 터치 스크롤 개선 | globals.css | 🟢 낮음 |

---

## 9. 수정하지 않는 항목 (이미 양호)

- ✅ 모바일 하단 네비 기본 구조 (fixed bottom, z-40, pb-safe)
- ✅ 터치 타겟 44px 최소 크기 (globals.css)
- ✅ iOS 줌 방지 (font-size: 16px)
- ✅ 파이프라인 모바일 아코디언 뷰
- ✅ MobileNav 슬라이드 아웃 (Sheet 기반)
- ✅ 대시보드 페이지 (반응형 처리 양호)
- ✅ 고객 목록 페이지 (VirtualizedCardGrid 사용)
