---
inclusion: auto
---

# 디자인 가이드라인

이 프로젝트의 모든 UI 작업에 적용되는 디자인 원칙입니다.

## 핵심 원칙

- 깔끔하고 절제된 디자인. "AI가 만든 것 같은" 느낌 금지.
- 정보 밀도가 높되 읽기 편해야 함.
- 불필요한 장식 요소 최소화.

## 색상

- Primary: Slate 기반 중성 톤 + 절제된 블루 액센트 (1개)
- 그라데이션 배경 사용 금지 (버튼, 카드, 헤더 등)
- 파스텔톤 배경 최소화 — 필요 시 매우 연한 slate/gray 계열만 사용
- 상태 색상: green(성공), amber(경고), red(위험), blue(정보) — 채도 낮게
- 배지/태그: 배경색 없이 border + 텍스트 색상 조합 선호

## 타이포그래피

- 제목: text-lg font-semibold (과도한 크기 금지)
- 본문: text-sm
- 보조 텍스트: text-xs text-muted-foreground
- font-bold 남용 금지 — semibold까지만

## 레이아웃

- 카드 패딩: p-4 ~ p-6 (일관성 유지)
- 섹션 간격: space-y-4 ~ space-y-6
- 카드 border: border border-border (그림자 최소화)
- 카드 그림자: shadow-sm 까지만 (shadow-lg, shadow-xl 금지)

## 인터랙션

- hover 시 translate/lift 효과 금지
- hover: bg-muted 또는 border 색상 변경 정도만
- 트랜지션: transition-colors duration-150 (짧고 미묘하게)
- glass morphism (backdrop-blur) 사용 금지

## 컴포넌트 스타일

- 버튼: shadcn 기본 variant 사용. 커스텀 그라데이션 버튼 금지.
- 입력 필드: 기본 border, focus 시 ring-1 ring-ring
- 테이블: 심플한 border-b 구분선, 줄무늬 배경 선택적
- 빈 상태: 아이콘 + 짧은 텍스트. 과도한 일러스트 금지.

## 참고 디자인

- 리드 상세 페이지 (`/leads/[id]`)가 현재 기준 디자인
- 3컬럼 레이아웃, 파이프라인 스테퍼, 정보 밀도 높은 구성
