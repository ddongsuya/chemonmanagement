'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Skeleton from '@/components/ui/Skeleton';
import { MessageSquare, RefreshCw } from 'lucide-react';
import { customerConsultationApi } from '@/lib/customer-data-api';
import type { CustomerConsultation } from '@/types/customer-crm';

export default function ConsultationTab({ customerId }: { customerId: string }) {
  const [data, setData] = useState<CustomerConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await customerConsultationApi.getByCustomerId(customerId);
      setData(result);
    } catch {
      setError('상담기록 데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [customerId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-destructive mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-1" /> 재시도
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">등록된 상담기록이 없습니다</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {data.map(c => (
        <Card key={c.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{c.recordNumber}</span>
                {c.contractNumber && (
                  <Badge variant="outline" className="text-xs">계약 {c.contractNumber}</Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(c.consultDate).toLocaleDateString('ko-KR')}
              </span>
            </div>
            {c.substanceName && (
              <p className="text-sm mb-1">
                <span className="text-muted-foreground">물질명:</span> {c.substanceName}
              </p>
            )}
            {c.clientRequests && (
              <p className="text-sm text-muted-foreground line-clamp-2">{c.clientRequests}</p>
            )}
            {c.internalNotes && (
              <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">
                내부 메모: {c.internalNotes}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
