'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Skeleton from '@/components/ui/Skeleton';
import { UserPlus, Phone, Mail, Video, StickyNote, RefreshCw } from 'lucide-react';
import { leadActivityApi } from '@/lib/customer-data-api';
import type { LeadActivityData } from '@/types/customer-crm';

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: '웹사이트',
  REFERRAL: '소개',
  COLD_CALL: '콜드콜',
  EXHIBITION: '전시회',
  INBOUND: '인바운드',
  OTHER: '기타',
};

const STATUS_LABELS: Record<string, string> = {
  NEW: '신규',
  CONTACTED: '연락완료',
  QUALIFIED: '검토완료',
  PROPOSAL: '견적발송',
  NEGOTIATION: '협상중',
  CONVERTED: '계약전환',
  LOST: '실패',
  DORMANT: '휴면',
};

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  CALL: <Phone className="w-4 h-4" />,
  EMAIL: <Mail className="w-4 h-4" />,
  MEETING: <Video className="w-4 h-4" />,
  NOTE: <StickyNote className="w-4 h-4" />,
};

const ACTIVITY_LABELS: Record<string, string> = {
  CALL: '통화',
  EMAIL: '이메일',
  MEETING: '미팅',
  NOTE: '메모',
};

export default function LeadActivityTab({ customerId }: { customerId: string }) {
  const [data, setData] = useState<LeadActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await leadActivityApi.getByCustomerId(customerId);
      setData(result);
    } catch {
      setError('리드 활동 데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [customerId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
        <Card><CardContent className="p-4"><Skeleton className="h-32 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-destructive mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-1" /> 재시도
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data?.lead) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <UserPlus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">연결된 리드 정보가 없습니다</p>
        </CardContent>
      </Card>
    );
  }

  const { lead, activities } = data;

  return (
    <div className="space-y-4">
      {/* 리드 요약 카드 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> 리드 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">리드번호</span>
              <p className="font-medium">{lead.leadNumber}</p>
            </div>
            <div>
              <span className="text-muted-foreground">소스</span>
              <p className="font-medium">{SOURCE_LABELS[lead.source] || lead.source}</p>
            </div>
            <div>
              <span className="text-muted-foreground">상태</span>
              <p><Badge variant="outline">{STATUS_LABELS[lead.status] || lead.status}</Badge></p>
            </div>
            <div>
              <span className="text-muted-foreground">파이프라인 단계</span>
              <p className="font-medium">{lead.stageName}</p>
            </div>
            {lead.expectedAmount && (
              <div>
                <span className="text-muted-foreground">예상금액</span>
                <p className="font-medium">{lead.expectedAmount.toLocaleString()}원</p>
              </div>
            )}
            {lead.convertedAt && (
              <div>
                <span className="text-muted-foreground">전환일</span>
                <p className="font-medium">{new Date(lead.convertedAt).toLocaleDateString('ko-KR')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 활동 이력 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">활동 이력 ({activities.length}건)</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">등록된 활동이 없습니다</p>
          ) : (
            <div className="space-y-3">
              {activities.map(a => (
                <div key={a.id} className="flex gap-3 p-3 rounded-md border text-sm">
                  <div className="text-muted-foreground mt-0.5">
                    {ACTIVITY_ICONS[a.type] || <StickyNote className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{a.subject}</span>
                      <Badge variant="outline" className="text-xs">
                        {ACTIVITY_LABELS[a.type] || a.type}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground line-clamp-2">{a.content}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{new Date(a.contactedAt).toLocaleDateString('ko-KR')}</span>
                      <span>{a.userName}</span>
                      {a.nextAction && <span>다음: {a.nextAction}</span>}
                    </div>
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
