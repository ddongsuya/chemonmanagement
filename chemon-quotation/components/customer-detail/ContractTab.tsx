'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  NEGOTIATING: 'bg-yellow-50 text-yellow-700',
  DRAFT: 'bg-slate-100 text-slate-600',
  ACTIVE: 'bg-emerald-50 text-emerald-600',
  COMPLETED: 'bg-blue-50 text-blue-600',
  CANCELLED: 'bg-red-50 text-red-600',
  EXPIRED: 'bg-orange-50 text-orange-600',
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
          <div key={i} className="bg-[#FAF2E9] rounded-xl p-4"><Skeleton className="h-16 w-full" /></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#FAF2E9] rounded-xl p-6 text-center">
          <p className="text-sm text-destructive mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-1" /> 재시도
          </Button>
      </div>
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
        <div className="bg-[#FAF2E9] rounded-xl p-6 text-center">
            <FileSignature className="w-8 h-8 mx-auto mb-2 text-slate-500" />
            <p className="text-sm text-slate-500">등록된 계약이 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end mb-1"><NewContractButton /></div>
      {data.map(c => (
        <div
          key={c.id}
          className="bg-[#FAF2E9] rounded-xl p-4 cursor-pointer hover:bg-[#FFF8F1] transition-colors"
          onClick={() => router.push(`/contracts/${c.id}`)}
        >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{c.contractNumber}</span>
                  <span className="text-xs font-bold uppercase tracking-wider rounded-full px-2.5 py-0.5 bg-slate-100 text-slate-600">
                    {TYPE_LABELS[c.contractType] || c.contractType}
                  </span>
                  <span className={`text-xs font-bold uppercase tracking-wider rounded-full px-2.5 py-0.5 ${STATUS_COLORS[c.status] || ''}`}>
                    {STATUS_LABELS[c.status] || c.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 truncate">{c.title}</p>
                {(c.startDate || c.endDate) && (
                  <p className="text-xs text-slate-500 mt-1">
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
        </div>
      ))}
    </div>
  );
}
