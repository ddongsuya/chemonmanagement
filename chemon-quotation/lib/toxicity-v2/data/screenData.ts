import type { SimpleItem } from '@/types/toxicity-v2';

/**
 * SCREEN 배열: 독성 스크리닝 모드 시험 데이터 8개 항목
 * 소스: quotation-v2.jsx의 SCREEN 배열
 * 필드 매핑: fn→formalName, p→price, w→weeks, gl→guideline
 */
export const SCREEN_DATA: SimpleItem[] = [
  { id: 1, num: 1, name: '단회투여 독성 스크리닝', formalName: '설치류 단회 투여 독성시험 Screening', category: '단회투여독성', species: 'SD rat', duration: '1회', description: '- 시험물질 1종\n- 고정용량방법(OECD TG 420)\n- 투여량: 5, 50, 300, 2000 mg/kg', price: 2500000, weeks: 5, guideline: ['OECD TG 420', '', '', '고정용량방법(TG420)으로 단회투여 급성독성 스크리닝'] },
  { id: 2, num: 2, name: '2주 반복독성 스크리닝', formalName: '설치류 2주 반복 독성 Screening', category: '반복투여독성', species: 'SD rat', duration: '2주', description: '- 시험물질 1종\n- 암수 각각 3마리/군\n- 대조군 1, 시험군 3\n\n- 조직병리: 주요 5장기\n  (뇌, 신장, 심장, 간, 폐장)', price: 18000000, weeks: 5, guideline: ['', '', '', '신속한 독성 및 표적장기 확인. 주요 5장기 조직병리'], note: '관심장기 추가 시 비용 발생' },
  { id: 3, num: 3, name: '복귀돌연변이 스크리닝', formalName: '복귀 돌연변이시험 Screening', category: '유전독성', species: 'Cell', duration: '-', description: '- 시험물질 1종\n- 대장균 1균, 살모넬라균 4균\n- 9개 농도군(음성/양성대조군 포함)\n- 농도군당 2개 plate (총 180 plates)', price: 3000000, weeks: 3, guideline: ['OECD TG 471', 'ICH S2(R1)', '', '대장균+살모넬라균, 9개 농도군, 총 180 plates'] },
  { id: 4, num: 4, name: '염색체이상 스크리닝', formalName: '염색체 이상 시험 Screening', category: '유전독성', species: 'Cell', duration: '-', description: '- 시험물질 1종\n- 햄스터 폐 세포\n- 용량결정시험 포함\n- 6+S / 6-S / 24-S', price: 5000000, weeks: 7, guideline: ['OECD TG 473', 'ICH S2(R1)', '', '햄스터 폐 세포, 용량결정시험 포함'] },
  { id: 5, num: 5, name: '소핵시험 스크리닝 (in vivo)', formalName: '소핵 시험 Screening', category: '유전독성', species: 'ICR mouse', duration: '-', description: '- 시험물질 1종\n- 수컷 ICR mouse 4마리/6군\n  (음성/양성대조군 포함)\n- LD50 자료 제공 필요', price: 6000000, weeks: 7, guideline: ['OECD TG 474', 'ICH S2(R1)', '', '수컷 ICR mouse 4마리/6군'] },
  { id: 6, num: 6, name: '소핵시험 스크리닝 (in vitro)', formalName: 'In vitro 소핵 시험 Screening', category: '유전독성', species: 'Cell', duration: '-', description: '- 시험물질 1종\n- +cyto-B 처리\n- 3+S, 3-S, 24-S\n- 이핵세포 1000개 소핵 판별', price: 6000000, weeks: 7, guideline: ['OECD TG 487', 'ICH S2(R1)', '', '+cyto-B 처리, 이핵세포 소핵 판별'] },
  { id: 7, num: 7, name: '세포독성 스크리닝', formalName: 'In vitro Cytotoxicity Screening', category: '세포독성', species: 'In vitro', duration: '-', description: '- 시험물질 1종\n- 세포: L-929\n- ISO 10993-5, Part 5\n- MTT assay', price: 4300000, weeks: 8, guideline: ['', '', 'ISO 10993-5', 'L-929 세포, MTT assay'] },
  { id: 8, num: 8, name: 'hERG 스크리닝', formalName: '안전성약리 In vitro hERG Assay Screening', category: '안전성약리', species: 'Cell', duration: '-', description: '- 시험물질 1종\n- CHO-hERG-Duo cells\n- 3 dose군, 부형제대조군 1, E4031군 1\n- hERG channel current 측정', price: 6000000, weeks: 3, guideline: ['', 'ICH S7B', '', 'CHO-hERG-Duo cells, hERG channel current 측정'] },
];

/**
 * CV_SCREEN 배열: 심혈관계 스크리닝 모드 시험 데이터 6개 항목
 * 소스: quotation-v2.jsx의 CV_SCREEN 배열
 */
export const CV_SCREEN_DATA: SimpleItem[] = [
  { id: 1, num: 1, name: 'hERG screening', formalName: '안전성약리 In vitro hERG Screening Assay (Manual Patch Clamp)', category: '이온채널 스크리닝', species: 'Cell', duration: '-', description: '- 시험물질 1종\n- CHO-hERG-Duo cells\n- 3 dose군, 부형제대조군 1, E4031군 1\n- hERG channel current 측정', price: 3000000, weeks: '2-3', guideline: ['', 'ICH S7B', '', 'CHO-hERG-Duo cells, manual patch clamp hERG측정'], note: 'raw data 전달 기준' },
  { id: 2, num: 2, name: 'Cav1.2 screening', formalName: '안전성약리 In vitro Cav1.2 Ion Channel Screening Assay (Manual Patch Clamp)', category: '이온채널 스크리닝', species: 'Cell', duration: '-', description: '- 시험물질 1종\n- HEK-293\n- 3 dose군, 양성대조군 1\n- CaV1.2 발현 유도 (Tetracycline)', price: 3000000, weeks: '2-3', guideline: ['', 'ICH S7B', '', 'HEK-293, CaV1.2 발현 유도 후 patch clamp'], note: 'raw data 전달 기준' },
  { id: 3, num: 3, name: 'Nav1.5 screening', formalName: '안전성약리 In vitro Nav1.5 Ion Channel Screening Assay (Manual Patch Clamp)', category: '이온채널 스크리닝', species: 'Cell', duration: '-', description: '- 시험물질 1종\n- CHO cell\n- 3 dose군, 양성대조군 1\n- Peak/Late NaV1.5 current 평가', price: 3000000, weeks: '2-3', guideline: ['', 'ICH S7B', '', 'CHO cell, Peak/Late NaV1.5 current 평가'], note: 'raw data 전달 기준' },
  { id: 4, num: 4, name: 'MEA (hiPSC-CM)', formalName: '안전성약리 In vitro MEA using hiPSC-Cardiomyocytes (GLP)', category: 'MEA', species: 'Cell', duration: '-', description: '- 시험물질 1종\n- 2개 세포주: 넥셀(국내), 후지필름 CDI(일본)\n- 부형제대조군 1, 시험군 3\n- 측정: FPD, BPM/ISI, dv/dtmax', price: 40000000, weeks: '4-5', guideline: ['', 'ICH S7B', 'CiPA', '2개 세포주, MEA로 FPD/BPM/dv·dtmax 측정'], note: 'GLP · 보고서 작성 기준' },
  { id: 5, num: 5, name: '비글 예비시험', formalName: '안전성약리 투여 용량 확인 예비시험 (비글)', category: '예비시험', species: 'Beagle dog', duration: '1-2회', description: '- 비글 수컷 2마리\n- capsule 투여 2 dose\n- hERG 시험 정보 제공 필요', price: 10000000, weeks: '3-4', guideline: ['', 'ICH S7A', '', '비글 수컷 2마리, capsule 2 dose'] },
  { id: 6, num: 6, name: 'Telemetry', formalName: '안전성약리 Telemetry Assay (비글)', category: 'Telemetry', species: 'Beagle dog', duration: '단회', description: '- 시험군 2 (대조군 없이)\n- 부형제: 투여 전 2-3시간 자료 활용', price: 50000000, weeks: 12, guideline: ['', 'ICH S7A', '', '비글 Telemetry, 시험군 2'] },
];
