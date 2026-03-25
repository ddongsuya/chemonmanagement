# CRM 시험 관리 시스템 개발 프롬프트

> Kiro AI 또는 Claude에 아래 프롬프트 전체를 붙여넣고,
> 현재 코드베이스의 schema.prisma + 프로젝트 구조를 함께 제공하세요.

---

## 프롬프트

```
당신은 비임상 CRO(코아스템켐온) CRM Management 웹앱의 시니어 풀스택 개발자입니다.

## 기술 스택
- Frontend: Next.js 14.2.3 + TypeScript + Tailwind CSS + Zustand + React Query + Radix UI
- Backend: Express + TypeScript + Prisma + PostgreSQL
- 차트: recharts
- 배포: Vercel (FE) + Render (BE + DB)

## 작업 목표
계약 체결된 프로젝트의 **시험(Study) 단위 관리 시스템**을 구축합니다.
사업개발 담당자가 시험관리팀으로부터 시험 접수 안내를 받으면,
해당 시험 목록을 CRM에 등록하고, 각 시험별로 문서 송부 이력(시험계획서, 변경기록지, 보고서 등)을
시간순으로 추적하며 타임라인으로 시각화합니다.

---

## 1. 비즈니스 워크플로우

```
[사업개발 담당자] 시험 접수 요청 → [시험관리팀]
                                    ↓
[시험관리팀] 시험 접수 안내 회신 → [사업개발 담당자]
  (포함 정보: 물질코드, 프로젝트코드, 시험물질, 의뢰기관, 시험번호, 시험제목, 시험책임자)
                                    ↓
[사업개발 담당자] CRM에 시험 목록 등록 (접수 연월 기록)
                                    ↓
[사업개발 담당자] 각 시험별로 문서 송부 이력을 지속 기록:
  - 논의 단계 기록
  - 시험계획서 송부 (1차 검토 → 2차 검토 → 최종본)
  - 변경기록지 송부 (발생 시마다 계속 추가)
  - 시험중단기록지
  - 시험중단보고서
  - 최종보고서 (안 → 최종본)
                                    ↓
[CRM] 시험별 문서 이력을 타임라인으로 시각화
```

**핵심**: 시험 접수 안내에 포함된 시험 목록이 관리 단위이고,
각 시험에 대한 문서 송부 기록이 시간순으로 누적되는 구조입니다.

---

## 2. 데이터 모델 (Prisma)

### 2-1. Enum 정의

```prisma
// 시험 진행 상태
enum StudyStatus {
  IN_PROGRESS    // 진행중
  ON_HOLD        // 홀딩
  SUSPENDED      // 중단
  COMPLETED      // 완료
}

// 문서 유형 (시험에서 발생하는 모든 문서 카테고리)
enum StudyDocumentType {
  DISCUSSION          // 논의 (미팅, 전화, 이메일 등 자유 기록)
  PROTOCOL            // 시험계획서
  AMENDMENT           // 변경기록지
  SUSPENSION_RECORD   // 시험중단기록지
  SUSPENSION_REPORT   // 시험중단보고서
  FINAL_REPORT        // 최종보고서
}

// 문서 버전/단계
enum DocumentVersion {
  FIRST_DRAFT         // 1차 (검토)
  SECOND_DRAFT        // 2차 (검토)
  THIRD_DRAFT         // 3차 (검토)
  DRAFT_FINAL         // 안 (최종보고서 안)
  FINAL               // 최종본
  N_A                 // 해당없음 (변경기록지, 논의 등 버전 구분 불필요 시)
}
```

### 2-2. Study 모델 (시험)

시험관리팀에서 받은 시험 접수 안내의 각 행에 해당합니다.

```prisma
model Study {
  id              String        @id @default(uuid())
  
  // 프로젝트 연결
  projectId       String
  project         Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  // 시험 접수 안내에서 받은 정보 (첨부파일 표 기준)
  substanceCode   String        // 물질코드 (예: "C-6849")
  projectCode     String        // 프로젝트코드 (예: "CP25-083")
  testSubstance   String        // 시험물질 (예: "Pearl-101")
  sponsor         String        // 의뢰기관 (예: "Pearlsinmires Co., Ltd.")
  studyCode       String        @unique  // 시험번호 (예: "25-NV-0194")
  studyTitle      String        // 시험제목 (예: "투여물질의 조제물 분석")
  studyDirector   String        // 시험책임자 (예: "김지현B")
  
  // 등록 시점 기록
  registeredYear  Int           // 등록 연도 (예: 2025)
  registeredMonth Int           // 등록 월 (예: 4)
  
  // 상태 관리
  status          StudyStatus   @default(IN_PROGRESS)
  
  // 문서 송부 이력 (1:N)
  documents       StudyDocument[]
  
  // 담당자 (로그인한 사업개발 담당자)
  userId          String
  user            User          @relation(fields: [userId], references: [id])
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([projectId])
  @@index([userId])
  @@index([studyCode])
}
```

### 2-3. StudyDocument 모델 (문서 송부 이력)

시험에 대해 발생하는 모든 문서 송부/논의 기록입니다.
시간순으로 쌓이며, 이것이 타임라인의 데이터 소스가 됩니다.

```prisma
model StudyDocument {
  id              String              @id @default(uuid())
  
  // 시험 연결
  studyId         String
  study           Study               @relation(fields: [studyId], references: [id], onDelete: Cascade)
  
  // 문서 정보
  documentType    StudyDocumentType   // 논의, 시험계획서, 변경기록지, 중단기록지, 중단보고서, 최종보고서
  version         DocumentVersion     // 1차, 2차, 3차, 안, 최종, 해당없음
  
  // 송부 시점 (연월 단위로 기록)
  sentYear        Int                 // 송부 연도 (예: 2025)
  sentMonth       Int                 // 송부 월 (예: 6)
  sentDate        DateTime?           // 정확한 일자 (선택사항, 알면 기록)
  
  // 자유 코멘트
  comment         String?             // 예: "고객사 검토 의견 반영", "분석법 이슈로 홀딩 요청"
  
  // 기록자 (로그인한 사업개발 담당자)
  createdBy       String
  creator         User                @relation(fields: [createdBy], references: [id])
  
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  @@index([studyId, sentYear, sentMonth])
  @@index([studyId, documentType])
}
```

---

## 3. API 엔드포인트

### 3-1. 시험 관리 (Study)

```
GET    /api/projects/:projectId/studies          시험 목록 조회
POST   /api/projects/:projectId/studies          시험 등록 (단건 또는 다건 일괄)
PUT    /api/studies/:studyId                     시험 정보 수정
PATCH  /api/studies/:studyId/status              시험 상태 변경
DELETE /api/studies/:studyId                     시험 삭제
```

**시험 등록 (POST) - 일괄 등록 지원**

시험관리팀에서 받은 접수 안내에 여러 시험이 포함되므로,
한 번에 여러 시험을 등록할 수 있어야 합니다.

```typescript
// Request Body (다건)
{
  "studies": [
    {
      "substanceCode": "C-6849",
      "projectCode": "CP25-083",
      "testSubstance": "Pearl-101",
      "sponsor": "Pearlsinmires Co., Ltd.",
      "studyCode": "25-NV-0194",
      "studyTitle": "투여물질의 조제물 분석",
      "studyDirector": "김지현B",
      "registeredYear": 2025,
      "registeredMonth": 4
    },
    {
      "substanceCode": "C-6849",
      "projectCode": "CP25-083",
      "testSubstance": "Pearl-101",
      "sponsor": "Pearlsinmires Co., Ltd.",
      "studyCode": "25-RR-0195",
      "studyTitle": "랫드 2주 DRF 시험 (정맥)",
      "studyDirector": "정보교",
      "registeredYear": 2025,
      "registeredMonth": 4
    }
    // ... 나머지 시험들
  ]
}
```

### 3-2. 문서 송부 이력 (StudyDocument)

```
GET    /api/studies/:studyId/documents           해당 시험의 문서 이력 조회
POST   /api/studies/:studyId/documents           문서 송부 기록 추가
PUT    /api/documents/:documentId                기록 수정
DELETE /api/documents/:documentId                기록 삭제
```

### 3-3. 타임라인 (프로젝트 전체)

```
GET    /api/projects/:projectId/timeline         프로젝트 내 모든 시험의 문서 이력을 통합 타임라인으로 조회
```

**Query Parameters:**
- `studyCode` (optional): 특정 시험번호로 필터
- `documentType` (optional): 특정 문서 유형으로 필터
- `year`, `month` (optional): 특정 연월로 필터

**Response 구조:**
```typescript
interface TimelineResponse {
  // 월별로 그룹핑된 이벤트
  months: {
    year: number;
    month: number;
    label: string;          // "2025년 6월"
    events: {
      id: string;
      studyCode: string;
      studyTitle: string;
      studyDirector: string;
      documentType: StudyDocumentType;
      version: DocumentVersion;
      comment: string | null;
      sentDate: string | null;
      isAlert: boolean;     // 중단 관련이면 true
    }[];
  }[];
  
  // 요약 통계
  summary: {
    totalStudies: number;
    totalDocuments: number;
    byDocumentType: Record<StudyDocumentType, number>;
    byStatus: Record<StudyStatus, number>;
  };
  
  // 필터용 시험 목록
  studyList: {
    studyCode: string;
    studyTitle: string;
    studyDirector: string;
    status: StudyStatus;
    documentCount: number;
  }[];
}
```

---

## 4. 프론트엔드 구성

### 4-1. 페이지/컴포넌트 구조

```
src/
├── app/
│   └── projects/
│       └── [projectId]/
│           └── studies/
│               ├── page.tsx                      // 시험 목록 + 타임라인 페이지
│               └── [studyId]/
│                   └── page.tsx                  // 시험 상세 (해당 시험의 문서 이력)
├── components/
│   └── study/
│       ├── StudyListTable.tsx                    // 시험 목록 테이블
│       ├── StudyRegisterModal.tsx                // 시험 등록 모달 (일괄 등록)
│       ├── StudyDetailCard.tsx                   // 시험 상세 카드
│       ├── StudyStatusBadge.tsx                  // 상태 뱃지 (진행/중단/홀딩/완료)
│       ├── DocumentAddModal.tsx                  // 문서 송부 기록 추가 모달
│       ├── DocumentHistoryList.tsx               // 문서 이력 리스트 (시험 상세 내)
│       ├── ProjectTimeline.tsx                   // 프로젝트 전체 타임라인 (메인)
│       ├── TimelineSummaryCards.tsx              // 요약 카드 (시험 수, 문서 수, 보고서, 이슈)
│       ├── TimelineFilterChips.tsx              // 시험번호별 필터 칩
│       ├── TimelineMonthGroup.tsx               // 월별 이벤트 그룹
│       └── TimelineEventCard.tsx                // 개별 이벤트 카드
├── hooks/
│   ├── useStudies.ts                            // 시험 CRUD React Query 훅
│   ├── useStudyDocuments.ts                     // 문서 이력 CRUD 훅
│   └── useProjectTimeline.ts                    // 타임라인 조회 훅
├── stores/
│   └── studyStore.ts                            // Zustand (필터 상태, 선택된 시험 등)
└── types/
    └── study.ts                                 // TypeScript 타입 정의
```

### 4-2. 화면 구성 (프로젝트 > 시험 관리 페이지)

```
┌─────────────────────────────────────────────────┐
│ 프로젝트: Pearlsinmires - Pearl-101             │
│ CP25-083                                         │
├─────────────────────────────────────────────────┤
│                                                  │
│  [탭: 시험 목록]  [탭: 타임라인]                  │
│                                                  │
│  ── 시험 목록 탭 ──                              │
│  ┌────────────────────────────────────────────┐  │
│  │ [+ 시험 등록]                    검색 필터  │  │
│  ├────┬────────┬──────────┬────────┬─────────┤  │
│  │시험 │시험제목  │시험책임자 │ 상태   │문서 수  │  │
│  │번호 │         │          │        │         │  │
│  ├────┼────────┼──────────┼────────┼─────────┤  │
│  │25-NV│투여물질의│김지현B   │ 진행중 │ 5건 →  │  │
│  │-0194│조제물분석│          │        │         │  │
│  ├────┼────────┼──────────┼────────┼─────────┤  │
│  │25-RR│랫드 2주 │정보교    │ 중단   │ 3건 →  │  │
│  │-0195│DRF시험  │          │        │         │  │
│  └────┴────────┴──────────┴────────┴─────────┘  │
│                                                  │
│  ── 타임라인 탭 ──                               │
│  ┌─ 요약 ────────────────────────────────────┐  │
│  │ 시험 8건 │ 문서 24건 │ 보고서 2건 │ 이슈 2건│  │
│  └──────────────────────────────────────────-┘  │
│                                                  │
│  ┌─ 필터 칩 ─────────────────────────────────┐  │
│  │ [25-NV-0194] [25-RR-0195] [25-DA-0198]... │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  ● 2025년 4월                                    │
│  │  ┌───────────────────────────────────┐       │
│  │  │ 시험 접수 등록 (8건)               │       │
│  │  └───────────────────────────────────┘       │
│  │                                               │
│  ● 2025년 5월                                    │
│  │  ┌───────────────────────────────────┐       │
│  │  │ [25-RR-0195] 시험계획서 1차 송부   │       │
│  │  └───────────────────────────────────┘       │
│  │                                               │
│  ● 2025년 6월                                    │
│  │  ┌───────────────────────────────────┐       │
│  │  │ [25-NV-0194] 시험계획서 1차 송부   │       │
│  │  │ 코멘트: 초안 검토 요청             │       │
│  │  ├───────────────────────────────────┤       │
│  │  │ [25-DA-0198] 시험계획서 1차 송부   │       │
│  │  ├───────────────────────────────────┤       │
│  │  │ [25-NV-0194] 시험계획서 2차 송부   │       │
│  │  │ 코멘트: 고객사 의견 반영            │       │
│  │  └───────────────────────────────────┘       │
│  │                                               │
│  ● 2025년 7월                                    │
│  │  ┌───────────────────────────────────┐       │
│  │  │ ⚠ [25-RR-0195] 시험중단 변경기록지│       │
│  │  │ 코멘트: DRF 결과 기반 프로토콜 변경│       │
│  │  └───────────────────────────────────┘       │
│  ...                                             │
└─────────────────────────────────────────────────┘
```

### 4-3. 시험 상세 페이지 (시험번호 클릭 시)

```
┌─────────────────────────────────────────────────┐
│ ← 시험 목록                                      │
│                                                  │
│  시험번호: 25-NV-0194                            │
│  시험제목: 투여물질의 조제물 분석                  │
│  시험책임자: 김지현B │ 상태: 진행중               │
│  등록: 2025년 4월                                │
│                                                  │
│  [+ 기록 추가]                    [상태 변경 ▾]  │
│                                                  │
│  ── 문서 송부 이력 ──                            │
│                                                  │
│  ● 2025년 6월                                    │
│  │  시험계획서 1차 │ 코멘트: 초안 검토 요청       │
│  │  시험계획서 2차 │ 코멘트: 고객사 의견 반영     │
│  │                                               │
│  ● 2025년 7월                                    │
│  │  변경기록지     │ 코멘트: 투여경로 변경 반영   │
│  │                                               │
│  ● 2025년 8월                                    │
│  │  변경기록지     │ 코멘트: 분석법 추가          │
│  ...                                             │
└─────────────────────────────────────────────────┘
```

### 4-4. 문서 기록 추가 모달

```
┌──────────────────────────────────┐
│ 문서 송부 기록 추가               │
│                                  │
│ 시험: 25-NV-0194                 │
│                                  │
│ 문서 유형 *                      │
│ ┌──────────────────────────────┐ │
│ │ ▾ 시험계획서                  │ │
│ └──────────────────────────────┘ │
│ (논의 / 시험계획서 / 변경기록지 / │
│  중단기록지 / 중단보고서 /       │
│  최종보고서)                     │
│                                  │
│ 버전 *                           │
│ ┌──────────────────────────────┐ │
│ │ ▾ 1차                        │ │
│ └──────────────────────────────┘ │
│ (1차 / 2차 / 3차 / 안 / 최종 /  │
│  해당없음)                       │
│                                  │
│ 송부 연월 *                      │
│ ┌──────┐ ┌──────┐               │
│ │ 2025 │ │  6   │ 월            │
│ └──────┘ └──────┘               │
│                                  │
│ 송부 일자 (선택)                 │
│ ┌──────────────────────────────┐ │
│ │ 날짜 선택                     │ │
│ └──────────────────────────────┘ │
│                                  │
│ 코멘트 (선택)                    │
│ ┌──────────────────────────────┐ │
│ │ 예: 고객사 검토 의견 반영     │ │
│ │                              │ │
│ └──────────────────────────────┘ │
│                                  │
│         [취소]  [저장]           │
└──────────────────────────────────┘
```

### 4-5. 시각 디자인

#### 시험번호 색상 매핑 (시험 유형 prefix 기반)
```typescript
const STUDY_TYPE_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  'NV': { text: '#185FA5', bg: '#E6F1FB', border: '#85B7EB' },   // 조제물 분석 (blue)
  'RR': { text: '#993C1D', bg: '#FAECE7', border: '#F0997B' },   // 랫드 반복투여 (coral)
  'RV': { text: '#3B6D11', bg: '#EAF3DE', border: '#97C459' },   // 랫드 Validation (green)
  'DA': { text: '#3C3489', bg: '#EEEDFE', border: '#AFA9EC' },   // 비글 단회투여 (purple)
  'DR': { text: '#534AB7', bg: '#EEEDFE', border: '#CECBF6' },   // 비글 반복투여 (purple-light)
  'DV': { text: '#085041', bg: '#E1F5EE', border: '#5DCAA5' },   // 비글 Validation (teal)
  'GL': { text: '#633806', bg: '#FAEEDA', border: '#FAC775' },   // 광독성 (amber)
};

// prefix 추출: "25-NV-0194" → "NV"
function getStudyTypePrefix(studyCode: string): string {
  const parts = studyCode.split('-');
  return parts.length >= 2 ? parts[1] : 'DEFAULT';
}
```

#### 문서 유형별 라벨/색상
```typescript
const DOCUMENT_TYPE_CONFIG = {
  DISCUSSION:        { label: '논의',         color: 'gray' },
  PROTOCOL:          { label: '시험계획서',    color: 'blue' },
  AMENDMENT:         { label: '변경기록지',    color: 'amber' },
  SUSPENSION_RECORD: { label: '시험중단기록지', color: 'red', isAlert: true },
  SUSPENSION_REPORT: { label: '시험중단보고서', color: 'red', isAlert: true },
  FINAL_REPORT:      { label: '최종보고서',    color: 'green' },
};
```

#### 시험 상태 뱃지
```typescript
const STUDY_STATUS_CONFIG = {
  IN_PROGRESS: { label: '진행중', color: 'blue' },
  ON_HOLD:     { label: '홀딩',   color: 'amber' },
  SUSPENDED:   { label: '중단',   color: 'red' },
  COMPLETED:   { label: '완료',   color: 'green' },
};
```

---

## 5. 주요 UX 흐름

### 5-1. 시험 등록 흐름
1. 프로젝트 상세 → "시험 관리" 메뉴 진입
2. [+ 시험 등록] 클릭
3. 시험관리팀에서 받은 정보를 입력 (물질코드, 프로젝트코드, 시험물질, 의뢰기관, 시험번호, 시험제목, 시험책임자)
4. 등록 연월 선택 (기본값: 현재 연월)
5. 저장 → 시험 목록에 추가

**참고**: 일괄 등록을 지원하여 여러 시험을 한 번에 등록할 수 있게 합니다.
시험관리팀에서 받는 접수 안내에는 보통 여러 시험이 포함되므로,
행 추가/삭제가 가능한 테이블 형태의 입력 UI를 고려합니다.
물질코드, 프로젝트코드, 시험물질, 의뢰기관은 프로젝트 내에서 동일하므로
첫 행 입력 후 자동 복사되도록 합니다.

### 5-2. 문서 기록 추가 흐름
1. 시험 목록에서 특정 시험 클릭 → 시험 상세 페이지
2. [+ 기록 추가] 클릭
3. 문서 유형 선택 (논의/시험계획서/변경기록지/중단기록지/중단보고서/최종보고서)
4. 버전 선택 (1차/2차/3차/안/최종/해당없음)
   - 문서 유형에 따라 선택 가능한 버전이 달라짐:
     - 시험계획서: 1차, 2차, 3차, 최종
     - 변경기록지: 해당없음 (N회 반복이므로 자동 번호 부여)
     - 최종보고서: 안, 최종
     - 논의/중단기록지/중단보고서: 해당없음
5. 송부 연월 입력 (필수)
6. 송부 일자 입력 (선택)
7. 코멘트 입력 (선택)
8. 저장

### 5-3. 타임라인 조회 흐름
1. 프로젝트 상세 → "타임라인" 탭 클릭
2. 프로젝트 내 모든 시험의 문서 이력이 월별로 그룹핑되어 표시
3. 상단 필터 칩으로 특정 시험만 필터링 가능
4. 중단/홀딩 관련 이벤트는 빨간 배경의 알림 스타일로 강조
5. 각 이벤트 카드에 코멘트가 있으면 함께 표시

---

## 6. 타임라인 렌더링 로직 (프론트엔드)

```typescript
// 타임라인 데이터를 월별로 그룹핑하는 로직
function groupByMonth(events: TimelineEvent[]): MonthGroup[] {
  const groups = new Map<string, TimelineEvent[]>();
  
  events.forEach(event => {
    const key = `${event.sentYear}-${String(event.sentMonth).padStart(2, '0')}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(event);
  });
  
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, events]) => ({
      year: parseInt(key.split('-')[0]),
      month: parseInt(key.split('-')[1]),
      label: `${key.split('-')[0]}년 ${parseInt(key.split('-')[1])}월`,
      events: events.sort((a, b) => {
        // 같은 월 내에서는 생성 순서대로
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      })
    }));
}

// 이벤트 카드 표시 텍스트 생성
function getEventDisplayText(event: TimelineEvent): string {
  const typeLabel = DOCUMENT_TYPE_CONFIG[event.documentType].label;
  const versionLabel = event.version !== 'N_A' 
    ? ` ${VERSION_LABELS[event.version]}` 
    : '';
  return `${typeLabel}${versionLabel} 송부`;
}

// 변경기록지 자동 번호: 같은 시험의 변경기록지 중 몇 번째인지
function getAmendmentNumber(event: TimelineEvent, allEvents: TimelineEvent[]): number {
  const amendments = allEvents
    .filter(e => e.studyId === event.studyId && e.documentType === 'AMENDMENT')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return amendments.indexOf(event) + 1;
}
```

---

## 7. 구현 우선순위

### Phase 1 (필수, 1~2주)
1. Prisma 스키마 추가 (Study, StudyDocument, Enum) + 마이그레이션
2. Study CRUD API + StudyDocument CRUD API
3. 시험 목록 테이블 (StudyListTable)
4. 시험 등록 모달 (StudyRegisterModal) - 일괄 등록
5. 시험 상세 페이지 + 문서 이력 리스트

### Phase 2 (중요, 1~2주)
1. 문서 기록 추가 모달 (DocumentAddModal)
2. 타임라인 API (프로젝트 전체 통합)
3. 타임라인 컴포넌트 (ProjectTimeline)
4. 시험번호별 필터링

### Phase 3 (권장, 추후)
1. 시험 상태 변경 + 상태 변경 시 자동 이벤트 기록
2. 타임라인 PDF/엑셀 내보내기
3. 간트차트 뷰 (시험별 기간 시각화)
4. 시험 접수 안내 엑셀 업로드 → 자동 파싱 → 일괄 등록

---

## 8. 주의사항

- 기존 CRM의 Lead, Contract, Quotation 모델과 충돌하지 않도록 합니다.
  Study는 계약 이후(Contract 확정 후)에 생성되는 엔티티입니다.
  Project → Contract → Study 순서로 연결됩니다.

- 변경기록지는 버전 구분 없이 N회 반복 발생합니다.
  DocumentVersion은 N_A로 설정하고, 표시 시 자동으로 "변경기록지 1", "변경기록지 2" 등
  발생 순서에 따라 번호를 부여합니다.

- 시험번호(studyCode)는 전체 시스템에서 유니크합니다.
  "25-NV-0194" 형식이며 prefix(NV, RR, DA 등)로 시험 유형을 식별합니다.

- 송부 시점은 연월(sentYear, sentMonth) 단위가 필수이고,
  정확한 일자(sentDate)는 선택사항입니다.
  타임라인 그룹핑은 연월 기준입니다.

- 각 기록에 자유 코멘트를 남길 수 있어야 합니다.
  코멘트는 타임라인 이벤트 카드에 함께 표시됩니다.

- 이 시스템은 개인 단위입니다. 로그인한 사업개발 담당자가
  자기 프로젝트의 시험만 보고 관리합니다 (userId 기반 필터).
```

---

## 사용 방법

1. 위 프롬프트 전체를 Kiro AI 또는 Claude에 붙여넣기
2. 현재 코드베이스의 `schema.prisma`, 프로젝트 폴더 구조를 함께 제공
3. "Phase 1부터 시작해줘"라고 요청

### 단계별 지시 예시

**Phase 1 시작:**
"Phase 1을 시작해줘. 먼저 schema.prisma에 Study, StudyDocument 모델과 Enum을 추가하고 마이그레이션 해줘."

**Phase 2 시작:**
"Phase 2를 진행해줘. 프로젝트 전체 타임라인 API와 타임라인 컴포넌트를 구현해줘."

**추가 요청 예시:**
- "시험 등록할 때 엑셀 파일 업로드로 일괄 등록하는 기능을 추가해줘"
- "타임라인을 PDF로 내보내는 기능을 만들어줘"
- "간트차트 형태로도 볼 수 있게 해줘"
