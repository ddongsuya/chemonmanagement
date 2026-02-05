# 요구사항 문서

## 소개

본 문서는 CHEMON CRM 워크플로우를 실제 업무 프로세스(문의 → 계약)에 맞게 개선하는 기능에 대한 요구사항을 정의합니다. 현재 시스템의 파이프라인 단계를 실제 비즈니스 워크플로우에 맞게 재정의하고, 미진행 사유 관리, 시험 접수 정보 확장, 계약서 지급조건 유연화 기능을 추가합니다.

## 용어집

- **System**: CHEMON 견적관리 시스템 전체
- **Pipeline_Stage**: 영업 파이프라인의 각 단계 (문의접수, 검토중, 견적발송, 계약협의, 시험접수, 시험진행, 완료)
- **Stage_Task**: 각 파이프라인 단계에서 수행해야 할 체크리스트 항목
- **Lead**: 잠재 고객 정보 (문의 단계의 고객)
- **Quotation**: 견적서
- **Lost_Reason**: 견적 발송 후 미진행 시 기록하는 사유
- **Test_Reception**: 시험 접수 정보 (물질코드, 프로젝트코드, 시험번호 등)
- **Consultation_Record**: 상담기록지
- **Contract**: 계약서
- **Payment_Schedule**: 시험번호별 지급 일정
- **Payment_Type**: 지급 유형 (일괄지급, 분할지급, 시험번호별 지급)
- **Study**: 시험 관리 정보

## 요구사항

### 요구사항 1: 파이프라인 단계 재정의

**사용자 스토리:** 영업 담당자로서, 실제 업무 프로세스에 맞는 파이프라인 단계를 사용하여 영업 현황을 정확하게 추적할 수 있어야 합니다.

#### 인수 조건

1. THE System SHALL 다음 7개의 파이프라인 단계를 기본값으로 제공해야 합니다: 문의접수(INQUIRY), 검토중(REVIEW), 견적발송(QUOTATION_SENT), 계약협의(NEGOTIATION), 시험접수(TEST_RECEPTION), 시험진행(IN_PROGRESS), 완료(COMPLETED)
2. WHEN 시스템이 초기화되면 THEN THE System SHALL Pipeline_Stage 테이블에 7개의 기본 단계를 순서대로 생성해야 합니다
3. WHEN 각 파이프라인 단계가 생성되면 THEN THE System SHALL 해당 단계에 맞는 기본 Stage_Task 체크리스트를 함께 생성해야 합니다
4. WHEN 문의접수 단계가 생성되면 THEN THE System SHALL "고객 정보 확인", "문의 내용 기록", "시험 가능 여부 검토" 태스크를 생성해야 합니다
5. WHEN 검토중 단계가 생성되면 THEN THE System SHALL "시험 가능 여부 판단", "담당자 배정", "예상 일정 산정" 태스크를 생성해야 합니다
6. WHEN 견적발송 단계가 생성되면 THEN THE System SHALL "견적서 작성", "견적서 발송", "고객 회신 대기" 태스크를 생성해야 합니다
7. WHEN 계약협의 단계가 생성되면 THEN THE System SHALL "계약 조건 협의", "지급 조건 확정", "계약서 초안 작성" 태스크를 생성해야 합니다
8. WHEN 시험접수 단계가 생성되면 THEN THE System SHALL "시험의뢰서 접수", "상담기록지 작성", "PM팀 접수 요청", "시험번호 발행" 태스크를 생성해야 합니다
9. WHEN 시험진행 단계가 생성되면 THEN THE System SHALL "시험 시작", "중간 보고", "시험 완료" 태스크를 생성해야 합니다
10. WHEN 완료 단계가 생성되면 THEN THE System SHALL "최종 보고서 발행", "정산 완료", "고객 피드백 수집" 태스크를 생성해야 합니다

### 요구사항 2: 미진행 사유 관리 기능

**사용자 스토리:** 영업 담당자로서, 견적 발송 후 미진행된 건에 대해 사유를 기록하고 분석할 수 있어야 합니다. 이를 통해 영업 실패 원인을 파악하고 개선할 수 있습니다.

#### 인수 조건

1. THE System SHALL Lead 모델에 lostReason 필드와 lostReasonDetail 필드를 제공해야 합니다
2. THE System SHALL 다음 미진행 사유 옵션을 제공해야 합니다: 예산편성용(BUDGET_PLANNING), 타사결정(COMPETITOR_SELECTED), 가격문제(PRICE_ISSUE), 일정문제(SCHEDULE_ISSUE), 대기중(ON_HOLD), 기타(OTHER)
3. WHEN 리드의 status가 LOST로 변경되면 THEN THE System SHALL lostReason 필드 입력을 필수로 요구해야 합니다
4. WHEN lostReason이 OTHER로 선택되면 THEN THE System SHALL lostReasonDetail 필드 입력을 필수로 요구해야 합니다
5. WHEN 견적서 상태가 REJECTED로 변경되면 THEN THE System SHALL 연결된 리드의 lostReason 입력 다이얼로그를 표시해야 합니다
6. WHEN 미진행 사유가 기록되면 THEN THE System SHALL LeadActivity 테이블에 type이 "LOST_REASON"인 활동 기록을 생성해야 합니다
7. THE System SHALL 미진행 사유별 통계를 조회할 수 있는 API를 제공해야 합니다

### 요구사항 3: 시험 접수 정보 확장

**사용자 스토리:** PM팀 담당자로서, 시험 접수 시 필요한 모든 정보(물질코드, 프로젝트코드, 시험번호)를 체계적으로 관리할 수 있어야 합니다.

#### 인수 조건

1. THE Test_Reception SHALL 다음 필드를 포함해야 합니다: substanceCode(물질코드), projectCode(프로젝트코드), testNumber(시험번호), testTitle(시험제목), testDirector(시험책임자)
2. WHEN 시험 접수가 생성되면 THEN THE System SHALL substanceCode, projectCode 필드를 필수로 요구해야 합니다
3. WHEN PM팀에서 시험번호를 발행하면 THEN THE System SHALL testNumber 필드를 업데이트하고 발행일시를 기록해야 합니다
4. THE System SHALL Test_Reception과 Consultation_Record를 연결하는 관계를 제공해야 합니다
5. WHEN 시험 접수가 생성되면 THEN THE System SHALL 연결된 상담기록지(Consultation_Record)를 함께 조회할 수 있어야 합니다
6. THE Consultation_Record SHALL 표준화된 양식 필드를 포함해야 합니다: customerInfo(고객사 정보), testInfo(시험 정보), substanceInfo(물질 정보), clientRequests(의뢰자 요청사항), internalNotes(내부 메모)
7. WHEN 시험번호가 발행되면 THEN THE System SHALL 연결된 Lead의 파이프라인 단계를 "시험접수(TEST_RECEPTION)"로 자동 업데이트해야 합니다

### 요구사항 4: 계약서 지급조건 유연화

**사용자 스토리:** 영업 담당자로서, 다양한 지급 조건(일괄지급, 분할지급, 시험번호별 지급)을 계약서에 반영할 수 있어야 합니다.

#### 인수 조건

1. THE Contract SHALL paymentType 필드를 포함해야 합니다: FULL(일괄지급), INSTALLMENT(분할지급-선금/잔금), PER_TEST(시험번호별 지급)
2. WHEN paymentType이 INSTALLMENT인 경우 THEN THE System SHALL advancePaymentRate(선금 비율), advancePaymentAmount(선금 금액), balancePaymentAmount(잔금 금액) 필드를 제공해야 합니다
3. WHEN paymentType이 PER_TEST인 경우 THEN THE System SHALL Payment_Schedule 모델을 통해 시험번호별 금액과 지급 일정을 관리해야 합니다
4. THE Payment_Schedule SHALL 다음 필드를 포함해야 합니다: contractId(계약 ID), testReceptionId(시험접수 ID), testNumber(시험번호), amount(금액), scheduledDate(예정일), paidDate(지급일), status(상태)
5. WHEN 계약서가 생성되면 THEN THE System SHALL 연결된 견적서의 금액 정보를 기반으로 totalAmount를 자동 계산해야 합니다
6. WHEN Payment_Schedule의 status가 PAID로 변경되면 THEN THE System SHALL Contract의 paidAmount를 자동으로 업데이트해야 합니다
7. THE System SHALL 계약서별 지급 현황(총액, 지급완료액, 잔액)을 조회할 수 있는 API를 제공해야 합니다
8. WHEN 모든 Payment_Schedule이 PAID 상태가 되면 THEN THE System SHALL Contract의 status를 COMPLETED로 자동 변경해야 합니다

### 요구사항 5: 워크플로우 자동화 연동

**사용자 스토리:** 시스템 관리자로서, 각 단계 전환 시 자동화된 작업이 수행되어 수동 작업을 최소화할 수 있어야 합니다.

#### 인수 조건

1. WHEN 리드의 파이프라인 단계가 변경되면 THEN THE System SHALL 해당 단계의 Stage_Task 체크리스트를 자동으로 생성해야 합니다
2. WHEN 견적서 상태가 SENT로 변경되면 THEN THE System SHALL 연결된 리드의 단계를 "견적발송(QUOTATION_SENT)"으로 자동 업데이트해야 합니다
3. WHEN 계약서 상태가 SIGNED로 변경되면 THEN THE System SHALL 연결된 리드의 단계를 "계약협의(NEGOTIATION)" 완료로 표시하고 "시험접수(TEST_RECEPTION)" 단계로 이동해야 합니다
4. WHEN 시험번호가 발행되면 THEN THE System SHALL 연결된 리드의 단계를 "시험진행(IN_PROGRESS)"으로 자동 업데이트해야 합니다
5. WHEN Study의 status가 COMPLETED로 변경되면 THEN THE System SHALL 연결된 리드의 단계를 "완료(COMPLETED)"로 자동 업데이트해야 합니다
6. WHEN 파이프라인 단계가 자동 변경되면 THEN THE System SHALL LeadActivity 테이블에 type이 "STAGE_CHANGE"인 활동 기록을 생성해야 합니다

