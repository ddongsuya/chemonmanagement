// 고객사
export interface Customer {
  id: string;
  company_name: string;
  business_number: string | null;
  address: string | null;
  contact_person: string;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  quotation_count: number;
  total_amount: number;
}

// 고객사 생성/수정 폼
export interface CustomerFormData {
  company_name: string;
  business_number?: string;
  address?: string;
  contact_person: string;
  contact_email?: string;
  contact_phone?: string;
}

// 의뢰자
export interface Requester {
  id: string;
  customer_id: string;
  name: string;
  position: string; // 직책
  department: string; // 부서
  phone: string;
  email: string;
  is_primary: boolean; // 주 담당자 여부
  is_active: boolean; // 활성화 상태
  created_at: string;
  updated_at: string;
}

// 시험 접수
export interface TestReception {
  id: string;
  customer_id: string;
  requester_id: string;
  contract_id: string;
  quotation_id: string;

  // 헤더 정보
  substance_code: string; // 물질코드
  project_code: string; // 프로젝트코드
  substance_name: string; // 시험물질명
  institution_name: string; // 의뢰기관명
  test_number: string; // 시험번호
  test_title: string; // 시험제목
  test_director: string; // 시험책임자

  // 금액 정보
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;

  // 상태
  status: 'received' | 'in_progress' | 'completed' | 'cancelled';
  reception_date: string;
  expected_completion_date: string;
  actual_completion_date?: string;

  created_at: string;
  updated_at: string;
}

// 세금계산서 발행 일정
export interface InvoiceSchedule {
  id: string;
  test_reception_id: string;
  customer_id: string;

  amount: number;
  scheduled_date: string; // 발행 예정일
  issued_date?: string; // 실제 발행일
  invoice_number?: string; // 세금계산서 번호

  payment_type: 'full' | 'partial'; // 전액/분할
  installment_number?: number; // 분할 회차
  total_installments?: number; // 총 분할 횟수

  status: 'pending' | 'issued' | 'paid' | 'overdue';
  notes?: string;

  created_at: string;
  updated_at: string;
}

// 체크리스트 항목
export interface ChecklistItem {
  id: string;
  stage: string;
  title: string;
  description?: string;
  is_completed: boolean;
  completed_at?: string;
  completed_by?: string;
}

// 단계 이력 항목
export interface StageHistoryItem {
  stage: string;
  entered_at: string;
  completed_at?: string;
  notes?: string;
}

// 진행 단계
export interface ProgressStage {
  id: string;
  customer_id: string;
  quotation_id?: string;
  contract_id?: string;

  current_stage:
    | 'inquiry' // 문의접수
    | 'quotation_sent' // 견적서 송부
    | 'test_request' // 시험 의뢰 요청
    | 'contract_signed' // 계약 체결
    | 'test_reception' // 시험접수
    | 'test_management' // 시험관리
    | 'fund_management'; // 자금관리

  checklist: ChecklistItem[];

  stage_history: StageHistoryItem[];

  created_at: string;
  updated_at: string;
}

// 첨부파일
export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

// 미팅 기록
export interface MeetingRecord {
  id: string;
  customer_id: string;
  requester_id?: string;

  type: 'meeting' | 'call' | 'email' | 'visit';
  date: string;
  time?: string;
  duration?: number; // 분 단위

  title: string;
  attendees: string[];
  content: string; // 리치 텍스트
  follow_up_actions?: string;

  attachments?: Attachment[];

  // 요청사항 관련
  is_request: boolean;
  request_status?: 'pending' | 'in_progress' | 'completed';
  request_completed_at?: string;
  request_response?: string;

  created_at: string;
  updated_at: string;
}

// 캘린더 이벤트
export interface CalendarEvent {
  id: string;
  customer_id?: string;
  test_reception_id?: string;
  invoice_schedule_id?: string;
  meeting_record_id?: string;

  type: 'meeting' | 'invoice' | 'deadline' | 'reminder' | 'other';
  title: string;
  description?: string;

  start_date: string;
  end_date?: string;
  all_day: boolean;

  color?: string;

  reminder_before?: number; // 분 단위

  created_at: string;
  updated_at: string;
}
