// 계약서 생성에 필요한 전체 데이터
export interface ContractData {
  customer: {
    companyName: string;        // 고객사명
    address: string;            // 주소
    ceoName: string;            // 대표이사명
  };
  project: {
    name: string;               // 프로젝트명
    description?: string;       // 프로젝트 설명 (선택)
  };
  payment: {
    subtotal: number;           // 공급가액 (VAT 별도)
    vatRate: number;            // VAT 비율 (기본 10%)
    vatAmount: number;          // VAT 금액
    totalAmount: number;        // 총액 (VAT 포함)
    advancePayment: {
      rate: number;             // 선금 비율 (기본 50%)
      amount: number;           // 선금 금액
      amountInKorean: string;   // 선금 한글 표기
      dueCondition: string;     // 지급 조건
    };
    remainingPayment: {
      rate: number;             // 잔금 비율 (기본 50%)
      amount: number;           // 잔금 금액
      amountInKorean: string;   // 잔금 한글 표기
      dueCondition: string;     // 지급 조건
    };
  };
  period: {
    startDate: string;          // 시작일
    endDate: string;            // 종료일
    totalWeeks: number;         // 총 소요기간 (주)
    displayText: string;        // 표시 텍스트
  };
  contract: {
    date: string;               // 계약일
    isDraft: boolean;           // 안(案) 여부
  };
  quotation: {
    quotationNo: string;        // 견적번호
    items: QuotationItem[];     // 시험 항목 목록
  };
}

// 견적서 항목
export interface QuotationItem {
  no: number;                   // 순번
  testName: string;             // 시험명
  species?: string;             // 동물종
  duration?: string;            // 투여기간
  route?: string;               // 투여경로
  options?: string[];           // 옵션 (TK, 회복군 등)
  unitPrice: number;            // 단가
  quantity: number;             // 수량
  totalPrice: number;           // 금액
  remarks?: string;             // 비고
}

// 계약서 폼 데이터
export interface ContractFormData {
  customerName: string;
  customerAddress: string;
  customerCeo: string;
  projectName: string;
  startDate: string;
  endDate: string;
  advanceRate: number;
  contractDate: string;
  isDraft: boolean;
}

// 계약서 상태
export type ContractStatus = 'DRAFT' | 'SENT' | 'SIGNED' | 'COMPLETED';
