// 새 독성시험 마스터데이터 타입 (2026년 1월 업데이트)

// 독성시험 항목
export interface ToxicityTest {
  id: string;
  itemId: number;
  sheet: string;                    // 시트명 (단회투여독성시험, 반복투여독성시험 등)
  category: string;                 // 카테고리 (일반독성시험)
  subcategory: string;              // 서브카테고리 (단회투여 독성시험, 독성동태시험 등)
  testName: string | null;          // 시험명 (DRF 시험, Dose escalation method 등)
  oecd: string | null;              // OECD 여부 (Y, N, null)
  testType: string | null;          // in vivo, in vitro
  animalClass: string | null;       // 설치류, 비설치류, Cell 등
  species: string | null;           // SD Rat, Beagle dog 등
  sexConfig: string | null;         // 암수 각각, 수컷만, 암컷 등
  animalsPerSex: number | null;     // 성별당 동물 수
  controlGroups: number | null;     // 대조군 수
  testGroups: number | null;        // 시험군 수
  totalGroups: number | null;       // 총 군 수
  routeGroup: string | null;        // 투여경로 그룹 (경구피하근육독성, 정맥경피독성)
  routes: string | null;            // 투여경로 (경구/피하/근육, 정맥/경피)
  duration: string | null;          // 투여기간 (1회, 2주, 4주 등)
  leadTime: string | null;          // 소요기간 (7주, 16주 등)
  price: string | null;             // 기본 가격 (문자열로 반환됨)
  // 독성동태시험 관련 필드
  samplingPointsTest: number | null;
  samplingPointsControl: number | null;
  samplingCount: number | null;
  samplingDays: string | null;
  totalSamplingPoints: number | null;
  priceWithAnalysis: string | null;
  priceSamplingOnly: string | null;
  optionNote: string | null;
  remarks: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 독성시험 카테고리
export interface ToxicityCategory {
  id: string;
  categoryId: number;
  sheet: string;
  category: string;
  subcategory: string;
  isActive: boolean;
}

// 동물 분류
export interface AnimalClass {
  id: string;
  classId: number;
  name: string;
  isActive: boolean;
}

// 동물 종
export interface Species {
  id: string;
  speciesId: number;
  name: string;
  isActive: boolean;
}

// 투여경로
export interface Route {
  id: string;
  routeId: number;
  name: string;
  isActive: boolean;
}

// 필터 옵션
export interface ToxicityTestFilters {
  category?: string;
  subcategory?: string;
  sheet?: string;
  animalClass?: string;
  species?: string;
  routeGroup?: string;
  search?: string;
  active?: 'all' | 'true';
}

// 견적서에서 사용하는 선택된 시험 항목
export interface SelectedToxicityTest extends ToxicityTest {
  quantity: number;
  selectedRoute?: string;        // 선택된 투여경로 (routes에서 선택)
  selectedPrice?: number;        // 선택된 가격 (price 또는 priceWithAnalysis)
  includeAnalysis?: boolean;     // 분석 포함 여부 (독성동태시험)
  customPrice?: number;          // 사용자 지정 가격
  notes?: string;                // 메모
}
