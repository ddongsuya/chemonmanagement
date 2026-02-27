'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Skeleton from '@/components/ui/Skeleton';
import {
  MapPin, FileText, Calendar, Users, ClipboardList, ChevronRight,
  Phone as PhoneIcon, Mail as MailIcon, Video, MessageSquare,
} from 'lucide-react';
import { progressStageApi, meetingRecordApi, calendarEventApi } from '@/lib/customer-data-api';
import type { ProgressStage, MeetingRecord, CalendarEvent } from '@/types/customer';

type TabType = 'overview' | 'calendar' | 'meetings' | 'tests' | 'invoices' | 'requesters';

interface OverviewTabProps {
  customer: {
    address?: string | null;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
  };
  customerId: string;
  onTabChange: (tab: TabType) => void;
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

export default function OverviewTab({ customer, customerId, onTabChange }: OverviewTabProps) {
  const [progressStage, setProgressStage] = useState<ProgressStage | null>(null);
  const [recentMeetings, setRecentMeetings] = useState<MeetingRecord[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [stage, meetings, events] = await Promise.allSettled([
          progressStageApi.getByCustomerId(customerId),
          meetingRecordApi.getByCustomerId(customerId),
          calendarEventApi.getByCustomerId(customerId),
        ]);
        if (stage.status === 'fulfilled') setProgressStage(stage.value);
        if (meetings.status === 'fulfilled') {
          const sorted = meetings.value.sort((a, b) =>
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
      } catch (err) {
        console.error('Failed to load overview data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [customerId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 기본 정보 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" /> 기본 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {customer.address && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <span>{customer.address}</span>
            </div>
          )}
          {customer.notes && (
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <span className="whitespace-pre-wrap">{customer.notes}</span>
            </div>
          )}
          <div className="flex gap-6 pt-2 text-muted-foreground text-xs">
            <span>등록: {new Date(customer.createdAt).toLocaleDateString('ko-KR')}</span>
            <span>수정: {new Date(customer.updatedAt).toLocaleDateString('ko-KR')}</span>
          </div>
        </CardContent>
      </Card>

      {/* 진행 단계 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> 진행 단계
          </CardTitle>
        </CardHeader>
        <CardContent>
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
            <p className="text-sm text-muted-foreground">진행 단계 정보가 없습니다</p>
          )}
        </CardContent>
      </Card>

      {/* 최근 미팅 기록 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" /> 최근 미팅 기록
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onTabChange('meetings')} className="text-xs">
              더보기 <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentMeetings.length > 0 ? (
            <div className="space-y-2">
              {recentMeetings.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 text-sm">
                  <span className="text-muted-foreground">{MEETING_TYPE_ICONS[m.type]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(m.date).toLocaleDateString('ko-KR')} · {MEETING_TYPE_LABELS[m.type] || m.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">등록된 미팅 기록이 없습니다</p>
          )}
        </CardContent>
      </Card>

      {/* 다가오는 일정 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" /> 다가오는 일정
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onTabChange('calendar')} className="text-xs">
              더보기 <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-2">
              {upcomingEvents.map(e => (
                <div key={e.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 text-sm">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: e.color || '#3b82f6' }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(e.start_date).toLocaleDateString('ko-KR')}
                      {e.all_day ? ' (종일)' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">다가오는 일정이 없습니다</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
