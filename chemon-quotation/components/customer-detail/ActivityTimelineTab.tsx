'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Skeleton from '@/components/ui/Skeleton';
import {
  FileText,
  Handshake,
  Users,
  CalendarDays,
  Activity,
  MessageSquare,
  StickyNote,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { activityTimelineApi } from '@/lib/customer-data-api';
import { getNotes } from '@/lib/unified-customer-api';
import type { TimelineItem } from '@/types/customer-crm';

interface ActivityTimelineTabProps {
  customerId: string;
}

type ActivityType = 'all' | TimelineItem['type'] | 'note';

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  quotation: { label: '견적', icon: FileText, color: 'bg-blue-100 text-blue-700' },
  contract: { label: '계약', icon: Handshake, color: 'bg-green-100 text-green-700' },
  meeting: { label: '미팅', icon: Users, color: 'bg-purple-100 text-purple-700' },
  calendar_event: { label: '일정', icon: CalendarDays, color: 'bg-orange-100 text-orange-700' },
  lead_activity: { label: '리드', icon: Activity, color: 'bg-cyan-100 text-cyan-700' },
  consultation: { label: '상담', icon: MessageSquare, color: 'bg-pink-100 text-pink-700' },
  note: { label: '메모', icon: StickyNote, color: 'bg-yellow-100 text-yellow-700' },
};

export default function ActivityTimelineTab({ customerId }: ActivityTimelineTabProps) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<ActivityType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadTimeline = async () => {
    setLoading(true);
    try {
      const [timelineItems, notesRes] = await Promise.all([
        activityTimelineApi.getByCustomerId(customerId),
        getNotes(customerId, 1, 50),
      ]);

      const allItems: TimelineItem[] = [...timelineItems];

      // 메모를 타임라인 아이템으로 변환
      if (notesRes.success && Array.isArray((notesRes.data as any)?.data)) {
        const notes = (notesRes.data as any).data;
        for (const note of notes) {
          allItems.push({
            id: `note-${note.id}`,
            type: 'note' as any,
            title: '메모 작성',
            description: note.content?.substring(0, 100) || '',
            date: note.createdAt,
          });
        }
      }

      // 날짜 내림차순 정렬
      allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setItems(allItems);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTimeline(); }, [customerId]);

  const filtered = items.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  });

  // 날짜별 그룹핑
  const grouped = filtered.reduce<Record<string, TimelineItem[]>>((acc, item) => {
    const dateKey = new Date(item.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">활동 타임라인</CardTitle>
          <Button variant="ghost" size="sm" onClick={loadTimeline}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="활동 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <Select value={filterType} onValueChange={(v) => setFilterType(v as ActivityType)}>
            <SelectTrigger className="w-[130px] h-9">
              <Filter className="h-3.5 w-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p>활동 내역이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([dateLabel, dateItems]) => (
              <div key={dateLabel}>
                <div className="text-xs font-medium text-muted-foreground mb-3 sticky top-0 bg-background py-1">
                  {dateLabel}
                </div>
                <div className="relative pl-6 border-l-2 border-muted space-y-4">
                  {dateItems.map((item) => {
                    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.lead_activity;
                    const Icon = config.icon;
                    return (
                      <div key={item.id} className="relative">
                        <div className="absolute -left-[25px] top-0.5 h-6 w-6 rounded-full bg-background border-2 border-muted flex items-center justify-center">
                          <Icon className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="pb-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${config.color}`}>
                              {config.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.date).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{item.title}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
