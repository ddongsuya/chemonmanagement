# Implementation Plan: CRM Workflow Enhancement

## Overview

CHEMON CRM 워크플로우를 실제 업무 프로세스에 맞게 개선하는 기능을 구현합니다. 파이프라인 단계 재정의, 미진행 사유 관리, 시험 접수 정보 확장, 계약서 지급조건 유연화 기능을 순차적으로 구현합니다.

## Tasks

- [x] 1. 데이터베이스 스키마 확장
  - [x] 1.1 Lead 모델에 미진행 사유 필드 추가
    - lostReason (String), lostReasonDetail (String), lostAt (DateTime) 필드 추가
    - Prisma 마이그레이션 생성 및 적용
    - _Requirements: 2.1_
  
  - [x] 1.2 Contract 모델에 지급조건 필드 추가
    - paymentType, advancePaymentRate, advancePaymentAmount, balancePaymentAmount 필드 추가
    - Prisma 마이그레이션 생성 및 적용
    - _Requirements: 4.1, 4.2_
  
  - [x] 1.3 PaymentSchedule 모델 생성
    - contractId, testReceptionId, testNumber, amount, scheduledDate, paidDate, status, notes 필드 정의
    - Contract와의 관계 설정
    - Prisma 마이그레이션 생성 및 적용
    - _Requirements: 4.3, 4.4_
  
  - [x] 1.4 TestReception 모델에 시험번호 발행 정보 필드 추가
    - testNumberIssuedAt, testNumberIssuedBy 필드 추가
    - Prisma 마이그레이션 생성 및 적용
    - _Requirements: 3.3_

- [x] 2. Checkpoint - 스키마 마이그레이션 확인
  - Ensure all migrations are applied successfully, ask the user if questions arise.

- [x] 3. 파이프라인 초기화 서비스 구현
  - [x] 3.1 PipelineInitializationService 생성
    - backend/src/services/pipelineInitializationService.ts 파일 생성
    - DEFAULT_STAGES 상수 정의 (7개 단계)
    - initializeDefaultStages() 메서드 구현
    - getDefaultTasksForStage() 메서드 구현 (단계별 기본 태스크 반환)
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 3.2 단계별 기본 태스크 정의
    - 문의접수: 고객 정보 확인, 문의 내용 기록, 시험 가능 여부 검토
    - 검토중: 시험 가능 여부 판단, 담당자 배정, 예상 일정 산정
    - 견적발송: 견적서 작성, 견적서 발송, 고객 회신 대기
    - 계약협의: 계약 조건 협의, 지급 조건 확정, 계약서 초안 작성
    - 시험접수: 시험의뢰서 접수, 상담기록지 작성, PM팀 접수 요청, 시험번호 발행
    - 시험진행: 시험 시작, 중간 보고, 시험 완료
    - 완료: 최종 보고서 발행, 정산 완료, 고객 피드백 수집
    - _Requirements: 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_
  
  - [x] 3.3 Property test: 파이프라인 초기화 무결성
    - **Property 1: 파이프라인 초기화 무결성**
    - 7개 단계 생성, 연속적인 order 값, 각 단계별 태스크 존재 검증
    - **Validates: Requirements 1.2, 1.3**
  
  - [x] 3.4 파이프라인 초기화 API 엔드포인트 추가
    - POST /api/pipeline-stages/initialize 엔드포인트 구현
    - 이미 초기화된 경우 처리 로직 추가
    - _Requirements: 1.2_

- [x] 4. 미진행 사유 관리 기능 구현
  - [x] 4.1 LostReason 타입 및 상수 정의
    - backend/src/types/lostReason.ts 파일 생성
    - LostReason enum 정의 (BUDGET_PLANNING, COMPETITOR_SELECTED, PRICE_ISSUE, SCHEDULE_ISSUE, ON_HOLD, OTHER)
    - lostReasonLabels 상수 정의
    - _Requirements: 2.2_
  
  - [x] 4.2 Lead API에 미진행 사유 기록 엔드포인트 추가
    - PUT /api/leads/:id/lost 엔드포인트 구현
    - lostReason 필수 검증 로직 추가
    - OTHER 선택 시 lostReasonDetail 필수 검증 로직 추가
    - LeadActivity 생성 로직 추가 (type: "LOST_REASON")
    - _Requirements: 2.3, 2.4, 2.6_
  
  - [x] 4.3 Property test: 미진행 사유 유효성 검사
    - **Property 2: 미진행 사유 유효성 검사**
    - LOST 상태 변경 시 lostReason 필수, OTHER 시 lostReasonDetail 필수 검증
    - **Validates: Requirements 2.3, 2.4**
  
  - [x] 4.4 미진행 사유 통계 API 구현
    - GET /api/leads/lost-reason-stats 엔드포인트 구현
    - 기간별, 사유별 통계 집계 로직 구현
    - _Requirements: 2.7_

- [x] 5. Checkpoint - 파이프라인 및 미진행 사유 기능 확인
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. 시험 접수 정보 확장 구현
  - [x] 6.1 TestReception API 확장
    - POST /api/test-receptions 엔드포인트에 substanceCode, projectCode 필수 검증 추가
    - PUT /api/test-receptions/:id/issue-test-number 엔드포인트 구현
    - testNumberIssuedAt, testNumberIssuedBy 자동 기록 로직 추가
    - _Requirements: 3.2, 3.3_
  
  - [x] 6.2 Property test: 시험 접수 필수 필드 검증
    - **Property 4: 시험 접수 필수 필드 검증**
    - substanceCode, projectCode 누락 시 요청 거부 검증
    - **Validates: Requirements 3.2**
  
  - [x] 6.3 Property test: 시험번호 발행 데이터 무결성
    - **Property 5: 시험번호 발행 데이터 무결성**
    - 시험번호 발행 시 필드 업데이트 및 리드 단계 변경 검증
    - **Validates: Requirements 3.3, 3.7**
  
  - [x] 6.4 시험 접수-상담기록 연동 API 구현
    - GET /api/test-receptions/:id/with-consultation 엔드포인트 구현
    - ConsultationRecord 조인 쿼리 구현
    - _Requirements: 3.4, 3.5_
  
  - [x] 6.5 Property test: 시험 접수-상담기록 연동
    - **Property 6: 시험 접수-상담기록 연동**
    - withConsultation 옵션 시 상담기록 포함 검증
    - **Validates: Requirements 3.5**

- [x] 7. 계약서 지급조건 유연화 구현
  - [x] 7.1 PaymentScheduleService 생성
    - backend/src/services/paymentScheduleService.ts 파일 생성
    - createSchedules() 메서드 구현
    - updateScheduleStatus() 메서드 구현
    - getContractPaymentSummary() 메서드 구현
    - checkAndUpdateContractStatus() 메서드 구현
    - _Requirements: 4.3, 4.6, 4.7, 4.8_
  
  - [x] 7.2 Contract API에 지급조건 설정 엔드포인트 추가
    - PUT /api/contracts/:id/payment-settings 엔드포인트 구현
    - paymentType별 필드 검증 로직 추가
    - 견적서 금액 기반 totalAmount 자동 계산 로직 추가
    - _Requirements: 4.2, 4.5_
  
  - [x] 7.3 Property test: 계약 금액 자동 계산
    - **Property 7: 계약 금액 자동 계산**
    - 연결된 견적서 금액 합계와 계약 금액 일치 검증
    - **Validates: Requirements 4.5**
  
  - [x] 7.4 PaymentSchedule API 구현
    - POST /api/payment-schedules 엔드포인트 구현
    - PUT /api/payment-schedules/:id/status 엔드포인트 구현
    - GET /api/payment-schedules/by-contract/:contractId 엔드포인트 구현
    - _Requirements: 4.3, 4.6, 4.7_
  
  - [x] 7.5 Property test: 지급 일정 합계 일관성
    - **Property 8: 지급 일정 합계 일관성**
    - PAID 상태 변경 시 paidAmount 자동 업데이트 검증
    - **Validates: Requirements 4.6**
  
  - [x] 7.6 Property test: 계약 완료 자동 전환
    - **Property 9: 계약 완료 자동 전환**
    - 모든 PaymentSchedule PAID 시 계약 COMPLETED 전환 검증
    - **Validates: Requirements 4.8**
  
  - [x] 7.7 Property test: PER_TEST 지급 유형 일관성
    - **Property 10: PER_TEST 지급 유형 일관성**
    - PER_TEST 계약의 PaymentSchedule 합계 검증
    - **Validates: Requirements 4.3**

- [x] 8. Checkpoint - 시험 접수 및 지급조건 기능 확인
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. 워크플로우 자동화 서비스 확장
  - [x] 9.1 WorkflowAutomationService 확장
    - onQuotationStatusChange() 메서드 확장 (SENT → QUOTATION_SENT 단계)
    - onContractStatusChange() 메서드 확장 (SIGNED → TEST_RECEPTION 단계)
    - onTestNumberIssued() 메서드 구현 (IN_PROGRESS 단계)
    - onStudyCompleted() 메서드 구현 (COMPLETED 단계)
    - createStageChangeActivity() 메서드 구현
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [x] 9.2 Property test: 워크플로우 자동화 일관성
    - **Property 11: 워크플로우 자동화 일관성**
    - 각 이벤트별 리드 단계 자동 변경 검증
    - **Validates: Requirements 5.2, 5.3, 5.5**
  
  - [x] 9.3 단계 변경 시 태스크 자동 생성 로직 구현
    - updateLeadStage() 메서드에 태스크 생성 로직 추가
    - LeadTaskCompletion 레코드 생성 로직 구현
    - _Requirements: 5.1_
  
  - [x] 9.4 Property test: 단계 변경 시 태스크 자동 생성
    - **Property 12: 단계 변경 시 태스크 자동 생성**
    - 단계 변경 시 해당 단계 태스크 생성 검증
    - **Validates: Requirements 5.1**
  
  - [x] 9.5 Property test: 활동 로그 생성 일관성
    - **Property 3: 활동 로그 생성 일관성**
    - 상태/단계 변경 시 LeadActivity 생성 검증
    - **Validates: Requirements 2.6, 5.6**

- [x] 10. Checkpoint - 워크플로우 자동화 기능 확인
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. 프론트엔드 컴포넌트 구현
  - [x] 11.1 LostReasonDialog 컴포넌트 구현
    - chemon-quotation/components/lead/LostReasonDialog.tsx 파일 생성
    - 미진행 사유 선택 드롭다운 구현
    - OTHER 선택 시 상세 사유 입력 필드 표시
    - 유효성 검사 및 제출 로직 구현
    - _Requirements: 2.3, 2.4, 2.5_
  
  - [x] 11.2 TestReceptionForm 컴포넌트 확장
    - substanceCode, projectCode 필수 필드 표시 및 검증 추가
    - 시험번호 발행 버튼 및 로직 추가
    - 상담기록 연동 UI 추가
    - _Requirements: 3.2, 3.3, 3.5_
  
  - [x] 11.3 ContractPaymentForm 컴포넌트 구현
    - chemon-quotation/components/contract/ContractPaymentForm.tsx 파일 생성
    - paymentType 선택 UI 구현
    - INSTALLMENT 타입: 선금/잔금 입력 필드
    - PER_TEST 타입: PaymentSchedule 입력 테이블
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 11.4 PaymentScheduleTable 컴포넌트 구현
    - chemon-quotation/components/contract/PaymentScheduleTable.tsx 파일 생성
    - 시험번호별 지급 일정 테이블 구현
    - 상태 변경 버튼 및 로직 구현
    - 지급 현황 요약 표시
    - _Requirements: 4.6, 4.7_
  
  - [x] 11.5 LostReasonStats 컴포넌트 구현
    - chemon-quotation/components/analytics/LostReasonStats.tsx 파일 생성
    - 미진행 사유별 통계 차트 구현
    - 기간 필터 UI 구현
    - _Requirements: 2.7_

- [x] 12. 프론트엔드 페이지 통합
  - [x] 12.1 견적서 상태 변경 시 미진행 사유 다이얼로그 연동
    - 견적서 REJECTED 상태 변경 시 LostReasonDialog 표시
    - 리드 연결 확인 및 사유 저장 로직 구현
    - _Requirements: 2.5_
  
  - [x] 12.2 계약서 상세 페이지에 지급조건 섹션 추가
    - ContractPaymentForm 통합
    - PaymentScheduleTable 통합
    - 지급 현황 요약 표시
    - _Requirements: 4.1, 4.7_
  
  - [x] 12.3 시험 접수 페이지 확장
    - TestReceptionForm 확장 내용 적용
    - 상담기록 연동 UI 적용
    - _Requirements: 3.2, 3.5_

- [x] 13. Final Checkpoint - 전체 기능 통합 테스트
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- 기존 unified-crm-flow 스펙과의 통합을 고려하여 구현
