// 고객사 CRM 통합 데이터 타입

export interface CustomerQuotation {
  id: string;
  quotationNumber: string;
  quotationType: 'TOXICITY' | 'EFFICACY' | 'CLINICAL_PATHOLOGY';
  projectName: string;
  status: string;
  totalAmount: number;
  customerName: string;
  createdAt: string;
}

export interface CustomerContract {
  id: string;
  contractNumber: string;
  contractType: string;
  title: string;
  status: string;
  totalAmount: number;
  signedDate: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export interface LeadActivityData {
  lead: {
    id: string;
    leadNumber: string;
    source: string;
    status: string;
    stageName: string;
    expectedAmount: number | null;
    convertedAt: string | null;
    companyName: string;
    contactName: string;
  } | null;
  activities: LeadActivityItem[];
}

export interface LeadActivityItem {
  id: string;
  type: string;
  subject: string;
  content: string;
  contactedAt: string;
  nextAction: string | null;
  nextDate: string | null;
  userName: string;
}

export interface CustomerConsultation {
  id: string;
  recordNumber: string;
  consultDate: string;
  substanceName: string | null;
  clientRequests: string | null;
  internalNotes: string | null;
  contractNumber: string | null;
}

export interface TimelineItem {
  id: string;
  type: 'quotation' | 'contract' | 'meeting' | 'calendar_event' | 'lead_activity' | 'consultation';
  title: string;
  description: string;
  date: string;
  metadata?: Record<string, any>;
}
