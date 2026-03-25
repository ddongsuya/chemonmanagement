// lib/study-document-api.ts
// 시험 문서 이력 + 타임라인 + 일괄 등록 API

import { api } from './api';

// ─── Types ───

export interface StudyDocument {
  id: string;
  studyId: string;
  documentType: StudyDocumentType;
  version: DocumentVersion;
  sentYear: number;
  sentMonth: number;
  sentDate: string | null;
  comment: string | null;
  createdBy: string;
  creator: { id: string; name: string };
  createdAt: string;
}

export type StudyDocumentType =
  | 'DISCUSSION'
  | 'PROTOCOL'
  | 'AMENDMENT'
  | 'SUSPENSION_RECORD'
  | 'SUSPENSION_REPORT'
  | 'FINAL_REPORT';

export type DocumentVersion =
  | 'FIRST_DRAFT'
  | 'SECOND_DRAFT'
  | 'THIRD_DRAFT'
  | 'DRAFT_FINAL'
  | 'FINAL'
  | 'N_A';

export const DOCUMENT_TYPE_CONFIG: Record<StudyDocumentType, { label: string; color: string; isAlert?: boolean }> = {
  DISCUSSION: { label: '논의', color: 'gray' },
  PROTOCOL: { label: '시험계획서', color: 'blue' },
  AMENDMENT: { label: '변경기록지', color: 'amber' },
  SUSPENSION_RECORD: { label: '시험중단기록지', color: 'red', isAlert: true },
  SUSPENSION_REPORT: { label: '시험중단보고서', color: 'red', isAlert: true },
  FINAL_REPORT: { label: '최종보고서', color: 'green' },
};

export const VERSION_LABELS: Record<DocumentVersion, string> = {
  FIRST_DRAFT: '1차',
  SECOND_DRAFT: '2차',
  THIRD_DRAFT: '3차',
  DRAFT_FINAL: '안',
  FINAL: '최종',
  N_A: '',
};

// 문서 유형별 선택 가능한 버전
export const VERSION_OPTIONS: Record<StudyDocumentType, DocumentVersion[]> = {
  PROTOCOL: ['FIRST_DRAFT', 'SECOND_DRAFT', 'THIRD_DRAFT', 'FINAL'],
  AMENDMENT: ['N_A'],
  FINAL_REPORT: ['DRAFT_FINAL', 'FINAL'],
  DISCUSSION: ['N_A'],
  SUSPENSION_RECORD: ['N_A'],
  SUSPENSION_REPORT: ['N_A'],
};

export interface TimelineEvent {
  id: string;
  studyCode: string;
  studyTitle: string;
  studyDirector: string;
  documentType: StudyDocumentType;
  version: DocumentVersion;
  comment: string | null;
  sentDate: string | null;
  createdBy: { id: string; name: string };
  isAlert: boolean;
}

export interface TimelineMonth {
  year: number;
  month: number;
  label: string;
  events: TimelineEvent[];
}

export interface TimelineResponse {
  months: TimelineMonth[];
  summary: {
    totalStudies: number;
    totalDocuments: number;
    byDocumentType: Record<string, number>;
    byStatus: Record<string, number>;
  };
  studyList: {
    id: string;
    studyCode: string;
    studyTitle: string;
    studyDirector: string;
    status: string;
    documentCount: number;
  }[];
}

// 시험번호 색상 매핑
export const STUDY_TYPE_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  NV: { text: '#185FA5', bg: '#E6F1FB', border: '#85B7EB' },
  RR: { text: '#993C1D', bg: '#FAECE7', border: '#F0997B' },
  RV: { text: '#3B6D11', bg: '#EAF3DE', border: '#97C459' },
  DA: { text: '#3C3489', bg: '#EEEDFE', border: '#AFA9EC' },
  DR: { text: '#534AB7', bg: '#EEEDFE', border: '#CECBF6' },
  DV: { text: '#085041', bg: '#E1F5EE', border: '#5DCAA5' },
  GL: { text: '#633806', bg: '#FAEEDA', border: '#FAC775' },
  DEFAULT: { text: '#475569', bg: '#F1F5F9', border: '#CBD5E1' },
};

export function getStudyTypeColor(studyCode: string) {
  const parts = studyCode.split('-');
  const prefix = parts.length >= 2 ? parts[1] : 'DEFAULT';
  return STUDY_TYPE_COLORS[prefix] || STUDY_TYPE_COLORS.DEFAULT;
}

// ─── API Functions ───

export async function getStudyDocuments(studyId: string) {
  const res = await api.get<{ documents: StudyDocument[] }>(`/studies/${studyId}/documents`);
  return res.documents;
}

export async function createStudyDocument(studyId: string, data: {
  documentType: StudyDocumentType;
  version: DocumentVersion;
  sentYear: number;
  sentMonth: number;
  sentDate?: string;
  comment?: string;
}) {
  const res = await api.post<{ document: StudyDocument }>(`/studies/${studyId}/documents`, data);
  return res.document;
}

export async function updateStudyDocument(documentId: string, data: Partial<{
  documentType: StudyDocumentType;
  version: DocumentVersion;
  sentYear: number;
  sentMonth: number;
  sentDate: string | null;
  comment: string | null;
}>) {
  const res = await api.put<{ document: StudyDocument }>(`/documents/${documentId}`, data);
  return res.document;
}

export async function deleteStudyDocument(documentId: string) {
  await api.delete(`/documents/${documentId}`);
}

export async function getContractTimeline(contractId: string, params?: {
  studyCode?: string;
  documentType?: string;
  year?: number;
  month?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.studyCode) qs.set('studyCode', params.studyCode);
  if (params?.documentType) qs.set('documentType', params.documentType);
  if (params?.year) qs.set('year', params.year.toString());
  if (params?.month) qs.set('month', params.month.toString());
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return api.get<TimelineResponse>(`/contracts/${contractId}/timeline${query}`);
}

export async function bulkCreateStudies(contractId: string, studies: {
  substanceCode?: string;
  projectCode?: string;
  testSubstance?: string;
  sponsor?: string;
  studyCode?: string;
  studyTitle?: string;
  studyDirector?: string;
}[]) {
  return api.post<{ studies: any[]; count: number }>(`/contracts/${contractId}/studies/bulk`, { studies });
}
