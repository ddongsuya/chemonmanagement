'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Skeleton from '@/components/ui/Skeleton';
import { Receipt, RefreshCw } from 'lucide-react';
import { invoiceScheduleApi } from '@/lib/customer-data-api';
import type { InvoiceSchedule } from '@/types/customer';

interface InvoiceScheduleTabProps {
  customerId: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending: { label: '대기', variant: 'outline' },
  issued: { label: '발행', variant: 'default' },
  paid: { label: '납부', variant: 'secondary' },
  overdue: { label: '연체', variant: 'destructive' },
};

function formatAmount(n: number) {
  return n.toLocaleString('ko-KR') + '원';
}

export default function InvoiceScheduleTab({ customerId }: InvoiceScheduleTabProps) {
  const [schedules, setSchedules] = useState<InvoiceSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await invoiceScheduleApi.getByCustomerId(customerId);
      setSchedules(data.sort((a, b) =>
        new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
      ));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [customerId]);

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;
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

  if (schedules.length === 0) {
    return (
      <div className="text-center py-12">
        <Receipt className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">등록된 세금계산서 일정이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {schedules.map(s => {
        const status = STATUS_CONFIG[s.status] || STATUS_CONFIG.pending;
        return (
          <Card key={s.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{formatAmount(s.amount)}</p>
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {s.payment_type === 'partial' && s.installment_number && (
                      <span className="text-xs text-muted-foreground">
                        ({s.installment_number}/{s.total_installments}회차)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                    <span>예정: {new Date(s.scheduled_date).toLocaleDateString('ko-KR')}</span>
                    {s.issued_date && <span>발행: {new Date(s.issued_date).toLocaleDateString('ko-KR')}</span>}
                    {s.invoice_number && <span>번호: {s.invoice_number}</span>}
                  </div>
                  {s.notes && <p className="text-xs text-muted-foreground mt-1">{s.notes}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
