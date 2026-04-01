// lib/efficacy-v2/animal-prices.ts
// 동물 가격 조회 (코아텍/자바이오/오리엔트바이오 기준)

export const ANIMAL_PRICES: Record<string, Record<string, number>> = {
  'ICR mouse': { '3W': 5300, '4W': 5800, '5W': 6300, '6W': 6800, '7W': 7300, '8W': 7800, '9W': 8300, '10W': 9500, '11W': 10500, '12W': 12000 },
  'C57BL/6 mouse': { '3W': 17000, '4W': 18000, '5W': 19000, '6W': 20000, '7W': 22000, '8W': 24000, '9W': 26000, '10W': 29000, '11W': 32000, '12W': 35000 },
  'C57BL/6J mouse': { '3W': 17500, '4W': 18000, '5W': 19200, '6W': 19800, '7W': 21500, '8W': 22500 },
  'BALB/c mouse': { '3W': 15000, '4W': 16000, '5W': 17000, '6W': 18000, '7W': 20000, '8W': 22000, '9W': 24000, '10W': 26000, '11W': 28000, '12W': 30000 },
  'BALB/c nude mouse': { '3W': 42000, '4W': 53000, '5W': 58000, '6W': 63000, '7W': 69000 },
  'DBA1/J mouse': { '3W': 29500, '4W': 31500, '5W': 33500, '6W': 35500, '7W': 38000, '8W': 40500, '9W': 43000 },
  'SD rat': { '3W': 17000, '4W': 18000, '5W': 19000, '6W': 20000, '7W': 22000, '8W': 24000, '9W': 26000, '10W': 29000, '11W': 32000, '12W': 35000 },
  'Guinea pig': { '6W': 60000, '7W': 66000, '8W': 72000 },
  'NZW rabbit': { '10W': 170000, '12W': 190000, '16W': 220000 },
  'db/db mouse': { '5W': 200000, '6W': 220000, '7W': 240000, '8W': 260000 },
  'NC/Nga mouse': { '5W': 80000, '6W': 85000, '7W': 90000, '8W': 95000 },
  'ALS transgenic mouse': { '4W': 300000, '5W': 320000, '6W': 340000, '8W': 380000 },
  'SCID mouse': { '4W': 95000, '5W': 105000, '6W': 115000, '7W': 130000 },
  'NOG mouse': { '4W': 175000, '5W': 185000, '6W': 195000, '7W': 205000 },
  'mouse': { '5W': 20000, '6W': 22000, '7W': 24000, '8W': 26000 },
};

/** 사육비 단가 (원/head/일) */
export const HOUSING_RATES: Record<string, number> = {
  'mouse': 1500,
  'rat': 2000,
  'guinea pig': 10000,
  'rabbit': 20000,
};

/**
 * 동물 가격 조회
 * species: 모델의 speciesRaw 또는 species[0]
 * ageWeeks: 주령
 */
export function getAnimalPrice(species: string, ageWeeks: number): number {
  const key = `${ageWeeks}W`;

  // 정확한 종 매칭
  if (ANIMAL_PRICES[species]?.[key]) {
    return ANIMAL_PRICES[species][key];
  }

  // 부분 매칭 (species 배열의 첫 번째 값으로)
  for (const [name, prices] of Object.entries(ANIMAL_PRICES)) {
    if (species.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(species.toLowerCase())) {
      if (prices[key]) return prices[key];
      // 가장 가까운 주령 찾기
      const weeks = Object.keys(prices).map(k => parseInt(k)).filter(n => !isNaN(n)).sort((a, b) => a - b);
      const closest = weeks.reduce((prev, curr) => Math.abs(curr - ageWeeks) < Math.abs(prev - ageWeeks) ? curr : prev);
      return prices[`${closest}W`] ?? 25000;
    }
  }

  return 25000; // 기본 fallback
}

/**
 * 사육비 단가 조회 (원/head/일)
 */
export function getHousingRate(species: string): number {
  const s = species.toLowerCase();
  if (s.includes('rabbit')) return 20000;
  if (s.includes('guinea')) return 10000;
  if (s.includes('rat')) return 2000;
  return 1500; // mouse default
}
