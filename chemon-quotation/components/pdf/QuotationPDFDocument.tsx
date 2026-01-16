'use client';

import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { pdfStyles } from '@/lib/pdfStyles';
import {
  formatCurrencyForPDF,
  formatDateForPDF,
  calculateValidUntil,
} from '@/lib/pdfUtils';

interface QuotationItem {
  id: string;
  name: string;
  glp: string;
  amount: number;
  isOption?: boolean;
}

interface CompanyInfo {
  name: string;
  address: string;
  tel: string;
  fax?: string;
  email: string;
}

interface QuotationPDFProps {
  quotationNumber: string;
  quotationDate: Date;
  customerName: string;
  projectName: string;
  validDays: number;
  items: QuotationItem[];
  subtotalTest: number;
  subtotalAnalysis: number;
  discountRate: number;
  discountAmount: number;
  totalAmount: number;
  company: CompanyInfo;
  notes?: string;
}

const QuotationPDFDocument: React.FC<QuotationPDFProps> = ({
  quotationNumber,
  quotationDate,
  customerName,
  projectName,
  validDays,
  items,
  subtotalTest,
  subtotalAnalysis,
  discountRate,
  discountAmount,
  totalAmount,
  company,
  notes,
}) => {
  const validUntil = calculateValidUntil(quotationDate, validDays);
  let itemNumber = 0;

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* 헤더 */}
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.title}>CHEMON</Text>
          <Text style={pdfStyles.subtitle}>견 적 서</Text>
        </View>

        {/* 견적 정보 */}
        <View style={pdfStyles.quotationInfo}>
          <Text>견적번호: {quotationNumber}</Text>
          <Text>견적일자: {formatDateForPDF(quotationDate)}</Text>
          <Text>유효기간: {formatDateForPDF(validUntil)}까지</Text>
        </View>

        {/* 수신/발신 */}
        <View style={pdfStyles.infoSection}>
          <View style={pdfStyles.infoBox}>
            <Text style={pdfStyles.infoTitle}>수신</Text>
            <Text style={pdfStyles.infoBold}>{customerName}</Text>
            <Text style={pdfStyles.infoText}>프로젝트: {projectName}</Text>
          </View>
          <View style={pdfStyles.infoBox}>
            <Text style={pdfStyles.infoTitle}>발신</Text>
            <Text style={pdfStyles.infoBold}>{company.name}</Text>
            <Text style={pdfStyles.infoText}>{company.address}</Text>
            <Text style={pdfStyles.infoText}>Tel: {company.tel}</Text>
            {company.fax && (
              <Text style={pdfStyles.infoText}>Fax: {company.fax}</Text>
            )}
          </View>
        </View>

        {/* 테이블 */}
        <View style={pdfStyles.table}>
          {/* 헤더 */}
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.colNo, { fontWeight: 'bold' }]}>No</Text>
            <Text style={[pdfStyles.colName, { fontWeight: 'bold' }]}>
              시험항목
            </Text>
            <Text style={[pdfStyles.colSpec, { fontWeight: 'bold' }]}>규격</Text>
            <Text style={[pdfStyles.colAmount, { fontWeight: 'bold' }]}>
              금액(원)
            </Text>
          </View>

          {/* 시험 항목 */}
          {items.map((item, index) => {
            if (!item.isOption) itemNumber++;
            return (
              <View
                key={item.id}
                style={
                  index % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowAlt
                }
              >
                <Text style={pdfStyles.colNo}>
                  {item.isOption ? '' : String(itemNumber)}
                </Text>
                <Text style={pdfStyles.colName}>
                  {item.isOption ? '  └ ' : ''}
                  {item.name.length > 40
                    ? item.name.slice(0, 40) + '...'
                    : item.name}
                </Text>
                <Text style={pdfStyles.colSpec}>{item.glp}</Text>
                <Text style={pdfStyles.colAmount}>
                  {formatCurrencyForPDF(item.amount)}
                </Text>
              </View>
            );
          })}

          {/* 조제물분석 (금액이 있는 경우만) */}
          {subtotalAnalysis > 0 && (
            <View style={pdfStyles.tableRow}>
              <Text style={pdfStyles.colNo}></Text>
              <Text style={pdfStyles.colName}>조제물분석</Text>
              <Text style={pdfStyles.colSpec}>-</Text>
              <Text style={pdfStyles.colAmount}>
                {formatCurrencyForPDF(subtotalAnalysis)}
              </Text>
            </View>
          )}

          {/* 소계 */}
          <View style={pdfStyles.totalRow}>
            <Text style={pdfStyles.totalLabel}>소계</Text>
            <Text style={pdfStyles.totalAmount}>
              {formatCurrencyForPDF(subtotalTest + subtotalAnalysis)}
            </Text>
          </View>

          {/* 할인 */}
          {discountRate > 0 && (
            <View style={pdfStyles.discountRow}>
              <Text style={[pdfStyles.totalLabel, pdfStyles.discountText]}>
                할인 ({discountRate}%)
              </Text>
              <Text style={[pdfStyles.totalAmount, pdfStyles.discountText]}>
                -{formatCurrencyForPDF(discountAmount)}
              </Text>
            </View>
          )}

          {/* 합계 */}
          <View style={pdfStyles.finalRow}>
            <Text style={[pdfStyles.totalLabel, pdfStyles.finalText]}>합계</Text>
            <Text style={[pdfStyles.totalAmount, pdfStyles.finalText]}>
              {formatCurrencyForPDF(totalAmount)}
            </Text>
          </View>
        </View>

        {/* 주석 */}
        <View style={pdfStyles.notes}>
          <Text style={pdfStyles.noteText}>※ 부가가치세 별도</Text>
          <Text style={pdfStyles.noteText}>
            ※ 상기 금액은 견적 유효기간 내 계약 체결 시 적용됩니다.
          </Text>
          <Text style={pdfStyles.noteText}>
            ※ 시험 일정은 계약 체결 후 협의하여 확정합니다.
          </Text>
          {notes && <Text style={pdfStyles.noteText}>※ {notes}</Text>}
        </View>

        {/* 푸터 */}
        <View style={pdfStyles.footer}>
          <Text>
            {company.name} | {company.tel} | {company.email}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default QuotationPDFDocument;
