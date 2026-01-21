/**
 * 미팅 기록 관리
 * - 백엔드 API 연동 완료
 * - Requirements: 5.2, 5.4, 5.5, 8.3
 */

import { MeetingRecord } from '@/types/customer';
import { meetingRecordApi } from './customer-data-api';

// ============================================
// API 기반 함수들
// ============================================

/**
 * 고객사별 미팅 기록 조회 (API)
 */
export async function getMeetingRecordsByCustomerIdAsync(
  customerId: string,
  options?: { requestsOnly?: boolean; pendingOnly?: boolean }
): Promise<MeetingRecord[]> {
  try {
    return await meetingRecordApi.getByCustomerId(customerId, options);
  } catch {
    return [];
  }
}

/**
 * 미팅 기록 상세 조회 (API)
 */
export async function getMeetingRecordByIdAsync(id: string): Promise<MeetingRecord | null> {
  try {
    return await meetingRecordApi.getById(id);
  } catch {
    return null;
  }
}

/**
 * 미팅 기록 저장 (API)
 */
export async function saveMeetingRecordAsync(
  customerId: string,
  record: Omit<MeetingRecord, 'id' | 'customer_id' | 'created_at' | 'updated_at'>
): Promise<MeetingRecord> {
  return await meetingRecordApi.create(customerId, record);
}

/**
 * 미팅 기록 수정 (API)
 */
export async function updateMeetingRecordAsync(id: string, data: Partial<MeetingRecord>): Promise<MeetingRecord> {
  return await meetingRecordApi.update(id, data);
}

/**
 * 요청사항 상태 업데이트 (API)
 */
export async function updateRequestStatusAsync(
  id: string,
  status: string,
  response?: string
): Promise<MeetingRecord> {
  return await meetingRecordApi.updateRequestStatus(id, status, response);
}

/**
 * 미팅 기록 삭제 (API)
 */
export async function deleteMeetingRecordAsync(id: string): Promise<boolean> {
  try {
    await meetingRecordApi.delete(id);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// Legacy 동기 함수들 (테스트 호환성)
// ============================================

export function getMeetingRecords(): MeetingRecord[] {
  console.warn('getMeetingRecords is deprecated. Use getMeetingRecordsByCustomerIdAsync instead.');
  return [];
}

export function getMeetingRecordById(id: string): MeetingRecord | null {
  console.warn('getMeetingRecordById is deprecated. Use getMeetingRecordByIdAsync instead.');
  return null;
}

export function getMeetingRecordsByCustomerId(customerId: string): MeetingRecord[] {
  console.warn('getMeetingRecordsByCustomerId is deprecated. Use getMeetingRecordsByCustomerIdAsync instead.');
  return [];
}

export function saveMeetingRecord(record: MeetingRecord): MeetingRecord {
  console.warn('saveMeetingRecord is deprecated. Use saveMeetingRecordAsync instead.');
  return record;
}

export function updateMeetingRecord(id: string, data: Partial<MeetingRecord>): MeetingRecord | null {
  console.warn('updateMeetingRecord is deprecated. Use updateMeetingRecordAsync instead.');
  return null;
}

export function deleteMeetingRecord(id: string): boolean {
  console.warn('deleteMeetingRecord is deprecated. Use deleteMeetingRecordAsync instead.');
  return false;
}
