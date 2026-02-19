import type { SimpleItem } from '@/types/toxicity-v2';

/**
 * HF_INDV 배열: 건기식 개별인정형 모드 시험 데이터 7개 항목
 * 소스: quotation-v2.jsx의 HF_INDV 배열
 * 필드 매핑: fn→formalName, p→price, w→weeks, gl→guideline
 */
export const HF_INDV_DATA: SimpleItem[] = [
  { id: 1, num: 1, name: '투여물질의 조제물 분석', formalName: '투여물질의 조제물 분석', category: '조제물분석', species: '-', duration: '-', description: '- 조제물분석법 Validation\n- 해당일 조제물에서 상중하 1ml씩 채취하여 분석 실시(HPLC)\n- 균질성, 안전성 및 함량 측정\n- 분석법 및 표준품 의뢰자 제공', price: 26000000, weeks: '6~', guideline: ['', '', '건강기능식품 기능성 및 안전성 평가 가이드', '투여 조제물의 균질성, 안정성 및 함량을 HPLC 등으로 분석하여 투여량의 정확성 확보'] },
  { id: 2, num: 2, name: '급성 경구독성시험', formalName: '급성 경구독성시험 (독성등급법: OECD TG423)', category: '단회투여독성', species: 'SD rat', duration: '1회', description: '- 독성등급법(TG423)\n- 일반증상, 체중 및 부검 관찰\n- 14일간 관찰', price: 2700000, weeks: 7, guideline: ['OECD TG 423', '', '식품의약품안전처 고시', '독성등급법으로 단회 경구투여 후 14일간 관찰하여 급성독성 프로파일 평가'] },
  { id: 3, num: 3, name: '설치류 4주 DRF', formalName: '설치류 4주 투여 DRF 시험 (용량결정시험)', category: '반복투여독성', species: 'SD rat', duration: '4주', description: '- 암수 각각 5마리/군\n- 대조군 1, 시험군 3', price: 14400000, weeks: 8, guideline: ['OECD TG 407', 'ICH M3(R2), ICH S4', '식품의약품안전처 고시', '13주 본시험의 용량 설정을 위한 DRF'] },
  { id: 4, num: 4, name: '설치류 13주 반복투여 독성', formalName: '설치류 13주 반복 투여 독성시험 (OECD TG 408 반영)', category: '반복투여독성', species: 'SD rat', duration: '13주', description: '- 암수 각각 10마리/군, 대조군 1, 시험군 3\n- 주요군: 80마리\n\n*TG408 개정 추가*\n1. 호르몬: T4, T3, TSH\n2. 혈액생화학: LDL, HDL\n3. 암컷 성주기 검사', price: 92000000, weeks: 27, guideline: ['OECD TG 408', 'ICH M3(R2), ICH S4', '식품의약품안전처 고시', '13주간 반복투여 아만성독성 평가. TG408 개정 반영'] },
  { id: 5, num: 5, name: '유전독성: Ames(TG471)', formalName: '유전독성시험 : 복귀 돌연변이 (OECD TG471)', category: '유전독성', species: '-', duration: '-', description: '- 5개 균주(TA100,TA1535,TA98,TA1537,WP2uvrA)\n- 복귀돌연변이 집락 수 관찰\n- 예비시험 포함', price: 5600000, weeks: 5, guideline: ['OECD TG 471', 'ICH S2(R1)', '식품의약품안전처 고시', '5개 균주 복귀돌연변이시험'], note: '재현성 추가시험 시 +200만원' },
  { id: 6, num: 6, name: '유전독성: 염색체이상(TG473)', formalName: '유전독성시험 : 염색체 이상 시험 (OECD TG473)', category: '유전독성', species: 'Cell', duration: '-', description: '- CHL 세포\n- 구조/수적 이상 관찰\n- 예비시험 포함', price: 13000000, weeks: 9, guideline: ['OECD TG 473', 'ICH S2(R1)', '식품의약품안전처 고시', 'CHL 세포 염색체이상시험'] },
  { id: 7, num: 7, name: '유전독성: 소핵시험(TG474)', formalName: '유전독성시험 : 소핵시험 (OECD TG474)', category: '유전독성', species: 'SD rat', duration: '-', description: '- 6마리/군, 총 5군\n- 골수 미성숙 적혈구내 소핵관찰\n- 예비시험 포함', price: 15500000, weeks: 9, guideline: ['OECD TG 474', 'ICH S2(R1)', '식품의약품안전처 고시', '설치류 골수 적혈구 소핵시험'] },
];

/**
 * HF_PROB 배열: 건기식 프로바이오틱스 모드 시험 데이터 5개 항목
 * 소스: quotation-v2.jsx의 HF_PROB 배열
 */
export const HF_PROB_DATA: SimpleItem[] = [
  { id: 1, num: 1, name: '투여물질의 조제물 분석', formalName: '투여물질의 조제물 분석', category: '조제물분석', species: '-', duration: '-', description: '- 조제물분석법 Validation\n- HPLC 분석\n- 균질성, 안전성 및 함량 측정', price: 26000000, weeks: '6~', guideline: ['', '', '건강기능식품 기능성 및 안전성 평가 가이드', '투여 조제물의 균질성, 안정성 및 함량을 HPLC 등으로 분석'] },
  { id: 2, num: 2, name: '설치류 단회 투여 독성시험', formalName: '설치류 단회 투여 독성시험', category: '단회투여독성', species: 'SD rat', duration: '1회', description: '- 암수 각각 5마리/군\n- 대조군 1, 시험군 3', price: 3200000, weeks: 7, guideline: ['OECD TG 420/423/425', '', '식품의약품안전처 고시', '단회 경구투여 후 14일간 관찰하여 급성독성 프로파일 평가'] },
  { id: 3, num: 3, name: '설치류 4주 DRF', formalName: '설치류 4주 투여 DRF 시험 (용량결정시험)', category: '반복투여독성', species: 'SD rat', duration: '4주', description: '- 암수 각각 5마리/군\n- 대조군 1, 시험군 3', price: 14400000, weeks: 8, guideline: ['OECD TG 407', 'ICH M3(R2), ICH S4', '식품의약품안전처 고시', '13주 본시험의 용량 설정을 위한 DRF'] },
  { id: 4, num: 4, name: '설치류 13주 반복투여 독성', formalName: '설치류 13주 반복 투여 독성시험 (OECD TG 408 반영)', category: '반복투여독성', species: 'SD rat', duration: '13주', description: '- 암수 각각 10마리/군, 대조군 1, 시험군 3\n- 주요군: 80마리\n\n*TG408 개정 추가*\n1. 호르몬: T4, T3, TSH\n2. 혈액생화학: LDL, HDL\n3. 암컷 성주기 검사', price: 92000000, weeks: 27, guideline: ['OECD TG 408', 'ICH M3(R2), ICH S4', '식품의약품안전처 고시', '13주간 반복투여 아만성독성 평가. TG408 개정 반영'], note: '성호르몬 추가 시 비용 발생' },
  { id: 5, num: 5, name: '설치류 13주 반복 4주 회복', formalName: '설치류 13주 반복 투여 4주 회복시험 (OECD TG 408 반영)', category: '반복투여독성', species: 'SD rat', duration: '13주', description: '- 암수 각각 5마리/군, 대조군 1, 시험군 1\n- 회복군: 20마리\n\n*TG408 개정 추가*\n1. 호르몬: T4, T3, TSH\n2. 혈액생화학: LDL, HDL\n3. 암컷 성주기 검사', price: 26000000, weeks: 31, guideline: ['OECD TG 408', 'ICH M3(R2), ICH S4', '식품의약품안전처 고시', '본시험 후 4주 회복기 가역성 평가. TG408 개정 반영'] },
];

/**
 * HF_TEMP 배열: 건기식 한시적식품 모드 시험 데이터 8개 항목
 * 소스: quotation-v2.jsx의 HF_TEMP 배열
 */
export const HF_TEMP_DATA: SimpleItem[] = [
  { id: 1, num: 1, name: '투여물질의 조제물 분석', formalName: '투여물질의 조제물 분석', category: '조제물분석', species: '-', duration: '-', description: '- 조제물분석법 Validation\n- HPLC 분석\n- 균질성, 안전성 및 함량 측정\n- 분석법 및 표준품 의뢰자 제공', price: 26000000, weeks: '6~', guideline: ['', '', '건강기능식품 기능성 및 안전성 평가 가이드', '투여 조제물의 균질성, 안정성 및 함량을 HPLC 등으로 분석'] },
  { id: 2, num: 2, name: '급성 경구독성시험', formalName: '급성 경구독성시험 (독성등급법: OECD TG423)', category: '단회투여독성', species: 'SD rat', duration: '1회', description: '- 독성등급법(TG423)\n- 일반증상, 체중 및 부검\n- 14일간 관찰', price: 2700000, weeks: 7, guideline: ['OECD TG 423', '', '식품의약품안전처 고시', '독성등급법으로 단회 경구투여 후 14일간 관찰'] },
  { id: 3, num: 3, name: '설치류 4주 DRF', formalName: '설치류 4주 투여 DRF 시험 (용량결정시험)', category: '반복투여독성', species: 'SD rat', duration: '4주', description: '- 암수 각각 5마리/군\n- 대조군 1, 시험군 3', price: 14400000, weeks: 8, guideline: ['OECD TG 407', 'ICH M3(R2), ICH S4', '식품의약품안전처 고시', '13주 본시험의 용량 설정을 위한 DRF'] },
  { id: 4, num: 4, name: '설치류 13주 반복투여 독성', formalName: '설치류 13주 반복 투여 독성시험 (OECD TG 408 반영)', category: '반복투여독성', species: 'SD rat', duration: '13주', description: '- 암수 각각 10마리/군, 대조군 1, 시험군 3\n- 주요군: 80마리\n\n*TG408 개정 추가*\n1. 호르몬: T4, T3, TSH\n2. 혈액생화학: LDL, HDL\n3. 암컷 성주기 검사', price: 92000000, weeks: 27, guideline: ['OECD TG 408', 'ICH M3(R2), ICH S4', '식품의약품안전처 고시', '13주간 반복투여 아만성독성 평가. TG408 개정 반영'], note: '성호르몬 추가 시 비용 발생' },
  { id: 5, num: 5, name: '설치류 13주 반복 4주 회복', formalName: '설치류 13주 반복 투여 4주 회복시험 (OECD TG 408 반영)', category: '반복투여독성', species: 'SD rat', duration: '13주', description: '- 암수 각각 5마리/군, 대조군 1, 시험군 1\n- 회복군: 20마리\n\n*TG408 개정 추가*\n1. 호르몬: T4, T3, TSH\n2. 혈액생화학: LDL, HDL\n3. 암컷 성주기 검사', price: 26000000, weeks: 31, guideline: ['OECD TG 408', 'ICH M3(R2), ICH S4', '식품의약품안전처 고시', '본시험 후 4주 회복기 가역성 평가. TG408 개정 반영'] },
  { id: 6, num: 6, name: '유전독성: Ames(TG471)', formalName: '유전독성시험 : 복귀 돌연변이 (OECD TG471)', category: '유전독성', species: '-', duration: '-', description: '- 5개 균주(TA100,TA1535,TA98,TA1537,WP2uvrA)\n- 복귀돌연변이 집락 수 관찰\n- 예비시험 포함', price: 5600000, weeks: 5, guideline: ['OECD TG 471', 'ICH S2(R1)', '식품의약품안전처 고시', '5개 균주 복귀돌연변이시험'], note: '재현성 추가시험 시 +200만원' },
  { id: 7, num: 7, name: '유전독성: 염색체이상(TG473)', formalName: '유전독성시험 : 염색체 이상 시험 (OECD TG473)', category: '유전독성', species: 'Cell', duration: '-', description: '- CHL 세포\n- 구조/수적 이상 관찰\n- 예비시험 포함', price: 13000000, weeks: 9, guideline: ['OECD TG 473', 'ICH S2(R1)', '식품의약품안전처 고시', 'CHL 세포 염색체이상시험'] },
  { id: 8, num: 8, name: '유전독성: 소핵시험(TG474)', formalName: '유전독성시험 : 소핵시험 (OECD TG474)', category: '유전독성', species: 'SD rat', duration: '-', description: '- 6마리/군, 총 5군\n- 골수 미성숙 적혈구내 소핵관찰\n- 예비시험 포함', price: 15500000, weeks: 9, guideline: ['OECD TG 474', 'ICH S2(R1)', '식품의약품안전처 고시', '설치류 골수 적혈구 소핵시험'] },
];
