'use client';

/**
 * EnhancedCustomerCard - 개선된 고객 카드 (건강도, 태그, 빠른 액션)
 */

import { Phone, Mail, StickyNote, AlertTriangle, FileText, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UnifiedEntity } from '@/types/unified-customer';
import { ENTITY_TYPE_BADGE_CONFIG } from '@/types/unified-customer';

interface EnhancedCustomerCardProps {
  entity: UnifiedEntity;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onClick?: (entity: UnifiedEntity) => void;
}

function HealthGauge({ score }: { score: number }) {
  const color = score >= 70 ? 'text-green-500' : score >= 40 ? 'text-yellow-500' : 'text-red-500';
  const bgColor = score >= 70 ? 'stroke-green-100' : score >= 40 ? 'stroke-yellow-100' : 'stroke-red-100';
  const fgColor = score >= 70 ? 'stroke-green-500' : score >= 40 ? 'stroke-yellow-500' : 'stroke-red-500';
  const circumference = 2 * Math.PI * 16;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative h-10 w-10 flex-shrink-0" aria-label={`건강도 ${score}점`}>
      <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="16" fill="none" strokeWidth="3" className={bgColor} />
        <circle cx="18" cy="18" r="16" fill="none" strokeWidth="3" className={fgColor}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className={cn('absolute inset-0 flex items-center justify-center text-xs font-bold', color)}>
        {score}
      </span>
    </div>
  );
}

function getGradeColor(grade?: string): string {
  const map: Record<string, string> = {
    LEAD: 'bg-slate-400', PROSPECT: 'bg-blue-500', CUSTOMER: 'bg-green-500', VIP: 'bg-purple-500', INACTIVE: 'bg-red-400',
  };
  return map[grade || ''] || 'bg-slate-300';
}

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

function formatDaysAgo(dateStr?: string): string {
  if (!dateStr) return '-';
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return '오늘';
  if (days === 1) return '어제';
  return `${days}일 전`;
}

export function EnhancedCustomerCard({ entity, isSelected, onSelect, onClick }: EnhancedCustomerCardProps) {
  const badge = ENTITY_TYPE_BADGE_CONFIG[entity.entityType];
  const tags = entity.tags || [];
  const showChurnWarning = (entity.churnRiskScore ?? 0) >= 70;
  const showDataWarning = (entity.dataQualityScore ?? 0) < 50 && entity.entityType === 'CUSTOMER';

  return (
    <div
      className={cn(
        'group relative flex cursor-pointer rounded-xl bg-white p-4 transition-all duration-200 hover:translate-y-[-2px] shadow-ambient',
        isSelected && 'ring-2 ring-primary'
      )}
      onClick={() => onClick?.(entity)}
      role="button"
      tabIndex={0}
      aria-label={`${entity.companyName} - ${entity.displayStage}`}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(entity)}
    >
      {/* 등급 인디케이터 바 */}
      <div className={cn('absolute left-0 top-0 h-full w-1 rounded-l-lg', getGradeColor(entity.grade))} />

      <div className="ml-2 flex flex-1 flex-col gap-3">
        {/* 상단: 유형 배지 + 회사명 + 경고 아이콘 */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => { e.stopPropagation(); onSelect(entity.id); }}
                className="h-4 w-4 rounded border-slate-300"
                aria-label={`${entity.companyName} 선택`}
              />
            )}
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', badge.className)}>
              {badge.label}
            </span>
            <h3 className="text-sm font-semibold">{entity.companyName}</h3>
          </div>
          <div className="flex items-center gap-1">
            {showChurnWarning && (
              <AlertTriangle className="h-4 w-4 text-orange-500" aria-label="이탈 위험" />
            )}
            {showDataWarning && (
              <AlertTriangle className="h-4 w-4 text-yellow-500" aria-label="데이터 불완전" />
            )}
          </div>
        </div>

        {/* 중간: 담당자 + 건강도 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {getInitials(entity.contactName)}
            </div>
            <div>
              <p className="text-sm">{entity.contactName}</p>
              <p className="text-xs text-muted-foreground">{entity.contactPhone || entity.contactEmail || '-'}</p>
            </div>
          </div>
          {entity.healthScore != null && <HealthGauge score={entity.healthScore} />}
        </div>

        {/* 태그 */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs">{tag}</span>
            ))}
            {tags.length > 3 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">+{tags.length - 3}</span>
            )}
          </div>
        )}

        {/* 하단: 단계 + 견적/계약 + 최근 활동 */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="rounded-full px-2 py-0.5" style={{ backgroundColor: entity.stageColor + '20', color: entity.stageColor }}>
            {entity.displayStage}
          </span>
          <div className="flex items-center gap-3">
            {entity.activeQuotationCount != null && (
              <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{entity.activeQuotationCount}</span>
            )}
            {entity.activeContractCount != null && (
              <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{entity.activeContractCount}</span>
            )}
            <span>{formatDaysAgo(entity.lastActivityAt)}</span>
          </div>
        </div>
      </div>

      {/* 호버 시 빠른 액션 */}
      <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
        {entity.contactPhone && (
          <a href={`tel:${entity.contactPhone}`} onClick={(e) => e.stopPropagation()}
            className="rounded-full bg-background p-1.5 shadow-ambient hover:bg-[#FAF2E9]" aria-label="전화 걸기">
            <Phone className="h-3.5 w-3.5" />
          </a>
        )}
        {entity.contactEmail && (
          <a href={`mailto:${entity.contactEmail}`} onClick={(e) => e.stopPropagation()}
            className="rounded-full bg-background p-1.5 shadow-ambient hover:bg-[#FAF2E9]" aria-label="이메일 보내기">
            <Mail className="h-3.5 w-3.5" />
          </a>
        )}
        <button onClick={(e) => e.stopPropagation()}
          className="rounded-full bg-background p-1.5 shadow-ambient hover:bg-[#FAF2E9]" aria-label="메모 추가">
          <StickyNote className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
