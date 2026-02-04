# 대시보드 데이터 연관성 전수조사 보고서

## 조사 일자: 2026-02-04

---

## 1. 현재 상태 요약

### ✅ 정상 작동하는 데이터 흐름

| 대시보드 항목 | 데이터 소스 | 입력 폼 | 상태 |
|-------------|-----------|--------|------|
| 견적 금액/건수 | Quotation.totalAmount | StepPreview에서 저장 | ✅ 정상 |
| 계약 금액/건수 | Contract.totalAmount | ContractForm에서 저장 | ✅ 정상 |
| 리드 건수 | Lead.count | 리드 작성 폼 | ✅ 정상 |
| 수주율 | ACCEPTED/REJECTED 상태 | 견적서 상태 변경 | ✅ 정상 |
| 모달리티별 분포 | Quotation.modality | StepModality에서 선택 | ✅ 정상 |

### ⚠️ 확인 필요한 항목

| 대시보드 항목 | 문제점 | 우선순위 |
|-------------|-------|---------|
| 효력시험 모달리티 | 효력시험은 모달리티 대신 모델 카테고리 사용 | P1 |
| 임상병리 모달리티 | 임상병리 견적에 모달리티 필드 없음 | P1 |
| 시험 현황 위젯 | Study 데이터 연결 확인 필요 | P2 |

---

## 2. 견적서 유형별 필드 비교

### 2.1 독성시험 견적서 (TOXICITY)

**입력 필드:**
- ✅ customerName (고객사명)
- ✅ projectName (프로젝트명)
- ✅ modality (모달리티) - StepModality에서 선택
- ✅ items (시험 항목)
- ✅ totalAmount (총액)
- ✅ validDays (유효기간)
- ✅ notes (비고)
- ✅ leadId (리드 연결)

### 2.2 효력시험 견적서 (EFFICACY)

**입력 필드:**
- ✅ customerName (고객사명)
- ✅ projectName (프로젝트명)
- ⚠️ modality - 사용하지 않음 (modelCategory 사용)
- ✅ modelId (모델 ID)
- ✅ modelCategory (모델 카테고리)
- ✅ indication (적응증)
- ✅ items (시험 항목)
- ✅ totalAmount (총액)

**문제점:** 
- 대시보드 ModalityChart는 `modality` 필드를 사용하는데, 효력시험은 `modelCategory`를 사용
- 해결방안: ModalityChart에서 효력시험은 modelCategory를 modality로 매핑하거나, 별도 차트 표시

### 2.3 임상병리 견적서 (CLINICAL_PATHOLOGY)

**확인 필요:**
- 임상병리 견적서 작성 폼 구조 확인 필요
- modality 필드 존재 여부 확인

---

## 3. 대시보드 위젯별 데이터 소스 분석

### 3.1 ModalityChart (모달리티별 분포)

**현재 구현:**
```typescript
// ModalityChart.tsx
const response = await getQuotations({ limit: 500 });
quotationData.forEach((q: any) => {
  const modality = q.modality || '기타';
  // 집계...
});
```

**문제점:**
1. 효력시험 견적은 modality가 null이므로 모두 '기타'로 분류됨
2. 임상병리 견적도 마찬가지

**개선 방안:**
```typescript
const modality = q.modality || q.modelCategory || '기타';
```

### 3.2 MonthlyTrendChart (월별 추이)

**현재 구현:** 견적서 createdAt 기준 월별 집계
**상태:** ✅ 정상 작동

### 3.3 RevenueChart (매출 현황)

**현재 구현:** analytics API 사용
**데이터 소스:** Contract.totalAmount, Contract.signedDate
**상태:** ✅ 정상 작동 (계약 데이터 기반)

### 3.4 PipelineFunnel (파이프라인)

**현재 구현:** analytics API - conversion 분석
**데이터 소스:** Quotation 상태별 집계
**상태:** ✅ 정상 작동

### 3.5 TeamLeaderboard (영업 성과)

**현재 구현:** analytics API - performance 분석
**데이터 소스:** Contract.totalAmount 기준 사용자별 순위
**상태:** ✅ 정상 작동

### 3.6 StudyStatusWidget (시험 현황)

**현재 구현:** study-dashboard API 사용
**데이터 소스:** Study 모델
**상태:** ⚠️ 확인 필요 - Study 데이터 입력 경로 확인

### 3.7 RecentQuotations (최근 견적서)

**현재 구현:** getQuotations API 사용
**상태:** ✅ 정상 작동

---

## 4. 개선 필요 사항

### P0 (긴급) - 즉시 수정

1. **ModalityChart 개선**
   - 효력시험의 modelCategory를 modality로 매핑
   - 임상병리 견적 처리 추가

### P1 (높음) - 이번 주 내

2. **효력시험 견적서에 modality 필드 추가 고려**
   - 또는 대시보드에서 quotationType별 분리 표시

3. **임상병리 견적서 필드 확인**
   - modality 또는 유사 필드 추가

### P2 (중간) - 다음 스프린트

4. **Study 데이터 입력 경로 확인**
   - 계약서 → 시험 접수 → Study 생성 흐름 확인

5. **고객 등급(grade) 대시보드 반영**
   - 고객 등급별 분포 차트 추가

---

## 5. 권장 조치 사항

### 즉시 조치 (ModalityChart 수정)

```typescript
// ModalityChart.tsx 수정
quotationData.forEach((q: any) => {
  // 독성시험: modality 사용
  // 효력시험: modelCategory 사용
  // 임상병리: 별도 처리
  let displayModality = q.modality;
  
  if (!displayModality && q.modelCategory) {
    displayModality = q.modelCategory; // 효력시험
  }
  
  if (!displayModality) {
    displayModality = q.quotationType === 'CLINICAL_PATHOLOGY' 
      ? '임상병리' 
      : '기타';
  }
  
  // 집계...
});
```

### 장기 개선 (데이터 모델 통일)

1. 모든 견적서 유형에 `category` 또는 `classification` 통합 필드 추가
2. 대시보드에서 이 통합 필드 사용

---

## 6. 결론

현재 대부분의 데이터 흐름은 정상 작동하고 있습니다. 
주요 개선점은 **효력시험과 임상병리 견적의 모달리티 처리**입니다.

ModalityChart 컴포넌트를 수정하여 모든 견적 유형을 올바르게 분류하도록 개선하면 됩니다.
