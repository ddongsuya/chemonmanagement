# Implementation Plan: Unified Customer Management

## Overview

고객사 관리 페이지에서 리드(Lead)와 고객(Customer)을 통합하여 표시하는 기능을 구현합니다. 백엔드 API 개발 → 프론트엔드 컴포넌트 개발 → 기존 페이지 수정 순서로 진행합니다.

## Tasks

- [x] 1. 백엔드 통합 API 개발
  - [x] 1.1 UnifiedEntity 타입 및 인터페이스 정의
    - `backend/src/types/unifiedCustomer.ts` 파일 생성
    - UnifiedEntity, UnifiedCustomerFilters, UnifiedCustomerResponse 인터페이스 정의
    - EntityType 타입 정의 ('LEAD' | 'CUSTOMER')
    - _Requirements: 1.1, 1.2, 6.2, 6.6_
  
  - [x] 1.2 UnifiedCustomerService 구현
    - `backend/src/services/unifiedCustomerService.ts` 파일 생성
    - mapLeadToUnifiedEntity 함수 구현 (리드 → UnifiedEntity 변환)
    - mapCustomerToUnifiedEntity 함수 구현 (고객 → UnifiedEntity 변환)
    - getUnifiedCustomers 메서드 구현 (통합 조회, 필터링, 정렬)
    - 통계 계산 로직 구현 (totalCount, leadCount, customerCount, stageDistribution)
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 7.1, 7.2, 7.3_
  
  - [x] 1.3 UnifiedCustomerService 속성 테스트 작성
    - **Property 1: 통합 데이터 반환 일관성**
    - **Property 2: 엔티티 필수 필드 포함**
    - **Property 3: 정렬 순서 일관성**
    - **Property 4: 파이프라인 단계 표시 정확성**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 6.2, 6.6**
  
  - [x] 1.4 통합 API 라우트 구현
    - `backend/src/routes/unifiedCustomers.ts` 파일 생성
    - GET /api/unified-customers 엔드포인트 구현
    - type, stageId, search, page, limit 쿼리 파라미터 처리
    - 인증 미들웨어 적용
    - _Requirements: 6.1, 6.3, 6.4, 6.5_
  
  - [x] 1.5 API 필터링 속성 테스트 작성
    - **Property 5: 단계 필터링 정확성**
    - **Property 6: 유형 필터링 정확성**
    - **Property 7: 복합 필터 교집합**
    - **Property 8: 검색 필터 정확성**
    - **Property 9: 통계 정확성**
    - **Validates: Requirements 3.2, 3.3, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4**

- [x] 2. Checkpoint - 백엔드 테스트 확인
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. 프론트엔드 API 클라이언트 및 타입 정의
  - [x] 3.1 프론트엔드 타입 정의
    - `chemon-quotation/types/unified-customer.ts` 파일 생성
    - UnifiedEntity, UnifiedCustomerFilters, UnifiedCustomerResponse 타입 정의
    - _Requirements: 1.2, 6.6_
  
  - [x] 3.2 API 클라이언트 함수 구현
    - `chemon-quotation/lib/unified-customer-api.ts` 파일 생성
    - getUnifiedCustomers 함수 구현
    - _Requirements: 6.1_

- [x] 4. 프론트엔드 컴포넌트 개발
  - [x] 4.1 UnifiedCustomerCard 컴포넌트 구현
    - `chemon-quotation/components/customer/UnifiedCustomerCard.tsx` 파일 생성
    - 엔티티 유형 배지 표시 (리드/고객)
    - 파이프라인 단계 배지 표시 (색상 포함)
    - 회사명, 담당자, 연락처 정보 표시
    - 클릭 이벤트 핸들러 (상세 페이지 이동)
    - _Requirements: 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 8.1, 8.2_
  
  - [x] 4.2 UnifiedCustomerFilters 컴포넌트 구현
    - `chemon-quotation/components/customer/UnifiedCustomerFilters.tsx` 파일 생성
    - 유형 필터 (전체/리드/고객) 구현
    - 파이프라인 단계 필터 구현 (PipelineStage 데이터 기반)
    - 검색 입력 필드 구현
    - 필터 변경 시 콜백 호출
    - _Requirements: 3.1, 4.1, 5.1_
  
  - [x] 4.3 UnifiedCustomerStats 컴포넌트 구현
    - `chemon-quotation/components/customer/UnifiedCustomerStats.tsx` 파일 생성
    - 총 항목 수, 리드 수, 고객 수 카드 표시
    - 로딩 상태 스켈레톤 표시
    - _Requirements: 7.1, 7.2_

- [x] 5. 고객사 관리 페이지 수정
  - [x] 5.1 기존 customers/page.tsx 수정
    - 통합 API 호출로 변경 (getUnifiedCustomers)
    - UnifiedCustomerFilters 컴포넌트 적용
    - UnifiedCustomerCard 컴포넌트로 목록 렌더링
    - UnifiedCustomerStats 컴포넌트 적용
    - URL 쿼리 파라미터와 필터 상태 동기화
    - _Requirements: 1.1, 3.4, 3.5, 8.3_
  
  - [x] 5.2 네비게이션 로직 구현
    - 리드 클릭 시 /leads/{id} 페이지로 이동
    - 고객 클릭 시 상세 모달 또는 페이지 표시
    - 뒤로가기 시 필터 상태 유지
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 6. Checkpoint - 통합 테스트
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. 마무리 및 정리
  - [x] 7.1 API 라우트 등록
    - `backend/src/index.ts`에 unifiedCustomers 라우트 등록
    - _Requirements: 6.1_
  
  - [ ]* 7.2 E2E 테스트 작성 (선택)
    - 페이지 로딩 및 데이터 표시 테스트
    - 필터 적용 테스트
    - 검색 기능 테스트
    - _Requirements: 1.1, 3.2, 5.1_

- [x] 8. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- 기존 Lead, Customer, PipelineStage 모델을 그대로 활용하며 새로운 테이블 생성 없음
- 프론트엔드는 TypeScript + React + Next.js 사용
- 백엔드는 Express.js + Prisma ORM 사용
- 속성 기반 테스트는 fast-check 라이브러리 사용
