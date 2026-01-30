'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
} from 'lucide-react';
import { CalendarEvent } from '@/types/customer';
import { calendarEventApi } from '@/lib/customer-data-api';
import MonthView from './MonthView';
import EventForm from './EventForm';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';

export type ViewType = 'month' | 'week' | 'day';

interface CalendarViewProps {
  customerId?: string;
  onEventClick?: (event: CalendarEvent) => void;
}

export default function CalendarView({ customerId, onEventClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 현재 뷰에 맞는 날짜 범위 계산
  const getDateRange = useCallback(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = currentDate.getDate();
    const day = currentDate.getDay();

    let start: Date;
    let end: Date;

    switch (viewType) {
      case 'month':
        // 월간 뷰: 해당 월의 첫째 주 일요일부터 마지막 주 토요일까지
        start = new Date(year, month, 1);
        start.setDate(start.getDate() - start.getDay());
        end = new Date(year, month + 1, 0);
        end.setDate(end.getDate() + (6 - end.getDay()));
        break;
      case 'week':
        // 주간 뷰: 해당 주의 일요일부터 토요일까지
        start = new Date(year, month, date - day);
        end = new Date(year, month, date + (6 - day));
        break;
      case 'day':
        // 일간 뷰: 해당 날짜만
        start = new Date(year, month, date);
        end = new Date(year, month, date);
        break;
      default:
        start = new Date(year, month, 1);
        end = new Date(year, month + 1, 0);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }, [currentDate, viewType]);

  // 이벤트 로드 - API 사용
  const loadEvents = useCallback(async () => {
    try {
      const { start, end } = getDateRange();
      let allEvents: CalendarEvent[];
      
      if (customerId) {
        // 고객사별 이벤트 조회
        allEvents = await calendarEventApi.getByCustomerId(customerId);
        // 날짜 범위 필터링
        const startTime = start.getTime();
        const endTime = end.getTime();
        allEvents = allEvents.filter(e => {
          const eventStart = new Date(e.start_date).getTime();
          const eventEnd = e.end_date ? new Date(e.end_date).getTime() : eventStart;
          return eventStart <= endTime && eventEnd >= startTime;
        });
      } else {
        // 날짜 범위로 전체 이벤트 조회
        allEvents = await calendarEventApi.getByDateRange(
          start.toISOString(),
          end.toISOString()
        );
      }
      
      setEvents(allEvents);
    } catch (error) {
      console.error('Failed to load calendar events:', error);
      setEvents([]);
    }
  }, [getDateRange, customerId]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // 네비게이션 함수들
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    switch (viewType) {
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    switch (viewType) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 날짜 포맷팅
  const formatTitle = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const date = currentDate.getDate();

    switch (viewType) {
      case 'month':
        return `${year}년 ${month}월`;
      case 'week':
        const { start, end } = getDateRange();
        return `${start.getMonth() + 1}월 ${start.getDate()}일 - ${end.getMonth() + 1}월 ${end.getDate()}일`;
      case 'day':
        return `${year}년 ${month}월 ${date}일`;
      default:
        return `${year}년 ${month}월`;
    }
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsEventFormOpen(true);
  };

  // 이벤트 클릭 핸들러
  const handleEventClick = (event: CalendarEvent) => {
    if (onEventClick) {
      onEventClick(event);
    }
  };

  // 이벤트 폼 성공 핸들러
  const handleEventFormSuccess = () => {
    setIsEventFormOpen(false);
    setSelectedDate(null);
    loadEvents();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            캘린더
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* 뷰 타입 선택 */}
            <Select value={viewType} onValueChange={(v: ViewType) => setViewType(v)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">월간</SelectItem>
                <SelectItem value="week">주간</SelectItem>
                <SelectItem value="day">일간</SelectItem>
              </SelectContent>
            </Select>

            {/* 이벤트 추가 버튼 */}
            <Dialog open={isEventFormOpen} onOpenChange={setIsEventFormOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  일정 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <EventForm
                  customerId={customerId}
                  initialDate={selectedDate || undefined}
                  onSuccess={handleEventFormSuccess}
                  onCancel={() => {
                    setIsEventFormOpen(false);
                    setSelectedDate(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 네비게이션 */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPrevious}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              오늘
            </Button>
            <Button variant="outline" size="sm" onClick={goToNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold">{formatTitle()}</h2>
        </div>
      </CardHeader>

      <CardContent>
        {viewType === 'month' && (
          <MonthView
            currentDate={currentDate}
            events={events}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
          />
        )}
        {viewType === 'week' && (
          <div className="text-center py-8 text-muted-foreground">
            주간 뷰는 준비 중입니다.
          </div>
        )}
        {viewType === 'day' && (
          <div className="text-center py-8 text-muted-foreground">
            일간 뷰는 준비 중입니다.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
