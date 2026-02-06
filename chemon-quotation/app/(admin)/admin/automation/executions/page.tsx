'use client';

import AutomationExecutionLog from '@/components/admin/AutomationExecutionLog';

/**
 * 자동화 실행 히스토리 페이지
 * Requirements: 2.5.4 - 규칙 실행 히스토리 조회
 */
export default function AutomationExecutionsPage() {
  return (
    <div className="container mx-auto py-6">
      <AutomationExecutionLog />
    </div>
  );
}
