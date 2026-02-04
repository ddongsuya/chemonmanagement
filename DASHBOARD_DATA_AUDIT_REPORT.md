# 전체 시스템 데이터 연관성 전수조사 보고서

## 조사 일자: 2026-02-04

---

## 1. 조사 범위

### 조사 대상 모듈
| 모듈 그룹 | 모듈명 | 경로 | 조사 상태 |
|----------|--------|------|----------|
| 영업관리 | 리드 관리 | `/leads` | ✅ 완료 |
| 영업관리 | 파이프라인 | `/pipeline` | ✅ 완료 |
| 영업관리 | 고객사 관리 | `/customers` | ✅ 완료 |
| 영업관리 | 매출 대시보드 | `/sales` | ✅ 완료 |
| 견적관리 | 독성시험 견적 | `/quotations/new` | ✅ 완료 |
| 견적관리 | 효력시험 견적 | `/efficacy-quotations/new` | ✅ 완료 |
| 견적관리 | 임상병리 견적 | `/clinical-pathology/quotations/new` | ✅ 완료 |
| 견적관리 | 견적 목록 | `/quotations` | ✅ 완료 |
| 계약/시험 | 계약 관리 | `/contracts` | ✅ 완료 |
| 계약/시험 | 시험 관리 | `/studies` | ✅ 완료 |
| 대시보드 | 메인 대시보드 | `/dashboard` | ✅ 완료 |

---

## 2. 데이터 흐름 분석

### 2.1 리드 → 견적서 → 계약서 → 시험 흐름

```
[리드 생성] → [견적서 작성] → [계약 체결] → [시험 등록]
    ↓              ↓              ↓              ↓
  Lead          Quotation      Contract       Study
    ↓              ↓              ↓              ↓
 companyName   customerName    customerId    contractId
 contactName   leadId          quotations    testReceptionId
 inquiryType   modality        totalAmount   studyType
```

### 2.2 데이터 연결 관계

| 소스 모델 | 대상 모델 | 연결 필드 | 상태 |
|----------|----------|----------|------|
| Lead | Quotation | `leadId` | ✅ 정상 |
| Lead | Customer | `customerId` (전환 시) | ✅ 정상 |
| Quotation | Contract | `quotations[]` (다대다) | ✅ 정상 |
| Contract | Study | `contractId` | ✅ 정상 |
| Customer | Quotation | `customerId` | ✅ 정상 |
| TestReception | Study | `testReceptionId` | ✅ 정상 |

---

## 3. 견적서 유형별 필드 비교

### 3.1 독성시험 견적서 (TOXICITY)

| 필드명 | DB 컬럼 | 입력 폼 | 대시보드 사용 | 상태 |
|-------|--------|--------|-------------|------|
| 고객사명 | `customerName` | StepBasicInfo | ✅ | ✅ 정상 |
| 프로젝트명 | `projectName` | StepBasicInfo | ✅ | ✅ 정상 |
| 모달리티 | `modality` | StepModality | ModalityChart | ✅ 정상 |
| 시험 항목 | `items` (JSON) | StepTestSelection | - | ✅ 정상 |
| 총액 | `totalAmount` | StepCalculation | StatsCard | ✅ 정상 |
| 리드 연결 | `leadId` | CustomerSelector | - | ✅ 정상 |

### 3.2 효력시험 견적서 (EFFICACY)

| 필드명 | DB 컬럼 | 입력 폼 | 대시보드 사용 | 상태 |
|-------|--------|--------|-------------|------|
| 고객사명 | `customerName` | StepBasicInfo | ✅ | ✅ 정상 |
| 프로젝트명 | `projectName` | StepBasicInfo | ✅ | ✅ 정상 |
| 모달리티 | `modality` | ❌ 없음 | ModalityChart | ⚠️ 문제 |
| 모델 카테고리 | `modelCategory` | StepModelSelection | ModalityChart (대체) | ✅ 수정됨 |
| 모델 ID | `modelId` | StepModelSelection | - | ✅ 정상 |
| 적응증 | `indication` | StepModelSelection | - | ✅ 정상 |
| 시험 항목 | `items` (JSON) | StepItemConfiguration | - | ✅ 정상 |
| 총액 | `totalAmount` | StepCalculation | StatsCard | ✅ 정상 |
| 리드 연결 | `leadId` | CustomerSelector | - | ✅ 정상 |

### 3.3 임상병리 견적서 (ClinicalQuotation - 별도 테이블)

| 필드명 | DB 컬럼 | 입력 폼 | 대시보드 사용 | 상태 |
|-------|--------|--------|-------------|------|
| 고객사명 | `customerName` | Step1 기본정보 | ✅ | ✅ 정상 |
| 담당자명 | `contactName` | Step1 기본정보 | - | ✅ 정상 |
| 시험기준 | `testStandard` | Step1 기본정보 | - | ✅ 정상 |
| 동물 종 | `animalSpecies` | Step2 검체정보 | - | ✅ 정상 |
| 검체 종류 | `sampleTypes` | Step2 검체정보 | - | ✅ 정상 |
| 검체 수 | `totalSamples` | Step2 검체정보 | - | ✅ 정상 |
| 검사항목 | `items` (관계) | Step3 검사항목 | - | ✅ 정상 |
| 총액 | `totalAmount` | Step4 금액확인 | StatsCard | ✅ 정상 |
| 모달리티 | ❌ 없음 | ❌ 없음 | ModalityChart | ⚠️ 별도 처리 |

---

## 4. 리드 관리 모듈 분석

### 4.1 리드 입력 필드

| 필드명 | DB 컬럼 | 입력 폼 | 필수 | 상태 |
|-------|--------|--------|-----|------|
| 회사명 | `companyName` | ✅ | ✅ | ✅ 정상 |
| 담당자명 | `contactName` | ✅ | ✅ | ✅ 정상 |
| 이메일 | `contactEmail` | ✅ | - | ✅ 정상 |
| 연락처 | `contactPhone` | ✅ | - | ✅ 정상 |
| 부서 | `department` | ✅ | - | ✅ 정상 |
| 직책 | `position` | ✅ | - | ✅ 정상 |
| 유입 경로 | `source` | ✅ | - | ✅ 정상 |
| 문의 유형 | `inquiryType` | ✅ | - | ⚠️ 2가지만 |
| 예상 금액 | `expectedAmount` | ✅ | - | ✅ 정상 |
| 예상 계약일 | `expectedDate` | ✅ | - | ✅ 정상 |
| 파이프라인 단계 | `stageId` | ✅ | - | ✅ 정상 |
| 문의 내용 | `inquiryDetail` | ✅ | - | ✅ 정상 |

### 4.2 리드 → 견적서 연결

- ✅ CustomerSelector 컴포넌트가 모든 견적서 유형에서 공유됨
- ✅ 리드 선택 시 `leadId`, `companyName`, `contactName`, `contactEmail`, `contactPhone` 자동 채움
- ✅ 리드 전환 서비스 (`leadConversionService.ts`) 정상 작동

### 4.3 발견된 문제점

| 문제 | 심각도 | 설명 |
|-----|-------|------|
| 문의 유형 제한 | P2 | 리드의 `inquiryType`이 TOXICITY/EFFICACY 2가지만 지원, 임상병리 없음 |

---

## 5. 대시보드 위젯별 데이터 소스 분석

### 5.1 ModalityChart (모달리티별 분포)

**현재 구현 (수정됨):**
```typescript
// 독성시험: modality 사용
// 효력시험: modelCategory 사용
// 임상병리: '임상병리'로 표시
let displayModality = q.modality;
if (!displayModality && q.modelCategory) {
  displayModality = q.modelCategory;
}
if (!displayModality) {
  displayModality = q.quotationType === 'CLINICAL_PATHOLOGY' ? '임상병리' : '기타';
}
```

**상태:** ✅ 수정 완료

### 5.2 MonthlyTrendChart (월별 추이)

**데이터 소스:** `Quotation.createdAt` 기준 월별 집계
**상태:** ✅ 정상 작동

### 5.3 RevenueChart (매출 현황)

**데이터 소스:** `Contract.totalAmount`, `Contract.signedDate`
**상태:** ✅ 정상 작동

### 5.4 PipelineFunnel (파이프라인)

**데이터 소스:** `Quotation.status` 별 집계
**상태:** ✅ 정상 작동

### 5.5 TeamLeaderboard (영업 성과)

**데이터 소스:** `Contract.totalAmount` 기준 사용자별 순위
**상태:** ✅ 정상 작동

### 5.6 StudyStatusWidget (시험 현황)

**데이터 소스:** `Study` 모델
**상태:** ✅ 정상 작동

### 5.7 RecentQuotations (최근 견적서)

**데이터 소스:** `Quotation` 최신순
**상태:** ✅ 정상 작동

---

## 6. 계약/시험 모듈 분석

### 6.1 계약서 필드

| 필드명 | DB 컬럼 | 입력 폼 | 상태 |
|-------|--------|--------|------|
| 계약번호 | `contractNumber` | 자동생성 | ✅ 정상 |
| 계약명 | `title` | ✅ | ✅ 정상 |
| 계약유형 | `contractType` | ✅ | ✅ 정상 |
| 고객사 | `customerId` | ✅ | ✅ 정상 |
| 총액 | `totalAmount` | ✅ | ✅ 정상 |
| 체결일 | `signedDate` | ✅ | ✅ 정상 |
| 상태 | `status` | ✅ | ✅ 정상 |
| 연결 견적서 | `quotations[]` | ✅ | ✅ 정상 |

### 6.2 시험 필드

| 필드명 | DB 컬럼 | 입력 폼 | 상태 |
|-------|--------|--------|------|
| 시험번호 | `studyNumber` | 자동생성 | ✅ 정상 |
| 시험명 | `testName` | ✅ | ✅ 정상 |
| 시험유형 | `studyType` | ✅ | ✅ 정상 |
| 계약 연결 | `contractId` | ✅ | ✅ 정상 |
| 시험접수 연결 | `testReceptionId` | ✅ | ✅ 정상 |
| 상태 | `status` | ✅ | ✅ 정상 |

---

## 7. 발견된 문제점 및 개선 권장사항

### P0 (긴급) - 즉시 수정 필요

없음 - 주요 문제 해결됨

### P1 (높음) - 이번 주 내 수정 권장

| 번호 | 문제 | 영향 | 권장 조치 |
|-----|-----|-----|----------|
| 1 | 리드 문의유형에 임상병리 없음 | 리드 분류 불완전 | `QuotationType` enum에 `CLINICAL_PATHOLOGY` 추가 또는 별도 필드 |

### P2 (중간) - 다음 스프린트

| 번호 | 문제 | 영향 | 권장 조치 |
|-----|-----|-----|----------|
| 1 | 임상병리 견적서가 별도 테이블 | 통합 조회 복잡 | 장기적으로 Quotation 테이블 통합 고려 |
| 2 | ~~계약서 유형도 2가지만~~ | ~~임상병리 계약 분류 불가~~ | ✅ 완료 - 임상병리 옵션 추가됨 |
| 3 | 임상병리 견적서→계약서 연결 기능 없음 | 임상병리 계약 생성 불편 | 임상병리 견적서에서 계약서 생성 기능 추가 |

### P3 (낮음) - 개선 사항

| 번호 | 개선 사항 | 설명 |
|-----|----------|------|
| 1 | 대시보드 임상병리 통계 | 임상병리 견적/계약 별도 위젯 추가 |
| 2 | 통합 검색 | 모든 견적서 유형 통합 검색 기능 |

---

## 8. 데이터 흐름 정상 작동 확인

### ✅ 정상 작동하는 흐름

1. **리드 → 견적서 연결**
   - CustomerSelector가 모든 견적서 유형에서 리드 선택 지원
   - 리드 정보 자동 채움 정상 작동

2. **견적서 → 계약서 연결**
   - 견적서에서 계약서 생성 시 `quotations[]` 관계 설정

3. **계약서 → 시험 연결**
   - 계약서에서 시험 등록 시 `contractId` 연결

4. **리드 → 고객 전환**
   - `leadConversionService` 정상 작동
   - 전환 시 고객 등급 자동 설정 (CUSTOMER)

5. **대시보드 데이터 표시**
   - 모달리티별 분포: 3가지 견적 유형 모두 처리
   - 월별 추이: 정상
   - 매출 현황: 정상
   - 파이프라인: 정상

---

## 9. 결론

전체 시스템의 데이터 흐름을 분석한 결과, **대부분의 모듈이 정상적으로 연결되어 있습니다.**

주요 개선 완료 사항:
- ModalityChart가 효력시험의 `modelCategory`와 임상병리를 올바르게 처리

남은 개선 사항:
- 리드 문의유형에 임상병리 옵션 추가 (P1)
- 장기적으로 견적서 테이블 통합 고려 (P2)

---

## 10. 변경 이력

| 날짜 | 변경 내용 | 담당자 |
|-----|----------|-------|
| 2026-02-04 | 초기 감사 보고서 작성 | Kiro |
| 2026-02-04 | ModalityChart 수정 완료 | Kiro |
| 2026-02-04 | 전체 모듈 감사 완료 | Kiro |
| 2026-02-04 | 계약서 유형에 임상병리 옵션 추가 | Kiro |
