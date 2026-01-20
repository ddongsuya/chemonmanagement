// src/components/pdf/ContractAmendmentPDF.tsx
// 연구 위탁 계약 변경계약서 PDF 문서

'use client';

import React from 'react';
import { Document, Page, Text, View, Image } from '@react-pdf/renderer';
import {
  contractStyles,
  numberToKorean,
  formatContractDate,
  formatPeriod,
} from '@/lib/contractPdfStyles';

// ==================== 타입 정의 ====================

export interface PartyInfo {
  name: string;
  address: string;
  representative: string;
  position?: string;
}

export interface ChangeItem {
  article: string;        // 조항 (제2조, 제4조 등)
  articleTitle: string;   // 조항명 (연구의 내용 및 범위)
  beforeContent: string;  // 변경 전 내용
  afterContent: string;   // 변경 후 내용
}

export interface AmendmentData {
  // 기본 정보
  amendmentNumber: string;        // 변경계약 번호
  amendmentDate: Date;            // 변경계약 체결일
  
  // 원계약 정보
  originalContractNumber: string; // 원계약 번호
  originalContractDate: Date;     // 원계약 체결일
  originalResearchTitle: string;  // 원계약 연구과제명
  studyNumber?: string;           // 시험번호 (있는 경우)
  
  // 당사자 정보
  partyA: PartyInfo;
  partyB: PartyInfo;
  
  // 변경 사유
  changeReason: string;
  
  // 변경 사항
  changes: ChangeItem[];
  
  // 연구 정보 변경 (있는 경우)
  researchInfo?: {
    before: {
      title: string;
      amount: number;
      vatIncluded: boolean;
      startDate: Date;
      endDate: Date;
    };
    after: {
      title: string;
      amount: number;
      vatIncluded: boolean;
      startDate: Date;
      endDate: Date;
    };
  };
  
  // 금액 변경 (있는 경우)
  paymentInfo?: {
    before: {
      payments: Array<{
        type: string;
        amount: number;
        vatIncluded: boolean;
        condition: string;
      }>;
    };
    after: {
      payments: Array<{
        type: string;
        amount: number;
        vatIncluded: boolean;
        condition: string;
      }>;
    };
  };
  
  // 은행 정보
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  
  // 옵션
  logo?: string;
  signatureA?: string;
  signatureB?: string;
  
  // 첨부
  attachments?: string[];
}

// ==================== 서브 컴포넌트 ====================

// 제목 섹션
const TitleSection: React.FC = () => (
  <View style={contractStyles.titleSection}>
    <Text style={contractStyles.amendmentTitle}>연구 위탁 계약 변경계약서</Text>
  </View>
);

// 전문 (서문)
const Preamble: React.FC<{ data: AmendmentData }> = ({ data }) => (
  <View style={contractStyles.preamble}>
    <Text style={contractStyles.preambleText}>
      {data.partyA.name}(이하 "갑"이라 한다.)과 {data.partyB.name}(이하 "을"이라 한다.)은 
      다음과 같이 합의하고 연구취소에 따른 본 변경계약(이하 "본 계약")을 체결하기로 한다.
    </Text>
    
    <Text style={[contractStyles.preambleText, contractStyles.mt10, contractStyles.textCenter, contractStyles.bold]}>
      - 다 음 -
    </Text>
    
    <Text style={[contractStyles.preambleText, contractStyles.mt10]}>
      본 계약은 {formatContractDate(data.originalContractDate)}에 체결된 
      "{data.originalResearchTitle}
      {data.studyNumber ? `(${data.studyNumber})` : ''}"의 {data.changeReason}에 따라 
      변경계약을 체결하며, 아래와 같이 변경사항에 대해 합의한다.
    </Text>
  </View>
);

// 연구정보 미니 테이블 (변경 전/후 셀 내부용)
const ResearchInfoMini: React.FC<{
  title: string;
  amount: number;
  vatIncluded: boolean;
  startDate: Date;
  endDate: Date;
}> = ({ title, amount, vatIncluded, startDate, endDate }) => (
  <View>
    <Text style={{ fontSize: 8, marginBottom: 3 }}>
      연구과제명: {title}
    </Text>
    <Text style={{ fontSize: 8, marginBottom: 3 }}>
      연구비: 금 {numberToKorean(amount)} (₩ {amount.toLocaleString()}) {vatIncluded ? '부가세 포함' : '부가세 별도'}
    </Text>
    <Text style={{ fontSize: 8 }}>
      연구기간: {formatPeriod(startDate, endDate)}
    </Text>
  </View>
);

// 금액정보 미니 테이블 (변경 전/후 셀 내부용)
const PaymentInfoMini: React.FC<{
  payments: Array<{
    type: string;
    amount: number;
    vatIncluded: boolean;
    condition: string;
  }>;
}> = ({ payments }) => (
  <View>
    {payments.map((payment, index) => (
      <Text key={index} style={{ fontSize: 8, marginBottom: 2 }}>
        {payment.type}: 금 {numberToKorean(payment.amount)} (₩ {payment.amount.toLocaleString()}) 
        {payment.vatIncluded ? ' 부가세 포함' : ' 부가세 별도'} - {payment.condition}
      </Text>
    ))}
  </View>
);

// 변경사항 비교 테이블
const ChangeTable: React.FC<{ data: AmendmentData }> = ({ data }) => (
  <View style={contractStyles.changeTable}>
    {/* 헤더 */}
    <View style={contractStyles.changeTableHeader}>
      <View style={[contractStyles.changeColItem, { backgroundColor: '#E5E5E5' }]}>
        <Text style={contractStyles.changeColHeader}>항목</Text>
      </View>
      <View style={contractStyles.changeColBefore}>
        <Text style={contractStyles.changeColHeader}>변경 전</Text>
      </View>
      <View style={contractStyles.changeColAfter}>
        <Text style={contractStyles.changeColHeader}>변경 후</Text>
      </View>
    </View>

    {/* 연구정보 변경 (제2조) */}
    {data.researchInfo && (
      <View style={contractStyles.changeTableRow}>
        <View style={contractStyles.changeColItem}>
          <Text>제2조</Text>
          <Text style={{ fontSize: 7 }}>(연구의 내용 및 범위)</Text>
        </View>
        <View style={contractStyles.changeColBefore}>
          <ResearchInfoMini {...data.researchInfo.before} />
        </View>
        <View style={contractStyles.changeColAfter}>
          <ResearchInfoMini {...data.researchInfo.after} />
        </View>
      </View>
    )}

    {/* 금액정보 변경 (제4조) */}
    {data.paymentInfo && (
      <View style={contractStyles.changeTableRow}>
        <View style={contractStyles.changeColItem}>
          <Text>제4조</Text>
          <Text style={{ fontSize: 7 }}>(연구용역비)</Text>
        </View>
        <View style={contractStyles.changeColBefore}>
          <PaymentInfoMini payments={data.paymentInfo.before.payments} />
        </View>
        <View style={contractStyles.changeColAfter}>
          <PaymentInfoMini payments={data.paymentInfo.after.payments} />
        </View>
      </View>
    )}

    {/* 기타 변경사항 */}
    {data.changes.map((change, index) => (
      <View 
        key={index} 
        style={index === data.changes.length - 1 && !data.researchInfo && !data.paymentInfo 
          ? contractStyles.changeTableRowLast 
          : contractStyles.changeTableRow}
      >
        <View style={contractStyles.changeColItem}>
          <Text>{change.article}</Text>
          <Text style={{ fontSize: 7 }}>({change.articleTitle})</Text>
        </View>
        <View style={contractStyles.changeColBefore}>
          <Text style={{ fontSize: 8 }}>{change.beforeContent}</Text>
        </View>
        <View style={contractStyles.changeColAfter}>
          <Text style={{ fontSize: 8 }}>{change.afterContent}</Text>
        </View>
      </View>
    ))}

    {/* 변경 내용 요약 */}
    <View style={contractStyles.changeTableRowLast}>
      <View style={contractStyles.changeColItem}>
        <Text>변경 내용</Text>
      </View>
      <View style={[contractStyles.changeColBefore, contractStyles.changeColAfter, { width: '85%' }]}>
        <Text style={{ fontSize: 9 }}>1) {data.changeReason}</Text>
      </View>
    </View>
  </View>
);

// 은행 정보 및 기타 조항
const AdditionalTerms: React.FC<{ data: AmendmentData }> = ({ data }) => (
  <View style={contractStyles.article}>
    <Text style={contractStyles.articleContent}>
      "갑"은 "을"에게 부가세를 포함한 연구용역비를 세금계산서 발행일로부터 30일 이내 
      {data.bankName} (계좌번호 : {data.accountNumber}, 예금주 : {data.accountHolder})으로 
      입금하도록 한다.
    </Text>
    
    <Text style={[contractStyles.articleContent, contractStyles.mt20]}>
      2. 위 변경사항을 제외한 모든 계약조항은 기 체결된 계약의 내용과 동일하며, 
      그 효력은 연구종료일까지 유효하다.
    </Text>
    
    <Text style={[contractStyles.articleContent, contractStyles.mt20]}>
      본 계약의 체결 사실 및 그 내용을 증명하기 위하여 본 계약을 2부 작성하고 
      각 당사자의 대표자가 날인하여 각각 보관하기로 한다.
    </Text>
  </View>
);

// 서명란
const SignatureSection: React.FC<{ data: AmendmentData }> = ({ data }) => (
  <View style={contractStyles.signatureSection}>
    <Text style={contractStyles.signatureDate}>
      {formatContractDate(data.amendmentDate)}
    </Text>
    
    <View style={contractStyles.signatureContainer}>
      {/* 갑 서명란 */}
      <View style={contractStyles.signatureBox}>
        <Text style={contractStyles.signatureLabel}>"갑"</Text>
        <Text style={contractStyles.signatureInfo}>{data.partyA.name}</Text>
        <Text style={contractStyles.signatureInfo}>{data.partyA.address}</Text>
        <View style={contractStyles.signatureLine}>
          <Text style={contractStyles.signatureText}>
            {data.partyA.position || '대표자'} : {data.partyA.representative}
          </Text>
          {data.signatureA ? (
            <Image src={data.signatureA} style={contractStyles.eSignatureImage} />
          ) : (
            <View style={contractStyles.signatureStamp}>
              <Text style={contractStyles.signatureStampText}>(인)</Text>
            </View>
          )}
        </View>
      </View>

      {/* 을 서명란 */}
      <View style={contractStyles.signatureBox}>
        <Text style={contractStyles.signatureLabel}>"을"</Text>
        <Text style={contractStyles.signatureInfo}>{data.partyB.name}</Text>
        <Text style={contractStyles.signatureInfo}>{data.partyB.address}</Text>
        <View style={contractStyles.signatureLine}>
          <Text style={contractStyles.signatureText}>
            {data.partyB.position || '대표이사'} : {data.partyB.representative}
          </Text>
          {data.signatureB ? (
            <Image src={data.signatureB} style={contractStyles.eSignatureImage} />
          ) : (
            <View style={contractStyles.signatureStamp}>
              <Text style={contractStyles.signatureStampText}>(인)</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  </View>
);

// 첨부 섹션
const AttachmentSection: React.FC<{ attachments?: string[] }> = ({ attachments }) => {
  if (!attachments || attachments.length === 0) return null;
  
  return (
    <View style={contractStyles.attachmentSection}>
      <Text style={contractStyles.attachmentTitle}>#첨부</Text>
      {attachments.map((attachment, index) => (
        <Text key={index} style={contractStyles.attachmentItem}>
          {index + 1}. {attachment}
        </Text>
      ))}
      <Text style={[contractStyles.attachmentItem, { marginTop: 5 }]}>끝.</Text>
    </View>
  );
};

// ==================== 메인 컴포넌트 ====================

const ContractAmendmentPDF: React.FC<{ data: AmendmentData }> = ({ data }) => {
  return (
    <Document>
      <Page size="A4" style={contractStyles.page}>
        {/* 로고 (선택) */}
        {data.logo && (
          <View style={contractStyles.logoSection}>
            <Image src={data.logo} style={contractStyles.logo} />
          </View>
        )}

        <TitleSection />
        <Preamble data={data} />

        {/* 1. 변경사항 */}
        <View style={contractStyles.article}>
          <Text style={contractStyles.articleTitle}>1. 변경사항</Text>
          <ChangeTable data={data} />
        </View>

        {/* 추가 조항 및 은행 정보 */}
        <AdditionalTerms data={data} />

        {/* 첨부 */}
        <AttachmentSection attachments={data.attachments} />

        {/* 서명란 */}
        <SignatureSection data={data} />

        <View style={contractStyles.footer}>
          <Text>{data.partyB.name} | 변경계약서</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ContractAmendmentPDF;
