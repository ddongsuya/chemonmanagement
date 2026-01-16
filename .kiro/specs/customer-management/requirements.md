# Requirements Document

## Introduction

고객사 관리 모듈의 대규모 업데이트로, 견적부터 계약, 시험 접수, 세금계산서 발행까지의 전체 프로세스를 체계적으로 관리할 수 있는 기능을 제공합니다. 1개의 고객사에 여러 의뢰자(담당자)를 관리하고, 각 의뢰자별 견적/계약 이력을 추적하며, 시험 접수 후 금액 관리 및 세금계산서 발행 일정을 관리합니다. 또한 고객사와의 미팅/일정 기록, 회의록 작성, 캘린더 연동 기능을 포함합니다.

## Glossary

- **Customer**: 고객사 (의뢰기관). 회사 단위의 정보를 관리
- **Requester**: 의뢰자. 고객사 내 실제 시험을 의뢰하는 담당자
- **Test_Reception**: 시험 접수. 계약 완료 후 실제 시험이 접수된 건
- **Test_Header**: 시험 헤더 정보. 물질코드, 프로젝트코드, 시험물질명, 의뢰기관명, 시험번호, 시험제목, 시험책임자
- **Invoice_Schedule**: 세금계산서 발행 일정. 시험별 금액 및 발행 예정일 관리
- **Progress_Stage**: 진행 단계. 견적→계약→시험접수→진행→완료 등의 워크플로우 단계
- **Meeting_Record**: 미팅 기록. 고객사와의 미팅, 회의록, 요청사항 등
- **Calendar_Event**: 캘린더 이벤트. 일정 관리를 위한 이벤트 데이터

## Requirements

### Requirement 1: 다중 의뢰자 관리

**User Story:** As a 영업담당자, I want to 1개 고객사에 여러 의뢰자를 등록하고 관리, so that 의뢰자별로 견적 및 계약 사항을 체계적으로 추적할 수 있다.

#### Acceptance Criteria

1. WHEN 사용자가 고객사 상세 페이지에서 의뢰자 추가 버튼을 클릭 THEN the Customer_Management_System SHALL 의뢰자 등록 폼을 표시하고 이름, 직책, 연락처, 이메일 정보를 입력받는다
2. WHEN 의뢰자가 등록 THEN the Customer_Management_System SHALL 해당 의뢰자를 고객사에 연결하고 의뢰자 목록에 표시한다
3. WHEN 사용자가 의뢰자를 선택 THEN the Customer_Management_System SHALL 해당 의뢰자의 견적 이력, 계약 이력, 시험 접수 이력을 필터링하여 표시한다
4. WHEN 의뢰자 정보가 수정 THEN the Customer_Management_System SHALL 변경 이력을 기록하고 연관된 견적/계약 정보는 유지한다
5. WHEN 의뢰자가 삭제 요청 THEN the Customer_Management_System SHALL 연관된 견적/계약이 있는 경우 비활성화 처리하고, 없는 경우에만 완전 삭제를 허용한다

### Requirement 2: 시험 접수 및 헤더 정보 관리

**User Story:** As a 영업담당자, I want to 계약 완료 후 시험 접수 정보를 등록하고 관리, so that 각 시험별 상세 정보와 금액을 체계적으로 추적할 수 있다.

#### Acceptance Criteria

1. WHEN 계약 상태가 완료로 변경 THEN the Customer_Management_System SHALL 시험 접수 등록 버튼을 활성화한다
2. WHEN 사용자가 시험 접수를 등록 THEN the Customer_Management_System SHALL 물질코드, 프로젝트코드, 시험물질명, 의뢰기관명, 시험번호, 시험제목, 시험책임자 필드를 입력받는다
3. WHEN 시험 접수가 완료 THEN the Customer_Management_System SHALL 해당 시험을 계약 및 의뢰자와 연결하고 시험 목록에 표시한다
4. WHEN 사용자가 시험 목록을 조회 THEN the Customer_Management_System SHALL 시험번호, 시험제목, 시험책임자, 진행상태, 금액 정보를 테이블 형태로 표시한다
5. WHEN 시험 정보가 수정 THEN the Customer_Management_System SHALL 변경 이력을 기록하고 수정 일시를 갱신한다

### Requirement 3: 세금계산서 발행 일정 관리

**User Story:** As a 영업담당자, I want to 시험별 세금계산서 발행 일정을 관리, so that 발행 기한을 놓치지 않고 체계적으로 관리할 수 있다.

#### Acceptance Criteria

1. WHEN 시험 접수가 등록 THEN the Customer_Management_System SHALL 기본 발행 기준(최종보고서 제출 후 30일)으로 세금계산서 발행 예정일을 자동 계산한다
2. WHEN 계약서에 별도 지급 조건이 설정 THEN the Customer_Management_System SHALL 해당 조건에 따라 발행 예정일을 유연하게 설정할 수 있도록 한다
3. WHEN 사용자가 발행 일정을 조회 THEN the Customer_Management_System SHALL 시험번호, 금액, 발행예정일, 발행상태를 목록으로 표시한다
4. WHEN 발행 예정일이 7일 이내로 도래 THEN the Customer_Management_System SHALL 해당 항목을 강조 표시하고 알림 영역에 표시한다
5. WHEN 세금계산서가 발행 완료 THEN the Customer_Management_System SHALL 발행일, 발행번호를 기록하고 상태를 완료로 변경한다
6. WHEN 분할 지급 조건이 설정 THEN the Customer_Management_System SHALL 각 분할 건별로 금액과 발행 예정일을 개별 관리한다

### Requirement 4: 진행 단계 워크플로우

**User Story:** As a 영업담당자, I want to 문의접수부터 자금관리까지의 진행 단계를 시각적으로 확인, so that 현재 상태를 파악하고 다음 단계에서 해야 할 작업을 놓치지 않을 수 있다.

#### Acceptance Criteria

1. WHEN 사용자가 고객사 상세 페이지를 조회 THEN the Customer_Management_System SHALL 다음 7단계를 시각적 프로그레스 바로 표시한다: 문의접수→견적서송부→시험의뢰요청→계약체결→시험접수→시험관리→자금관리
2. WHEN 각 단계가 완료 THEN the Customer_Management_System SHALL 해당 단계를 완료 상태로 표시하고 다음 단계를 활성화한다
3. WHEN 사용자가 특정 단계를 클릭 THEN the Customer_Management_System SHALL 해당 단계에서 수행해야 할 체크리스트 항목을 표시한다
4. WHEN 체크리스트 항목이 모두 완료 THEN the Customer_Management_System SHALL 다음 단계로 진행 버튼을 활성화한다
5. WHEN 단계별 체크리스트 항목이 미완료 상태로 다음 단계 진행 시도 THEN the Customer_Management_System SHALL 경고 메시지를 표시하고 강제 진행 여부를 확인한다
6. WHEN 시험접수 단계가 완료 THEN the Customer_Management_System SHALL 시험번호 및 시험책임자 배정 정보를 입력받는다

### Requirement 5: 미팅 및 일정 기록

**User Story:** As a 영업담당자, I want to 고객사와의 미팅, 회의록, 요청사항을 기록, so that 고객 응대 이력을 체계적으로 관리하고 팀원과 공유할 수 있다.

#### Acceptance Criteria

1. WHEN 사용자가 미팅 기록 추가 버튼을 클릭 THEN the Customer_Management_System SHALL 날짜, 유형(미팅/전화/이메일), 참석자, 내용, 후속조치 필드를 입력받는다
2. WHEN 미팅 기록이 저장 THEN the Customer_Management_System SHALL 해당 기록을 고객사 타임라인에 시간순으로 표시한다
3. WHEN 사용자가 회의록을 작성 THEN the Customer_Management_System SHALL 리치 텍스트 에디터를 제공하고 첨부파일 업로드를 지원한다
4. WHEN 요청사항이 등록 THEN the Customer_Management_System SHALL 요청일, 요청내용, 처리상태, 처리일 필드를 관리한다
5. WHEN 요청사항 처리가 완료 THEN the Customer_Management_System SHALL 처리 완료 상태로 변경하고 처리 내용을 기록한다

### Requirement 6: 캘린더 모듈 및 연동

**User Story:** As a 영업담당자, I want to 고객사 관련 일정을 캘린더에서 통합 관리, so that 미팅, 세금계산서 발행일, 보고서 제출일 등을 한눈에 파악할 수 있다.

#### Acceptance Criteria

1. WHEN 사용자가 캘린더 페이지를 조회 THEN the Customer_Management_System SHALL 월간/주간/일간 뷰를 제공하고 이벤트를 시각적으로 표시한다
2. WHEN 미팅 일정이 등록 THEN the Customer_Management_System SHALL 해당 일정을 캘린더에 자동으로 표시한다
3. WHEN 세금계산서 발행 예정일이 설정 THEN the Customer_Management_System SHALL 해당 일정을 캘린더에 자동으로 표시한다
4. WHEN 사용자가 캘린더에서 이벤트를 클릭 THEN the Customer_Management_System SHALL 이벤트 상세 정보와 관련 고객사/시험 정보로 이동하는 링크를 표시한다
5. WHEN 사용자가 캘린더에서 직접 이벤트를 생성 THEN the Customer_Management_System SHALL 이벤트 유형, 제목, 날짜/시간, 관련 고객사, 메모 필드를 입력받는다
6. WHEN 이벤트에 알림이 설정 THEN the Customer_Management_System SHALL 설정된 시간 전에 알림을 표시한다

### Requirement 7: 고객사 대시보드 통합 뷰

**User Story:** As a 영업담당자, I want to 고객사 상세 페이지에서 모든 관련 정보를 통합적으로 확인, so that 고객사 현황을 빠르게 파악하고 필요한 조치를 취할 수 있다.

#### Acceptance Criteria

1. WHEN 사용자가 고객사 상세 페이지를 조회 THEN the Customer_Management_System SHALL 회사정보, 의뢰자목록, 진행단계, 견적/계약이력, 시험목록, 미팅기록을 탭 또는 섹션으로 구분하여 표시한다
2. WHEN 긴급 처리가 필요한 항목이 존재 THEN the Customer_Management_System SHALL 해당 항목을 상단 알림 영역에 강조 표시한다
3. WHEN 사용자가 빠른 작업 버튼을 클릭 THEN the Customer_Management_System SHALL 새 견적 작성, 미팅 기록, 시험 접수 등의 바로가기를 제공한다
4. WHEN 최근 활동이 발생 THEN the Customer_Management_System SHALL 활동 타임라인에 시간순으로 기록하고 표시한다

### Requirement 8: 데이터 저장 및 조회

**User Story:** As a 시스템, I want to 모든 고객사 관련 데이터를 안정적으로 저장하고 조회, so that 데이터 무결성을 보장하고 빠른 검색이 가능하다.

#### Acceptance Criteria

1. WHEN 의뢰자 데이터가 저장 THEN the Customer_Management_System SHALL localStorage에 고객사 ID와 연결하여 저장한다
2. WHEN 시험 접수 데이터가 저장 THEN the Customer_Management_System SHALL 계약 ID, 의뢰자 ID와 연결하여 저장한다
3. WHEN 미팅 기록이 저장 THEN the Customer_Management_System SHALL 고객사 ID와 연결하고 날짜 인덱스를 생성한다
4. WHEN 캘린더 이벤트가 저장 THEN the Customer_Management_System SHALL 이벤트 유형별로 구분하고 날짜 범위 검색이 가능하도록 저장한다
5. WHEN 데이터 조회 요청 THEN the Customer_Management_System SHALL 연관된 모든 데이터를 조인하여 통합 뷰를 제공한다
