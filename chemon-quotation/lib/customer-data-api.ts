/**
 * 고객 관련 데이터 API 함수
 * - Requester, MeetingRecord, TestReception, InvoiceSchedule, CalendarEvent, ProgressStage
 */

import { apiFetch, ApiResponse } from './api-utils';
import {
  Requester,
  MeetingRecord,
  TestReception,
  InvoiceSchedule,
  CalendarEvent,
  ProgressStage,
} from '@/types/customer';

// Re-export ApiResponse
export type { ApiResponse } from './api-utils';

// ==================== Requester API ====================

export const requesterApi = {
  // 고객사별 의뢰자 목록
  async getByCustomerId(customerId: string, activeOnly = false): Promise<Requester[]> {
    const params = activeOnly ? '?activeOnly=true' : '';
    const response = await apiFetch<{ requesters: any[] }>(`/api/customer-data/customers/${customerId}/requesters${params}`);
    return (response.data?.requesters || []).map(mapRequesterFromApi);
  },

  // 의뢰자 상세
  async getById(id: string): Promise<Requester | null> {
    try {
      const response = await apiFetch<{ requester: any }>(`/api/customer-data/requesters/${id}`);
      return response.data?.requester ? mapRequesterFromApi(response.data.requester) : null;
    } catch {
      return null;
    }
  },

  // 의뢰자 생성
  async create(customerId: string, data: Omit<Requester, 'id' | 'customer_id' | 'created_at' | 'updated_at'>): Promise<Requester> {
    const response = await apiFetch<{ requester: any }>(`/api/customer-data/customers/${customerId}/requesters`, {
      method: 'POST',
      body: JSON.stringify(mapRequesterToApi(data)),
    });
    return mapRequesterFromApi(response.data!.requester);
  },

  // 의뢰자 수정
  async update(id: string, data: Partial<Requester>): Promise<Requester> {
    const response = await apiFetch<{ requester: any }>(`/api/customer-data/requesters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mapRequesterToApi(data)),
    });
    return mapRequesterFromApi(response.data!.requester);
  },

  // 의뢰자 삭제
  async delete(id: string): Promise<{ deleted: boolean; deactivated: boolean }> {
    const response = await apiFetch<{ deleted: boolean; deactivated: boolean }>(`/api/customer-data/requesters/${id}`, {
      method: 'DELETE',
    });
    return response.data || { deleted: false, deactivated: false };
  },
};

// ==================== MeetingRecord API ====================

export const meetingRecordApi = {
  // 고객사별 미팅 기록 목록
  async getByCustomerId(customerId: string, options?: { requestsOnly?: boolean; pendingOnly?: boolean }): Promise<MeetingRecord[]> {
    const params = new URLSearchParams();
    if (options?.requestsOnly) params.append('requestsOnly', 'true');
    if (options?.pendingOnly) params.append('pendingOnly', 'true');
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    const response = await apiFetch<{ meetingRecords: any[] }>(`/api/customer-data/customers/${customerId}/meeting-records${queryString}`);
    return (response.data?.meetingRecords || []).map(mapMeetingRecordFromApi);
  },

  // 미팅 기록 상세
  async getById(id: string): Promise<MeetingRecord | null> {
    try {
      const response = await apiFetch<{ meetingRecord: any }>(`/api/customer-data/meeting-records/${id}`);
      return response.data?.meetingRecord ? mapMeetingRecordFromApi(response.data.meetingRecord) : null;
    } catch {
      return null;
    }
  },

  // 미팅 기록 생성
  async create(customerId: string, data: Omit<MeetingRecord, 'id' | 'customer_id' | 'created_at' | 'updated_at'>): Promise<MeetingRecord> {
    const response = await apiFetch<{ meetingRecord: any }>(`/api/customer-data/customers/${customerId}/meeting-records`, {
      method: 'POST',
      body: JSON.stringify(mapMeetingRecordToApi(data)),
    });
    return mapMeetingRecordFromApi(response.data!.meetingRecord);
  },

  // 미팅 기록 수정
  async update(id: string, data: Partial<MeetingRecord>): Promise<MeetingRecord> {
    const response = await apiFetch<{ meetingRecord: any }>(`/api/customer-data/meeting-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mapMeetingRecordToApi(data)),
    });
    return mapMeetingRecordFromApi(response.data!.meetingRecord);
  },

  // 요청사항 상태 업데이트
  async updateRequestStatus(id: string, status: string, responseText?: string): Promise<MeetingRecord> {
    const response = await apiFetch<{ meetingRecord: any }>(`/api/customer-data/meeting-records/${id}/request-status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, response: responseText }),
    });
    return mapMeetingRecordFromApi(response.data!.meetingRecord);
  },

  // 미팅 기록 삭제
  async delete(id: string): Promise<void> {
    await apiFetch(`/api/customer-data/meeting-records/${id}`, { method: 'DELETE' });
  },
};

// ==================== TestReception API ====================

export const testReceptionApi = {
  // 고객사별 시험 접수 목록
  async getByCustomerId(customerId: string): Promise<TestReception[]> {
    const response = await apiFetch<{ testReceptions: any[] }>(`/api/customer-data/customers/${customerId}/test-receptions`);
    return (response.data?.testReceptions || []).map(mapTestReceptionFromApi);
  },

  // 상태별 시험 접수 목록
  async getByStatus(status?: string): Promise<TestReception[]> {
    const params = status ? `?status=${status}` : '';
    const response = await apiFetch<{ testReceptions: any[] }>(`/api/customer-data/test-receptions${params}`);
    return (response.data?.testReceptions || []).map(mapTestReceptionFromApi);
  },

  // 시험 접수 상세
  async getById(id: string): Promise<TestReception | null> {
    try {
      const response = await apiFetch<{ testReception: any }>(`/api/customer-data/test-receptions/${id}`);
      return response.data?.testReception ? mapTestReceptionFromApi(response.data.testReception) : null;
    } catch {
      return null;
    }
  },

  // 시험번호로 조회
  async getByTestNumber(testNumber: string): Promise<TestReception | null> {
    try {
      const response = await apiFetch<{ testReception: any }>(`/api/customer-data/test-receptions/by-number/${testNumber}`);
      return response.data?.testReception ? mapTestReceptionFromApi(response.data.testReception) : null;
    } catch {
      return null;
    }
  },

  // 시험 접수 생성
  async create(customerId: string, data: Omit<TestReception, 'id' | 'customer_id' | 'created_at' | 'updated_at'>): Promise<TestReception> {
    const response = await apiFetch<{ testReception: any }>(`/api/customer-data/customers/${customerId}/test-receptions`, {
      method: 'POST',
      body: JSON.stringify(mapTestReceptionToApi(data)),
    });
    return mapTestReceptionFromApi(response.data!.testReception);
  },

  // 시험 접수 수정
  async update(id: string, data: Partial<TestReception>): Promise<TestReception> {
    const response = await apiFetch<{ testReception: any }>(`/api/customer-data/test-receptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mapTestReceptionToApi(data)),
    });
    return mapTestReceptionFromApi(response.data!.testReception);
  },

  // 시험 접수 상태 업데이트
  async updateStatus(id: string, status: string): Promise<TestReception> {
    const response = await apiFetch<{ testReception: any }>(`/api/customer-data/test-receptions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return mapTestReceptionFromApi(response.data!.testReception);
  },

  // 시험 접수 삭제
  async delete(id: string): Promise<void> {
    await apiFetch(`/api/customer-data/test-receptions/${id}`, { method: 'DELETE' });
  },
};


// ==================== InvoiceSchedule API ====================

export const invoiceScheduleApi = {
  // 고객사별 세금계산서 일정 목록
  async getByCustomerId(customerId: string): Promise<InvoiceSchedule[]> {
    const response = await apiFetch<{ invoiceSchedules: any[] }>(`/api/customer-data/customers/${customerId}/invoice-schedules`);
    return (response.data?.invoiceSchedules || []).map(mapInvoiceScheduleFromApi);
  },

  // 시험 접수별 세금계산서 일정
  async getByTestReceptionId(testReceptionId: string): Promise<InvoiceSchedule[]> {
    const response = await apiFetch<{ invoiceSchedules: any[] }>(`/api/customer-data/test-receptions/${testReceptionId}/invoice-schedules`);
    return (response.data?.invoiceSchedules || []).map(mapInvoiceScheduleFromApi);
  },

  // 임박한 세금계산서 일정
  async getUpcoming(days = 7): Promise<InvoiceSchedule[]> {
    const response = await apiFetch<{ invoiceSchedules: any[] }>(`/api/customer-data/invoice-schedules/upcoming?days=${days}`);
    return (response.data?.invoiceSchedules || []).map(mapInvoiceScheduleFromApi);
  },

  // 연체된 세금계산서 일정
  async getOverdue(): Promise<InvoiceSchedule[]> {
    const response = await apiFetch<{ invoiceSchedules: any[] }>(`/api/customer-data/invoice-schedules/overdue`);
    return (response.data?.invoiceSchedules || []).map(mapInvoiceScheduleFromApi);
  },

  // 세금계산서 일정 상세
  async getById(id: string): Promise<InvoiceSchedule | null> {
    try {
      const response = await apiFetch<{ invoiceSchedule: any }>(`/api/customer-data/invoice-schedules/${id}`);
      return response.data?.invoiceSchedule ? mapInvoiceScheduleFromApi(response.data.invoiceSchedule) : null;
    } catch {
      return null;
    }
  },

  // 세금계산서 일정 생성
  async create(customerId: string, data: Omit<InvoiceSchedule, 'id' | 'customer_id' | 'created_at' | 'updated_at'>): Promise<InvoiceSchedule> {
    const response = await apiFetch<{ invoiceSchedule: any }>(`/api/customer-data/customers/${customerId}/invoice-schedules`, {
      method: 'POST',
      body: JSON.stringify(mapInvoiceScheduleToApi(data)),
    });
    return mapInvoiceScheduleFromApi(response.data!.invoiceSchedule);
  },

  // 분할 지급 일정 생성
  async createInstallments(
    customerId: string,
    testReceptionId: string,
    totalAmount: number,
    installments: number,
    startDate: string,
    intervalDays = 30
  ): Promise<InvoiceSchedule[]> {
    const response = await apiFetch<{ invoiceSchedules: any[] }>(`/api/customer-data/customers/${customerId}/invoice-schedules/installments`, {
      method: 'POST',
      body: JSON.stringify({ testReceptionId, totalAmount, installments, startDate, intervalDays }),
    });
    return (response.data?.invoiceSchedules || []).map(mapInvoiceScheduleFromApi);
  },

  // 세금계산서 일정 수정
  async update(id: string, data: Partial<InvoiceSchedule>): Promise<InvoiceSchedule> {
    const response = await apiFetch<{ invoiceSchedule: any }>(`/api/customer-data/invoice-schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mapInvoiceScheduleToApi(data)),
    });
    return mapInvoiceScheduleFromApi(response.data!.invoiceSchedule);
  },

  // 세금계산서 발행 완료 처리
  async markAsIssued(id: string, invoiceNumber: string): Promise<InvoiceSchedule> {
    const response = await apiFetch<{ invoiceSchedule: any }>(`/api/customer-data/invoice-schedules/${id}/issue`, {
      method: 'PATCH',
      body: JSON.stringify({ invoiceNumber }),
    });
    return mapInvoiceScheduleFromApi(response.data!.invoiceSchedule);
  },

  // 세금계산서 일정 삭제
  async delete(id: string): Promise<void> {
    await apiFetch(`/api/customer-data/invoice-schedules/${id}`, { method: 'DELETE' });
  },
};

// ==================== CalendarEvent API ====================

export const calendarEventApi = {
  // 전체 캘린더 이벤트
  async getAll(): Promise<CalendarEvent[]> {
    const response = await apiFetch<{ calendarEvents: any[] }>(`/api/customer-data/calendar-events`);
    return (response.data?.calendarEvents || []).map(mapCalendarEventFromApi);
  },

  // 날짜 범위로 조회
  async getByDateRange(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    const response = await apiFetch<{ calendarEvents: any[] }>(`/api/customer-data/calendar-events?startDate=${startDate}&endDate=${endDate}`);
    return (response.data?.calendarEvents || []).map(mapCalendarEventFromApi);
  },

  // 유형별 조회
  async getByType(type: string): Promise<CalendarEvent[]> {
    const response = await apiFetch<{ calendarEvents: any[] }>(`/api/customer-data/calendar-events?type=${type}`);
    return (response.data?.calendarEvents || []).map(mapCalendarEventFromApi);
  },

  // 고객사별 캘린더 이벤트
  async getByCustomerId(customerId: string): Promise<CalendarEvent[]> {
    const response = await apiFetch<{ calendarEvents: any[] }>(`/api/customer-data/customers/${customerId}/calendar-events`);
    return (response.data?.calendarEvents || []).map(mapCalendarEventFromApi);
  },

  // 캘린더 이벤트 상세
  async getById(id: string): Promise<CalendarEvent | null> {
    try {
      const response = await apiFetch<{ calendarEvent: any }>(`/api/customer-data/calendar-events/${id}`);
      return response.data?.calendarEvent ? mapCalendarEventFromApi(response.data.calendarEvent) : null;
    } catch {
      return null;
    }
  },

  // 캘린더 이벤트 생성
  async create(data: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>): Promise<CalendarEvent> {
    const response = await apiFetch<{ calendarEvent: any }>(`/api/customer-data/calendar-events`, {
      method: 'POST',
      body: JSON.stringify(mapCalendarEventToApi(data)),
    });
    return mapCalendarEventFromApi(response.data!.calendarEvent);
  },

  // 캘린더 이벤트 수정
  async update(id: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const response = await apiFetch<{ calendarEvent: any }>(`/api/customer-data/calendar-events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mapCalendarEventToApi(data)),
    });
    return mapCalendarEventFromApi(response.data!.calendarEvent);
  },

  // 캘린더 이벤트 삭제
  async delete(id: string): Promise<void> {
    await apiFetch(`/api/customer-data/calendar-events/${id}`, { method: 'DELETE' });
  },

  // 오늘 이벤트 조회
  async getTodayEvents(): Promise<CalendarEvent[]> {
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = startDate;
    return this.getByDateRange(startDate, endDate);
  },

  // 이번 주 이벤트 조회
  async getThisWeekEvents(): Promise<CalendarEvent[]> {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - dayOfWeek));
    
    const startDate = startOfWeek.toISOString().split('T')[0];
    const endDate = endOfWeek.toISOString().split('T')[0];
    return this.getByDateRange(startDate, endDate);
  },
};

// ==================== ProgressStage API ====================

export const progressStageApi = {
  // 고객사 진행 단계 조회 (없으면 자동 생성)
  async getByCustomerId(customerId: string): Promise<ProgressStage> {
    const response = await apiFetch<{ progressStage: any }>(`/api/customer-data/customers/${customerId}/progress-stage`);
    return mapProgressStageFromApi(response.data!.progressStage);
  },

  // 진행 단계 상세
  async getById(id: string): Promise<ProgressStage | null> {
    try {
      const response = await apiFetch<{ progressStage: any }>(`/api/customer-data/progress-stages/${id}`);
      return response.data?.progressStage ? mapProgressStageFromApi(response.data.progressStage) : null;
    } catch {
      return null;
    }
  },

  // 진행 단계 생성
  async create(customerId: string, quotationId?: string, contractId?: string): Promise<ProgressStage> {
    const response = await apiFetch<{ progressStage: any }>(`/api/customer-data/customers/${customerId}/progress-stage`, {
      method: 'POST',
      body: JSON.stringify({ quotationId, contractId }),
    });
    return mapProgressStageFromApi(response.data!.progressStage);
  },

  // 단계 전환
  async updateStage(id: string, newStage: string, notes?: string): Promise<ProgressStage> {
    const response = await apiFetch<{ progressStage: any }>(`/api/customer-data/progress-stages/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ newStage, notes }),
    });
    return mapProgressStageFromApi(response.data!.progressStage);
  },

  // 체크리스트 항목 업데이트
  async updateChecklist(id: string, checklistItemId: string, isCompleted: boolean, completedBy?: string): Promise<ProgressStage> {
    const response = await apiFetch<{ progressStage: any }>(`/api/customer-data/progress-stages/${id}/checklist`, {
      method: 'PATCH',
      body: JSON.stringify({ checklistItemId, isCompleted, completedBy }),
    });
    return mapProgressStageFromApi(response.data!.progressStage);
  },

  // 진행 단계 삭제
  async delete(id: string): Promise<void> {
    await apiFetch(`/api/customer-data/progress-stages/${id}`, { method: 'DELETE' });
  },
};

// ==================== Mapping Functions ====================

function mapRequesterFromApi(data: any): Requester {
  return {
    id: data.id,
    customer_id: data.customerId,
    name: data.name,
    position: data.position || '',
    department: data.department || '',
    phone: data.phone || '',
    email: data.email || '',
    is_primary: data.isPrimary,
    is_active: data.isActive,
    created_at: data.createdAt,
    updated_at: data.updatedAt,
  };
}

function mapRequesterToApi(data: Partial<Requester>): any {
  const result: any = {};
  if (data.name !== undefined) result.name = data.name;
  if (data.position !== undefined) result.position = data.position;
  if (data.department !== undefined) result.department = data.department;
  if (data.phone !== undefined) result.phone = data.phone;
  if (data.email !== undefined) result.email = data.email;
  if (data.is_primary !== undefined) result.isPrimary = data.is_primary;
  if (data.is_active !== undefined) result.isActive = data.is_active;
  return result;
}

function mapMeetingRecordFromApi(data: any): MeetingRecord {
  return {
    id: data.id,
    customer_id: data.customerId,
    requester_id: data.requesterId,
    type: data.type,
    date: data.date,
    time: data.time,
    duration: data.duration,
    title: data.title,
    attendees: data.attendees || [],
    content: data.content,
    follow_up_actions: data.followUpActions,
    attachments: data.attachments,
    is_request: data.isRequest,
    request_status: data.requestStatus,
    request_completed_at: data.requestCompletedAt,
    request_response: data.requestResponse,
    created_at: data.createdAt,
    updated_at: data.updatedAt,
  };
}

function mapMeetingRecordToApi(data: Partial<MeetingRecord>): any {
  const result: any = {};
  if (data.requester_id !== undefined) result.requesterId = data.requester_id;
  if (data.type !== undefined) result.type = data.type;
  if (data.date !== undefined) result.date = data.date;
  if (data.time !== undefined) result.time = data.time;
  if (data.duration !== undefined) result.duration = data.duration;
  if (data.title !== undefined) result.title = data.title;
  if (data.attendees !== undefined) result.attendees = data.attendees;
  if (data.content !== undefined) result.content = data.content;
  if (data.follow_up_actions !== undefined) result.followUpActions = data.follow_up_actions;
  if (data.attachments !== undefined) result.attachments = data.attachments;
  if (data.is_request !== undefined) result.isRequest = data.is_request;
  if (data.request_status !== undefined) result.requestStatus = data.request_status;
  if (data.request_response !== undefined) result.requestResponse = data.request_response;
  return result;
}

function mapTestReceptionFromApi(data: any): TestReception {
  return {
    id: data.id,
    customer_id: data.customerId,
    requester_id: data.requesterId,
    contract_id: data.contractId,
    quotation_id: data.quotationId,
    substance_code: data.substanceCode || '',
    project_code: data.projectCode || '',
    substance_name: data.substanceName || '',
    institution_name: data.institutionName || '',
    test_number: data.testNumber || '',
    test_title: data.testTitle || '',
    test_director: data.testDirector || '',
    total_amount: Number(data.totalAmount) || 0,
    paid_amount: Number(data.paidAmount) || 0,
    remaining_amount: Number(data.remainingAmount) || 0,
    status: data.status,
    reception_date: data.receptionDate,
    expected_completion_date: data.expectedCompletionDate,
    actual_completion_date: data.actualCompletionDate,
    created_at: data.createdAt,
    updated_at: data.updatedAt,
  };
}

function mapTestReceptionToApi(data: Partial<TestReception>): any {
  const result: any = {};
  if (data.requester_id !== undefined) result.requesterId = data.requester_id;
  if (data.contract_id !== undefined) result.contractId = data.contract_id;
  if (data.quotation_id !== undefined) result.quotationId = data.quotation_id;
  if (data.substance_code !== undefined) result.substanceCode = data.substance_code;
  if (data.project_code !== undefined) result.projectCode = data.project_code;
  if (data.substance_name !== undefined) result.substanceName = data.substance_name;
  if (data.institution_name !== undefined) result.institutionName = data.institution_name;
  if (data.test_number !== undefined) result.testNumber = data.test_number;
  if (data.test_title !== undefined) result.testTitle = data.test_title;
  if (data.test_director !== undefined) result.testDirector = data.test_director;
  if (data.total_amount !== undefined) result.totalAmount = data.total_amount;
  if (data.paid_amount !== undefined) result.paidAmount = data.paid_amount;
  if (data.remaining_amount !== undefined) result.remainingAmount = data.remaining_amount;
  if (data.status !== undefined) result.status = data.status;
  if (data.reception_date !== undefined) result.receptionDate = data.reception_date;
  if (data.expected_completion_date !== undefined) result.expectedCompletionDate = data.expected_completion_date;
  if (data.actual_completion_date !== undefined) result.actualCompletionDate = data.actual_completion_date;
  return result;
}

function mapInvoiceScheduleFromApi(data: any): InvoiceSchedule {
  return {
    id: data.id,
    test_reception_id: data.testReceptionId,
    customer_id: data.customerId,
    amount: Number(data.amount),
    scheduled_date: data.scheduledDate,
    issued_date: data.issuedDate,
    invoice_number: data.invoiceNumber,
    payment_type: data.paymentType,
    installment_number: data.installmentNumber,
    total_installments: data.totalInstallments,
    status: data.status,
    notes: data.notes,
    created_at: data.createdAt,
    updated_at: data.updatedAt,
  };
}

function mapInvoiceScheduleToApi(data: Partial<InvoiceSchedule>): any {
  const result: any = {};
  if (data.test_reception_id !== undefined) result.testReceptionId = data.test_reception_id;
  if (data.amount !== undefined) result.amount = data.amount;
  if (data.scheduled_date !== undefined) result.scheduledDate = data.scheduled_date;
  if (data.issued_date !== undefined) result.issuedDate = data.issued_date;
  if (data.invoice_number !== undefined) result.invoiceNumber = data.invoice_number;
  if (data.payment_type !== undefined) result.paymentType = data.payment_type;
  if (data.installment_number !== undefined) result.installmentNumber = data.installment_number;
  if (data.total_installments !== undefined) result.totalInstallments = data.total_installments;
  if (data.status !== undefined) result.status = data.status;
  if (data.notes !== undefined) result.notes = data.notes;
  return result;
}

function mapCalendarEventFromApi(data: any): CalendarEvent {
  return {
    id: data.id,
    customer_id: data.customerId,
    test_reception_id: data.testReceptionId,
    invoice_schedule_id: data.invoiceScheduleId,
    meeting_record_id: data.meetingRecordId,
    type: data.type,
    title: data.title,
    description: data.description,
    start_date: data.startDate,
    end_date: data.endDate,
    all_day: data.allDay,
    color: data.color,
    reminder_before: data.reminderBefore,
    created_at: data.createdAt,
    updated_at: data.updatedAt,
  };
}

function mapCalendarEventToApi(data: Partial<CalendarEvent>): any {
  const result: any = {};
  if (data.customer_id !== undefined) result.customerId = data.customer_id;
  if (data.test_reception_id !== undefined) result.testReceptionId = data.test_reception_id;
  if (data.invoice_schedule_id !== undefined) result.invoiceScheduleId = data.invoice_schedule_id;
  if (data.meeting_record_id !== undefined) result.meetingRecordId = data.meeting_record_id;
  if (data.type !== undefined) result.type = data.type;
  if (data.title !== undefined) result.title = data.title;
  if (data.description !== undefined) result.description = data.description;
  if (data.start_date !== undefined) result.startDate = data.start_date;
  if (data.end_date !== undefined) result.endDate = data.end_date;
  if (data.all_day !== undefined) result.allDay = data.all_day;
  if (data.color !== undefined) result.color = data.color;
  if (data.reminder_before !== undefined) result.reminderBefore = data.reminder_before;
  return result;
}

function mapProgressStageFromApi(data: any): ProgressStage {
  return {
    id: data.id,
    customer_id: data.customerId,
    quotation_id: data.quotationId,
    contract_id: data.contractId,
    current_stage: data.currentStage,
    checklist: data.checklist || [],
    stage_history: data.stageHistory || [],
    created_at: data.createdAt,
    updated_at: data.updatedAt,
  };
}
