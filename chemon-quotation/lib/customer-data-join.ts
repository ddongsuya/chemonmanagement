/**
 * 고객사 데이터 조인 유틸리티
 * - 백엔드 API 연동 완료
 * Requirements: 8.5 - 데이터 조회 요청 시 연관된 모든 데이터를 조인하여 통합 뷰를 제공
 */

import { Requester, TestReception, InvoiceSchedule, MeetingRecord } from '@/types/customer';
import { getRequestersByCustomerIdAsync } from '@/lib/requester-storage';
import { getTestReceptionsByCustomerIdAsync } from '@/lib/test-reception-storage';
import { getInvoiceSchedulesByCustomerIdAsync } from '@/lib/invoice-schedule-storage';
import { getMeetingRecordsByCustomerIdAsync } from '@/lib/meeting-record-storage';
import { getAllQuotationsAsync, SavedQuotation } from '@/lib/quotation-storage';

/**
 * 고객사 통합 데이터 인터페이스
 */
export interface CustomerIntegratedData {
  customerId: string;
  requesters: Requester[];
  quotations: SavedQuotation[];
  testReceptions: TestReception[];
  invoiceSchedules: InvoiceSchedule[];
  meetingRecords: MeetingRecord[];
}

/**
 * 고객사 ID로 모든 연관 데이터를 조인하여 통합 뷰 반환 (API)
 * 
 * @param customerId - 고객사 ID
 * @returns 고객사의 모든 연관 데이터
 */
export async function getCustomerIntegratedDataAsync(customerId: string): Promise<CustomerIntegratedData> {
  const [requesters, quotationsAll, testReceptions, invoiceSchedules, meetingRecords] = await Promise.all([
    getRequestersByCustomerIdAsync(customerId),
    getAllQuotationsAsync({ customerId }),
    getTestReceptionsByCustomerIdAsync(customerId),
    getInvoiceSchedulesByCustomerIdAsync(customerId),
    getMeetingRecordsByCustomerIdAsync(customerId),
  ]);

  return {
    customerId,
    requesters,
    quotations: quotationsAll.filter(q => q.customer_id === customerId),
    testReceptions,
    invoiceSchedules,
    meetingRecords,
  };
}

/**
 * 통합 데이터의 모든 항목이 해당 고객사에 연결되어 있는지 검증
 * 
 * @param data - 통합 데이터
 * @returns 모든 데이터가 올바르게 연결되어 있으면 true
 */
export function validateCustomerDataIntegrity(data: CustomerIntegratedData): boolean {
  const { customerId, requesters, quotations, testReceptions, invoiceSchedules, meetingRecords } = data;

  // 모든 의뢰자가 해당 고객사에 연결되어 있는지 확인
  for (const requester of requesters) {
    if (requester.customer_id !== customerId) {
      return false;
    }
  }

  // 모든 견적서가 해당 고객사에 연결되어 있는지 확인
  for (const quotation of quotations) {
    if (quotation.customer_id !== customerId) {
      return false;
    }
  }

  // 모든 시험 접수가 해당 고객사에 연결되어 있는지 확인
  for (const testReception of testReceptions) {
    if (testReception.customer_id !== customerId) {
      return false;
    }
  }

  // 모든 세금계산서 일정이 해당 고객사에 연결되어 있는지 확인
  for (const invoiceSchedule of invoiceSchedules) {
    if (invoiceSchedule.customer_id !== customerId) {
      return false;
    }
  }

  // 모든 미팅 기록이 해당 고객사에 연결되어 있는지 확인
  for (const meetingRecord of meetingRecords) {
    if (meetingRecord.customer_id !== customerId) {
      return false;
    }
  }

  return true;
}

/**
 * 통합 데이터에서 특정 의뢰자의 관련 데이터만 필터링
 * 
 * @param data - 통합 데이터
 * @param requesterId - 의뢰자 ID
 * @returns 해당 의뢰자와 관련된 데이터만 포함된 통합 데이터
 */
export function filterByRequester(
  data: CustomerIntegratedData,
  requesterId: string
): Partial<CustomerIntegratedData> {
  return {
    customerId: data.customerId,
    requesters: data.requesters.filter(r => r.id === requesterId),
    testReceptions: data.testReceptions.filter(t => t.requester_id === requesterId),
    meetingRecords: data.meetingRecords.filter(m => m.requester_id === requesterId),
  };
}

// ============================================
// Legacy 동기 함수들 (테스트 호환성)
// ============================================

export function getCustomerIntegratedData(customerId: string): CustomerIntegratedData {
  console.warn('getCustomerIntegratedData is deprecated. Use getCustomerIntegratedDataAsync instead.');
  return {
    customerId,
    requesters: [],
    quotations: [],
    testReceptions: [],
    invoiceSchedules: [],
    meetingRecords: [],
  };
}
