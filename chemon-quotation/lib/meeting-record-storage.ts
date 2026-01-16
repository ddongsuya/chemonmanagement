/**
 * 미팅 기록 로컬 스토리지 관리
 * - 백엔드 연동 전까지 localStorage로 미팅 기록 데이터 관리
 * - Requirements: 5.2, 5.4, 5.5, 8.3
 */

import { MeetingRecord } from '@/types/customer';

const MEETING_RECORDS_STORAGE_KEY = 'chemon_meeting_records';

// 모든 미팅 기록 조회
export function getAllMeetingRecords(): MeetingRecord[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(MEETING_RECORDS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// 단일 미팅 기록 조회
export function getMeetingRecordById(id: string): MeetingRecord | null {
  const records = getAllMeetingRecords();
  return records.find(r => r.id === id) || null;
}

// 고객사별 미팅 기록 조회 (시간순 내림차순 정렬)
// Requirements: 5.2, 7.4 - 타임라인 시간순 정렬
export function getMeetingRecordsByCustomerId(customerId: string): MeetingRecord[] {
  const records = getAllMeetingRecords();
  return records
    .filter(r => r.customer_id === customerId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// 의뢰자별 미팅 기록 조회
export function getMeetingRecordsByRequesterId(requesterId: string): MeetingRecord[] {
  const records = getAllMeetingRecords();
  return records
    .filter(r => r.requester_id === requesterId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// 미팅 기록 저장
// Requirements: 5.2 - 미팅 기록이 저장되면 고객사 타임라인에 시간순으로 표시
export function saveMeetingRecord(record: MeetingRecord): MeetingRecord {
  const records = getAllMeetingRecords();
  const existingIndex = records.findIndex(r => r.id === record.id);
  
  const now = new Date().toISOString();
  
  // 요청사항인 경우 초기 상태 설정
  // Requirements: 5.4 - 요청사항 등록 시 초기 상태는 'pending'
  const recordToSave: MeetingRecord = {
    ...record,
    request_status: record.is_request && !record.request_status ? 'pending' : record.request_status,
  };
  
  if (existingIndex >= 0) {
    records[existingIndex] = { ...recordToSave, updated_at: now };
  } else {
    const newRecord = {
      ...recordToSave,
      created_at: recordToSave.created_at || now,
      updated_at: now,
    };
    records.unshift(newRecord);
  }
  
  localStorage.setItem(MEETING_RECORDS_STORAGE_KEY, JSON.stringify(records));
  return existingIndex >= 0 ? records[existingIndex] : records[0];
}

// 미팅 기록 수정
export function updateMeetingRecord(id: string, updates: Partial<MeetingRecord>): MeetingRecord | null {
  const records = getAllMeetingRecords();
  const index = records.findIndex(r => r.id === id);
  
  if (index < 0) return null;
  
  records[index] = {
    ...records[index],
    ...updates,
    id, // ID는 변경 불가
    updated_at: new Date().toISOString(),
  };
  
  localStorage.setItem(MEETING_RECORDS_STORAGE_KEY, JSON.stringify(records));
  return records[index];
}

// 미팅 기록 삭제
export function deleteMeetingRecord(id: string): boolean {
  const records = getAllMeetingRecords();
  const filtered = records.filter(r => r.id !== id);
  
  if (filtered.length === records.length) return false;
  
  localStorage.setItem(MEETING_RECORDS_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

// 요청사항만 조회 (고객사별)
// Requirements: 5.4, 5.5 - 요청사항 관리
export function getRequestsByCustomerId(customerId: string): MeetingRecord[] {
  const records = getAllMeetingRecords();
  return records
    .filter(r => r.customer_id === customerId && r.is_request)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// 미처리 요청사항 조회 (고객사별)
export function getPendingRequestsByCustomerId(customerId: string): MeetingRecord[] {
  const records = getRequestsByCustomerId(customerId);
  return records.filter(r => r.request_status === 'pending' || r.request_status === 'in_progress');
}

// 요청사항 상태 업데이트
// Requirements: 5.5 - 요청사항 처리 완료 시 상태 변경 및 처리 내용 기록
export function updateRequestStatus(
  id: string,
  status: 'pending' | 'in_progress' | 'completed',
  response?: string
): MeetingRecord | null {
  const updates: Partial<MeetingRecord> = {
    request_status: status,
  };
  
  if (status === 'completed') {
    updates.request_completed_at = new Date().toISOString();
    if (response) {
      updates.request_response = response;
    }
  }
  
  return updateMeetingRecord(id, updates);
}

// 유형별 미팅 기록 조회
export function getMeetingRecordsByType(
  customerId: string,
  type: MeetingRecord['type']
): MeetingRecord[] {
  const records = getMeetingRecordsByCustomerId(customerId);
  return records.filter(r => r.type === type);
}

// 날짜 범위로 미팅 기록 조회
export function getMeetingRecordsByDateRange(
  customerId: string,
  startDate: string,
  endDate: string
): MeetingRecord[] {
  const records = getMeetingRecordsByCustomerId(customerId);
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  
  return records.filter(r => {
    const recordDate = new Date(r.date).getTime();
    return recordDate >= start && recordDate <= end;
  });
}
