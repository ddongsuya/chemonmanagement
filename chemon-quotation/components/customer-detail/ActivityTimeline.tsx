'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText, FileSignature, Users, Calendar, UserPlus, MessageSquare, Activity,
} from 'lucide-react';
import type { TimelineItem } from '@/types/customer-crm';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  quotation: <FileText className="w-4 h-4 text-blue-500" />,
  contract: <FileSignature className="w-4 h-4 text-green-500" />,
  meeting: <Users className="w-4 h-4 text-purple-500" />,
  calendar_event: <Calendar className="w-4 h-4 text-orange-500" />,
  lead_activity: <UserPlus className="w-4 h-4 text-cyan-500" />,
  consultation: <MessageSquare className="w-4 h-4 text-pink-500" />,
};

const TYPE_LABELS: Record<string, string> = {
  quotation: '견적서',
  contract: '계약',
  meeting: '미팅',
  calendar_event: '일정',
  lead_activity: '리드 활동',
  consultation: '상담',
};

interface ActivityTimelineProps {
  items: TimelineItem[];
  onItemClick?: (item: TimelineItem) => void;
}

export default function ActivityTimeline({ items, onItemClick }: ActivityTimelineProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4" /> 최근 활동
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">최근 활동이 없습니다</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4" /> 최근 활동
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {items.map((item, idx) => (
            <div
              key={`${item.type}-${item.id}`}
              className={`flex items-start gap-3 p-2 rounded-md text-sm ${
                onItemClick ? 'cursor-pointer hover:bg-muted/50' : ''
              }`}
              onClick={() => onItemClick?.(item)}
            >
              <div className="mt-0.5 shrink-0">
                {TYPE_ICONS[item.type] || <Activity className="w-4 h-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{item.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {TYPE_LABELS[item.type]}
                  </span>
                </div>
                {item.description && (
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {new Date(item.date).toLocaleDateString('ko-KR')}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
