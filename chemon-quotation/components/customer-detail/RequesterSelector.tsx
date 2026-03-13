'use client';

/**
 * RequesterSelector - 고객사 상세 페이지 담당자(의뢰자) 선택 바
 * 고객사 → 담당자 선택 → 해당 담당자 기준 정보 표시
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { requesterApi } from '@/lib/customer-data-api';
import type { Requester } from '@/types/customer';
import InlineRequesterForm from './InlineRequesterForm';
import { UserCircle } from 'lucide-react';

interface RequesterSelectorProps {
  customerId: string;
  selectedRequesterId: string | null;
  onSelect: (requesterId: string | null) => void;
}

export default function RequesterSelector({
  customerId,
  selectedRequesterId,
  onSelect,
}: RequesterSelectorProps) {
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequesters = async () => {
    setLoading(true);
    try {
      const data = await requesterApi.getByCustomerId(customerId, true);
      setRequesters(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRequesters(); }, [customerId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 sm:px-6 py-2 border-b bg-white">
        <span className="text-xs text-muted-foreground">담당자:</span>
        <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
        <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
      </div>
    );
  }

  if (requesters.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 sm:px-6 py-2 border-b bg-white">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <UserCircle className="w-3.5 h-3.5" /> 담당자:
        </span>
        <span className="text-xs text-muted-foreground">등록된 담당자가 없습니다</span>
        <InlineRequesterForm customerId={customerId} onSuccess={loadRequesters} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 sm:px-6 py-2 border-b bg-white overflow-x-auto no-scrollbar">
      <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
        <UserCircle className="w-3.5 h-3.5" /> 담당자:
      </span>

      {/* 전체 버튼 */}
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'rounded-full px-3 py-1 text-xs font-medium transition-colors shrink-0',
          !selectedRequesterId
            ? 'bg-slate-900 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        )}
      >
        전체
      </button>

      {/* 담당자 목록 */}
      {requesters.map(r => (
        <button
          key={r.id}
          onClick={() => onSelect(r.id)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition-colors shrink-0 flex items-center gap-1',
            selectedRequesterId === r.id
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          {r.name}
          {r.is_primary && (
            <span className={cn(
              'text-[10px]',
              selectedRequesterId === r.id ? 'text-slate-300' : 'text-slate-400'
            )}>주</span>
          )}
        </button>
      ))}

      {/* 담당자 추가 */}
      <InlineRequesterForm customerId={customerId} onSuccess={loadRequesters} />
    </div>
  );
}
