// 시험항목 타입
export interface Test {
  test_id: string;
  modality: string;
  category_code: string;
  category_name: string;
  source_file: string;
  sub_category: string | null;
  oecd_code: string;
  test_type: 'in vivo' | 'in vitro' | '문서' | string;
  test_name: string;
  animal_species: string | null;
  dosing_period: string | null;
  route: string | null;
  lead_time_weeks: number | null;
  unit_price: number | null;
  remarks: string | null;
  glp_status: 'GLP' | 'Non-GLP' | 'N/A' | string;
  clinical_phase: string;
  guidelines: string;
  test_class: '본시험' | '옵션' | '독립' | string;
  parent_test_id: string | null;
  option_type: string | null;
  analysis_count: number;
  analysis_excluded: string | null;
  animals_per_sex: number | null;
  sex_type: string | null;
  control_groups: number | null;
  test_groups: number | null;
  total_groups: number | null;
  // 새로운 필터 분류 필드
  test_type_class?: string;
  animal_class?: string;
  route_class?: string;
  safety_pharm_class?: string;
  // 모달리티 관련 필드
  applicable_modalities?: string[];
}

// 모달리티 타입
export type Modality =
  | '저분자화합물'
  | '세포치료제'
  | '유전자치료제'
  | '백신'
  | '복합제'
  | '화장품'
  | '의료기기'
  | '건강기능식품'
  | '농약/화학물질'
  | '문서/서비스';


// 카테고리 타입
export interface Category {
  code: string;
  name: string;
  modalities: string[];
}

// 세부카테고리 타입
export interface SubCategory {
  category_code: string;
  sub_category: string;
  modalities: string[];
}

// 본시험-옵션 관계
export interface TestRelation {
  [mainTestId: string]: {
    option_id: string;
    option_type: string;
  }[];
}

// 패키지 템플릿
export interface PackageTemplate {
  package_id: string;
  package_name: string;
  modality: string;
  description: string;
  clinical_phase: string;
  tests: {
    test_id: string;
    category: string;
    name: string;
    required: boolean;
  }[];
  optional_tests: {
    test_id: string;
    name: string;
    parent: string;
  }[];
}
