// 희석 계산 유틸리티

export interface DilutionInput {
  c1: number; // 초기 농도
  v1?: number; // 초기 부피
  c2: number; // 최종 농도
  v2?: number; // 최종 부피
}

export interface DilutionResult {
  c1: number;
  v1: number;
  c2: number;
  v2: number;
  diluentVolume: number;
  dilutionFactor: number;
  calculationSteps: string[];
}

/**
 * C1V1 = C2V2 계산
 */
export function calculateDilution(input: DilutionInput): DilutionResult {
  const calculationSteps: string[] = [];
  let { c1, v1, c2, v2 } = input;
  
  calculationSteps.push('C1 × V1 = C2 × V2');
  
  // V1 계산 (V2가 주어진 경우)
  if (v2 !== undefined && v1 === undefined) {
    v1 = (c2 * v2) / c1;
    calculationSteps.push(`V1 = (C2 × V2) / C1`);
    calculationSteps.push(`V1 = (${c2} × ${v2}) / ${c1}`);
    calculationSteps.push(`V1 = ${v1.toFixed(4)} mL`);
  }
  // V2 계산 (V1이 주어진 경우)
  else if (v1 !== undefined && v2 === undefined) {
    v2 = (c1 * v1) / c2;
    calculationSteps.push(`V2 = (C1 × V1) / C2`);
    calculationSteps.push(`V2 = (${c1} × ${v1}) / ${c2}`);
    calculationSteps.push(`V2 = ${v2.toFixed(4)} mL`);
  }
  
  const diluentVolume = (v2 || 0) - (v1 || 0);
  const dilutionFactor = c1 / c2;
  
  calculationSteps.push('');
  calculationSteps.push(`희석액 부피 = V2 - V1 = ${(v2 || 0).toFixed(4)} - ${(v1 || 0).toFixed(4)} = ${diluentVolume.toFixed(4)} mL`);
  calculationSteps.push(`희석 배수 = C1 / C2 = ${c1} / ${c2} = ${dilutionFactor.toFixed(2)}배`);
  
  return {
    c1,
    v1: v1 || 0,
    c2,
    v2: v2 || 0,
    diluentVolume,
    dilutionFactor,
    calculationSteps
  };
}

/**
 * 연속 희석 계산
 */
export function calculateSerialDilution(
  stockConcentration: number,
  targetConcentrations: number[],
  finalVolume: number
): { steps: { step: number; concentration: number; stockVolume: number; diluentVolume: number }[]; calculationSteps: string[] } {
  const calculationSteps: string[] = [];
  const steps: { step: number; concentration: number; stockVolume: number; diluentVolume: number }[] = [];
  
  calculationSteps.push(`Stock 농도: ${stockConcentration}`);
  calculationSteps.push(`최종 부피: ${finalVolume} mL`);
  calculationSteps.push('');
  
  for (let i = 0; i < targetConcentrations.length; i++) {
    const targetConc = targetConcentrations[i];
    const stockVolume = (targetConc * finalVolume) / stockConcentration;
    const diluentVolume = finalVolume - stockVolume;
    
    steps.push({
      step: i + 1,
      concentration: targetConc,
      stockVolume,
      diluentVolume
    });
    
    calculationSteps.push(`Step ${i + 1}: ${targetConc} 농도`);
    calculationSteps.push(`  Stock ${stockVolume.toFixed(4)} mL + 희석액 ${diluentVolume.toFixed(4)} mL = ${finalVolume} mL`);
  }
  
  return { steps, calculationSteps };
}

/**
 * Stock Solution 제조 계산
 */
export function calculateStockSolution(
  substanceWeight: number, // mg
  targetConcentration: number, // mg/mL
  purity?: number // % (기본 100%)
): { volume: number; actualWeight: number; calculationSteps: string[] } {
  const calculationSteps: string[] = [];
  const actualPurity = purity || 100;
  
  // 순도 보정
  const actualWeight = substanceWeight * (actualPurity / 100);
  calculationSteps.push(`물질 무게: ${substanceWeight} mg`);
  if (purity && purity < 100) {
    calculationSteps.push(`순도 보정: ${substanceWeight} × ${actualPurity}% = ${actualWeight.toFixed(4)} mg (실제 활성 물질)`);
  }
  
  const volume = actualWeight / targetConcentration;
  calculationSteps.push(`목표 농도: ${targetConcentration} mg/mL`);
  calculationSteps.push(`필요 부피 = ${actualWeight.toFixed(4)} mg ÷ ${targetConcentration} mg/mL = ${volume.toFixed(4)} mL`);
  
  return { volume, actualWeight, calculationSteps };
}

/**
 * 농도 단위 변환
 */
export function convertConcentrationUnit(
  value: number,
  fromUnit: 'mg/mL' | 'μg/mL' | 'ng/mL' | 'M' | 'mM' | 'μM' | 'nM',
  toUnit: 'mg/mL' | 'μg/mL' | 'ng/mL' | 'M' | 'mM' | 'μM' | 'nM',
  molecularWeight?: number // g/mol (몰 농도 변환 시 필요)
): { convertedValue: number; calculationSteps: string[] } {
  const calculationSteps: string[] = [];
  
  // 질량 농도 변환 계수 (mg/mL 기준)
  const massFactors: Record<string, number> = {
    'mg/mL': 1,
    'μg/mL': 0.001,
    'ng/mL': 0.000001,
  };
  
  // 몰 농도 변환 계수 (M 기준)
  const molarFactors: Record<string, number> = {
    'M': 1,
    'mM': 0.001,
    'μM': 0.000001,
    'nM': 0.000000001,
  };
  
  let convertedValue: number;
  
  // 질량 농도 간 변환
  if (massFactors[fromUnit] !== undefined && massFactors[toUnit] !== undefined) {
    convertedValue = value * (massFactors[fromUnit] / massFactors[toUnit]);
    calculationSteps.push(`${value} ${fromUnit} = ${convertedValue.toFixed(6)} ${toUnit}`);
  }
  // 몰 농도 간 변환
  else if (molarFactors[fromUnit] !== undefined && molarFactors[toUnit] !== undefined) {
    convertedValue = value * (molarFactors[fromUnit] / molarFactors[toUnit]);
    calculationSteps.push(`${value} ${fromUnit} = ${convertedValue.toFixed(6)} ${toUnit}`);
  }
  // 질량 → 몰 농도 변환
  else if (massFactors[fromUnit] !== undefined && molarFactors[toUnit] !== undefined) {
    if (!molecularWeight) throw new Error('분자량이 필요합니다');
    const mgPerMl = value * massFactors[fromUnit];
    const molar = (mgPerMl / molecularWeight) * 1000; // mg/mL → M
    convertedValue = molar / molarFactors[toUnit];
    calculationSteps.push(`${value} ${fromUnit} = ${mgPerMl} mg/mL`);
    calculationSteps.push(`= (${mgPerMl} / ${molecularWeight}) × 1000 M`);
    calculationSteps.push(`= ${convertedValue.toFixed(6)} ${toUnit}`);
  }
  // 몰 → 질량 농도 변환
  else if (molarFactors[fromUnit] !== undefined && massFactors[toUnit] !== undefined) {
    if (!molecularWeight) throw new Error('분자량이 필요합니다');
    const molar = value * molarFactors[fromUnit];
    const mgPerMl = molar * molecularWeight / 1000; // M → mg/mL
    convertedValue = mgPerMl / massFactors[toUnit];
    calculationSteps.push(`${value} ${fromUnit} = ${molar} M`);
    calculationSteps.push(`= ${molar} × ${molecularWeight} / 1000 mg/mL`);
    calculationSteps.push(`= ${convertedValue.toFixed(6)} ${toUnit}`);
  }
  else {
    throw new Error('지원하지 않는 단위 변환입니다');
  }
  
  return { convertedValue, calculationSteps };
}
