/**
 * 캘린더 이벤트 로컬 스토리지 관리
 * - 백엔드 연동 전까지 localStorage로 캘린더 이벤트 데이터 관리
 * - Requirements: 6.2, 6.3, 8.4
 */

import { CalendarEvent, MeetingRecord, InvoiceSchedule } from '@/types/customer';

const CALENDAR_EVENTS_STORAGE_KEY = 'chemon_calendar_events';

// 모든 캘린더 이벤트 조회
export function getAllCalendarEvents(): CalendarEvent[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(CALENDAR_EVENTS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// 단일 캘린더 이벤트 조회
export function getCalendarEventById(id: string): CalendarEvent | null {
  const events = getAllCalendarEvents();
  return events.find(e => e.id === id) || null;
}

// 고객사별 캘린더 이벤트 조회
export function getCalendarEventsByCustomerId(customerId: string): CalendarEvent[] {
  const events = getAllCalendarEvents();
  return events
    .filter(e => e.customer_id === customerId)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
}

// 날짜 범위로 캘린더 이벤트 조회
// Requirements: 8.4 - 날짜 범위 검색이 가능하도록 저장
export function getCalendarEventsByDateRange(startDate: string, endDate: string): CalendarEvent[] {
  const events = getAllCalendarEvents();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  
  return events.filter(e => {
    const eventStart = new Date(e.start_date).getTime();
    const eventEnd = e.end_date ? new Date(e.end_date).getTime() : eventStart;
    
    // Event overlaps with the range if:
    // event starts before range ends AND event ends after range starts
    return eventStart <= end && eventEnd >= start;
  }).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
}

// 캘린더 이벤트 저장
export function saveCalendarEvent(event: CalendarEvent): CalendarEvent {
  const events = getAllCalendarEvents();
  const existingIndex = events.findIndex(e => e.id === event.id);
  
  const now = new Date().toISOString();
  
  if (existingIndex >= 0) {
    events[existingIndex] = { ...event, updated_at: now };
  } else {
    const newEvent = {
      ...event,
      created_at: event.created_at || now,
      updated_at: now,
    };
    events.push(newEvent);
  }
  
  localStorage.setItem(CALENDAR_EVENTS_STORAGE_KEY, JSON.stringify(events));
  return existingIndex >= 0 ? events[existingIndex] : events[events.length - 1];
}

// 캘린더 이벤트 수정
export function updateCalendarEvent(id: string, updates: Partial<CalendarEvent>): CalendarEvent | null {
  const events = getAllCalendarEvents();
  const index = events.findIndex(e => e.id === id);
  
  if (index < 0) return null;
  
  events[index] = {
    ...events[index],
    ...updates,
    id, // ID는 변경 불가
    updated_at: new Date().toISOString(),
  };
  
  localStorage.setItem(CALENDAR_EVENTS_STORAGE_KEY, JSON.stringify(events));
  return events[index];
}

// 캘린더 이벤트 삭제
export function deleteCalendarEvent(id: string): boolean {
  const events = getAllCalendarEvents();
  const filtered = events.filter(e => e.id !== id);
  
  if (filtered.length === events.length) return false;
  
  localStorage.setItem(CALENDAR_EVENTS_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}


// 유형별 캘린더 이벤트 조회
export function getCalendarEventsByType(type: CalendarEvent['type']): CalendarEvent[] {
  const events = getAllCalendarEvents();
  return events
    .filter(e => e.type === type)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
}

// 미팅 기록에서 캘린더 이벤트 자동 생성
// Requirements: 6.2 - 미팅 일정이 등록되면 캘린더에 자동으로 표시
export function createCalendarEventFromMeeting(meeting: MeetingRecord): CalendarEvent {
  const event: CalendarEvent = {
    id: `meeting-${meeting.id}`,
    customer_id: meeting.customer_id,
    meeting_record_id: meeting.id,
    type: 'meeting',
    title: meeting.title,
    description: meeting.content,
    start_date: meeting.date,
    end_date: meeting.duration 
      ? new Date(new Date(meeting.date).getTime() + meeting.duration * 60 * 1000).toISOString()
      : undefined,
    all_day: !meeting.time,
    color: '#3B82F6', // blue for meetings
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  return saveCalendarEvent(event);
}

// 세금계산서 발행 예정일에서 캘린더 이벤트 자동 생성
// Requirements: 6.3 - 세금계산서 발행 예정일이 설정되면 캘린더에 자동으로 표시
export function createCalendarEventFromInvoice(invoice: InvoiceSchedule): CalendarEvent {
  const event: CalendarEvent = {
    id: `invoice-${invoice.id}`,
    customer_id: invoice.customer_id,
    invoice_schedule_id: invoice.id,
    test_reception_id: invoice.test_reception_id,
    type: 'invoice',
    title: `세금계산서 발행 예정 - ${invoice.amount.toLocaleString()}원`,
    description: invoice.notes,
    start_date: invoice.scheduled_date,
    all_day: true,
    color: '#EF4444', // red for invoices
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  return saveCalendarEvent(event);
}

// 미팅 기록 ID로 연결된 캘린더 이벤트 조회
export function getCalendarEventByMeetingId(meetingId: string): CalendarEvent | null {
  const events = getAllCalendarEvents();
  return events.find(e => e.meeting_record_id === meetingId) || null;
}

// 세금계산서 일정 ID로 연결된 캘린더 이벤트 조회
export function getCalendarEventByInvoiceId(invoiceId: string): CalendarEvent | null {
  const events = getAllCalendarEvents();
  return events.find(e => e.invoice_schedule_id === invoiceId) || null;
}

// 미팅 기록 삭제 시 연결된 캘린더 이벤트도 삭제
export function deleteCalendarEventByMeetingId(meetingId: string): boolean {
  const event = getCalendarEventByMeetingId(meetingId);
  if (!event) return false;
  return deleteCalendarEvent(event.id);
}

// 세금계산서 일정 삭제 시 연결된 캘린더 이벤트도 삭제
export function deleteCalendarEventByInvoiceId(invoiceId: string): boolean {
  const event = getCalendarEventByInvoiceId(invoiceId);
  if (!event) return false;
  return deleteCalendarEvent(event.id);
}

// 오늘의 이벤트 조회
export function getTodayEvents(): CalendarEvent[] {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();
  
  return getCalendarEventsByDateRange(startOfDay, endOfDay);
}

// 이번 주 이벤트 조회
export function getThisWeekEvents(): CalendarEvent[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return getCalendarEventsByDateRange(startOfWeek.toISOString(), endOfWeek.toISOString());
}

// 이번 달 이벤트 조회
export function getThisMonthEvents(): CalendarEvent[] {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
  
  return getCalendarEventsByDateRange(startOfMonth, endOfMonth);
}
