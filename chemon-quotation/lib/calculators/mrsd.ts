import { 
  SPECIES_DATA, 
  HUMAN_KM, 
  SpeciesNoaelInput, 
  MRSDResult, 
  MRSDCalculationResult,
  PADComparison 
} from '@/types/calculator';

/**
 * HED (Human Equivalent Dose) 계산
 */
export function calculateHED(noael: number, animalKm: number): number {
  return noael * (animalKm / HUMAN_KM);
}

/**
 * 생체이용률 보정
 */
export function correctForBioavailability(dose: number, bioavailability: number): number {
  if (bioavailability >= 100) return dose;
  return dose * (bioavailability / 100);
}

/**
 * MRSD 계산 (정방향: 동물 NOAEL → 사람 MRSD)
 */
export function calculateMRSDForward(
  inputs: SpeciesNoaelInput[],
  humanWeight: number,
  safetyFactor: number,
  padValue?: number,
  padBasis?: 'animal' | 'invitro' | 'pk' | 'literature'
): MRSDCalculationResult {
  const results: MRSDResult[] = [];
  const calculationSteps: string[] = [];

  for (const input of inputs) {
    if (!input.noael || input.noael <= 0) continue;

    const species = SPECIES_DATA[input.speciesKey];
    if (!species) continue;

    // 생체이용률 보정
    let correctedNoael = input.noael;
    if (input.route !== 'iv' && input.bioavailability < 100) {
      correctedNoael = correctForBioavailability(input.noael, input.bioavailability);
      calculationSteps.push(
        `[${species.name}] 생체이용률 보정: ${input.noael} mg/kg × ${input.bioavailability}% = ${correctedNoael.toFixed(4)} mg/kg`
      );
    }

    // HED 계산
    const hed = calculateHED(correctedNoael, species.km);
    calculationSteps.push(
      `[${species.name}] HED = ${correctedNoael.toFixed(4)} mg/kg × (Km ${species.km} ÷ 37) = ${hed.toFixed(4)} mg/kg`
    );

    // MRSD 계산
    const mrsd = hed / safetyFactor;
    const mrsdTotal = mrsd * humanWeight;
    calculationSteps.push(
      `[${species.name}] MRSD = ${hed.toFixed(4)} ÷ SF(${safetyFactor}) = ${mrsd.toFixed(4)} mg/kg = ${mrsdTotal.toFixed(2)} mg/person`
    );

    results.push({
      species,
      noael: input.noael,
      route: input.route,
      bioavailability: input.bioavailability,
      correctedNoael,
      hed,
      mrsd,
      mrsdTotal,
    });
  }

  // 가장 보수적인 결과 선택 (가장 낮은 MRSD)
  results.sort((a, b) => a.mrsd - b.mrsd);
  const mostConservative = results.length > 0 ? results[0] : null;

  // PAD 비교
  let padComparison: PADComparison | null = null;
  if (padValue && mostConservative) {
    const ratio = mostConservative.mrsd / padValue;
    let recommendation: string;

    if (ratio >= 1) {
      recommendation = `NOAEL 기반 MRSD가 PAD보다 ${ratio.toFixed(1)}배 높습니다. FIH에서 약효를 관찰할 가능성이 높습니다.`;
    } else {
      recommendation = `NOAEL 기반 MRSD가 PAD보다 ${(1/ratio).toFixed(1)}배 낮습니다. FIH에서 약효 확인이 어려울 수 있습니다. 용량 증량 전략을 고려하세요.`;
    }

    padComparison = {
      padValue,
      padBasis: padBasis || 'animal',
      mrsd: mostConservative.mrsd,
      ratio,
      recommendation,
    };
  }

  if (mostConservative) {
    calculationSteps.push('');
    calculationSteps.push(
      `★ 최종 MRSD = ${mostConservative.mrsd.toFixed(4)} mg/kg = ${mostConservative.mrsdTotal.toFixed(2)} mg/person (${mostConservative.species.name} 기준, 가장 보수적)`
    );
  }

  return {
    direction: 'forward',
    humanWeight,
    safetyFactor,
    results,
    mostConservative,
    padComparison,
    calculationSteps,
    timestamp: new Date(),
  };
}

/**
 * MRSD 역산 (역방향: 목표 용량 → 필요 동물 NOAEL)
 */
export function calculateMRSDReverse(
  targetMRSD: number,
  speciesKey: string,
  safetyFactor: number,
  humanWeight: number
): { requiredNoael: number; hed: number; calculationSteps: string[] } {
  const species = SPECIES_DATA[speciesKey];
  if (!species) {
    throw new Error(`Unknown species: ${speciesKey}`);
  }

  const calculationSteps: string[] = [];

  // 필요 HED 계산
  const hed = targetMRSD * safetyFactor;
  calculationSteps.push(
    `필요 HED = MRSD × SF = ${targetMRSD.toFixed(4)} × ${safetyFactor} = ${hed.toFixed(4)} mg/kg`
  );

  // 필요 NOAEL 계산
  const requiredNoael = hed * (HUMAN_KM / species.km);
  calculationSteps.push(
    `${species.name} 필요 NOAEL = HED × (37 ÷ Km) = ${hed.toFixed(4)} × (37 ÷ ${species.km}) = ${requiredNoael.toFixed(2)} mg/kg`
  );

  calculationSteps.push('');
  calculationSteps.push(
    `★ ${species.name}에서 NOAEL ≥ ${requiredNoael.toFixed(2)} mg/kg/day 확보 필요`
  );

  return { requiredNoael, hed, calculationSteps };
}

/**
 * 결과를 Excel 데이터로 변환
 */
export function convertToExcelData(result: MRSDCalculationResult) {
  const summarySheet = [
    ['MRSD 계산 결과 보고서', ''],
    ['', ''],
    ['계산 일시', result.timestamp.toLocaleString('ko-KR')],
    ['계산 방향', result.direction === 'forward' ? '동물 NOAEL → 사람 MRSD' : '목표 용량 → 필요 NOAEL'],
    ['사람 체중 (kg)', result.humanWeight],
    ['안전계수 (SF)', result.safetyFactor],
    ['', ''],
  ];

  if (result.mostConservative) {
    summarySheet.push(
      ['=== 최종 결과 ===', ''],
      ['가장 보수적인 동물종', result.mostConservative.species.name],
      ['권장 MRSD (mg/kg)', result.mostConservative.mrsd.toFixed(4)],
      ['권장 MRSD (mg/person)', result.mostConservative.mrsdTotal.toFixed(2)],
      ['', '']
    );
  }

  if (result.padComparison) {
    summarySheet.push(
      ['=== PAD 비교 ===', ''],
      ['PAD (mg/kg)', result.padComparison.padValue],
      ['MRSD/PAD 비율', result.padComparison.ratio.toFixed(2)],
      ['권고사항', result.padComparison.recommendation],
      ['', '']
    );
  }

  const comparisonSheet = [
    ['동물종', 'NOAEL (mg/kg)', '투여경로', '생체이용률 (%)', '보정 NOAEL', 'Km', 'HED (mg/kg)', 'MRSD (mg/kg)', 'MRSD (mg/person)', '선택'],
    ...result.results.map((r, idx) => [
      r.species.name,
      r.noael,
      r.route.toUpperCase(),
      r.bioavailability,
      r.correctedNoael.toFixed(4),
      r.species.km,
      r.hed.toFixed(4),
      r.mrsd.toFixed(4),
      r.mrsdTotal.toFixed(2),
      idx === 0 ? '✓ 가장 보수적' : '',
    ]),
  ];

  const referenceSheet = [
    ['종간 변환계수 (Km) 참조표 - FDA Guidance', '', '', '', ''],
    ['', '', '', '', ''],
    ['동물종', '체중 (kg)', 'BSA (m²)', 'Km', '변환계수'],
    ...Object.values(SPECIES_DATA).map(s => [s.name, s.weight, s.bsa, s.km, s.factor.toFixed(3)]),
    ['', '', '', '', ''],
    ['* 변환계수 = 동물 Km ÷ 사람 Km (37)', '', '', '', ''],
    ['* HED = 동물 NOAEL × 변환계수', '', '', '', ''],
    ['* Reference: FDA Guidance for Industry (2005)', '', '', '', ''],
  ];

  return { summarySheet, comparisonSheet, referenceSheet };
}
