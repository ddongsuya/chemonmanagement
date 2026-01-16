import { SPECIES_DATA, HUMAN_KM } from '@/types/calculator';

/**
 * BSA 기반 용량 환산
 * Dose_B = Dose_A × (BSA_A / BSA_B)
 */
export function convertDoseByBSA(
  doseA: number,
  speciesAKey: string,
  speciesBKey: string
): { convertedDose: number; calculationSteps: string[] } {
  const speciesA = SPECIES_DATA[speciesAKey];
  const speciesB = SPECIES_DATA[speciesBKey];
  
  if (!speciesA || !speciesB) {
    throw new Error('Unknown species');
  }

  const calculationSteps: string[] = [];
  
  calculationSteps.push(`[${speciesA.name}] 용량: ${doseA} mg/kg`);
  calculationSteps.push(`[${speciesA.name}] BSA: ${speciesA.bsa} m²`);
  calculationSteps.push(`[${speciesB.name}] BSA: ${speciesB.bsa} m²`);
  
  const convertedDose = doseA * (speciesA.bsa / speciesB.bsa);
  calculationSteps.push(`환산 용량 = ${doseA} × (${speciesA.bsa} / ${speciesB.bsa}) = ${convertedDose.toFixed(4)} mg/kg`);

  return { convertedDose, calculationSteps };
}

/**
 * Km 기반 용량 환산 (FDA 방식)
 * Dose_B = Dose_A × (Km_A / Km_B)
 */
export function convertDoseByKm(
  doseA: number,
  speciesAKey: string,
  speciesBKey: string
): { convertedDose: number; calculationSteps: string[] } {
  const speciesA = SPECIES_DATA[speciesAKey];
  const speciesB = SPECIES_DATA[speciesBKey];
  
  if (!speciesA || !speciesB) {
    throw new Error('Unknown species');
  }

  const calculationSteps: string[] = [];
  
  calculationSteps.push(`[${speciesA.name}] 용량: ${doseA} mg/kg`);
  calculationSteps.push(`[${speciesA.name}] Km: ${speciesA.km}`);
  calculationSteps.push(`[${speciesB.name}] Km: ${speciesB.km}`);
  
  const convertedDose = doseA * (speciesA.km / speciesB.km);
  calculationSteps.push(`환산 용량 = ${doseA} × (${speciesA.km} / ${speciesB.km}) = ${convertedDose.toFixed(4)} mg/kg`);

  return { convertedDose, calculationSteps };
}

/**
 * mg/kg → mg/m² 변환
 */
export function convertMgKgToMgM2(
  doseMgKg: number,
  speciesKey: string
): { doseMgM2: number; calculationSteps: string[] } {
  const species = SPECIES_DATA[speciesKey];
  if (!species) throw new Error('Unknown species');

  const calculationSteps: string[] = [];
  const doseMgM2 = doseMgKg * species.km;
  
  calculationSteps.push(`용량 (mg/kg): ${doseMgKg}`);
  calculationSteps.push(`Km (${species.name}): ${species.km}`);
  calculationSteps.push(`mg/m² = mg/kg × Km = ${doseMgKg} × ${species.km} = ${doseMgM2.toFixed(4)} mg/m²`);

  return { doseMgM2, calculationSteps };
}

/**
 * mg/m² → mg/kg 변환
 */
export function convertMgM2ToMgKg(
  doseMgM2: number,
  speciesKey: string
): { doseMgKg: number; calculationSteps: string[] } {
  const species = SPECIES_DATA[speciesKey];
  if (!species) throw new Error('Unknown species');

  const calculationSteps: string[] = [];
  const doseMgKg = doseMgM2 / species.km;
  
  calculationSteps.push(`용량 (mg/m²): ${doseMgM2}`);
  calculationSteps.push(`Km (${species.name}): ${species.km}`);
  calculationSteps.push(`mg/kg = mg/m² ÷ Km = ${doseMgM2} ÷ ${species.km} = ${doseMgKg.toFixed(4)} mg/kg`);

  return { doseMgKg, calculationSteps };
}
