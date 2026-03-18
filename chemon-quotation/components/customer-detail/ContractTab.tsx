'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Skeleton from '@/components/ui/Skeleton';
import { FileSignature, RefreshCw, Plus } from 'lucide-react';
import { customerContractApi } from '@/lib/customer-data-api';
import type { CustomerContract } from '@/types/customer-crm';

const STATUS_LABELS: Record<string, string> = {
  NEGOTIATING: '협상중',
  DRAFT: '초안',
  ACTIVE: '활성',
  COMPLETED: '완료',
  CANCELLED: '취소',
  EXPIRED: '만료',
};

const STATUS_COLORS: Record<string, string> = {
  NEGOTIATING: 'bg-yellow-100 text-yellow-800',
  DRAFT: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-orange-100 text-orange-800',
};

const TYPE_LABELS: Record<string, string> = {
  TOXICITY: '독성',
  EFFICACY: '효력',
};

export default function ContractTab({ customerId, customerName }: { customerId: string; customerName?: string }) {
  const router = useRouter();
  const [data, setData] = useState<CustomerContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await customerContractApi.getByCustomerId(customerId);
      setData(result);
    } catch {
      setError('계약 데이터를 불러오는데 실패했습니다');
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

  const nameParam = customerName ? `&customerName=${encodeURIComponent(customerName)}` : '';

  const NewContractButton = () => (
    <Button size="sm" onClick={() => router.push(`/contract/new?customerId=${customerId}${nameParam}`)}>
      <Plus className="w-4 h-4 mr-1" />새 계약
    </Button>
  );

  if (data.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex justify-end"><NewContractButton /></div>
        <Card>
          <CardContent className="p-6 text-center">
            <FileSignature className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">등록된 계약이 없습니다</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end mb-1"><NewContractButton /></div>
      {data.map(c => (
        <Card
          key={c.id}
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push(`/contracts/${c.id}`)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{c.contractNumber}</span>
                  <Badge variant="outline" className="text-xs">
                    {TYPE_LABELS[c.contractType] || c.contractType}
                  </Badge>
                  <Badge className={`text-xs ${STATUS_COLORS[c.status] || ''}`}>
                    {STATUS_LABELS[c.status] || c.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{c.title}</p>
                {(c.startDate || c.endDate) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.startDate ? new Date(c.startDate).toLocaleDateString('ko-KR') : ''}
                    {c.startDate && c.endDate ? ' ~ ' : ''}
                    {c.endDate ? new Date(c.endDate).toLocaleDateString('ko-KR') : ''}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-sm font-medium">{c.totalAmount.toLocaleString()}원</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
