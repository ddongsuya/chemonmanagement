# Stitch 디자인 리뉴얼 계획

## Stitch가 제안한 디자인 토큰 (4개 HTML에서 추출)

### 1. 사이드바
- 현재: 다크 (`hsl(220, 26%, 14%)`) + 흰색 텍스트
- Stitch: 라이트 (`bg-slate-50` 또는 `bg-white`) + 다크 텍스트
- 로고: `text-lg font-black text-blue-700`, 서브텍스트 `text-[10px] uppercase tracking-widest text-slate-500`
- 활성 메뉴: `bg-blue-50 text-blue-700 rounded-lg` (또는 `bg-white shadow-sm`)
- 비활성 메뉴: `text-slate-600 hover:bg-slate-200/50 rounded-xl`

### 2. 헤더
- 현재: 흰색 배경 + 그림자
- Stitch: `bg-white/80 backdrop-blur-md shadow-sm` (glass effect)
- 검색: `rounded-full bg-slate-100 border-none`

### 3. 페이지 헤더
- 카테고리 라벨: `text-[10px] font-bold uppercase tracking-widest text-slate-500`
- 제목: `text-3xl font-extrabold tracking-tight` (현재 `text-2xl font-semibold`)
- 설명: `text-slate-500 mt-1`

### 4. 카드/통계
- 배경: `bg-white rounded-xl` (현재 `bg-card rounded-lg border`)
- 라벨: `text-[10px] font-bold uppercase tracking-widest text-slate-500` → `text-xs text-muted-foreground`
- 값: `text-2xl font-black` (현재 `text-xl font-semibold`)
- hover: `hover:translate-y-[-2px]` (현재 가이드라인에서 금지)

### 5. 폼 인풋
- 현재: `border rounded-md`
- Stitch: `bg-slate-100 border-none rounded-xl py-3 focus:ring-2 focus:ring-primary/20`

### 6. 상태 뱃지
- Stitch: `rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700`
- 현재: `rounded-md text-xs border`

### 7. 버튼
- Primary: `bg-primary text-white rounded-xl shadow-lg` (Stitch는 gradient도 사용하지만 가이드라인에서 금지)
- Secondary: `bg-slate-100 text-slate-600 rounded-xl`

---

## 반영 전략 — 안전하게 단계적으로

### Step 1: CSS 변수 + globals.css 업데이트
- `--background` 미세 조정 (`#f8f9fa` = `210 17% 98%`)
- `--sidebar` 라이트 테마로 변경
- `shadow-ambient` 유틸리티 추가

### Step 2: 사이드바 리디자인
- 다크 → 라이트 전환
- 메뉴 아이템 스타일 변경
- 로고 영역 리디자인

### Step 3: 헤더 리디자인
- backdrop-blur 적용
- 검색바 스타일 변경

### Step 4: design-guidelines.md 업데이트
- Stitch 디자인 토큰 반영

---

## 주의사항
- hover:translate-y 효과는 기존 가이드라인에서 금지 → Stitch 제안이지만 적용하지 않음
- gradient 버튼도 기존 가이드라인에서 금지 → 적용하지 않음
- backdrop-blur는 기존 가이드라인에서 금지였지만 → 헤더에만 제한적 허용
- 핵심은 "라이트 사이드바 + 더 큰 타이포 + 라운드 인풋 + uppercase 라벨" 패턴
