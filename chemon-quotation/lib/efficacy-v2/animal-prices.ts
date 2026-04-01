// lib/efficacy-v2/animal-prices.ts
// 동물 가격 조회 — master-data.ts 기반

import {
  ANIMAL_PRICES as MASTER_ANIMAL_PRICES,
  BEST_PRICE_TABLE,
  AGED_ANIMAL_PRICES,
  getHousingCost,
  type AnimalVendor,
} from './master-data';

/**
 * 동물 가격 조회 (최저가 우선)
 * species: 모델의 species[0] (예: "SD rat", "ICR mouse")
 * ageWeeks: 주령
 */
export function getAnimalPrice(species: string, ageWeeks: number): number {
  const weekKey = `${ageWeeks}W`;
  const s = species.toLowerCase();

  // 1. 최저가 비교표에서 먼저 찾기
  const best = BEST_PRICE_TABLE.find(b =>
    b.strain.toLowerCase().includes(s) || s.includes(b.strain.toLowerCase())
  );
  if (best && best.ageWeek === weekKey) return best.bestPrice;

  // 2. 업체별 가격표에서 검색 (가장 저렴한 가격)
  let lowestPrice: number | null = null;
  for (const entry of MASTER_ANIMAL_PRICES) {
    const strain = entry.strain.toLowerCase();
    if (!strain.includes(s) && !s.includes(strain)) continue;
    const price = entry.priceByWeek[weekKey];
    if (price != null && (lowestPrice === null || price < lowestPrice)) {
      lowestPrice = price;
    }
  }
  if (lowestPrice !== null) return lowestPrice;

  // 3. 가장 가까운 주령으로 fallback
  for (const entry of MASTER_ANIMAL_PRICES) {
    const strain = entry.strain.toLowerCase();
    if (!strain.includes(s) && !s.includes(strain)) continue;
    const weeks = Object.keys(entry.priceByWeek)
      .map(k => parseInt(k))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);
    if (weeks.length === 0) continue;
    const closest = weeks.reduce((prev, curr) =>
      Math.abs(curr - ageWeeks) < Math.abs(prev - ageWeeks) ? curr : prev
    );
    const price = entry.priceByWeek[`${closest}W`];
    if (price != null) return price;
  }

  // 4. 고주령 동물 (12개월 이상)
  if (ageWeeks >= 48) {
    const monthAge = Math.round(ageWeeks / 4.3);
    const aged = AGED_ANIMAL_PRICES.find(a => a.monthAge === monthAge);
    if (aged) {
      if (s.includes('sd') || s.includes('rat')) return aged.SD ?? 25000;
      if (s.includes('c57')) return aged.C57BL6N ?? 25000;
      if (s.includes('icr')) return aged.ICR ?? 25000;
    }
  }

  // 5. 특수 동물 기본가
  if (s.includes('db/db')) return 220000;
  if (s.includes('nc/nga')) return 85000;
  if (s.includes('als') || s.includes('transgenic')) return 340000;
  if (s.includes('shr')) return 30000;
  if (s.includes('lewis')) return 25000;
  if (s.includes('wistar')) return 20000;
  if (s.includes('btbr')) return 250000;
  if (s.includes('beagle') || s.includes('dog')) return 2000000;
  if (s.includes('pig') || s.includes('yucatan')) return 3000000;

  return 25000; // 기본 fallback
}

/**
 * 업체별 동물 가격 조회
 */
export function getAnimalPriceByVendor(species: string, ageWeeks: number, vendor: AnimalVendor): number | null {
  const weekKey = `${ageWeeks}W`;
  const s = species.toLowerCase();
  for (const entry of MASTER_ANIMAL_PRICES) {
    if (entry.vendor !== vendor) continue;
    const strain = entry.strain.toLowerCase();
    if (!strain.includes(s) && !s.includes(strain)) continue;
    return entry.priceByWeek[weekKey] ?? null;
  }
  return null;
}

/**
 * 사육비 단가 조회 (원/head/일) — master-data 기반
 */
export function getHousingRate(species: string): number {
  return getHousingCost(species);
}

export { MASTER_ANIMAL_PRICES, BEST_PRICE_TABLE, AGED_ANIMAL_PRICES };
