import type { SimpleItem } from '@/types/toxicity-v2';

/**
 * CELL_TX 배열: 세포치료제 모드 시험 데이터 6개 항목
 * 소스: quotation-v2.jsx의 CELL_TX 배열
 */
export const CELL_TX_DATA: SimpleItem[] = [
  { id: 1, num: 1, name: '누드마우스 단회 13주', formalName: '누드마우스 단회 투여 후 13주 관찰 독성시험', category: '단회독성', species: 'BALB/c nude mice', duration: '1회', description: '- 암수 각각 10마리/군, 대조1+시험3\n- 세포투여, 단회 투여 후 13주 관찰\n- 일반증상, 체중, 사료섭취량, 뇨/안검사\n- 부검: 장기중량, 혈액학, 생화학, 조직병리', price: 135000000, weeks: 31, guideline: ['', '', '', '뇌내 투여, 13주 관찰'] },
  { id: 2, num: 2, name: '종양원성 26주', formalName: '누드마우스 단회 투여 후 26주 종양원성 시험', category: '종양원성', species: 'BALB/c nude mice', duration: '단회', description: '- 암수 각각 15마리/군, 대조1+양성대조1+시험1\n- 3주간 총 4회 투여 후 26주 관찰\n- 양성대조군 cell: 켐온 배양', price: 145000000, weeks: 46, guideline: ['', '', '', '26주 종양원성 관찰'] },
  { id: 3, num: 3, name: '종양원성 52주 연장', formalName: '누드마우스 종양원성 시험 52주 관찰 연장', category: '종양원성', species: 'BALB/c nude mice', duration: '-', description: '- 26주→52주 연장 추가 비용', price: 57000000, weeks: '+26', guideline: ['', '', '', '52주 연장'], note: '26주 시험에 추가' },
  { id: 4, num: 4, name: 'Spiking test', formalName: '누드마우스 종양원성 Spiking test 3군 추가', category: '종양원성', species: 'BALB/c nude mice', duration: '-', description: '- spiking 3군 추가 (52주 기준)', price: 177000000, weeks: '+30', guideline: ['', '', '', 'spiking 3군 추가'], note: '52주 기준' },
  { id: 5, num: 5, name: 'QPCR Validation', formalName: 'QPCR 체내분포 분석을 위한 Validation', category: '체내분포', species: 'BALB/c nude mice', duration: '-', description: '- 2개 gene (Alu, GAPDH)\n- 검증용 암수 각각 6마리\n- 최소 8주 소요 (본시험 전 수행)', price: 54600000, weeks: '~8', guideline: ['', '', '', '2 gene, 검증용 누드마우스'] },
  { id: 6, num: 6, name: '조직분포 채취+분석', formalName: '누드마우스 관절강내 투여 후 조직내 분포 채취 및 분석시험', category: '체내분포', species: 'BALB/c nude mouse', duration: '단회', description: '- 총 78마리 (대조18+시험60)\n- 관절강내 1회 투여\n- 부검 6포인트 (1일~8주)\n- 적출장기 14개\n- 분석: 60×14 + 18×14 조직', price: 111800000, weeks: '협의', guideline: ['식약처 가이드라인', '', '', '78마리, 14장기, 6포인트 부검'] },
];
