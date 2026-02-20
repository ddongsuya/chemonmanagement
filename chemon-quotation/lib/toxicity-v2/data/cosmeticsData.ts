import type { SimpleItem } from '@/types/toxicity-v2';

/**
 * COS_ALT 배열: 화장품 대체시험 모드 시험 데이터 9개 항목
 * 소스: quotation-v2.jsx의 COS_ALT 배열
 */
export const COS_ALT_DATA: SimpleItem[] = [
  { id: 1, num: 1, name: '단회투여 독성', formalName: '설치류 단회 투여 독성시험 (독성등급법/고정용량법)', category: '단회투여독성', species: 'SD rat', duration: '1회', description: '- 예비시험 포함\n- OECD 423 또는 420에 의해 진행', price: 3200000, weeks: 7, guideline: ['OECD TG 423/420', '', '', 'TG423/420, 예비시험 포함'] },
  { id: 2, num: 2, name: 'Ames(TG471)', formalName: '유전독성시험: 복귀 돌연변이 (OECD TG471)', category: '유전독성', species: '-', duration: '-', description: '- 5균주(TA100,TA1535,TA98,TA1537,WP2uvrA)\n- 복귀돌연변이 집락 수 관찰\n- 예비시험 포함', price: 6500000, weeks: 5, guideline: ['OECD TG 471', '', '', '5개 균주, 예비시험 포함'], note: '양성 시 재현시험 +200만' },
  { id: 3, num: 3, name: '염색체이상(TG473)', formalName: '유전독성시험: 염색체 이상 시험 (OECD TG473)', category: '유전독성', species: 'Cell', duration: '-', description: '- CHL 세포\n- 구조/수적 이상 관찰\n- 예비시험 포함', price: 15000000, weeks: 9, guideline: ['OECD TG 473', '', '', 'CHL 세포, 예비시험 포함'] },
  { id: 4, num: 4, name: '소핵시험(TG474)', formalName: '유전독성시험: 소핵시험 (OECD TG474)', category: '유전독성', species: 'SD rat', duration: '-', description: '- 6마리/군, 총 5군\n- 골수 미성숙 적혈구내 소핵관찰\n- 예비시험 포함', price: 18000000, weeks: 9, guideline: ['OECD TG 474', '', '', '6마리/군 5군, 예비시험 포함'] },
  { id: 5, num: 5, name: '피부자극(RhE)', formalName: '1차 피부자극시험: RhE model (OECD TG439)', category: '피부자극/감작', species: '3D tissue', duration: '-', description: '- EpiDerm™ (MatTek)\n- 조직 입고: 4주 소요 (사전 주문)', price: 11000000, weeks: 6, guideline: ['OECD TG 439', '', '', 'EpiDerm™, 조직 입고 4주'] },
  { id: 6, num: 6, name: '안점막자극(RhCE)', formalName: '안점막자극시험: RhCE model (OECD TG492)', category: '안자극', species: '3D tissue', duration: '-', description: '- EpiOcular™ (MatTek)\n- 조직 입고: 4주 소요 (사전 주문)', price: 11000000, weeks: 6, guideline: ['OECD TG 492', '', '', 'EpiOcular™, 조직 입고 4주'] },
  { id: 7, num: 7, name: '피부감작(LLNA)', formalName: '피부감작성시험 LLNA: BrdU-ELISA (OECD TG442B)', category: '피부자극/감작', species: 'CBA/J mouse', duration: '3일간', description: '- 암컷 5마리/군\n- 대조1, 시험3, 양성대조1\n- 2회/일, 3일간 도포\n- 용량결정시험/본시험', price: 13000000, weeks: 6, guideline: ['OECD TG 442B', '', '', '암컷 5마리/군, 용량결정/본시험'] },
  { id: 8, num: 8, name: '광독성(3T3 NRU)', formalName: '광독성시험 In vitro 3T3 NRU (OECD TG432)', category: '광독성/광감작', species: 'Cell', duration: '단회', description: '- 조사/비조사군, 각 9농도\n- 용량결정시험/본시험', price: 6000000, weeks: 8, guideline: ['OECD TG 432', '', '', '조사/비조사군, 9농도'] },
  { id: 9, num: 9, name: '광감작(Harber)', formalName: '광감작성시험 Harber법 (동물이용)', category: '광독성/광감작', species: 'Guinea Pig', duration: '단회', description: '- 수컷 5마리/군\n- 대조1, 시험1, 양성대조1\n- UV 280~480nm 흡수 없을 시 면제', price: 16000000, weeks: 7, guideline: ['', '', '', '수컷 5마리/군, UV 흡수시 진행'] },
];

/**
 * COS_STEM 배열: 화장품 줄기세포배양액 모드 시험 데이터 12개 항목
 * 소스: quotation-v2.jsx의 COS_STEM 배열
 */
export const COS_STEM_DATA: SimpleItem[] = [
  { id: 1, num: 1, name: '단회투여(경구)', formalName: '설치류 단회 투여 독성시험 (경구)', category: '단회투여독성', species: 'SD rat', duration: '1회', description: '- 독성등급법 또는 고정용량법\n- 예비시험 포함', price: 3200000, weeks: 7, guideline: ['OECD TG 423/420', '', '', 'TG423/420, 경구'] },
  { id: 2, num: 2, name: '단회투여(경피)', formalName: '설치류 단회 투여 독성시험 (경피)', category: '단회투여독성', species: 'SD rat', duration: '1회', description: '- 암수 각각 5마리/군\n- 대조군 1, 시험군 3', price: 4600000, weeks: 7, guideline: ['', '', '', '경피투여, 암수 5마리/군'] },
  { id: 3, num: 3, name: '4주 DRF(경피)', formalName: '설치류 4주 투여 DRF 시험 (경피)', category: '반복투여독성', species: 'SD rat', duration: '4주', description: '- 암수 각각 5마리/군\n- 대조군 1, 시험군 3', price: 28000000, weeks: 8, guideline: ['OECD TG 407', '', '', '경피투여 DRF'] },
  { id: 4, num: 4, name: '13주 반복(경피)', formalName: '설치류 13주 반복 투여 독성시험 (경피)', category: '반복투여독성', species: 'SD rat', duration: '13주', description: '- 암수 각각 10마리/군\n- 대조군 1, 시험군 3', price: 142000000, weeks: 31, guideline: ['OECD TG 408', '', '', '13주 경피 반복투여'] },
  { id: 5, num: 5, name: '13주 회복시험', formalName: '설치류 13주 반복 투여 회복시험', category: '반복투여독성', species: 'SD rat', duration: '13주', description: '- 암수 각각 5마리/군\n- 대조군 1, 시험군 1', price: 39000000, weeks: 35, guideline: ['OECD TG 408', '', '', '회복기 가역성 평가'] },
  { id: 6, num: 6, name: 'Ames(TG471)', formalName: '유전독성시험: 복귀 돌연변이 (OECD TG471)', category: '유전독성', species: '-', duration: '-', description: '- 5균주\n- 예비시험 포함', price: 6500000, weeks: 5, guideline: ['OECD TG 471', '', '', '5개 균주'], note: '양성 시 재현시험 +200만' },
  { id: 7, num: 7, name: '염색체이상(TG473)', formalName: '유전독성시험: 염색체 이상 시험 (OECD TG473)', category: '유전독성', species: 'Cell', duration: '-', description: '- CHL 세포\n- 예비시험 포함', price: 15000000, weeks: 9, guideline: ['OECD TG 473', '', '', 'CHL 세포'] },
  { id: 8, num: 8, name: '소핵시험(TG474)', formalName: '유전독성시험: 소핵시험 (OECD TG474)', category: '유전독성', species: 'SD rat', duration: '-', description: '- 6마리/군, 총 5군\n- 예비시험 포함', price: 18000000, weeks: 9, guideline: ['OECD TG 474', '', '', '6마리/군 5군'] },
  { id: 9, num: 9, name: '광감작(Harber)', formalName: '광감작성시험 Harber법 (동물이용)', category: '광독성/광감작', species: 'Guinea Pig', duration: '단회', description: '- 수컷 5마리/군\n- 대조1, 시험1, 양성대조1\n- UV 280~480nm 흡수 없을 시 면제', price: 16000000, weeks: 7, guideline: ['', '', '', '수컷 5마리/군'] },
  { id: 10, num: 10, name: '피부감작(LLNA)', formalName: '피부감작성시험 LLNA: BrdU-ELISA (OECD TG442B)', category: '피부자극/감작', species: 'CBA/J mouse', duration: '3일간', description: '- 암컷 5마리/군\n- 대조1, 시험3, 양성대조1\n- 2회/일, 3일간 도포', price: 13000000, weeks: 6, guideline: ['OECD TG 442B', '', '', '암컷 5마리/군'] },
  { id: 11, num: 11, name: '피부자극(RhE)', formalName: '1차 피부자극시험: RhE model (OECD TG439)', category: '피부자극/감작', species: '3D tissue', duration: '-', description: '- EpiDerm™ (MatTek)\n- 조직 입고: 4주 소요', price: 11000000, weeks: 6, guideline: ['OECD TG 439', '', '', 'EpiDerm™'] },
  { id: 12, num: 12, name: '안점막자극(RhCE)', formalName: '안점막자극시험: RhCE model (OECD TG492)', category: '안자극', species: '3D tissue', duration: '-', description: '- EpiOcular™ (MatTek)\n- 조직 입고: 4주 소요', price: 11000000, weeks: 6, guideline: ['OECD TG 492', '', '', 'EpiOcular™'] },
];
