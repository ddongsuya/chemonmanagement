# 임상병리검사 모듈 - 마스터데이터 시드

---

## 5. 마스터데이터 초기값

### 5.1 검사항목 시드 데이터

```typescript
// prisma/seed/clinical-pathology-items.ts

import { ClinicalTestCategory, SampleType } from '@prisma/client';

export const clinicalTestItems = [
  // ==================== CBC (일반혈액학) - 패키지 ====================
  {
    category: 'CBC',
    code: 'CBC',
    nameKr: 'CBC (일반혈액학)',
    nameEn: 'Complete Blood Count',
    unit: null,
    method: 'Flowcytometry',
    unitPrice: 50000,
    isPackage: true,
    packageItems: ['WBC', 'RBC', 'HGB', 'HCT', 'MCV', 'MCH', 'MCHC', 'RDW', 'HDW', 'PLT', 'MPV'],
    requiredSampleTypes: ['WHOLE_BLOOD'],
    minSampleVolume: 200,
    requiresItem: null,
    displayOrder: 1,
  },
  
  // ==================== DIFF (백혈구감별) - 패키지 ====================
  {
    category: 'DIFF',
    code: 'DIFF',
    nameKr: 'DIFF (백혈구감별계수)',
    nameEn: 'WBC Differential Count',
    unit: null,
    method: 'Flowcytometry, Peroxidase staining',
    unitPrice: 50000,
    isPackage: true,
    packageItems: ['NEU', 'LYM', 'MONO', 'EOS', 'BASO', 'LUC'],
    requiredSampleTypes: ['WHOLE_BLOOD'],
    minSampleVolume: 200,
    requiresItem: 'CBC',  // CBC 필수
    displayOrder: 2,
  },
  
  // ==================== RETIC (망상적혈구) ====================
  {
    category: 'RETIC',
    code: 'RETIC',
    nameKr: 'RETIC (망상적혈구)',
    nameEn: 'Reticulocyte',
    unit: '%',
    method: 'Flowcytometry, Isovolumetry',
    unitPrice: 30000,
    isPackage: false,
    packageItems: [],
    requiredSampleTypes: ['WHOLE_BLOOD'],
    minSampleVolume: 200,
    requiresItem: null,
    displayOrder: 3,
  },
  
  // ==================== 혈액생화학 - 일반 (10,000원/항목) ====================
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'AST',
    nameKr: 'AST',
    nameEn: 'Aspartate aminotransferase',
    unit: 'U/L',
    method: 'Kinetic UV법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 10,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'ALT',
    nameKr: 'ALT',
    nameEn: 'Alanine aminotransferase',
    unit: 'U/L',
    method: 'Kinetic UV법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 11,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'ALP',
    nameKr: 'ALP',
    nameEn: 'Alkaline phosphatase',
    unit: 'U/L',
    method: 'Kinetic colour법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 12,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'BUN',
    nameKr: 'BUN',
    nameEn: 'Blood urea nitrogen',
    unit: 'mg/dL',
    method: 'Urease-UV법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 13,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'CRE',
    nameKr: 'CRE',
    nameEn: 'Creatinine',
    unit: 'mg/dL',
    method: 'Jaffe법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 14,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'GLU',
    nameKr: 'GLU',
    nameEn: 'Glucose',
    unit: 'mg/dL',
    method: 'Enzymatic UV법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 15,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'TCHO',
    nameKr: 'TCHO',
    nameEn: 'Total cholesterol',
    unit: 'mg/dL',
    method: 'Kinetic colour법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 16,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'TPRO',
    nameKr: 'TPRO',
    nameEn: 'Total protein',
    unit: 'g/L',
    method: 'Biuret법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 17,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'CPK',
    nameKr: 'CPK',
    nameEn: 'Creatine phosphokinase',
    unit: 'U/L',
    method: 'Kinetic UV법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 18,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'ALB',
    nameKr: 'ALB',
    nameEn: 'Albumin',
    unit: 'g/dL',
    method: 'BCG 법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 19,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'TBIL',
    nameKr: 'TBIL',
    nameEn: 'Total bilirubin',
    unit: 'mg/dL',
    method: 'Photometric colour법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 20,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'TG',
    nameKr: 'TG',
    nameEn: 'Triglyceride',
    unit: 'mg/dL',
    method: 'Enzyme colour법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 21,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'IP',
    nameKr: 'IP',
    nameEn: 'Inorganic phosphorus',
    unit: 'mg/dL',
    method: 'Photometric UV법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 22,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'CA',
    nameKr: 'Ca',
    nameEn: 'Calcium',
    unit: 'mg/dL',
    method: 'O-CPC 법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 23,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'AG_RATIO',
    nameKr: 'A/G ratio',
    nameEn: 'Albumin/Globulin ratio',
    unit: 'ratio',
    method: 'PRO, ALB로 산출',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 24,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    code: 'LDH',
    nameKr: 'LDH',
    nameEn: 'Lactate dehydrogenase',
    unit: 'U/L',
    method: 'Kinetic UV법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 25,
  },
  
  // ==================== 전해질 - 패키지 (30,000원) ====================
  {
    category: 'ELECTROLYTE',
    code: 'ELECTROLYTE',
    nameKr: '전해질 (Na⁺/K⁺/Cl⁻)',
    nameEn: 'Electrolytes (Sodium/Potassium/Chloride)',
    unit: 'mmol/L',
    method: '이온 선택 전극법',
    unitPrice: 30000,
    isPackage: true,
    packageItems: ['NA', 'K', 'CL'],
    requiredSampleTypes: ['SERUM', 'PLASMA'],
    minSampleVolume: 300,
    displayOrder: 30,
  },
  
  // ==================== 혈액생화학 - 추가 (20,000원/항목) ====================
  {
    category: 'CHEMISTRY_ADDITIONAL',
    code: 'LDL',
    nameKr: 'LDL',
    nameEn: 'Low density lipoprotein cholesterol',
    unit: 'mg/dL',
    method: 'Enzymatic colour법',
    unitPrice: 20000,
    isPackage: false,
    requiredSampleTypes: ['SERUM'],
    minSampleVolume: 300,
    displayOrder: 40,
  },
  {
    category: 'CHEMISTRY_ADDITIONAL',
    code: 'HDL',
    nameKr: 'HDL',
    nameEn: 'High density lipoprotein cholesterol',
    unit: 'mg/dL',
    method: 'Enzymatic colour법',
    unitPrice: 20000,
    isPackage: false,
    requiredSampleTypes: ['SERUM'],
    minSampleVolume: 300,
    displayOrder: 41,
  },
  {
    category: 'CHEMISTRY_ADDITIONAL',
    code: 'GGT',
    nameKr: 'γ-GTP',
    nameEn: 'Gamma Glutamyl transpeptidase',
    unit: 'U/L',
    method: 'Kinetic colour법',
    unitPrice: 20000,
    isPackage: false,
    requiredSampleTypes: ['SERUM'],
    minSampleVolume: 300,
    displayOrder: 42,
  },
  
  // ==================== 혈액생화학 - 추가 (30,000원/항목) ====================
  {
    category: 'CHEMISTRY_ADDITIONAL',
    code: 'CRP',
    nameKr: 'CRP',
    nameEn: 'C-reactive protein',
    unit: 'mg/L',
    method: 'Immunoturbidimetric',
    unitPrice: 30000,
    isPackage: false,
    requiredSampleTypes: ['SERUM'],
    minSampleVolume: 300,
    displayOrder: 50,
  },
  {
    category: 'CHEMISTRY_ADDITIONAL',
    code: 'UA',
    nameKr: 'UA',
    nameEn: 'Uric acid',
    unit: 'mg/dL',
    method: 'Enzymatic colour법',
    unitPrice: 30000,
    isPackage: false,
    requiredSampleTypes: ['SERUM'],
    minSampleVolume: 300,
    displayOrder: 51,
  },
  {
    category: 'CHEMISTRY_ADDITIONAL',
    code: 'MA',
    nameKr: 'MA',
    nameEn: 'Magnesium',
    unit: 'mg/dL',
    method: 'Xylidyl blue법',
    unitPrice: 30000,
    isPackage: false,
    requiredSampleTypes: ['SERUM'],
    minSampleVolume: 300,
    displayOrder: 52,
  },
  {
    category: 'CHEMISTRY_ADDITIONAL',
    code: 'BICABO',
    nameKr: 'BICABO',
    nameEn: 'Bicarbonate',
    unit: 'mmol/L',
    method: 'Enzymatic법',
    unitPrice: 30000,
    isPackage: false,
    requiredSampleTypes: ['SERUM'],
    minSampleVolume: 300,
    displayOrder: 53,
  },
  {
    category: 'CHEMISTRY_ADDITIONAL',
    code: 'CRP_L',
    nameKr: 'CRP-L',
    nameEn: 'C-reactive protein - Latex',
    unit: 'mg/L',
    method: 'Latex immunoturbidimetric',
    unitPrice: 30000,
    isPackage: false,
    requiredSampleTypes: ['SERUM'],
    minSampleVolume: 300,
    displayOrder: 54,
  },
  {
    category: 'CHEMISTRY_ADDITIONAL',
    code: 'MICRO_ALB',
    nameKr: 'micro-ALB',
    nameEn: 'Micro Albumin',
    unit: 'mg/L',
    method: 'Immunoturbidimetric',
    unitPrice: 30000,
    isPackage: false,
    requiredSampleTypes: ['SERUM', 'URINE'],
    minSampleVolume: 300,
    displayOrder: 55,
  },
  {
    category: 'CHEMISTRY_ADDITIONAL',
    code: 'HBA1C',
    nameKr: 'HbA1c',
    nameEn: 'Hemoglobin A1c',
    unit: '%',
    method: 'HPLC',
    unitPrice: 30000,
    isPackage: false,
    requiredSampleTypes: ['WHOLE_BLOOD'],
    minSampleVolume: 200,
    displayOrder: 56,
  },
  
  // ==================== 혈액응고검사 (10,000원/항목) ====================
  {
    category: 'COAGULATION',
    code: 'PT',
    nameKr: 'PT',
    nameEn: 'Prothrombin Time',
    unit: 'sec',
    method: 'Clotting법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['PLASMA'],
    minSampleVolume: 300,
    displayOrder: 60,
  },
  {
    category: 'COAGULATION',
    code: 'APTT',
    nameKr: 'APTT',
    nameEn: 'Activated Partial Thromboplastin Time',
    unit: 'sec',
    method: 'Clotting법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['PLASMA'],
    minSampleVolume: 300,
    displayOrder: 61,
  },
  {
    category: 'COAGULATION',
    code: 'FIB',
    nameKr: 'FIB',
    nameEn: 'Fibrinogen',
    unit: 'mg/dL',
    method: 'Clauss법',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['PLASMA'],
    minSampleVolume: 300,
    displayOrder: 62,
  },
  
  // ==================== 요검사 ====================
  {
    category: 'URINALYSIS',
    code: 'UA_GENERAL',
    nameKr: '요 일반검사',
    nameEn: 'Urinalysis - General',
    unit: null,
    method: 'Dipstick, Microscopy',
    unitPrice: 10000,
    isPackage: false,
    requiredSampleTypes: ['URINE'],
    minSampleVolume: 500,
    displayOrder: 70,
  },
  {
    category: 'URINALYSIS',
    code: 'UA_SEDIMENT',
    nameKr: '요침사검사',
    nameEn: 'Urine Sediment',
    unit: null,
    method: 'Microscopy',
    unitPrice: 20000,
    isPackage: false,
    requiredSampleTypes: ['URINE'],
    minSampleVolume: 500,
    displayOrder: 71,
  },
  
  // ==================== 요 생화학 (30,000원/항목) ====================
  {
    category: 'URINE_CHEMISTRY',
    code: 'U_UA',
    nameKr: 'U-UA',
    nameEn: 'Urine Uric acid',
    unit: 'mg/dL',
    method: 'Enzymatic colour법',
    unitPrice: 30000,
    isPackage: false,
    requiredSampleTypes: ['URINE'],
    minSampleVolume: 300,
    displayOrder: 80,
  },
  {
    category: 'URINE_CHEMISTRY',
    code: 'U_MA',
    nameKr: 'U-MA',
    nameEn: 'Urine Magnesium',
    unit: 'mg/dL',
    method: 'Xylidyl blue법',
    unitPrice: 30000,
    isPackage: false,
    requiredSampleTypes: ['URINE'],
    minSampleVolume: 300,
    displayOrder: 81,
  },
  {
    category: 'URINE_CHEMISTRY',
    code: 'U_BUN',
    nameKr: 'U-BUN',
    nameEn: 'Urine Blood urea nitrogen',
    unit: 'mg/dL',
    method: 'Urease-UV법',
    unitPrice: 30000,
    isPackage: false,
    requiredSampleTypes: ['URINE'],
    minSampleVolume: 300,
    displayOrder: 82,
  },
  {
    category: 'URINE_CHEMISTRY',
    code: 'U_CRE',
    nameKr: 'U-CRE',
    nameEn: 'Urine Creatinine',
    unit: 'mg/dL',
    method: 'Jaffe법',
    unitPrice: 30000,
    isPackage: false,
    requiredSampleTypes: ['URINE'],
    minSampleVolume: 300,
    displayOrder: 83,
  },
  {
    category: 'URINE_CHEMISTRY',
    code: 'U_TP',
    nameKr: 'U-TP',
    nameEn: 'Urine Total protein',
    unit: 'mg/dL',
    method: 'Pyrogallol red법',
    unitPrice: 30000,
    isPackage: false,
    requiredSampleTypes: ['URINE'],
    minSampleVolume: 300,
    displayOrder: 84,
  },
  {
    category: 'URINE_CHEMISTRY',
    code: 'U_CA',
    nameKr: 'U-Ca',
    nameEn: 'Urine Calcium',
    unit: 'mg/dL',
    method: 'O-CPC 법',
    unitPrice: 30000,
    isPackage: false,
    requiredSampleTypes: ['URINE'],
    minSampleVolume: 300,
    displayOrder: 85,
  },
];
```

### 5.2 QC 설정 시드 데이터

```typescript
// prisma/seed/clinical-qc-settings.ts

export const clinicalQcSettings = [
  {
    category: 'CBC',
    thresholdCount: 100,
    qcFee: 400000,
  },
  {
    category: 'DIFF',
    thresholdCount: 100,
    qcFee: 400000,
  },
  {
    category: 'RETIC',
    thresholdCount: 100,
    qcFee: 400000,
  },
  {
    category: 'CHEMISTRY_GENERAL',
    thresholdCount: 100,
    qcFee: 400000,
  },
  {
    category: 'ELECTROLYTE',
    thresholdCount: 100,
    qcFee: 400000,
  },
  {
    category: 'CHEMISTRY_ADDITIONAL',
    thresholdCount: 100,
    qcFee: 400000,
  },
  {
    category: 'COAGULATION',
    thresholdCount: 100,
    qcFee: 400000,
  },
  {
    category: 'URINALYSIS',
    thresholdCount: 100,
    qcFee: 400000,
  },
  {
    category: 'URINE_CHEMISTRY',
    thresholdCount: 100,
    qcFee: 400000,
  },
];
```

### 5.3 동물 종 옵션

```typescript
// constants/animal-species.ts

export const ANIMAL_SPECIES = [
  { value: 'RAT', label: 'Rat (랫드)' },
  { value: 'MOUSE', label: 'Mouse (마우스)' },
  { value: 'RABBIT', label: 'Rabbit (토끼)' },
  { value: 'DOG', label: 'Dog (개)' },
  { value: 'MONKEY', label: 'Monkey (원숭이)' },
  { value: 'MINIPIG', label: 'Minipig (미니피그)' },
  { value: 'GUINEA_PIG', label: 'Guinea pig (기니피그)' },
  { value: 'HAMSTER', label: 'Hamster (햄스터)' },
  { value: 'OTHER', label: '기타' },
];
```

---

## 6. 카테고리별 가격 요약

| 카테고리 | 항목 수 | 가격 구조 | 단가(원) |
|----------|--------|----------|----------|
| CBC | 1 (11항목 패키지) | 패키지 | 50,000 |
| DIFF | 1 (6항목 패키지) | 패키지 | 50,000 |
| RETIC | 1 | 개별 | 30,000 |
| 일반 생화학 | 16 | 개별 | 10,000 |
| 전해질 | 1 (3항목 패키지) | 패키지 | 30,000 |
| 추가 생화학 (LDL, HDL, γ-GTP) | 3 | 개별 | 20,000 |
| 추가 생화학 (CRP, UA 등) | 7 | 개별 | 30,000 |
| 혈액응고검사 | 3 | 개별 | 10,000 |
| 요검사 - 일반 | 1 | 개별 | 10,000 |
| 요검사 - 요침사 | 1 | 개별 | 20,000 |
| 요 생화학 | 6 | 개별 | 30,000 |

**총 검사항목 수**: 40개

---

## 7. 구현 우선순위

### Phase 1: 기본 기능 (1주)
- [ ] 스키마 적용 (마이그레이션)
- [ ] 마스터데이터 시드
- [ ] 견적서 CRUD API
- [ ] 견적서 작성 UI

### Phase 2: 핵심 기능 (1주)
- [ ] 금액 자동 계산
- [ ] 검체-검사항목 연결 로직
- [ ] DIFF-CBC 의존성 체크
- [ ] QC 비용 자동 계산
- [ ] 할인 설정

### Phase 3: PDF & 연동 (1주)
- [ ] 견적서 PDF 생성 (기존 양식)
- [ ] 시험의뢰서 CRUD
- [ ] 견적서 → 시험의뢰서 전환
- [ ] 시험의뢰서 PDF 생성

### Phase 4: 관리 기능 (3일)
- [ ] 마스터데이터 관리 UI
- [ ] 검사항목 추가/수정/삭제
- [ ] QC 설정 관리
- [ ] 가격 일괄 수정

---

*문서 끝*
