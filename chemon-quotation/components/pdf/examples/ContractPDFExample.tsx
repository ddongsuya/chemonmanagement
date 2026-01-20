// src/components/pdf/examples/ContractPDFExample.tsx
// 계약서 PDF 사용 예시

'use client';

import React from 'react';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import ContractPDF, { ContractData } from '../ContractPDF';
import ContractAmendmentPDF, { AmendmentData } from '../ContractAmendmentPDF';

// ==================== 원계약서 예시 데이터 ====================

export const sampleContractData: ContractData = {
  // 기본 정보
  contractNumber: 'CT-2025-0001',
  contractDate: new Date('2025-11-27'),
  
  // 갑 (의뢰자)
  partyA: {
    name: '재)한국화학융합연구원 충북지점',
    address: '28161 충청북도 청주시 흥덕구 오송읍 오송생명로 5 화장품임상연구지원센터 1층',
    representative: '김현철',
    position: '연구원장',
  },
  
  // 을 (수탁자)
  partyB: {
    name: '코아스템켐온㈜ 양지지점',
    address: '경기도 용인시 처인구 양지면 남평로 240',
    representative: '양길안',
    position: '대표이사',
  },
  
  // 연구 정보
  researchTitle: 'MCF-7 세포를 이용한 시험물질의 효력시험',
  researchAmount: 13630000,
  vatIncluded: false,
  startDate: new Date('2025-11-13'),
  endDate: new Date('2026-01-08'),
  
  // 금액 정보
  paymentSchedule: [
    {
      type: '선금',
      amount: 6815000,
      vatIncluded: false,
      condition: '계약일로부터 30일 이내',
    },
    {
      type: '잔금',
      amount: 6815000,
      vatIncluded: false,
      condition: '최종결과보고서(안) 제출 후 30일 이내',
    },
  ],
  
  // 은행 정보
  bankName: '신한은행',
  accountNumber: '140-007-295200',
  accountHolder: '코아스템켐온㈜',
  
  // 첨부
  attachments: ['견적서'],
  
  // 옵션 (선택)
  // logo: '/images/chemon-logo.png',
  // signatureA: '/signatures/partyA-signature.png',
  // signatureB: '/signatures/partyB-signature.png',
};

// ==================== 변경계약서 예시 데이터 ====================

export const sampleAmendmentData: AmendmentData = {
  // 기본 정보
  amendmentNumber: 'CT-2025-0001-A1',
  amendmentDate: new Date('2025-12-09'),
  
  // 원계약 정보
  originalContractNumber: 'CT-2025-0001',
  originalContractDate: new Date('2025-11-27'),
  originalResearchTitle: 'MCF-7 세포를 이용한 시험물질의 효력시험',
  studyNumber: '25-VE-3080E, 25-383-1',
  
  // 당사자 정보
  partyA: {
    name: '재)한국화학융합연구원 충북지점',
    address: '28161 충청북도 청주시 흥덕구 오송읍 오송생명로 5 화장품임상연구지원센터 1층',
    representative: '김현철',
    position: '연구원장',
  },
  partyB: {
    name: '코아스템켐온㈜ 비임상CRO사업부',
    address: '경기도 용인시 처인구 양지면 남평로 240',
    representative: '양길안',
    position: '대표자',
  },
  
  // 변경 사유
  changeReason: '정확한 예산 집행을 위한 금액 변경',
  
  // 기타 변경사항 (제2조, 제4조 외 추가 변경이 있는 경우)
  changes: [],
  
  // 연구 정보 변경
  researchInfo: {
    before: {
      title: 'MCF-7 세포를 이용한 시험물질의 효력시험',
      amount: 13630000,
      vatIncluded: false,
      startDate: new Date('2025-11-13'),
      endDate: new Date('2026-01-08'),
    },
    after: {
      title: 'MCF-7 세포를 이용한 시험물질의 효력시험',
      amount: 15000000,
      vatIncluded: true,
      startDate: new Date('2025-11-13'),
      endDate: new Date('2026-01-08'),
    },
  },
  
  // 금액 정보 변경
  paymentInfo: {
    before: {
      payments: [
        { type: '선금', amount: 6815000, vatIncluded: false, condition: '계약일로부터 30일 이내' },
        { type: '잔금', amount: 6815000, vatIncluded: false, condition: '최종결과보고서(안) 제출 후 30일 이내' },
      ],
    },
    after: {
      payments: [
        { type: '일시납', amount: 15000000, vatIncluded: true, condition: '계약일로부터 30일 이내' },
      ],
    },
  },
  
  // 은행 정보
  bankName: '신한은행',
  accountNumber: '140-007-295200',
  accountHolder: '코아스템켐온㈜',
  
  // 첨부
  attachments: ['변경 전 견적서 및 의뢰자(KTR충북지점) 각 1부'],
};

// ==================== PDF 다운로드 버튼 컴포넌트 ====================

export const ContractPDFDownloadButton: React.FC<{
  data: ContractData;
  filename?: string;
}> = ({ data, filename = 'contract.pdf' }) => (
  <PDFDownloadLink
    document={<ContractPDF data={data} />}
    fileName={filename}
    style={{
      padding: '10px 20px',
      backgroundColor: '#1a365d',
      color: 'white',
      textDecoration: 'none',
      borderRadius: '6px',
      display: 'inline-block',
    }}
  >
    계약서 PDF 다운로드
  </PDFDownloadLink>
);

export const AmendmentPDFDownloadButton: React.FC<{
  data: AmendmentData;
  filename?: string;
}> = ({ data, filename = 'amendment.pdf' }) => (
  <PDFDownloadLink
    document={<ContractAmendmentPDF data={data} />}
    fileName={filename}
    style={{
      padding: '10px 20px',
      backgroundColor: '#744210',
      color: 'white',
      textDecoration: 'none',
      borderRadius: '6px',
      display: 'inline-block',
    }}
  >
    변경계약서 PDF 다운로드
  </PDFDownloadLink>
);

// ==================== PDF 미리보기 컴포넌트 ====================

export const ContractPDFPreview: React.FC<{ data: ContractData }> = ({ data }) => (
  <PDFViewer style={{ width: '100%', height: '800px' }}>
    <ContractPDF data={data} />
  </PDFViewer>
);

export const AmendmentPDFPreview: React.FC<{ data: AmendmentData }> = ({ data }) => (
  <PDFViewer style={{ width: '100%', height: '800px' }}>
    <ContractAmendmentPDF data={data} />
  </PDFViewer>
);

// ==================== 예시 페이지 컴포넌트 ====================

const ContractPDFExample: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>계약서 PDF 예시</h1>
      
      <section style={{ marginBottom: '40px' }}>
        <h2>1. 위탁연구계약서</h2>
        <div style={{ marginBottom: '20px' }}>
          <ContractPDFDownloadButton 
            data={sampleContractData} 
            filename={`위탁연구계약서_${sampleContractData.partyA.name}_${new Date().toISOString().split('T')[0]}.pdf`}
          />
        </div>
        <ContractPDFPreview data={sampleContractData} />
      </section>
      
      <section style={{ marginBottom: '40px' }}>
        <h2>2. 변경계약서</h2>
        <div style={{ marginBottom: '20px' }}>
          <AmendmentPDFDownloadButton 
            data={sampleAmendmentData}
            filename={`변경계약서_${sampleAmendmentData.partyA.name}_${new Date().toISOString().split('T')[0]}.pdf`}
          />
        </div>
        <AmendmentPDFPreview data={sampleAmendmentData} />
      </section>
    </div>
  );
};

export default ContractPDFExample;
