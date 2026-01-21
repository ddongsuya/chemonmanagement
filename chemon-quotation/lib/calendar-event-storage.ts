/**
 * 캘린더 이벤트 관리
 * - 백엔드 API 연동 완료
 * - Requirements: 6.1, 6.2, 6.3
 */

import { CalendarEvent, MeetingRecord, InvoiceSchedule } from '@/types/customer';
import { calendarEventApi } from './customer-data-api';

// ============================================
// API 기반 함수들
// ============================================

/**
 * 전체 캘린더 이벤트 조회 (API)
 */
export async function getAllCalendarEventsAsync(): Promise<CalendarEvent[]> {
  try {
    return await calendarEventApi.getAll();
  } catch {
    return [];
  }
}

/**
 * 날짜 범위로 캘린더 이벤트 조회 (API)
 */
export async function getCalendarEventsByDateRangeAsync(
  startDate: string,
  endDate: string
): Promise<CalendarEvent[]> {
  try {
    return await calendarEventApi.getByDateRange(startDate, endDate);
  } catch {
    return [];
  }
}

/**
 * 유형별 캘린더 이벤트 조회 (API)
 */
export async function getCalendarEventsByTypeAsync(type: string): Promise<CalendarEvent[]> {
  try {
    return await calendarEventApi.getByType(type);
  } catch {
    return [];
  }
}

/**
 * 고객사별 캘린더 이벤트 조회 (API)
 */
export async function getCalendarEventsByCustomerIdAsync(customerId: string): Promise<CalendarEvent[]> {
  try {
    return await calendarEventApi.getByCustomerId(customerId);
  } catch {
    return [];
  }
}

/**
 * 캘린더 이벤트 상세 조회 (API)
 */
export async function getCalendarEventByIdAsync(id: string): Promise<CalendarEvent | null> {
  try {
    return await calendarEventApi.getById(id);
  } catch {
    return null;
  }
}

/**
 * 캘린더 이벤트 저장 (API)
 */
export async function saveCalendarEventAsync(
  event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>
): Promise<CalendarEvent> {
  return await calendarEventApi.create(event);
}

/**
 * 캘린더 이벤트 수정 (API)
 */
export async function updateCalendarEventAsync(id: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> {
  return await calendarEventApi.update(id, data);
}

/**
 * 캘린더 이벤트 삭제 (API)
 */
export async function deleteCalendarEventAsync(id: string): Promise<boolean> {
  try {
    await calendarEventApi.delete(id);
    return true;
  } catch {
    return false;
  }
}

/**
 * 오늘 이벤트 조회 (API)
 */
export async function getTodayEventsAsync(): Promise<CalendarEvent[]> {
  try {
    return await calendarEventApi.getTodayEvents();
  } catch {
    return [];
  }
}

/**
 * 이번 주 이벤트 조회 (API)
 */
export async function getThisWeekEventsAsync(): Promise<CalendarEvent[]> {
  try {
    return await calendarEventApi.getThisWeekEvents();
  } catch {
    return [];
  }
}

// ============================================
// 자동 이벤트 생성 함수들
// ============================================

/**
 * 미팅 기록에서 캘린더 이벤트 자동 생성
 */
export function createEventFromMeetingRecord(meeting: MeetingRecord): Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'> {
  const endDate = meeting.duration
    ? new Date(new Date(meeting.date).getTime() + meeting.duration * 60 * 1000).toISOString()
    : undefined;

  return {
    customer_id: meeting.customer_id,
    meeting_record_id: meeting.id,
    type: 'meeting',
    title: meeting.title,
    description: meeting.content,
    start_date: meeting.date,
    end_date: endDate,
    all_day: !meeting.time,
    color: '#3B82F6',
  };
}

/**
 * 세금계산서 일정에서 캘린더 이벤트 자동 생성
 */
export function createEventFromInvoiceSchedule(schedule: InvoiceSchedule): Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'> {
  return {
    customer_id: schedule.customer_id,
    invoice_schedule_id: schedule.id,
    test_reception_id: schedule.test_reception_id,
    type: 'invoice',
    title: `세금계산서 발행 예정 - ${Number(schedule.amount).toLocaleString()}원`,
    description: schedule.notes,
    start_date: schedule.scheduled_date,
    all_day: true,
    color: '#EF4444',
  };
}

// ============================================
// Legacy 동기 함수들 (테스트 호환성)
// ============================================

export function getCalendarEvents(): CalendarEvent[] {
  console.warn('getCalendarEvents is deprecated. Use getAllCalendarEventsAsync instead.');
  return [];
}

export function getCalendarEventById(id: string): CalendarEvent | null {
  console.warn('getCalendarEventById is deprecated. Use getCalendarEventByIdAsync instead.');
  return null;
}

export function getCalendarEventsByCustomerId(customerId: string): CalendarEvent[] {
  console.warn('getCalendarEventsByCustomerId is deprecated. Use getCalendarEventsByCustomerIdAsync instead.');
  return [];
}

export function getCalendarEventsByDateRange(startDate: string, endDate: string): CalendarEvent[] {
  console.warn('getCalendarEventsByDateRange is deprecated. Use getCalendarEventsByDateRangeAsync instead.');
  return [];
}

export function saveCalendarEvent(event: CalendarEvent): CalendarEvent {
  console.warn('saveCalendarEvent is deprecated. Use saveCalendarEventAsync instead.');
  return event;
}

export function updateCalendarEvent(id: string, data: Partial<CalendarEvent>): CalendarEvent | null {
  console.warn('updateCalendarEvent is deprecated. Use updateCalendarEventAsync instead.');
  return null;
}

export function deleteCalendarEvent(id: string): boolean {
  console.warn('deleteCalendarEvent is deprecated. Use deleteCalendarEventAsync instead.');
  return false;
}
