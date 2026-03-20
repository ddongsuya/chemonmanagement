# 매출 대시보드 권한별 뷰 재설계

## 현재 상태 분석

### 백엔드 (`dashboardService.ts`)
- `getDashboardAccessLevel()` 로직 이미 구현됨:
  - ADMIN / 사업지원팀 / 팀장급 이상 / canViewAllData → `FULL`
  - 부서 소속 일반 사용자 → `TEAM`
  - 부서 미지정 → `PERSONAL`
- `getSalesStats()` 메서드: scope 파라미터(personal/department/company)에 따라 데이터 필터링
  - `personal`: 본인 userId만
  - `department`: 소속 부서 전체 사용자
  - `company`: 전체 (FULL 권한만)
- 부서별 현황(`departmentStats`)과 담당자별 순위(`userRanking`)는 `scope=company`일 때만 반환

### 프론트엔드 (`SalesDashboard.tsx`)
- 스코프 탭: 개인 / 소속센터 / 전사 (FULL 권한만)
- 한 번에 하나의 스코프만 표시
- **문제**: 유저 요구사항과 불일치

## 요구사항 정리

| 유저 유형 | 보여야 할 데이터 |
|-----------|-----------------|
| 일반 유저 (BD1/BD2) | ① 개인 매출 + ② 소속 센터 종합 매출 (동시 표시) |
| 사업지원팀 (SUPPORT) | 전사 데이터 (소속별 + 사용자별) |
| 팀장급 이상 | 전사 데이터 (소속별 + 사용자별) |

→ 핵심 변경: **탭 전환이 아니라, 권한에 따라 자동으로 적절한 뷰를 보여줌**

## 수정 계획

### 1. 백엔드 수정 (`dashboardService.ts` → `getSalesStats`)
- scope 파라미터 제거 → 권한 기반으로 자동 결정
- 응답에 항상 `personal` 데이터 포함
- TEAM 권한: `personal` + `departmentData` (소속 센터 종합)
- FULL 권한: `personal` + `departmentStats` (전 센터) + `userRanking` (전 사용자)

```typescript
// 응답 구조 변경
{
  accessLevel: 'PERSONAL' | 'TEAM' | 'FULL',
  personal: { totals, monthly, quarterly, modality },  // 항상 포함
  department: { totals, monthly, quarterly } | null,    // TEAM/FULL만
  departmentStats: [...] | null,                        // FULL만 (센터별 비교)
  userRanking: [...] | null,                            // FULL만
}
```

### 2. 프론트엔드 수정 (`SalesDashboard.tsx`)
- 스코프 탭 제거
- 권한별 자동 레이아웃:

**PERSONAL (부서 미지정)**:
- 개인 KPI 카드 + 월별 추이 + 분기별 + 모달리티

**TEAM (일반 유저)**:
- 섹션 1: "내 매출" — 개인 KPI 카드 + 월별 추이
- 섹션 2: "소속센터 종합" — 센터 KPI 카드 + 월별 추이 + 분기별 + 모달리티

**FULL (사업지원팀/팀장급)**:
- 섹션 1: "내 매출" — 개인 KPI 카드 (간략)
- 섹션 2: "전사 현황" — 전사 KPI + 센터별 비교 테이블 + 담당자별 순위
- 월별 추이 차트 (전사 기준)

### 3. 라우트 수정 (`dashboard.ts`)
- `/sales-stats` 엔드포인트에서 scope 파라미터 무시하고 권한 기반 자동 결정

## 구현 순서
1. 백엔드 `getSalesStats` 리팩토링
2. 프론트엔드 `SalesDashboard.tsx` 재작성
3. 테스트 및 커밋
