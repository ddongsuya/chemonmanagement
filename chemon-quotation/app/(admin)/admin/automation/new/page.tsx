'use client';

import AutomationRuleForm from '@/components/admin/AutomationRuleForm';

/**
 * 새 자동화 규칙 생성 페이지
 * Requirements: 2.1.1 - 규칙 이름, 설명, 활성화 상태 설정
 * Requirements: 2.1.2 - 트리거 유형 선택 (상태 변경, 날짜 도달, 항목 생성)
 * Requirements: 2.1.3 - 조건 설정 (예: 견적 금액 > 1억)
 * Requirements: 2.1.4 - 액션 설정 (알림 발송, 상태 변경, 담당자 배정)
 */
export default function NewAutomationRulePage() {
  return (
    <div className="container mx-auto py-6">
      <AutomationRuleForm />
    </div>
  );
}
