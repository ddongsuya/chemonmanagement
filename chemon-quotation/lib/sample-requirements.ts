// ============================================================
// 코아스템켐온 시험물질 필요량 데이터 (82개 시험 항목)
// 원본: 독성시험팀, 유전독성팀, 대체시험센터, 의료기기평가센터
// ============================================================

// --- 타입 정의 ---

export type CalcType =
  | 'formula'              // 동물수 × 체중 × 투여일 × 용량 계산
  | 'fixed'                // 고정량
  | 'fixed_by_guideline'   // 가이드라인별 고정량
  | 'fixed_by_product_type'// 제품유형별 고정량
  | 'fixed_liquid_powder'  // 액상/파우더별 고정량
  | 'elution_based'        // 용출조건별
  | 'sensitization_detail';// 피부감작성 상세

export type TeamName = '독성시험팀' | '유전독성팀' | '대체시험센터' | '의료기기평가센터';

export type GuidelineType = '건기식' | '의약품' | '화학물질' | 'OECD';
export type ProductType = '의약품' | '천연물_건기식_화장품' | '화학물질' | '의료기기';

export interface DoseGroupParam {
  animalCount: number;
  bodyWeight_g: number;
  durationDays: number;
  dose_mg_kg: number;
}

export interface ElutionData {
  totalVolume_mL: number;
  surface_3cm2_mL: number;
  surface_6cm2_mL: number;
  weight_0_1g_mL: number;
  weight_0_2g_mL: number;
}

export interface SampleRequirementTest {
  id: string;
  team: TeamName;
  category: string;
  subcategory: string;
  name: string;
  calcType: CalcType;
  species: string;
  note: string;
  unit?: string;
  formulaType?: string;

  // formula 타입
  defaultParams?: {
    animalCount?: number;
    animalCountPerGroup?: number[];
    bodyWeight_g?: number;
    durationDays?: number;
    doseGroups?: number[];
  };

  // fixed 타입
  fixedAmount_g?: number | null;
  fixedAmount_ea?: number | string;

  // fixed_by_guideline 타입
  amountByGuideline?: Record<string, number>;

  // fixed_by_product_type 타입
  amountByProductType?: Record<string, number | string | null>;

  // fixed_liquid_powder 타입
  amount_liquid_mL?: number;
  amount_powder_g?: number;

  // elution_based 타입
  elutionData?: ElutionData;

  // sensitization_detail 타입
  detailData?: Record<string, number | string>;
}


// --- 계산 함수 ---

/**
 * 동물 투여 시험의 필요량 계산 (mg)
 * 공식: 동물수 × 체중(g) × 투여일 × 용량(mg/kg) / 1000
 * = 동물수 × 체중(kg) × 투여일 × 용량(mg/kg)
 */
export function calcAnimalDoseRequirement(
  animalCount: number,
  bodyWeight_g: number,
  durationDays: number,
  dose_mg_kg: number,
): number {
  return animalCount * (bodyWeight_g / 1000) * durationDays * dose_mg_kg;
}

/**
 * 여러 용량군의 총 필요량 계산 (g)
 * animalCountPerGroup이 있으면 군별 동물수가 다른 경우 (회복군 포함)
 */
export function calcTotalRequirement(
  test: SampleRequirementTest,
  overrides?: {
    animalCount?: number;
    bodyWeight_g?: number;
    durationDays?: number;
    doseGroups?: number[];
  },
): { perGroup: { dose: number; amount_mg: number; animals: number }[]; total_mg: number; total_g: number } {
  const p = { ...test.defaultParams, ...overrides };
  if (!p.doseGroups) return { perGroup: [], total_mg: 0, total_g: 0 };

  const perGroup = p.doseGroups.map((dose, i) => {
    const animals = p.animalCountPerGroup
      ? (p.animalCountPerGroup[i] ?? p.animalCountPerGroup[p.animalCountPerGroup.length - 1])
      : (p.animalCount ?? 0);
    const amount_mg = calcAnimalDoseRequirement(
      animals,
      p.bodyWeight_g ?? 0,
      p.durationDays ?? 0,
      dose,
    );
    return { dose, amount_mg, animals };
  });

  const total_mg = perGroup.reduce((s, g) => s + g.amount_mg, 0);
  return { perGroup, total_mg, total_g: total_mg / 1000 };
}

/**
 * 패키지별 총 필요량 계산 (여유분 20% 포함)
 */
export function calcPackageTotal(testIds: string[], marginRate = 0.2): number {
  let total_g = 0;
  for (const id of testIds) {
    const test = getTestById(id);
    if (!test) continue;
    if (test.calcType === 'formula') {
      total_g += calcTotalRequirement(test).total_g;
    } else if (test.calcType === 'fixed' && test.fixedAmount_g) {
      total_g += test.fixedAmount_g;
    }
  }
  return total_g * (1 + marginRate);
}

// --- 시험 데이터 (82개) ---

export const SAMPLE_REQUIREMENT_TESTS: SampleRequirementTest[] = 
[
  {
    "id": "RPT_RAT_2W_DRF",
    "team": "독성시험팀",
    "category": "반복투여독성",
    "subcategory": "설치류",
    "name": "랫드 반복 2주 DRF",
    "calcType": "formula",
    "species": "SD rat",
    "formulaType": "animal_dose",
    "defaultParams": {
      "animalCount": 10,
      "bodyWeight_g": 380,
      "durationDays": 14,
      "doseGroups": [
        250,
        500,
        1000,
        2000
      ]
    },
    "note": "용량탐색시험(DRF), 4주반복 패키지에 포함"
  },
  {
    "id": "RPT_RAT_4W",
    "team": "독성시험팀",
    "category": "반복투여독성",
    "subcategory": "설치류",
    "name": "랫드 반복 4주 (회복 포함)",
    "calcType": "formula",
    "species": "SD rat",
    "formulaType": "animal_dose",
    "defaultParams": {
      "animalCountPerGroup": [
        20,
        20,
        30
      ],
      "bodyWeight_g": 460,
      "durationDays": 28,
      "doseGroups": [
        500,
        1000,
        2000
      ]
    },
    "note": "고용량군 30마리(회복군 포함)"
  },
  {
    "id": "RPT_RAT_4W_TK",
    "team": "독성시험팀",
    "category": "반복투여독성",
    "subcategory": "설치류",
    "name": "랫드 반복 4주 TK",
    "calcType": "formula",
    "species": "SD rat",
    "formulaType": "animal_dose",
    "defaultParams": {
      "animalCount": 12,
      "bodyWeight_g": 460,
      "durationDays": 28,
      "doseGroups": [
        500,
        1000,
        2000
      ]
    },
    "note": "독성동태(TK) 위성군"
  },
  {
    "id": "RPT_RAT_13W",
    "team": "독성시험팀",
    "category": "반복투여독성",
    "subcategory": "설치류",
    "name": "랫드 반복 13주 (회복 포함)",
    "calcType": "formula",
    "species": "SD rat",
    "formulaType": "animal_dose",
    "defaultParams": {
      "animalCountPerGroup": [
        20,
        20,
        30
      ],
      "bodyWeight_g": 460,
      "durationDays": 91,
      "doseGroups": [
        500,
        1000,
        2000
      ]
    },
    "note": "고용량군 30마리(회복군 포함)"
  },
  {
    "id": "RPT_RAT_13W_TK",
    "team": "독성시험팀",
    "category": "반복투여독성",
    "subcategory": "설치류",
    "name": "랫드 반복 13주 TK",
    "calcType": "formula",
    "species": "SD rat",
    "formulaType": "animal_dose",
    "defaultParams": {
      "animalCount": 12,
      "bodyWeight_g": 460,
      "durationDays": 91,
      "doseGroups": [
        500,
        1000,
        2000
      ]
    },
    "note": "독성동태(TK) 위성군"
  },
  {
    "id": "RPT_RAT_4W_DRF_13",
    "team": "독성시험팀",
    "category": "반복투여독성",
    "subcategory": "설치류",
    "name": "랫드 반복 4주 DRF (13주 패키지)",
    "calcType": "formula",
    "species": "SD rat",
    "formulaType": "animal_dose",
    "defaultParams": {
      "animalCount": 10,
      "bodyWeight_g": 380,
      "durationDays": 28,
      "doseGroups": [
        250,
        500,
        1000,
        2000
      ]
    },
    "note": "13주 패키지용 4주 DRF"
  },
  {
    "id": "RPT_RAT_13W_DRF_26",
    "team": "독성시험팀",
    "category": "반복투여독성",
    "subcategory": "설치류",
    "name": "랫드 반복 13주 DRF (26주 패키지)",
    "calcType": "formula",
    "species": "SD rat",
    "formulaType": "animal_dose",
    "defaultParams": {
      "animalCount": 10,
      "bodyWeight_g": 380,
      "durationDays": 91,
      "doseGroups": [
        250,
        500,
        1000,
        2000
      ]
    },
    "note": "26주 패키지용 13주 DRF"
  },
  {
    "id": "RPT_RAT_26W",
    "team": "독성시험팀",
    "category": "반복투여독성",
    "subcategory": "설치류",
    "name": "랫드 반복 26주 (회복 포함)",
    "calcType": "formula",
    "species": "SD rat",
    "formulaType": "animal_dose",
    "defaultParams": {
      "animalCountPerGroup": [
        20,
        20,
        30
      ],
      "bodyWeight_g": 460,
      "durationDays": 182,
      "doseGroups": [
        500,
        1000,
        2000
      ]
    },
    "note": "고용량군 30마리(회복군 포함)"
  },
  {
    "id": "RPT_RAT_26W_TK",
    "team": "독성시험팀",
    "category": "반복투여독성",
    "subcategory": "설치류",
    "name": "랫드 반복 26주 TK",
    "calcType": "formula",
    "species": "SD rat",
    "formulaType": "animal_dose",
    "defaultParams": {
      "animalCount": 12,
      "bodyWeight_g": 460,
      "durationDays": 182,
      "doseGroups": [
        500,
        1000,
        2000
      ]
    },
    "note": "독성동태(TK) 위성군"
  },
  {
    "id": "RPT_RAT_CARC",
    "team": "독성시험팀",
    "category": "반복투여독성",
    "subcategory": "설치류",
    "name": "랫드 발암성시험 (2년)",
    "calcType": "formula",
    "species": "SD rat",
    "formulaType": "animal_dose",
    "defaultParams": {
      "animalCount": 66,
      "bodyWeight_g": 460,
      "durationDays": 728,
      "doseGroups": [
        500,
        1000,
        2000
      ]
    },
    "note": "104주(2년) 투여, 4주반복 패키지에 포함"
  },
  {
    "id": "RPT_DOG_2W_DRF",
    "team": "독성시험팀",
    "category": "반복투여독성",
    "subcategory": "비설치류",
    "name": "비설치류 반복 2주 DRF",
    "calcType": "formula",
    "species": "Beagle dog",
    "formulaType": "animal_dose",
    "defaultParams": {
      "animalCount": 2,
      "bodyWeight_g": 10000,
      "durationDays": 14,
      "doseGroups": [
        125,
        250,
        500,
        1000
      ]
    },
    "note": "비설치류 용량탐색시험"
  },
  {
    "id": "RPT_DOG_4W",
    "team": "독성시험팀",
    "category": "반복투여독성",
    "subcategory": "비설치류",
    "name": "비설치류 반복 4주 (TK 포함)",
    "calcType": "formula",
    "species": "Beagle dog",
    "formulaType": "animal_dose",
    "defaultParams": {
      "animalCountPerGroup": [
        6,
        6,
        10
      ],
      "bodyWeight_g": 11500,
      "durationDays": 28,
      "doseGroups": [
        250,
        500,
        1000
      ]
    },
    "note": "고용량군 10마리(회복군 포함), TK 포함"
  },
  {
    "id": "RPT_DOG_4W_DRF_13",
    "team": "독성시험팀",
    "category": "반복투여독성",
    "subcategory": "비설치류",
    "name": "비설치류 반복 4주 DRF (13주 패키지)",
    "calcType": "formula",
    "species": "Beagle dog",
    "formulaType": "animal_dose",
    "defaultParams": {
      "animalCount": 2,
      "bodyWeight_g": 10000,
      "durationDays": 28,
      "doseGroups": [
        125,
        250,
        500,
        1000
      ]
    },
    "note": "13주 패키지용 비설치류 DRF"
  },
  {
    "id": "RPT_DOG_13W",
    "team": "독성시험팀",
    "category": "반복투여독성",
    "subcategory": "비설치류",
    "name": "비설치류 반복 13주 (TK 포함)",
    "calcType": "formula",
    "species": "Beagle dog",
    "formulaType": "animal_dose",
    "defaultParams": {
      "animalCountPerGroup": [
        8,
        8,
        12
      ],
      "bodyWeight_g": 11500,
      "durationDays": 91,
      "doseGroups": [
        250,
        500,
        1000
      ]
    },
    "note": "고용량군 12마리(회복군 포함), TK 포함"
  },
  {
    "id": "RPT_DOG_13W_DRF_39",
    "team": "독성시험팀",
    "category": "반복투여독성",
    "subcategory": "비설치류",
    "name": "비설치류 반복 13주 DRF (39주 패키지)",
    "calcType": "formula",
    "species": "Beagle dog",
    "formulaType": "animal_dose",
    "defaultParams": {
      "animalCount": 2,
      "bodyWeight_g": 10000,
      "durationDays": 91,
      "doseGroups": [
        125,
        250,
        500,
        1000
      ]
    },
    "note": "39주 패키지용 비설치류 DRF"
  },
  {
    "id": "RPT_DOG_39W",
    "team": "독성시험팀",
    "category": "반복투여독성",
    "subcategory": "비설치류",
    "name": "비설치류 반복 39주 (TK 포함)",
    "calcType": "formula",
    "species": "Beagle dog",
    "formulaType": "animal_dose",
    "defaultParams": {
      "animalCountPerGroup": [
        8,
        8,
        12
      ],
      "bodyWeight_g": 11500,
      "durationDays": 91,
      "doseGroups": [
        250,
        500,
        1000
      ]
    },
    "note": "39주 패키지, TK 포함"
  },
  {
    "id": "REPRO_FERT_M",
    "team": "독성시험팀",
    "category": "생식독성",
    "subcategory": "설치류",
    "name": "수태능력시험-수컷",
    "calcType": "formula",
    "species": "SD rat",
    "formulaType": "animal_dose",
    "defaultParams": {
      "animalCount": 25,
      "bodyWeight_g": 350,
      "durationDays": 28,
      "doseGroups": [
        100,
        300,
        1000
      ]
    },
    "note": ""
  },
  {
    "id": "REPRO_FERT_F",
    "team": "독성시험팀",
    "category": "생식독성",
    "subcategory": "설치류",
    "name": "수태능력시험-암컷",
    "calcType": "formula",
    "species": "SD rat",
    "formulaType": "animal_dose",
    "defaultParams": {
      "animalCount": 25,
      "bodyWeight_g": 300,
      "durationDays": 21,
      "doseGroups": [
        100,
        300,
        1000
      ]
    },
    "note": ""
  },
  {
    "id": "REPRO_PPND",
    "team": "독성시험팀",
    "category": "생식독성",
    "subcategory": "설치류",
    "name": "출생전후 발생독성(모체)",
    "calcType": "formula",
    "species": "SD rat",
    "formulaType": "animal_dose",
    "defaultParams": {
      "animalCount": 25,
      "bodyWeight_g": 350,
      "durationDays": 25,
      "doseGroups": [
        100,
        300,
        1000
      ]
    },
    "note": ""
  },
  {
    "id": "REPRO_EFD_RAT_PRE",
    "team": "독성시험팀",
    "category": "생식독성",
    "subcategory": "설치류",
    "name": "배·태자 발생독성 - 설치류 예비",
    "calcType": "formula",
    "species": "SD rat",
    "formulaType": "animal_dose",
    "defaultParams": {
      "animalCount": 5,
      "bodyWeight_g": 330,
      "durationDays": 13,
      "doseGroups": [
        75,
        125,
        250,
        500,
        1000
      ]
    },
    "note": ""
  },
  {
    "id": "REPRO_EFD_RAT",
    "team": "독성시험팀",
    "category": "생식독성",
    "subcategory": "설치류",
    "name": "배·태자 발생독성 - 설치류 본시험",
    "calcType": "formula",
    "species": "SD rat",
    "formulaType": "animal_dose",
    "defaultParams": {
      "animalCount": 25,
      "bodyWeight_g": 330,
      "durationDays": 13,
      "doseGroups": [
        100,
        300,
        1000
      ]
    },
    "note": ""
  },
  {
    "id": "REPRO_EFD_RBT_PRE",
    "team": "독성시험팀",
    "category": "생식독성",
    "subcategory": "토끼",
    "name": "배·태자 발생독성 - 토끼 예비",
    "calcType": "formula",
    "species": "NZW rabbit",
    "formulaType": "animal_dose",
    "defaultParams": {
      "animalCount": 5,
      "bodyWeight_g": 3500,
      "durationDays": 13,
      "doseGroups": [
        75,
        125,
        250,
        500,
        1000
      ]
    },
    "note": ""
  },
  {
    "id": "REPRO_EFD_RBT",
    "team": "독성시험팀",
    "category": "생식독성",
    "subcategory": "토끼",
    "name": "배·태자 발생독성 - 토끼 본시험",
    "calcType": "formula",
    "species": "NZW rabbit",
    "formulaType": "animal_dose",
    "defaultParams": {
      "animalCount": 25,
      "bodyWeight_g": 3500,
      "durationDays": 13,
      "doseGroups": [
        100,
        300,
        1000
      ]
    },
    "note": ""
  },
  {
    "id": "TOX_SAFETY_PHARM",
    "team": "독성시험팀",
    "category": "안전성약리",
    "subcategory": "",
    "name": "안전성약리 (hERG, Irwin, 호흡기, 심혈관)",
    "calcType": "fixed",
    "species": "",
    "formulaType": "",
    "fixedAmount_g": 120,
    "note": "고정량"
  },
  {
    "id": "TOX_FORMULATION",
    "team": "독성시험팀",
    "category": "조제균질성",
    "subcategory": "",
    "name": "조제균질성 (4주 패키지)",
    "calcType": "fixed",
    "species": "",
    "formulaType": "",
    "fixedAmount_g": 44,
    "note": "4주반복 패키지 기준"
  },
  {
    "id": "TOX_FORMULATION_REPRO",
    "team": "독성시험팀",
    "category": "조제균질성",
    "subcategory": "",
    "name": "조제균질성 (생식독성)",
    "calcType": "fixed",
    "species": "",
    "formulaType": "",
    "fixedAmount_g": 30,
    "note": "생식독성 패키지 기준"
  },
  {
    "id": "GENO_AMES",
    "team": "유전독성팀",
    "category": "유전독성",
    "subcategory": "",
    "name": "복귀돌연변이시험(Ames)",
    "calcType": "fixed_by_guideline",
    "species": "",
    "formulaType": "",
    "amountByGuideline": {
      "건기식_함량O": 4,
      "건기식_함량X": 3,
      "의약품_함량O": 4,
      "의약품_함량X": 3,
      "화학물질_함량O": 4,
      "화학물질_함량X": 3,
      "OECD_함량O": 4,
      "OECD_함량X": 3
    },
    "unit": "g",
    "note": "여분 약 5g 추가 권장"
  },
  {
    "id": "GENO_CA",
    "team": "유전독성팀",
    "category": "유전독성",
    "subcategory": "",
    "name": "염색체이상시험",
    "calcType": "fixed_by_guideline",
    "species": "",
    "formulaType": "",
    "amountByGuideline": {
      "건기식_함량O": 4,
      "건기식_함량X": 3,
      "의약품_함량O": 3,
      "의약품_함량X": 2,
      "화학물질_함량O": 3,
      "화학물질_함량X": 2,
      "OECD_함량O": 3,
      "OECD_함량X": 2
    },
    "unit": "g",
    "note": "여분 약 5g 추가 권장"
  },
  {
    "id": "GENO_MN_MOUSE",
    "team": "유전독성팀",
    "category": "유전독성",
    "subcategory": "",
    "name": "소핵시험 (Mouse, 2일 투여)",
    "calcType": "fixed_by_guideline",
    "species": "",
    "formulaType": "",
    "amountByGuideline": {
      "건기식_함량O": 12,
      "건기식_함량X": 10,
      "의약품_함량O": 7,
      "의약품_함량X": 5,
      "화학물질_함량O": 7,
      "화학물질_함량X": 5,
      "OECD_함량O": 7,
      "OECD_함량X": 5
    },
    "unit": "g",
    "note": "여분 약 5g 추가 권장"
  },
  {
    "id": "GENO_MN_RAT",
    "team": "유전독성팀",
    "category": "유전독성",
    "subcategory": "",
    "name": "소핵시험 (Rat, 2일 투여)",
    "calcType": "fixed_by_guideline",
    "species": "",
    "formulaType": "",
    "amountByGuideline": {
      "건기식_함량O": 90,
      "건기식_함량X": 85,
      "의약품_함량O": 40,
      "의약품_함량X": 35,
      "화학물질_함량O": 40,
      "화학물질_함량X": 35,
      "OECD_함량O": 40,
      "OECD_함량X": 35
    },
    "unit": "g",
    "note": "여분 약 5g 추가 권장"
  },
  {
    "id": "GENO_COMET_RAT",
    "team": "유전독성팀",
    "category": "유전독성",
    "subcategory": "",
    "name": "코멧시험 (Rat, 3일 투여)",
    "calcType": "fixed_by_guideline",
    "species": "",
    "formulaType": "",
    "amountByGuideline": {
      "건기식_함량O": 135,
      "건기식_함량X": 130,
      "의약품_함량O": 60,
      "의약품_함량X": 55,
      "화학물질_함량O": 60,
      "화학물질_함량X": 55,
      "OECD_함량O": 60,
      "OECD_함량X": 55
    },
    "unit": "g",
    "note": "여분 약 5g 추가 권장"
  },
  {
    "id": "ALT_AMES_GLP",
    "team": "대체시험센터",
    "category": "유전독성",
    "subcategory": "GLP",
    "name": "복귀돌연변이시험 (GLP)",
    "calcType": "fixed_by_product_type",
    "species": "",
    "formulaType": "",
    "amountByProductType": {
      "의약품": 2.0,
      "천연물_건기식_화장품": 2.0,
      "화학물질": 2.0,
      "의료기기": 2.4
    },
    "unit": "g",
    "note": "함량 없음 기준"
  },
  {
    "id": "ALT_AMES_GLP_EAT",
    "team": "대체시험센터",
    "category": "유전독성",
    "subcategory": "EAT",
    "name": "복귀돌연변이시험 (GLP, EAT)",
    "calcType": "fixed_by_product_type",
    "species": "",
    "formulaType": "",
    "amountByProductType": {
      "의약품": 2.0,
      "천연물_건기식_화장품": null,
      "화학물질": null,
      "의료기기": null
    },
    "unit": "g",
    "note": "예비시험 없음"
  },
  {
    "id": "ALT_AMES_NGLP_2",
    "team": "대체시험센터",
    "category": "유전독성",
    "subcategory": "2균주",
    "name": "복귀돌연변이시험 (NGLP, 2균주)",
    "calcType": "fixed_by_product_type",
    "species": "",
    "formulaType": "",
    "amountByProductType": {
      "의약품": 0.3,
      "천연물_건기식_화장품": null,
      "화학물질": null,
      "의료기기": null
    },
    "unit": "g",
    "note": ""
  },
  {
    "id": "ALT_AMES_NGLP_5",
    "team": "대체시험센터",
    "category": "유전독성",
    "subcategory": "5균주",
    "name": "복귀돌연변이시험 (NGLP, 5균주)",
    "calcType": "fixed_by_product_type",
    "species": "",
    "formulaType": "",
    "amountByProductType": {
      "의약품": 0.5,
      "천연물_건기식_화장품": null,
      "화학물질": null,
      "의료기기": null
    },
    "unit": "g",
    "note": ""
  },
  {
    "id": "ALT_CA_GLP",
    "team": "대체시험센터",
    "category": "유전독성",
    "subcategory": "GLP",
    "name": "염색체이상시험 (GLP)",
    "calcType": "fixed_by_product_type",
    "species": "",
    "formulaType": "",
    "amountByProductType": {
      "의약품": 2.0,
      "천연물_건기식_화장품": 2.0,
      "화학물질": 2.0,
      "의료기기": 2.4
    },
    "unit": "g",
    "note": "함량 없음 기준"
  },
  {
    "id": "ALT_CA_NGLP",
    "team": "대체시험센터",
    "category": "유전독성",
    "subcategory": "3 series",
    "name": "염색체이상시험 (NGLP)",
    "calcType": "fixed_by_product_type",
    "species": "",
    "formulaType": "",
    "amountByProductType": {
      "의약품": 0.5,
      "천연물_건기식_화장품": null,
      "화학물질": null,
      "의료기기": null
    },
    "unit": "g",
    "note": ""
  },
  {
    "id": "ALT_MN_RAT_GLP",
    "team": "대체시험센터",
    "category": "유전독성",
    "subcategory": "GLP",
    "name": "체내 소핵시험 (GLP, 랫드)",
    "calcType": "fixed_by_product_type",
    "species": "",
    "formulaType": "",
    "amountByProductType": {
      "의약품": 35.0,
      "천연물_건기식_화장품": 85.0,
      "화학물질": 35.0,
      "의료기기": 24.0
    },
    "unit": "g",
    "note": "2일 투여"
  },
  {
    "id": "ALT_MN_RAT_GLP_CONTENT",
    "team": "대체시험센터",
    "category": "유전독성",
    "subcategory": "GLP",
    "name": "체내 소핵시험 (GLP, 랫드+함량)",
    "calcType": "fixed_by_product_type",
    "species": "",
    "formulaType": "",
    "amountByProductType": {
      "의약품": 40.0,
      "천연물_건기식_화장품": 90.0,
      "화학물질": 40.0,
      "의료기기": null
    },
    "unit": "g",
    "note": "2일 투여"
  },
  {
    "id": "ALT_MN_MOUSE_GLP",
    "team": "대체시험센터",
    "category": "유전독성",
    "subcategory": "GLP",
    "name": "체내 소핵시험 (GLP, 마우스)",
    "calcType": "fixed_by_product_type",
    "species": "",
    "formulaType": "",
    "amountByProductType": {
      "의약품": 5.0,
      "천연물_건기식_화장품": 10.0,
      "화학물질": 5.0,
      "의료기기": 2.4
    },
    "unit": "g",
    "note": "2일 투여"
  },
  {
    "id": "ALT_MN_MOUSE_GLP_CONTENT",
    "team": "대체시험센터",
    "category": "유전독성",
    "subcategory": "GLP",
    "name": "체내 소핵시험 (GLP, 마우스+함량)",
    "calcType": "fixed_by_product_type",
    "species": "",
    "formulaType": "",
    "amountByProductType": {
      "의약품": 7.0,
      "천연물_건기식_화장품": 12.0,
      "화학물질": 7.0,
      "의료기기": null
    },
    "unit": "g",
    "note": "2일 투여"
  },
  {
    "id": "ALT_MN_RAT_NGLP",
    "team": "대체시험센터",
    "category": "유전독성",
    "subcategory": "GLP",
    "name": "체내 소핵시험 (NGLP, 랫드)",
    "calcType": "fixed_by_product_type",
    "species": "",
    "formulaType": "",
    "amountByProductType": {
      "의약품": 15.0,
      "천연물_건기식_화장품": 30.0,
      "화학물질": 15.0,
      "의료기기": null
    },
    "unit": "g",
    "note": "용량 의뢰자 결정 필수"
  },
  {
    "id": "ALT_MN_MOUSE_NGLP",
    "team": "대체시험센터",
    "category": "유전독성",
    "subcategory": "GLP",
    "name": "체내 소핵시험 (NGLP, 마우스)",
    "calcType": "fixed_by_product_type",
    "species": "",
    "formulaType": "",
    "amountByProductType": {
      "의약품": 3.0,
      "천연물_건기식_화장품": 7.0,
      "화학물질": 3.0,
      "의료기기": null
    },
    "unit": "g",
    "note": "용량 의뢰자 결정 필수"
  },
  {
    "id": "ALT_MN_INVITRO_GLP",
    "team": "대체시험센터",
    "category": "유전독성",
    "subcategory": "GLP",
    "name": "체외 소핵시험 (GLP)",
    "calcType": "fixed_by_product_type",
    "species": "",
    "formulaType": "",
    "amountByProductType": {
      "의약품": 4.0,
      "천연물_건기식_화장품": null,
      "화학물질": null,
      "의료기기": null
    },
    "unit": "g",
    "note": ""
  },
  {
    "id": "ALT_MN_INVITRO_NGLP",
    "team": "대체시험센터",
    "category": "유전독성",
    "subcategory": "GLP",
    "name": "체외 소핵시험 (NGLP)",
    "calcType": "fixed_by_product_type",
    "species": "",
    "formulaType": "",
    "amountByProductType": {
      "의약품": 2.0,
      "천연물_건기식_화장품": null,
      "화학물질": null,
      "의료기기": null
    },
    "unit": "g",
    "note": "Series에 따라 변동"
  },
  {
    "id": "ALT_MLA_GLP",
    "team": "대체시험센터",
    "category": "유전독성",
    "subcategory": "GLP",
    "name": "유전자돌연변이 시험 MLA (GLP)",
    "calcType": "fixed_by_product_type",
    "species": "",
    "formulaType": "",
    "amountByProductType": {
      "의약품": 3.0,
      "천연물_건기식_화장품": 3.0,
      "화학물질": 3.0,
      "의료기기": null
    },
    "unit": "g",
    "note": ""
  },
  {
    "id": "ALT_COMET_RAT_GLP",
    "team": "대체시험센터",
    "category": "유전독성",
    "subcategory": "GLP",
    "name": "체내 코멧시험 (GLP, 랫드)",
    "calcType": "fixed_by_product_type",
    "species": "",
    "formulaType": "",
    "amountByProductType": {
      "의약품": 55.0,
      "천연물_건기식_화장품": 130.0,
      "화학물질": 55.0,
      "의료기기": null
    },
    "unit": "g",
    "note": "3일 투여"
  },
  {
    "id": "ALT_COMET_RAT_GLP_CONTENT",
    "team": "대체시험센터",
    "category": "유전독성",
    "subcategory": "GLP",
    "name": "체내 코멧시험 (GLP, 랫드+함량)",
    "calcType": "fixed_by_product_type",
    "species": "",
    "formulaType": "",
    "amountByProductType": {
      "의약품": 60.0,
      "천연물_건기식_화장품": 135.0,
      "화학물질": 60.0,
      "의료기기": null
    },
    "unit": "g",
    "note": "3일 투여"
  },
  {
    "id": "ALT_PIGA_RAT_GLP",
    "team": "대체시험센터",
    "category": "유전독성",
    "subcategory": "GLP",
    "name": "체내 Pig-a 시험 (GLP, 랫드)",
    "calcType": "fixed_by_product_type",
    "species": "",
    "formulaType": "",
    "amountByProductType": {
      "의약품": 200.0,
      "천연물_건기식_화장품": null,
      "화학물질": null,
      "의료기기": null
    },
    "unit": "g",
    "note": "28일 투여"
  },
  {
    "id": "ALT_PHOTOTOX",
    "team": "대체시험센터",
    "category": "대체시험",
    "subcategory": "",
    "name": "광독성시험",
    "calcType": "fixed_by_product_type",
    "species": "",
    "formulaType": "",
    "amountByProductType": {
      "의약품": 1.0,
      "천연물_건기식_화장품": 1.0,
      "화학물질": null,
      "의료기기": null
    },
    "unit": "g",
    "note": "시험물질이 액상일 경우 문의바람"
  },
  {
    "id": "ALT_SKIN_IRRIT",
    "team": "대체시험센터",
    "category": "대체시험",
    "subcategory": "",
    "name": "피부자극시험",
    "calcType": "fixed_by_product_type",
    "species": "",
    "formulaType": "",
    "amountByProductType": {
      "의약품": 1.0,
      "천연물_건기식_화장품": 1.0,
      "화학물질": 1.0,
      "의료기기": null
    },
    "unit": "g",
    "note": "시험물질이 액상일 경우 문의바람"
  },
  {
    "id": "ALT_EYE_IRRIT",
    "team": "대체시험센터",
    "category": "대체시험",
    "subcategory": "",
    "name": "안자극시험",
    "calcType": "fixed_by_product_type",
    "species": "",
    "formulaType": "",
    "amountByProductType": {
      "의약품": 1.0,
      "천연물_건기식_화장품": 1.0,
      "화학물질": 1.0,
      "의료기기": null
    },
    "unit": "g",
    "note": "시험물질이 액상일 경우 문의바람"
  },
  {
    "id": "ALT_SKIN_SENS_ELISA",
    "team": "대체시험센터",
    "category": "대체시험",
    "subcategory": "",
    "name": "피부감작시험 (ELISA)",
    "calcType": "fixed_by_product_type",
    "species": "",
    "formulaType": "",
    "amountByProductType": {
      "의약품": 6.0,
      "천연물_건기식_화장품": 6.0,
      "화학물질": 6.0,
      "의료기기": null
    },
    "unit": "g",
    "note": "시험물질이 액상일 경우 문의바람"
  },
  {
    "id": "ALT_SKIN_SENS_FCM",
    "team": "대체시험센터",
    "category": "대체시험",
    "subcategory": "",
    "name": "피부감작시험 (FCM)",
    "calcType": "fixed_by_product_type",
    "species": "",
    "formulaType": "",
    "amountByProductType": {
      "의약품": 6.0,
      "천연물_건기식_화장품": 6.0,
      "화학물질": 6.0,
      "의료기기": null
    },
    "unit": "g",
    "note": "시험물질이 액상일 경우 문의바람"
  },
  {
    "id": "ALT_MD_CYTO_EXT",
    "team": "대체시험센터",
    "category": "의료기기시험",
    "subcategory": "",
    "name": "세포독성시험 (용출)",
    "calcType": "fixed_by_product_type",
    "species": "",
    "formulaType": "",
    "amountByProductType": {
      "의약품": null,
      "천연물_건기식_화장품": null,
      "화학물질": null,
      "의료기기": 1.2
    },
    "unit": "g",
    "note": "0.2 g/mL 기준"
  },
  {
    "id": "ALT_MD_HEMO_DIRECT",
    "team": "대체시험센터",
    "category": "의료기기시험",
    "subcategory": "",
    "name": "혈액적합성시험 (직접)",
    "calcType": "fixed_by_product_type",
    "species": "",
    "formulaType": "",
    "amountByProductType": {
      "의약품": null,
      "천연물_건기식_화장품": null,
      "화학물질": null,
      "의료기기": 5.0
    },
    "unit": "g",
    "note": "0.2 g/mL 기준"
  },
  {
    "id": "ALT_MD_HEMO_INDIRECT",
    "team": "대체시험센터",
    "category": "의료기기시험",
    "subcategory": "",
    "name": "혈액적합성시험 (간접)",
    "calcType": "fixed_by_product_type",
    "species": "",
    "formulaType": "",
    "amountByProductType": {
      "의약품": null,
      "천연물_건기식_화장품": null,
      "화학물질": null,
      "의료기기": 5.0
    },
    "unit": "g",
    "note": "0.2 g/mL 기준"
  },
  {
    "id": "ALT_MD_ENDOTOXIN",
    "team": "대체시험센터",
    "category": "의료기기시험",
    "subcategory": "",
    "name": "엔도톡신시험",
    "calcType": "fixed_by_product_type",
    "species": "",
    "formulaType": "",
    "amountByProductType": {
      "의약품": null,
      "천연물_건기식_화장품": null,
      "화학물질": null,
      "의료기기": "10 devices"
    },
    "unit": "g",
    "note": "고형물 기준"
  },
  {
    "id": "MDE_ACUTE_SYS",
    "team": "의료기기평가센터",
    "category": "의료기기 생물학적 안전성",
    "subcategory": "용출 기반",
    "name": "급성전신독성",
    "calcType": "elution_based",
    "species": "",
    "formulaType": "",
    "elutionData": {
      "totalVolume_mL": 9,
      "surface_3cm2_mL": 27,
      "surface_6cm2_mL": 54,
      "weight_0_1g_mL": 0.9,
      "weight_0_2g_mL": 1.8
    },
    "unit": "mL or g (조건별)",
    "note": "극성/비극성 각각 동일량 필요"
  },
  {
    "id": "MDE_SKIN_SENS",
    "team": "의료기기평가센터",
    "category": "의료기기 생물학적 안전성",
    "subcategory": "용출 기반",
    "name": "피부감작성",
    "calcType": "elution_based",
    "species": "",
    "formulaType": "",
    "elutionData": {
      "totalVolume_mL": 35,
      "surface_3cm2_mL": 105,
      "surface_6cm2_mL": 210,
      "weight_0_1g_mL": 3.5,
      "weight_0_2g_mL": 7
    },
    "unit": "mL or g (조건별)",
    "note": "극성/비극성 각각 동일량 필요"
  },
  {
    "id": "MDE_INTRADERMAL",
    "team": "의료기기평가센터",
    "category": "의료기기 생물학적 안전성",
    "subcategory": "용출 기반",
    "name": "피내반응 (1회 용출)",
    "calcType": "elution_based",
    "species": "",
    "formulaType": "",
    "elutionData": {
      "totalVolume_mL": 5,
      "surface_3cm2_mL": 15,
      "surface_6cm2_mL": 30,
      "weight_0_1g_mL": 0.5,
      "weight_0_2g_mL": 1
    },
    "unit": "mL or g (조건별)",
    "note": "극성/비극성 각각 동일량 필요"
  },
  {
    "id": "MDE_SKIN_IRRIT",
    "team": "의료기기평가센터",
    "category": "의료기기 생물학적 안전성",
    "subcategory": "용출 기반",
    "name": "피부자극 (1회 용출)",
    "calcType": "elution_based",
    "species": "",
    "formulaType": "",
    "elutionData": {
      "totalVolume_mL": 5,
      "surface_3cm2_mL": 15,
      "surface_6cm2_mL": 30,
      "weight_0_1g_mL": 0.5,
      "weight_0_2g_mL": 1
    },
    "unit": "mL or g (조건별)",
    "note": "극성/비극성 각각 동일량 필요"
  },
  {
    "id": "MDE_ORAL_MUCOSA",
    "team": "의료기기평가센터",
    "category": "의료기기 생물학적 안전성",
    "subcategory": "용출 기반",
    "name": "구강점막 (1회 용출)",
    "calcType": "elution_based",
    "species": "",
    "formulaType": "",
    "elutionData": {
      "totalVolume_mL": 10,
      "surface_3cm2_mL": 30,
      "surface_6cm2_mL": 60,
      "weight_0_1g_mL": 1,
      "weight_0_2g_mL": 2
    },
    "unit": "mL or g (조건별)",
    "note": "극성/비극성 각각 동일량 필요"
  },
  {
    "id": "MDE_EYE_IRRIT",
    "team": "의료기기평가센터",
    "category": "의료기기 생물학적 안전성",
    "subcategory": "용출 기반",
    "name": "안자극",
    "calcType": "elution_based",
    "species": "",
    "formulaType": "",
    "elutionData": {
      "totalVolume_mL": 1,
      "surface_3cm2_mL": 3,
      "surface_6cm2_mL": 6,
      "weight_0_1g_mL": 0.1,
      "weight_0_2g_mL": 0.2
    },
    "unit": "mL or g (조건별)",
    "note": "극성/비극성 각각 동일량 필요"
  },
  {
    "id": "MDE_CYTO_EXT",
    "team": "의료기기평가센터",
    "category": "의료기기 생물학적 안전성",
    "subcategory": "용출 기반",
    "name": "세포독성 용출물시험",
    "calcType": "elution_based",
    "species": "",
    "formulaType": "",
    "elutionData": {
      "totalVolume_mL": 6,
      "surface_3cm2_mL": 18,
      "surface_6cm2_mL": 36,
      "weight_0_1g_mL": 0.6,
      "weight_0_2g_mL": 1.2
    },
    "unit": "mL or g (조건별)",
    "note": "극성/비극성 각각 동일량 필요"
  },
  {
    "id": "MDE_AMES",
    "team": "의료기기평가센터",
    "category": "의료기기 생물학적 안전성",
    "subcategory": "용출 기반",
    "name": "복귀 돌연변이시험",
    "calcType": "elution_based",
    "species": "",
    "formulaType": "",
    "elutionData": {
      "totalVolume_mL": 6,
      "surface_3cm2_mL": 18,
      "surface_6cm2_mL": 36,
      "weight_0_1g_mL": 0.6,
      "weight_0_2g_mL": 1.2
    },
    "unit": "mL or g (조건별)",
    "note": "극성/비극성 각각 동일량 필요"
  },
  {
    "id": "MDE_CA",
    "team": "의료기기평가센터",
    "category": "의료기기 생물학적 안전성",
    "subcategory": "용출 기반",
    "name": "염색체이상시험",
    "calcType": "elution_based",
    "species": "",
    "formulaType": "",
    "elutionData": {
      "totalVolume_mL": 6,
      "surface_3cm2_mL": 18,
      "surface_6cm2_mL": 36,
      "weight_0_1g_mL": 0.6,
      "weight_0_2g_mL": 1.2
    },
    "unit": "mL or g (조건별)",
    "note": "극성/비극성 각각 동일량 필요"
  },
  {
    "id": "MDE_MN_RAT",
    "team": "의료기기평가센터",
    "category": "의료기기 생물학적 안전성",
    "subcategory": "용출 기반",
    "name": "소핵시험 (랫드)",
    "calcType": "elution_based",
    "species": "",
    "formulaType": "",
    "elutionData": {
      "totalVolume_mL": 80,
      "surface_3cm2_mL": 240,
      "surface_6cm2_mL": 480,
      "weight_0_1g_mL": 8,
      "weight_0_2g_mL": 16
    },
    "unit": "mL or g (조건별)",
    "note": "극성/비극성 각각 동일량 필요"
  },
  {
    "id": "MDE_MN_MOUSE",
    "team": "의료기기평가센터",
    "category": "의료기기 생물학적 안전성",
    "subcategory": "용출 기반",
    "name": "소핵시험 (마우스)",
    "calcType": "elution_based",
    "species": "",
    "formulaType": "",
    "elutionData": {
      "totalVolume_mL": 20,
      "surface_3cm2_mL": 60,
      "surface_6cm2_mL": 120,
      "weight_0_1g_mL": 2,
      "weight_0_2g_mL": 4
    },
    "unit": "mL or g (조건별)",
    "note": "극성/비극성 각각 동일량 필요"
  },
  {
    "id": "MDE_HEMOLYSIS",
    "team": "의료기기평가센터",
    "category": "의료기기 생물학적 안전성",
    "subcategory": "용출 기반",
    "name": "용혈성시험",
    "calcType": "elution_based",
    "species": "",
    "formulaType": "",
    "elutionData": {
      "totalVolume_mL": 25,
      "surface_3cm2_mL": 75,
      "surface_6cm2_mL": 150,
      "weight_0_1g_mL": 2.5,
      "weight_0_2g_mL": 5
    },
    "unit": "mL or g (조건별)",
    "note": "극성/비극성 각각 동일량 필요"
  },
  {
    "id": "MDE_CYTO_AGAR",
    "team": "의료기기평가센터",
    "category": "의료기기 생물학적 안전성",
    "subcategory": "특수",
    "name": "세포독성 한천확산법/직접접촉법",
    "calcType": "fixed",
    "species": "",
    "formulaType": "",
    "fixedAmount_g": null,
    "fixedAmount_ea": 6,
    "unit": "ea",
    "note": "3반복 × 여유분 포함, 시험물질 6 ea 필요"
  },
  {
    "id": "MDE_ENDOTOXIN",
    "team": "의료기기평가센터",
    "category": "의료기기 생물학적 안전성",
    "subcategory": "특수",
    "name": "엔도톡신시험",
    "calcType": "fixed",
    "species": "",
    "formulaType": "",
    "fixedAmount_g": null,
    "fixedAmount_ea": "10~20",
    "unit": "ea (devices)",
    "note": "고형물 기준, 액상 제외"
  },
  {
    "id": "MDE_PHARMA_ASA",
    "team": "의료기기평가센터",
    "category": "의약품 면역독성/자극성",
    "subcategory": "",
    "name": "ASA 반응시험",
    "calcType": "fixed_liquid_powder",
    "species": "",
    "formulaType": "",
    "amount_liquid_mL": 50,
    "amount_powder_g": 50,
    "unit": "mL (액상) / g (파우더)",
    "note": "예비투여 필요량 포함"
  },
  {
    "id": "MDE_PHARMA_PCA",
    "team": "의료기기평가센터",
    "category": "의약품 면역독성/자극성",
    "subcategory": "",
    "name": "PCA 반응시험",
    "calcType": "fixed_liquid_powder",
    "species": "",
    "formulaType": "",
    "amount_liquid_mL": 25,
    "amount_powder_g": 25,
    "unit": "mL (액상) / g (파우더)",
    "note": "예비투여 필요량 포함"
  },
  {
    "id": "MDE_PHARMA_SKIN_SENS",
    "team": "의료기기평가센터",
    "category": "의약품 면역독성/자극성",
    "subcategory": "",
    "name": "피부감작성",
    "calcType": "fixed_liquid_powder",
    "species": "",
    "formulaType": "",
    "amount_liquid_mL": 50,
    "amount_powder_g": 50,
    "unit": "mL (액상) / g (파우더)",
    "note": "예비투여 필요량 포함"
  },
  {
    "id": "MDE_PHARMA_PHOTOSENS",
    "team": "의료기기평가센터",
    "category": "의약품 면역독성/자극성",
    "subcategory": "",
    "name": "광감작성",
    "calcType": "fixed_liquid_powder",
    "species": "",
    "formulaType": "",
    "amount_liquid_mL": 15,
    "amount_powder_g": 15,
    "unit": "mL (액상) / g (파우더)",
    "note": "예비투여 필요량 포함"
  },
  {
    "id": "MDE_PHARMA_PHOTOTOX",
    "team": "의료기기평가센터",
    "category": "의약품 면역독성/자극성",
    "subcategory": "",
    "name": "광독성",
    "calcType": "fixed_liquid_powder",
    "species": "",
    "formulaType": "",
    "amount_liquid_mL": 5,
    "amount_powder_g": 0.5,
    "unit": "mL (액상) / g (파우더)",
    "note": "예비투여 필요량 포함"
  },
  {
    "id": "MDE_PHARMA_SKIN_IRRIT_MFDS",
    "team": "의료기기평가센터",
    "category": "의약품 면역독성/자극성",
    "subcategory": "",
    "name": "피부자극 (식약처)",
    "calcType": "fixed_liquid_powder",
    "species": "",
    "formulaType": "",
    "amount_liquid_mL": 8,
    "amount_powder_g": 8,
    "unit": "mL (액상) / g (파우더)",
    "note": "예비투여 필요량 포함"
  },
  {
    "id": "MDE_PHARMA_EYE_IRRIT_MFDS",
    "team": "의료기기평가센터",
    "category": "의약품 면역독성/자극성",
    "subcategory": "",
    "name": "안자극 (식약처)",
    "calcType": "fixed_liquid_powder",
    "species": "",
    "formulaType": "",
    "amount_liquid_mL": 2,
    "amount_powder_g": 2,
    "unit": "mL (액상) / g (파우더)",
    "note": "예비투여 필요량 포함"
  },
  {
    "id": "MDE_PHARMA_SKIN_IRRIT_ME",
    "team": "의료기기평가센터",
    "category": "의약품 면역독성/자극성",
    "subcategory": "",
    "name": "피부자극 (환경부)",
    "calcType": "fixed_liquid_powder",
    "species": "",
    "formulaType": "",
    "amount_liquid_mL": 3.5,
    "amount_powder_g": 3.5,
    "unit": "mL (액상) / g (파우더)",
    "note": "예비투여 필요량 포함"
  },
  {
    "id": "MDE_PHARMA_EYE_IRRIT_ME",
    "team": "의료기기평가센터",
    "category": "의약품 면역독성/자극성",
    "subcategory": "",
    "name": "안자극 (환경부)",
    "calcType": "fixed_liquid_powder",
    "species": "",
    "formulaType": "",
    "amount_liquid_mL": 1,
    "amount_powder_g": 1,
    "unit": "mL (액상) / g (파우더)",
    "note": "예비투여 필요량 포함"
  },
  {
    "id": "MDE_SKIN_SENS_DETAIL",
    "team": "의료기기평가센터",
    "category": "의료기기 생물학적 안전성",
    "subcategory": "피부감작성 상세",
    "name": "피부감작성 상세 (1차유도/2차유도/유발, 극성/비극성)",
    "calcType": "sensitization_detail",
    "species": "",
    "formulaType": "",
    "detailData": {
      "induction1_polar": 6,
      "induction1_nonpolar": 6,
      "induction2_polar": 10,
      "induction2_nonpolar": 10,
      "challenge_polar": 15,
      "challenge_nonpolar": 15,
      "total_volumes": "12+20+30 mL"
    },
    "unit": "mL (총 용출량 기준)",
    "note": "용출 3회 진행, 각 용출별 필요량 별도 계산"
  }
]
;


// --- 헬퍼 함수 ---

export function getTestById(id: string): SampleRequirementTest | undefined {
  return SAMPLE_REQUIREMENT_TESTS.find(t => t.id === id);
}

export function getTestsByTeam(team: TeamName): SampleRequirementTest[] {
  return SAMPLE_REQUIREMENT_TESTS.filter(t => t.team === team);
}

export function getTestsByCategory(category: string): SampleRequirementTest[] {
  return SAMPLE_REQUIREMENT_TESTS.filter(t => t.category === category);
}

export function searchTests(keyword: string): SampleRequirementTest[] {
  const kw = keyword.toLowerCase();
  return SAMPLE_REQUIREMENT_TESTS.filter(t =>
    t.name.toLowerCase().includes(kw) ||
    t.category.toLowerCase().includes(kw) ||
    t.id.toLowerCase().includes(kw)
  );
}

/** 사전 정의된 패키지 */
export const PACKAGES = {
  '4주반복_설치류_비설치류': [
    'RPT_RAT_2W_DRF', 'RPT_RAT_4W', 'RPT_RAT_4W_TK',
    'RPT_DOG_2W_DRF', 'RPT_DOG_4W',
    'TOX_SAFETY_PHARM', 'TOX_FORMULATION',
  ],
  '13주반복_설치류_비설치류': [
    'RPT_RAT_4W_DRF_13', 'RPT_RAT_13W', 'RPT_RAT_13W_TK',
    'RPT_DOG_4W_DRF_13', 'RPT_DOG_13W',
  ],
  '26주반복_설치류_39주_비설치류': [
    'RPT_RAT_13W_DRF_26', 'RPT_RAT_26W', 'RPT_RAT_26W_TK',
    'RPT_DOG_13W_DRF_39', 'RPT_DOG_39W',
  ],
  '생식독성_전체': [
    'REPRO_FERT_M', 'REPRO_FERT_F', 'REPRO_PPND',
    'REPRO_EFD_RAT_PRE', 'REPRO_EFD_RAT',
    'REPRO_EFD_RBT_PRE', 'REPRO_EFD_RBT',
    'TOX_FORMULATION_REPRO',
  ],
  '유전독성_의약품': ['GENO_AMES', 'GENO_CA', 'GENO_MN_RAT', 'GENO_COMET_RAT'],
  '유전독성_건기식': ['GENO_AMES', 'GENO_CA', 'GENO_MN_MOUSE'],
};

export const TEAM_LIST: TeamName[] = ['독성시험팀', '유전독성팀', '대체시험센터', '의료기기평가센터'];
