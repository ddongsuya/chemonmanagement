// ============================================================
// 코아스템켐온 마스터 데이터: 내부단가표 + 동물 가격표
// 프론트엔드 하드코딩 → 추후 백엔드 DB 마이그레이션 대상
// ============================================================

// -------------------------------------------------------
// 1. 내부 단가표 (효력시험 항목별 단가)
// -------------------------------------------------------

export interface PriceItem {
  id: number;
  category: string;
  code: string;
  name: string;
  price: number;
  unit: string;
  note: string;
}

export const PRICE_TABLE: PriceItem[] = [
  // === 사육비 ===
  { id: 1,  category: '사육비',      code: 'HOUSING_RAT',       name: '랫드 사육',             price: 2000,    unit: '/head/일',   note: '' },
  { id: 2,  category: '사육비',      code: 'HOUSING_MOUSE',     name: '마우스 사육',            price: 1500,    unit: '/head/일',   note: '' },
  { id: 3,  category: '사육비',      code: 'HOUSING_GUINEA',    name: '기니피그/햄스터',         price: 10000,   unit: '/head/일',   note: '' },
  { id: 4,  category: '사육비',      code: 'HOUSING_RABBIT',    name: '토끼 사육',             price: 20000,   unit: '/head/일',   note: '' },
  { id: 5,  category: '사육비',      code: 'HOUSING_BEAGLE',    name: '비글 사육',             price: 30000,   unit: '/head/일',   note: '' },
  { id: 6,  category: '사육비',      code: 'HOUSING_PIG',       name: '돼지 사육',             price: 40000,   unit: '/head/일',   note: '' },

  // === 질환유발모델 ===
  { id: 7,  category: '질환유발모델',  code: 'MODEL_CHEM',        name: '화학물질 유도 모델',      price: 30000,   unit: '/head',    note: 'Formalin/SNL/CCI 각각 차이' },
  { id: 8,  category: '질환유발모델',  code: 'MODEL_TAC',         name: 'TAC 심부전 (최상)',      price: 500000,  unit: '/head',    note: '' },
  { id: 9,  category: '질환유발모델',  code: 'MODEL_SNL',         name: 'SNL 통증 (상)',         price: 300000,  unit: '/head',    note: '' },
  { id: 10, category: '질환유발모델',  code: 'MODEL_CCI',         name: 'CCI 통증 (중)',         price: 200000,  unit: '/head',    note: '' },
  { id: 11, category: '질환유발모델',  code: 'MODEL_MIA',         name: 'MIA 골관절염 (저)',      price: 50000,   unit: '/head',    note: '' },
  { id: 12, category: '질환유발모델',  code: 'MODEL_AMYLOID',     name: '치매 amyloid beta',    price: 100000,  unit: '/head',    note: '뇌실내투여' },
  { id: 13, category: '질환유발모델',  code: 'MODEL_PARKINSON',   name: '파킨슨 모델',           price: 120000,  unit: '/head',    note: '랫드 뇌실질내투여' },
  { id: 14, category: '질환유발모델',  code: 'MODEL_HPD',         name: 'HPD 비글견 수술',       price: 5000000, unit: '/head',    note: '금속관/클립/기계 별도' },
  { id: 15, category: '질환유발모델',  code: 'MODEL_OA_MOUSE',    name: '골관절염 ACLT+DMM(마우스)', price: 100000, unit: '/head',   note: '' },
  { id: 16, category: '질환유발모델',  code: 'MODEL_OA_RAT',      name: '골관절염 ACLT+DMM(랫드)',  price: 100000, unit: '/head',   note: '' },
  { id: 17, category: '질환유발모델',  code: 'MODEL_OA_RABBIT',   name: '골관절염 ACLT+DMM(토끼)',  price: 200000, unit: '/head',   note: '' },
  { id: 18, category: '질환유발모델',  code: 'MODEL_OVA',         name: 'OVA 만성천식모델',       price: 100000,  unit: '/head',    note: '' },

  // === 투여(소동물) ===
  { id: 19, category: '투여(소동물)', code: 'ADMIN_PO_IP_IM',     name: '일반(경구/복강/근육)',    price: 5000,    unit: '/head',    note: '' },
  { id: 20, category: '투여(소동물)', code: 'ADMIN_IV',           name: '정맥',                 price: 20000,   unit: '/head',    note: '' },
  { id: 21, category: '투여(소동물)', code: 'ADMIN_IV_INF_SURG',  name: '정맥infusion(수술)',    price: 100000,  unit: '/head',    note: '' },
  { id: 22, category: '투여(소동물)', code: 'ADMIN_IV_INF_HR',    name: '정맥infusion(시간당)',   price: 70000,   unit: '/head/시간', note: '' },
  { id: 23, category: '투여(소동물)', code: 'ADMIN_SPECIAL',      name: '특수(개복/수술)',        price: 300000,  unit: '/head',    note: '' },

  // === 투여(대동물) ===
  { id: 24, category: '투여(대동물)', code: 'ADMIN_LG_PO_IM',     name: '일반(경구/근육)',        price: 10000,   unit: '/head',    note: '' },
  { id: 25, category: '투여(대동물)', code: 'ADMIN_LG_IV',        name: '정맥bolus',            price: 30000,   unit: '/head',    note: '' },
  { id: 26, category: '투여(대동물)', code: 'ADMIN_LG_INF',       name: '정맥infusion(시간당)',   price: 150000,  unit: '/head/시간', note: '' },
  { id: 27, category: '투여(대동물)', code: 'ADMIN_LG_SURG',      name: '특수(개복/수술)',        price: 500000,  unit: '/head',    note: '' },

  // === 항암 ===
  { id: 28, category: '항암',        code: 'TUMOR_SC',           name: '암세포 피하투여',        price: 70000,   unit: '/head',    note: '' },
  { id: 29, category: '항암',        code: 'TUMOR_IV',           name: '암세포 정맥투여',        price: 100000,  unit: '/head',    note: '' },
  { id: 30, category: '항암',        code: 'CELL_CULTURE',       name: '세포배양비',            price: 100000,  unit: '/일',       note: '2주 소요' },
  { id: 31, category: '항암',        code: 'TUMOR_SIZE',         name: '종양크기측정',           price: 5000,    unit: '/head',    note: '' },
  { id: 32, category: '항암',        code: 'TUMOR_WEIGHT',       name: '종양무게측정',           price: 5000,    unit: '/head',    note: '' },
  { id: 33, category: '항암',        code: 'CELL_ATCC',          name: '암세포(ATCC 미국)',     price: 2000000, unit: '/vial',    note: '' },
  { id: 34, category: '항암',        code: 'CELL_DOMESTIC',       name: '암세포(국내세포주은행)',   price: 300000,  unit: '/vial',    note: '' },

  // === 체중/체온 ===
  { id: 35, category: '체중/체온',    code: 'BW_TEMP',            name: '체중&체온(무마취)',       price: 10000,   unit: '/head',    note: '' },

  // === 행동평가 ===
  { id: 36, category: '행동평가',     code: 'WATER_MAZE',         name: 'Water maze',          price: 70000,   unit: '/head',    note: '난이도 중' },
  { id: 37, category: '행동평가',     code: 'Y_MAZE',             name: 'Y maze',              price: 50000,   unit: '/head',    note: '난이도 하' },
  { id: 38, category: '행동평가',     code: 'GRIP',               name: 'Grip strength',       price: 70000,   unit: '/head',    note: '' },
  { id: 39, category: '행동평가',     code: 'ROTAROD',            name: 'Rota-rod',            price: 50000,   unit: '/head',    note: '3일 적응' },
  { id: 40, category: '행동평가',     code: 'TREADMILL',          name: 'Treadmill',           price: 40000,   unit: '/head',    note: '2일 적응' },
  { id: 41, category: '행동평가',     code: 'HANGING',            name: 'Hanging test',        price: 90000,   unit: '/head',    note: '' },
  { id: 42, category: '행동평가',     code: 'PA',                 name: 'Passive avoidance',   price: 70000,   unit: '/head',    note: '' },
  { id: 43, category: '행동평가',     code: 'RANDALL',            name: 'Randall-Selitto',     price: 10000,   unit: '/head',    note: '압통' },
  { id: 44, category: '행동평가',     code: 'VON_FREY',           name: 'Von Frey',            price: 60000,   unit: '/head',    note: '' },

  // === 영상 ===
  { id: 45, category: '영상',        code: 'MRI_RAT',            name: 'MRI(랫드 1site)',      price: 200000,  unit: '/head',    note: '' },
  { id: 46, category: '영상',        code: 'MRI_RABBIT',         name: 'MRI(토끼 1site)',      price: 300000,  unit: '/head',    note: '' },
  { id: 47, category: '영상',        code: 'MRI_TRANS',          name: 'MRI 운송+출장',         price: 2000000, unit: '/회',       note: '외부' },
  { id: 48, category: '영상',        code: 'DEXA',               name: 'DEXA',                price: 200000,  unit: '/head',    note: '' },
  { id: 49, category: '영상',        code: 'MICRO_CT',           name: 'Micro-CT',            price: 250000,  unit: '/head',    note: '' },
  { id: 50, category: '영상',        code: 'ECHO',               name: '초음파(echo)',          price: 250000,  unit: '/head',    note: '' },
  { id: 51, category: '영상',        code: 'HEMODY',             name: 'Hemodynamics',        price: 500000,  unit: '/head',    note: '' },

  // === 분자생물학/채혈 ===
  { id: 52, category: '분자생물학/채혈', code: 'PCR',              name: 'PCR',                 price: 60000,   unit: '/head',    note: '시약포함' },
  { id: 53, category: '분자생물학/채혈', code: 'GASTRIC_PH',       name: '위산도측정',            price: 20000,   unit: '/head',    note: '' },
  { id: 54, category: '분자생물학/채혈', code: 'GASTRIC_COL',      name: '위산채취',              price: 20000,   unit: '/head',    note: '' },
  { id: 55, category: '분자생물학/채혈', code: 'BL_BEAGLE',        name: '채혈(비글 경정맥)',      price: 20000,   unit: '/head/회',  note: '' },
  { id: 56, category: '분자생물학/채혈', code: 'BL_RAT',           name: '채혈(랫드 경정맥)',      price: 15000,   unit: '/head/회',  note: '' },
  { id: 57, category: '분자생물학/채혈', code: 'BL_PIG',           name: '채혈(돼지 경정맥)',      price: 30000,   unit: '/head/회',  note: '' },
  { id: 58, category: '분자생물학/채혈', code: 'BL_GLUCOSE',       name: '혈당채혈(꼬리끝)',       price: 10000,   unit: '/head/회',  note: '' },
  { id: 59, category: '분자생물학/채혈', code: 'BL_NECRO',         name: '채혈(부검시 복대정맥)',   price: 15000,   unit: '/head/회',  note: '' },
  { id: 60, category: '분자생물학/채혈', code: 'PLASMA_CK',        name: '혈장CK분석',            price: 10000,   unit: '/head',    note: '' },
  { id: 61, category: '분자생물학/채혈', code: 'QC',               name: 'QC',                  price: 200000,  unit: '/head',    note: '' },
  { id: 62, category: '분자생물학/채혈', code: 'WESTERN',          name: 'Western blot',        price: 50000,   unit: '/head/단백질1종', note: '항체 별도 60~100만' },
  { id: 63, category: '분자생물학/채혈', code: 'ELISA_LABOR',      name: 'ELISA(인건비)',         price: 50000,   unit: '/head',    note: '' },
  { id: 64, category: '분자생물학/채혈', code: 'ELISA_KIT',        name: 'ELISA kit',           price: 1000000, unit: '/개',       note: '' },
  { id: 65, category: '분자생물학/채혈', code: 'NECROPSY',         name: '부검(장기무게 등)',      price: 20000,   unit: '/head',    note: '' },

  // === 조직병리 ===
  { id: 66, category: '조직병리',     code: 'HE_MT',              name: 'H&E/MT staining',    price: 100000,  unit: '/head',    note: '' },
  { id: 67, category: '조직병리',     code: 'SAFRANIN',           name: 'Safranin-O',          price: 90000,   unit: '/head',    note: '' },
  { id: 68, category: '조직병리',     code: 'IHC',                name: 'IHC staining',        price: 200000,  unit: '/head',    note: '항체 별도' },
  { id: 69, category: '조직병리',     code: 'UNSTAIN',            name: 'Unstain slide',       price: 10000,   unit: '/head',    note: '기본3장' },
  { id: 70, category: '조직병리',     code: 'UNSTAIN_ADD',        name: 'Unstain 추가',         price: 2000,    unit: '/장',       note: '' },
  { id: 71, category: '조직병리',     code: 'HISTO_RPT',          name: '조직병리 보고서',        price: 1000000, unit: '/건',       note: '' },

  // === 기타 ===
  { id: 72, category: '기타',        code: 'REPORT_ETC',         name: '보고서+기타',           price: 3000000, unit: '/건',       note: '영업이익10%반영' },

  // === 양성대조물질 ===
  { id: 73, category: '양성대조물질',  code: 'PC_GABA',            name: 'Gabapentin(시그마)',    price: 689896,  unit: '/EA',      note: '1287303, 250mg' },
  { id: 74, category: '양성대조물질',  code: 'PC_PREG',            name: 'Pregabalin(시그마)',    price: 323379,  unit: '/EA',      note: 'Y0001805' },
];

// -------------------------------------------------------
// 2. 동물 가격표 (업체별)
// -------------------------------------------------------

export type AnimalVendor = '자바이오' | '오리엔트바이오' | '코아텍';

export interface AnimalPrice {
  vendor: AnimalVendor;
  strain: string;
  category: string;
  priceByWeek: Record<string, number | null>;
  tp?: number | null;
  extraPerWeek?: number | null;
  note?: string;
}

export const ANIMAL_PRICES: AnimalPrice[] = [
  // === 자바이오 ===
  { vendor: '자바이오', strain: 'BALB/c-nu/ArcGem', category: 'Mutant',
    priceByWeek: { '4W': 50000, '5W': 55000, '6W': 60000, '7W': 65000, '8W': 70000 }, tp: null },
  { vendor: '자바이오', strain: 'BALB/c', category: 'Inbred',
    priceByWeek: { '3W': 16500, '4W': 17000, '5W': 18500, '6W': 19000, '7W': 20600, '8W': 21500 }, tp: 95000 },
  { vendor: '자바이오', strain: 'C57BL/6N', category: 'Inbred',
    priceByWeek: { '3W': 16500, '4W': 17000, '5W': 18500, '6W': 19000, '7W': 20600, '8W': 21500 }, tp: 95000 },
  { vendor: '자바이오', strain: 'C57BL/6J', category: 'Inbred',
    priceByWeek: { '3W': 17500, '4W': 18000, '5W': 19200, '6W': 19800, '7W': 21500, '8W': 22500 }, tp: 99000 },
  { vendor: '자바이오', strain: 'ICR', category: 'Outbred',
    priceByWeek: { '3W': 6500, '4W': 7200, '5W': 7900, '6W': 7900, '7W': 7900, '8W': 7900 }, tp: 50000 },
  { vendor: '자바이오', strain: 'SD', category: 'Outbred Rat',
    priceByWeek: { '3W': 16500, '4W': 17000, '5W': 18500, '6W': 19000, '7W': 20000, '8W': 21000 }, tp: 95000 },
  { vendor: '자바이오', strain: 'NZW Rabbit', category: 'Rabbit',
    priceByWeek: { '~2.0kg': 100000, '2.1~2.5kg': 112000, '2.6~3.0kg': 130000, '3.1~3.5kg': 150000 }, tp: null },

  // === 오리엔트바이오 ===
  { vendor: '오리엔트바이오', strain: 'SD (Crl:CD)', category: 'Outbred Rat',
    priceByWeek: { '3W': 23000, '4W': 20300, '5W': 24400, '6W': 28500, '7W': 32500, '8W': 36000 }, tp: 94000, extraPerWeek: 3700 },
  { vendor: '오리엔트바이오', strain: 'Wistar', category: 'Outbred Rat',
    priceByWeek: { '3W': 20900, '4W': 23600, '5W': 25000, '6W': 29300, '7W': 33400, '8W': 37000 }, tp: null, extraPerWeek: 3700 },
  { vendor: '오리엔트바이오', strain: 'ICR', category: 'Outbred Mice',
    priceByWeek: { '3W': 8300, '4W': 7800, '5W': 9200, '6W': 9700, '7W': 11100, '8W': 12500 }, tp: 47000, extraPerWeek: 1200 },
  { vendor: '오리엔트바이오', strain: 'BALB/c', category: 'Inbred',
    priceByWeek: { '3W': 21700, '4W': 21700, '5W': 23600, '6W': 25000, '7W': 27800, '8W': 30700 }, tp: null, extraPerWeek: 2500 },
  { vendor: '오리엔트바이오', strain: 'C57BL/6N', category: 'Inbred',
    priceByWeek: { '3W': 25000, '4W': 25000, '5W': 27800, '6W': 29300, '7W': 33400, '8W': 37000 }, tp: null, extraPerWeek: 3700 },
  { vendor: '오리엔트바이오', strain: 'DBA/1J', category: 'Inbred',
    priceByWeek: { '3W': 41700, '4W': 41700, '5W': 46000, '6W': 48700, '7W': 52900, '8W': 57100 }, tp: null, extraPerWeek: 3700 },
  { vendor: '오리엔트바이오', strain: 'SKH1-hairless', category: 'Outbred Mice',
    priceByWeek: { '5W': 64000, '6W': 64000, '7W': 64000, '8W': 73800 }, tp: null, extraPerWeek: 7000 },
  { vendor: '오리엔트바이오', strain: 'Foxn1 nu (nude)', category: 'Immunodef',
    priceByWeek: { '5W': 64000, '6W': 69000, '7W': 74000, '8W': 79000 }, tp: null, extraPerWeek: 7000 },

  // === 코아텍 ===
  { vendor: '코아텍', strain: 'SD', category: 'Outbred Rat',
    priceByWeek: { '3W': 17000, '4W': 18000, '5W': 19000, '6W': 20000, '7W': 22000, '8W': 24000, '9W': 26000, '10W': 29000, '11W': 32000, '12W': 35000 }, tp: 92000, extraPerWeek: 5500 },
  { vendor: '코아텍', strain: 'ICR (CD-1)', category: 'Outbred Mice',
    priceByWeek: { '3W': 5300, '4W': 5800, '5W': 6300, '6W': 6800, '7W': 7300, '8W': 7800, '9W': 8300, '10W': 9500, '11W': 10500, '12W': 12000 }, tp: 52500, extraPerWeek: 2500 },
  { vendor: '코아텍', strain: 'C57BL/6N', category: 'Inbred',
    priceByWeek: { '3W': 17000, '4W': 18000, '5W': 19000, '6W': 20000, '7W': 22000, '8W': 24000, '9W': 26000, '10W': 29000, '11W': 32000, '12W': 35000 }, tp: 110000, extraPerWeek: 5500 },
  { vendor: '코아텍', strain: 'BALB/c', category: 'Inbred',
    priceByWeek: { '3W': 15000, '4W': 16000, '5W': 17000, '6W': 18000, '7W': 20000, '8W': 22000, '9W': 24000, '10W': 26000, '11W': 28000, '12W': 30000 }, tp: null, extraPerWeek: 4400 },
  { vendor: '코아텍', strain: 'DBA/1J (CBA/J)', category: 'Inbred',
    priceByWeek: { '3W': 29500, '4W': 31500, '5W': 33500, '6W': 35500, '7W': 38000, '8W': 40500, '9W': 43000, '10W': 49000, '11W': 57000, '12W': 65000 }, tp: null, extraPerWeek: 11000 },
  { vendor: '코아텍', strain: 'Athymic nu/nu', category: 'Immunodef',
    priceByWeek: { '3W': 42000, '4W': 53000, '5W': 58000, '6W': 63000, '7W': 69000 }, tp: null },
  { vendor: '코아텍', strain: 'SCID', category: 'Immunodef',
    priceByWeek: { '4W': 95000, '5W': 105000, '6W': 115000, '7W': 130000 }, tp: null },
  { vendor: '코아텍', strain: 'NOD.SCID', category: 'Immunodef',
    priceByWeek: { '4W': 140000, '5W': 150000, '6W': 160000, '7W': 170000 }, tp: null },
  { vendor: '코아텍', strain: 'NOG', category: 'Super Immunodef',
    priceByWeek: { '4W': 175000, '5W': 185000, '6W': 195000, '7W': 205000 }, tp: null },
  { vendor: '코아텍', strain: 'Guinea Pig (SPF)', category: 'Guinea Pig',
    priceByWeek: { '<200g': 60000, '200~249g': 66000, '250~299g': 72000, '300~349g': 78000, '350~399g': 84000, 'Pregnant': 204000 }, tp: null },
  { vendor: '코아텍', strain: 'NZW Rabbit (SPF)', category: 'Rabbit',
    priceByWeek: { '10~11주': 170000, '12~15주': 190000, '16~20주': 220000, '2.5~2.99kg': 260000, '3.0~3.49kg': 320000, '3.5kg~': 640000 }, tp: null },
];

// -------------------------------------------------------
// 3. 고주령 동물 가격 (코아텍)
// -------------------------------------------------------

export interface AgedAnimalPrice {
  monthAge: number;
  SD: number | null;
  C57BL6N: number | null;
  ICR: number | null;
}

export const AGED_ANIMAL_PRICES: AgedAnimalPrice[] = [
  { monthAge: 3,  SD: 35000,  C57BL6N: 35000,  ICR: 11000 },
  { monthAge: 4,  SD: 50000,  C57BL6N: 40000,  ICR: 20000 },
  { monthAge: 5,  SD: 64000,  C57BL6N: 45000,  ICR: 29000 },
  { monthAge: 6,  SD: 79000,  C57BL6N: 51000,  ICR: 40000 },
  { monthAge: 7,  SD: 94000,  C57BL6N: 65000,  ICR: 51000 },
  { monthAge: 8,  SD: 122000, C57BL6N: 94000,  ICR: 65000 },
  { monthAge: 9,  SD: 165000, C57BL6N: 122000, ICR: 79000 },
  { monthAge: 10, SD: 208000, C57BL6N: 151000, ICR: 100000 },
  { monthAge: 11, SD: 251000, C57BL6N: 179000, ICR: 114000 },
  { monthAge: 12, SD: 294000, C57BL6N: 208000, ICR: 136000 },
  { monthAge: 13, SD: 337000, C57BL6N: 237000, ICR: 179000 },
  { monthAge: 14, SD: 408000, C57BL6N: 294000, ICR: 222000 },
  { monthAge: 15, SD: 451000, C57BL6N: 351000, ICR: 265000 },
  { monthAge: 16, SD: 523000, C57BL6N: 408000, ICR: 294000 },
  { monthAge: 17, SD: 580000, C57BL6N: 465000, ICR: 337000 },
  { monthAge: 18, SD: 651000, C57BL6N: 508000, ICR: 380000 },
  { monthAge: 19, SD: 723000, C57BL6N: null,   ICR: null },
  { monthAge: 20, SD: 794000, C57BL6N: null,   ICR: null },
];

// -------------------------------------------------------
// 4. 최저가 비교표 (주요 품종)
// -------------------------------------------------------

export interface BestPriceEntry {
  strain: string;
  ageWeek: string;
  jabio: number;
  orient: number;
  koatech: number;
  bestPrice: number;
  bestVendor: AnimalVendor;
}

export const BEST_PRICE_TABLE: BestPriceEntry[] = [
  { strain: 'SD rat',   ageWeek: '5W', jabio: 18500, orient: 24400, koatech: 19000, bestPrice: 18500, bestVendor: '자바이오' },
  { strain: 'SD rat',   ageWeek: '6W', jabio: 19000, orient: 28500, koatech: 20000, bestPrice: 19000, bestVendor: '자바이오' },
  { strain: 'SD rat',   ageWeek: '7W', jabio: 20000, orient: 32500, koatech: 22000, bestPrice: 20000, bestVendor: '자바이오' },
  { strain: 'SD rat',   ageWeek: '8W', jabio: 21000, orient: 36000, koatech: 24000, bestPrice: 21000, bestVendor: '자바이오' },
  { strain: 'ICR',      ageWeek: '5W', jabio: 7900,  orient: 9200,  koatech: 6300,  bestPrice: 6300,  bestVendor: '코아텍' },
  { strain: 'ICR',      ageWeek: '6W', jabio: 7900,  orient: 9700,  koatech: 6800,  bestPrice: 6800,  bestVendor: '코아텍' },
  { strain: 'ICR',      ageWeek: '7W', jabio: 7900,  orient: 11100, koatech: 7300,  bestPrice: 7300,  bestVendor: '코아텍' },
  { strain: 'ICR',      ageWeek: '8W', jabio: 7900,  orient: 12500, koatech: 7800,  bestPrice: 7800,  bestVendor: '코아텍' },
  { strain: 'C57BL/6N', ageWeek: '5W', jabio: 18500, orient: 27800, koatech: 19000, bestPrice: 18500, bestVendor: '자바이오' },
  { strain: 'C57BL/6N', ageWeek: '6W', jabio: 19000, orient: 29300, koatech: 20000, bestPrice: 19000, bestVendor: '자바이오' },
  { strain: 'C57BL/6N', ageWeek: '7W', jabio: 20600, orient: 33400, koatech: 22000, bestPrice: 20600, bestVendor: '자바이오' },
  { strain: 'C57BL/6N', ageWeek: '8W', jabio: 21500, orient: 37000, koatech: 24000, bestPrice: 21500, bestVendor: '자바이오' },
  { strain: 'BALB/c',   ageWeek: '5W', jabio: 18500, orient: 23600, koatech: 17000, bestPrice: 17000, bestVendor: '코아텍' },
  { strain: 'BALB/c',   ageWeek: '6W', jabio: 19000, orient: 25000, koatech: 18000, bestPrice: 18000, bestVendor: '코아텍' },
  { strain: 'BALB/c',   ageWeek: '7W', jabio: 20600, orient: 27800, koatech: 20000, bestPrice: 20000, bestVendor: '코아텍' },
  { strain: 'BALB/c',   ageWeek: '8W', jabio: 21500, orient: 30700, koatech: 22000, bestPrice: 21500, bestVendor: '자바이오' },
];

// -------------------------------------------------------
// 5. 헬퍼 함수
// -------------------------------------------------------

export function getPriceByCode(code: string): PriceItem | undefined {
  return PRICE_TABLE.find(p => p.code === code);
}

export function getPricesByCategory(category: string): PriceItem[] {
  return PRICE_TABLE.filter(p => p.category === category);
}

export function getAnimalPrice(strain: string, ageWeek: string, vendor?: AnimalVendor): number | null {
  const entries = vendor
    ? ANIMAL_PRICES.filter(a => a.strain.includes(strain) && a.vendor === vendor)
    : ANIMAL_PRICES.filter(a => a.strain.includes(strain));

  for (const entry of entries) {
    const price = entry.priceByWeek[ageWeek];
    if (price != null) return price;
  }
  return null;
}

export function getBestAnimalPrice(strain: string, ageWeek: string): BestPriceEntry | undefined {
  return BEST_PRICE_TABLE.find(b =>
    b.strain.toLowerCase().includes(strain.toLowerCase()) && b.ageWeek === ageWeek
  );
}

export function getHousingCost(species: string): number {
  const s = species.toLowerCase();
  if (s.includes('rat')) return 2000;
  if (s.includes('mouse') || s.includes('mice')) return 1500;
  if (s.includes('guinea')) return 10000;
  if (s.includes('rabbit') || s.includes('토끼')) return 20000;
  if (s.includes('beagle') || s.includes('dog')) return 30000;
  if (s.includes('pig') || s.includes('돼지')) return 40000;
  return 2000; // default
}

export const PRICE_CATEGORIES = [
  '사육비', '질환유발모델', '투여(소동물)', '투여(대동물)', '항암',
  '체중/체온', '행동평가', '영상', '분자생물학/채혈', '조직병리', '기타', '양성대조물질',
] as const;
