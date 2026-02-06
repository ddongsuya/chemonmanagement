# 구현 계획: CRM 핵심 기능 강화

## 개요

CRM 시스템의 핵심 기능 3가지(자동 백업, 자동화 엔진, PWA)를 구현합니다.
우선순위에 따라 P0 → P1 → P2 순서로 구현합니다.

## Tasks

- [x] 1. 백업 시스템 구현 (P0)
  - [x] 1.1 BackupService 확장 - 백업 데이터 범위 정의
    - `collectBackupData` 메서드 수정: User, Customer, Lead, Quotation, Contract, Study, SystemSetting, PipelineStage, StageTask 포함
    - 마스터 데이터(ToxicityTest, EfficacyModel 등) 제외 로직 추가
    - _Requirements: 1.4.1, 1.4.2, 1.4.3, 1.4.4_

  - [x] 1.2 백업 테이블 포함 속성 테스트
    - **Property 2: 백업 데이터 테이블 포함**
    - **Validates: Requirements 1.4.1, 1.4.2, 1.4.3, 1.4.4**

  - [x] 1.3 백업 다운로드 API 구현
    - `GET /api/admin/backups/:id/download` 엔드포인트 추가
    - 백업 데이터를 JSON 파일로 반환
    - _Requirements: 1.2.3_

  - [x] 1.4 백업 복구 기능 구현
    - `restore` 메서드 구현: 트랜잭션 내에서 데이터 복구
    - 선택적 테이블 복구 옵션 지원
    - 복구 결과 리포트 반환
    - `POST /api/admin/backups/:id/restore` 엔드포인트 추가
    - _Requirements: 1.3.1, 1.3.3, 1.3.4_

  - [x] 1.5 백업 라운드트립 속성 테스트
    - **Property 1: 백업 데이터 라운드트립**
    - **Validates: Requirements 1.2.3, 1.3.1, 1.3.3**

  - [x] 1.6 선택적 복구 속성 테스트
    - **Property 5: 선택적 복구**
    - **Validates: Requirements 1.3.3, 1.3.4**

  - [x] 1.7 백업 관리 UI 구현
    - `BackupManagement.tsx`: 백업 목록, 생성, 다운로드, 복구 UI
    - `BackupRestoreDialog.tsx`: 복구 확인 다이얼로그 (테이블 선택 옵션)
    - `BackupProgress.tsx`: 진행 상태 표시
    - _Requirements: 1.2.1, 1.2.2, 1.2.4, 1.3.2_

- [x] 2. Checkpoint - 백업 시스템 테스트
  - 모든 테스트 통과 확인, 문제 발생 시 사용자에게 질문

- [x] 3. 자동화 규칙 엔진 UI 구현 (P1)
  - [x] 3.1 자동화 규칙 목록 페이지
    - `AutomationRuleList.tsx`: 규칙 목록 테이블 (이름, 트리거, 상태, 실행 횟수)
    - 활성화/비활성화 토글 버튼
    - 규칙 삭제 기능
    - _Requirements: 2.5.1, 2.5.2, 2.5.3_

  - [x] 3.2 자동화 규칙 생성/수정 폼
    - `AutomationRuleForm.tsx`: 규칙 이름, 설명, 상태 입력
    - `AutomationTriggerConfig.tsx`: 트리거 유형 선택 (STATUS_CHANGE, DATE_REACHED, ITEM_CREATED)
    - `AutomationConditionBuilder.tsx`: 조건 설정 UI (필드, 연산자, 값)
    - `AutomationActionConfig.tsx`: 액션 설정 (SEND_NOTIFICATION, UPDATE_STATUS, CREATE_ACTIVITY)
    - _Requirements: 2.1.1, 2.1.2, 2.1.3, 2.1.4_

  - [x] 3.3 자동화 규칙 CRUD 속성 테스트
    - **Property 6: 자동화 규칙 CRUD 라운드트립**
    - **Validates: Requirements 2.1.1, 2.1.2, 2.1.4, 2.5.3**

  - [x] 3.4 실행 히스토리 페이지
    - `AutomationExecutionLog.tsx`: 실행 로그 목록 (규칙명, 상태, 시작/완료 시간)
    - 실행 상세 정보 표시
    - _Requirements: 2.5.4_

  - [x] 3.5 실행 로그 기록 속성 테스트
    - **Property 11: 실행 로그 기록**
    - **Validates: Requirements 2.4.4, 2.5.4**

- [x] 4. 상태 변경 트리거 연동 (P1)
  - [x] 4.1 리드 상태 변경 시 트리거 호출
    - `leads.ts` 라우트에서 상태 변경 시 `automationService.handleStatusChange` 호출
    - _Requirements: 2.2.1_

  - [x] 4.2 견적서 상태 변경 시 트리거 호출
    - `quotations.ts` 라우트에서 상태 변경 시 트리거 호출
    - _Requirements: 2.2.2_

  - [x] 4.3 계약 상태 변경 시 트리거 호출
    - `contracts.ts` 라우트에서 상태 변경 시 트리거 호출
    - _Requirements: 2.2.3_

  - [x] 4.4 상태 변경 트리거 속성 테스트
    - **Property 7: 상태 변경 트리거 발동**
    - **Validates: Requirements 2.2.1, 2.2.2, 2.2.3, 2.2.4**

  - [x] 4.5 조건 평가 속성 테스트
    - **Property 8: 조건 평가**
    - **Validates: Requirements 2.1.3**

- [x] 5. Checkpoint - 자동화 엔진 테스트
  - 모든 테스트 통과 확인, 문제 발생 시 사용자에게 질문

- [x] 6. PWA 기본 설정 (P1)
  - [x] 6.1 manifest.json 생성
    - `public/manifest.json`: 앱 이름, 아이콘, 테마 색상, start_url 설정
    - 스플래시 스크린 설정
    - _Requirements: 3.1.1, 3.1.4_

  - [x] 6.2 next-pwa 설정
    - `next.config.mjs`에 next-pwa 플러그인 추가
    - Service Worker 등록 설정
    - 정적 자산 캐싱 전략 설정
    - _Requirements: 3.1.2, 3.2.1_

  - [x] 6.3 PWA 아이콘 생성
    - `public/icons/`: 192x192, 512x512 아이콘 파일 추가
    - _Requirements: 3.1.1_

- [x] 7. 모바일 최적화 UI (P1)
  - [x] 7.1 하단 네비게이션 바 구현
    - `MobileNavigation.tsx`: 모바일 전용 하단 네비게이션
    - 반응형 조건부 렌더링 (모바일에서만 표시)
    - _Requirements: 3.3.3_

  - [x] 7.2 모바일 리드 카드 구현
    - `MobileLeadCard.tsx`: 터치 최적화 리드 카드
    - 전화번호 클릭 시 tel: 링크
    - 이메일 클릭 시 mailto: 링크
    - _Requirements: 3.3.1, 3.5.2, 3.5.3_

  - [x] 7.3 간소화된 리드 등록 폼
    - `MobileLeadForm.tsx`: 모바일용 필수 필드만 포함하는 리드 등록 폼
    - _Requirements: 3.5.1_

- [x] 8. Checkpoint - PWA 기본 기능 테스트
  - 모든 테스트 통과 확인, 문제 발생 시 사용자에게 질문

- [x] 9. 일일 자동 백업 (P2)
  - [x] 9.1 스케줄러 API 엔드포인트
    - `POST /api/admin/backups/scheduled`: 자동 백업 실행
    - `POST /api/admin/backups/cleanup`: 7일 이상 백업 정리
    - API 키 인증 추가
    - _Requirements: 1.1.1, 1.1.4_

  - [x] 9.2 GitHub Actions 워크플로우
    - `.github/workflows/backup-scheduler.yml`: 매일 새벽 3시 실행
    - 백업 생성 및 정리 API 호출
    - _Requirements: 1.1.1_

  - [x] 9.3 백업 보존 기간 속성 테스트
    - **Property 3: 백업 보존 기간**
    - **Validates: Requirements 1.1.4**

  - [x] 9.4 백업 완료 알림
    - 백업 완료/실패 시 관리자에게 알림 발송
    - _Requirements: 1.1.3_

- [x] 10. 날짜 기반 트리거 (P2)
  - [x] 10.1 날짜 트리거 스케줄러 API
    - `POST /api/admin/automation/process-date-triggers`: 날짜 조건 체크
    - _Requirements: 2.3.4_

  - [x] 10.2 GitHub Actions 워크플로우
    - `.github/workflows/automation-scheduler.yml`: 매일 실행
    - 날짜 도달 트리거 처리 API 호출
    - _Requirements: 2.3.4_

  - [x] 10.3 날짜 기반 트리거 속성 테스트
    - **Property 9: 날짜 기반 트리거 발동**
    - **Validates: Requirements 2.3.1, 2.3.2, 2.3.3**

- [x] 11. 오프라인 지원 (P2)
  - [x] 11.1 IndexedDB 캐시 유틸리티
    - `lib/offline-cache.ts`: IndexedDB 저장/조회 유틸리티
    - 최근 조회 데이터 캐싱 로직
    - _Requirements: 3.2.2_

  - [x] 11.2 오프라인 캐시 라운드트립 테스트
    - **Property 13: 오프라인 캐시 라운드트립**
    - **Validates: Requirements 3.2.2**

  - [x] 11.3 오프라인 상태 표시
    - `OfflineIndicator.tsx`: 오프라인 상태 배너
    - 네트워크 상태 감지 훅
    - _Requirements: 3.2.3_

  - [x] 11.4 온라인 복귀 동기화
    - 펜딩 액션 큐 관리
    - 온라인 복귀 시 자동 동기화
    - _Requirements: 3.2.4_

  - [x] 11.5 오프라인 동기화 속성 테스트
    - **Property 14: 오프라인 동기화**
    - **Validates: Requirements 3.2.4**

- [x] 12. 푸시 알림 (P2)
  - [x] 12.1 푸시 구독 모델 추가
    - Prisma 스키마에 `PushSubscription` 모델 추가
    - 마이그레이션 실행
    - _Requirements: 3.4.1_

  - [x] 12.2 푸시 구독 API
    - `POST /api/push/subscribe`: 푸시 구독 등록
    - `DELETE /api/push/unsubscribe`: 푸시 구독 해제
    - _Requirements: 3.4.1_

  - [x] 12.3 푸시 알림 서비스
    - `PushService`: Web Push API를 사용한 알림 발송
    - 리드 등록, 견적 상태 변경 시 푸시 발송
    - _Requirements: 3.4.2, 3.4.3_

  - [x] 12.4 푸시 알림 발송 속성 테스트
    - **Property 15: 푸시 알림 발송**
    - **Validates: Requirements 3.4.2, 3.4.3**

  - [x] 12.5 프론트엔드 푸시 구독 UI
    - 푸시 알림 권한 요청 로직
    - 설정 페이지에 푸시 알림 토글 추가
    - _Requirements: 3.4.1, 3.4.4_

- [x] 13. Final Checkpoint - 전체 기능 테스트
  - 모든 테스트 통과 확인, 문제 발생 시 사용자에게 질문

## Notes

- 모든 태스크는 필수입니다 (테스트 포함)
- 각 태스크는 해당 요구사항을 참조합니다
- Checkpoint에서 테스트 실패 시 수정 후 진행
- Render 무료 티어 제약으로 백그라운드 작업은 GitHub Actions 활용

## 진행 상황 요약

### 완료된 기능 (전체 완료)

#### P0 - 필수
- ✅ 백업 시스템 (수동 백업, 복구, 다운로드, UI)

#### P1 - 중요
- ✅ 자동화 규칙 엔진 UI (규칙 CRUD, 실행 로그)
- ✅ 상태 변경 트리거 연동 (리드, 견적서, 계약)
- ✅ PWA 기본 설정 (manifest, Service Worker, 아이콘)
- ✅ 모바일 최적화 UI (하단 네비게이션, 리드 카드, 리드 등록 폼)

#### P2 - 선택
- ✅ 일일 자동 백업 (스케줄러 API, GitHub Actions, 속성 테스트, 알림)
- ✅ 날짜 기반 트리거 (스케줄러 API, GitHub Actions, 속성 테스트)
- ✅ 오프라인 지원 (IndexedDB 캐시, 상태 표시, 동기화, 속성 테스트)
- ✅ 푸시 알림 (구독 모델, API, 서비스, 속성 테스트, UI)

### 테스트 결과
- 백엔드 속성 테스트: 301개 통과
- 프론트엔드 속성 테스트: 47개 통과
- 총 348개 테스트 통과
