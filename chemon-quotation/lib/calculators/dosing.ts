// 투여량 계산 유틸리티

export interface DosingInput {
  bodyWeight: number; // kg
  dosePerKg: number; // mg/kg
  concentration: number; // mg/mL
  frequency?: number; // 투여 횟수/일
}

export interface DosingResult {
  totalDose: number; // mg
  volume: number; // mL
  dailyDose?: number; // mg/day
  calculationSteps: string[];
}

/**
 * 체중 기반 투여량 계산
 */
export function calculateDose(input: DosingInput): DosingResult {
  const calculationSteps: string[] = [];
  
  // 총 투여량
  const totalDose = input.bodyWeight * input.dosePerKg;
  calculationSteps.push(`총 투여량 = 체중 × 용량`);
  calculationSteps.push(`= ${input.bodyWeight} kg × ${input.dosePerKg} mg/kg`);
  calculationSteps.push(`= ${totalDose.toFixed(2)} mg`);
  
  // 투여액량
  const volume = totalDose / input.concentration;
  calculationSteps.push('');
  calculationSteps.push(`투여액량 = 총 투여량 ÷ 농도`);
  calculationSteps.push(`= ${totalDose.toFixed(2)} mg ÷ ${input.concentration} mg/mL`);
  calculationSteps.push(`= ${volume.toFixed(3)} mL`);
  
  // 일일 투여량 (빈도가 주어진 경우)
  let dailyDose: number | undefined;
  if (input.frequency) {
    dailyDose = totalDose * input.frequency;
    calculationSteps.push('');
    calculationSteps.push(`일일 투여량 = 1회 투여량 × 투여 횟수`);
    calculationSteps.push(`= ${totalDose.toFixed(2)} mg × ${input.frequency}회`);
    calculationSteps.push(`= ${dailyDose.toFixed(2)} mg/day`);
  }
  
  return { totalDose, volume, dailyDose, calculationSteps };
}

/**
 * 투여액량 기반 역산 (목표 용량 → 필요 농도)
 */
export function calculateRequiredConcentration(
  bodyWeight: number,
  dosePerKg: number,
  maxVolume: number
): { requiredConcentration: number; calculationSteps: string[] } {
  const calculationSteps: string[] = [];
  
  const totalDose = bodyWeight * dosePerKg;
  calculationSteps.push(`총 투여량 = ${bodyWeight} kg × ${dosePerKg} mg/kg = ${totalDose.toFixed(2)} mg`);
  
  const requiredConcentration = totalDose / maxVolume;
  calculationSteps.push(`필요 농도 = ${totalDose.toFixed(2)} mg ÷ ${maxVolume} mL = ${requiredConcentration.toFixed(4)} mg/mL`);
  
  return { requiredConcentration, calculationSteps };
}

/**
 * 투여액량 제한 계산 (mL/kg 기준)
 */
export function calculateMaxDoseByVolume(
  bodyWeight: number,
  maxVolumePerKg: number,
  concentration: number
): { maxDose: number; maxVolume: number; calculationSteps: string[] } {
  const calculationSteps: string[] = [];
  
  const maxVolume = bodyWeight * maxVolumePerKg;
  calculationSteps.push(`최대 투여액량 = ${bodyWeight} kg × ${maxVolumePerKg} mL/kg = ${maxVolume.toFixed(2)} mL`);
  
  const maxDose = maxVolume * concentration;
  calculationSteps.push(`최대 투여량 = ${maxVolume.toFixed(2)} mL × ${concentration} mg/mL = ${maxDose.toFixed(2)} mg`);
  
  const maxDosePerKg = maxDose / bodyWeight;
  calculationSteps.push(`최대 용량 = ${maxDose.toFixed(2)} mg ÷ ${bodyWeight} kg = ${maxDosePerKg.toFixed(4)} mg/kg`);
  
  return { maxDose, maxVolume, calculationSteps };
}

/**
 * 군별 투여량 계산 (여러 동물)
 */
export function calculateGroupDosing(
  animals: { id: string; weight: number }[],
  dosePerKg: number,
  concentration: number
): { results: { id: string; weight: number; dose: number; volume: number }[]; summary: { totalDose: number; totalVolume: number; avgWeight: number } } {
  const results = animals.map(animal => ({
    id: animal.id,
    weight: animal.weight,
    dose: animal.weight * dosePerKg,
    volume: (animal.weight * dosePerKg) / concentration
  }));
  
  const totalDose = results.reduce((sum, r) => sum + r.dose, 0);
  const totalVolume = results.reduce((sum, r) => sum + r.volume, 0);
  const avgWeight = animals.reduce((sum, a) => sum + a.weight, 0) / animals.length;
  
  return {
    results,
    summary: { totalDose, totalVolume, avgWeight }
  };
}
