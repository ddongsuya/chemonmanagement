'use client';

import { Phone, Mail, Building2, Calendar, ChevronRight } from 'lucide-react';
import { StitchCard } from '@/components/ui/StitchCard';
import { StitchBadge } from '@/components/ui/StitchBadge';
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

const stageBadgeVariant: Record<string, 'info' | 'warning' | 'primary' | 'success' | 'error' | 'neutral'> = {
  NEW: 'info',
  CONTACTED: 'warning',
  PROPOSAL: 'primary',
  QUOTATION_SENT: 'info',
  NEGOTIATION: 'warning',
  WON: 'success',
  LOST: 'error',
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
    <StitchCard variant="elevated" hover padding="sm" className={cn('touch-manipulation', className)}>
      <Link href={`/leads/${lead.id}`} className="block">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-500 font-mono">
                {lead.leadNumber}
              </span>
              <StitchBadge variant={stageBadgeVariant[lead.stage] || 'neutral'}>
                {stageLabels[lead.stage] || lead.stage}
              </StitchBadge>
            </div>
            <h3 className="font-bold text-base text-slate-900 truncate">
              {lead.companyName}
            </h3>
            {lead.contactName && (
              <p className="text-sm text-slate-500 truncate">
                {lead.contactName}
              </p>
            )}
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400 flex-shrink-0 ml-2" />
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(lead.createdAt)}</span>
          </div>
          {lead.expectedAmount && (
            <div className="flex items-center gap-1">
              <span className="font-bold text-slate-900">
                {formatAmount(lead.expectedAmount)}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* 빠른 액션 버튼 */}
      <div className="flex items-center gap-2 pt-3">
        {lead.contactPhone && (
          <a
            href={`tel:${lead.contactPhone}`}
            className="flex items-center justify-center gap-2 flex-1 py-2.5 px-3 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors touch-manipulation min-h-[44px]"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="h-4 w-4" />
            <span className="text-sm font-bold">전화</span>
          </a>
        )}
        {lead.contactEmail && (
          <a
            href={`mailto:${lead.contactEmail}`}
            className="flex items-center justify-center gap-2 flex-1 py-2.5 px-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors touch-manipulation min-h-[44px]"
            onClick={(e) => e.stopPropagation()}
          >
            <Mail className="h-4 w-4" />
            <span className="text-sm font-bold">이메일</span>
          </a>
        )}
        {!lead.contactPhone && !lead.contactEmail && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Building2 className="h-4 w-4" />
            <span>연락처 없음</span>
          </div>
        )}
      </div>
    </StitchCard>
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
          <StitchCard key={i} variant="elevated" padding="sm" className="animate-pulse">
            <div className="h-4 bg-[#EFE7DD] rounded w-1/4 mb-2" />
            <div className="h-5 bg-[#EFE7DD] rounded w-3/4 mb-2" />
            <div className="h-4 bg-[#EFE7DD] rounded w-1/2" />
          </StitchCard>
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <Building2 className="h-12 w-12 text-slate-400 mb-4" />
        <h3 className="font-bold text-lg text-slate-900 mb-2">리드가 없습니다</h3>
        <p className="text-sm text-slate-500 mb-4">
          새로운 리드를 등록해보세요
        </p>
        <Link
          href="/leads/new"
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-orange-400 text-white font-bold min-h-[44px]"
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
