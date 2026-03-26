# 요구사항 문서

## 소개

Chemon Management 프로젝트의 전체 UI에 Stitch Amber Curator 디자인 시스템을 일관되게 적용하기 위한 요구사항입니다. 이미 globals.css, Sidebar, Header, Dashboard, StatsCard, SalesDashboard KPI, Login 페이지에 적용이 완료된 상태이며, 나머지 페이지/컴포넌트에 동일한 디자인 토큰과 스타일 규칙을 확장 적용합니다. 기능 로직은 변경하지 않고 시각적 스타일만 변환합니다.

## 용어 정의

- **Design_Token_Layer**: globals.css에 정의된 CSS 변수와 Tailwind 유틸리티 클래스로 구성된 디자인 토큰 계층
- **Shared_Component_Layer**: StitchCard, StitchBadge, StitchInput 등 Stitch 스타일을 캡슐화한 공유 UI 컴포넌트 계층
- **Page_Application_Layer**: 각 페이지에서 공유 컴포넌트를 사용하여 Stitch 스타일을 적용하는 계층
- **Surface_Hierarchy**: surface(#FFF8F1), surface-low(#FAF2E9), surface-container(#F5EDE3), surface-high(#EFE7DD), surface-highest(#E9E1D8)로 구성된 배경색 계층 체계
- **No_Line_Rule**: 레이아웃 구분을 위한 1px 보더 사용을 금지하고 tonal layering으로 영역을 구분하는 규칙
- **Editorial_Typography**: font-bold/font-extrabold/font-black, uppercase, tracking-widest를 조합한 라벨 및 제목 타이포그래피 스타일
- **Ambient_Shadow**: blur 32-64px, opacity 4-6%의 부드러운 그림자 스타일
- **Pill_Badge**: rounded-full + uppercase + tracking-wider 스타일의 뱃지 형태
- **Stitch_Converter**: 기존 shadcn/ui 클래스를 Stitch Amber Curator 클래스로 변환하는 프로세스
- **Glass_Gradient_CTA**: backdrop-blur + gradient를 적용한 주요 행동 유도 버튼 스타일

## 요구사항

### 요구사항 1: 공유 Stitch 컴포넌트 생성

**사용자 스토리:** 개발자로서, Stitch Amber Curator 스타일이 캡슐화된 공유 컴포넌트를 사용하고 싶다. 그래야 각 페이지에서 일관된 디자인을 빠르게 적용할 수 있다.

#### 수용 기준

1. WHEN Shared_Component_Layer가 초기화될 때, THE Design_Token_Layer SHALL StitchCard, StitchBadge, StitchInput, StitchTable, StitchPageHeader 컴포넌트를 제공한다
2. WHEN StitchCard가 variant prop을 전달받을 때, THE StitchCard SHALL Surface_Hierarchy에 정의된 해당 배경색을 적용한다
3. WHEN StitchCard가 hover prop이 true일 때, THE StitchCard SHALL translate-y-[-2px]과 Ambient_Shadow 트랜지션을 적용한다
4. WHEN StitchBadge가 status prop을 전달받을 때, THE StitchBadge SHALL Pill_Badge 스타일(rounded-full, uppercase, tracking-wider)과 해당 상태의 연한 배경/진한 텍스트 색상 조합을 적용한다
5. WHEN StitchInput이 렌더링될 때, THE StitchInput SHALL border-none, rounded-xl, bg-white 스타일을 적용하고 focus 시 ring-2 ring-primary/40을 표시한다
6. IF StitchInput의 hasError가 true이면, THEN THE StitchInput SHALL ring-red-500 관련 클래스를 적용한다
7. WHEN StitchTable이 렌더링될 때, THE StitchTable SHALL 헤더에 text-[11px] font-bold uppercase tracking-widest를 적용하고 행 간격을 tonal layering으로 구분한다
8. WHEN StitchPageHeader가 렌더링될 때, THE StitchPageHeader SHALL 라벨에 text-[10px] font-bold uppercase tracking-widest를, 제목에 font-extrabold tracking-tight를 적용한다

### 요구사항 2: No-Line Rule 전면 적용

**사용자 스토리:** 디자이너로서, 모든 페이지에서 1px 보더가 제거되고 tonal layering으로 영역이 구분되길 원한다. 그래야 Amber Curator의 핵심 미학이 일관되게 유지된다.

#### 수용 기준

1. THE Stitch_Converter SHALL 모든 변환 대상 컴포넌트에서 레이아웃 구분용 border, border-b, border-t, border-l, border-r, border-border 클래스를 제거한다
2. WHEN 영역 구분이 필요할 때, THE Stitch_Converter SHALL Surface_Hierarchy의 배경색 차이(tonal layering)로 영역을 구분한다
3. WHILE 테이블 행 구분이 필요한 상태에서, THE StitchTable SHALL divide-y divide-slate-100만 허용하고 개별 행의 border-b는 제거한다
4. IF 접근성을 위해 보더가 반드시 필요하면, THEN THE Stitch_Converter SHALL outline-variant 15% opacity의 Ghost Border만 적용한다

### 요구사항 3: Surface 계층 배경색 적용

**사용자 스토리:** 사용자로서, 페이지의 각 영역이 자연스러운 깊이감으로 구분되길 원한다. 그래야 정보 계층을 직관적으로 파악할 수 있다.

#### 수용 기준

1. THE Page_Application_Layer SHALL 페이지 배경에 surface(#FFF8F1) 색상을 사용한다
2. WHEN 대형 콘텐츠 영역이 렌더링될 때, THE Page_Application_Layer SHALL surface-low(#FAF2E9) 배경색을 적용한다
3. WHEN 카드 또는 내부 모듈이 렌더링될 때, THE Page_Application_Layer SHALL surface-container(#F5EDE3) 이하의 Surface_Hierarchy 배경색을 적용한다
4. WHEN 플로팅 오버레이(모달, 드롭다운)가 표시될 때, THE Page_Application_Layer SHALL surface-highest(#E9E1D8) 또는 glassmorphism(backdrop-blur 12-20px) 스타일을 적용한다
5. THE Page_Application_Layer SHALL 모든 카드 컴포넌트의 배경색이 Surface_Hierarchy에 정의된 5개 색상 중 하나에 해당하도록 보장한다

### 요구사항 4: Editorial Typography 적용

**사용자 스토리:** 사용자로서, 라벨과 제목이 고급스러운 에디토리얼 스타일로 표시되길 원한다. 그래야 전문적이고 권위 있는 인터페이스로 느껴진다.

#### 수용 기준

1. THE Stitch_Converter SHALL 모든 메타데이터 라벨에 text-[10px] 또는 text-[11px], font-bold, uppercase, tracking-widest 스타일을 적용한다
2. WHEN 페이지 제목이 렌더링될 때, THE StitchPageHeader SHALL text-2xl 이상의 크기와 font-extrabold 또는 font-black, tracking-tight 스타일을 적용한다
3. WHEN 카드 헤더가 렌더링될 때, THE Stitch_Converter SHALL title-lg(1.375rem) 또는 title-md(1.125rem) 크기와 font-bold 스타일을 적용한다
4. THE Stitch_Converter SHALL 본문 텍스트에 body-md(0.875rem, text-sm) 크기를 유지하고 순수 검정(#000000) 대신 on-surface(#1E1B15) 색상을 사용한다

### 요구사항 5: 뱃지 Pill 스타일 통일

**사용자 스토리:** 사용자로서, 견적 상태, 고객 등급, 파이프라인 단계 등의 뱃지가 일관된 pill 형태로 표시되길 원한다. 그래야 상태 정보를 빠르게 식별할 수 있다.

#### 수용 기준

1. THE Stitch_Converter SHALL 모든 상태 뱃지에 rounded-full, uppercase, tracking-wider 스타일을 적용한다
2. WHEN 뱃지가 렌더링될 때, THE StitchBadge SHALL 연한 배경색(예: bg-emerald-50)과 진한 텍스트색(예: text-emerald-600)의 동일 색상 계열 조합을 사용한다
3. THE StitchBadge SHALL font-bold text-xs 크기를 고정으로 적용한다
4. WHEN 견적 상태(DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED)가 표시될 때, THE StitchBadge SHALL STATUS_BADGE_MAP에 정의된 색상 매핑을 사용한다
5. WHEN 고객 등급(LEAD, PROSPECT, CUSTOMER, VIP, INACTIVE)이 표시될 때, THE StitchBadge SHALL STATUS_BADGE_MAP에 정의된 색상 매핑을 사용한다

### 요구사항 6: 인풋 필드 Stitch 스타일 변환

**사용자 스토리:** 사용자로서, 모든 폼의 인풋 필드가 보더 없는 부드러운 스타일로 표시되길 원한다. 그래야 폼 작성 시 시각적 피로가 줄어든다.

#### 수용 기준

1. THE Stitch_Converter SHALL 모든 인풋 필드에서 기존 border 클래스를 제거하고 border-none, rounded-xl, bg-white 스타일을 적용한다
2. WHEN 인풋 필드가 포커스를 받을 때, THE StitchInput SHALL focus:ring-2 focus:ring-primary/40 스타일을 표시한다
3. IF 인풋 필드에 유효성 검증 오류가 발생하면, THEN THE StitchInput SHALL ring-red-500 스타일로 오류 상태를 표시한다
4. THE Stitch_Converter SHALL 모든 Select 드롭다운 트리거에 bg-white, border-none, rounded-xl 스타일을 적용한다
5. THE Stitch_Converter SHALL 모든 폼 라벨에 text-[11px] font-bold uppercase tracking-widest text-slate-500 스타일을 적용한다

### 요구사항 7: 테이블 Stitch 스타일 변환

**사용자 스토리:** 사용자로서, 견적 목록, 고객 목록 등의 테이블이 보더 없이 깔끔한 tonal layering으로 표시되길 원한다. 그래야 데이터를 편안하게 탐색할 수 있다.

#### 수용 기준

1. WHEN 테이블이 렌더링될 때, THE StitchTable SHALL 외부 컨테이너에 bg-[#FAF2E9] rounded-[2.5rem] p-8 스타일을 적용한다
2. THE StitchTable SHALL 테이블 헤더에 text-[11px] font-bold uppercase tracking-widest text-slate-400 스타일을 적용한다
3. WHEN 테이블 행에 마우스를 올릴 때, THE StitchTable SHALL hover:bg-[#FFF8F1] transition-colors 스타일을 적용한다
4. THE StitchTable SHALL 행 구분에 divide-y divide-slate-100만 사용하고 개별 행의 border-b는 사용하지 않는다
5. WHILE 모바일 뷰포트(768px 이하)에서, THE StitchTable SHALL rounded-[2.5rem]을 rounded-xl로 축소하여 레이아웃 깨짐을 방지한다

### 요구사항 8: 버튼 CTA Stitch 스타일 변환

**사용자 스토리:** 사용자로서, 주요 행동 유도 버튼이 따뜻한 그라데이션으로 눈에 띄길 원한다. 그래야 다음 행동을 직관적으로 파악할 수 있다.

#### 수용 기준

1. WHEN Primary 버튼이 렌더링될 때, THE Stitch_Converter SHALL bg-gradient-to-r from-primary to-orange-400, rounded-xl, font-bold 스타일을 적용한다
2. WHEN Secondary 버튼이 렌더링될 때, THE Stitch_Converter SHALL bg-white, rounded-xl, font-bold, uppercase 스타일을 적용하고 보더를 제거한다
3. WHEN Tertiary 버튼이 렌더링될 때, THE Stitch_Converter SHALL 텍스트 전용 스타일에 primary 색상과 아이콘을 적용한다

### 요구사항 9: 그림자 및 깊이 표현 통일

**사용자 스토리:** 사용자로서, 플로팅 요소가 부드러운 ambient shadow로 자연스럽게 떠 있는 느낌을 주길 원한다. 그래야 UI 계층이 직관적으로 느껴진다.

#### 수용 기준

1. THE Stitch_Converter SHALL 기존 shadow-sm, shadow-md 클래스를 Ambient_Shadow(blur 32-64px, opacity 4-6%)로 교체한다
2. WHEN 플로팅 요소(모달, 드롭다운, 팝오버)가 표시될 때, THE Page_Application_Layer SHALL shadow-ambient 또는 shadow-lg shadow-orange-900/10 스타일을 적용한다
3. THE Stitch_Converter SHALL 그림자 색상에 중성 회색 대신 on-surface 색상(따뜻한 다크 브라운/슬레이트) 톤을 사용한다
4. THE Stitch_Converter SHALL shadow-lg, shadow-xl 등 고대비 그림자 클래스를 사용하지 않는다

### 요구사항 10: 견적 페이지 Stitch 스타일 적용

**사용자 스토리:** 사용자로서, 독성/효능/임상병리 견적 작성 및 목록 페이지가 Amber Curator 스타일로 표시되길 원한다. 그래야 견적 업무 시 일관된 시각적 경험을 얻을 수 있다.

#### 수용 기준

1. WHEN 견적 목록 페이지가 렌더링될 때, THE Page_Application_Layer SHALL 테이블을 StitchTable 스타일로, 상태 뱃지를 StitchBadge 스타일로 변환한다
2. WHEN 견적 작성 위자드가 렌더링될 때, THE Page_Application_Layer SHALL 각 스텝의 폼 섹션을 surface-low 배경의 StitchCard로 감싸고 인풋을 StitchInput 스타일로 변환한다
3. WHEN 견적 미리보기가 렌더링될 때, THE Page_Application_Layer SHALL 미리보기 카드에 Surface_Hierarchy 배경색과 Editorial_Typography를 적용한다
4. THE Page_Application_Layer SHALL 견적 페이지의 모든 기존 기능(계산, 저장, PDF 생성 등)을 변경 없이 유지한다

### 요구사항 11: 고객사/리드/파이프라인 페이지 Stitch 스타일 적용

**사용자 스토리:** 사용자로서, 고객사 목록, 리드 상세, 파이프라인 칸반 뷰가 Amber Curator 스타일로 표시되길 원한다. 그래야 CRM 업무 시 일관된 시각적 경험을 얻을 수 있다.

#### 수용 기준

1. WHEN 고객사 목록 페이지가 렌더링될 때, THE Page_Application_Layer SHALL 고객 카드를 StitchCard 스타일로, 필터 패널을 surface-low 배경으로 변환한다
2. WHEN 고객사 상세 페이지가 렌더링될 때, THE Page_Application_Layer SHALL 탭 콘텐츠 영역에 Surface_Hierarchy를 적용하고 정보 카드를 StitchCard로 변환한다
3. WHEN 칸반 뷰가 렌더링될 때, THE Page_Application_Layer SHALL 칸반 카드에 bg-white rounded-xl hover:translate-y-[-2px] shadow-ambient 스타일을 적용한다
4. WHEN 리드 상세 페이지가 렌더링될 때, THE Page_Application_Layer SHALL 파이프라인 스테퍼, 정보 섹션, 활동 타임라인에 Stitch 스타일을 적용한다
5. THE Page_Application_Layer SHALL 고객사/리드/파이프라인 페이지의 모든 기존 기능(필터링, 검색, 드래그앤드롭 등)을 변경 없이 유지한다

### 요구사항 12: 계약/시험/스터디 페이지 Stitch 스타일 적용

**사용자 스토리:** 사용자로서, 계약 관리, 시험 접수, 스터디 관리 페이지가 Amber Curator 스타일로 표시되길 원한다. 그래야 프로젝트 관리 업무 시 일관된 시각적 경험을 얻을 수 있다.

#### 수용 기준

1. WHEN 계약 관리 페이지가 렌더링될 때, THE Page_Application_Layer SHALL 결제 일정 테이블을 StitchTable로, 계약 상태를 StitchBadge로 변환한다
2. WHEN 시험 접수 폼이 렌더링될 때, THE Page_Application_Layer SHALL 폼 섹션을 surface-low 배경의 StitchCard로 감싸고 인풋을 StitchInput 스타일로 변환한다
3. WHEN 스터디 목록/상세 페이지가 렌더링될 때, THE Page_Application_Layer SHALL 문서 타임라인, 프로젝트 단계에 Surface_Hierarchy와 Editorial_Typography를 적용한다
4. THE Page_Application_Layer SHALL 계약/시험/스터디 페이지의 모든 기존 기능(결제 추적, 시험 번호 발급, 문서 관리 등)을 변경 없이 유지한다

### 요구사항 13: 설정/관리자 페이지 Stitch 스타일 적용

**사용자 스토리:** 관리자로서, 설정, 자동화 규칙, 백업 관리 페이지가 Amber Curator 스타일로 표시되길 원한다. 그래야 관리 업무 시에도 일관된 시각적 경험을 얻을 수 있다.

#### 수용 기준

1. WHEN 설정 페이지가 렌더링될 때, THE Page_Application_Layer SHALL 설정 섹션을 StitchCard로 감싸고 토글/인풋을 Stitch 스타일로 변환한다
2. WHEN 자동화 규칙 관리 페이지가 렌더링될 때, THE Page_Application_Layer SHALL 규칙 목록을 StitchTable로, 조건 빌더를 surface-container 배경으로 변환한다
3. WHEN 백업 관리 페이지가 렌더링될 때, THE Page_Application_Layer SHALL 백업 목록과 진행 상태를 Stitch 스타일로 변환한다
4. THE Page_Application_Layer SHALL 설정/관리자 페이지의 모든 기존 기능(자동화 실행, 백업/복원, 알림 설정 등)을 변경 없이 유지한다

### 요구사항 14: 모바일 반응형 Stitch 스타일 적용

**사용자 스토리:** 모바일 사용자로서, 모바일 뷰에서도 Amber Curator 스타일이 적절히 적용되길 원한다. 그래야 모바일에서도 일관된 시각적 경험을 얻을 수 있다.

#### 수용 기준

1. WHILE 모바일 뷰포트(768px 이하)에서, THE Page_Application_Layer SHALL rounded-[2.5rem]을 rounded-xl로 축소한다
2. WHILE 모바일 뷰포트에서, THE Page_Application_Layer SHALL 패딩을 p-8에서 p-4로 축소한다
3. WHILE 모바일 뷰포트에서, THE Page_Application_Layer SHALL 모바일 네비게이션(MobileNav, MobileBottomNav)에 Stitch 스타일을 적용한다
4. THE Page_Application_Layer SHALL 모바일 터치 타겟 최소 크기(44px)를 유지한다

### 요구사항 15: 기능 무결성 보장

**사용자 스토리:** 개발자로서, 디자인 시스템 적용 후 모든 기존 기능이 동일하게 동작하길 원한다. 그래야 스타일 변경이 비즈니스 로직에 영향을 주지 않음을 보장할 수 있다.

#### 수용 기준

1. THE Stitch_Converter SHALL 모든 페이지에서 기존 이벤트 핸들러, 상태 관리, API 호출 로직을 변경하지 않는다
2. THE Stitch_Converter SHALL className 속성만 변경하고 컴포넌트의 props 인터페이스, 데이터 바인딩, 조건부 렌더링 로직을 변경하지 않는다
3. WHEN 스타일 변환이 완료된 후, THE Page_Application_Layer SHALL 동일한 props 입력에 대해 동일한 데이터를 렌더링한다
4. IF shadcn/ui 기본 스타일과 Stitch 커스텀 클래스가 충돌하면, THEN THE Stitch_Converter SHALL cn() 유틸리티로 클래스를 병합하여 Stitch 클래스가 우선 적용되도록 한다

### 요구사항 16: 검색/캘린더/공지사항 페이지 Stitch 스타일 적용

**사용자 스토리:** 사용자로서, 통합 검색, 캘린더, 공지사항 페이지가 Amber Curator 스타일로 표시되길 원한다. 그래야 모든 페이지에서 일관된 시각적 경험을 얻을 수 있다.

#### 수용 기준

1. WHEN 통합 검색 페이지가 렌더링될 때, THE Page_Application_Layer SHALL 검색 인풋을 StitchInput 스타일로, 검색 결과를 StitchCard 스타일로 변환한다
2. WHEN 공지사항 목록/상세 페이지가 렌더링될 때, THE Page_Application_Layer SHALL 공지 카드를 StitchCard로, 댓글 영역을 surface-low 배경으로 변환한다
3. WHEN 에러/로딩/404 페이지가 렌더링될 때, THE Page_Application_Layer SHALL 해당 페이지에 Surface_Hierarchy 배경색과 Editorial_Typography를 적용한다
4. THE Page_Application_Layer SHALL 검색/공지사항 페이지의 모든 기존 기능(검색 필터링, 댓글 작성, 페이지네이션 등)을 변경 없이 유지한다
