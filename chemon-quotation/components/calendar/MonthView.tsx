'use client';

import { useMemo } from 'react';
import { CalendarEvent } from '@/types/customer';
import { cn } from '@/lib/utils';
import EventCard from './EventCard';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function MonthView({
  currentDate,
  events,
  onDateClick,
  onEventClick,
}: MonthViewProps) {
  // 캘린더 그리드 데이터 생성
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // 해당 월의 첫째 날과 마지막 날
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // 캘린더 시작일 (첫째 주 일요일)
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // 캘린더 종료일 (마지막 주 토요일)
    const endDate = new Date(lastDayOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentDate]);

  // 특정 날짜의 이벤트 가져오기
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter((event) => {
      const eventStart = event.start_date.split('T')[0];
      const eventEnd = event.end_date ? event.end_date.split('T')[0] : eventStart;
      return dateStr >= eventStart && dateStr <= eventEnd;
    });
  };

  // 오늘 날짜인지 확인
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // 현재 월인지 확인
  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date, e: React.MouseEvent) => {
    // 이벤트 클릭이 아닌 경우에만 날짜 클릭 처리
    if ((e.target as HTMLElement).closest('.event-card')) {
      return;
    }
    if (onDateClick) {
      onDateClick(date);
    }
  };

  return (
    <div className="w-full">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b">
        {WEEKDAYS.map((day, index) => (
          <div
            key={day}
            className={cn(
              'py-2 text-center text-sm font-medium',
              index === 0 && 'text-red-500',
              index === 6 && 'text-blue-500'
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {calendarDays.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const dayOfWeek = date.getDay();

          return (
            <div
              key={date.toISOString()}
              className={cn(
                'min-h-[100px] border-b border-r p-1 cursor-pointer hover:bg-muted/50 transition-colors',
                index % 7 === 0 && 'border-l',
                !isCurrentMonth(date) && 'bg-muted/30'
              )}
              onClick={(e) => handleDateClick(date, e)}
            >
              {/* 날짜 숫자 */}
              <div
                className={cn(
                  'w-7 h-7 flex items-center justify-center text-sm rounded-full mb-1',
                  isToday(date) && 'bg-primary text-primary-foreground font-bold',
                  !isCurrentMonth(date) && 'text-muted-foreground',
                  dayOfWeek === 0 && isCurrentMonth(date) && !isToday(date) && 'text-red-500',
                  dayOfWeek === 6 && isCurrentMonth(date) && !isToday(date) && 'text-blue-500'
                )}
              >
                {date.getDate()}
              </div>

              {/* 이벤트 목록 */}
              <div className="space-y-1 overflow-hidden">
                {dayEvents.slice(0, 3).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    compact
                    onClick={() => onEventClick?.(event)}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground pl-1">
                    +{dayEvents.length - 3}개 더보기
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
