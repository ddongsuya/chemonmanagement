'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Skeleton from '@/components/ui/Skeleton';
import { UserCircle, RefreshCw, Phone, Mail } from 'lucide-react';
import { requesterApi } from '@/lib/customer-data-api';
import { cn } from '@/lib/utils';
import type { Requester } from '@/types/customer';

interface RequesterTabProps {
  customerId: string;
}

export default function RequesterTab({ customerId }: RequesterTabProps) {
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await requesterApi.getByCustomerId(customerId);
      setRequesters(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [customerId]);

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-3">데이터를 불러오는데 실패했습니다</p>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="w-4 h-4 mr-1" /> 재시도
        </Button>
      </div>
    );
  }

  if (requesters.length === 0) {
    return (
      <div className="text-center py-12">
        <UserCircle className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">등록된 의뢰자가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requesters.map(r => (
        <div key={r.id} className={cn('bg-[#FAF2E9] rounded-xl p-4', !r.is_active && 'opacity-50')}>
            <div className="flex items-center gap-3">
              <UserCircle className="w-8 h-8 text-slate-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{r.name}</p>
                  {r.is_primary && <Badge variant="default" className="text-xs">주 담당자</Badge>}
                  {!r.is_active && <Badge variant="outline" className="text-xs">비활성</Badge>}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                  {r.position && <span>{r.position}</span>}
                  {r.department && <span>{r.department}</span>}
                  {r.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {r.phone}
                    </span>
                  )}
                  {r.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {r.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
        </div>
      ))}
    </div>
  );
}
