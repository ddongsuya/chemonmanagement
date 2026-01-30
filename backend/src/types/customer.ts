import { z } from 'zod';
import { CustomerGrade, LeadSource, LeadStatus } from '@prisma/client';

// Create customer schema
export const createCustomerSchema = z.object({
  name: z.string().min(1, '이름은 필수입니다').max(100, '이름은 100자 이하여야 합니다'),
  company: z.string().max(200, '회사명은 200자 이하여야 합니다').optional().nullable(),
  email: z.string().email('유효한 이메일 형식이 아닙니다').optional().nullable(),
  phone: z.string().max(50, '전화번호는 50자 이하여야 합니다').optional().nullable(),
  address: z.string().max(500, '주소는 500자 이하여야 합니다').optional().nullable(),
  notes: z.string().max(2000, '메모는 2000자 이하여야 합니다').optional().nullable(),
});

export type CreateCustomerDTO = z.infer<typeof createCustomerSchema>;

// Update customer schema
export const updateCustomerSchema = z.object({
  name: z.string().min(1, '이름은 필수입니다').max(100, '이름은 100자 이하여야 합니다').optional(),
  company: z.string().max(200, '회사명은 200자 이하여야 합니다').optional().nullable(),
  email: z.string().email('유효한 이메일 형식이 아닙니다').optional().nullable(),
  phone: z.string().max(50, '전화번호는 50자 이하여야 합니다').optional().nullable(),
  address: z.string().max(500, '주소는 500자 이하여야 합니다').optional().nullable(),
  notes: z.string().max(2000, '메모는 2000자 이하여야 합니다').optional().nullable(),
});

export type UpdateCustomerDTO = z.infer<typeof updateCustomerSchema>;

// Customer grade type (re-export for convenience)
export { CustomerGrade };

// Customer filters with grade support
export interface CustomerFilters {
  search?: string;
  grade?: CustomerGrade;  // 신규: grade 필터
  page: number;
  limit: number;
}

// Linked lead information for customer response
export interface LinkedLeadInfo {
  id: string;
  source: LeadSource;
  status: LeadStatus;
}

// Customer response type
export interface CustomerResponse {
  id: string;
  userId: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  grade: CustomerGrade;  // 신규: grade 필드
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// Extended customer response with linked lead info
export interface CustomerWithLeadResponse extends CustomerResponse {
  linkedLead?: LinkedLeadInfo;
}
