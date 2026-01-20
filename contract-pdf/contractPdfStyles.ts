// src/lib/contractPdfStyles.ts
// 계약서/변경계약서 PDF 전용 스타일

import { StyleSheet, Font } from '@react-pdf/renderer';

// 폰트 등록 (Noto Sans KR - 나중에 휴먼옛체로 교체 가능)
// 참고: 실제 사용 시 public/fonts/ 폴더에 폰트 파일 필요
Font.register({
  family: 'NotoSansKR',
  fonts: [
    { src: '/fonts/NotoSansKR-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/NotoSansKR-Bold.ttf', fontWeight: 'bold' },
  ],
});

// 휴먼옛체 등록 (파일이 있는 경우 주석 해제)
// Font.register({
//   family: 'HumanYetche',
//   src: '/fonts/HumanYetche.ttf',
// });

// 기본 색상
const colors = {
  black: '#000000',
  darkGray: '#333333',
  gray: '#666666',
  lightGray: '#E5E5E5',
  white: '#FFFFFF',
  primary: '#1a365d', // CHEMON 브랜드 컬러
};

// 계약서 PDF 스타일
export const contractStyles = StyleSheet.create({
  // ==================== 페이지 ====================
  page: {
    padding: 50,
    fontFamily: 'NotoSansKR',
    fontSize: 10,
    lineHeight: 1.6,
    color: colors.black,
  },

  // ==================== 제목 ====================
  titleSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 8,
    marginBottom: 8,
    // fontFamily: 'HumanYetche', // 휴먼옛체 사용 시
  },
  mainTitleUnderline: {
    width: 270,
    height: 2,
    backgroundColor: colors.black,
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 12,
    color: colors.gray,
  },

  // ==================== 변경계약서 제목 ====================
  amendmentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },

  // ==================== 전문 (서문) ====================
  preamble: {
    marginBottom: 20,
    textAlign: 'justify',
  },
  preambleText: {
    fontSize: 10,
    lineHeight: 1.8,
  },

  // ==================== 조항 ====================
  article: {
    marginBottom: 15,
  },
  articleTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  articleContent: {
    fontSize: 10,
    lineHeight: 1.7,
    textAlign: 'justify',
    paddingLeft: 10,
  },
  articleSubItem: {
    fontSize: 10,
    lineHeight: 1.7,
    paddingLeft: 20,
    marginTop: 3,
  },

  // ==================== 연구 정보 테이블 (제2조) ====================
  researchInfoTable: {
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.black,
  },
  researchInfoRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.black,
  },
  researchInfoRowLast: {
    flexDirection: 'row',
  },
  researchInfoLabel: {
    width: '25%',
    padding: 8,
    backgroundColor: colors.lightGray,
    borderRightWidth: 1,
    borderRightColor: colors.black,
    fontWeight: 'bold',
    fontSize: 10,
  },
  researchInfoValue: {
    width: '75%',
    padding: 8,
    fontSize: 10,
  },

  // ==================== 금액 테이블 (제4조) ====================
  paymentTable: {
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.black,
  },
  paymentTableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.lightGray,
    borderBottomWidth: 1,
    borderBottomColor: colors.black,
  },
  paymentTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.black,
  },
  paymentTableRowLast: {
    flexDirection: 'row',
  },
  paymentColType: {
    width: '15%',
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: colors.black,
    textAlign: 'center',
    fontSize: 10,
  },
  paymentColAmount: {
    width: '40%',
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: colors.black,
    fontSize: 10,
  },
  paymentColVat: {
    width: '15%',
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: colors.black,
    textAlign: 'center',
    fontSize: 10,
  },
  paymentColCondition: {
    width: '30%',
    padding: 8,
    fontSize: 10,
  },

  // ==================== 변경계약서 비교 테이블 ====================
  changeTable: {
    marginTop: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.black,
  },
  changeTableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.lightGray,
    borderBottomWidth: 1,
    borderBottomColor: colors.black,
  },
  changeTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.black,
    minHeight: 60,
  },
  changeTableRowLast: {
    flexDirection: 'row',
    minHeight: 40,
  },
  changeColItem: {
    width: '15%',
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: colors.black,
    fontWeight: 'bold',
    fontSize: 9,
    backgroundColor: colors.lightGray,
  },
  changeColBefore: {
    width: '42.5%',
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: colors.black,
    fontSize: 9,
  },
  changeColAfter: {
    width: '42.5%',
    padding: 8,
    fontSize: 9,
  },
  changeColHeader: {
    padding: 8,
    fontWeight: 'bold',
    fontSize: 10,
    textAlign: 'center',
  },

  // ==================== 서명란 ====================
  signatureSection: {
    marginTop: 40,
  },
  signatureDate: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 30,
  },
  signatureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  signatureBox: {
    width: '45%',
    borderWidth: 1,
    borderColor: colors.black,
    padding: 15,
  },
  signatureLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  signatureInfo: {
    fontSize: 10,
    marginBottom: 5,
    lineHeight: 1.5,
  },
  signatureLine: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  signatureText: {
    fontSize: 11,
  },
  signatureStamp: {
    width: 40,
    height: 40,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signatureStampText: {
    fontSize: 8,
    color: colors.gray,
  },

  // ==================== 전자서명 영역 ====================
  eSignatureBox: {
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  eSignatureImage: {
    width: 100,
    height: 50,
  },
  eSignaturePlaceholder: {
    fontSize: 9,
    color: colors.gray,
  },

  // ==================== 로고 영역 ====================
  logoSection: {
    position: 'absolute',
    top: 30,
    right: 50,
  },
  logo: {
    width: 80,
    height: 30,
  },

  // ==================== 첨부 ====================
  attachmentSection: {
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  attachmentTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  attachmentItem: {
    fontSize: 10,
    marginBottom: 5,
    paddingLeft: 10,
  },

  // ==================== 푸터 ====================
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 8,
    color: colors.gray,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: 10,
  },

  // ==================== 유틸리티 ====================
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  underline: {
    textDecoration: 'underline',
  },
  textCenter: {
    textAlign: 'center',
  },
  textRight: {
    textAlign: 'right',
  },
  mt10: {
    marginTop: 10,
  },
  mt20: {
    marginTop: 20,
  },
  mb10: {
    marginBottom: 10,
  },
  mb20: {
    marginBottom: 20,
  },

  // ==================== 페이지 나눔 ====================
  pageBreak: {
    marginTop: 50,
  },
});

// 금액을 한글로 변환
export const numberToKorean = (num: number): string => {
  const units = ['', '만', '억', '조'];
  const smallUnits = ['', '십', '백', '천'];
  const digits = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];

  if (num === 0) return '영';

  let result = '';
  let unitIndex = 0;

  while (num > 0) {
    const chunk = num % 10000;
    if (chunk > 0) {
      let chunkStr = '';
      let tempChunk = chunk;
      let smallUnitIndex = 0;

      while (tempChunk > 0) {
        const digit = tempChunk % 10;
        if (digit > 0) {
          const digitStr = smallUnitIndex === 0 || digit > 1 ? digits[digit] : '';
          chunkStr = digitStr + smallUnits[smallUnitIndex] + chunkStr;
        }
        tempChunk = Math.floor(tempChunk / 10);
        smallUnitIndex++;
      }
      result = chunkStr + units[unitIndex] + result;
    }
    num = Math.floor(num / 10000);
    unitIndex++;
  }

  return result + '원정';
};

// 날짜 포맷팅
export const formatContractDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}년 ${month}월 ${day}일`;
};

// 기간 포맷팅
export const formatPeriod = (startDate: Date, endDate: Date): string => {
  const formatDate = (d: Date) => {
    return `${d.getFullYear()}년 ${String(d.getMonth() + 1).padStart(2, '0')}월 ${String(d.getDate()).padStart(2, '0')}일`;
  };
  return `${formatDate(startDate)}부터 ${formatDate(endDate)}까지`;
};
