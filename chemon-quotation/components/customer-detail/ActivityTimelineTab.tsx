'use client';

import { useState, useEffect, useRef } from 'react';
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
  FileText, Handshake, Users, CalendarDays, Activity,
  MessageSquare, StickyNote, Search, Filter, RefreshCw,
  Phone, Mail, Video, MapPin, Send, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { activityTimelineApi, meetingRecordApi } from '@/lib/customer-data-api';
import { getNotes, createNote } from '@/lib/unified-customer-api';
import { useToast } from '@/hooks/use-toast';
import type { TimelineItem } from '@/types/customer-crm';

interface ActivityTimelineTabProps {
  customerId: string;
  requesterId?: string | null;
}

type ActivityType = 'all' | TimelineItem['type'] | 'note';

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  quotation: { label: '견적', icon: FileText, color: 'bg-blue-100 text-blue-700' },
  contract: { label: '계약', icon: Handshake, color: 'bg-green-100 text-green-700' },
  meeting: { label: '미팅', icon: Video, color: 'bg-purple-100 text-purple-700' },
  call: { label: '통화', icon: Phone, color: 'bg-emerald-100 text-emerald-700' },
  email: { label: '이메일', icon: Mail, color: 'bg-indigo-100 text-indigo-700' },
  visit: { label: '방문', icon: MapPin, color: 'bg-amber-100 text-amber-700' },
  calendar_event: { label: '일정', icon: CalendarDays, color: 'bg-orange-100 text-orange-700' },
  lead_activity: { label: '리드', icon: Activity, color: 'bg-cyan-100 text-cyan-700' },
  consultation: { label: '상담', icon: MessageSquare, color: 'bg-pink-100 text-pink-700' },
  note: { label: '메모', icon: StickyNote, color: 'bg-yellow-100 text-yellow-700' },
};

const QUICK_TYPES = [
  { value: 'call', label: '통화', icon: Phone },
  { value: 'email', label: '이메일', icon: Mail },
  { value: 'meeting', label: '미팅', icon: Video },
  { value: 'visit', label: '방문', icon: MapPin },
  { value: 'note', label: '메모', icon: StickyNote },
] as const;

const QUICK_TYPE_LABELS: Record<string, string> = {
  call: '통화', email: '이메일', meeting: '미팅', visit: '방문', note: '메모',
};

export default function ActivityTimelineTab({ customerId, requesterId }: ActivityTimelineTabProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<ActivityType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 빠른 입력 상태
  const [quickType, setQuickType] = useState<string>('call');
  const [quickContent, setQuickContent] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
            description: note.content?.substring(0, 200) || '',
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

  useEffect(() => { loadTimeline(); }, [customerId, requesterId]);

  // 빠른 입력 제출
  const handleQuickSubmit = async () => {
    const content = quickContent.trim();
    if (!content) return;
    setSaving(true);
    try {
      if (quickType === 'note') {
        await createNote(customerId, content);
      } else {
        const payload: any = {
          title: `${QUICK_TYPE_LABELS[quickType]} - ${new Date().toLocaleDateString('ko-KR')}`,
          type: quickType,
          date: new Date().toISOString().split('T')[0],
          content,
          attendees: [],
        };
        if (requesterId) payload.requesterId = requesterId;
        await meetingRecordApi.create(customerId, payload);
      }
      setQuickContent('');
      inputRef.current?.focus();
      toast({ title: '기록이 추가되었습니다' });
      await loadTimeline();
    } catch {
      toast({ title: '오류', description: '저장에 실패했습니다', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // 담당자 필터링 + 유형/검색 필터링
  const filtered = items.filter((item) => {
    // 담당자 필터 (미팅 기록에 requesterId가 있는 경우)
    if (requesterId && (item as any).requesterId && (item as any).requesterId !== requesterId) {
      return false;
    }
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

  if (loading && items.length === 0) {
    return (
      <div className="bg-[#FAF2E9] rounded-xl p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 빠른 입력 영역 */}
      <div className="rounded-xl bg-[#FAF2E9] p-3">
        <div className="flex items-center gap-1.5 mb-2.5">
          {QUICK_TYPES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => { setQuickType(value); inputRef.current?.focus(); }}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                quickType === value
                  ? 'bg-slate-800 text-white'
                  : 'bg-[#F5EDE3] text-slate-500 hover:bg-[#EFE7DD]'
              )}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder={`${QUICK_TYPE_LABELS[quickType]} 내용을 입력하세요...`}
            value={quickContent}
            onChange={(e) => setQuickContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleQuickSubmit();
              }
            }}
            className="flex-1"
            disabled={saving}
          />
          <Button
            size="sm"
            onClick={handleQuickSubmit}
            disabled={!quickContent.trim() || saving}
            className="shrink-0"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* 필터 + 타임라인 */}
      <div className="bg-[#FAF2E9] rounded-xl">
        <div className="p-6 pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">커뮤니케이션 히스토리</h3>
            <Button variant="ghost" size="sm" onClick={loadTimeline} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
          <div className="flex gap-2 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="활동 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as ActivityType)}>
              <SelectTrigger className="w-[130px] h-9 bg-white border-none rounded-xl">
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
        </div>
        <div className="px-6 pb-6">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Activity className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>활동 내역이 없습니다</p>
              <p className="text-xs mt-1">위 입력창에서 커뮤니케이션 기록을 추가해보세요</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([dateLabel, dateItems]) => (
                <div key={dateLabel}>
                  <div className="text-xs font-medium text-slate-500 mb-3 sticky top-0 bg-[#FAF2E9] py-1">
                    {dateLabel}
                  </div>
                  <div className="relative pl-6 border-l-2 border-[#F5EDE3] space-y-4">
                    {dateItems.map((item) => {
                      const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.lead_activity;
                      const Icon = config.icon;
                      return (
                        <div key={item.id} className="relative">
                          <div className="absolute -left-[25px] top-0.5 h-6 w-6 rounded-full bg-[#FAF2E9] border-2 border-[#F5EDE3] flex items-center justify-center">
                            <Icon className="h-3 w-3 text-slate-500" />
                          </div>
                          <div className="pb-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${config.color}`}>
                                {config.label}
                              </Badge>
                              <span className="text-xs text-slate-500">
                                {new Date(item.date).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-sm font-medium">{item.title}</p>
                            {item.description && (
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-3 whitespace-pre-wrap">{item.description}</p>
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
        </div>
      </div>
    </div>
  );
}