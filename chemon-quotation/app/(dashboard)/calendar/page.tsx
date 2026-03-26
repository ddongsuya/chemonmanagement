'use client';

import { useState } from 'react';
import CalendarView from '@/components/calendar/CalendarView';
import EventCard from '@/components/calendar/EventCard';
import EventForm from '@/components/calendar/EventForm';
import { CalendarEvent } from '@/types/customer';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { StitchCard } from '@/components/ui/StitchCard';
import { StitchPageHeader } from '@/components/ui/StitchPageHeader';
import { calendarEventApi } from '@/lib/customer-data-api';
import { useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';

export default function CalendarPage() {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [weekEvents, setWeekEvents] = useState<CalendarEvent[]>([]);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);

  // 오늘 및 이번 주 이벤트 로드
  const loadSidebarEvents = async () => {
    try {
      const [today, week] = await Promise.all([
        calendarEventApi.getTodayEvents(),
        calendarEventApi.getThisWeekEvents(),
      ]);
      setTodayEvents(today);
      setWeekEvents(week);
    } catch (error) {
      console.error('Failed to load calendar events:', error);
    }
  };

  useEffect(() => {
    loadSidebarEvents();
  }, []);

  // 이벤트 클릭 핸들러
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDetailOpen(true);
  };

  // 이벤트 수정 성공 핸들러
  const handleEventSuccess = () => {
    setIsEventDetailOpen(false);
    setSelectedEvent(null);
    loadSidebarEvents();
    setCalendarRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 페이지 헤더 */}
      <StitchPageHeader
        label="CALENDAR"
        title="캘린더"
        description="일정을 관리하고 중요한 날짜를 확인하세요"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 메인 캘린더 */}
        <div className="lg:col-span-3">
          <CalendarView onEventClick={handleEventClick} onEventsChange={loadSidebarEvents} refreshKey={calendarRefreshKey} />
        </div>

        {/* 사이드바 */}
        <div className="space-y-4">
          {/* 오늘의 일정 */}
          <StitchCard variant="elevated" padding="md">
            <div className="pb-3">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                오늘의 일정
              </h3>
            </div>
            <div className="space-y-2">
              {todayEvents.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  오늘 예정된 일정이 없습니다
                </p>
              ) : (
                todayEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => handleEventClick(event)}
                  />
                ))
              )}
            </div>
          </StitchCard>

          {/* 이번 주 일정 */}
          <StitchCard variant="elevated" padding="md">
            <div className="pb-3">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                이번 주 일정
              </h3>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {weekEvents.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  이번 주 예정된 일정이 없습니다
                </p>
              ) : (
                weekEvents.map((event) => (
                  <div key={event.id} className="space-y-1">
                    <div className="text-xs text-slate-400">
                      {new Date(event.start_date).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short',
                      })}
                    </div>
                    <EventCard
                      event={event}
                      compact
                      onClick={() => handleEventClick(event)}
                    />
                  </div>
                ))
              )}
            </div>
          </StitchCard>
        </div>
      </div>

      {/* 이벤트 상세/수정 다이얼로그 */}
      <Dialog open={isEventDetailOpen} onOpenChange={setIsEventDetailOpen}>
        <DialogContent className="max-w-lg">
          {selectedEvent && (
            <EventForm
              event={selectedEvent}
              onSuccess={handleEventSuccess}
              onCancel={() => {
                setIsEventDetailOpen(false);
                setSelectedEvent(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
