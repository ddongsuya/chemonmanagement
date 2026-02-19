import { z } from 'zod';
import { QuotationStatus, QuotationType } from '@prisma/client';

// 독성시험 항목 스키마
export const toxicityItemSchema = z.object({
  id: z.string(),
  test: z.object({
    test_id: z.string(),
    test_name: z.string(),
    test_category: z.string(),
    test_subcategory: z.string().optional(),
    base_price: z.number(),
    unit: z.string(),
  }),
  quantity: z.number().min(1),
  unit_price: z.number().min(0),
  amount: z.number().min(0),
  is_option: z.boolean(),
  parent_item_id: z.string().nullable().optional(),
  sort_order: z.number().optional(),
});

// 효력시험 항목 스키마
export const efficacyItemSchema = z.object({
  id: z.string(),
  item_id: z.string(),
  item_name: z.string(),
  category: z.string(),
  unit_price: z.number().min(0),
  unit: z.string(),
  quantity: z.number().min(1),
  multiplier: z.number().min(1),
  amount: z.number().min(0),
  is_default: z.boolean(),
  usage_note: z.string().optional(),
});

// 견적서 생성 스키마
export const createQuotationSchema = z.object({
  quotationType: z.nativeEnum(QuotationType),
  customerId: z.string().uuid().optional().nullable(),
  customerName: z.string().min(1, '고객사명은 필수입니다'),
  projectName: z.string().min(1, '프로젝트명은 필수입니다'),
  modality: z.string().optional().nullable(),
  
  // 효력시험 전용
  modelId: z.string().optional().nullable(),
  modelCategory: z.string().optional().nullable(),
  indication: z.string().optional().nullable(),
  
  // 리드 연결 (신규)
  leadId: z.string().uuid().optional().nullable(),
  
  items: z.array(z.any()).min(1, '최소 1개의 항목이 필요합니다'),
  
  subtotalTest: z.number().optional().nullable(),
  subtotalAnalysis: z.number().optional().nullable(),
  subtotal: z.number().optional().nullable(),
  discountRate: z.number().optional().nullable(),
  discountAmount: z.number().optional().nullable(),
  vat: z.number().optional().nullable(),
  totalAmount: z.number().min(0, '총액은 0 이상이어야 합니다'),
  
  validDays: z.number().min(1).default(30),
  validUntil: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  status: z.nativeEnum(QuotationStatus).optional(),
});

export type CreateQuotationDTO = z.infer<typeof createQuotationSchema>;

// 견적서 수정 스키마
export const updateQuotationSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  customerName: z.string().min(1).optional(),
  projectName: z.string().min(1).optional(),
  modality: z.string().optional().nullable(),
  
  modelId: z.string().optional().nullable(),
  modelCategory: z.string().optional().nullable(),
  indication: z.string().optional().nullable(),
  
  // 리드 연결 (신규)
  leadId: z.string().uuid().optional().nullable(),
  
  items: z.array(z.any()).min(1).optional(),
  
  subtotalTest: z.number().optional().nullable(),
  subtotalAnalysis: z.number().optional().nullable(),
  subtotal: z.number().optional().nullable(),
  discountRate: z.number().optional().nullable(),
  discountAmount: z.number().optional().nullable(),
  vat: z.number().optional().nullable(),
  totalAmount: z.number().min(0).optional(),
  
  validDays: z.number().min(1).optional(),
  validUntil: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  status: z.nativeEnum(QuotationStatus).optional(),
});

export type UpdateQuotationDTO = z.infer<typeof updateQuotationSchema>;

// 견적서 필터
export interface QuotationFilters {
  quotationType?: QuotationType;
  status?: QuotationStatus;
  customerId?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
}

// 견적서 응답 타입
export interface QuotationResponse {
  id: string;
  quotationNumber: string;
  quotationType: QuotationType;
  userId: string;
  customerId: string | null;
  customerName: string;
  projectName: string;
  modality: string | null;
  modelId: string | null;
  modelCategory: string | null;
  indication: string | null;
  leadId: string | null;  // 신규: 연결된 리드 ID
  items: unknown[];
  subtotalTest: number | null;
  subtotalAnalysis: number | null;
  subtotal: number | null;
  discountRate: number | null;
  discountAmount: number | null;
  vat: number | null;
  totalAmount: number;
  validDays: number;
  validUntil: Date | null;
  notes: string | null;
  status: QuotationStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  customer?: {
    id: string;
    name: string;
    company: string | null;
  } | null;
  lead?: {
    id: string;
    companyName: string;
    contactName: string;
    status: string;
  } | null;
}
