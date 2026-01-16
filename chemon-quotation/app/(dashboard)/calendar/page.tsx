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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTodayEvents, getThisWeekEvents } from '@/lib/calendar-event-storage';
import { useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';

export default function CalendarPage() {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [weekEvents, setWeekEvents] = useState<CalendarEvent[]>([]);

  // 오늘 및 이번 주 이벤트 로드
  const loadSidebarEvents = () => {
    setTodayEvents(getTodayEvents());
    setWeekEvents(getThisWeekEvents());
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
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          캘린더
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          일정을 관리하고 중요한 날짜를 확인하세요
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 메인 캘린더 */}
        <div className="lg:col-span-3">
          <CalendarView onEventClick={handleEventClick} />
        </div>

        {/* 사이드바 */}
        <div className="space-y-4">
          {/* 오늘의 일정 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                오늘의 일정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {todayEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
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
            </CardContent>
          </Card>

          {/* 이번 주 일정 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                이번 주 일정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
              {weekEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  이번 주 예정된 일정이 없습니다
                </p>
              ) : (
                weekEvents.map((event) => (
                  <div key={event.id} className="space-y-1">
                    <div className="text-xs text-muted-foreground">
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 이벤트 상세/수정 다이얼로그 */}
      <Dialog open={isEventDetailOpen} onOpenChange={setIsEventDetailOpen}>
        <DialogContent className="max-w-md">
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
