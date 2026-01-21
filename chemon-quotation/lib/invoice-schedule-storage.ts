/**
 * 세금계산서 발행 일정 관리
 * - 백엔드 API 연동 완료
 * - Requirements: 3.1, 3.2, 3.5, 3.6
 */

import { InvoiceSchedule } from '@/types/customer';
import { invoiceScheduleApi } from './customer-data-api';

// ============================================
// API 기반 함수들
// ============================================

/**
 * 고객사별 세금계산서 일정 조회 (API)
 */
export async function getInvoiceSchedulesByCustomerIdAsync(customerId: string): Promise<InvoiceSchedule[]> {
  try {
    return await invoiceScheduleApi.getByCustomerId(customerId);
  } catch {
    return [];
  }
}

/**
 * 시험 접수별 세금계산서 일정 조회 (API)
 */
export async function getInvoiceSchedulesByTestReceptionIdAsync(testReceptionId: string): Promise<InvoiceSchedule[]> {
  try {
    return await invoiceScheduleApi.getByTestReceptionId(testReceptionId);
  } catch {
    return [];
  }
}

/**
 * 임박한 세금계산서 일정 조회 (API)
 */
export async function getUpcomingInvoiceSchedulesAsync(days = 7): Promise<InvoiceSchedule[]> {
  try {
    return await invoiceScheduleApi.getUpcoming(days);
  } catch {
    return [];
  }
}

/**
 * 연체된 세금계산서 일정 조회 (API)
 */
export async function getOverdueInvoiceSchedulesAsync(): Promise<InvoiceSchedule[]> {
  try {
    return await invoiceScheduleApi.getOverdue();
  } catch {
    return [];
  }
}

/**
 * 세금계산서 일정 상세 조회 (API)
 */
export async function getInvoiceScheduleByIdAsync(id: string): Promise<InvoiceSchedule | null> {
  try {
    return await invoiceScheduleApi.getById(id);
  } catch {
    return null;
  }
}

/**
 * 세금계산서 일정 저장 (API)
 */
export async function saveInvoiceScheduleAsync(
  customerId: string,
  schedule: Omit<InvoiceSchedule, 'id' | 'customer_id' | 'created_at' | 'updated_at'>
): Promise<InvoiceSchedule> {
  return await invoiceScheduleApi.create(customerId, schedule);
}

/**
 * 분할 지급 일정 생성 (API)
 */
export async function createInstallmentsAsync(
  customerId: string,
  testReceptionId: string,
  totalAmount: number,
  installments: number,
  startDate: string,
  intervalDays = 30
): Promise<InvoiceSchedule[]> {
  return await invoiceScheduleApi.createInstallments(
    customerId,
    testReceptionId,
    totalAmount,
    installments,
    startDate,
    intervalDays
  );
}

/**
 * 세금계산서 일정 수정 (API)
 */
export async function updateInvoiceScheduleAsync(id: string, data: Partial<InvoiceSchedule>): Promise<InvoiceSchedule> {
  return await invoiceScheduleApi.update(id, data);
}

/**
 * 세금계산서 발행 완료 처리 (API)
 */
export async function markAsIssuedAsync(id: string, invoiceNumber: string): Promise<InvoiceSchedule> {
  return await invoiceScheduleApi.markAsIssued(id, invoiceNumber);
}

/**
 * 세금계산서 일정 삭제 (API)
 */
export async function deleteInvoiceScheduleAsync(id: string): Promise<boolean> {
  try {
    await invoiceScheduleApi.delete(id);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// Legacy 동기 함수들 (테스트 호환성)
// ============================================

export function getInvoiceSchedules(): InvoiceSchedule[] {
  console.warn('getInvoiceSchedules is deprecated. Use getInvoiceSchedulesByCustomerIdAsync instead.');
  return [];
}

export function getInvoiceScheduleById(id: string): InvoiceSchedule | null {
  console.warn('getInvoiceScheduleById is deprecated. Use getInvoiceScheduleByIdAsync instead.');
  return null;
}

export function getInvoiceSchedulesByCustomerId(customerId: string): InvoiceSchedule[] {
  console.warn('getInvoiceSchedulesByCustomerId is deprecated. Use getInvoiceSchedulesByCustomerIdAsync instead.');
  return [];
}

export function saveInvoiceSchedule(schedule: InvoiceSchedule): InvoiceSchedule {
  console.warn('saveInvoiceSchedule is deprecated. Use saveInvoiceScheduleAsync instead.');
  return schedule;
}

export function updateInvoiceSchedule(id: string, data: Partial<InvoiceSchedule>): InvoiceSchedule | null {
  console.warn('updateInvoiceSchedule is deprecated. Use updateInvoiceScheduleAsync instead.');
  return null;
}

export function deleteInvoiceSchedule(id: string): boolean {
  console.warn('deleteInvoiceSchedule is deprecated. Use deleteInvoiceScheduleAsync instead.');
  return false;
}
