// lib/efficacy-v2/cost-engine.ts
// 효력시험 비용 계산 엔진

import type { CostItem, ScheduleStep, StudyModelTemplate } from '@/types/efficacy-v2';
import { getAnimalPrice, getHousingRate } from './animal-prices';

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
  return 1; // hour → 1 day minimum
}

/**
 * 스케줄 총 일수 계산
 */
export function calculateTotalDays(steps: ScheduleStep[]): number {
  return steps.reduce((sum, s) => sum + stepToDays(s), 0);
}

/**
 * 스케줄 총 주수 계산
 */
export function calculateTotalWeeks(steps: ScheduleStep[]): number {
  return Math.ceil(calculateTotalDays(steps) / 7);
}

/**
 * 비용 항목 계산
 */
export function calculateCostItems(input: CostInput): CostItem[] {
  sortCounter = 0;
  const items: CostItem[] = [];
  const totalAnimals = input.animalsPerGroup * input.groupCount;
  const totalDays = calculateTotalDays(input.scheduleSteps);
  const totalWeeks = calculateTotalWeeks(input.scheduleSteps);

  // 1. 동물비
  const animalPrice = getAnimalPrice(input.species, input.ageWeeks);
  items.push({
    id: uid(),
    category: '동물비',
    name: `${input.species} ${input.ageWeeks}주령`,
    unitPrice: animalPrice,
    quantity: totalAnimals,
    multiplier: 1,
    subtotal: animalPrice * totalAnimals,
    isOverridden: false,
    sortOrder: sortCounter++,
  });

  // 2. 사육비
  const housingRate = getHousingRate(input.species);
  items.push({
    id: uid(),
    category: '사육비',
    name: `사육비 (${totalDays}일)`,
    unitPrice: housingRate,
    quantity: totalAnimals,
    multiplier: totalDays,
    subtotal: housingRate * totalAnimals * totalDays,
    isOverridden: false,
    sortOrder: sortCounter++,
  });

  // 3. 투여
  items.push({
    id: uid(),
    category: '투여',
    name: '시험물질 투여',
    unitPrice: 50000,
    quantity: totalAnimals,
    multiplier: 1,
    subtotal: 50000 * totalAnimals,
    isOverridden: false,
    sortOrder: sortCounter++,
  });

  // 4. 체중측정
  items.push({
    id: uid(),
    category: '체중측정',
    name: `체중측정 (주1회×${totalWeeks}회)`,
    unitPrice: 3000,
    quantity: totalAnimals,
    multiplier: totalWeeks,
    subtotal: 3000 * totalAnimals * totalWeeks,
    isOverridden: false,
    sortOrder: sortCounter++,
  });

  // 5. 평가항목
  const enabledEvals = input.evalItems.filter(e => e.enabled);
  for (const ev of enabledEvals) {
    const isHistopath = ev.name.includes('조직병리') || ev.name.includes('H&E') || ev.name.includes('staining') || ev.name.includes('Histological');
    const isImaging = ev.name.includes('CT') || ev.name.includes('MRI') || ev.name.includes('Micro-CT') || ev.name.includes('DEXA');
    const isBehavior = ev.name.includes('행동') || ev.name.includes('maze') || ev.name.includes('Rotarod') || ev.name.includes('Von Frey') || ev.name.includes('BBB');

    let price: number;
    let category: string;
    if (isHistopath) {
      price = 100000;
      category = '조직병리';
    } else if (isImaging) {
      price = 300000;
      category = '영상';
    } else if (isBehavior) {
      price = 70000;
      category = '행동평가';
    } else {
      price = 50000;
      category = '측정';
    }

    items.push({
      id: uid(),
      category,
      name: ev.name,
      unitPrice: price,
      quantity: totalAnimals,
      multiplier: 1,
      subtotal: price * totalAnimals,
      isOverridden: false,
      sortOrder: sortCounter++,
    });
  }

  // 6. 보고서 작성 및 기타
  items.push({
    id: uid(),
    category: '기타',
    name: '보고서 작성 및 기타',
    unitPrice: 3000000,
    quantity: 1,
    multiplier: 1,
    subtotal: 3000000,
    isOverridden: false,
    sortOrder: sortCounter++,
  });

  return items;
}

/**
 * 비용 합계
 */
export function calculateTotalCost(items: CostItem[]): number {
  return items.reduce((sum, item) => sum + item.subtotal, 0);
}

/**
 * 카테고리별 비용 집계
 */
export function calculateCostByCategory(items: CostItem[]): { name: string; value: number }[] {
  const map: Record<string, number> = {};
  for (const item of items) {
    map[item.category] = (map[item.category] || 0) + item.subtotal;
  }
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}
