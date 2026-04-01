// lib/efficacy-v2/cost-engine.ts
// 효력시험 비용 계산 엔진 — master-data 단가표 + 모델 특성 기반

import type { CostItem, ScheduleStep } from '@/types/efficacy-v2';
import { getAnimalPrice, getHousingRate } from './animal-prices';
import { getPriceByCode } from './master-data';

export interface CostInput {
  species: string;
  ageWeeks: number;
  animalsPerGroup: number;
  groupCount: number;
  scheduleSteps: ScheduleStep[];
  evalItems: { name: string; enabled: boolean }[];
  reportWeeks: number;
  // 모델 특성 (마스터 데이터 매핑용)
  inductionMethod?: string;
  isInVitro?: boolean;
  cellLine?: string;
  categoryCode?: string;
  positiveControl?: string;
}

let sortCounter = 0;
function uid(): string { return Math.random().toString(36).slice(2, 10); }

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

/** 유발방법 → 마스터 단가 코드 매핑 */
function getInductionCost(method: string, species: string): { code: string; name: string; price: number } | null {
  if (!method) return null;
  const m = method.toLowerCase();

  if (m.includes('tac') || m.includes('transverse aortic'))
    return { code: 'MODEL_TAC', name: 'TAC 심부전 모델', price: getPriceByCode('MODEL_TAC')?.price ?? 500000 };
  if (m.includes('snl'))
    return { code: 'MODEL_SNL', name: 'SNL 통증 모델', price: getPriceByCode('MODEL_SNL')?.price ?? 300000 };
  if (m.includes('cci') || m.includes('chronic constriction'))
    return { code: 'MODEL_CCI', name: 'CCI 통증 모델', price: getPriceByCode('MODEL_CCI')?.price ?? 200000 };
  if (m.includes('mia') || m.includes('monosodium'))
    return { code: 'MODEL_MIA', name: 'MIA 골관절염', price: getPriceByCode('MODEL_MIA')?.price ?? 50000 };
  if (m.includes('amyloid') || m.includes('뇌실내'))
    return { code: 'MODEL_AMYLOID', name: '치매 amyloid beta', price: getPriceByCode('MODEL_AMYLOID')?.price ?? 100000 };
  if (m.includes('6-ohda') || m.includes('6-hydroxydopamine'))
    return { code: 'MODEL_PARKINSON', name: '파킨슨 모델', price: getPriceByCode('MODEL_PARKINSON')?.price ?? 120000 };
  if (m.includes('aclt') || m.includes('십자인대')) {
    const s = species.toLowerCase();
    if (s.includes('rabbit') || s.includes('토끼'))
      return { code: 'MODEL_OA_RABBIT', name: '골관절염 ACLT(토끼)', price: getPriceByCode('MODEL_OA_RABBIT')?.price ?? 200000 };
    if (s.includes('rat'))
      return { code: 'MODEL_OA_RAT', name: '골관절염 ACLT(랫드)', price: getPriceByCode('MODEL_OA_RAT')?.price ?? 100000 };
    return { code: 'MODEL_OA_MOUSE', name: '골관절염 ACLT(마우스)', price: getPriceByCode('MODEL_OA_MOUSE')?.price ?? 100000 };
  }
  if (m.includes('ovalbumin') || m.includes('ova'))
    return { code: 'MODEL_OVA', name: 'OVA 만성천식모델', price: getPriceByCode('MODEL_OVA')?.price ?? 100000 };
  if (m.includes('hpd'))
    return { code: 'MODEL_HPD', name: 'HPD 비글견 수술', price: getPriceByCode('MODEL_HPD')?.price ?? 5000000 };
  // 일반 화학물질 유도 (STZ, bleomycin, scopolamine, loperamide 등)
  if (m.includes('stz') || m.includes('streptozotocin') || m.includes('bleomycin') ||
      m.includes('scopolamine') || m.includes('loperamide') || m.includes('cyp') ||
      m.includes('collagen') || m.includes('carrageenan') || m.includes('aspirin') ||
      m.includes('hcl') || m.includes('에탄올') || m.includes('formalin') ||
      m.includes('capsaicin') || m.includes('lps') || m.includes('dncb') ||
      m.includes('phenol') || m.includes('citric'))
    return { code: 'MODEL_CHEM', name: '화학물질 유도 모델', price: getPriceByCode('MODEL_CHEM')?.price ?? 30000 };

  // 수술 기반 (요도폐색, 신장적출, MCAO, 절개 등)
  if (m.includes('수술') || m.includes('폐색') || m.includes('적출') || m.includes('mcao') ||
      m.includes('절개') || m.includes('결찰') || m.includes('contusion') || m.includes('nephrectomy'))
    return { code: 'MODEL_CCI', name: '수술 기반 모델', price: getPriceByCode('MODEL_CCI')?.price ?? 200000 };

  return { code: 'MODEL_CHEM', name: '질환유발', price: 30000 };
}

/** 동물종에 따른 투여 단가 */
function getAdminPrice(species: string): { code: string; price: number; isLarge: boolean } {
  const s = species.toLowerCase();
  if (s.includes('beagle') || s.includes('dog'))
    return { code: 'ADMIN_LG_PO_IM', price: getPriceByCode('ADMIN_LG_PO_IM')?.price ?? 10000, isLarge: true };
  if (s.includes('pig') || s.includes('돼지') || s.includes('yucatan'))
    return { code: 'ADMIN_LG_PO_IM', price: getPriceByCode('ADMIN_LG_PO_IM')?.price ?? 10000, isLarge: true };
  return { code: 'ADMIN_PO_IP_IM', price: getPriceByCode('ADMIN_PO_IP_IM')?.price ?? 5000, isLarge: false };
}

/** 평가항목명 → 마스터 단가 코드 매핑 */
function matchEvalToPrice(evalName: string): { code: string; category: string; price: number } {
  const n = evalName.toLowerCase();
  // 조직병리
  if (n.includes('h&e') || n.includes('collagen') || n.includes('masson') || n.includes('mt '))
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
  if (n.includes('hydroxyproline'))
    return { code: 'ELISA_LABOR', category: '분자생물학', price: 50000 };
  // 종양
  if (n.includes('종양부피') || n.includes('종양크기') || n.includes('tumor'))
    return { code: 'TUMOR_SIZE', category: '항암', price: getPriceByCode('TUMOR_SIZE')?.price ?? 5000 };
  if (n.includes('종양무게'))
    return { code: 'TUMOR_WEIGHT', category: '항암', price: getPriceByCode('TUMOR_WEIGHT')?.price ?? 5000 };
  // 채혈/혈액
  if (n.includes('혈액') || n.includes('혈당') || n.includes('혈장') || n.includes('blood') || n.includes('hematol'))
    return { code: 'BL_NECRO', category: '채혈', price: getPriceByCode('BL_NECRO')?.price ?? 15000 };
  // 부검/장기
  if (n.includes('부검') || n.includes('장기무게') || n.includes('necropsy'))
    return { code: 'NECROPSY', category: '부검', price: getPriceByCode('NECROPSY')?.price ?? 20000 };
  // 체중/체온
  if (n.includes('체중') || n.includes('체온'))
    return { code: 'BW_TEMP', category: '체중/체온', price: getPriceByCode('BW_TEMP')?.price ?? 10000 };
  // 위산
  if (n.includes('위액') || n.includes('위산') || n.includes('ph'))
    return { code: 'GASTRIC_PH', category: '분자생물학', price: getPriceByCode('GASTRIC_PH')?.price ?? 20000 };
  // 요역동학/특수
  if (n.includes('요역동학') || n.includes('hemodynamics'))
    return { code: 'HEMODY', category: '영상', price: getPriceByCode('HEMODY')?.price ?? 500000 };
  // 기타 측정
  return { code: 'MISC', category: '측정', price: 30000 };
}

export function calculateCostItems(input: CostInput): CostItem[] {
  sortCounter = 0;
  const items: CostItem[] = [];
  const totalAnimals = input.animalsPerGroup * input.groupCount;
  const totalDays = calculateTotalDays(input.scheduleSteps);
  const totalWeeks = calculateTotalWeeks(input.scheduleSteps);
  const isOncology = input.categoryCode === 'XIII';
  const isInVitro = input.isInVitro ?? false;

  // ── 1. 동물비 (in vitro 제외) ──
  if (!isInVitro) {
    const animalPrice = getAnimalPrice(input.species, input.ageWeeks);
    items.push({
      id: uid(), category: '동물비',
      name: `${input.species} ${input.ageWeeks}주령`,
      unitPrice: animalPrice, quantity: totalAnimals, multiplier: 1,
      subtotal: animalPrice * totalAnimals,
      isOverridden: false, sortOrder: sortCounter++,
    });
  }

  // ── 2. 사육비 (in vitro 제외) ──
  if (!isInVitro) {
    const housingRate = getHousingRate(input.species);
    items.push({
      id: uid(), category: '사육비',
      name: `사육비 (${housingRate.toLocaleString()}원/head/일 × ${totalDays}일)`,
      unitPrice: housingRate, quantity: totalAnimals, multiplier: totalDays,
      subtotal: housingRate * totalAnimals * totalDays,
      isOverridden: false, sortOrder: sortCounter++,
    });
  }

  // ── 3. 질환유발모델 비용 ──
  const induction = getInductionCost(input.inductionMethod ?? '', input.species);
  if (induction && !isInVitro) {
    items.push({
      id: uid(), category: '질환유발모델',
      name: induction.name,
      unitPrice: induction.price, quantity: totalAnimals, multiplier: 1,
      subtotal: induction.price * totalAnimals,
      isOverridden: false, sortOrder: sortCounter++,
    });
  }

  // ── 4. 항암 전용: 세포배양 + 세포주 + 종양이식 ──
  if (isOncology && input.cellLine) {
    // 세포배양비 (2주)
    const cultureDays = 14;
    const culturePrice = getPriceByCode('CELL_CULTURE')?.price ?? 100000;
    items.push({
      id: uid(), category: '항암',
      name: `세포배양 (${input.cellLine}, ${cultureDays}일)`,
      unitPrice: culturePrice, quantity: 1, multiplier: cultureDays,
      subtotal: culturePrice * cultureDays,
      isOverridden: false, sortOrder: sortCounter++,
    });
    // 세포주 구입
    const cellPrice = getPriceByCode('CELL_DOMESTIC')?.price ?? 300000;
    items.push({
      id: uid(), category: '항암',
      name: `세포주 (${input.cellLine})`,
      unitPrice: cellPrice, quantity: 1, multiplier: 1,
      subtotal: cellPrice,
      isOverridden: false, sortOrder: sortCounter++,
    });
    // 종양 이식 (피하)
    const tumorPrice = getPriceByCode('TUMOR_SC')?.price ?? 70000;
    items.push({
      id: uid(), category: '항암',
      name: '암세포 피하투여',
      unitPrice: tumorPrice, quantity: totalAnimals, multiplier: 1,
      subtotal: tumorPrice * totalAnimals,
      isOverridden: false, sortOrder: sortCounter++,
    });
  }

  // ── 5. in vitro 전용: 세포배양비 ──
  if (isInVitro && input.cellLine) {
    const culturePrice = getPriceByCode('CELL_CULTURE')?.price ?? 100000;
    items.push({
      id: uid(), category: '세포실험',
      name: `세포배양 (${input.cellLine})`,
      unitPrice: culturePrice, quantity: 1, multiplier: totalDays,
      subtotal: culturePrice * totalDays,
      isOverridden: false, sortOrder: sortCounter++,
    });
  }

  // ── 6. 투여 (in vitro 제외) ──
  if (!isInVitro) {
    const admin = getAdminPrice(input.species);
    const adminDays = input.scheduleSteps
      .filter(s => s.type === 'administration')
      .reduce((sum, s) => sum + stepToDays(s), 0) || Math.max(Math.round(totalDays * 0.4), 7);
    items.push({
      id: uid(), category: '투여',
      name: `시험물질 투여 (${adminDays}일)`,
      unitPrice: admin.price, quantity: totalAnimals, multiplier: adminDays,
      subtotal: admin.price * totalAnimals * adminDays,
      isOverridden: false, sortOrder: sortCounter++,
    });
  }

  // ── 7. 체중/체온 측정 ──
  if (!isInVitro) {
    const bwPrice = getPriceByCode('BW_TEMP')?.price ?? 10000;
    items.push({
      id: uid(), category: '체중/체온',
      name: `체중측정 (주1회 × ${totalWeeks}회)`,
      unitPrice: bwPrice, quantity: totalAnimals, multiplier: totalWeeks,
      subtotal: bwPrice * totalAnimals * totalWeeks,
      isOverridden: false, sortOrder: sortCounter++,
    });
  }

  // ── 8. 평가항목 (마스터 단가 매핑) ──
  const enabledEvals = input.evalItems.filter(e => e.enabled);
  for (const ev of enabledEvals) {
    const matched = matchEvalToPrice(ev.name);
    const qty = isInVitro ? 1 : totalAnimals;
    items.push({
      id: uid(), category: matched.category,
      name: ev.name,
      unitPrice: matched.price, quantity: qty, multiplier: 1,
      subtotal: matched.price * qty,
      isOverridden: false, sortOrder: sortCounter++,
    });
  }

  // ── 9. 부검 (in vitro 제외) ──
  if (!isInVitro) {
    const necroPrice = getPriceByCode('NECROPSY')?.price ?? 20000;
    items.push({
      id: uid(), category: '부검',
      name: '부검 (장기무게 등)',
      unitPrice: necroPrice, quantity: totalAnimals, multiplier: 1,
      subtotal: necroPrice * totalAnimals,
      isOverridden: false, sortOrder: sortCounter++,
    });
  }

  // ── 10. 보고서 + 기타 ──
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
