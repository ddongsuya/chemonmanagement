'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Skeleton from '@/components/ui/Skeleton';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileText, RefreshCw, Plus, ChevronDown } from 'lucide-react';
import { customerQuotationApi } from '@/lib/customer-data-api';
import type { CustomerQuotation } from '@/types/customer-crm';

const TYPE_LABELS: Record<string, string> = {
  TOXICITY: '독성',
  EFFICACY: '효력',
  CLINICAL_PATHOLOGY: '임상병리',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: '초안',
  SENT: '발송',
  ACCEPTED: '승인',
  REJECTED: '거절',
  EXPIRED: '만료',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-yellow-100 text-yellow-800',
};

function getQuotationDetailUrl(q: CustomerQuotation): string {
  switch (q.quotationType) {
    case 'EFFICACY': return `/efficacy-quotations/${q.id}`;
    case 'CLINICAL_PATHOLOGY': return `/clinical-pathology/quotations/${q.id}`;
    default: return `/quotations/${q.id}`;
  }
}

export default function QuotationTab({ customerId, customerName }: { customerId: string; customerName?: string }) {
  const router = useRouter();
  const [data, setData] = useState<CustomerQuotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await customerQuotationApi.getByCustomerId(customerId);
      setData(result);
    } catch {
      setError('견적서 데이터를 불러오는데 실패했습니다');
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

  const NewQuotationButton = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" />새 견적서<ChevronDown className="w-3 h-3 ml-1" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/quotations/new?customerId=${customerId}${nameParam}`)}>
          독성시험 견적서
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/efficacy-quotations/new?customerId=${customerId}${nameParam}`)}>
          효력시험 견적서
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/clinical-pathology/quotations/new?customerId=${customerId}${nameParam}`)}>
          임상병리 견적서
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (data.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex justify-end"><NewQuotationButton /></div>
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">등록된 견적서가 없습니다</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end mb-1"><NewQuotationButton /></div>
      {data.map(q => (
        <Card
          key={q.id}
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push(getQuotationDetailUrl(q))}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{q.quotationNumber}</span>
                  <Badge variant="outline" className="text-xs">
                    {TYPE_LABELS[q.quotationType] || q.quotationType}
                  </Badge>
                  <Badge className={`text-xs ${STATUS_COLORS[q.status] || ''}`}>
                    {STATUS_LABELS[q.status] || q.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{q.projectName}</p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-sm font-medium">{q.totalAmount.toLocaleString()}원</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(q.createdAt).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
