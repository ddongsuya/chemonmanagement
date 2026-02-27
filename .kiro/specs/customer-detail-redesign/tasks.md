# 구현 태스크

## Task 1: CustomerSummaryHeader 컴포넌트 생성
- [x] `chemon-quotation/components/customer-detail/CustomerSummaryHeader.tsx` 생성
- [x] 고객 회사명, 등급 셀렉트, 담당자, 연락처, 이메일 표시
- [x] 등급 변경 기능 (Select + onGradeChange 콜백)
- [x] 수정 버튼
- [x] 뒤로가기 버튼
- Requirements: 1, 2

## Task 2: OverviewTab 컴포넌트 생성
- [x] `chemon-quotation/components/customer-detail/OverviewTab.tsx` 생성
- [x] 고객 기본 정보 카드 (주소, 메모, 등록일, 수정일)
- [x] 진행 단계(ProgressStage) 요약 카드
- [x] 최근 미팅 기록 3건 요약 카드 + "더보기" 링크
- [x] 다가오는 캘린더 이벤트 3건 요약 카드 + "더보기" 링크
- [x] 로딩 스켈레톤 및 오류 처리
- Requirements: 2, 8

## Task 3: MeetingRecordTab 컴포넌트 생성
- [x] `chemon-quotation/components/customer-detail/MeetingRecordTab.tsx` 생성
- [x] meetingRecordApi.getByCustomerId 호출
- [x] 유형별 아이콘, 날짜, 제목, 참석자 목록 표시
- [x] 클릭 시 상세 내용 확장 (content, follow_up_actions)
- [x] 날짜 최신순 정렬
- [x] 빈 상태 메시지, 로딩 스켈레톤
- Requirements: 4, 8

## Task 4: TestReceptionTab 컴포넌트 생성
- [x] `chemon-quotation/components/customer-detail/TestReceptionTab.tsx` 생성
- [x] testReceptionApi.getByCustomerId 호출
- [x] 시험번호, 시험제목, 상태 배지, 접수일, 예상완료일 표시
- [x] 금액 정보 (총액/납부/잔액) 표시
- [x] 상태별 배지 색상 구분
- [x] 빈 상태 메시지, 로딩 스켈레톤
- Requirements: 5, 8

## Task 5: InvoiceScheduleTab 컴포넌트 생성
- [x] `chemon-quotation/components/customer-detail/InvoiceScheduleTab.tsx` 생성
- [x] invoiceScheduleApi.getByCustomerId 호출
- [x] 금액, 발행예정일, 실제발행일, 상태 배지 표시
- [x] 상태별 배지 색상 (overdue=빨강)
- [x] 발행예정일 기준 정렬
- [x] 빈 상태 메시지, 로딩 스켈레톤
- Requirements: 6, 8

## Task 6: RequesterTab 컴포넌트 생성
- [x] `chemon-quotation/components/customer-detail/RequesterTab.tsx` 생성
- [x] requesterApi.getByCustomerId 호출
- [x] 이름, 직책, 부서, 전화번호, 이메일 표시
- [x] 주 담당자(is_primary) 배지 표시
- [x] 비활성(is_active=false) 의뢰자 흐리게 표시
- [x] 빈 상태 메시지, 로딩 스켈레톤
- Requirements: 7, 8

## Task 7: 메인 페이지 재구성
- [x] `customers/[id]/page.tsx` 탭 기반 UI로 재작성
- [x] CustomerSummaryHeader 통합
- [x] 6개 탭: 개요, 캘린더, 미팅 기록, 시험 접수, 세금계산서, 의뢰자
- [x] 캘린더 탭은 기존 CalendarView 컴포넌트 재사용 (customerId prop)
- [x] 모바일 대응 (탭 가로 스크롤)
- [x] 수정 다이얼로그 유지
- Requirements: 1, 3, 8
