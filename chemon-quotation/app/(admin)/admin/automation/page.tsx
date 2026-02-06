'use client';

import AutomationRuleList from '@/components/admin/AutomationRuleList';

/**
 * 자동화 규칙 목록 페이지
 * Requirements: 2.5.1 - 규칙 목록 조회 (이름, 트리거, 상태, 실행 횟수)
 * Requirements: 2.5.2 - 규칙 활성화/비활성화 토글
 * Requirements: 2.5.3 - 규칙 수정 및 삭제
 */
export default function AutomationPage() {
  return (
    <div className="container mx-auto py-6">
      <AutomationRuleList />
    </div>
  );
}
