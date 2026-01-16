# Implementation Plan

## Phase 1: 기반 구조 및 타입 정의

- [x] 1. 타입 정의 및 스토리지 레이어 구축

  - [x] 1.1 타입 인터페이스 정의

    - types/customer.ts에 Requester, TestReception, InvoiceSchedule, ProgressStage, MeetingRecord, CalendarEvent 인터페이스 추가
    - _Requirements: 1.1, 2.2, 3.1, 4.1, 5.1, 6.1_

  - [x] 1.2 의뢰자 스토리지 함수 구현

    - lib/requester-storage.ts 생성
    - saveRequester, getRequesterById, getRequestersByCustomerId, updateRequester, deleteRequester 함수 구현
    - _Requirements: 1.2, 1.4, 1.5, 8.1_

  - [x] 1.3 Property test: 의뢰자 데이터 저장 라운드트립

    - **Property 1: 데이터 저장 라운드트립**
    - **Validates: Requirements 1.2, 8.1**

  - [x] 1.4 시험 접수 스토리지 함수 구현

    - lib/test-reception-storage.ts 생성
    - saveTestReception, getTestReceptionById, getTestReceptionsByCustomerId, updateTestReception 함수 구현
    - _Requirements: 2.3, 2.5, 8.2_

  - [x] 1.5 Property test: 시험 접수 데이터 저장 라운드트립

    - **Property 1: 데이터 저장 라운드트립**
    - **Validates: Requirements 2.3, 8.2**

  - [x] 1.6 세금계산서 일정 스토리지 함수 구현

    - lib/invoice-schedule-storage.ts 생성
    - saveInvoiceSchedule, getInvoiceSchedulesByTestReception, updateInvoiceSchedule, getUpcomingInvoices 함수 구현
    - _Requirements: 3.1, 3.2, 3.5, 3.6_

  - [x] 1.7 Property test: 세금계산서 발행 예정일 자동 계산

    - **Property 8: 세금계산서 발행 예정일 자동 계산**
    - **Validates: Requirements 3.1**

  - [x] 1.8 Property test: 임박 발행 일정 필터링

    - **Property 10: 임박 발행 일정 필터링**
    - **Validates: Requirements 3.4**

- [x] 2. Checkpoint - 스토리지 레이어 검증

  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: 진행 단계 및 미팅 기록 스토리지

- [x] 3. 진행 단계 스토리지 구현

  - [x] 3.1 진행 단계 스토리지 함수 구현

    - lib/progress-stage-storage.ts 생성
    - saveProgressStage, getProgressStageByCustomerId, updateStage, updateChecklist 함수 구현
    - 7단계 워크플로우 정의: 문의접수→견적서송부→시험의뢰요청→계약체결→시험접수→시험관리→자금관리
    - 각 단계별 기본 체크리스트 템플릿 정의
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_

  - [x] 3.2 Property test: 진행 단계 전환

    - **Property 13: 진행 단계 전환**
    - **Validates: Requirements 4.2**

  - [x] 3.3 Property test: 체크리스트 완료 시 단계 진행 가능

    - **Property 15: 체크리스트 완료 시 단계 진행 가능**
    - **Validates: Requirements 4.4**

- [x] 4. 미팅 기록 스토리지 구현

  - [x] 4.1 미팅 기록 스토리지 함수 구현

    - lib/meeting-record-storage.ts 생성
    - saveMeetingRecord, getMeetingRecordsByCustomerId, updateMeetingRecord, getRequestsByCustomerId 함수 구현
    - _Requirements: 5.2, 5.4, 5.5, 8.3_

  - [x] 4.2 Property test: 타임라인 시간순 정렬

    - **Property 16: 타임라인 시간순 정렬**
    - **Validates: Requirements 5.2, 7.4**

  - [x] 4.3 Property test: 요청사항 상태 관리

    - **Property 17: 요청사항 상태 관리**
    - **Validates: Requirements 5.4, 5.5**

- [x] 5. 캘린더 이벤트 스토리지 구현

  - [x] 5.1 캘린더 이벤트 스토리지 함수 구현

    - lib/calendar-event-storage.ts 생성
    - saveCalendarEvent, getCalendarEventsByDateRange, getCalendarEventsByCustomerId, updateCalendarEvent 함수 구현
    - _Requirements: 6.2, 6.3, 8.4_

  - [x] 5.2 Property test: 자동 캘린더 이벤트 생성

    - **Property 18: 자동 캘린더 이벤트 생성**
    - **Validates: Requirements 6.2, 6.3**

  - [x] 5.3 Property test: 캘린더 이벤트 날짜 범위 검색

    - **Property 19: 캘린더 이벤트 날짜 범위 검색**
    - **Validates: Requirements 8.4**

- [x] 6. Checkpoint - 전체 스토리지 레이어 검증

  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: 의뢰자 관리 UI 컴포넌트

- [x] 7. 의뢰자 관리 컴포넌트 구현

  - [x] 7.1 RequesterForm 컴포넌트 구현

    - components/customer/RequesterForm.tsx 생성
    - 이름, 직책, 부서, 연락처, 이메일 입력 폼
    - 등록/수정 모드 지원
    - _Requirements: 1.1, 1.4_

  - [x] 7.2 RequesterCard 컴포넌트 구현

    - components/customer/RequesterCard.tsx 생성
    - 의뢰자 정보 카드 표시, 수정/삭제 버튼
    - _Requirements: 1.1_

  - [x] 7.3 RequesterTab 컴포넌트 구현

    - components/customer/tabs/RequesterTab.tsx 생성
    - 의뢰자 목록 표시, 추가 버튼, 필터링 기능
    - _Requirements: 1.2, 1.3_

  - [x] 7.4 Property test: 의뢰자별 데이터 필터링

    - **Property 2: 의뢰자별 데이터 필터링**
    - **Validates: Requirements 1.3**

  - [x] 7.5 Property test: 의뢰자 삭제 정책

    - **Property 4: 의뢰자 삭제 정책**
    - **Validates: Requirements 1.5**

## Phase 4: 시험 접수 및 세금계산서 UI 컴포넌트

- [x] 8. 시험 접수 컴포넌트 구현

  - [x] 8.1 TestReceptionForm 컴포넌트 구현

    - components/customer/TestReceptionForm.tsx 생성
    - 물질코드, 프로젝트코드, 시험물질명, 의뢰기관명, 시험번호, 시험제목, 시험책임자 입력 폼
    - _Requirements: 2.2_

  - [x] 8.2 TestReceptionTable 컴포넌트 구현

    - components/customer/TestReceptionTable.tsx 생성
    - 시험 목록 테이블, 상태 배지, 금액 표시
    - _Requirements: 2.4_

  - [x] 8.3 TestReceptionTab 컴포넌트 구현

    - components/customer/tabs/TestReceptionTab.tsx 생성
    - 시험 접수 목록, 등록 버튼, 계약 완료 시에만 활성화
    - _Requirements: 2.1, 2.3_

  - [x] 8.4 Property test: 조회 결과 필수 필드 포함

    - **Property 6: 조회 결과 필수 필드 포함**
    - **Validates: Requirements 2.4, 3.3**

- [x] 9. 세금계산서 일정 컴포넌트 구현

  - [x] 9.1 InvoiceScheduleForm 컴포넌트 구현

    - components/customer/InvoiceScheduleForm.tsx 생성
    - 금액, 발행예정일, 분할지급 설정 폼
    - _Requirements: 3.2, 3.6_

  - [x] 9.2 InvoiceScheduleTable 컴포넌트 구현

    - components/customer/InvoiceScheduleTable.tsx 생성
    - 발행 일정 목록, 임박 항목 강조, 상태 관리
    - _Requirements: 3.3, 3.4, 3.5_

  - [x] 9.3 InvoiceScheduleTab 컴포넌트 구현

    - components/customer/tabs/InvoiceScheduleTab.tsx 생성
    - 세금계산서 일정 목록, 발행 완료 처리
    - _Requirements: 3.1, 3.5_

  - [x] 9.4 Property test: 분할 지급 개별 관리

    - **Property 12: 분할 지급 개별 관리**
    - **Validates: Requirements 3.6**

- [x] 10. Checkpoint - 시험 접수 및 세금계산서 UI 검증

  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: 진행 단계 워크플로우 UI

- [x] 11. 진행 단계 워크플로우 컴포넌트 구현

  - [x] 11.1 ProgressWorkflow 컴포넌트 구현

    - components/customer/ProgressWorkflow.tsx 생성
    - 7단계 프로그레스 바 (문의접수→견적서송부→시험의뢰요청→계약체결→시험접수→시험관리→자금관리)
    - 현재 단계 강조, 완료 단계 체크 표시
    - _Requirements: 4.1_

  - [x] 11.2 WorkflowChecklist 컴포넌트 구현

    - components/customer/WorkflowChecklist.tsx 생성
    - 단계별 체크리스트 표시, 체크 토글, 완료 상태 표시
    - _Requirements: 4.3, 4.4, 4.5_

  - [x] 11.3 OverviewTab에 진행 단계 통합

    - components/customer/tabs/OverviewTab.tsx 생성
    - 회사 정보, 통계, 진행 단계 워크플로우 표시
    - _Requirements: 4.1, 7.1_

## Phase 6: 미팅 기록 UI 컴포넌트

- [x] 12. 미팅 기록 컴포넌트 구현

  - [x] 12.1 MeetingRecordForm 컴포넌트 구현

    - components/customer/MeetingRecordForm.tsx 생성
    - 날짜, 유형, 참석자, 내용, 후속조치 입력 폼
    - 요청사항 체크박스 및 처리상태 관리
    - _Requirements: 5.1, 5.4_

  - [x] 12.2 MeetingRecordList 컴포넌트 구현

    - components/customer/MeetingRecordList.tsx 생성
    - 미팅 기록 타임라인 형태 표시
    - _Requirements: 5.2_

  - [x] 12.3 MeetingRecordTab 컴포넌트 구현

    - components/customer/tabs/MeetingRecordTab.tsx 생성
    - 미팅 기록 목록, 추가 버튼, 요청사항 필터
    - _Requirements: 5.1, 5.2, 5.5_

## Phase 7: 캘린더 모듈

- [x] 13. 캘린더 컴포넌트 구현

  - [x] 13.1 CalendarView 메인 컴포넌트 구현

    - components/calendar/CalendarView.tsx 생성
    - 월간/주간/일간 뷰 전환, 네비게이션
    - _Requirements: 6.1_

  - [x] 13.2 MonthView 컴포넌트 구현

    - components/calendar/MonthView.tsx 생성
    - 월간 캘린더 그리드, 이벤트 표시
    - _Requirements: 6.1_

  - [x] 13.3 EventCard 및 EventForm 컴포넌트 구현

    - components/calendar/EventCard.tsx 생성
    - components/calendar/EventForm.tsx 생성
    - 이벤트 카드 표시, 이벤트 등록/수정 폼
    - _Requirements: 6.4, 6.5_

  - [x] 13.4 캘린더 페이지 생성

    - app/(dashboard)/calendar/page.tsx 생성
    - CalendarView 컴포넌트 통합
    - _Requirements: 6.1_

- [x] 14. Checkpoint - 캘린더 모듈 검증

  - Ensure all tests pass, ask the user if questions arise.

## Phase 8: 고객사 상세 페이지 통합

- [x] 15. 고객사 상세 페이지 리팩토링

  - [x] 15.1 CustomerDetailTabs 컴포넌트 구현

    - components/customer/CustomerDetailTabs.tsx 생성

    - 탭 컨테이너, 탭 전환 로직
    - _Requirements: 7.1_

  - [x] 15.2 TimelineTab 컴포넌트 구현

    - components/customer/tabs/TimelineTab.tsx 생성
    - 모든 활동 통합 타임라인
    - _Requirements: 7.4_

  - [x] 15.3 CustomerAlerts 컴포넌트 구현

    - components/customer/CustomerAlerts.tsx 생성
    - 긴급 처리 필요 항목 알림 표시
    - _Requirements: 7.2_

  - [x] 15.4 Property test: 긴급 항목 필터링

    - **Property 20: 긴급 항목 필터링**
    - **Validates: Requirements 7.2**

  - [x] 15.5 고객사 상세 페이지 업데이트

    - app/(dashboard)/customers/[id]/page.tsx 수정
    - 탭 기반 레이아웃으로 변경, 모든 컴포넌트 통합
    - _Requirements: 7.1, 7.3_

  - [x] 15.6 Property test: 데이터 조인 통합 뷰

    - **Property 21: 데이터 조인 통합 뷰**
    - **Validates: Requirements 8.5**

## Phase 9: 사이드바 및 네비게이션 업데이트

- [x] 16. 네비게이션 업데이트

  - [x] 16.1 사이드바에 캘린더 메뉴 추가

    - components/layout/Sidebar.tsx 수정
    - 캘린더 메뉴 아이템 추가
    - _Requirements: 6.1_

- [x] 17. Final Checkpoint - 전체 기능 검증

  - Ensure all tests pass, ask the user if questions arise.
