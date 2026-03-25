# 시험관리 시스템 구현 계획

## 구현 순서

### Phase 1: DB 스키마 확장
1. `StudyDocumentType`, `DocumentVersion` enum 추가
2. `StudyDocument` 모델 추가 (Study 1:N)
3. `Study` 모델에 `userId`, `studyDirector`, `substanceCode`, `projectCode`, `testSubstance`, `sponsor` 필드 추가
4. `StudyStatus`에 `ON_HOLD` 추가
5. 마이그레이션 생성

### Phase 2: 백엔드 API
1. StudyDocument CRUD 라우트 (`/api/studies/:studyId/documents`)
2. 타임라인 API (`/api/contracts/:contractId/timeline`)
3. Study 일괄 등록 API 확장 (`POST /api/studies/bulk`)
4. 기존 studies 라우트에 userId 필터 추가

### Phase 3: 프론트엔드 — 시험 목록/상세 개선
1. 시험 목록 페이지 개선 (시험번호 색상, 상태 뱃지)
2. 시험 상세 페이지 — 문서 이력 타임라인
3. 문서 기록 추가 모달
4. 시험 일괄 등록 모달 (테이블 형태 입력)

### Phase 4: OCR 이미지 파싱
1. Tesseract.js 설치 및 OCR 서비스 레이어
2. 이미지 업로드 → OCR → 미리보기 테이블 → 일괄 등록 흐름

### Phase 5: 타임라인 뷰
1. 계약 단위 통합 타임라인 컴포넌트
2. 시험번호별 필터 칩
3. 월별 그룹핑 시각화

---

## 기술 결정사항
- `Project` 모델 없음 → `Contract`를 프로젝트 단위로 사용
- Study에 시험 접수 정보 필드 직접 추가 (TestReception 연결은 유지하되, 독립 입력도 가능하게)
- OCR: 개발 단계 Tesseract.js → 정식 출시 시 OpenAI Vision API로 교체
- 시험관리는 고객사 상세 내 탭으로 접근 (기존 TestReceptionTab 확장)
