// src/components/pdf/index.ts
// 계약서 PDF 컴포넌트 및 타입 내보내기

export { default as ContractPDF } from './ContractPDF';
export { default as ContractAmendmentPDF } from './ContractAmendmentPDF';

export type { ContractData, PartyInfo, PaymentSchedule } from './ContractPDF';
export type { AmendmentData, ChangeItem } from './ContractAmendmentPDF';

// 스타일 및 유틸리티
export {
  contractStyles,
  numberToKorean,
  formatContractDate,
  formatPeriod,
} from '@/lib/contractPdfStyles';
