// TK 파라미터 계산 유틸리티

export interface TimeConcentrationPoint {
  time: number;
  concentration: number;
}

export interface TKParameters {
  cmax: number;
  tmax: number;
  auc0t: number;
  auc0inf: number | null;
  halfLife: number | null;
  ke: number | null;
  mrt: number | null;
  cl: number | null;
  vd: number | null;
}

/**
 * Cmax, Tmax 계산
 */
export function calculateCmaxTmax(data: TimeConcentrationPoint[]): { cmax: number; tmax: number } {
  if (data.length === 0) return { cmax: 0, tmax: 0 };
  
  let cmax = data[0].concentration;
  let tmax = data[0].time;
  
  for (const point of data) {
    if (point.concentration > cmax) {
      cmax = point.concentration;
      tmax = point.time;
    }
  }
  
  return { cmax, tmax };
}

/**
 * AUC 계산 (사다리꼴 공식)
 */
export function calculateAUC(data: TimeConcentrationPoint[]): number {
  if (data.length < 2) return 0;
  
  // 시간순 정렬
  const sorted = [...data].sort((a, b) => a.time - b.time);
  
  let auc = 0;
  for (let i = 1; i < sorted.length; i++) {
    const dt = sorted[i].time - sorted[i - 1].time;
    const avgConc = (sorted[i].concentration + sorted[i - 1].concentration) / 2;
    auc += dt * avgConc;
  }
  
  return auc;
}

/**
 * 소실 속도 상수 (ke) 계산 - 로그 선형 회귀
 */
export function calculateKe(data: TimeConcentrationPoint[], startIndex?: number): number | null {
  // Cmax 이후 데이터만 사용
  const { tmax } = calculateCmaxTmax(data);
  const terminalData = data.filter(p => p.time >= tmax && p.concentration > 0);
  
  if (terminalData.length < 3) return null;
  
  // 로그 변환
  const logData = terminalData.map(p => ({
    time: p.time,
    logConc: Math.log(p.concentration)
  }));
  
  // 선형 회귀
  const n = logData.length;
  const sumX = logData.reduce((sum, p) => sum + p.time, 0);
  const sumY = logData.reduce((sum, p) => sum + p.logConc, 0);
  const sumXY = logData.reduce((sum, p) => sum + p.time * p.logConc, 0);
  const sumX2 = logData.reduce((sum, p) => sum + p.time * p.time, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  return -slope; // ke = -slope
}

/**
 * 반감기 계산
 */
export function calculateHalfLife(ke: number): number {
  return Math.LN2 / ke; // t1/2 = ln(2) / ke
}

/**
 * AUC0-inf 계산
 */
export function calculateAUC0Inf(auc0t: number, lastConc: number, ke: number): number {
  return auc0t + (lastConc / ke);
}

/**
 * MRT (Mean Residence Time) 계산
 */
export function calculateMRT(data: TimeConcentrationPoint[], auc: number): number {
  if (data.length < 2 || auc === 0) return 0;
  
  const sorted = [...data].sort((a, b) => a.time - b.time);
  
  // AUMC 계산 (Area Under Moment Curve)
  let aumc = 0;
  for (let i = 1; i < sorted.length; i++) {
    const dt = sorted[i].time - sorted[i - 1].time;
    const avgMoment = (sorted[i].time * sorted[i].concentration + sorted[i - 1].time * sorted[i - 1].concentration) / 2;
    aumc += dt * avgMoment;
  }
  
  return aumc / auc;
}

/**
 * 청소율 (Clearance) 계산
 */
export function calculateClearance(dose: number, auc: number): number {
  if (auc === 0) return 0;
  return dose / auc;
}

/**
 * 분포용적 (Vd) 계산
 */
export function calculateVd(cl: number, ke: number): number {
  if (ke === 0) return 0;
  return cl / ke;
}

/**
 * 전체 TK 파라미터 계산
 */
export function calculateAllTKParameters(
  data: TimeConcentrationPoint[],
  dose?: number
): { parameters: TKParameters; calculationSteps: string[] } {
  const calculationSteps: string[] = [];
  
  // Cmax, Tmax
  const { cmax, tmax } = calculateCmaxTmax(data);
  calculationSteps.push(`Cmax = ${cmax.toFixed(4)} (최대 농도)`);
  calculationSteps.push(`Tmax = ${tmax.toFixed(2)} hr (최대 농도 도달 시간)`);
  
  // AUC0-t
  const auc0t = calculateAUC(data);
  calculationSteps.push(`AUC0-t = ${auc0t.toFixed(4)} (사다리꼴 공식)`);
  
  // ke
  const ke = calculateKe(data);
  let halfLife: number | null = null;
  let auc0inf: number | null = null;
  let mrt: number | null = null;
  let cl: number | null = null;
  let vd: number | null = null;
  
  if (ke && ke > 0) {
    calculationSteps.push(`ke = ${ke.toFixed(4)} hr⁻¹ (소실 속도 상수)`);
    
    // 반감기
    halfLife = calculateHalfLife(ke);
    calculationSteps.push(`t1/2 = ln(2) / ke = ${halfLife.toFixed(2)} hr`);
    
    // AUC0-inf
    const sorted = [...data].sort((a, b) => a.time - b.time);
    const lastConc = sorted[sorted.length - 1].concentration;
    auc0inf = calculateAUC0Inf(auc0t, lastConc, ke);
    calculationSteps.push(`AUC0-∞ = AUC0-t + Clast/ke = ${auc0inf.toFixed(4)}`);
    
    // MRT
    mrt = calculateMRT(data, auc0t);
    calculationSteps.push(`MRT = AUMC / AUC = ${mrt.toFixed(2)} hr`);
    
    // CL, Vd (용량이 주어진 경우)
    if (dose) {
      cl = calculateClearance(dose, auc0inf);
      calculationSteps.push(`CL = Dose / AUC = ${cl.toFixed(4)} L/hr/kg`);
      
      vd = calculateVd(cl, ke);
      calculationSteps.push(`Vd = CL / ke = ${vd.toFixed(4)} L/kg`);
    }
  } else {
    calculationSteps.push(`ke: 계산 불가 (터미널 데이터 부족)`);
  }
  
  return {
    parameters: { cmax, tmax, auc0t, auc0inf, halfLife, ke, mrt, cl, vd },
    calculationSteps
  };
}
