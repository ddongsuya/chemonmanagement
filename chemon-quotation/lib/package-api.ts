// Package, Company, User Settings API functions
import { getAccessToken } from './auth-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ============ Types ============

export interface PackageTest {
  test_id: string;
  category: string;
  name: string;
  required: boolean;
}

export interface OptionalTest {
  test_id: string;
  name: string;
  parent: string;
}

export interface PackageTemplate {
  id: string;
  packageId: string;
  packageName: string;
  description: string | null;
  modality: string | null;
  clinicalPhase: string | null;
  tests: PackageTest[];
  optionalTests: OptionalTest[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePackageDTO {
  packageId: string;
  packageName: string;
  description?: string;
  modality?: string;
  clinicalPhase?: string;
  tests?: PackageTest[];
  optionalTests?: OptionalTest[];
}

export interface UpdatePackageDTO {
  packageName?: string;
  description?: string;
  modality?: string;
  clinicalPhase?: string;
  tests?: PackageTest[];
  optionalTests?: OptionalTest[];
  isActive?: boolean;
}

export interface CompanyInfo {
  id: string;
  name: string;
  nameEn: string | null;
  businessNumber: string | null;
  ceoName: string | null;
  address: string | null;
  addressEn: string | null;
  tel: string | null;
  fax: string | null;
  email: string | null;
  website: string | null;
  logo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCompanyInfoDTO {
  name?: string;
  nameEn?: string;
  businessNumber?: string;
  ceoName?: string;
  address?: string;
  addressEn?: string;
  tel?: string;
  fax?: string;
  email?: string;
  website?: string;
  logo?: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  userCode: string | null;
  defaultValidityDays: number;
  defaultDiscountRate: number;
  autoAnalysisCalculation: boolean;
  validationInvivoCost: number;
  validationInvitroCost: number;
  analysisUnitCost: number;
  emailNotification: boolean;
  browserNotification: boolean;
  notifyOnExpiry: boolean;
  expiryReminderDays: number;
  currencyUnit: string;
  dateFormat: string;
  showVatNotice: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserSettingsDTO {
  userCode?: string;
  defaultValidityDays?: number;
  defaultDiscountRate?: number;
  autoAnalysisCalculation?: boolean;
  validationInvivoCost?: number;
  validationInvitroCost?: number;
  analysisUnitCost?: number;
  emailNotification?: boolean;
  browserNotification?: boolean;
  notifyOnExpiry?: boolean;
  expiryReminderDays?: number;
  currencyUnit?: string;
  dateFormat?: string;
  showVatNotice?: boolean;
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

async function packageFetch<T>(
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

// ============ Package APIs ============

export async function getPackages(includeAll = false): Promise<ApiResponse<PackageTemplate[]>> {
  const query = includeAll ? '?all=true' : '';
  return packageFetch<PackageTemplate[]>(`/api/packages${query}`);
}

export async function getPackageById(packageId: string): Promise<ApiResponse<PackageTemplate>> {
  return packageFetch<PackageTemplate>(`/api/packages/${packageId}`);
}

export async function createPackage(data: CreatePackageDTO): Promise<ApiResponse<PackageTemplate>> {
  return packageFetch<PackageTemplate>('/api/packages', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePackage(
  packageId: string,
  data: UpdatePackageDTO
): Promise<ApiResponse<PackageTemplate>> {
  return packageFetch<PackageTemplate>(`/api/packages/${packageId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deletePackage(packageId: string): Promise<ApiResponse<void>> {
  return packageFetch<void>(`/api/packages/${packageId}`, {
    method: 'DELETE',
  });
}

// ============ Company Info APIs ============

export async function getCompanyInfo(): Promise<ApiResponse<CompanyInfo>> {
  return packageFetch<CompanyInfo>('/api/company/info');
}

export async function updateCompanyInfo(data: UpdateCompanyInfoDTO): Promise<ApiResponse<CompanyInfo>> {
  return packageFetch<CompanyInfo>('/api/company/info', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ============ User Settings APIs ============

export async function getUserSettings(): Promise<ApiResponse<UserSettings>> {
  return packageFetch<UserSettings>('/api/settings/user');
}

export async function updateUserSettings(data: UpdateUserSettingsDTO): Promise<ApiResponse<UserSettings>> {
  return packageFetch<UserSettings>('/api/settings/user', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
