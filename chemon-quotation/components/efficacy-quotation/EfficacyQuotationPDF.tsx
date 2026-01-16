'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { SelectedEfficacyItem } from '@/types/efficacy';

/**
 * EfficacyQuotationPDF Component
 * PDF generation for efficacy quotations using @react-pdf/renderer
 * Requirements: 6.2
 */

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  // Header
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  // Quotation Info
  quotationInfo: {
    marginBottom: 15,
    fontSize: 9,
  },
  quotationInfoRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  quotationInfoLabel: {
    color: '#6b7280',
    width: 60,
  },
  quotationInfoValue: {
    fontWeight: 'bold',
  },
  // Info Section
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  infoBox: {
    width: '48%',
    padding: 10,
    border: '1px solid #e5e7eb',
    borderRadius: 4,
  },
  infoTitle: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 10,
    marginBottom: 2,
  },
  infoBold: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  // Model Info
  modelBox: {
    padding: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 4,
    marginBottom: 15,
  },
  modelTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  modelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  modelItem: {
    width: '50%',
    marginBottom: 4,
  },
  modelLabel: {
    fontSize: 8,
    color: '#6b7280',
  },
  modelValue: {
    fontSize: 10,
  },
  // Category Section
  categorySection: {
    marginBottom: 10,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f3f4f6',
    padding: 6,
    borderRadius: 2,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  categoryTotal: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Table
  table: {
    marginBottom: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #f3f4f6',
    paddingVertical: 3,
  },
  // Table Columns
  colName: {
    width: '40%',
    fontSize: 9,
  },
  colPrice: {
    width: '15%',
    fontSize: 9,
    textAlign: 'right',
  },
  colQty: {
    width: '10%',
    fontSize: 9,
    textAlign: 'center',
  },
  colMult: {
    width: '10%',
    fontSize: 9,
    textAlign: 'center',
  },
  colAmount: {
    width: '25%',
    fontSize: 9,
    textAlign: 'right',
  },
  colHeaderText: {
    fontSize: 8,
    color: '#6b7280',
  },
  defaultBadge: {
    fontSize: 7,
    color: '#15803d',
    marginLeft: 4,
  },
  // Totals
  totalsSection: {
    marginTop: 15,
    paddingTop: 10,
    borderTop: '1px solid #e5e7eb',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 10,
  },
  totalValue: {
    fontSize: 10,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1e40af',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  // Notes
  notesSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: '#6b7280',
  },
  // Footer Notes
  footerNotes: {
    marginTop: 15,
  },
  footerNoteText: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 2,
  },
  // Company Footer
  companyFooter: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10,
    fontSize: 8,
    color: '#6b7280',
  },
});

// Format currency for PDF
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount);
}

// Format date for PDF
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

// Category order
const CATEGORY_ORDER = [
  '동물비',
  '사육비',
  '측정',
  '조직병리',
  '분석',
  '기타',
];

interface CompanyInfo {
  name: string;
  address: string;
  tel: string;
  fax?: string;
  email: string;
}

interface EfficacyQuotationPDFProps {
  quotationNumber: string;
  quotationDate: Date;
  validUntil: Date;
  customerName: string;
  projectName: string;
  modelName: string;
  modelCategory: string;
  indication: string;
  items: SelectedEfficacyItem[];
  subtotalByCategory: Record<string, number>;
  subtotal: number;
  vat: number;
  grandTotal: number;
  notes?: string;
  company: CompanyInfo;
}

const EfficacyQuotationPDF: React.FC<EfficacyQuotationPDFProps> = ({
  quotationNumber,
  quotationDate,
  validUntil,
  customerName,
  projectName,
  modelName,
  modelCategory,
  indication,
  items,
  subtotalByCategory,
  subtotal,
  vat,
  grandTotal,
  notes,
  company,
}) => {
  // Group items by category
  const groupedItems: Record<string, SelectedEfficacyItem[]> = {};
  items.forEach((item) => {
    if (!groupedItems[item.category]) {
      groupedItems[item.category] = [];
    }
    groupedItems[item.category].push(item);
  });

  // Sort categories
  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a);
    const indexB = CATEGORY_ORDER.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>CHEMON</Text>
          <Text style={styles.subtitle}>효력시험 견적서</Text>
        </View>

        {/* Quotation Info */}
        <View style={styles.quotationInfo}>
          <View style={styles.quotationInfoRow}>
            <Text style={styles.quotationInfoLabel}>견적번호:</Text>
            <Text style={styles.quotationInfoValue}>{quotationNumber}</Text>
          </View>
          <View style={styles.quotationInfoRow}>
            <Text style={styles.quotationInfoLabel}>견적일자:</Text>
            <Text>{formatDate(quotationDate)}</Text>
          </View>
          <View style={styles.quotationInfoRow}>
            <Text style={styles.quotationInfoLabel}>유효기간:</Text>
            <Text>{formatDate(validUntil)}까지</Text>
          </View>
        </View>

        {/* Recipient / Sender */}
        <View style={styles.infoSection}>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>수신</Text>
            <Text style={styles.infoBold}>{customerName}</Text>
            <Text style={styles.infoText}>프로젝트: {projectName}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>발신</Text>
            <Text style={styles.infoBold}>{company.name}</Text>
            <Text style={styles.infoText}>{company.address}</Text>
            <Text style={styles.infoText}>Tel: {company.tel}</Text>
          </View>
        </View>

        {/* Model Info */}
        <View style={styles.modelBox}>
          <Text style={styles.modelTitle}>효력시험 모델</Text>
          <View style={styles.modelGrid}>
            <View style={styles.modelItem}>
              <Text style={styles.modelLabel}>모델명</Text>
              <Text style={styles.modelValue}>{modelName}</Text>
            </View>
            <View style={styles.modelItem}>
              <Text style={styles.modelLabel}>카테고리</Text>
              <Text style={styles.modelValue}>{modelCategory}</Text>
            </View>
            <View style={{ width: '100%', marginTop: 4 }}>
              <Text style={styles.modelLabel}>적응증</Text>
              <Text style={styles.modelValue}>{indication}</Text>
            </View>
          </View>
        </View>


        {/* Items by Category */}
        {sortedCategories.map((category) => (
          <View key={category} style={styles.categorySection}>
            {/* Category Header */}
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryName}>{category}</Text>
              <Text style={styles.categoryTotal}>
                {formatCurrency(subtotalByCategory[category] || 0)}원
              </Text>
            </View>

            {/* Table */}
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.colName, styles.colHeaderText]}>항목명</Text>
                <Text style={[styles.colPrice, styles.colHeaderText]}>단가</Text>
                <Text style={[styles.colQty, styles.colHeaderText]}>수량</Text>
                <Text style={[styles.colMult, styles.colHeaderText]}>횟수</Text>
                <Text style={[styles.colAmount, styles.colHeaderText]}>금액</Text>
              </View>

              {/* Table Rows */}
              {groupedItems[category].map((item) => (
                <View key={item.id} style={styles.tableRow}>
                  <View style={styles.colName}>
                    <Text>
                      {item.item_name}
                      {item.is_default && (
                        <Text style={styles.defaultBadge}> [기본]</Text>
                      )}
                    </Text>
                  </View>
                  <Text style={styles.colPrice}>
                    {formatCurrency(item.unit_price)}
                  </Text>
                  <Text style={styles.colQty}>{item.quantity}</Text>
                  <Text style={styles.colMult}>{item.multiplier}</Text>
                  <Text style={styles.colAmount}>
                    {formatCurrency(item.amount)}원
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>소계 (VAT 별도)</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotal)}원</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: '#6b7280' }]}>
              부가가치세 (10%)
            </Text>
            <Text style={[styles.totalValue, { color: '#6b7280' }]}>
              {formatCurrency(vat)}원
            </Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>총 견적금액</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(grandTotal)}원
            </Text>
          </View>
        </View>

        {/* Notes */}
        {notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>비고</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        )}

        {/* Footer Notes */}
        <View style={styles.footerNotes}>
          <Text style={styles.footerNoteText}>
            ※ 상기 금액은 견적 유효기간 내 계약 체결 시 적용됩니다.
          </Text>
          <Text style={styles.footerNoteText}>
            ※ 시험 일정은 계약 체결 후 협의하여 확정합니다.
          </Text>
        </View>

        {/* Company Footer */}
        <View style={styles.companyFooter}>
          <Text>
            {company.name} | {company.tel} | {company.email}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default EfficacyQuotationPDF;
