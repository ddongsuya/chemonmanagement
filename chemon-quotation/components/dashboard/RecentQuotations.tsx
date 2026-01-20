'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { ArrowRight, FileText, TrendingUp, Loader2 } from 'lucide-react';
import { getQuotations, Quotation } from '@/lib/data-api';

// 상태 라벨 매핑
const STATUS_LABELS: Record<string, string> = {
  DRAFT: '작성중',
  SENT: '제출',
  ACCEPTED: '수주',
  REJECTED: '실주',
  EXPIRED: '만료',
};

// 상태 색상 매핑
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-yellow-100 text-yellow-700',
};

interface RecentQuotation {
  id: string;
  number: string;
  customer: string;
  amount: number;
  status: string;
  date: string;
}

export default function RecentQuotations() {
  const [quotations, setQuotations] = useState<RecentQuotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuotations() {
      try {
        const response = await getQuotations({ limit: 5 });
        if (response.success && response.data) {
          const recent = response.data.data.map((q: Quotation) => ({
            id: q.id,
            number: q.quotationNumber,
            customer: q.customerName,
            amount: q.totalAmount,
            status: q.status,
            date: q.createdAt.split('T')[0],
          }));
          setQuotations(recent);
        }
      } catch (error) {
        console.error('Failed to load recent quotations:', error);
      } finally {
        setLoading(false);
      }
    }
    loadQuotations();
  }, []);

  return (
    <Card className="h-full border-0 shadow-soft min-h-[400px]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">최근 견적서</CardTitle>
            <p className="text-sm text-slate-500">최근 작성된 견적 목록</p>
          </div>
        </div>
        <Link
          href="/quotations"
          className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1 font-medium"
        >
          전체보기 <ArrowRight className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : quotations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">견적서가 없습니다</p>
            <p className="text-sm text-slate-400 mt-1">
              새 견적서를 작성해보세요
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {quotations.map((q, index) => (
              <Link
                key={q.id}
                href={`/quotations/${q.id}`}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
                      {q.number}
                    </p>
                    <p className="text-sm text-slate-500">{q.customer}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(q.amount)}
                    </p>
                    <p className="text-xs text-slate-400">{q.date}</p>
                  </div>
                  <Badge
                    className={`${STATUS_COLORS[q.status] || 'bg-gray-100 text-gray-700'} rounded-lg px-2.5`}
                    variant="secondary"
                  >
                    {STATUS_LABELS[q.status] || q.status}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
