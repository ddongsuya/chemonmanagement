# Implementation Plan: Unified CRM Flow Integration

## Overview

리드(Lead)와 고객(Customer) 관리를 통합된 CRM 플로우로 연결하는 기능을 구현합니다. 견적서 작성 시 고객/리드 선택 통합, 파이프라인 자동화, 리드-고객 전환, 고객 목록 상태 표시 기능을 포함합니다.

## Tasks

- [x] 1. 백엔드 API 확장 및 서비스 구현
  - [x] 1.1 Customer API에 grade 필터 파라미터 추가
    - `backend/src/services/dataService.ts`의 `getCustomers` 메서드에 grade 필터 추가
    - `backend/src/routes/customers.ts`에 grade 쿼리 파라미터 처리 추가
    - Customer 응답에 연결된 Lead 정보(source) 포함
    - _Requirements: 4.3, 4.4, 4.5_
  
  - [x]* 1.2 Customer grade 필터링 속성 테스트 작성
    - **Property 1: 고객/리드 필터링 일관성**
    - **Validates: Requirements 1.2, 1.3, 4.3, 4.5**
    - _Test file: `backend/__tests__/property/crm-integration.property.test.ts`_
  
  - [x] 1.3 Lead API에 excludeConverted 필터 추가
    - `backend/src/services/leadService.ts`의 `getLeads` 메서드에 excludeConverted 필터 추가
    - `backend/src/routes/leads.ts`에 excludeConverted 쿼리 파라미터 처리 추가
    - _Requirements: 1.3_
  
  - [x] 1.4 Quotation 모델에 leadId 연결 지원 추가
    - `backend/src/services/dataService.ts`의 `createQuotation`, `updateQuotation`에 leadId 처리 추가
    - Quotation 생성/수정 시 Lead 연결 로직 구현
    - _Requirements: 1.6_

- [x] 2. 파이프라인 자동화 서비스 구현
  - [x] 2.1 PipelineAutomationService 생성
    - `backend/src/services/pipelineAutomationService.ts` 파일 생성
    - `onQuotationStatusChange` 메서드 구현: 견적서 SENT 시 리드 상태 PROPOSAL로 업데이트
    - 상태 진행 순서 검증 로직 구현 (PROPOSAL 이전 단계만 업데이트)
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x]* 2.2 파이프라인 자동 업데이트 속성 테스트 작성
    - **Property 4: 견적서 발송 시 파이프라인 자동 업데이트**
    - **Validates: Requirements 2.1, 2.2, 2.3**
    - _Test file: `backend/__tests__/property/crm-integration.property.test.ts`_
  
  - [x] 2.3 LeadActivity 자동 생성 로직 구현
    - 파이프라인 단계 변경 시 LeadActivity 레코드 생성
    - type: "STATUS_CHANGE" 활동 기록
    - _Requirements: 2.4_
  
  - [x]* 2.4 활동 기록 생성 속성 테스트 작성
    - **Property 5: 파이프라인 변경 시 활동 기록 생성**
    - **Validates: Requirements 2.4**
    - _Test file: `backend/__tests__/property/crm-integration.property.test.ts`_
  
  - [x] 2.5 Quotation 상태 변경 API에 자동화 트리거 연결
    - `backend/src/routes/quotations.ts`의 상태 변경 엔드포인트에서 PipelineAutomationService 호출
    - _Requirements: 2.1_

- [x] 3. Checkpoint - 백엔드 API 및 자동화 테스트
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. 리드-고객 전환 서비스 구현
  - [x] 4.1 LeadConversionService 생성
    - `backend/src/services/leadConversionService.ts` 파일 생성
    - `convertLeadToCustomer` 메서드 구현
    - Lead 정보를 Customer로 복사하는 로직 구현
    - _Requirements: 3.2, 3.3, 3.4_
  
  - [x]* 4.2 리드-고객 전환 데이터 무결성 속성 테스트 작성
    - **Property 6: 리드-고객 전환 데이터 무결성**
    - **Validates: Requirements 3.2, 3.3, 3.4**
    - _Test file: `backend/__tests__/property/lead-conversion.property.test.ts`_
  
  - [x] 4.3 전환 시 연결된 견적서 업데이트 로직 구현
    - 리드에 연결된 모든 Quotation의 customerId 업데이트
    - 트랜잭션으로 원자성 보장
    - _Requirements: 3.5_
  
  - [x]* 4.4 견적서 연결 업데이트 속성 테스트 작성
    - **Property 7: 전환 시 견적서 연결 업데이트**
    - **Validates: Requirements 3.5**
    - _Test file: `backend/__tests__/property/lead-conversion.property.test.ts`_
  
  - [x] 4.5 중복 고객 생성 방지 로직 구현
    - 리드에 이미 customerId가 있는 경우 기존 Customer 업데이트
    - _Requirements: 3.6_
  
  - [x]* 4.6 중복 고객 생성 방지 속성 테스트 작성
    - **Property 8: 중복 고객 생성 방지**
    - **Validates: Requirements 3.6**
    - _Test file: `backend/__tests__/property/lead-conversion.property.test.ts`_
  
  - [x] 4.7 Contract 상태 변경 시 자동 전환 트리거 연결
    - `backend/src/routes/contracts.ts`에서 SIGNED 상태 변경 시 LeadConversionService 호출
    - _Requirements: 3.1_

- [x] 5. 리드-고객 데이터 동기화 서비스 구현
  - [x] 5.1 DataSyncService 생성
    - `backend/src/services/dataSyncService.ts` 파일 생성
    - `syncLeadToCustomer`, `syncCustomerToLead` 메서드 구현
    - _Requirements: 5.1, 5.2_
  
  - [x]* 5.2 양방향 동기화 속성 테스트 작성
    - **Property 10: 리드-고객 양방향 동기화**
    - **Validates: Requirements 5.1, 5.2**
    - _Test file: `backend/__tests__/property/lead-conversion.property.test.ts`_
  
  - [x] 5.3 동기화 로그 기록 구현
    - ActivityLog에 action: "SYNC" 레코드 생성
    - _Requirements: 5.3_
  
  - [x] 5.4 동기화 충돌 해결 로직 구현
    - updatedAt 비교하여 최신 데이터 우선 적용
    - 충돌 내역 로그 기록
    - _Requirements: 5.4_
  
  - [x] 5.5 Lead/Customer 업데이트 API에 동기화 트리거 연결
    - Lead 업데이트 시 연결된 Customer 동기화
    - Customer 업데이트 시 연결된 Lead 동기화
    - _Requirements: 5.1, 5.2_

- [x] 6. Checkpoint - 백엔드 전환 및 동기화 테스트
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. 프론트엔드 타입 및 API 확장
  - [x] 7.1 프론트엔드 타입 정의 확장
    - `chemon-quotation/lib/data-api.ts`에 CustomerGrade 타입 추가
    - CustomerFilters에 grade 필터 추가
    - Customer 타입에 grade, linkedLead 필드 추가
    - _Requirements: 4.1, 4.2_
  
  - [x] 7.2 Lead API 타입 확장
    - `chemon-quotation/lib/lead-api.ts`의 getLeads 파라미터에 excludeConverted 추가
    - _Requirements: 1.3_

- [x] 8. CustomerSelector 컴포넌트 구현
  - [x] 8.1 CustomerSelector 컴포넌트 생성
    - `chemon-quotation/components/quotation/CustomerSelector.tsx` 파일 생성
    - "기존 고객", "리드 목록" 탭 UI 구현
    - 탭 전환 및 목록 로딩 로직 구현
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 8.2 리드 선택 시 데이터 자동 채우기 구현
    - 리드 선택 시 견적서 폼에 companyName, contactName, contactEmail, contactPhone 자동 입력
    - _Requirements: 1.4_
  
  - [x]* 8.3 리드 선택 데이터 매핑 속성 테스트 작성
    - **Property 2: 리드 선택 시 데이터 매핑 정확성**
    - **Validates: Requirements 1.4**
    - _Test file: `chemon-quotation/__tests__/crm-integration.property.test.ts`_

- [x] 9. DetailedCustomerForm 컴포넌트 구현
  - [x] 9.1 DetailedCustomerForm 컴포넌트 생성
    - `chemon-quotation/components/quotation/DetailedCustomerForm.tsx` 파일 생성
    - Lead 등록 폼과 동일한 필드 구현 (회사명, 담당자명, 직책, 부서, 연락처, 이메일, 유입경로, 문의유형, 예상금액, 예상계약일)
    - _Requirements: 1.5_
  
  - [x] 9.2 신규 고객 폼 제출 시 리드 생성 및 견적서 연결 구현
    - 폼 제출 시 Lead API 호출하여 리드 생성
    - 생성된 리드를 견적서에 연결
    - _Requirements: 1.6_
  
  - [x]* 9.3 신규 리드 생성 및 연결 속성 테스트 작성
    - **Property 3: 신규 리드 생성 및 견적서 연결**
    - **Validates: Requirements 1.6**
    - _Test file: `chemon-quotation/__tests__/crm-integration.property.test.ts`_

- [x] 10. StepBasicInfo 컴포넌트 수정
  - [x] 10.1 기존 고객 선택 UI를 CustomerSelector로 교체
    - `chemon-quotation/components/quotation/StepBasicInfo.tsx` 수정
    - 기존 고객 선택 드롭다운을 CustomerSelector 컴포넌트로 교체
    - _Requirements: 1.1_
  
  - [x] 10.2 신규 고객 등록 다이얼로그를 DetailedCustomerForm으로 교체
    - 기존 간단한 고객 등록 폼을 DetailedCustomerForm으로 교체
    - _Requirements: 1.5_

- [x] 11. Checkpoint - 견적서 고객 선택 통합 테스트
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. 고객 목록 상태 표시 구현
  - [x] 12.1 CustomerGradeBadge 컴포넌트 생성
    - `chemon-quotation/components/customer/CustomerGradeBadge.tsx` 파일 생성
    - grade별 배지 스타일 구현 (LEAD: 회색, PROSPECT: 파랑, CUSTOMER: 초록, VIP: 보라, INACTIVE: 빨강)
    - _Requirements: 4.1_
  
  - [x] 12.2 CustomerCard 컴포넌트에 grade 배지 추가
    - `chemon-quotation/components/customer/CustomerCard.tsx` 수정
    - CustomerGradeBadge 컴포넌트 추가
    - 연결된 리드의 source 정보 표시
    - _Requirements: 4.1, 4.4_
  
  - [x]* 12.3 고객 카드 리드 정보 표시 속성 테스트 작성
    - **Property 9: 고객 카드 리드 정보 표시**
    - **Validates: Requirements 4.4**
    - _Test file: `chemon-quotation/__tests__/crm-integration.property.test.ts`_

- [x] 13. 고객 목록 필터링 구현
  - [x] 13.1 고객 목록 페이지에 상태 필터 드롭다운 추가
    - `chemon-quotation/app/(dashboard)/customers/page.tsx` 수정
    - grade 필터 드롭다운 UI 추가 (전체, 리드, 잠재고객, 고객, VIP, 비활성)
    - _Requirements: 4.2_
  
  - [x] 13.2 필터 선택 시 API 호출 및 목록 갱신 구현
    - grade 파라미터로 API 호출
    - 필터링된 결과 표시
    - _Requirements: 4.3_

- [x] 14. Final Checkpoint - 전체 통합 테스트
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- 프론트엔드는 Next.js + React + TypeScript, 백엔드는 Express.js + Prisma ORM 사용
