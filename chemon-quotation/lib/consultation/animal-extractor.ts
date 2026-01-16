/**
 * 동물종 추출
 */

import { QuotationItem } from '@/types';

export interface ExtractedAnimals {
  rodent: string[];
  nonRodent: string[];
  rabbit: string[];
  guineaPig: string[];
  others: string[];
}

/**
 * 견적서 시험 항목들에서 동물종 추출
 */
export function extractAnimals(items: QuotationItem[]): ExtractedAnimals {
  const result = {
    rodent: new Set<string>(),
    nonRodent: new Set<string>(),
    rabbit: new Set<string>(),
    guineaPig: new Set<string>(),
    others: new Set<string>(),
  };

  for (const item of items) {
    const species = (item.test?.animal_species || '').toLowerCase();
    const originalSpecies = item.test?.animal_species || '';

    if (!species) continue;

    if (
      species.includes('rat') ||
      species.includes('mouse') ||
      species.includes('설치류')
    ) {
      result.rodent.add(originalSpecies);
    } else if (
      species.includes('beagle') ||
      species.includes('dog') ||
      species.includes('monkey') ||
      species.includes('minipig') ||
      species.includes('비설치류') ||
      species.includes('원숭이') ||
      species.includes('개')
    ) {
      result.nonRodent.add(originalSpecies);
    } else if (species.includes('rabbit') || species.includes('토끼')) {
      result.rabbit.add(originalSpecies);
    } else if (species.includes('guinea') || species.includes('기니픽')) {
      result.guineaPig.add(originalSpecies);
    } else {
      result.others.add(originalSpecies);
    }
  }

  return {
    rodent: Array.from(result.rodent),
    nonRodent: Array.from(result.nonRodent),
    rabbit: Array.from(result.rabbit),
    guineaPig: Array.from(result.guineaPig),
    others: Array.from(result.others),
  };
}

/**
 * 추출된 동물종을 문자열로 변환
 */
export function animalsToStrings(
  animals: ExtractedAnimals
): Record<string, string> {
  return {
    rodent: animals.rodent.join(', ') || '-',
    nonRodent: animals.nonRodent.join(', ') || '-',
    rabbit: animals.rabbit.join(', ') || '-',
    guineaPig: animals.guineaPig.join(', ') || '-',
    others: animals.others.join(', ') || '-',
  };
}
