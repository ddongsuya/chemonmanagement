'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Skeleton from '@/components/ui/Skeleton';
import { FlaskConical, RefreshCw } from 'lucide-react';
import { testReceptionApi } from '@/lib/customer-data-api';
import type { TestReception } from '@/types/customer';

interface TestReceptionTabProps {
  customerId: string;
  requesterId?: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  received: { label: '접수', variant: 'default' },
  in_progress: { label: '진행중', variant: 'secondary' },
  completed: { label: '완료', variant: 'outline' },
  cancelled: { label: '취소', variant: 'destructive' },
};

function formatAmount(n: number) {
  return n.toLocaleString('ko-KR') + '원';
}

export default function TestReceptionTab({ customerId, requesterId }: TestReceptionTabProps) {
  const [receptions, setReceptions] = useState<TestReception[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await testReceptionApi.getByCustomerId(customerId);
      let filtered = data;
      // 담당자 필터링
      if (requesterId) {
        filtered = data.filter(r => (r as any).requester_id === requesterId || (r as any).requesterId === requesterId);
      }
      setReceptions(filtered);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [customerId, requesterId]);

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-3">데이터를 불러오는데 실패했습니다</p>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="w-4 h-4 mr-1" /> 재시도
        </Button>
      </div>
    );
  }

  if (receptions.length === 0) {
    return (
      <div className="text-center py-12">
        <FlaskConical className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">등록된 시험 접수가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {receptions.map(r => {
        const status = STATUS_CONFIG[r.status] || STATUS_CONFIG.received;
        return (
          <div key={r.id} className="bg-[#FAF2E9] rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{r.test_title || '(제목 없음)'}</p>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                    {r.test_number && <span>시험번호: {r.test_number}</span>}
                    {r.substance_name && <span>시험물질: {r.substance_name}</span>}
                    {r.test_director && <span>책임자: {r.test_director}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>접수: {new Date(r.reception_date).toLocaleDateString('ko-KR')}</span>
                    {r.expected_completion_date && (
                      <span>예상완료: {new Date(r.expected_completion_date).toLocaleDateString('ko-KR')}</span>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm shrink-0">
                  <p className="font-medium">{formatAmount(r.total_amount)}</p>
                  <p className="text-xs text-slate-500">
                    납부 {formatAmount(r.paid_amount)} / 잔액 {formatAmount(r.remaining_amount)}
                  </p>
                </div>
              </div>
          </div>
        );
      })}
    </div>
  );
}
