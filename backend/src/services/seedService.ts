// Seed Service
// 마스터데이터 시드 서비스

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Clinical Test Category enum values
type ClinicalTestCategory = 
  | 'CBC'
  | 'DIFF'
  | 'RETIC'
  | 'CHEMISTRY_GENERAL'
  | 'ELECTROLYTE'
  | 'CHEMISTRY_ADDITIONAL'
  | 'COAGULATION'
  | 'URINALYSIS'
  | 'URINE_CHEMISTRY';

type SampleType = 'WHOLE_BLOOD' | 'SERUM' | 'PLASMA' | 'URINE';

const clinicalTestItems = [
  // CBC (일반혈액학) - 패키지
  {
    category: 'CBC' as ClinicalTestCategory,
    code: 'CBC',
    nameKr: 'CBC (일반혈액학)',
    nameEn: 'Complete Blood Count',
    unit: null,
    method: 'Flowcytometry',
    unitPrice: 50000,
    isPackage: true,
    packageItems: ['WBC', 'RBC', 'HGB', 'HCT', 'MCV', 'MCH', 'MCHC', 'RDW', 'HDW', 'PLT', 'MPV'],
    requiredSampleTypes: ['WHOLE_BLOOD' as SampleType],
    minSampleVolume: 200,
    requiresItem: null,
    displayOrder: 1,
  },
  // DIFF (백혈구감별) - 패키지
  {
    category: 'DIFF' as ClinicalTestCategory,
    code: 'DIFF',
    nameKr: 'DIFF (백혈구감별계수)',
    nameEn: 'WBC Differential Count',
    unit: null,
    method: 'Flowcytometry, Peroxidase staining',
    unitPrice: 50000,
    isPackage: true,
    packageItems: ['NEU', 'LYM', 'MONO', 'EOS', 'BASO', 'LUC'],
    requiredSampleTypes: ['WHOLE_BLOOD' as SampleType],
    minSampleVolume: 200,
    requiresItem: 'CBC',
    displayOrder: 2,
  },
  // RETIC (망상적혈구)
  {
    category: 'RETIC' as ClinicalTestCategory,
    code: 'RETIC',
    nameKr: 'RETIC (망상적혈구)',
    nameEn: 'Reticulocyte',
    unit: '%',
    method: 'Flowcytometry, Isovolumetry',
    unitPrice: 30000,
    isPackage: false,
    packageItems: [],
    requiredSampleTypes: ['WHOLE_BLOOD' as SampleType],
    minSampleVolume: 200,
    requiresItem: null,
    displayOrder: 3,
  },
  // 혈액생화학 - 일반 (10,000원/항목)
  { category: 'CHEMISTRY_GENERAL' as ClinicalTestCategory, code: 'AST', nameKr: 'AST', nameEn: 'Aspartate aminotransferase', unit: 'U/L', method: 'Kinetic UV법', unitPrice: 10000, isPackage: false, packageItems: [], requiredSampleTypes: ['SERUM' as SampleType, 'PLASMA' as SampleType], minSampleVolume: 300, displayOrder: 10 },
  { category: 'CHEMISTRY_GENERAL' as ClinicalTestCategory, code: 'ALT', nameKr: 'ALT', nameEn: 'Alanine aminotransferase', unit: 'U/L', method: 'Kinetic UV법', unitPrice: 10000, isPackage: false, packageItems: [], requiredSampleTypes: ['SERUM' as SampleType, 'PLASMA' as SampleType], minSampleVolume: 300, displayOrder: 11 },
  { category: 'CHEMISTRY_GENERAL' as ClinicalTestCategory, code: 'ALP', nameKr: 'ALP', nameEn: 'Alkaline phosphatase', unit: 'U/L', method: 'Kinetic colour법', unitPrice: 10000, isPackage: false, packageItems: [], requiredSampleTypes: ['SERUM' as SampleType, 'PLASMA' as SampleType], minSampleVolume: 300, displayOrder: 12 },
  { category: 'CHEMISTRY_GENERAL' as ClinicalTestCategory, code: 'BUN', nameKr: 'BUN', nameEn: 'Blood urea nitrogen', unit: 'mg/dL', method: 'Urease-UV법', unitPrice: 10000, isPackage: false, packageItems: [], requiredSampleTypes: ['SERUM' as SampleType, 'PLASMA' as SampleType], minSampleVolume: 300, displayOrder: 13 },
  { category: 'CHEMISTRY_GENERAL' as ClinicalTestCategory, code: 'CRE', nameKr: 'CRE', nameEn: 'Creatinine', unit: 'mg/dL', method: 'Jaffe법', unitPrice: 10000, isPackage: false, packageItems: [], requiredSampleTypes: ['SERUM' as SampleType, 'PLASMA' as SampleType], minSampleVolume: 300, displayOrder: 14 },
  { category: 'CHEMISTRY_GENERAL' as ClinicalTestCategory, code: 'GLU', nameKr: 'GLU', nameEn: 'Glucose', unit: 'mg/dL', method: 'Enzymatic UV법', unitPrice: 10000, isPackage: false, packageItems: [], requiredSampleTypes: ['SERUM' as SampleType, 'PLASMA' as SampleType], minSampleVolume: 300, displayOrder: 15 },
  { category: 'CHEMISTRY_GENERAL' as ClinicalTestCategory, code: 'TCHO', nameKr: 'TCHO', nameEn: 'Total cholesterol', unit: 'mg/dL', method: 'Kinetic colour법', unitPrice: 10000, isPackage: false, packageItems: [], requiredSampleTypes: ['SERUM' as SampleType, 'PLASMA' as SampleType], minSampleVolume: 300, displayOrder: 16 },
  { category: 'CHEMISTRY_GENERAL' as ClinicalTestCategory, code: 'TPRO', nameKr: 'TPRO', nameEn: 'Total protein', unit: 'g/L', method: 'Biuret법', unitPrice: 10000, isPackage: false, packageItems: [], requiredSampleTypes: ['SERUM' as SampleType, 'PLASMA' as SampleType], minSampleVolume: 300, displayOrder: 17 },
  { category: 'CHEMISTRY_GENERAL' as ClinicalTestCategory, code: 'ALB', nameKr: 'ALB', nameEn: 'Albumin', unit: 'g/dL', method: 'BCG 법', unitPrice: 10000, isPackage: false, packageItems: [], requiredSampleTypes: ['SERUM' as SampleType, 'PLASMA' as SampleType], minSampleVolume: 300, displayOrder: 19 },
  { category: 'CHEMISTRY_GENERAL' as ClinicalTestCategory, code: 'TBIL', nameKr: 'TBIL', nameEn: 'Total bilirubin', unit: 'mg/dL', method: 'Photometric colour법', unitPrice: 10000, isPackage: false, packageItems: [], requiredSampleTypes: ['SERUM' as SampleType, 'PLASMA' as SampleType], minSampleVolume: 300, displayOrder: 20 },
  { category: 'CHEMISTRY_GENERAL' as ClinicalTestCategory, code: 'TG', nameKr: 'TG', nameEn: 'Triglyceride', unit: 'mg/dL', method: 'Enzyme colour법', unitPrice: 10000, isPackage: false, packageItems: [], requiredSampleTypes: ['SERUM' as SampleType, 'PLASMA' as SampleType], minSampleVolume: 300, displayOrder: 21 },
  { category: 'CHEMISTRY_GENERAL' as ClinicalTestCategory, code: 'IP', nameKr: 'IP', nameEn: 'Inorganic phosphorus', unit: 'mg/dL', method: 'Photometric UV법', unitPrice: 10000, isPackage: false, packageItems: [], requiredSampleTypes: ['SERUM' as SampleType, 'PLASMA' as SampleType], minSampleVolume: 300, displayOrder: 22 },
  { category: 'CHEMISTRY_GENERAL' as ClinicalTestCategory, code: 'CA', nameKr: 'Ca', nameEn: 'Calcium', unit: 'mg/dL', method: 'O-CPC 법', unitPrice: 10000, isPackage: false, packageItems: [], requiredSampleTypes: ['SERUM' as SampleType, 'PLASMA' as SampleType], minSampleVolume: 300, displayOrder: 23 },
  // 전해질 - 패키지 (30,000원)
  {
    category: 'ELECTROLYTE' as ClinicalTestCategory,
    code: 'ELECTROLYTE',
    nameKr: '전해질 (Na⁺/K⁺/Cl⁻)',
    nameEn: 'Electrolytes (Sodium/Potassium/Chloride)',
    unit: 'mmol/L',
    method: '이온 선택 전극법',
    unitPrice: 30000,
    isPackage: true,
    packageItems: ['NA', 'K', 'CL'],
    requiredSampleTypes: ['SERUM' as SampleType, 'PLASMA' as SampleType],
    minSampleVolume: 300,
    displayOrder: 30,
  },
  // 혈액생화학 - 추가 (20,000원/항목)
  { category: 'CHEMISTRY_ADDITIONAL' as ClinicalTestCategory, code: 'LDL', nameKr: 'LDL', nameEn: 'Low density lipoprotein cholesterol', unit: 'mg/dL', method: 'Enzymatic colour법', unitPrice: 20000, isPackage: false, packageItems: [], requiredSampleTypes: ['SERUM' as SampleType], minSampleVolume: 300, displayOrder: 40 },
  { category: 'CHEMISTRY_ADDITIONAL' as ClinicalTestCategory, code: 'HDL', nameKr: 'HDL', nameEn: 'High density lipoprotein cholesterol', unit: 'mg/dL', method: 'Enzymatic colour법', unitPrice: 20000, isPackage: false, packageItems: [], requiredSampleTypes: ['SERUM' as SampleType], minSampleVolume: 300, displayOrder: 41 },
  { category: 'CHEMISTRY_ADDITIONAL' as ClinicalTestCategory, code: 'GGT', nameKr: 'γ-GTP', nameEn: 'Gamma Glutamyl transpeptidase', unit: 'U/L', method: 'Kinetic colour법', unitPrice: 20000, isPackage: false, packageItems: [], requiredSampleTypes: ['SERUM' as SampleType], minSampleVolume: 300, displayOrder: 42 },
  // 혈액생화학 - 추가 (30,000원/항목)
  { category: 'CHEMISTRY_ADDITIONAL' as ClinicalTestCategory, code: 'CRP', nameKr: 'CRP', nameEn: 'C-reactive protein', unit: 'mg/L', method: 'Immunoturbidimetric', unitPrice: 30000, isPackage: false, packageItems: [], requiredSampleTypes: ['SERUM' as SampleType], minSampleVolume: 300, displayOrder: 50 },
  // 혈액응고검사 (10,000원/항목)
  { category: 'COAGULATION' as ClinicalTestCategory, code: 'PT', nameKr: 'PT', nameEn: 'Prothrombin Time', unit: 'sec', method: 'Clotting법', unitPrice: 10000, isPackage: false, packageItems: [], requiredSampleTypes: ['PLASMA' as SampleType], minSampleVolume: 300, displayOrder: 60 },
  { category: 'COAGULATION' as ClinicalTestCategory, code: 'APTT', nameKr: 'APTT', nameEn: 'Activated Partial Thromboplastin Time', unit: 'sec', method: 'Clotting법', unitPrice: 10000, isPackage: false, packageItems: [], requiredSampleTypes: ['PLASMA' as SampleType], minSampleVolume: 300, displayOrder: 61 },
  { category: 'COAGULATION' as ClinicalTestCategory, code: 'FIB', nameKr: 'FIB', nameEn: 'Fibrinogen', unit: 'mg/dL', method: 'Clauss법', unitPrice: 10000, isPackage: false, packageItems: [], requiredSampleTypes: ['PLASMA' as SampleType], minSampleVolume: 300, displayOrder: 62 },
  // 요검사
  { category: 'URINALYSIS' as ClinicalTestCategory, code: 'UA_GENERAL', nameKr: '요 일반검사', nameEn: 'Urinalysis - General', unit: null, method: 'Dipstick, Microscopy', unitPrice: 10000, isPackage: false, packageItems: [], requiredSampleTypes: ['URINE' as SampleType], minSampleVolume: 500, displayOrder: 70 },
  { category: 'URINALYSIS' as ClinicalTestCategory, code: 'UA_SEDIMENT', nameKr: '요침사검사', nameEn: 'Urine Sediment', unit: null, method: 'Microscopy', unitPrice: 20000, isPackage: false, packageItems: [], requiredSampleTypes: ['URINE' as SampleType], minSampleVolume: 500, displayOrder: 71 },
  // 요 생화학 (30,000원/항목)
  { category: 'URINE_CHEMISTRY' as ClinicalTestCategory, code: 'U_CRE', nameKr: 'U-CRE', nameEn: 'Urine Creatinine', unit: 'mg/dL', method: 'Jaffe법', unitPrice: 30000, isPackage: false, packageItems: [], requiredSampleTypes: ['URINE' as SampleType], minSampleVolume: 300, displayOrder: 83 },
  { category: 'URINE_CHEMISTRY' as ClinicalTestCategory, code: 'U_TP', nameKr: 'U-TP', nameEn: 'Urine Total protein', unit: 'mg/dL', method: 'Pyrogallol red법', unitPrice: 30000, isPackage: false, packageItems: [], requiredSampleTypes: ['URINE' as SampleType], minSampleVolume: 300, displayOrder: 84 },
];

const clinicalQcSettings = [
  { category: 'CBC' as ClinicalTestCategory, thresholdCount: 100, qcFee: 400000 },
  { category: 'DIFF' as ClinicalTestCategory, thresholdCount: 100, qcFee: 400000 },
  { category: 'RETIC' as ClinicalTestCategory, thresholdCount: 100, qcFee: 400000 },
  { category: 'CHEMISTRY_GENERAL' as ClinicalTestCategory, thresholdCount: 100, qcFee: 400000 },
  { category: 'ELECTROLYTE' as ClinicalTestCategory, thresholdCount: 100, qcFee: 400000 },
  { category: 'CHEMISTRY_ADDITIONAL' as ClinicalTestCategory, thresholdCount: 100, qcFee: 400000 },
  { category: 'COAGULATION' as ClinicalTestCategory, thresholdCount: 100, qcFee: 400000 },
  { category: 'URINALYSIS' as ClinicalTestCategory, thresholdCount: 100, qcFee: 400000 },
  { category: 'URINE_CHEMISTRY' as ClinicalTestCategory, thresholdCount: 100, qcFee: 400000 },
];

export async function seedClinicalPathologyData() {
  console.log('🔬 Seeding Clinical Pathology data...');
  
  // 검사항목 시드
  for (const item of clinicalTestItems) {
    await prisma.clinicalTestItem.upsert({
      where: { code: item.code },
      update: item,
      create: item,
    });
  }
  console.log(`  ✓ ${clinicalTestItems.length} test items seeded`);
  
  // QC 설정 시드
  for (const setting of clinicalQcSettings) {
    await prisma.clinicalQcSetting.upsert({
      where: { category: setting.category },
      update: setting,
      create: setting,
    });
  }
  console.log(`  ✓ ${clinicalQcSettings.length} QC settings seeded`);
  
  console.log('✅ Clinical Pathology seed completed');
  
  return {
    testItems: clinicalTestItems.length,
    qcSettings: clinicalQcSettings.length,
  };
}
