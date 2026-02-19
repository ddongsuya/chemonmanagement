# 구현 계획: 독성시험 견적서 v2

## 개요

v2 독성시험 견적서 모듈을 단계적으로 구현한다. 데이터 레이어 → 가격 엔진 → 스토어 → UI 컴포넌트 → 출력물 순서로 진행하며, 각 단계에서 테스트를 병행한다.

## Tasks

- [x] 1. 타입 정의 및 v2 데이터 변환
  - [x] 1.1 `chemon-quotation/types/toxicity-v2.ts`에 모든 v2 타입 정의 (TestMode, RouteType, StandardType, ToxicityV2Item, ComboItem, SimpleItem, TestRelationNode, TkOptionTree, OecdOverlay, CategoryColorMap, SelectedTest, QuotationInfo)
    - _Requirements: 2.11, 3.1, 4.1, 5.1_
  - [x] 1.2 `chemon-quotation/lib/toxicity-v2/data/` 디렉토리에 v2 소스 데이터를 TypeScript 상수로 변환
    - `toxicityData.ts`: D 배열 104개 항목을 ToxicityV2Item[] 타입으로 변환
    - `comboData.ts`: COMBO 9개 항목을 ComboItem[] 타입으로 변환
    - `vaccineData.ts`: VACCINE 3개 항목을 SimpleItem[] 타입으로 변환
    - `screenData.ts`: SCREEN 8개 + CV_SCREEN 6개 항목
    - `healthFoodData.ts`: HF_INDV 7개 + HF_PROB 5개 + HF_TEMP 8개 항목
    - `medicalDeviceData.ts`: MD_BIO 18개 항목
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_
  - [x] 1.3 `chemon-quotation/lib/toxicity-v2/data/relations.ts`에 TR 트리, OPT_IDS 변환
    - _Requirements: 7.1, 7.4, 8.1_
  - [x] 1.4 `chemon-quotation/lib/toxicity-v2/data/overlays.ts`에 OV, OE 오버레이 변환
    - _Requirements: 4.2, 4.3_
  - [x] 1.5 `chemon-quotation/lib/toxicity-v2/data/metadata.ts`에 FN, GL, CC, IM, CATS 매핑 변환
    - _Requirements: 10.1, 10.2, 10.3, 6.1_

- [x] 2. 가격 계산 엔진 구현
  - [x] 2.1 `chemon-quotation/lib/toxicity-v2/priceEngine.ts`에 순수 함수 구현
    - `getItemPrice(item, route, standard, ovOverlay, oeOverlay)`: 의약품 항목 가격 조회
    - `getComboPrice(item, comboType)`: 복합제 항목 가격 조회
    - `calcContentCount(duration)`: 함량분석 횟수 계산
    - `calcFormulationCost(selectedItems, mode, allItems, imMapping)`: 조제물분석비 계산
    - `calculateTotal(selectedItems, formulationCost, discountRate)`: 전체 금액 계산
    - `formatKRW(amount)`: 한국 원화 포맷 (예: 79,000,000원)
    - `formatKRWShort(amount)`: 모바일 축약 포맷 (예: 7,900만원)
    - _Requirements: 3.1, 3.2, 3.5, 4.1, 4.2, 5.2, 6.1, 6.2, 16.1, 16.2, 16.3, 16.4, 19.4_
  - [x] 2.2 가격 계산 엔진 속성 테스트 — Property 1: 투여 경로별 가격 적용
    - **Property 1: 투여 경로별 가격 적용**
    - **Validates: Requirements 3.1, 3.2, 3.4**
  - [x] 2.3 가격 계산 엔진 속성 테스트 — Property 2: OECD 오버레이 가격 대체
    - **Property 2: OECD 오버레이 가격 대체**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.5**
  - [x] 2.4 가격 계산 엔진 속성 테스트 — Property 3: 복합제 종수별 가격 적용
    - **Property 3: 복합제 종수별 가격 적용**
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.5**
  - [x] 2.5 가격 계산 엔진 속성 테스트 — Property 4: 함량분석 횟수 계산
    - **Property 4: 함량분석 횟수 계산**
    - **Validates: Requirements 6.1, 6.2**
  - [x] 2.6 가격 계산 엔진 속성 테스트 — Property 5: 조제물분석비 계산
    - **Property 5: 조제물분석비 계산**
    - **Validates: Requirements 6.5, 16.2**
  - [x] 2.7 가격 계산 엔진 속성 테스트 — Property 6: 최종 합계 계산 항등식
    - **Property 6: 최종 합계 계산 항등식**
    - **Validates: Requirements 16.1, 16.3, 16.4**
  - [x] 2.8 가격 계산 엔진 속성 테스트 — Property 13: 금액 포맷팅
    - **Property 13: 금액 포맷팅**
    - **Validates: Requirements 3.5, 12.4**
  - [x] 2.9 가격 계산 엔진 속성 테스트 — Property 14: 모바일 가격 축약 포맷팅
    - **Property 14: 모바일 가격 축약 포맷팅**
    - **Validates: Requirements 19.4**
  - [x] 2.10 가격 계산 엔진 속성 테스트 — Property 16: 비자동 조제물분석 모드
    - **Property 16: 비자동 조제물분석 모드**
    - **Validates: Requirements 16.6**

- [x] 3. 데이터 무결성 테스트
  - [x] 3.1 데이터 무결성 속성 테스트 — Property 7: 모드별 데이터셋 매핑
    - **Property 7: 모드별 데이터셋 매핑**
    - **Validates: Requirements 2.2~2.10**
  - [x] 3.2 데이터 무결성 속성 테스트 — Property 8: 시험 관계 트리 무결성
    - **Property 8: 시험 관계 트리 무결성**
    - **Validates: Requirements 7.1, 8.5**
  - [x] 3.3 데이터 무결성 속성 테스트 — Property 12: 부가 데이터 완전성
    - **Property 12: 부가 데이터 완전성**
    - **Validates: Requirements 10.1, 10.2**

- [x] 4. 체크포인트 — 데이터 레이어 및 가격 엔진 검증
  - 모든 테스트가 통과하는지 확인, 질문이 있으면 사용자에게 문의

- [x] 5. Zustand 스토어 구현
  - [x] 5.1 `chemon-quotation/stores/toxicityV2Store.ts`에 ToxicityV2State 스토어 구현
    - 모드/옵션 상태 관리 (mode, route, standard, comboType)
    - 시험 항목 선택/제거/토글 (addTest, removeTest, toggleTest)
    - 본시험 제거 시 연쇄 삭제 로직 (parentId 기반)
    - 견적서 정보 관리 (info)
    - 할인율/할인사유 관리
    - 미리보기 탭 상태
    - 가격 재계산 (priceEngine 호출)
    - _Requirements: 3.4, 4.4, 5.5, 7.3, 15.2, 15.3_
  - [x] 5.2 스토어 속성 테스트 — Property 9: 본시험 제거 시 연쇄 삭제
    - **Property 9: 본시험 제거 시 연쇄 삭제**
    - **Validates: Requirements 7.3**

- [x] 6. 모드 선택 UI 구현
  - [x] 6.1 `chemon-quotation/components/toxicity-v2/ModeSelector.tsx` 구현
    - 최상위 카테고리 3개 카드 (의약품/건기식/의료기기)
    - 의약품 하위 모드 4개 (의약품/복합제/백신/스크리닝)
    - 스크리닝 하위 모드 2개 (독성/심혈관계)
    - 건기식 하위 모드 3개 (개별인정형/프로바이오틱스/한시적식품)
    - 뒤로 버튼 네비게이션
    - shadcn/ui Card 컴포넌트 사용
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 7. 시험 항목 선택 UI 구현
  - [x] 7.1 `chemon-quotation/components/toxicity-v2/PriceOptionBar.tsx` 구현
    - 투여 경로 선택 (경구/정맥) — 의약품 모드 전용
    - 시험 기준 선택 (KGLP/KGLP+OECD) — 의약품 모드 전용
    - 복합제 종수 선택 (2종/3종/4종) — 복합제 모드 전용
    - shadcn/ui Select, ToggleGroup 사용
    - _Requirements: 3.1, 4.1, 5.1_
  - [x] 7.2 `chemon-quotation/components/toxicity-v2/TestItemCard.tsx` 구현
    - 시험 항목 카드 (카테고리 색상, 시험명, 동물종, 기간, 가격)
    - 선택 상태 시각적 표시
    - 모바일 반응형 (가격 축약, 텍스트 ellipsis)
    - _Requirements: 9.4, 9.5, 9.6, 19.1, 19.4_
  - [x] 7.3 `chemon-quotation/components/toxicity-v2/V2TestSelector.tsx` 구현
    - 카테고리 필터 탭 (가로 스크롤, 모바일 대응)
    - 검색 입력 필드
    - 시험 항목 카드 그리드 (OPT_IDS 항목 숨김)
    - _Requirements: 9.1, 9.2, 9.3, 7.4, 19.2, 19.3_
  - [x] 7.4 필터링 속성 테스트 — Property 10: 카테고리 필터링 정확성
    - **Property 10: 카테고리 필터링 정확성**
    - **Validates: Requirements 9.2**
  - [x] 7.5 필터링 속성 테스트 — Property 11: 검색 필터링 정확성
    - **Property 11: 검색 필터링 정확성**
    - **Validates: Requirements 9.3**
  - [x] 7.6 필터링 속성 테스트 — Property 15: 옵션 항목 숨김
    - **Property 15: 옵션 항목 숨김**
    - **Validates: Requirements 7.4**

- [x] 8. 시험 관계 트리 UI 구현
  - [x] 8.1 `chemon-quotation/components/toxicity-v2/TestRelationPanel.tsx` 구현
    - 본시험 선택 시 회복시험 옵션 제안 UI
    - TK 옵션 트리 UI (채혈방식 → 포인트수 → 채혈횟수)
    - 13주 이상 시 3단계 TK 옵션 표시
    - 옵션 수락/거절 인터랙션
    - _Requirements: 7.1, 7.2, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 9. 체크포인트 — 시험 선택 UI 검증
  - 모든 테스트가 통과하는지 확인, 질문이 있으면 사용자에게 문의

- [x] 10. 미리보기 패널 구현
  - [x] 10.1 `chemon-quotation/components/toxicity-v2/PreviewCover.tsx` 구현
    - 표지: 회사 로고, 견적서 제목, 기관/담당자/연락처, 날짜, 견적번호
    - 시험물질명, 제출목적(모드별 자동 생성), 시험기준
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  - [x] 10.2 `chemon-quotation/components/toxicity-v2/PreviewQuote.tsx` 구현
    - 견적서 테이블: 번호, 시험명, 동물종, 기간, 금액
    - 소계/조제물분석비/할인/합계 요약
    - 금액 한국 원화 포맷
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  - [x] 10.3 `chemon-quotation/components/toxicity-v2/PreviewDetail.tsx` 구현
    - 상세내역: 정식명칭(FN/fn), 설명(desc), 가이드라인(GL/gl), 동물종, 기간, 소요기간
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  - [x] 10.4 `chemon-quotation/components/toxicity-v2/PreviewPanel.tsx` 구현
    - 탭 UI (표지/견적서/상세내역/전체)
    - 전체보기 모드 (연속 출력)
    - 인쇄/PDF 버튼
    - 반응형: 1024px 미만에서 하단/모달 전환
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 15.1, 15.4, 15.5, 19.6_

- [x] 11. 페이지 통합 및 위자드 연결
  - [x] 11.1 기존 `quotations/new/page.tsx`의 독성시험 흐름에 v2 모드 선택 + 시험 선택 + 미리보기 패널 통합
    - Step 2(시험선택)에서 ModeSelector → V2TestSelector + PreviewPanel 레이아웃
    - 기존 위자드 4단계 흐름 유지 (기본정보→시험선택→계산→미리보기)
    - toxicityV2Store와 기존 quotationStore 연동
    - _Requirements: 18.4, 18.5_
  - [x] 11.2 `chemon-quotation/components/toxicity-v2/SelectedTestList.tsx` 구현
    - 선택된 시험 목록 사이드바/하단 패널
    - 항목 제거, 순서 변경
    - 소계 표시
    - _Requirements: 9.5, 9.6_

- [x] 12. 백엔드 API 및 Prisma 스키마 확장
  - [x] 12.1 `backend/prisma/schema.prisma`에 ToxicityV2Item, ToxicityV2Relation, ToxicityV2Overlay, ToxicityV2Metadata 모델 추가
    - _Requirements: 17.2, 17.3, 17.4, 17.5_
  - [x] 12.2 `backend/prisma/seed-v2-data.ts`에 v2 시험 데이터 seed 스크립트 작성
    - D 배열 104개 + COMBO 9개 + VACCINE 3개 + SCREEN 8개 + CV_SCREEN 6개 + HF_INDV 7개 + HF_PROB 5개 + HF_TEMP 8개 + MD_BIO 18개
    - TR 트리, OV/OE 오버레이, FN/GL/CC/IM 매핑
    - 기존 데이터 삭제 후 v2 데이터 투입
    - _Requirements: 17.1, 17.6_
  - [x] 12.3 `backend/src/routes/toxicityV2.ts`에 API 라우트 구현
    - GET /api/toxicity-v2/items?mode={mode}
    - GET /api/toxicity-v2/categories?mode={mode}
    - GET /api/toxicity-v2/relations
    - GET /api/toxicity-v2/overlays
    - GET /api/toxicity-v2/metadata
    - _Requirements: 2.2~2.10_
  - [x] 12.4 `backend/src/services/toxicityV2Service.ts`에 서비스 레이어 구현
    - _Requirements: 2.2~2.10_

- [x] 13. 프론트엔드 API 연동
  - [x] 13.1 `chemon-quotation/lib/toxicity-v2-api.ts`에 API 클라이언트 함수 구현
    - _Requirements: 2.2~2.10_
  - [x] 13.2 `chemon-quotation/hooks/useToxicityV2.ts`에 React Query 훅 구현
    - useToxicityV2Items(mode), useToxicityV2Categories(mode), useToxicityV2Relations(), useToxicityV2Overlays(), useToxicityV2Metadata()
    - _Requirements: 2.2~2.10_

- [x] 14. 최종 체크포인트 — 전체 통합 검증
  - 모든 테스트가 통과하는지 확인, 질문이 있으면 사용자에게 문의

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- 각 태스크는 특정 요구사항을 참조하여 추적 가능
- 체크포인트에서 증분 검증 수행
- 속성 테스트는 가격 계산 엔진의 정확성을 보장하는 핵심 테스트
- 단위 테스트는 엣지 케이스와 에러 조건에 집중
