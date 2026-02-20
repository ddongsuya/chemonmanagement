'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, User, Phone, Mail, ChevronRight, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UnifiedEntity, EntityType } from '@/types/unified-customer';
import { ENTITY_TYPE_BADGE_CONFIG } from '@/types/unified-customer';

/**
 * UnifiedCustomerCard 컴포넌트 Props
 * 
 * @requirements 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 8.1, 8.2
 */
export interface UnifiedCustomerCardProps {
  /** 통합 엔티티 (리드 또는 고객) */
  entity: UnifiedEntity;
  /** 클릭 이벤트 핸들러 (상세 페이지 이동) */
  onClick: (entity: UnifiedEntity) => void;
  /** 등급 변경 핸들러 (고객 전용) */
  onGradeChange?: (entity: UnifiedEntity, newGrade: string) => void;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 엔티티 유형 배지 컴포넌트
 * 
 * @requirements 1.2 - 각 항목에 유형 배지(리드/고객)를 표시
 */
function EntityTypeBadge({ entityType }: { entityType: EntityType }) {
  const config = ENTITY_TYPE_BADGE_CONFIG[entityType];
  
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

/**
 * 파이프라인 단계 배지 컴포넌트
 * 
 * @requirements 2.1, 2.2, 2.3, 2.4 - 파이프라인 단계 배지 표시 (색상 포함)
 */
function StageBadge({ 
  displayStage, 
  stageColor 
}: { 
  displayStage: string; 
  stageColor: string;
}) {
  // HEX 색상을 배경색과 텍스트색으로 변환
  // 밝은 배경색과 어두운 텍스트색 사용
  const style = {
    backgroundColor: `${stageColor}20`, // 20% 투명도
    color: stageColor,
    borderColor: `${stageColor}40`, // 40% 투명도
  };

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border"
      style={style}
    >
      {displayStage}
    </span>
  );
}

/**
 * UnifiedCustomerCard 컴포넌트
 * 
 * 리드와 고객을 통합된 형태로 표시하는 카드 컴포넌트입니다.
 * 
 * @requirements 1.2 - 각 항목에 유형 배지(리드/고객)를 표시
 * @requirements 1.3 - 리드의 companyName, contactName, contactEmail, contactPhone, stage 정보 표시
 * @requirements 1.4 - 고객의 company, name, email, phone, grade 정보 표시
 * @requirements 2.1 - 리드의 PipelineStage 이름과 색상을 배지로 표시
 * @requirements 2.2 - 고객의 grade에 따른 단계를 배지로 표시
 * @requirements 2.3 - CONVERTED 상태 리드는 "계약전환" 단계 표시
 * @requirements 8.1 - 리드 클릭 시 /leads/{leadId} 페이지로 이동
 * @requirements 8.2 - 고객 클릭 시 상세 모달 또는 페이지 표시
 */
const GRADE_OPTIONS = [
  { value: 'LEAD', label: '리드', color: '#6B7280' },
  { value: 'PROSPECT', label: '잠재고객', color: '#3B82F6' },
  { value: 'CUSTOMER', label: '고객', color: '#10B981' },
  { value: 'VIP', label: 'VIP', color: '#8B5CF6' },
  { value: 'INACTIVE', label: '비활성', color: '#EF4444' },
] as const;

export default function UnifiedCustomerCard({ 
  entity, 
  onClick,
  onGradeChange,
  className 
}: UnifiedCustomerCardProps) {
  const handleClick = () => {
    onClick(entity);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(entity);
    }
  };

  return (
    <Card 
      className={cn(
        'cursor-pointer hover:shadow-md transition-all duration-200',
        'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${entity.companyName} - ${entity.entityType === 'LEAD' ? '리드' : '고객'}`}
    >
      <CardContent className="p-4">
        {/* 상단: 회사명, 배지들, 화살표 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            {/* 배지 영역 */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {/* 엔티티 유형 배지 (리드/고객) - Requirements 1.2 */}
              <EntityTypeBadge entityType={entity.entityType} />
              
              {/* 파이프라인 단계 배지 - Requirements 2.1, 2.2, 2.3 */}
              {entity.entityType === 'CUSTOMER' && onGradeChange ? (
                <Select
                  value={entity.grade || 'LEAD'}
                  onValueChange={(val) => {
                    onGradeChange(entity, val);
                  }}
                >
                  <SelectTrigger
                    className="h-6 w-auto px-2 text-xs font-semibold border rounded-full"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span style={{ color: opt.color }}>{opt.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <StageBadge 
                  displayStage={entity.displayStage} 
                  stageColor={entity.stageColor} 
                />
              )}
              
              {/* 리드 번호 표시 (리드인 경우) */}
              {entity.entityType === 'LEAD' && entity.leadNumber && (
                <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {entity.leadNumber}
                </span>
              )}
            </div>
            
            {/* 회사명 - Requirements 1.3, 1.4 */}
            <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 truncate">
              {entity.companyName}
            </h3>
          </div>
          
          {/* 화살표 아이콘 */}
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2 mt-1" />
        </div>

        {/* 중간: 담당자 정보 - Requirements 1.3, 1.4 */}
        <div className="space-y-1.5 text-sm">
          {/* 담당자명 */}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{entity.contactName}</span>
          </div>
          
          {/* 연락처 정보 */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* 전화번호 */}
            {entity.contactPhone && (
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{entity.contactPhone}</span>
              </div>
            )}
            
            {/* 이메일 */}
            {entity.contactEmail && (
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{entity.contactEmail}</span>
              </div>
            )}
            
            {/* 연락처 없음 표시 */}
            {!entity.contactPhone && !entity.contactEmail && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <span>연락처 없음</span>
              </div>
            )}
          </div>
        </div>

        {/* 하단: 추가 정보 (선택적) */}
        {(entity.entityType === 'LEAD' && entity.expectedAmount) || 
         (entity.entityType === 'CUSTOMER' && entity.quotationCount !== undefined) ? (
          <div className="flex items-center gap-3 pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
            {/* 리드: 예상 금액 */}
            {entity.entityType === 'LEAD' && entity.expectedAmount && (
              <Badge variant="outline" className="text-xs">
                예상 {formatCurrency(entity.expectedAmount)}
              </Badge>
            )}
            
            {/* 고객: 견적 수 및 총 금액 */}
            {entity.entityType === 'CUSTOMER' && (
              <>
                {entity.quotationCount !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    견적 {entity.quotationCount}건
                  </span>
                )}
                {entity.totalAmount !== undefined && entity.totalAmount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {formatCurrency(entity.totalAmount)}
                  </Badge>
                )}
              </>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

/**
 * 금액 포맷팅 유틸리티 함수
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

/**
 * UnifiedCustomerCard 스켈레톤 컴포넌트
 * 로딩 상태에서 표시되는 플레이스홀더
 */
export function UnifiedCustomerCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-4">
        {/* 상단 배지 영역 */}
        <div className="flex items-center gap-2 mb-2">
          <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
        
        {/* 회사명 */}
        <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
        
        {/* 담당자 정보 */}
        <div className="space-y-2">
          <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}
