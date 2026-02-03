# 구현 계획: Unified Quotation Code System

## 개요

통합 견적서 코드 시스템을 구현합니다. 모든 시험 유형(독성, 효력, 임상병리)에서 동일한 견적서 번호 체계를 사용하고, 리드 번호도 사용자 설정 견적서 코드를 따르도록 개선합니다.

## Tasks

- [x] 1. 백엔드 서비스 구현
  - [x] 1.1 UserCodeValidator 서비스 구현
    - `backend/src/services/userCodeValidator.ts` 파일 생성
    - validateUniqueness, normalizeCode, isValidFormat 메서드 구현
    - 대소문자 무시 중복 검사 로직 구현
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6_
  
  - [x] 1.2 UserCodeValidator 속성 테스트 작성
    - **Property 6: 코드 중복 검사 정확성**
    - **Property 7: 코드 정규화**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.5, 4.6**
  
  - [x] 1.3 QuotationNumberService 확장
    - `backend/src/services/dataService.ts` 수정
    - 모든 시험 유형에서 동일한 번호 생성 로직 사용
    - 시험 유형 파라미터 추가
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 1.4 QuotationNumberService 속성 테스트 작성
    - **Property 1: 견적서 번호 형식 일관성**
    - **Property 2: 견적서 일련번호 순차 증가**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
  
  - [x] 1.5 LeadNumberService 구현
    - `backend/src/services/leadNumberService.ts` 파일 생성
    - 사용자 코드 기반 리드 번호 생성 (UC-YYYY-NNNN 형식)
    - 기존 LD- 접두사 대신 사용자 코드 사용
    - _Requirements: 3.1, 3.3_
  
  - [x] 1.6 LeadNumberService 속성 테스트 작성
    - **Property 4: 리드 번호 형식 및 시퀀스**
    - **Validates: Requirements 3.1, 3.3**

- [x] 2. Checkpoint - 백엔드 서비스 테스트 확인
  - 모든 테스트가 통과하는지 확인, 문제 발생 시 사용자에게 질문

- [x] 3. 백엔드 API 엔드포인트 구현
  - [x] 3.1 User Code 검증 API 구현
    - `POST /api/user-code/validate` 엔드포인트 추가
    - 중복 검사 및 형식 검증 응답 반환
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 3.2 User Code 저장 API 확장
    - `PUT /api/user-settings/user-code` 엔드포인트 수정
    - 저장 전 중복 검사 수행
    - 대문자 정규화 후 저장
    - _Requirements: 4.5, 4.6_
  
  - [x] 3.3 리드 생성 API 수정
    - `POST /api/leads` 엔드포인트 수정
    - LeadNumberService를 사용하여 리드 번호 생성
    - User_Code 미설정 시 오류 반환
    - _Requirements: 3.1, 3.4_
  
  - [x] 3.4 API 통합 테스트 작성
    - 코드 검증 API 테스트
    - 리드 생성 API 테스트
    - _Requirements: 3.1, 3.4, 4.1, 4.2_

- [x] 4. 데이터베이스 스키마 업데이트
  - [x] 4.1 UserSettings 모델 수정
    - userCode 필드에 unique 제약 조건 추가
    - nextLeadSeq 필드 추가 (리드 일련번호 관리)
    - Prisma 마이그레이션 생성 및 적용
    - _Requirements: 4.1, 3.3_

- [x] 5. 프론트엔드 컴포넌트 구현
  - [x] 5.1 UserCodeSetting 컴포넌트 확장
    - `chemon-quotation/components/settings/UserCodeSetting.tsx` 수정
    - 실시간 중복 검사 기능 추가
    - 중복/사용가능 피드백 UI 구현
    - _Requirements: 4.4_
  
  - [x] 5.2 QuotationCodeGuard 컴포넌트 구현
    - `chemon-quotation/components/quotation/QuotationCodeGuard.tsx` 파일 생성
    - User_Code 미설정 시 안내 메시지 및 설정 링크 표시
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x] 5.3 효력시험 견적서 작성 페이지에 가드 적용
    - `chemon-quotation/app/(dashboard)/efficacy-quotations/new/page.tsx` 수정
    - QuotationCodeGuard로 감싸기
    - _Requirements: 5.1_
  
  - [x] 5.4 프론트엔드 컴포넌트 테스트 작성
    - QuotationCodeGuard 렌더링 테스트
    - UserCodeSetting 중복 검사 UI 테스트
    - **Property 5: 코드 미설정 시 오류 처리**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 6. Checkpoint - 프론트엔드 컴포넌트 테스트 확인
  - 모든 테스트가 통과하는지 확인, 문제 발생 시 사용자에게 질문

- [x] 7. 효력시험 견적서 미리보기 통합
  - [x] 7.1 UnifiedQuotationPreview 컴포넌트 구현
    - `chemon-quotation/components/quotation/UnifiedQuotationPreview.tsx` 파일 생성
    - 견적번호, 회사 정보 표시 레이아웃 구현
    - 모든 시험 유형에서 공통 사용 가능한 구조
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 7.2 효력시험 견적서 미리보기 수정
    - `chemon-quotation/components/efficacy-quotation/` 관련 파일 수정
    - UnifiedQuotationPreview 컴포넌트 적용
    - 견적번호, 회사 정보 표시 추가
    - _Requirements: 2.1, 2.2_
  
  - [x] 7.3 효력시험 PDF 생성 수정
    - `chemon-quotation/components/efficacy-quotation/EfficacyStudyDesignPDF.tsx` 수정
    - 견적번호, 회사 정보 포함
    - _Requirements: 2.4_
  
  - [x] 7.4 미리보기 속성 테스트 작성
    - **Property 3: 미리보기 정보 포함**
    - **Validates: Requirements 2.1, 2.2, 2.4, 2.5**

- [x] 8. 코드 변경 영향 범위 처리
  - [x] 8.1 기존 번호 불변성 보장
    - 견적서/리드 조회 시 저장된 번호 그대로 반환
    - 코드 변경이 기존 데이터에 영향 없음 확인
    - _Requirements: 5.5, 3.5_
  
  - [x] 8.2 코드 변경 영향 범위 테스트 작성
    - **Property 8: 코드 변경 영향 범위**
    - **Property 9: 기존 리드 번호 불변성**
    - **Validates: Requirements 5.4, 5.5, 3.5**

- [x] 9. Final Checkpoint - 전체 테스트 확인
  - 모든 테스트가 통과하는지 확인, 문제 발생 시 사용자에게 질문

## Notes

- 모든 태스크는 필수입니다 (테스트 포함)
- 각 태스크는 특정 요구사항을 참조하여 추적 가능
- 체크포인트에서 점진적 검증 수행
- 속성 테스트는 보편적 정확성 속성을 검증
- 단위 테스트는 특정 예제와 엣지 케이스를 검증

