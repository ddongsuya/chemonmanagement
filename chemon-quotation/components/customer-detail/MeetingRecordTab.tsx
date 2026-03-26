'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Skeleton from '@/components/ui/Skeleton';
import {
  Video, Phone, Mail, MessageSquare, ChevronDown, ChevronUp, RefreshCw, Users,
} from 'lucide-react';
import { meetingRecordApi } from '@/lib/customer-data-api';
import type { MeetingRecord } from '@/types/customer';

interface MeetingRecordTabProps {
  customerId: string;
  requesterId?: string | null;
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  meeting: { icon: <Video className="w-4 h-4" />, label: '미팅', color: 'bg-blue-50 text-blue-700' },
  call: { icon: <Phone className="w-4 h-4" />, label: '통화', color: 'bg-emerald-50 text-emerald-700' },
  email: { icon: <Mail className="w-4 h-4" />, label: '이메일', color: 'bg-violet-50 text-violet-700' },
  visit: { icon: <MessageSquare className="w-4 h-4" />, label: '방문', color: 'bg-orange-50 text-orange-700' },
};

export default function MeetingRecordTab({ customerId, requesterId }: MeetingRecordTabProps) {
  const [records, setRecords] = useState<MeetingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await meetingRecordApi.getByCustomerId(customerId);
      let filtered = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      // 담당자 필터링
      if (requesterId) {
        filtered = filtered.filter(r => (r as any).requester_id === requesterId || (r as any).requesterId === requesterId);
      }
      setRecords(filtered);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [customerId, requesterId]);

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

  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">등록된 미팅 기록이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map(record => {
        const config = TYPE_CONFIG[record.type] || TYPE_CONFIG.meeting;
        const isExpanded = expandedId === record.id;

        return (
          <div
            key={record.id}
            className="bg-[#FAF2E9] rounded-xl cursor-pointer hover:bg-[#FFF8F1] transition-colors"
            onClick={() => setExpandedId(isExpanded ? null : record.id)}
          >
            <div className="p-4">
              <div className="flex items-center gap-3">
                <span className={`p-2 rounded-md ${config.color}`}>{config.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate">{record.title}</p>
                    {record.is_request && (
                      <Badge variant={record.request_status === 'completed' ? 'default' : 'outline'} className="text-xs">
                        {record.request_status === 'completed' ? '완료' : record.request_status === 'in_progress' ? '진행중' : '대기'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>{new Date(record.date).toLocaleDateString('ko-KR')}</span>
                    {record.time && <span>{record.time}</span>}
                    {record.duration && <span>{record.duration}분</span>}
                    {record.attendees?.length > 0 && <span>{record.attendees.join(', ')}</span>}
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 space-y-3 text-sm">
                  {record.content && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">내용</p>
                      <p className="whitespace-pre-wrap">{record.content}</p>
                    </div>
                  )}
                  {record.follow_up_actions && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">후속 조치</p>
                      <p className="whitespace-pre-wrap">{record.follow_up_actions}</p>
                    </div>
                  )}
                  {record.request_response && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">응답</p>
                      <p className="whitespace-pre-wrap">{record.request_response}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
