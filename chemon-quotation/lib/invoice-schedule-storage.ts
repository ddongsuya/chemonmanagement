/**
 * 세금계산서 발행 일정 로컬 스토리지 관리
 * - 백엔드 연동 전까지 localStorage로 세금계산서 일정 데이터 관리
 * - Requirements: 3.1, 3.2, 3.5, 3.6
 */

import { InvoiceSchedule } from '@/types/customer';

const INVOICE_SCHEDULES_STORAGE_KEY = 'chemon_invoice_schedules';

// 기본 발행 기준: 최종보고서 제출 후 30일
const DEFAULT_INVOICE_DAYS = 30;

// 모든 세금계산서 일정 조회
export function getAllInvoiceSchedules(): InvoiceSchedule[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(INVOICE_SCHEDULES_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// 단일 세금계산서 일정 조회
export function getInvoiceScheduleById(id: string): InvoiceSchedule | null {
  const schedules = getAllInvoiceSchedules();
  return schedules.find(s => s.id === id) || null;
}

// 시험 접수별 세금계산서 일정 조회
export function getInvoiceSchedulesByTestReception(testReceptionId: string): InvoiceSchedule[] {
  const schedules = getAllInvoiceSchedules();
  return schedules.filter(s => s.test_reception_id === testReceptionId);
}

// 고객사별 세금계산서 일정 조회
export function getInvoiceSchedulesByCustomerId(customerId: string): InvoiceSchedule[] {
  const schedules = getAllInvoiceSchedules();
  return schedules.filter(s => s.customer_id === customerId);
}

// 세금계산서 일정 저장
export function saveInvoiceSchedule(schedule: InvoiceSchedule): InvoiceSchedule {
  const schedules = getAllInvoiceSchedules();
  const existingIndex = schedules.findIndex(s => s.id === schedule.id);
  
  const now = new Date().toISOString();
  
  if (existingIndex >= 0) {
    schedules[existingIndex] = { ...schedule, updated_at: now };
  } else {
    const newSchedule = {
      ...schedule,
      created_at: schedule.created_at || now,
      updated_at: now,
    };
    schedules.unshift(newSchedule);
  }
  
  localStorage.setItem(INVOICE_SCHEDULES_STORAGE_KEY, JSON.stringify(schedules));
  return existingIndex >= 0 ? schedules[existingIndex] : schedules[0];
}

// 세금계산서 일정 수정
export function updateInvoiceSchedule(id: string, updates: Partial<InvoiceSchedule>): InvoiceSchedule | null {
  const schedules = getAllInvoiceSchedules();
  const index = schedules.findIndex(s => s.id === id);
  
  if (index < 0) return null;
  
  schedules[index] = {
    ...schedules[index],
    ...updates,
    id, // ID는 변경 불가
    updated_at: new Date().toISOString(),
  };
  
  localStorage.setItem(INVOICE_SCHEDULES_STORAGE_KEY, JSON.stringify(schedules));
  return schedules[index];
}

// 세금계산서 일정 삭제
export function deleteInvoiceSchedule(id: string): boolean {
  const schedules = getAllInvoiceSchedules();
  const filtered = schedules.filter(s => s.id !== id);
  
  if (filtered.length === schedules.length) return false;
  
  localStorage.setItem(INVOICE_SCHEDULES_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

// 임박한 발행 일정 조회 (기본 7일 이내)
export function getUpcomingInvoices(daysAhead: number = 7): InvoiceSchedule[] {
  const schedules = getAllInvoiceSchedules();
  const now = new Date();
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  
  return schedules.filter(s => {
    if (s.status !== 'pending') return false;
    const scheduledDate = new Date(s.scheduled_date);
    return scheduledDate >= now && scheduledDate <= futureDate;
  });
}

// 기본 발행 예정일 계산 (접수일로부터 30일 후)
export function calculateDefaultScheduledDate(receptionDate: string): string {
  const date = new Date(receptionDate);
  date.setDate(date.getDate() + DEFAULT_INVOICE_DAYS);
  return date.toISOString();
}

// 발행 예정일이 특정 일수 이내인지 확인
export function isScheduledWithinDays(scheduledDate: string, days: number): boolean {
  const now = new Date();
  const scheduled = new Date(scheduledDate);
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return scheduled >= now && scheduled <= futureDate;
}

// 세금계산서 발행 완료 처리
export function markInvoiceAsIssued(
  id: string, 
  invoiceNumber: string
): InvoiceSchedule | null {
  return updateInvoiceSchedule(id, {
    status: 'issued',
    issued_date: new Date().toISOString(),
    invoice_number: invoiceNumber,
  });
}

// 분할 지급 일정 생성
export function createInstallmentSchedules(
  testReceptionId: string,
  customerId: string,
  totalAmount: number,
  installments: number,
  startDate: string,
  intervalDays: number = 30
): InvoiceSchedule[] {
  const amountPerInstallment = Math.floor(totalAmount / installments);
  const remainder = totalAmount - (amountPerInstallment * installments);
  
  const schedules: InvoiceSchedule[] = [];
  const now = new Date().toISOString();
  
  for (let i = 0; i < installments; i++) {
    const scheduledDate = new Date(startDate);
    scheduledDate.setDate(scheduledDate.getDate() + (i * intervalDays));
    
    // 마지막 회차에 나머지 금액 추가
    const amount = i === installments - 1 
      ? amountPerInstallment + remainder 
      : amountPerInstallment;
    
    const schedule: InvoiceSchedule = {
      id: `${testReceptionId}-${i + 1}`,
      test_reception_id: testReceptionId,
      customer_id: customerId,
      amount,
      scheduled_date: scheduledDate.toISOString(),
      payment_type: 'partial',
      installment_number: i + 1,
      total_installments: installments,
      status: 'pending',
      created_at: now,
      updated_at: now,
    };
    
    schedules.push(schedule);
    saveInvoiceSchedule(schedule);
  }
  
  return schedules;
}

// 상태별 세금계산서 일정 조회
export function getInvoiceSchedulesByStatus(status: InvoiceSchedule['status']): InvoiceSchedule[] {
  const schedules = getAllInvoiceSchedules();
  return schedules.filter(s => s.status === status);
}

// 연체된 세금계산서 일정 조회
export function getOverdueInvoices(): InvoiceSchedule[] {
  const schedules = getAllInvoiceSchedules();
  const now = new Date();
  
  return schedules.filter(s => {
    if (s.status !== 'pending') return false;
    const scheduledDate = new Date(s.scheduled_date);
    return scheduledDate < now;
  });
}
