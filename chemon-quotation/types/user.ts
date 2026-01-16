export interface User {
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  user_code: string; // 견적서 코드 (2글자 영문: DL, PK, KS 등)
  next_quotation_seq: number; // 다음 견적 일련번호
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  user_code: string;
  next_quotation_seq: number;
}
