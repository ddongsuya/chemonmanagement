# CHEMON 견적관리시스템 — 프로젝트 분석 보고서

## 1. 프로젝트 개요

CHEMON은 비임상시험(독성, 효력, 임상병리) CRO(수탁연구기관)를 위한 통합 CRM/견적관리 시스템이다. 리드 유입부터 견적 → 계약 → 시험 관리까지의 전체 영업 워크플로우를 하나의 웹앱에서 처리한다.

- 버전: v1.4.0-beta
- 개발자: 1인 개발
- 도메인: 비임상시험 CRO 영업관리

---

## 2. 기술 스택

### 프론트엔드 (`chemon-quotation/`)
| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 14.2.3 (App Router, `'use client'` 기반 CSR 중심) |
| UI | React 18.3, TypeScript 5.5, Tailwind CSS 3.4, shadcn/ui (Radix UI) |
| 상태관리 | Zustand 4.5 (auth, quotation, customer, toxicity-v2 등 6개 스토어) |
| 폼 | React Hook Form 7.52 + Zod 3.23 |
| 데이터 | TanStack Query 5.51, TanStack Table 8.21, TanStack Virtual 3.13 |
| 차트 | Recharts 2.12 |
| PDF | @react-pdf/renderer 3.4 |
| 엑셀 | ExcelJS 4.4, xlsx 0.18 |
| DnD | @dnd-kit/core 6.3 |
| 애니메이션 | framer-motion 12.27 |
| PWA | next-pwa 5.6 (Service Worker, 오프라인 캐싱) |
| 배포 | Vercel |

### 백엔드 (`backend/`)
| 항목 | 기술 |
|------|------|
| 프레임워크 | Express 4.18, TypeScript 5.3 |
| ORM | Prisma 5.7 |
| DB | PostgreSQL (로컬: localhost:5432, 프로덕션: Neon) |
| 인증 | JWT (access + refresh token), bcrypt |
| 보안 | Helmet, CORS (다중 origin), Rate Limiter |
| 파일 | Multer 2.0 |
| PDF | PDFKit 0.17 |
| 푸시 | web-push 3.6 |
| API 문서 | Swagger (swagger-jsdoc + swagger-ui-express, 개발환경만) |
| 배포 | Render (free plan, 싱가포르 리전) |

### 인프라
| 항목 | 설정 |
|------|------|
| 프론트엔드 배포 | Vercel (자동 빌드) |
| 백엔드 배포 | Render free plan (콜드 스타트 있음, `render.yaml` 정의) |
| DB | Neon PostgreSQL (Render 연동) |
| CI/CD | GitHub Actions (자동화 스케줄러, 백업 스케줄러, DB 백업) |

---

## 3. 데이터 모델 (Prisma Schema)

총 50+ 모델. 핵심 엔티티 관계:

```
User ─┬─ Lead ──── PipelineStage
      │    ├── LeadActivity
      │    ├── LeadTaskCompletion ── StageTask
      │    ├── Quotation
      │    └── Customer (전환 시)
      │
      ├─ Customer ─┬─ Requester
      │             ├─ MeetingRecord
      │             ├─ TestReception ── Study
      │             ├─ InvoiceSchedule
      │             ├─ CalendarEvent
      │             ├─ CustomerTag / Note / Document
      │             ├─ CustomerAuditLog
      │             ├─ CustomerHealthScore
      │             ├─ LifecycleTransition
      │             └─ CustomerCustomFieldValue
      │
      ├─ Quotation ─── Contract ─┬─ Study
      │                           ├─ ContractAmendment
      │                           ├─ PaymentSchedule
      │                           └─ ConsultationRecord
      │
      ├─ ClinicalQuotation ── ClinicalTestRequest
      │    └── ClinicalQuotationItem ── ClinicalTestItem
      │
      └─ AutomationRule ── AutomationAction
           └── AutomationExecution
```

### 주요 Enum
- `LeadStatus`: NEW → CONTACTED → QUALIFIED → PROPOSAL → NEGOTIATION → CONVERTED / LOST / DORMANT
- `ContractStatus`: NEGOTIATING → SIGNED → TEST_RECEIVED → IN_PROGRESS → COMPLETED / TERMINATED
- `StudyStatus`: REGISTERED → PREPARING → IN_PROGRESS → ANALYSIS → REPORT_DRAFT → REPORT_REVIEW → COMPLETED / SUSPENDED
- `QuotationType`: TOXICITY, EFFICACY, CLINICAL_PATHOLOGY
- `CustomerGrade`: LEAD → PROSPECT → CUSTOMER → VIP / INACTIVE

---

## 4. 백엔드 아키텍처

### 라우트 구조 (42개 라우트 파일)
`backend/src/index.ts`에서 Express app에 마운트. 모든 API는 `/api/` 접두사.

| 카테고리 | 라우트 | 설명 |
|----------|--------|------|
| 인증 | `/api/auth` | 로그인, 회원가입, 토큰 갱신, 로그아웃 |
| 리드 | `/api/leads` | CRUD, 상태변경, 파이프라인 이동 |
| 파이프라인 | `/api/pipeline` | 파이프라인 단계 관리, 칸반 뷰 |
| 견적 | `/api/quotations` | 독성/효력 견적서 CRUD |
| 임상병리 | `/api/clinical-pathology` | 임상병리 견적서, 시험의뢰서 |
| 계약 | `/api/contracts` | 계약 CRUD, 상태관리 |
| 시험 | `/api/studies` | 시험 CRUD, 상태변경, 접수연결 |
| 시험대시보드 | `/api/study-dashboard` | 가동률, 지연시험, 보고서현황, 캘린더 |
| 고객 | `/api/customers` | 고객 CRUD, 등급관리 |
| 고객확장 | `/api/customer-tags`, `notes`, `documents`, `health`, `audit`, `analytics` | CRM 확장 기능 |
| 통합고객 | `/api/unified-customers` | 통합 고객 조회 |
| 상담 | `/api/consultations` | 상담기록 CRUD |
| 대시보드 | `/api/dashboard` | KPI, 통계 |
| 분석 | `/api/analytics` | 매출분석, 전환율 |
| 자동화 | `/api/automation` | 자동화 규칙 CRUD, 실행 |
| 검색 | `/api/search` | 통합 검색 |
| 엑셀 | `/api/excel` | 엑셀 가져오기/내보내기 |
| 마스터데이터 | `/api/master` | 독성시험, 효력모델, 모달리티 |
| 독성V2 | `/api/toxicity-v2` | 독성시험 V2 데이터 |
| 패키지 | `/api/packages` | 패키지 템플릿 |
| 설정 | `/api/settings`, `/api/user-settings`, `/api/user-code` | 사용자/시스템 설정 |
| 알림 | `/api/notifications`, `/api/push` | 알림, PWA 푸시 |
| 공지 | `/api/announcements` | 공지사항 CRUD, 댓글 |
| 리포트 | `/api/reports` | 리포트 정의, 내보내기 |
| 관리자 | `/api/admin` | 사용자관리, 백업, 시스템설정 |
| 결제 | `/api/payment-schedules` | 지급일정 관리 |
| 칸반 | `/api/kanban` | 칸반 뷰 설정 |
| 활동 | `/api/activities` | 통합 활동 타임라인 |
| 필터 | `/api/filter-presets` | 저장된 필터 프리셋 |
| 커스텀필드 | `/api/custom-fields` | 커스텀 필드 정의/값 |
| 데이터품질 | `/api/data-quality` | 데이터 품질 점수 |

### 서비스 레이어 (44개 서비스 파일)
라우트 → 서비스 패턴. 비즈니스 로직은 서비스에 집중.

### 미들웨어
- `auth.ts`: JWT 인증 (`authenticate`), 관리자 권한 (`requireAdmin`)
- `errorHandler.ts`: Prisma/Zod/AppError 분류별 에러 핸들링, 한국어 메시지
- `rateLimiter.ts`: API 요청 제한
- `logger.ts`: 요청 로깅
- `activityLogger.ts`: 활동 기록
- `validation.ts`: 입력 검증

### 서버 시작 시 자동 실행
1. 파이프라인 기본 단계 자동 초기화 (`pipelineInitializationService`)
2. 릴리즈 노트 → 공지사항 자동 동기화 (`syncReleaseNotes`)

---

## 5. 프론트엔드 아키텍처

### 라우팅 구조 (Next.js App Router)
3개 레이아웃 그룹:

```
app/
├── (auth)/          ← 인증 페이지 (로그인, 회원가입, 웰컴)
│   ├── login/
│   ├── register/
│   └── welcome/
├── (dashboard)/     ← 메인 앱 (ProtectedRoute로 보호)
│   ├── dashboard/
│   ├── leads/           [목록, 상세, 신규]
│   ├── pipeline/
│   ├── customers/       [목록, 상세]
│   ├── quotations/      [목록, 상세, 신규, 워크플로우]
│   ├── efficacy-quotations/ [목록, 상세, 신규]
│   ├── contracts/       [목록, 상세]
│   ├── contract/new/
│   ├── studies/         [목록+대시보드, 상세]
│   ├── consultations/
│   ├── consultation/new/
│   ├── clinical-pathology/ [견적, 시험의뢰서, 설정]
│   ├── announcements/   [목록, 상세]
│   ├── search/
│   ├── calendar/
│   ├── calculators/     [7종 계산기]
│   ├── packages/
│   ├── reports/
│   ├── sales/
│   └── settings/
└── (admin)/         ← 관리자 전용
    └── admin/
        ├── users/
        ├── announcements/
        ├── automation/
        ├── logs/
        ├── sales/
        └── settings/
```

### 컴포넌트 구조 (18개 디렉토리)
```
components/
├── admin/           ← 관리자 패널 (자동화, 백업, 실행로그)
├── analytics/       ← 분석 차트 (미진행사유 통계)
├── announcement/    ← 공지사항 배너/모달
├── auth/            ← ProtectedRoute
├── calendar/        ← 캘린더 뷰
├── consultation/    ← 상담기록 폼
├── contract/        ← 계약 결제폼, 지급일정
├── customer/        ← 고객 목록 (KPI, 칸반, 테이블, 필터, 검색, 가져오기/내보내기)
├── customer-detail/ ← 고객 상세 (개요, 의뢰자, 미팅, 시험접수, 계약, 메모, 감사로그)
├── dashboard/       ← 대시보드 (개인/회사, 통계카드)
├── efficacy-quotation/ ← 효력시험 견적 위저드
├── excel/           ← 엑셀 가져오기/내보내기
├── icons/           ← 커스텀 아이콘
├── kanban/          ← 칸반 보드
├── layout/          ← Sidebar, Header, MobileNav, MobileBottomNav
├── lead/            ← 리드 관련 (미진행사유 다이얼로그)
├── mobile/          ← 모바일 전용 (리드 카드/폼)
├── notification/    ← 알림
├── pdf/             ← PDF 생성
├── providers/       ← QueryProvider, ThemeProvider, AuthProvider
├── quotation/       ← 견적서 공통 (고객선택, 미리보기, 코드가드)
├── settings/        ← 설정 (사용자코드, 푸시알림)
├── skeletons/       ← 로딩 스켈레톤
├── timeline/        ← 타임라인
├── toxicity-v2/     ← 독성시험 V2 (시험선택, 가격, 미리보기)
├── ui/              ← shadcn/ui 기본 컴포넌트
└── workflow-quotation/ ← 워크플로우 견적
```

### 상태관리 (7개 Zustand 스토어)
| 스토어 | 용도 |
|--------|------|
| `authStore` | 인증 상태, 사용자 정보, 토큰 관리 |
| `quotationStore` | 독성 견적서 작성 상태 |
| `efficacyQuotationStore` | 효력 견적서 작성 상태 |
| `workflowQuotationStore` | 워크플로우 견적 상태 |
| `customerStore` | 고객 목록 필터/정렬 상태 |
| `customerManagementStore` | 고객 관리 확장 상태 |
| `toxicityV2Store` | 독성시험 V2 선택/가격 상태 |

### API 클라이언트 레이어 (`lib/`)
- `api-utils.ts`: 핵심 fetch 래퍼 (토큰 자동 첨부, 401 시 갱신 재시도, 네트워크 에러 시 3초 후 1회 재시도)
- `api.ts`: GET/POST/PUT/DELETE 헬퍼
- `auth-api.ts`: 인증 API
- 도메인별 API 클라이언트 30+ 파일 (`lead-api.ts`, `contract-api.ts`, `study-api.ts` 등)

---

## 6. 핵심 비즈니스 워크플로우

### Lead → Quotation → Contract → Study 파이프라인

```
1. 리드 생성 (/leads/new)
   └── 파이프라인 단계 자동 배정 (PipelineStage)
   └── 리드 활동 기록 (LeadActivity)

2. 견적서 작성 (/quotations/new?leadId=X)
   ├── 독성시험 견적 (ToxicityTest 기반)
   ├── 효력시험 견적 (EfficacyModel + PriceItem 기반)
   └── 임상병리 견적 (ClinicalTestItem 기반)

3. 계약 체결 (/contract/new?quotationId=X)
   └── 견적서 데이터 자동 로드
   └── 지급일정 생성 (PaymentSchedule)

4. 시험 관리 (/studies)
   └── 계약에서 시험 생성
   └── 시험접수(TestReception) 연결
   └── 상태 진행: 접수 → 준비 → 진행 → 분석 → 보고서 → 완료
```

### 고객 등급 자동 전환
- LEAD (문의) → PROSPECT (견적발송) → CUSTOMER (계약체결) → VIP
- `LifecycleTransition` 모델로 이력 추적

### 자동화 엔진
- `AutomationRule` + `AutomationAction` + `AutomationExecution`
- 트리거: 상태변경, 날짜도달, 항목생성/수정, 필드변경, 스케줄
- 액션: 알림발송, 이메일, 상태업데이트, 담당자배정, 태스크생성

---

## 7. 인증 흐름

```
[로그인] → POST /api/auth/login
  → JWT access token (15분) + refresh token (7일) 발급
  → localStorage에 저장

[API 요청] → Authorization: Bearer {accessToken}
  → 401 응답 시 → POST /api/auth/refresh로 토큰 갱신
  → 갱신 실패 시 → /login으로 리다이렉트

[보호] 
  → 서버: Next.js middleware (쿠키 기반, 느슨한 체크)
  → 클라이언트: ProtectedRoute 컴포넌트 (localStorage 기반, 8초 타임아웃)
  → API: Express authenticate 미들웨어 (JWT 검증)

[보안]
  → 계정 잠금: 5회 실패 시 30분 잠금
  → 비활동 로그아웃: 30분 (useInactivityLogout)
  → Helmet, CORS, Rate Limiter
```

---

## 8. 견적 시스템 상세

### 독성시험 견적 (V1 + V2)
- V1: `ToxicityTest` 마스터데이터 기반, 카테고리/종/투여경로별 시험 선택
- V2: `ToxicityV2Item` + 관계(relation) + 오버레이(overlay) 기반 고급 가격 엔진
  - 모드별 시험 데이터 (toxicityData, healthFoodData, cosmeticsData, medicalDeviceData 등)
  - 가격 엔진 (`priceEngine.ts`): 투여경로별 가격, 회복시험 연동, TK 옵션
  - 프론트엔드 전용 데이터 (`lib/toxicity-v2/data/`)

### 효력시험 견적
- `EfficacyModel` (질환모델) + `EfficacyPriceItem` (단가항목) 기반
- 위저드 형태: 기본정보 → 모델선택 → 항목선택 → 일정 → 미리보기

### 임상병리 견적
- `ClinicalTestItem` 마스터 (CBC, DIFF, 혈액생화학 등)
- 견적서 → 시험의뢰서 전환 기능
- QC 비용 자동 계산 (`ClinicalQcSetting`)

### 견적번호 체계
- 사용자코드 기반: `{userCode}-{type}{seq}` (예: KIM-T001, KIM-E001)
- `UserSettings.userCode` + `nextQuotationSeq`로 관리
- `QuotationCodeGuard` 컴포넌트로 코드 미설정 시 차단

---

## 9. 마스터데이터

### 프론트엔드 정적 데이터 (`chemon-quotation/data/`)
- `toxicity_master_data.json`: 독성시험 마스터
- `efficacy_master_data.json`: 효력시험 마스터
- `modalities.json`, `modalities_hierarchy.json`: 모달리티 계층
- `package_templates.json`: 패키지 템플릿
- `workflow_stages.json`: 워크플로우 단계

### 백엔드 시드 데이터
- `seed.ts`: 기본 시드 (관리자 계정)
- `seed-master-data.ts`: 독성/효력 마스터데이터 시드
- `seed-clinical-pathology.ts`: 임상병리 검사항목 시드
- `seed-v2-data.ts`: 독성 V2 데이터 시드

---

## 10. PWA 및 모바일

- `next-pwa` 설정: 이미지/폰트 CacheFirst, API NetworkOnly, JS/CSS StaleWhileRevalidate
- `manifest.json`: 앱 이름, 아이콘, 테마색상
- `MobileBottomNav`: 하단 5탭 (대시보드, 견적, 고객, 검색, 더보기)
- `MobileNav`: Sheet 기반 전체 메뉴 (더보기 탭에서 열림)
- 모바일 전용 컴포넌트: `MobileLeadCard`, `MobileLeadForm`
- 반응형: 모든 목록 페이지에 모바일 카드 + 데스크톱 테이블 이중 레이아웃

---

## 11. 테스트

### 백엔드 (`backend/__tests__/`)
- 단위 테스트: `backupService`, `leadLostReason`, `quotationNumberService`, `userCodeValidator`, `testReceptionApi`, `backupDownload`, `backupRestore`, `userCodeRoute`
- 속성 기반 테스트 (fast-check): `automation`, `backup`, `contractPayment`, `crm-integration`, `lead-conversion`, `leadNumberService`, `lostReason`, `pipelineInitialization`, `pushNotification`, `quotationNumberService`, `testReception`, `unifiedCustomer`, `userCodeValidator`, `workflowAutomation`, `code-change-impact`
- 통합 테스트: `userCodeAndLead`

### 프론트엔드 (`chemon-quotation/__tests__/`)
- 단위/통합: 캘린더 이벤트, 고객 데이터 조인, 효력 견적 계산/설정/모델/복사/번호/필터/검증, 세금계산서, 미팅기록, 진행단계, 의뢰자, 시험접수, 긴급항목
- 속성 기반: toxicity-v2 (데이터무결성, 필터링, 가격엔진, 스토어), CRM 통합, 오프라인 캐시, 견적코드가드, 통합견적미리보기, 통합고객카드

---

## 12. CI/CD 및 운영

### GitHub Actions
- `automation-scheduler.yml`: 자동화 규칙 스케줄 실행
- `backup-scheduler.yml`: 정기 백업
- `db-backup.yml`: DB 백업

### 배포 파이프라인
- 프론트엔드: GitHub push → Vercel 자동 빌드/배포
- 백엔드: GitHub push → Render 자동 빌드/배포 (`render.yaml`)
  - 빌드: `npm install && npx prisma generate && npm run build`
  - 시작: `npx prisma migrate deploy && npm run start`

### 백업/복원
- `backend/scripts/export-db.ts`: DB 전체 내보내기 (JSON)
- `backend/scripts/import-db.ts`: DB 가져오기
- `backend/scripts/restore-backup.sh`: 백업 복원 스크립트
- 관리자 UI에서 백업 관리 가능 (`BackupManagement`, `BackupRestoreDialog`)

---

## 13. 디자인 시스템

`.kiro/steering/design-guidelines.md`에 정의:

- Primary: Slate 기반 중성톤 + 절제된 블루 액센트 (HSL 220 60% 50%)
- 그라데이션/파스텔/glass morphism 금지
- 카드: `border shadow-sm` (shadow-lg 금지)
- hover: `bg-muted` 또는 border 변경만 (translate/lift 금지)
- 타이포: `text-lg font-semibold` 제목, `text-sm` 본문
- 참고 디자인: 리드 상세 페이지 (`/leads/[id]`)

---

## 14. 프로젝트 구조 요약

```
/
├── backend/                    ← Express + Prisma 백엔드
│   ├── prisma/schema.prisma   ← 50+ 모델 정의
│   ├── src/
│   │   ├── routes/            ← 42개 API 라우트
│   │   ├── services/          ← 44개 비즈니스 서비스
│   │   ├── middleware/        ← 인증, 에러핸들링, 로깅, 레이트리밋
│   │   ├── types/             ← 13개 타입 정의
│   │   └── index.ts           ← Express 앱 진입점
│   ├── __tests__/             ← 단위/속성/통합 테스트
│   ├── scripts/               ← DB 내보내기/가져오기
│   └── release-notes/         ← 릴리즈 노트 JSON
│
├── chemon-quotation/           ← Next.js 14 프론트엔드
│   ├── app/                   ← App Router 페이지 (30+ 라우트)
│   ├── components/            ← 18개 디렉토리, 100+ 컴포넌트
│   ├── lib/                   ← API 클라이언트 30+, 유틸리티
│   ├── stores/                ← Zustand 스토어 7개
│   ├── hooks/                 ← 커스텀 훅 15개
│   ├── types/                 ← 타입 정의 13개
│   ├── data/                  ← 정적 마스터데이터 JSON
│   └── __tests__/             ← 프론트엔드 테스트
│
├── .kiro/                      ← Kiro 설정
│   ├── specs/                 ← 12개 기능 스펙 문서
│   └── steering/              ← 디자인 가이드라인
│
├── .github/workflows/          ← CI/CD (자동화, 백업)
└── render.yaml                 ← Render 배포 설정
```

---

## 15. 알려진 제약사항 및 주의점

1. Render free plan 콜드 스타트: 15분 비활동 시 서버 슬립. `api-utils.ts`에서 3초 후 1회 재시도로 대응.
2. Next.js middleware는 쿠키 기반 인증만 가능 (localStorage 접근 불가). 실제 인증은 클라이언트 `ProtectedRoute`에서 처리.
3. `eslint.ignoreDuringBuilds: true` — ESLint 에러가 빌드를 막지 않음.
4. `typescript.ignoreBuildErrors: false` — TypeScript 에러는 빌드 실패 유발.
5. ContractStatus에 'ACTIVE' 없음 — 'IN_PROGRESS' 사용.
6. PaymentSchedule은 `scheduledDate` 사용 (`dueDate` 아님).
7. Customer 모델에 `assignedUserId` 없음 — `userId` (생성자) 사용.
8. 독성 V2 데이터는 프론트엔드 정적 파일 + 백엔드 DB 이중 관리.
