// Master Data API functions
import { getAccessToken } from './auth-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ============ Types (새 구조) ============

// 독성시험 항목 (새 구조)
export interface ToxicityTest {
  id: string;
  itemId: number;
  sheet: string;
  category: string;
  subcategory: string;
  testName: string | null;
  oecd: string | null;
  testType: string | null;
  animalClass: string | null;
  species: string | null;
  sexConfig: string | null;
  animalsPerSex: number | null;
  controlGroups: number | null;
  testGroups: number | null;
  totalGroups: number | null;
  routeGroup: string | null;
  routes: string | null;
  duration: string | null;
  leadTime: string | null;
  price: string | null;
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

export interface EfficacyPriceItem {
  id: string;
  itemId: string;
  category: string;
  subcategory: string | null;
  itemName: string;
  itemDetail: string | null;
  unitPrice: number;
  unit: string | null;
  remarks: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EfficacyModel {
  id: string;
  modelId: string;
  modelName: string;
  category: string;
  indication: string | null;
  animalType: string | null;
  inductionMethod: string | null;
  duration: string | null;
  description: string | null;
  defaultItems: string[] | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Modality {
  id: string;
  code: string;
  name: string;
  level: number;
  parentCode: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModalityHierarchy extends Modality {
  children: Modality[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  error?: {
    code: string;
    message: string;
  };
}

// ============ API Helper ============

async function masterFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const accessToken = getAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: '네트워크 오류가 발생했습니다.',
      },
    };
  }
}

// ============ Toxicity Tests APIs ============

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

export async function getToxicityTests(
  filters: ToxicityTestFilters = {}
): Promise<ApiResponse<ToxicityTest[]>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  const query = params.toString();
  return masterFetch<ToxicityTest[]>(`/api/master/toxicity-tests${query ? `?${query}` : ''}`);
}

export interface CategoriesResponse {
  data: Record<string, string[]>;
  raw: ToxicityCategory[];
}

export async function getToxicityTestCategories(): Promise<ApiResponse<CategoriesResponse>> {
  return masterFetch<CategoriesResponse>('/api/master/toxicity-tests/categories');
}

export async function getToxicityTestById(itemId: number): Promise<ApiResponse<ToxicityTest>> {
  return masterFetch<ToxicityTest>(`/api/master/toxicity-tests/${itemId}`);
}

// 참조 데이터 API
export async function getAnimalClasses(): Promise<ApiResponse<AnimalClass[]>> {
  return masterFetch<AnimalClass[]>('/api/master/animal-classes');
}

export async function getSpecies(): Promise<ApiResponse<Species[]>> {
  return masterFetch<Species[]>('/api/master/species');
}

export async function getRoutes(): Promise<ApiResponse<Route[]>> {
  return masterFetch<Route[]>('/api/master/routes');
}

// ============ Efficacy Price Items APIs ============

export interface EfficacyPriceFilters {
  category?: string;
  subcategory?: string;
  search?: string;
  active?: 'all' | 'true';
}

export async function getEfficacyPriceItems(
  filters: EfficacyPriceFilters = {}
): Promise<ApiResponse<EfficacyPriceItem[]>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  const query = params.toString();
  return masterFetch<EfficacyPriceItem[]>(`/api/master/efficacy-prices${query ? `?${query}` : ''}`);
}

export async function getEfficacyPriceCategories(): Promise<ApiResponse<Record<string, string[]>>> {
  return masterFetch<Record<string, string[]>>('/api/master/efficacy-prices/categories');
}

// ============ Efficacy Models APIs ============

export interface EfficacyModelFilters {
  category?: string;
  search?: string;
  active?: 'all' | 'true';
}

export async function getEfficacyModels(
  filters: EfficacyModelFilters = {}
): Promise<ApiResponse<EfficacyModel[]>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  const query = params.toString();
  return masterFetch<EfficacyModel[]>(`/api/master/efficacy-models${query ? `?${query}` : ''}`);
}

export async function getEfficacyModelCategories(): Promise<ApiResponse<string[]>> {
  return masterFetch<string[]>('/api/master/efficacy-models/categories');
}

export async function getEfficacyModelById(modelId: string): Promise<ApiResponse<EfficacyModel>> {
  return masterFetch<EfficacyModel>(`/api/master/efficacy-models/${modelId}`);
}

// ============ Modalities APIs ============

export interface ModalityFilters {
  level?: number;
  active?: 'all' | 'true';
}

export async function getModalities(
  filters: ModalityFilters = {}
): Promise<ApiResponse<Modality[]>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, String(value));
  });
  const query = params.toString();
  return masterFetch<Modality[]>(`/api/master/modalities${query ? `?${query}` : ''}`);
}

export async function getModalitiesHierarchy(): Promise<ApiResponse<ModalityHierarchy[]>> {
  return masterFetch<ModalityHierarchy[]>('/api/master/modalities/hierarchy');
}
