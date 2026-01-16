import { StyleSheet } from '@react-pdf/renderer';

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  // 헤더
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
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  // 정보 섹션
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoBox: {
    width: '48%',
    padding: 10,
    border: '1px solid #e5e7eb',
    borderRadius: 4,
  },
  infoTitle: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 11,
  },
  infoBold: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  // 견적 정보
  quotationInfo: {
    marginBottom: 15,
    fontSize: 9,
  },
  // 테이블
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottom: '1px solid #e5e7eb',
    padding: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
    padding: 8,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
    padding: 8,
    backgroundColor: '#fafafa',
  },
  // 테이블 컬럼
  colNo: {
    width: '8%',
    textAlign: 'center',
  },
  colName: {
    width: '50%',
  },
  colSpec: {
    width: '12%',
    textAlign: 'center',
  },
  colAmount: {
    width: '30%',
    textAlign: 'right',
  },
  // 합계 행
  totalRow: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#eff6ff',
    marginTop: 4,
  },
  totalLabel: {
    width: '70%',
    textAlign: 'right',
    fontWeight: 'bold',
  },
  totalAmount: {
    width: '30%',
    textAlign: 'right',
    fontWeight: 'bold',
    color: '#1e40af',
  },
  // 할인 행
  discountRow: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fef2f2',
  },
  discountText: {
    color: '#dc2626',
  },
  // 최종 합계
  finalRow: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#1e40af',
  },
  finalText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // 주석
  notes: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  noteText: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  // 푸터
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10,
    fontSize: 9,
    color: '#6b7280',
  },
});
