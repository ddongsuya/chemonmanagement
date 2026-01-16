// 노출량 마진 계산 유틸리티
import { SPECIES_DATA, HUMAN_KM } from '@/types/calculator';

export interface ExposureMarginInput {
  animalNoael: number; // mg/kg/day
  animalSpecies: string;
  humanDose: number; // mg/kg/day 또는 mg/person/day
  humanDoseUnit: 'kg' | 'person';
  humanWeight?: number; // kg (기본 60)
  animalAUC?: number; // 동물 AUC (선택)
  humanAUC?: number; // 사람 AUC (선택)
}

export interface ExposureMarginResult {
  safetyMargin: number;
  hedBasedMargin: number;
  aucBasedMargin: number | null;
  humanDosePerKg: number;
  hed: number;
  recommendation: string;
  calculationSteps: string[];
}

/**
 * Safety Margin 계산
 * SM = NOAEL / Human Dose (HED 기준)
 */
export function calculateSafetyMargin(input: ExposureMarginInput): ExposureMarginResult {
  const calculationSteps: string[] = [];
  const humanWeight = input.humanWeight || 60;
  
  // 사람 용량 mg/kg로 통일
  const humanDosePerKg = input.humanDoseUnit === 'person' 
    ? input.humanDose / humanWeight 
    : input.humanDose;
  
  calculationSteps.push(`=== 입력 데이터 ===`);
  calculationSteps.push(`동물 NOAEL: ${input.animalNoael} mg/kg/day (${SPECIES_DATA[input.animalSpecies]?.name || input.animalSpecies})`);
  calculationSteps.push(`사람 용량: ${input.humanDose} mg/${input.humanDoseUnit}/day`);
  if (input.humanDoseUnit === 'person') {
    calculationSteps.push(`  → ${humanDosePerKg.toFixed(4)} mg/kg/day (체중 ${humanWeight}kg 기준)`);
  }
  
  // HED 계산
  const species = SPECIES_DATA[input.animalSpecies];
  const hed = species 
    ? input.animalNoael * (species.km / HUMAN_KM)
    : input.animalNoael;
  
  calculationSteps.push('');
  calculationSteps.push(`=== HED 계산 ===`);
  if (species) {
    calculationSteps.push(`HED = NOAEL × (Km_animal / Km_human)`);
    calculationSteps.push(`    = ${input.animalNoael} × (${species.km} / ${HUMAN_KM})`);
    calculationSteps.push(`    = ${hed.toFixed(4)} mg/kg/day`);
  } else {
    calculationSteps.push(`HED = NOAEL (동물종 정보 없음)`);
  }
  
  // Safety Margin (용량 기반)
  const safetyMargin = input.animalNoael / humanDosePerKg;
  calculationSteps.push('');
  calculationSteps.push(`=== Safety Margin (용량 기반) ===`);
  calculationSteps.push(`SM = NOAEL / Human Dose`);
  calculationSteps.push(`   = ${input.animalNoael} / ${humanDosePerKg.toFixed(4)}`);
  calculationSteps.push(`   = ${safetyMargin.toFixed(2)}배`);
  
  // HED 기반 마진
  const hedBasedMargin = hed / humanDosePerKg;
  calculationSteps.push('');
  calculationSteps.push(`=== HED 기반 마진 ===`);
  calculationSteps.push(`HED Margin = HED / Human Dose`);
  calculationSteps.push(`           = ${hed.toFixed(4)} / ${humanDosePerKg.toFixed(4)}`);
  calculationSteps.push(`           = ${hedBasedMargin.toFixed(2)}배`);
  
  // AUC 기반 마진 (데이터가 있는 경우)
  let aucBasedMargin: number | null = null;
  if (input.animalAUC && input.humanAUC) {
    aucBasedMargin = input.animalAUC / input.humanAUC;
    calculationSteps.push('');
    calculationSteps.push(`=== AUC 기반 마진 ===`);
    calculationSteps.push(`AUC Margin = Animal AUC / Human AUC`);
    calculationSteps.push(`           = ${input.animalAUC} / ${input.humanAUC}`);
    calculationSteps.push(`           = ${aucBasedMargin.toFixed(2)}배`);
  }
  
  // 권고사항
  let recommendation: string;
  const primaryMargin = hedBasedMargin;
  
  if (primaryMargin >= 10) {
    recommendation = `✓ HED 기반 마진이 ${primaryMargin.toFixed(1)}배로 충분합니다. 일반적인 안전역(10배) 이상 확보되었습니다.`;
  } else if (primaryMargin >= 3) {
    recommendation = `⚠ HED 기반 마진이 ${primaryMargin.toFixed(1)}배입니다. 추가적인 안전성 평가가 권장됩니다.`;
  } else {
    recommendation = `⚠ HED 기반 마진이 ${primaryMargin.toFixed(1)}배로 낮습니다. 용량 조정 또는 추가 독성시험을 고려하세요.`;
  }
  
  calculationSteps.push('');
  calculationSteps.push(`=== 평가 ===`);
  calculationSteps.push(recommendation);
  
  return {
    safetyMargin,
    hedBasedMargin,
    aucBasedMargin,
    humanDosePerKg,
    hed,
    recommendation,
    calculationSteps
  };
}

/**
 * 다종 노출량 마진 비교
 */
export function compareMultiSpeciesMargin(
  inputs: { species: string; noael: number; auc?: number }[],
  humanDose: number,
  humanDoseUnit: 'kg' | 'person',
  humanWeight?: number,
  humanAUC?: number
): { results: { species: string; noael: number; hed: number; margin: number; aucMargin?: number }[]; mostConservative: string; calculationSteps: string[] } {
  const weight = humanWeight || 60;
  const humanDosePerKg = humanDoseUnit === 'person' ? humanDose / weight : humanDose;
  const calculationSteps: string[] = [];
  
  const results = inputs.map(input => {
    const species = SPECIES_DATA[input.species];
    const hed = species ? input.noael * (species.km / HUMAN_KM) : input.noael;
    const margin = hed / humanDosePerKg;
    const aucMargin = input.auc && humanAUC ? input.auc / humanAUC : undefined;
    
    return {
      species: species?.name || input.species,
      noael: input.noael,
      hed,
      margin,
      aucMargin
    };
  });
  
  // 가장 보수적인 결과 (가장 낮은 마진)
  results.sort((a, b) => a.margin - b.margin);
  const mostConservative = results[0]?.species || '';
  
  calculationSteps.push(`사람 용량: ${humanDosePerKg.toFixed(4)} mg/kg/day`);
  calculationSteps.push('');
  results.forEach(r => {
    calculationSteps.push(`[${r.species}] NOAEL: ${r.noael} mg/kg → HED: ${r.hed.toFixed(4)} mg/kg → 마진: ${r.margin.toFixed(2)}배`);
  });
  calculationSteps.push('');
  calculationSteps.push(`★ 가장 보수적: ${mostConservative} (마진 ${results[0]?.margin.toFixed(2)}배)`);
  
  return { results, mostConservative, calculationSteps };
}

/**
 * 목표 마진 달성을 위한 최대 사람 용량 계산
 */
export function calculateMaxHumanDose(
  animalNoael: number,
  animalSpecies: string,
  targetMargin: number,
  humanWeight?: number
): { maxDosePerKg: number; maxDosePerPerson: number; calculationSteps: string[] } {
  const calculationSteps: string[] = [];
  const weight = humanWeight || 60;
  
  const species = SPECIES_DATA[animalSpecies];
  const hed = species ? animalNoael * (species.km / HUMAN_KM) : animalNoael;
  
  calculationSteps.push(`동물 NOAEL: ${animalNoael} mg/kg/day`);
  calculationSteps.push(`HED: ${hed.toFixed(4)} mg/kg/day`);
  calculationSteps.push(`목표 마진: ${targetMargin}배`);
  calculationSteps.push('');
  
  const maxDosePerKg = hed / targetMargin;
  const maxDosePerPerson = maxDosePerKg * weight;
  
  calculationSteps.push(`최대 사람 용량 = HED / 목표 마진`);
  calculationSteps.push(`              = ${hed.toFixed(4)} / ${targetMargin}`);
  calculationSteps.push(`              = ${maxDosePerKg.toFixed(4)} mg/kg/day`);
  calculationSteps.push(`              = ${maxDosePerPerson.toFixed(2)} mg/person/day (${weight}kg 기준)`);
  
  return { maxDosePerKg, maxDosePerPerson, calculationSteps };
}
