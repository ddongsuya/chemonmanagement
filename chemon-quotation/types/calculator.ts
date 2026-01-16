// 동물종 데이터
export interface SpeciesData {
  key: string;
  name: string;
  nameEn: string;
  weight: number;
  bsa: number;
  km: number;
  factor: number;
}

// 종간 변환 계수 (FDA Guidance 기준)
export const SPECIES_DATA: Record<string, SpeciesData> = {
  mouse: { key: 'mouse', name: '마우스', nameEn: 'Mouse', weight: 0.02, bsa: 0.0007, km: 3, factor: 0.081 },
  hamster: { key: 'hamster', name: '햄스터', nameEn: 'Hamster', weight: 0.08, bsa: 0.016, km: 5, factor: 0.135 },
  rat: { key: 'rat', name: '랫드', nameEn: 'Rat', weight: 0.15, bsa: 0.025, km: 6, factor: 0.162 },
  ferret: { key: 'ferret', name: '페럿', nameEn: 'Ferret', weight: 0.30, bsa: 0.043, km: 7, factor: 0.189 },
  guinea_pig: { key: 'guinea_pig', name: '기니픽', nameEn: 'Guinea Pig', weight: 0.40, bsa: 0.05, km: 8, factor: 0.216 },
  rabbit: { key: 'rabbit', name: '토끼', nameEn: 'Rabbit', weight: 1.8, bsa: 0.15, km: 12, factor: 0.324 },
  monkey: { key: 'monkey', name: '원숭이', nameEn: 'Cynomolgus Monkey', weight: 3, bsa: 0.24, km: 12, factor: 0.324 },
  dog: { key: 'dog', name: '비글', nameEn: 'Beagle Dog', weight: 10, bsa: 0.5, km: 20, factor: 0.541 },
  minipig: { key: 'minipig', name: '미니픽', nameEn: 'Minipig', weight: 40, bsa: 1.14, km: 35, factor: 0.946 },
  human: { key: 'human', name: '사람', nameEn: 'Human', weight: 60, bsa: 1.62, km: 37, factor: 1.000 },
};

export const HUMAN_KM = 37;

// 투여 경로
export type RouteType = 'oral' | 'iv' | 'sc' | 'im' | 'ip' | 'dermal' | 'inhalation';

export const ROUTE_LABELS: Record<RouteType, string> = {
  oral: '경구 (PO)',
  iv: '정맥 (IV)',
  sc: '피하 (SC)',
  im: '근육 (IM)',
  ip: '복강 (IP)',
  dermal: '경피 (Dermal)',
  inhalation: '흡입 (Inhalation)',
};

// 동물종별 NOAEL 입력
export interface SpeciesNoaelInput {
  id: string;
  speciesKey: string;
  noael: number | null;
  route: RouteType;
  bioavailability: number;
}

// 계산 결과
export interface MRSDResult {
  species: SpeciesData;
  noael: number;
  route: RouteType;
  bioavailability: number;
  correctedNoael: number;
  hed: number;
  mrsd: number;
  mrsdTotal: number;
}

// PAD 비교 결과
export interface PADComparison {
  padValue: number;
  padBasis: 'animal' | 'invitro' | 'pk' | 'literature';
  mrsd: number;
  ratio: number;
  recommendation: string;
}

// 전체 계산 결과
export interface MRSDCalculationResult {
  direction: 'forward' | 'reverse';
  humanWeight: number;
  safetyFactor: number;
  results: MRSDResult[];
  mostConservative: MRSDResult | null;
  padComparison: PADComparison | null;
  calculationSteps: string[];
  timestamp: Date;
}
