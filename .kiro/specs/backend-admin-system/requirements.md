# Requirements Document

## Introduction

CHEMON 견적관리시스템의 백엔드 API 서버, 사용자 인증 시스템, 그리고 관리자 페이지를 구축하는 기능입니다. 개별 사용자가 각자의 데이터를 관리하고, 관리자가 전체 시스템을 통제할 수 있는 종합적인 시스템을 제공합니다.

## Glossary

- **Backend_Server**: Node.js/Express 기반의 REST API 서버
- **Auth_System**: JWT 기반 사용자 인증 및 권한 관리 시스템
- **Admin_Panel**: 관리자 전용 대시보드 및 관리 기능 페이지
- **User**: 시스템을 사용하는 일반 사용자
- **Admin**: 시스템 전체를 관리하는 관리자 권한 사용자
- **Database**: PostgreSQL 데이터베이스
- **Announcement**: 관리자가 작성하는 공지사항
- **Notification**: 사용자에게 전달되는 알림 메시지

## Requirements

### Requirement 1: 사용자 인증 시스템

**User Story:** As a 사용자, I want to 안전하게 로그인하고 내 계정을 관리, so that 개인 데이터를 보호하고 시스템을 사용할 수 있다.

#### Acceptance Criteria

1. WHEN 사용자가 이메일과 비밀번호로 로그인 요청을 하면, THE Auth_System SHALL 자격 증명을 검증하고 JWT 토큰을 발급한다
2. WHEN 사용자가 회원가입 요청을 하면, THE Auth_System SHALL 이메일 중복 확인 후 비밀번호를 암호화하여 계정을 생성한다
3. WHEN 유효하지 않은 토큰으로 API 요청이 오면, THE Auth_System SHALL 401 Unauthorized 응답을 반환한다
4. WHEN 사용자가 비밀번호 변경을 요청하면, THE Auth_System SHALL 현재 비밀번호 확인 후 새 비밀번호로 업데이트한다
5. WHEN 사용자가 로그아웃하면, THE Auth_System SHALL 토큰을 무효화한다
6. IF 로그인 시도가 5회 연속 실패하면, THEN THE Auth_System SHALL 해당 계정을 15분간 잠금 처리한다

### Requirement 2: 사용자 데이터 관리

**User Story:** As a 사용자, I want to 내 견적서와 고객 데이터를 저장하고 관리, so that 언제든지 데이터에 접근하고 수정할 수 있다.

#### Acceptance Criteria

1. WHEN 사용자가 견적서를 생성하면, THE Backend_Server SHALL 해당 사용자 ID와 연결하여 Database에 저장한다
2. WHEN 사용자가 자신의 데이터를 조회하면, THE Backend_Server SHALL 해당 사용자 소유의 데이터만 반환한다
3. WHEN 사용자가 데이터를 수정하면, THE Backend_Server SHALL 소유권 확인 후 업데이트를 수행한다
4. WHEN 사용자가 데이터를 삭제하면, THE Backend_Server SHALL 소유권 확인 후 소프트 삭제를 수행한다
5. THE Backend_Server SHALL 모든 데이터 변경에 대해 생성일시와 수정일시를 자동 기록한다

### Requirement 3: 관리자 사용자 관리

**User Story:** As a 관리자, I want to 모든 사용자 계정을 관리, so that 시스템 접근을 통제하고 사용자를 지원할 수 있다.

#### Acceptance Criteria

1. WHEN 관리자가 사용자 목록을 요청하면, THE Admin_Panel SHALL 페이지네이션된 전체 사용자 목록을 표시한다
2. WHEN 관리자가 사용자를 검색하면, THE Admin_Panel SHALL 이름, 이메일, 상태로 필터링된 결과를 반환한다
3. WHEN 관리자가 사용자 계정을 비활성화하면, THE Backend_Server SHALL 해당 사용자의 로그인을 차단한다
4. WHEN 관리자가 사용자 계정을 활성화하면, THE Backend_Server SHALL 해당 사용자의 로그인을 허용한다
5. WHEN 관리자가 사용자 비밀번호를 초기화하면, THE Backend_Server SHALL 임시 비밀번호를 생성하고 사용자에게 알린다
6. WHEN 관리자가 사용자 권한을 변경하면, THE Backend_Server SHALL 즉시 해당 사용자의 권한을 업데이트한다

### Requirement 4: 공지사항 관리

**User Story:** As a 관리자, I want to 공지사항을 작성하고 관리, so that 사용자들에게 중요한 정보를 전달할 수 있다.

#### Acceptance Criteria

1. WHEN 관리자가 공지사항을 작성하면, THE Backend_Server SHALL 제목, 내용, 중요도, 게시 기간을 저장한다
2. WHEN 관리자가 공지사항을 수정하면, THE Backend_Server SHALL 수정 이력을 보존하며 내용을 업데이트한다
3. WHEN 관리자가 공지사항을 삭제하면, THE Backend_Server SHALL 소프트 삭제를 수행한다
4. WHEN 사용자가 공지사항 목록을 요청하면, THE Backend_Server SHALL 게시 기간 내의 활성 공지사항만 반환한다
5. WHEN 중요 공지사항이 등록되면, THE Backend_Server SHALL 모든 활성 사용자에게 알림을 생성한다
6. THE Admin_Panel SHALL 공지사항 조회수와 확인 현황을 표시한다

### Requirement 5: 시스템 모니터링 및 통계

**User Story:** As a 관리자, I want to 시스템 사용 현황과 통계를 확인, so that 서비스 상태를 파악하고 의사결정에 활용할 수 있다.

#### Acceptance Criteria

1. WHEN 관리자가 대시보드에 접근하면, THE Admin_Panel SHALL 총 사용자 수, 활성 사용자 수, 오늘 생성된 견적서 수를 표시한다
2. WHEN 관리자가 기간별 통계를 요청하면, THE Backend_Server SHALL 일별/주별/월별 사용 통계를 반환한다
3. WHEN 관리자가 사용자 활동 로그를 조회하면, THE Backend_Server SHALL 로그인, 데이터 생성/수정/삭제 이력을 반환한다
4. THE Backend_Server SHALL 모든 API 요청에 대해 응답 시간과 상태 코드를 로깅한다
5. WHEN 시스템 오류가 발생하면, THE Backend_Server SHALL 오류 내용을 로그에 기록하고 관리자에게 알린다

### Requirement 6: 알림 시스템

**User Story:** As a 사용자, I want to 중요한 알림을 받고 관리, so that 시스템 변경사항과 공지를 놓치지 않을 수 있다.

#### Acceptance Criteria

1. WHEN 새 알림이 생성되면, THE Backend_Server SHALL 해당 사용자의 알림 목록에 추가한다
2. WHEN 사용자가 알림을 확인하면, THE Backend_Server SHALL 해당 알림을 읽음 상태로 변경한다
3. WHEN 사용자가 알림 목록을 요청하면, THE Backend_Server SHALL 최신순으로 정렬된 알림을 반환한다
4. THE Backend_Server SHALL 30일이 지난 읽은 알림을 자동 삭제한다
5. WHEN 사용자가 로그인하면, THE Auth_System SHALL 읽지 않은 알림 개수를 함께 반환한다

### Requirement 7: 데이터 백업 및 복구

**User Story:** As a 관리자, I want to 데이터를 백업하고 복구, so that 데이터 손실을 방지하고 시스템 안정성을 보장할 수 있다.

#### Acceptance Criteria

1. THE Backend_Server SHALL 매일 자정에 자동으로 데이터베이스 백업을 수행한다
2. WHEN 관리자가 수동 백업을 요청하면, THE Backend_Server SHALL 즉시 백업을 생성하고 다운로드 링크를 제공한다
3. WHEN 관리자가 백업 복구를 요청하면, THE Backend_Server SHALL 선택된 백업 시점으로 데이터를 복원한다
4. THE Admin_Panel SHALL 최근 30일간의 백업 목록과 상태를 표시한다
5. IF 백업이 실패하면, THEN THE Backend_Server SHALL 관리자에게 즉시 알림을 발송한다

### Requirement 8: API 보안

**User Story:** As a 시스템, I want to API 요청을 안전하게 처리, so that 무단 접근과 공격으로부터 시스템을 보호할 수 있다.

#### Acceptance Criteria

1. THE Backend_Server SHALL 모든 API 요청에 대해 Rate Limiting을 적용한다 (분당 100회)
2. THE Backend_Server SHALL CORS 정책을 적용하여 허용된 도메인만 접근을 허용한다
3. THE Backend_Server SHALL 모든 입력 데이터에 대해 유효성 검사를 수행한다
4. WHEN SQL Injection 패턴이 감지되면, THE Backend_Server SHALL 요청을 차단하고 로그에 기록한다
5. THE Backend_Server SHALL HTTPS를 통해서만 통신을 허용한다
6. THE Backend_Server SHALL 민감한 데이터를 암호화하여 저장한다

### Requirement 9: 설정 관리

**User Story:** As a 관리자, I want to 시스템 설정을 관리, so that 운영 환경에 맞게 시스템을 조정할 수 있다.

#### Acceptance Criteria

1. WHEN 관리자가 시스템 설정을 변경하면, THE Backend_Server SHALL 변경 사항을 즉시 적용한다
2. THE Admin_Panel SHALL 회원가입 허용 여부, 기본 사용자 권한, 세션 만료 시간 설정을 제공한다
3. WHEN 설정이 변경되면, THE Backend_Server SHALL 변경 이력을 기록한다
4. THE Admin_Panel SHALL 이메일 발송 설정 (SMTP 서버, 발신자 정보)을 관리할 수 있다
5. IF 잘못된 설정 값이 입력되면, THEN THE Backend_Server SHALL 오류 메시지와 함께 변경을 거부한다
