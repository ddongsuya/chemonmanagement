# 대시보드 리뉴얼 계획

## 구조 변경

현재: 대시보드 1개 페이지에 개인현황 + 전사현황 + 캐러셀(모달리티/월별추이/매출/파이프라인/영업성과/시험현황/최근견적서)

변경: 2개 탭으로 분리
- **업무 대시보드** (기본 탭): 개인 업무 도우미
- **매출 대시보드**: 금액/실적 중심, 권한별 데이터 범위

---

## 1. 업무 대시보드 (WorkDashboard)

개인의 업무 효율을 위한 알림/리마인더 성격

### 위젯 구성
1. **다가오는 미팅** — 향후 7일 내 미팅 일정 (MeetingRecord에서 date 기준)
2. **견적서 후속 조치** — 발송(SENT) 후 7일 이상 미응답 견적서 목록
3. **세금계산서 임박** — 발행 예정일 7일 이내 InvoiceSchedule
4. **시험 완료 예정** — expected_completion_date 7일 이내 TestReception
5. **후속 조치 필요** — MeetingRecord의 follow_up_actions 미완료 건

### 백엔드 API
`GET /api/dashboard/work-items` → 위 5개 데이터를 한 번에 반환

### 프론트엔드
`WorkDashboard.tsx` — 카드 리스트 형태, 각 항목 클릭 시 해당 상세 페이지로 이동

---

## 2. 매출 대시보드 (SalesDashboard)

### 권한별 데이터 범위
| 권한 | 데이터 범위 |
|------|------------|
| 일반 유저 (BD1) | 개인 + 1센터 전체 |
| 일반 유저 (BD2) | 개인 + 2센터 전체 |
| 팀장/센터장/사업지원팀/ADMIN | 개인 + 전체 센터 + 센터별 + 개인별 드릴다운 |

### 데이터 항목 (개인/센터/전사 공통)
- 견적금액: total, 월별, 분기별
- 계약금액: total, 월별, 분기별
- 수주율: total, 월별, 분기별
- 모달리티별 분포 (파이차트)
- 월별 추이 (라인차트)
- 매출 현황 (바차트)
- 영업 성과 (담당자별 순위)

### 백엔드 API 변경
`GET /api/dashboard/sales-stats` 신규
- params: `year`, `month`, `scope` (personal|department|company), `department` (BD1|BD2)
- 응답: 기간별(월별/분기별/연간) 견적/계약/수주율 + 모달리티별 분포

### 프론트엔드
`SalesDashboard.tsx`
- 상단: 기간 필터 (연도/월/분기 선택)
- 스코프 탭: 개인 | 소속센터 | 전사 (권한에 따라 표시)
- KPI 카드: 견적금액, 계약금액, 수주율
- 차트: 월별 추이, 모달리티별 분포
- 테이블: 센터별 현황, 담당자별 순위 (전사 권한만)

---

## 3. 메인 페이지 변경

`dashboard/page.tsx`
- 탭 2개: "업무" | "매출"
- 기본 탭: 업무
- 빠른 견적서 작성 버튼 유지

---

## 구현 순서

1. 백엔드: `GET /api/dashboard/work-items` API
2. 프론트: `WorkDashboard.tsx` 컴포넌트
3. 백엔드: `GET /api/dashboard/sales-stats` API (기존 stats 확장)
4. 프론트: `SalesDashboard.tsx` 컴포넌트
5. `dashboard/page.tsx` 탭 구조로 리팩토링
