import type { DocumentItem } from '@/types/toxicity-v2';

/**
 * DOC_SEND 배열: SEND 문서작업 모드 시험 데이터 15개 항목
 * 소스: quotation-v2.jsx의 DOC_SEND 배열
 */
export const DOC_SEND_DATA: DocumentItem[] = [
  { id: 1, num: 1, name: '설치류 단회 SEND', formalName: '설치류 단회 독성시험 SEND', category: '반복/단회독성', price: 8000000, weeks: '2-3', guideline: ['CDISC SEND', '', '', ''] },
  { id: 2, num: 2, name: '설치류 DRF SEND', formalName: '설치류 DRF 독성시험 SEND', category: '반복/단회독성', price: 11000000, weeks: '2-3', guideline: ['CDISC SEND', '', '', ''] },
  { id: 3, num: 3, name: '설치류 4주 반복 SEND', formalName: '설치류 4주 반복 독성시험 SEND', category: '반복/단회독성', price: 20000000, weeks: '2-3', guideline: ['CDISC SEND', '', '', ''], note: '회복군/TK 별도' },
  { id: 4, num: 4, name: '설치류 26주 반복 SEND', formalName: '설치류 26주 반복 독성시험 SEND', category: '반복/단회독성', price: 35000000, weeks: '2-3', guideline: ['CDISC SEND', '', '', ''], note: '회복군/TK 별도' },
  { id: 5, num: 5, name: '비설치류 4주 반복 SEND', formalName: '비설치류 4주 반복 독성시험 SEND', category: '반복/단회독성', price: 20000000, weeks: '2-3', guideline: ['CDISC SEND', '', '', ''], note: '회복군/TK 별도' },
  { id: 6, num: 6, name: '비설치류 13주 반복 SEND', formalName: '비설치류 13주 반복 독성시험 SEND', category: '반복/단회독성', price: 25000000, weeks: '2-3', guideline: ['CDISC SEND', '', '', ''], note: '회복군/TK 별도' },
  { id: 7, num: 7, name: '비설치류 26주 반복 SEND', formalName: '비설치류 26주 반복 독성시험 SEND', category: '반복/단회독성', price: 35000000, weeks: '2-3', guideline: ['CDISC SEND', '', '', ''], note: '회복군/TK 별도' },
  { id: 8, num: 8, name: '4주 회복 SEND', formalName: '4주 회복시험 SEND', category: '반복/단회독성', price: 5000000, weeks: '2-3', guideline: ['CDISC SEND', '', '', ''] },
  { id: 9, num: 9, name: 'TK SEND', formalName: 'TK 시험 SEND', category: '반복/단회독성', price: 5000000, weeks: '2-3', guideline: ['CDISC SEND', '', '', ''] },
  { id: 10, num: 10, name: 'Telemetry SEND', formalName: 'Telemetry SEND', category: '안전성약리', price: 12000000, weeks: '2-3', guideline: ['CDISC SEND', '', '', ''] },
  { id: 11, num: 11, name: '호흡기계 SEND', formalName: '호흡기계에 미치는 영향시험 SEND', category: '안전성약리', price: 12000000, weeks: '-', guideline: ['CDISC SEND', '', '', ''] },
  { id: 12, num: 12, name: '소핵시험 SEND', formalName: '소핵시험 SEND', category: '유전독성', price: 12000000, weeks: '2-3', guideline: ['CDISC SEND', '', '', ''] },
  { id: 13, num: 13, name: 'Comet assay SEND', formalName: 'Comet assay SEND', category: '유전독성', price: 12000000, weeks: '2-3', guideline: ['CDISC SEND', '', '', ''] },
  { id: 14, num: 14, name: '배태자(랫드) SEND', formalName: '배태자발생시험(랫드) SEND', category: '생식독성', price: 35000000, weeks: '2-3', guideline: ['CDISC SEND', '', '', ''], note: 'TK 별도' },
  { id: 15, num: 15, name: '배태자(토끼) SEND', formalName: '배태자발생시험(토끼) SEND', category: '생식독성', price: 35000000, weeks: '2-3', guideline: ['CDISC SEND', '', '', ''], note: 'TK 별도' },
];

/**
 * DOC_CTD 배열: CTD Module 2.6 문서작업 모드 시험 데이터 31개 항목
 * 소스: quotation-v2.jsx의 DOC_CTD 배열
 */
export const DOC_CTD_DATA: DocumentItem[] = [
  { id: 1, num: 1, name: '설치류 단회 CTD', formalName: '설치류 단회 독성시험 CTD 작성', category: '반복/단회독성', price: 300000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''] },
  { id: 2, num: 2, name: '설치류 DRF CTD', formalName: '설치류 DRF 독성시험 CTD 작성', category: '반복/단회독성', price: 300000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''] },
  { id: 3, num: 3, name: '설치류 4/13주 반복 CTD', formalName: '설치류 4,13주 반복 독성시험 CTD 작성', category: '반복/단회독성', price: 1000000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''], note: '회복군/TK 별도' },
  { id: 4, num: 4, name: '설치류 26주 반복 CTD', formalName: '설치류 26주 반복 독성시험 CTD 작성', category: '반복/단회독성', price: 1000000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''], note: '회복군/TK 별도' },
  { id: 5, num: 5, name: '비설치류 단회 CTD', formalName: '비설치류 단회 독성시험 CTD 작성', category: '반복/단회독성', price: 300000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''] },
  { id: 6, num: 6, name: '비설치류 DRF CTD', formalName: '비설치류 DRF 독성시험 CTD 작성', category: '반복/단회독성', price: 300000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''] },
  { id: 7, num: 7, name: '비설치류 4/13주 반복 CTD', formalName: '비설치류 4,13주 반복 독성시험 CTD 작성', category: '반복/단회독성', price: 1000000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''], note: '회복군/TK 별도' },
  { id: 8, num: 8, name: '비설치류 26/39주 반복 CTD', formalName: '비설치류 26,39주 반복 독성시험 CTD 작성', category: '반복/단회독성', price: 1000000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''], note: '회복군/TK 별도' },
  { id: 9, num: 9, name: '회복군 추가 CTD', formalName: '회복군 추가 CTD 작성', category: '반복/단회독성', price: 300000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''] },
  { id: 10, num: 10, name: 'PK/TK Valid CTD', formalName: 'PK/TK Validation CTD 작성', category: 'PK/TK', price: 300000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''] },
  { id: 11, num: 11, name: 'PK/TK 분석 CTD', formalName: 'PK/TK 분석 보고서 CTD 작성', category: 'PK/TK', price: 300000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''] },
  { id: 12, num: 12, name: '복귀돌연변이 CTD', formalName: '유전독성: 복귀돌연변이 CTD 작성', category: '유전독성', price: 300000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''] },
  { id: 13, num: 13, name: '염색체이상 CTD', formalName: '유전독성: 염색체이상 CTD 작성', category: '유전독성', price: 300000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''] },
  { id: 14, num: 14, name: '소핵시험 CTD', formalName: '유전독성: 소핵시험 CTD 작성', category: '유전독성', price: 300000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''] },
  { id: 15, num: 15, name: '중추신경계 CTD', formalName: '중추신경계 CTD 작성', category: '안전성약리', price: 300000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''] },
  { id: 16, num: 16, name: '호흡기계 CTD', formalName: '호흡기계 CTD 작성', category: '안전성약리', price: 300000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''] },
  { id: 17, num: 17, name: 'hERG CTD', formalName: 'hERG assay CTD 작성', category: '안전성약리', price: 300000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''] },
  { id: 18, num: 18, name: 'Telemetry CTD', formalName: 'Telemetry CTD 작성', category: '안전성약리', price: 300000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''] },
  { id: 19, num: 19, name: '수태능 CTD', formalName: '수태능 및 초기배 발생시험 CTD 작성', category: '생식독성', price: 1000000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''], note: '회복군/TK 별도' },
  { id: 20, num: 20, name: '배태자(Rat) CTD', formalName: '배태자 발생시험(Rat) CTD 작성', category: '생식독성', price: 1000000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''] },
  { id: 21, num: 21, name: '배태자(Rabbit) CTD', formalName: '배태자 발생시험(Rabbit) CTD 작성', category: '생식독성', price: 1000000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''] },
  { id: 22, num: 22, name: '출생전후 CTD', formalName: '출생전후 발생 및 모체기능 CTD 작성', category: '생식독성', price: 1000000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''] },
  { id: 23, num: 23, name: '아나필락시스 쇼크 CTD', formalName: '항원성: 아나필락시스 쇼크반응 CTD 작성', category: '항원성/국소독성', price: 300000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''] },
  { id: 24, num: 24, name: '수동피부 CTD', formalName: '항원성: 수동피부 아나필락시스 CTD 작성', category: '항원성/국소독성', price: 300000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''] },
  { id: 25, num: 25, name: '피부감작성 CTD', formalName: '항원성: 피부감작성 시험 CTD 작성', category: '항원성/국소독성', price: 300000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''] },
  { id: 26, num: 26, name: '피부자극 CTD', formalName: '국소독성: 피부자극시험 CTD 작성', category: '항원성/국소독성', price: 300000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''] },
  { id: 27, num: 27, name: '안점막자극 CTD', formalName: '국소독성: 안점막자극시험 CTD 작성', category: '항원성/국소독성', price: 300000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''] },
  { id: 28, num: 28, name: '광독성 CTD', formalName: '국소독성: 광독성시험 CTD 작성', category: '항원성/국소독성', price: 300000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''] },
  { id: 29, num: 29, name: '광감작성 CTD', formalName: '국소독성: 광감작성시험 CTD 작성', category: '항원성/국소독성', price: 300000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''] },
  { id: 30, num: 30, name: '조제물분석 CTD', formalName: '투여물질의 조제물 분석 CTD 작성', category: '기타', price: 300000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''] },
  { id: 31, num: 31, name: '발암성 CTD', formalName: '발암성 시험 CTD 작성', category: '기타', price: 300000, weeks: '6-8', guideline: ['CTD Module 2.6', '', '', ''] },
];

/**
 * DOC_TRANS 배열: 번역 문서작업 모드 시험 데이터 34개 항목
 * 소스: quotation-v2.jsx의 DOC_TRANS 배열
 */
export const DOC_TRANS_DATA: DocumentItem[] = [
  { id: 1, num: 1, name: '설치류 단회 번역', formalName: '설치류 단회 독성시험 영문보고서', category: '반복/단회독성', price: 1000000, weeks: '6-8', guideline: ['', '', '', ''], note: '요약: 70만' },
  { id: 2, num: 2, name: '설치류 DRF 번역', formalName: '설치류 DRF 독성시험 영문보고서', category: '반복/단회독성', price: 1000000, weeks: '6-8', guideline: ['', '', '', ''], note: '요약: 70만' },
  { id: 3, num: 3, name: '설치류 4/13주 번역', formalName: '설치류 4,13주 반복 독성시험 영문보고서', category: '반복/단회독성', price: 2500000, weeks: '6-8', guideline: ['', '', '', ''], note: '회복군/TK 별도' },
  { id: 4, num: 4, name: '설치류 26주 번역', formalName: '설치류 26주 반복 독성시험 영문보고서', category: '반복/단회독성', price: 2500000, weeks: '6-8', guideline: ['', '', '', ''], note: '회복군/TK 별도' },
  { id: 5, num: 5, name: '비설치류 단회 번역', formalName: '비설치류 단회 독성시험 영문보고서', category: '반복/단회독성', price: 1000000, weeks: '6-8', guideline: ['', '', '', ''] },
  { id: 6, num: 6, name: '비설치류 DRF 번역', formalName: '비설치류 DRF 독성시험 영문보고서', category: '반복/단회독성', price: 1000000, weeks: '6-8', guideline: ['', '', '', ''] },
  { id: 7, num: 7, name: '비설치류 4/13주 번역', formalName: '비설치류 4,13주 반복 독성시험 영문보고서', category: '반복/단회독성', price: 2500000, weeks: '6-8', guideline: ['', '', '', ''], note: '회복군/TK 별도' },
  { id: 8, num: 8, name: '비설치류 26/39주 번역', formalName: '비설치류 26,39주 반복 독성시험 영문보고서', category: '반복/단회독성', price: 2500000, weeks: '6-8', guideline: ['', '', '', ''], note: '회복군/TK 별도' },
  { id: 9, num: 9, name: '회복군 추가 번역', formalName: '회복군 추가 영문보고서', category: '반복/단회독성', price: 500000, weeks: '6-8', guideline: ['', '', '', ''] },
  { id: 10, num: 10, name: 'PK/TK Valid 번역', formalName: 'PK/TK Validation 영문보고서', category: 'PK/TK', price: 1000000, weeks: '6-8', guideline: ['', '', '', ''] },
  { id: 11, num: 11, name: 'PK/TK 분석 번역', formalName: 'PK/TK 분석 보고서 영문보고서', category: 'PK/TK', price: 1000000, weeks: '6-8', guideline: ['', '', '', ''] },
  { id: 12, num: 12, name: '복귀돌연변이 번역', formalName: '유전독성: 복귀돌연변이 영문보고서', category: '유전독성', price: 1000000, weeks: '6-8', guideline: ['', '', '', ''] },
  { id: 13, num: 13, name: '염색체이상 번역', formalName: '유전독성: 염색체이상 영문보고서', category: '유전독성', price: 1000000, weeks: '6-8', guideline: ['', '', '', ''] },
  { id: 14, num: 14, name: '소핵시험 번역', formalName: '유전독성: 소핵시험 영문보고서', category: '유전독성', price: 1000000, weeks: '6-8', guideline: ['', '', '', ''] },
  { id: 15, num: 15, name: '일반약리 번역', formalName: '약리시험: 일반약리 영문보고서', category: '안전성약리', price: 2000000, weeks: '6-8', guideline: ['', '', '', ''] },
  { id: 16, num: 16, name: '중추신경계 번역', formalName: '중추신경계 영문보고서', category: '안전성약리', price: 1000000, weeks: '6-8', guideline: ['', '', '', ''] },
  { id: 17, num: 17, name: '호흡기계 번역', formalName: '호흡기계 영문보고서', category: '안전성약리', price: 1000000, weeks: '6-8', guideline: ['', '', '', ''] },
  { id: 18, num: 18, name: 'hERG 번역', formalName: 'hERG assay 영문보고서', category: '안전성약리', price: 1000000, weeks: '6-8', guideline: ['', '', '', ''] },
  { id: 19, num: 19, name: 'Telemetry 번역', formalName: 'Telemetry 영문보고서', category: '안전성약리', price: 1000000, weeks: '6-8', guideline: ['', '', '', ''] },
  { id: 20, num: 20, name: '수태능 번역', formalName: '수태능 및 초기배 발생시험 영문보고서', category: '생식독성', price: 2500000, weeks: '6-8', guideline: ['', '', '', ''] },
  { id: 21, num: 21, name: '배태자(Rat) 번역', formalName: '배태자 발생시험(Rat) 영문보고서', category: '생식독성', price: 2500000, weeks: '6-8', guideline: ['', '', '', ''] },
  { id: 22, num: 22, name: '배태자(Rabbit) 번역', formalName: '배태자 발생시험(Rabbit) 영문보고서', category: '생식독성', price: 2500000, weeks: '6-8', guideline: ['', '', '', ''] },
  { id: 23, num: 23, name: '출생전후 번역', formalName: '출생전후 발생 및 모체기능 영문보고서', category: '생식독성', price: 2500000, weeks: '6-8', guideline: ['', '', '', ''] },
  { id: 24, num: 24, name: '조합시험 번역', formalName: '생식독성: 조합시험 영문보고서', category: '생식독성', price: 4000000, weeks: '6-8', guideline: ['', '', '', ''] },
  { id: 25, num: 25, name: '화학물질 스크리닝 번역', formalName: '화학물질 생식독성 스크리닝 영문보고서', category: '생식독성', price: 2500000, weeks: '6-8', guideline: ['', '', '', ''] },
  { id: 26, num: 26, name: '아나필락시스 쇼크 번역', formalName: '항원성: 아나필락시스 쇼크반응 영문보고서', category: '항원성/국소독성', price: 1000000, weeks: '6-8', guideline: ['', '', '', ''] },
  { id: 27, num: 27, name: '수동피부 번역', formalName: '항원성: 수동피부 아나필락시스 영문보고서', category: '항원성/국소독성', price: 1000000, weeks: '6-8', guideline: ['', '', '', ''] },
  { id: 28, num: 28, name: '피부감작성 번역', formalName: '항원성: 피부감작성 시험 영문보고서', category: '항원성/국소독성', price: 1000000, weeks: '6-8', guideline: ['', '', '', ''] },
  { id: 29, num: 29, name: '피부자극 번역', formalName: '국소독성: 피부자극시험 영문보고서', category: '항원성/국소독성', price: 1000000, weeks: '6-8', guideline: ['', '', '', ''] },
  { id: 30, num: 30, name: '안점막자극 번역', formalName: '국소독성: 안점막자극시험 영문보고서', category: '항원성/국소독성', price: 1000000, weeks: '6-8', guideline: ['', '', '', ''] },
  { id: 31, num: 31, name: '광독성 번역', formalName: '국소독성: 광독성시험 영문보고서', category: '항원성/국소독성', price: 1000000, weeks: '6-8', guideline: ['', '', '', ''] },
  { id: 32, num: 32, name: '광감작성 번역', formalName: '국소독성: 광감작성시험 영문보고서', category: '항원성/국소독성', price: 1000000, weeks: '6-8', guideline: ['', '', '', ''] },
  { id: 33, num: 33, name: '조제물분석 번역', formalName: '투여물질의 조제물 분석 영문보고서', category: '기타', price: 1000000, weeks: '6-8', guideline: ['', '', '', ''] },
  { id: 34, num: 34, name: '발암성 번역', formalName: '발암성 시험 영문보고서', category: '기타', price: 10000000, weeks: '6-8', guideline: ['', '', '', ''] },
];
