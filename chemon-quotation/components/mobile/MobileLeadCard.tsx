'use client';

import { Phone, Mail, Building2, Calendar, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Lead {
  id: string;
  leadNumber: string;
  companyName: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  stage: string;
  status: string;
  createdAt: string;
  expectedAmount?: number;
}

interface MobileLeadCardProps {
  lead: Lead;
  className?: string;
}

const stageColors: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  CONTACTED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  PROPOSAL: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  QUOTATION_SENT: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  NEGOTIATION: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  WON: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  LOST: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const stageLabels: Record<string, string> = {
  NEW: '신규',
  CONTACTED: '연락완료',
  PROPOSAL: '제안',
  QUOTATION_SENT: '견적발송',
  NEGOTIATION: '협상중',
  WON: '수주',
  LOST: '실주',
};

export function MobileLeadCard({ lead, className }: MobileLeadCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const formatAmount = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  return (
    <Card className={cn('touch-manipulation', className)}>
      <CardContent className="p-4">
        <Link href={`/leads/${lead.id}`} className="block">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground font-mono">
                  {lead.leadNumber}
                </span>
                <Badge 
                  variant="secondary" 
                  className={cn('text-xs', stageColors[lead.stage])}
                >
                  {stageLabels[lead.stage] || lead.stage}
                </Badge>
              </div>
              <h3 className="font-semibold text-base truncate">
                {lead.companyName}
              </h3>
              {lead.contactName && (
                <p className="text-sm text-muted-foreground truncate">
                  {lead.contactName}
                </p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(lead.createdAt)}</span>
            </div>
            {lead.expectedAmount && (
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground">
                  {formatAmount(lead.expectedAmount)}
                </span>
              </div>
            )}
          </div>
        </Link>

        {/* 빠른 액션 버튼 */}
        <div className="flex items-center gap-2 pt-3 border-t">
          {lead.contactPhone && (
            <a
              href={`tel:${lead.contactPhone}`}
              className="flex items-center justify-center gap-2 flex-1 py-2.5 px-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 transition-colors touch-manipulation"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="h-4 w-4" />
              <span className="text-sm font-medium">전화</span>
            </a>
          )}
          {lead.contactEmail && (
            <a
              href={`mailto:${lead.contactEmail}`}
              className="flex items-center justify-center gap-2 flex-1 py-2.5 px-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors touch-manipulation"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="h-4 w-4" />
              <span className="text-sm font-medium">이메일</span>
            </a>
          )}
          {!lead.contactPhone && !lead.contactEmail && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>연락처 없음</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// 모바일 리드 목록 컴포넌트
interface MobileLeadListProps {
  leads: Lead[];
  isLoading?: boolean;
}

export function MobileLeadList({ leads, isLoading }: MobileLeadListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-1/4 mb-2" />
              <div className="h-5 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">리드가 없습니다</h3>
        <p className="text-sm text-muted-foreground mb-4">
          새로운 리드를 등록해보세요
        </p>
        <Link
          href="/leads/new"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium"
        >
          리드 등록하기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 pb-24">
      {leads.map((lead) => (
        <MobileLeadCard key={lead.id} lead={lead} />
      ))}
    </div>
  );
}
