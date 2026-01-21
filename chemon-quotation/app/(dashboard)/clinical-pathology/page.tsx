'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  ClipboardList, 
  Plus, 
  TrendingUp,
  Clock,
  CheckCircle,
  Send,
  Settings,
} from 'lucide-react';
import { getStatistics, getQuotations } from '@/lib/clinical-pathology-api';
import type { ClinicalStatistics, ClinicalQuotation } from '@/types/clinical-pathology';
import { QUOTATION_STATUS_LABELS } from '@/types/clinical-pathology';

export default function ClinicalPathologyPage() {
  const router = useRouter();
  const [statistics, setStatistics] = useState<ClinicalStatistics | null>(null);
  const [recentQuotations, setRecentQuotations] = useState<ClinicalQuotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [stats, quotationsRes] = await Promise.all([
        getStatistics(),
        getQuotations({ limit: 5 }),
      ]);
      setStatistics(stats);
      setRecentQuotations(quotationsRes.quotations);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      DRAFT: 'secondary',
      SENT: 'default',
      ACCEPTED: 'default',
      REJECTED: 'destructive',
      EXPIRED: 'outline',
      CONVERTED: 'default',
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {QUOTATION_STATUS_LABELS[status as keyof typeof QUOTATION_STATUS_LABELS] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">임상병리검사</h1>
          <p className="text-muted-foreground">임상병리검사 견적서 및 시험의뢰서 관리</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/clinical-pathology/settings')}>
            <Settings className="h-4 w-4 mr-2" />
            설정
          </Button>
          <Button onClick={() => router.push('/clinical-pathology/quotations/new')}>
            <Plus className="h-4 w-4 mr-2" />
            새 견적서
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 견적서</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.quotations.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              작성중 {statistics?.quotations.draft || 0}건
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">발송 완료</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.quotations.sent || 0}</div>
            <p className="text-xs text-muted-foreground">
              승인 대기중
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">시험의뢰서</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.testRequests.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              진행중 {statistics?.testRequests.inProgress || 0}건
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 견적</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.monthly.count || 0}건</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(statistics?.monthly.amount || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 빠른 액션 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => router.push('/clinical-pathology/quotations')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              견적서 관리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              임상병리검사 견적서 목록 조회 및 관리
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => router.push('/clinical-pathology/test-requests')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              시험의뢰서 관리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              시험의뢰서 목록 조회 및 진행 상태 관리
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 최근 견적서 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>최근 견적서</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => router.push('/clinical-pathology/quotations')}>
            전체보기
          </Button>
        </CardHeader>
        <CardContent>
          {recentQuotations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              아직 작성된 견적서가 없습니다.
            </p>
          ) : (
            <div className="space-y-4">
              {recentQuotations.map((quotation) => (
                <div
                  key={quotation.id}
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => router.push(`/clinical-pathology/quotations/${quotation.id}`)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{quotation.quotationNumber}</span>
                      {getStatusBadge(quotation.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {quotation.customerName} · {quotation.contactName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(quotation.totalAmount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(quotation.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
