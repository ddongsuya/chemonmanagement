// lib/efficacy-v2/cost-engine.ts
// 효력시험 비용 계산 엔진 — master-data 단가표 기반

import type { CostItem, ScheduleStep } from '@/types/efficacy-v2';
import { getAnimalPrice, getHousingRate } from './animal-prices';
import { PRICE_TABLE, getPriceByCode } from './master-data';

interface CostInput {
  species: string;
  ageWeeks: number;
  animalsPerGroup: number;
  groupCount: number;
  scheduleSteps: ScheduleStep[];
  evalItems: { name: string; enabled: boolean }[];
  reportWeeks: number;
}

let sortCounter = 0;

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function stepToDays(step: ScheduleStep): number {
  if (step.durationUnit === 'week') return step.duration * 7;
  if (step.durationUnit === 'day') return step.duration;
  return 1;
}

export function calculateTotalDays(steps: ScheduleStep[]): number {
  return steps.reduce((sum, s) => sum + stepToDays(s), 0);
}

export function calculateTotalWeeks(steps: ScheduleStep[]): number {
  return Math.ceil(calculateTotalDays(steps) / 7);
}

/** 동물종에 따른 투여 단가 코드 결정 */
function getAdminCode(species: string): string {
  const s = species.toLowerCase();
  if (s.includes('beagle') || s.includes('dog') || s.includes('pig') || s.includes('rabbit')) {
    return 'ADMIN_LG_PO_IM'; // 대동물 기본
  }
  return 'ADMIN_PO_IP_IM'; // 소동물 기본
}

/** 평가항목명 → 마스터 단가 코드 매핑 */
function matchEvalToPrice(evalName: string): { code: string; category: string; price: number } {
  const n = evalName.toLowerCase();

  // 조직병리
  if (n.includes('h&e') || n.includes('he ') || n.includes('collagen') || n.includes('mt ') || n.includes('masson'))
    return { code: 'HE_MT', category: '조직병리', price: getPriceByCode('HE_MT')?.price ?? 100000 };
  if (n.includes('safranin'))
    return { code: 'SAFRANIN', category: '조직병리', price: getPriceByCode('SAFRANIN')?.price ?? 90000 };
  if (n.includes('ihc'))
    return { code: 'IHC', category: '조직병리', price: getPriceByCode('IHC')?.price ?? 200000 };
  if (n.includes('조직병리') || n.includes('histol') || n.includes('stain'))
    return { code: 'HE_MT', category: '조직병리', price: getPriceByCode('HE_MT')?.price ?? 100000 };

  // 영상
  if (n.includes('micro-ct') || n.includes('micro ct'))
    return { code: 'MICRO_CT', category: '영상', price: getPriceByCode('MICRO_CT')?.price ?? 250000 };
  if (n.includes('mri'))
    return { code: 'MRI_RAT', category: '영상', price: getPriceByCode('MRI_RAT')?.price ?? 200000 };
  if (n.includes('dexa'))
    return { code: 'DEXA', category: '영상', price: getPriceByCode('DEXA')?.price ?? 200000 };
  if (n.includes('초음파') || n.includes('echo'))
    return { code: 'ECHO', category: '영상', price: getPriceByCode('ECHO')?.price ?? 250000 };

  // 행동평가
  if (n.includes('수미로') || n.includes('water maze') || n.includes('morris'))
    return { code: 'WATER_MAZE', category: '행동평가', price: getPriceByCode('WATER_MAZE')?.price ?? 70000 };
  if (n.includes('y maze'))
    return { code: 'Y_MAZE', category: '행동평가', price: getPriceByCode('Y_MAZE')?.price ?? 50000 };
  if (n.includes('rotarod') || n.includes('rota-rod'))
    return { code: 'ROTAROD', category: '행동평가', price: getPriceByCode('ROTAROD')?.price ?? 50000 };
  if (n.includes('von frey'))
    return { code: 'VON_FREY', category: '행동평가', price: getPriceByCode('VON_FREY')?.price ?? 60000 };
  if (n.includes('grip'))
    return { code: 'GRIP', category: '행동평가', price: getPriceByCode('GRIP')?.price ?? 70000 };
  if (n.includes('passive avoidance'))
    return { code: 'PA', category: '행동평가', price: getPriceByCode('PA')?.price ?? 70000 };
  if (n.includes('treadmill'))
    return { code: 'TREADMILL', category: '행동평가', price: getPriceByCode('TREADMILL')?.price ?? 40000 };
  if (n.includes('hanging'))
    return { code: 'HANGING', category: '행동평가', price: getPriceByCode('HANGING')?.price ?? 90000 };
  if (n.includes('randall'))
    return { code: 'RANDALL', category: '행동평가', price: getPriceByCode('RANDALL')?.price ?? 10000 };
  if (n.includes('행동') || n.includes('bbb'))
    return { code: 'WATER_MAZE', category: '행동평가', price: 70000 };

  // 분자생물학
  if (n.includes('pcr') || n.includes('rt-pcr'))
    return { code: 'PCR', category: '분자생물학', price: getPriceByCode('PCR')?.price ?? 60000 };
  if (n.includes('western'))
    return { code: 'WESTERN', category: '분자생물학', price: getPriceByCode('WESTERN')?.price ?? 50000 };
  if (n.includes('elisa'))
    return { code: 'ELISA_LABOR', category: '분자생물학', price: getPriceByCode('ELISA_LABOR')?.price ?? 50000 };

  // 종양
  if (n.includes('종양부피') || n.includes('종양크기') || n.includes('tumor'))
    return { code: 'TUMOR_SIZE', category: '항암', price: getPriceByCode('TUMOR_SIZE')?.price ?? 5000 };

  // 채혈/혈액
  if (n.includes('혈액') || n.includes('혈당') || n.includes('혈장') || n.includes('blood'))
    return { code: 'BL_NECRO', category: '채혈', price: getPriceByCode('BL_NECRO')?.price ?? 15000 };
  if (n.includes('hydroxyproline'))
    return { code: 'ELISA_LABOR', category: '분자생물학', price: 50000 };

  // 부검
  if (n.includes('부검') || n.includes('장기무게') || n.includes('necropsy'))
    return { code: 'NECROPSY', category: '부검', price: getPriceByCode('NECROPSY')?.price ?? 20000 };

  // 체중/체온
  if (n.includes('체중') || n.includes('체온'))
    return { code: 'BW_TEMP', category: '체중/체온', price: getPriceByCode('BW_TEMP')?.price ?? 10000 };

  // 기타 측정
  return { code: 'MISC', category: '측정', price: 30000 };
}

export function calculateCostItems(input: CostInput): CostItem[] {
  sortCounter = 0;
  const items: CostItem[] = [];
  const totalAnimals = input.animalsPerGroup * input.groupCount;
  const totalDays = calculateTotalDays(input.scheduleSteps);
  const totalWeeks = calculateTotalWeeks(input.scheduleSteps);

  // 1. 동물비
  const animalPrice = getAnimalPrice(input.species, input.ageWeeks);
  items.push({
    id: uid(), category: '동물비',
    name: `${input.species} ${input.ageWeeks}주령`,
    unitPrice: animalPrice, quantity: totalAnimals, multiplier: 1,
    subtotal: animalPrice * totalAnimals,
    isOverridden: false, sortOrder: sortCounter++,
  });

  // 2. 사육비
  const housingRate = getHousingRate(input.species);
  items.push({
    id: uid(), category: '사육비',
    name: `사육비 (${housingRate.toLocaleString()}원/head/일 × ${totalDays}일)`,
    unitPrice: housingRate, quantity: totalAnimals, multiplier: totalDays,
    subtotal: housingRate * totalAnimals * totalDays,
    isOverridden: false, sortOrder: sortCounter++,
  });

  // 3. 투여 (마스터 단가표 기반)
  const adminCode = getAdminCode(input.species);
  const adminPrice = getPriceByCode(adminCode)?.price ?? 5000;
  const adminDays = input.scheduleSteps
    .filter(s => s.type === 'administration')
    .reduce((sum, s) => sum + stepToDays(s), 0) || Math.max(totalDays - 14, 7);
  items.push({
    id: uid(), category: '투여',
    name: `시험물질 투여 (${adminDays}일)`,
    unitPrice: adminPrice, quantity: totalAnimals, multiplier: adminDays,
    subtotal: adminPrice * totalAnimals * adminDays,
    isOverridden: false, sortOrder: sortCounter++,
  });

  // 4. 체중/체온 측정 (마스터 단가)
  const bwPrice = getPriceByCode('BW_TEMP')?.price ?? 10000;
  items.push({
    id: uid(), category: '체중/체온',
    name: `체중측정 (주1회 × ${totalWeeks}회)`,
    unitPrice: bwPrice, quantity: totalAnimals, multiplier: totalWeeks,
    subtotal: bwPrice * totalAnimals * totalWeeks,
    isOverridden: false, sortOrder: sortCounter++,
  });

  // 5. 평가항목 (마스터 단가 매핑)
  const enabledEvals = input.evalItems.filter(e => e.enabled);
  for (const ev of enabledEvals) {
    const matched = matchEvalToPrice(ev.name);
    items.push({
      id: uid(), category: matched.category,
      name: ev.name,
      unitPrice: matched.price, quantity: totalAnimals, multiplier: 1,
      subtotal: matched.price * totalAnimals,
      isOverridden: false, sortOrder: sortCounter++,
    });
  }

  // 6. 부검
  const necroPrice = getPriceByCode('NECROPSY')?.price ?? 20000;
  items.push({
    id: uid(), category: '부검',
    name: '부검 (장기무게 등)',
    unitPrice: necroPrice, quantity: totalAnimals, multiplier: 1,
    subtotal: necroPrice * totalAnimals,
    isOverridden: false, sortOrder: sortCounter++,
  });

  // 7. 보고서 + 기타 (마스터 단가)
  const reportPrice = getPriceByCode('REPORT_ETC')?.price ?? 3000000;
  items.push({
    id: uid(), category: '기타',
    name: '보고서 작성 및 기타',
    unitPrice: reportPrice, quantity: 1, multiplier: 1,
    subtotal: reportPrice,
    isOverridden: false, sortOrder: sortCounter++,
  });

  return items;
}

export function calculateTotalCost(items: CostItem[]): number {
  return items.reduce((sum, item) => sum + item.subtotal, 0);
}

export function calculateCostByCategory(items: CostItem[]): { name: string; value: number }[] {
  const map: Record<string, number> = {};
  for (const item of items) {
    map[item.category] = (map[item.category] || 0) + item.subtotal;
  }
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}
