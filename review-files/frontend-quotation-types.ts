export interface Quotation {
  quotation_id: string;
  quotation_no: string;
  quotation_year: string;
  quotation_month: string;
  quotation_user_code: string;
  quotation_seq: number;
  quotation_revision: number;
  parent_quotation_id?: string;
  user_id: string;
  user_name: string;
  customer_id: string;
  customer_name: string;
  project_name: string;
  modality: string;
  status: 'draft' | 'submitted' | 'won' | 'lost' | 'expired';
  valid_days: number;
  valid_until: string;
  items: QuotationItem[];
  subtotal_test: number;
  subtotal_analysis: number;
  discount_rate: number;
  discount_amount: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface QuotationItem {
  id: string;
  test: import('./test').Test;
  quantity: number;
  unit_price: number;
  amount: number;
  is_option: boolean;
  parent_item_id?: string | null;
  sort_order?: number;
}

export interface AnalysisCost {
  validation_invivo: boolean;
  validation_invitro: boolean;
  validation_cost: number;
  analysis_count: number;
  analysis_cost: number;
  total_cost: number;
}
