// 시험물질 소요량 계산 유틸리티

export interface DoseGroup {
  id: string;
  name: string; // 용량군 이름 (부형제, 저, 중, 고 등)
  animalCount: number; // 동물수 (마리)
  bodyWeight: number; // 체중 (g)
  doseLevel: number; // 투여량 (mg/kg/day)
  doseDays: number; // 투여일 (day)
  isVehicle?: boolean; // 부형제군 여부
}

export interface StudyConfig {
  id: string;
  name: string; // 시험명
  studyType: string; // 시험 유형
  groups: DoseGroup[];
}

export interface DoseGroupResult {
  id: string;
  name: string;
  animalCount: number;
  bodyWeight: number;
  doseLevel: number;
  doseDays: number;
  requiredAmount: number; // 필요량 (mg)
  calculatedAmount: number; // 산출량 (mg) - 여유분 포함
  isVehicle: boolean;
}

export interface StudyResult {
  id: string;
  name: string;
  studyType: string;
  groups: DoseGroupResult[];
  totalRequired: number; // 시험별 총 필요량
  totalCalculated: number; // 시험별 총 산출량
}

export interface TestMaterialCalculationResult {
  studies: StudyResult[];
  grandTotalRequired: number; // 전체 총 필요량
  grandTotalCalculated: number; // 전체 총 산출량
  safetyMargin: number; // 여유율 (%)
  calculationSteps: string[];
}

// 기본 시험 템플릿
export const STUDY_TEMPLATES: Record<string, { name: string; groups: Omit<DoseGroup, 'id'>[] }> = {
  acute_oral: {
    name: '급성경구독성시험',
    groups: [
      { name: '1단계', animalCount: 3, bodyWeight: 300, doseLevel: 5000, doseDays: 1, isVehicle: false },
      { name: '2단계', animalCount: 3, bodyWeight: 300, doseLevel: 5000, doseDays: 1, isVehicle: false },
      { name: '부형제', animalCount: 10, bodyWeight: 300, doseLevel: 0, doseDays: 28, isVehicle: true },
    ]
  },
  drf_4week: {
    name: '랫드 4주 DRF 독성시험',
    groups: [
      { name: '부형제', animalCount: 10, bodyWeight: 300, doseLevel: 0, doseDays: 28, isVehicle: true },
      { name: '저', animalCount: 10, bodyWeight: 300, doseLevel: 0, doseDays: 28, isVehicle: false },
      { name: '중', animalCount: 10, bodyWeight: 300, doseLevel: 0, doseDays: 28, isVehicle: false },
      { name: '고', animalCount: 10, bodyWeight: 300, doseLevel: 0, doseDays: 28, isVehicle: false },
      { name: '최고', animalCount: 0, bodyWeight: 300, doseLevel: 0, doseDays: 28, isVehicle: false },
    ]
  },
  repeat_13week: {
    name: '랫드 13주 반복독성시험',
    groups: [
      { name: '부형제', animalCount: 30, bodyWeight: 450, doseLevel: 0, doseDays: 90, isVehicle: true },
      { name: '저', animalCount: 20, bodyWeight: 450, doseLevel: 0, doseDays: 90, isVehicle: false },
      { name: '중', animalCount: 20, bodyWeight: 450, doseLevel: 0, doseDays: 90, isVehicle: false },
      { name: '고', animalCount: 30, bodyWeight: 450, doseLevel: 0, doseDays: 90, isVehicle: false },
    ]
  },
  repeat_13week_recovery: {
    name: '랫드 13주 반복독성시험 + 4주 회복시험',
    groups: [
      { name: '부형제', animalCount: 30, bodyWeight: 450, doseLevel: 0, doseDays: 90, isVehicle: true },
      { name: '저', animalCount: 20, bodyWeight: 450, doseLevel: 0, doseDays: 90, isVehicle: false },
      { name: '중', animalCount: 20, bodyWeight: 450, doseLevel: 0, doseDays: 90, isVehicle: false },
      { name: '고', animalCount: 30, bodyWeight: 450, doseLevel: 0, doseDays: 90, isVehicle: false },
    ]
  },
  dog_4week: {
    name: '비글 4주 반복독성시험',
    groups: [
      { name: '부형제', animalCount: 4, bodyWeight: 10000, doseLevel: 0, doseDays: 28, isVehicle: true },
      { name: '저', animalCount: 4, bodyWeight: 10000, doseLevel: 0, doseDays: 28, isVehicle: false },
      { name: '중', animalCount: 4, bodyWeight: 10000, doseLevel: 0, doseDays: 28, isVehicle: false },
      { name: '고', animalCount: 4, bodyWeight: 10000, doseLevel: 0, doseDays: 28, isVehicle: false },
    ]
  },
  genotox_ames: {
    name: '복귀돌연변이시험 (Ames)',
    groups: [
      { name: '시험물질', animalCount: 1, bodyWeight: 1, doseLevel: 5000, doseDays: 1, isVehicle: false },
    ]
  },
  genotox_mic: {
    name: '소핵시험',
    groups: [
      { name: '부형제', animalCount: 10, bodyWeight: 30, doseLevel: 0, doseDays: 2, isVehicle: true },
      { name: '저', animalCount: 10, bodyWeight: 30, doseLevel: 0, doseDays: 2, isVehicle: false },
      { name: '중', animalCount: 10, bodyWeight: 30, doseLevel: 0, doseDays: 2, isVehicle: false },
      { name: '고', animalCount: 10, bodyWeight: 30, doseLevel: 0, doseDays: 2, isVehicle: false },
    ]
  },
};

/**
 * 단일 용량군 필요량 계산
 * 필요량(mg) = 동물수 × 체중(kg) × 투여량(mg/kg/day) × 투여일
 */
export function calculateGroupRequired(group: DoseGroup): number {
  if (group.isVehicle || group.doseLevel === 0 || group.animalCount === 0) {
    return 0;
  }
  const bodyWeightKg = group.bodyWeight / 1000; // g → kg
  return group.animalCount * bodyWeightKg * group.doseLevel * group.doseDays;
}

/**
 * 시험물질 소요량 전체 계산
 */
export function calculateTestMaterial(
  studies: StudyConfig[],
  safetyMargin: number = 20 // 기본 20% 여유
): TestMaterialCalculationResult {
  const calculationSteps: string[] = [];
  const marginMultiplier = 1 + (safetyMargin / 100);
  
  calculationSteps.push(`=== 시험물질 소요량 산출 ===`);
  calculationSteps.push(`여유율: ${safetyMargin}% (×${marginMultiplier.toFixed(2)})`);
  calculationSteps.push(`계산식: 필요량 = 동물수 × 체중(kg) × 투여량(mg/kg/day) × 투여일`);
  calculationSteps.push(`산출량 = 필요량 × ${marginMultiplier.toFixed(2)}`);
  calculationSteps.push('');

  const studyResults: StudyResult[] = [];
  let grandTotalRequired = 0;
  let grandTotalCalculated = 0;

  for (const study of studies) {
    calculationSteps.push(`【${study.name}】`);
    
    const groupResults: DoseGroupResult[] = [];
    let studyTotalRequired = 0;
    let studyTotalCalculated = 0;

    for (const group of study.groups) {
      const required = calculateGroupRequired(group);
      const calculated = required * marginMultiplier;

      groupResults.push({
        id: group.id,
        name: group.name,
        animalCount: group.animalCount,
        bodyWeight: group.bodyWeight,
        doseLevel: group.doseLevel,
        doseDays: group.doseDays,
        requiredAmount: required,
        calculatedAmount: calculated,
        isVehicle: group.isVehicle || false,
      });

      if (!group.isVehicle && group.doseLevel > 0 && group.animalCount > 0) {
        const bodyWeightKg = group.bodyWeight / 1000;
        calculationSteps.push(
          `  ${group.name}: ${group.animalCount}마리 × ${bodyWeightKg}kg × ${group.doseLevel}mg/kg × ${group.doseDays}일 = ${required.toFixed(0)}mg → ${calculated.toFixed(0)}mg`
        );
        studyTotalRequired += required;
        studyTotalCalculated += calculated;
      } else if (group.isVehicle) {
        calculationSteps.push(`  ${group.name}: 부형제군 (시험물질 불필요)`);
      }
    }

    calculationSteps.push(`  → 시험 소계: ${studyTotalCalculated.toFixed(0)}mg`);
    calculationSteps.push('');

    studyResults.push({
      id: study.id,
      name: study.name,
      studyType: study.studyType,
      groups: groupResults,
      totalRequired: studyTotalRequired,
      totalCalculated: studyTotalCalculated,
    });

    grandTotalRequired += studyTotalRequired;
    grandTotalCalculated += studyTotalCalculated;
  }

  calculationSteps.push(`=== 총계 ===`);
  calculationSteps.push(`총 필요량: ${grandTotalRequired.toFixed(0)}mg`);
  calculationSteps.push(`총 산출량 (여유분 포함): ${grandTotalCalculated.toFixed(0)}mg`);
  calculationSteps.push(`= ${(grandTotalCalculated / 1000).toFixed(2)}g`);
  calculationSteps.push(`= ${(grandTotalCalculated / 1000000).toFixed(4)}kg`);

  return {
    studies: studyResults,
    grandTotalRequired,
    grandTotalCalculated,
    safetyMargin,
    calculationSteps,
  };
}

/**
 * Excel 데이터 변환
 */
export function convertToExcelData(result: TestMaterialCalculationResult) {
  const summarySheet: (string | number)[][] = [
    ['시험별 시료량 산출'],
    [''],
    ['시험명', '용량군', '동물수(마리)', '체중(g)', '투여일(day)', '투여량(mg/kg/day)', '필요량(mg)', '산출량(mg)', '시험물질 총 필요량(mg)'],
  ];

  for (const study of result.studies) {
    let isFirstRow = true;
    for (const group of study.groups) {
      summarySheet.push([
        isFirstRow ? study.name : '',
        group.name,
        group.animalCount,
        group.bodyWeight,
        group.doseDays,
        group.doseLevel,
        group.requiredAmount.toFixed(0),
        group.calculatedAmount.toFixed(0),
        isFirstRow ? study.totalCalculated.toFixed(0) : '',
      ]);
      isFirstRow = false;
    }
  }

  summarySheet.push(['']);
  summarySheet.push(['', '', '', '', '', '', '', 'total', result.grandTotalCalculated.toFixed(0)]);
  summarySheet.push(['']);
  summarySheet.push(['*필요량: 투여에 사용되는 양']);
  summarySheet.push([`*산출량: 투여 시 소실되는 시험물질 양 고려, 필요량 x ${(1 + result.safetyMargin / 100).toFixed(1)}`]);

  return { summarySheet };
}
