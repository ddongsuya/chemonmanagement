// 대시보드 권한 관리 유틸리티
import { AuthUser, PositionType, TitleType } from './auth-api';

export type DashboardAccessLevel = 'PERSONAL' | 'TEAM' | 'FULL';

// 전사 데이터 열람 가능 직급 (센터장 이상)
const FULL_ACCESS_POSITIONS: PositionType[] = ['CENTER_HEAD', 'DIVISION_HEAD', 'CEO', 'CHAIRMAN'];

// 전사 데이터 열람 가능 직책
const FULL_ACCESS_TITLES: TitleType[] = ['TEAM_LEADER'];

// 전사 데이터 열람 가능 부서
const FULL_ACCESS_DEPARTMENTS = ['SUPPORT'];

/**
 * 사용자의 대시보드 접근 레벨 결정
 */
export function getDashboardAccessLevel(user: AuthUser | null): DashboardAccessLevel {
  if (!user) return 'PERSONAL';

  // 1. ADMIN → 전사 열람
  if (user.role === 'ADMIN') return 'FULL';

  // 2. 사업지원팀 → 전사 열람
  if (user.department && FULL_ACCESS_DEPARTMENTS.includes(user.department)) {
    return 'FULL';
  }

  // 3. 직책 팀장 → 전사 열람
  if (user.title && FULL_ACCESS_TITLES.includes(user.title)) {
    return 'FULL';
  }

  // 4. 직급 센터장 이상 → 전사 열람
  if (user.position && FULL_ACCESS_POSITIONS.includes(user.position)) {
    return 'FULL';
  }

  // 5. canViewAllData 또는 canViewAllSales 권한 → 전사 열람
  if (user.canViewAllData || user.canViewAllSales) {
    return 'FULL';
  }

  // 6. 일반 사용자 → 본인만
  return 'PERSONAL';
}

/**
 * 접근 레벨 한글 라벨
 */
export const ACCESS_LEVEL_LABELS: Record<DashboardAccessLevel, string> = {
  PERSONAL: '개인 현황',
  TEAM: '부서 현황',
  FULL: '전사 현황',
};

/**
 * 접근 레벨 설명
 */
export const ACCESS_LEVEL_DESCRIPTIONS: Record<DashboardAccessLevel, string> = {
  PERSONAL: '본인의 견적 및 계약 데이터만 조회합니다.',
  TEAM: '본인 및 소속 부서의 데이터를 조회합니다.',
  FULL: '전사 데이터를 조회합니다.',
};
