import type { SimpleItem } from '@/types/toxicity-v2';

/**
 * VACCINE 배열: 백신 모드 시험 데이터 3개 항목
 * 소스: quotation-v2.jsx의 VACCINE 배열
 * 필드 매핑: fn→formalName, p→price, w→weeks, gl→guideline
 */
export const VACCINE_DATA: SimpleItem[] = [
  { id: 1, num: 1, name: '설치류 4주(3회) 반복투여 독성', formalName: '설치류 4주(1회/2주, 총 3회) 반복 투여 독성시험', category: '반복투여독성', species: 'SD rat', duration: '4주(3회)', description: '- 암수 각각 10마리/군, 총 2군\n- 대조군 1, 백신군 1\n- 1회/2주, 총 3회 투여\n\n1. 체중, 일반증상\n2. 사료/음용수 섭취량\n3. 뇨/안검사\n4. 부검/장기중량, 혈액학, 생화학, 응고검사\n5. 조직병리 검사', price: 56000000, weeks: 21, guideline: ['OECD TG 407', 'ICH S6(R1), ICH M3(R2)', '독성시험기준 제6조', '백신 반복투여(1회/2주, 총3회) 독성시험. 2군(대조+백신)'], note: '군 구성/투여횟수 확인 후 금액 조정 가능' },
  { id: 2, num: 2, name: '설치류 4주(3회) 4주 회복', formalName: '설치류 4주(1회/2주, 총 3회) 반복 투여 4주 회복시험', category: '반복투여독성', species: 'SD rat', duration: '4주(3회)', description: '- 암수 각각 5마리/군, 총 2군\n- 대조군 1, 백신군 1', price: 30800000, weeks: 25, guideline: ['OECD TG 407', 'ICH S6(R1), ICH M3(R2)', '독성시험기준 제6조', '백신 본시험 후 4주 회복기 가역성 평가'] },
  { id: 3, num: 3, name: '항체형성 확인시험', formalName: '설치류 4주(1회/2주, 총 3회) 반복 투여 항체형성 확인시험', category: '면역원성', species: 'SD rat', duration: '4주(3회)', description: '- 암수 각각 5마리/군, 총 2군\n- 대조군 1, 백신군 1\n\n채혈 시점:\n1. 투여 전\n2. 2차 투여 전\n3. 3차 투여 전\n4. 종료 후 2주\n5. 종료 후 4주\n\n- 혈액시료 의뢰자 전달', price: 10800000, weeks: 12, guideline: ['', 'ICH S6(R1)', '독성시험기준 제6조', '투여 전/중/후 채혈 항체 형성 확인. 혈액시료 의뢰자 전달'] },
];
