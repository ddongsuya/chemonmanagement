'use client';

/**
 * CustomerSummaryHeader - 고객 360도 뷰 헤더 (CRM 확장)
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Edit, Building2, User, Phone, Mail, StickyNote, Tag, Shield, TrendingDown, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getHealthScore, getDataQuality } from '@/lib/unified-customer-api';

interface CustomerSummaryHeaderProps {
  customer: {
    id: string;
    company?: string | null;
    name: string;
    phone?: string | null;
    email?: string | null;
    grade?: string;
    createdAt?: string;
  };
  onGradeChange: (grade: string) => void;
  gradeUpdating: boolean;
  onEdit: () => void;
  onBack: () => void;
}

const GRADE_OPTIONS = [
  { value: 'LEAD', label: '리드', color: '#6B7280' },
  { value: 'PROSPECT', label: '잠재고객', color: '#3B82F6' },
  { value: 'CUSTOMER', label: '고객', color: '#10B981' },
  { value: 'VIP', label: 'VIP', color: '#8B5CF6' },
  { value: 'INACTIVE', label: '비활성', color: '#EF4444' },
] as const;

function MiniGauge({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative h-9 w-9">
        <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3" className="stroke-muted" />
          <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3" stroke={color}
            strokeDasharray={`${(value / 100) * 94.2} 94.2`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color }}>{value}</span>
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

export default function CustomerSummaryHeader({
  customer,
  onGradeChange,
  gradeUpdating,
  onEdit,
  onBack,
}: CustomerSummaryHeaderProps) {
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [churnRisk, setChurnRisk] = useState<number | null>(null);
  const [dataQuality, setDataQuality] = useState<number | null>(null);

  useEffect(() => {
    async function loadScores() {
      const [hsRes, dqRes] = await Promise.allSettled([
        getHealthScore(customer.id),
        getDataQuality(customer.id),
      ]);
      if (hsRes.status === 'fulfilled' && hsRes.value.success && hsRes.value.data) {
        const d = hsRes.value.data as any;
        setHealthScore(d.score ?? null);
        setChurnRisk(d.churnRiskScore ?? null);
      }
      if (dqRes.status === 'fulfilled' && dqRes.value.success && dqRes.value.data) {
        const d = dqRes.value.data as any;
        setDataQuality(d.score ?? null);
      }
    }
    loadScores();
  }, [customer.id]);

  const isVIP = customer.grade === 'VIP';
  const daysSinceCreation = customer.createdAt
    ? Math.floor((Date.now() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className={cn(
      'bg-card border rounded-lg p-4 sm:p-6 mb-6',
      isVIP && 'border-yellow-400/50 ring-1 ring-yellow-400/20'
    )}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* 좌측: 기본 정보 */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 mt-0.5">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Building2 className="w-5 h-5 text-muted-foreground shrink-0" />
              <h1 className="text-xl font-bold truncate">
                {customer.company || customer.name}
              </h1>
              {isVIP && <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">VIP</span>}
              <Select value={customer.grade || 'LEAD'} onValueChange={onGradeChange} disabled={gradeUpdating}>
                <SelectTrigger className="w-[120px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{customer.name}</span>
              {customer.phone && (
                <a href={`tel:${customer.phone}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  <Phone className="w-3.5 h-3.5" />{customer.phone}
                </a>
              )}
              {customer.email && (
                <a href={`mailto:${customer.email}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  <Mail className="w-3.5 h-3.5" />{customer.email}
                </a>
              )}
              {daysSinceCreation != null && (
                <span className="text-xs">거래 {daysSinceCreation}일차</span>
              )}
            </div>
          </div>
        </div>

        {/* 우측: 점수 게이지 + 액션 */}
        <div className="flex items-center gap-4 shrink-0">
          {/* 점수 게이지 */}
          <div className="hidden sm:flex items-center gap-3">
            {healthScore != null && (
              <MiniGauge value={healthScore} label="건강도" color={healthScore >= 70 ? '#10B981' : healthScore >= 40 ? '#F59E0B' : '#EF4444'} />
            )}
            {churnRisk != null && (
              <MiniGauge value={churnRisk} label="이탈위험" color={churnRisk >= 70 ? '#EF4444' : churnRisk >= 40 ? '#F59E0B' : '#10B981'} />
            )}
            {dataQuality != null && (
              <MiniGauge value={dataQuality} label="데이터" color={dataQuality >= 70 ? '#10B981' : dataQuality >= 40 ? '#F59E0B' : '#EF4444'} />
            )}
          </div>

          {/* 빠른 액션 */}
          <div className="flex items-center gap-1">
            {customer.phone && (
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a href={`tel:${customer.phone}`} aria-label="전화 걸기"><Phone className="h-4 w-4" /></a>
              </Button>
            )}
            {customer.email && (
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a href={`mailto:${customer.email}`} aria-label="이메일 보내기"><Mail className="h-4 w-4" /></a>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-1" />수정
            </Button>
          </div>
        </div>
      </div>

      {/* 모바일: 점수 게이지 */}
      <div className="flex sm:hidden items-center gap-3 mt-3 pt-3 border-t justify-center">
        {healthScore != null && (
          <MiniGauge value={healthScore} label="건강도" color={healthScore >= 70 ? '#10B981' : healthScore >= 40 ? '#F59E0B' : '#EF4444'} />
        )}
        {churnRisk != null && (
          <MiniGauge value={churnRisk} label="이탈위험" color={churnRisk >= 70 ? '#EF4444' : churnRisk >= 40 ? '#F59E0B' : '#10B981'} />
        )}
        {dataQuality != null && (
          <MiniGauge value={dataQuality} label="데이터" color={dataQuality >= 70 ? '#10B981' : dataQuality >= 40 ? '#F59E0B' : '#EF4444'} />
        )}
      </div>
    </div>
  );
}
