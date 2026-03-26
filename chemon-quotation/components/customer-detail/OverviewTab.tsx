'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Skeleton from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import {
  MapPin, FileText, Calendar, Users, ClipboardList, ChevronRight,
  Phone as PhoneIcon, Mail as MailIcon, Video, MessageSquare,
} from 'lucide-react';
import { progressStageApi, meetingRecordApi, calendarEventApi, customerQuotationApi, customerContractApi, activityTimelineApi } from '@/lib/customer-data-api';
import type { ProgressStage, MeetingRecord, CalendarEvent } from '@/types/customer';
import type { CustomerQuotation, CustomerContract, TimelineItem } from '@/types/customer-crm';
import ActivityTimeline from './ActivityTimeline';
import { FileSignature, AlertTriangle, Heart, DollarSign, Pin } from 'lucide-react';
import { getHealthScore, getNotes } from '@/lib/unified-customer-api';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

type TabType = 'overview' | 'calendar' | 'meetings' | 'tests' | 'invoices' | 'requesters'
  | 'quotations' | 'contracts' | 'lead-activities' | 'consultations'
  | 'notes' | 'documents' | 'audit-log';

interface OverviewTabProps {
  customer: {
    address?: string | null;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
  };
  customerId: string;
  onTabChange: (tab: TabType) => void;
  requesterId?: string | null;
}

const STAGE_LABELS: Record<string, string> = {
  inquiry: '문의접수',
  quotation_sent: '견적서 송부',
  test_request: '시험 의뢰 요청',
  contract_signed: '계약 체결',
  test_reception: '시험접수',
  test_management: '시험관리',
  fund_management: '자금관리',
};

const MEETING_TYPE_ICONS: Record<string, React.ReactNode> = {
  meeting: <Video className="w-4 h-4" />,
  call: <PhoneIcon className="w-4 h-4" />,
  email: <MailIcon className="w-4 h-4" />,
  visit: <MessageSquare className="w-4 h-4" />,
};

const MEETING_TYPE_LABELS: Record<string, string> = {
  meeting: '미팅',
  call: '통화',
  email: '이메일',
  visit: '방문',
};

export default function OverviewTab({ customer, customerId, onTabChange, requesterId }: OverviewTabProps) {
  const [progressStage, setProgressStage] = useState<ProgressStage | null>(null);
  const [recentMeetings, setRecentMeetings] = useState<MeetingRecord[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [quotations, setQuotations] = useState<CustomerQuotation[]>([]);
  const [contracts, setContracts] = useState<CustomerContract[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<{ score: number; churnRiskScore: number } | null>(null);
  const [pinnedNotes, setPinnedNotes] = useState<{ id: string; content: string; createdBy: string; createdAt: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [stage, meetings, events, quots, conts, tl] = await Promise.allSettled([
          progressStageApi.getByCustomerId(customerId),
          meetingRecordApi.getByCustomerId(customerId),
          calendarEventApi.getByCustomerId(customerId),
          customerQuotationApi.getByCustomerId(customerId),
          customerContractApi.getByCustomerId(customerId),
          activityTimelineApi.getByCustomerId(customerId),
        ]);
        if (stage.status === 'fulfilled') setProgressStage(stage.value);
        if (meetings.status === 'fulfilled') {
          let meetingList = meetings.value;
          // 담당자 필터링
          if (requesterId) {
            meetingList = meetingList.filter((m: any) => m.requester_id === requesterId || m.requesterId === requesterId);
          }
          const sorted = meetingList.sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setRecentMeetings(sorted.slice(0, 3));
        }
        if (events.status === 'fulfilled') {
          const now = new Date();
          const upcoming = events.value
            .filter(e => new Date(e.start_date) >= now)
            .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
            .slice(0, 3);
          setUpcomingEvents(upcoming);
        }
        if (quots.status === 'fulfilled') setQuotations(quots.value);
        if (conts.status === 'fulfilled') setContracts(conts.value);
        if (tl.status === 'fulfilled') setTimeline(tl.value);
        // Load CRM extension data
        const [hsRes, notesRes] = await Promise.allSettled([
          getHealthScore(customerId),
          getNotes(customerId, 1, 50),
        ]);
        if (hsRes.status === 'fulfilled' && (hsRes.value as any).success) {
          const d = (hsRes.value as any).data;
          if (d) setHealthData({ score: d.score, churnRiskScore: d.churnRiskScore });
        }
        if (notesRes.status === 'fulfilled' && (notesRes.value as any).success) {
          const d = (notesRes.value as any).data;
          const notes = d?.notes || d || [];
          setPinnedNotes(notes.filter((n: any) => n.isPinned).slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load overview data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [customerId, requesterId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-[#FAF2E9] rounded-xl p-6"><Skeleton className="h-32 w-full" /></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 기본 정보 */}
      <div className="bg-[#FAF2E9] rounded-xl p-6">
        <div className="pb-3">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <FileText className="w-4 h-4" /> 기본 정보
          </h3>
        </div>
        <div className="space-y-3 text-sm">
          {customer.address && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <span>{customer.address}</span>
            </div>
          )}
          {customer.notes && (
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <span className="whitespace-pre-wrap">{customer.notes}</span>
            </div>
          )}
          <div className="flex gap-6 pt-2 text-slate-500 text-xs">
            <span>등록: {new Date(customer.createdAt).toLocaleDateString('ko-KR')}</span>
            <span>수정: {new Date(customer.updatedAt).toLocaleDateString('ko-KR')}</span>
          </div>
        </div>
      </div>

      {/* 진행 단계 */}
      <div className="bg-[#FAF2E9] rounded-xl p-6">
        <div className="pb-3">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> 진행 단계
          </h3>
        </div>
        <div>
          {progressStage ? (
            <div className="space-y-3">
              <Badge variant="default" className="text-sm">
                {STAGE_LABELS[progressStage.current_stage] || progressStage.current_stage}
              </Badge>
              {progressStage.checklist.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  체크리스트: {progressStage.checklist.filter(c => c.is_completed).length}/{progressStage.checklist.length} 완료
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">진행 단계 정보가 없습니다</p>
          )}
        </div>
      </div>

      {/* 최근 미팅 기록 */}
      <div className="bg-[#FAF2E9] rounded-xl p-6">
        <div className="pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Users className="w-4 h-4" /> 최근 미팅 기록
            </h3>
            <Button variant="ghost" size="sm" onClick={() => onTabChange('meetings')} className="text-xs">
              더보기 <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
        <div>
          {recentMeetings.length > 0 ? (
            <div className="space-y-2">
              {recentMeetings.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#FFF8F1] text-sm">
                  <span className="text-slate-500">{MEETING_TYPE_ICONS[m.type]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{m.title}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(m.date).toLocaleDateString('ko-KR')} · {MEETING_TYPE_LABELS[m.type] || m.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">등록된 미팅 기록이 없습니다</p>
          )}
        </div>
      </div>

      {/* 다가오는 일정 */}
      <div className="bg-[#FAF2E9] rounded-xl p-6">
        <div className="pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> 다가오는 일정
            </h3>
            <Button variant="ghost" size="sm" onClick={() => onTabChange('calendar')} className="text-xs">
              더보기 <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
        <div>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-2">
              {upcomingEvents.map(e => (
                <div key={e.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#FFF8F1] text-sm">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: e.color || '#3b82f6' }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{e.title}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(e.start_date).toLocaleDateString('ko-KR')}
                      {e.all_day ? ' (종일)' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">다가오는 일정이 없습니다</p>
          )}
        </div>
      </div>

      {/* 견적서 요약 */}
      <div className="bg-[#FAF2E9] rounded-xl p-6">
        <div className="pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <FileText className="w-4 h-4" /> 견적서
            </h3>
            <Button variant="ghost" size="sm" onClick={() => onTabChange('quotations')} className="text-xs">
              더보기 <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold">{quotations.length}건</p>
          {quotations.length > 0 && (
            <p className="text-xs text-slate-500 mt-1">
              최근: {quotations[0].quotationNumber} ({new Date(quotations[0].createdAt).toLocaleDateString('ko-KR')})
            </p>
          )}
        </div>
      </div>

      {/* 계약 요약 */}
      <div className="bg-[#FAF2E9] rounded-xl p-6">
        <div className="pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <FileSignature className="w-4 h-4" /> 계약
            </h3>
            <Button variant="ghost" size="sm" onClick={() => onTabChange('contracts')} className="text-xs">
              더보기 <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold">{contracts.length}건</p>
          {contracts.length > 0 && (
            <p className="text-xs text-slate-500 mt-1">
              활성: {contracts.filter(c => c.status === 'ACTIVE').length}건
            </p>
          )}
        </div>
      </div>

      {/* 건강도 & 이탈 위험 */}
      {healthData && (
        <div className="bg-[#FAF2E9] rounded-xl p-6">
          <div className="pb-3">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Heart className="w-4 h-4" /> 건강도 & 이탈 위험
            </h3>
          </div>
          <div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className={cn('text-2xl font-bold', healthData.score >= 70 ? 'text-green-600' : healthData.score >= 40 ? 'text-yellow-600' : 'text-red-600')}>
                  {healthData.score}
                </p>
                <p className="text-xs text-slate-500">건강도</p>
              </div>
              <div className="text-center">
                <p className={cn('text-2xl font-bold', healthData.churnRiskScore >= 70 ? 'text-red-600' : healthData.churnRiskScore >= 40 ? 'text-yellow-600' : 'text-green-600')}>
                  {healthData.churnRiskScore}
                </p>
                <p className="text-xs text-slate-500">이탈 위험</p>
              </div>
            </div>
            {healthData.churnRiskScore >= 70 && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 p-2 text-xs text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                이탈 위험이 높습니다. 즉시 관리가 필요합니다.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 고정 메모 */}
      {pinnedNotes.length > 0 && (
        <div className="bg-[#FAF2E9] rounded-xl p-6">
          <div className="pb-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Pin className="w-4 h-4" /> 고정 메모
              </h3>
              <Button variant="ghost" size="sm" onClick={() => onTabChange('notes' as TabType)} className="text-xs">
                더보기 <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {pinnedNotes.map(note => (
              <div key={note.id} className="rounded-xl bg-yellow-50/50 p-2">
                <p className="text-sm line-clamp-2">{note.content}</p>
                <p className="text-[10px] text-slate-500 mt-1">{note.createdBy} · {new Date(note.createdAt).toLocaleDateString('ko-KR')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 최근 활동 타임라인 */}
      <ActivityTimeline
        items={timeline}
        onItemClick={(item) => {
          const tabMap: Record<string, TabType> = {
            quotation: 'quotations',
            contract: 'contracts',
            meeting: 'meetings',
            calendar_event: 'calendar',
            lead_activity: 'lead-activities',
            consultation: 'consultations',
          };
          const tab = tabMap[item.type];
          if (tab) onTabChange(tab);
        }}
      />
    </div>
  );
}
