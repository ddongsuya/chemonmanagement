'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 리드 관리 페이지 → 통합 고객사 관리로 리다이렉트
 */
export default function LeadsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/customers?type=lead');
  }, [router]);
  return null;
}
