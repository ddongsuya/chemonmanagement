# CHEMON 견적관리 시스템 - 베타 배포 전 종합 QA 점검 요청

## 🎯 점검 목적

CHEMON 견적관리 시스템의 베타 배포 전 전체 기능 점검을 요청합니다.
모든 기능이 정상 작동하는지 확인하고, 발견된 문제점에 대한 수정 조치가 필요합니다.

---

## 📋 시스템 개요

### 기술 스택
- **Frontend**: Next.js 14.2.3 + TypeScript + Tailwind CSS
- **Backend**: Express.js + PostgreSQL + Prisma ORM
- **인증**: JWT 기반 (Access Token + Refresh Token)
- **배포**: Frontend(Vercel), Backend(Render)

### 프로젝트 구조
```
/
├── src/
│   ├── app/                    # Next.js App Router 페이지
│   ├── components/             # React 컴포넌트
│   ├── hooks/                  # Custom Hooks
│   ├── lib/                    # 유틸리티, API 클라이언트
│   ├── stores/                 # Zustand 상태관리
│   └── types/                  # TypeScript 타입 정의
├── prisma/
│   └── schema.prisma           # 데이터베이스 스키마
└── server/                     # Express 백엔드 (별도 저장소일 수 있음)
```

---

## ✅ 점검 요청 항목

### 1단계: 프로젝트 구조 파악

먼저 프로젝트 전체 구조를 파악해주세요:

```bash
# 프로젝트 루트 구조 확인
ls -la

# src 디렉토리 구조 확인
find src -type f -name "*.tsx" -o -name "*.ts" | head -50

# 페이지 라우트 확인
ls -la src/app/

# Prisma 스키마 확인
cat prisma/schema.prisma

# package.json 의존성 확인
cat package.json
```

---

### 2단계: 핵심 기능별 점검

각 기능 모듈별로 다음 사항을 점검해주세요:

#### 2.1 인증 시스템
| 점검 항목 | 확인 파일 |
|----------|----------|
| 로그인 API 연동 | `src/app/login/page.tsx`, `src/lib/api/auth.ts` |
| 회원가입 처리 | `src/app/register/page.tsx` |
| JWT 토큰 관리 | `src/lib/auth.ts`, `src/hooks/useAuth.ts` |
| 로그인 실패 횟수 제한 | 백엔드 로직 확인 |
| 세션 만료 처리 | API 인터셉터 확인 |
| 권한별 접근 제어 | 미들웨어, 라우트 가드 |

**점검 방법**:
- [ ] 로그인/로그아웃 플로우 코드 리뷰
- [ ] 토큰 갱신 로직 확인
- [ ] 권한 체크 로직 일관성 확인

#### 2.2 견적서 관리 (독성시험)
| 점검 항목 | 확인 파일 |
|----------|----------|
| 견적서 목록 조회 | `src/app/(dashboard)/quotations/page.tsx` |
| 견적서 생성 (5단계 마법사) | `src/app/(dashboard)/quotations/new/page.tsx` |
| 견적서 상세 조회 | `src/app/(dashboard)/quotations/[id]/page.tsx` |
| 견적서 수정 | `src/app/(dashboard)/quotations/[id]/edit/page.tsx` |
| 견적서 복사/삭제 | 해당 컴포넌트 |
| PDF 생성 | `src/components/quotations/QuotationPDF.tsx` |
| 금액 자동 계산 | 계산 로직 확인 |

**점검 방법**:
- [ ] CRUD 전체 플로우 코드 리뷰
- [ ] 마법사 단계 간 데이터 전달 확인
- [ ] 금액 계산 로직 정확성 검증
- [ ] PDF 생성 시 한글 폰트 처리 확인

#### 2.3 견적서 관리 (약효시험)
| 점검 항목 | 확인 파일 |
|----------|----------|
| 약효시험 견적서 목록 | `src/app/(dashboard)/efficacy-quotations/page.tsx` |
| 약효시험 견적서 생성 (6단계) | `src/app/(dashboard)/efficacy-quotations/new/page.tsx` |
| 질환 모델 선택 | 관련 컴포넌트 |
| 시험 설계 (군 구성) | 관련 컴포넌트 |

**점검 방법**:
- [ ] 독성시험과 별도 데이터 모델 확인
- [ ] 약효시험 특화 필드 처리 확인

#### 2.4 고객 관리
| 점검 항목 | 확인 파일 |
|----------|----------|
| 고객 목록/검색 | `src/app/(dashboard)/customers/page.tsx` |
| 고객 상세 (탭 구조) | `src/app/(dashboard)/customers/[id]/page.tsx` |
| 의뢰인 관리 | 의뢰인 탭 컴포넌트 |
| 미팅기록 | 미팅기록 탭 컴포넌트 |
| 시험접수 현황 | 시험접수 탭 컴포넌트 |
| 청구일정 | 청구일정 탭 컴포넌트 |
| 타임라인 | 타임라인 탭 컴포넌트 |
| 진행 워크플로우 (9단계) | 파이프라인 진행 컴포넌트 |

**점검 방법**:
- [ ] 각 탭 데이터 로딩 확인
- [ ] 고객-의뢰인-견적서-계약 관계 무결성 확인

#### 2.5 리드 관리
| 점검 항목 | 확인 파일 |
|----------|----------|
| 리드 목록/필터 | `src/app/(dashboard)/leads/page.tsx` |
| 리드 등록 | `src/app/(dashboard)/leads/new/page.tsx` |
| 리드 상세/수정 | `src/app/(dashboard)/leads/[id]/page.tsx` |
| 상태 변경 | 상태 변경 로직 |
| 리드 → 견적서 전환 | 전환 로직 확인 |

#### 2.6 계약 관리
| 점검 항목 | 확인 파일 |
|----------|----------|
| 계약 목록 | `src/app/(dashboard)/contracts/page.tsx` |
| 계약 생성 (견적서 기반) | `src/app/(dashboard)/contracts/new/page.tsx` |
| 계약 상세 | `src/app/(dashboard)/contracts/[id]/page.tsx` |
| 계약서 PDF 생성 | `src/components/contracts/ContractPDF.tsx` |
| 변경계약서 | 변경계약서 관련 컴포넌트 |

#### 2.7 시험 관리
| 점검 항목 | 확인 파일 |
|----------|----------|
| 시험 목록 | `src/app/(dashboard)/studies/page.tsx` |
| 시험 상세 | `src/app/(dashboard)/studies/[id]/page.tsx` |
| 시험 상태 변경 | 상태 관리 로직 |
| 시험번호 생성 | 자동 생성 로직 |

#### 2.8 대시보드
| 점검 항목 | 확인 파일 |
|----------|----------|
| 오늘의 현황 | `src/app/(dashboard)/dashboard/page.tsx` |
| 통계 차트 | 차트 컴포넌트 |
| 최근 견적서 | 관련 컴포넌트 |
| 빠른 작업 | 바로가기 링크 |

#### 2.9 일정 관리
| 점검 항목 | 확인 파일 |
|----------|----------|
| 캘린더 뷰 | `src/app/(dashboard)/calendar/page.tsx` |
| 일정 CRUD | 일정 관련 API |
| 고객별 일정 연동 | 연동 로직 |

#### 2.10 파이프라인
| 점검 항목 | 확인 파일 |
|----------|----------|
| 칸반 보드 | `src/app/(dashboard)/pipeline/page.tsx` |
| 드래그 앤 드롭 | DnD 라이브러리 사용 |
| 단계별 금액 합계 | 계산 로직 |

#### 2.11 리포트 & 통계
| 점검 항목 | 확인 파일 |
|----------|----------|
| 기간별 리포트 | `src/app/(dashboard)/reports/page.tsx` |
| 담당자별 실적 | 관련 컴포넌트 |
| 영업 현황 | `src/app/(dashboard)/sales/page.tsx` |

#### 2.12 전문 계산기 (7종)
| 계산기 | 확인 파일 |
|--------|----------|
| 희석 계산기 | `src/app/(dashboard)/calculators/dilution/page.tsx` |
| 용량 환산 | `src/app/(dashboard)/calculators/dose-conversion/page.tsx` |
| 투여량 계산 | `src/app/(dashboard)/calculators/dosing/page.tsx` |
| 노출역 계산 | `src/app/(dashboard)/calculators/exposure-margin/page.tsx` |
| MRSD 계산 | `src/app/(dashboard)/calculators/mrsd/page.tsx` |
| 시험물질 소요량 | `src/app/(dashboard)/calculators/test-material/page.tsx` |
| TK 파라미터 | `src/app/(dashboard)/calculators/tk-parameters/page.tsx` |

**점검 방법**:
- [ ] 각 계산기 공식 정확성 검증
- [ ] 입력값 유효성 검사 확인
- [ ] 결과 출력 형식 확인

#### 2.13 관리자 기능
| 점검 항목 | 확인 파일 |
|----------|----------|
| 관리자 대시보드 | `src/app/(dashboard)/admin/page.tsx` |
| 사용자 관리 | `src/app/(dashboard)/admin/users/page.tsx` |
| 매출 통계 | `src/app/(dashboard)/admin/sales/page.tsx` |
| 공지사항 관리 | `src/app/(dashboard)/admin/announcements/page.tsx` |
| 활동 로그 | `src/app/(dashboard)/admin/logs/page.tsx` |
| 시스템 설정 | `src/app/(dashboard)/admin/settings/page.tsx` |

**점검 방법**:
- [ ] 관리자 권한 체크 확인
- [ ] 일반 사용자 접근 차단 확인

#### 2.14 설정
| 점검 항목 | 확인 파일 |
|----------|----------|
| 프로필 설정 | `src/app/(dashboard)/settings/page.tsx` |
| 비밀번호 변경 | 관련 컴포넌트 |
| 마스터데이터 관리 | 마스터데이터 관련 페이지 |

---

### 3단계: API 연동 점검

#### 3.1 API 엔드포인트 목록 확인
```bash
# API 라우트 파일 확인 (Next.js API Routes 사용 시)
find src/app/api -type f -name "route.ts"

# 또는 외부 API 호출 함수 확인
find src/lib/api -type f -name "*.ts"
```

#### 3.2 API 연동 점검 항목
| 영역 | 점검 항목 |
|------|----------|
| 인증 | 로그인, 로그아웃, 토큰 갱신, 회원가입 |
| 고객 | CRUD, 검색, 필터링 |
| 견적서 | CRUD, 상태 변경, PDF 생성 |
| 계약 | CRUD, 상태 변경, PDF 생성 |
| 시험 | CRUD, 상태 변경 |
| 리드 | CRUD, 상태 변경 |
| 일정 | CRUD |
| 통계 | 대시보드, 리포트 데이터 |
| 마스터데이터 | 시험항목, 가격 조회 |

**점검 방법**:
- [ ] 각 API 호출 시 에러 핸들링 확인
- [ ] 로딩 상태 처리 확인
- [ ] 네트워크 오류 시 사용자 피드백 확인

---

### 4단계: 데이터베이스 스키마 점검

```bash
# Prisma 스키마 확인
cat prisma/schema.prisma
```

#### 4.1 모델 관계 점검
| 관계 | 점검 사항 |
|------|----------|
| User ↔ Customer | 담당자 관계 |
| Customer ↔ Quotation | 1:N 관계 |
| Customer ↔ Contract | 1:N 관계 |
| Quotation ↔ QuotationItem | 1:N 관계 |
| Contract ↔ Study | 1:N 관계 |
| Lead ↔ Quotation | 전환 관계 |

**점검 방법**:
- [ ] 외래키 제약조건 확인
- [ ] CASCADE 삭제 설정 확인
- [ ] 필수 필드 NOT NULL 확인

---

### 5단계: 공통 컴포넌트 점검

| 컴포넌트 | 점검 사항 |
|----------|----------|
| 레이아웃 | 사이드바, 헤더, 반응형 |
| 테이블 | 페이지네이션, 정렬, 필터 |
| 폼 | 유효성 검사, 에러 메시지 |
| 모달 | 열기/닫기, 백드롭 클릭 |
| 토스트/알림 | 성공/에러 메시지 표시 |
| 로딩 | 스켈레톤, 스피너 |
| 차트 | 데이터 바인딩, 반응형 |

---

### 6단계: 보안 점검

| 점검 항목 | 확인 사항 |
|----------|----------|
| XSS 방지 | 사용자 입력 이스케이프 |
| CSRF 방지 | 토큰 검증 |
| SQL Injection | Prisma ORM 사용 확인 |
| 인증 토큰 | HttpOnly 쿠키 또는 안전한 저장 |
| 권한 체크 | API 레벨 권한 검증 |
| 민감정보 노출 | 콘솔 로그, 에러 메시지 |

---

### 7단계: 성능 점검

| 점검 항목 | 확인 사항 |
|----------|----------|
| 번들 사이즈 | 불필요한 의존성 제거 |
| 이미지 최적화 | Next.js Image 사용 |
| API 응답 속도 | N+1 쿼리 문제 |
| 메모리 누수 | useEffect cleanup |
| 불필요한 리렌더링 | React DevTools 확인 |

---

## 📝 점검 결과 보고 양식

각 항목 점검 후 다음 형식으로 보고해주세요:

```markdown
## [기능명] 점검 결과

### ✅ 정상 작동
- 항목 1
- 항목 2

### ⚠️ 경미한 문제 (수정 권장)
- 문제 1: [설명]
  - 파일: `경로/파일명.tsx`
  - 수정 방안: [설명]

### 🚨 심각한 문제 (수정 필수)
- 문제 1: [설명]
  - 파일: `경로/파일명.tsx`
  - 영향: [설명]
  - 수정 방안: [설명]

### 💡 개선 제안
- 제안 1: [설명]
```

---

## 🔧 발견된 문제 수정 요청

문제 발견 시 다음 우선순위로 수정을 진행해주세요:

1. **P0 (Critical)**: 시스템 장애, 데이터 손실 위험 → 즉시 수정
2. **P1 (High)**: 핵심 기능 오작동 → 베타 전 수정 필수
3. **P2 (Medium)**: 사용성 문제 → 가능하면 수정
4. **P3 (Low)**: 개선 사항 → 추후 반영

---

## 📊 최종 점검 체크리스트

점검 완료 후 다음 체크리스트를 확인해주세요:

### 기능 점검
- [ ] 모든 페이지 접근 가능
- [ ] 모든 CRUD 작동 확인
- [ ] 모든 PDF 생성 정상
- [ ] 모든 계산기 정상
- [ ] 관리자 기능 정상

### 연동 점검
- [ ] 프론트엔드 ↔ 백엔드 API 연동 정상
- [ ] 데이터베이스 연결 정상
- [ ] 외부 서비스 연동 정상 (있는 경우)

### 보안 점검
- [ ] 인증/인가 정상
- [ ] 권한별 접근 제어 정상
- [ ] 민감 정보 노출 없음

### 에러 처리
- [ ] 모든 API 에러 처리 확인
- [ ] 사용자 친화적 에러 메시지
- [ ] 네트워크 오류 처리

---

## 🚀 점검 시작

위 내용을 기반으로 체계적인 점검을 진행해주세요.
점검 중 질문이 있으면 언제든 문의해주세요.

**점검 시작 명령**:
```
프로젝트 구조를 먼저 파악한 후, 위 점검 항목을 순서대로 진행해주세요.
발견된 문제는 즉시 보고하고, 가능한 경우 수정 코드를 제안해주세요.
```
