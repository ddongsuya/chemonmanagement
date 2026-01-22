// Package, Company, User Settings API functions
import { apiFetch, ApiResponse } from './api-utils';

// Re-export ApiResponse
export type { ApiResponse } from './api-utils';

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

// ============ Package APIs ============

export async function getPackages(includeAll = false): Promise<ApiResponse<PackageTemplate[]>> {
  const query = includeAll ? '?all=true' : '';
  return apiFetch<PackageTemplate[]>(`/api/packages${query}`);
}

export async function getPackageById(packageId: string): Promise<ApiResponse<PackageTemplate>> {
  return apiFetch<PackageTemplate>(`/api/packages/${packageId}`);
}

export async function createPackage(data: CreatePackageDTO): Promise<ApiResponse<PackageTemplate>> {
  return apiFetch<PackageTemplate>('/api/packages', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePackage(
  packageId: string,
  data: UpdatePackageDTO
): Promise<ApiResponse<PackageTemplate>> {
  return apiFetch<PackageTemplate>(`/api/packages/${packageId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deletePackage(packageId: string): Promise<ApiResponse<void>> {
  return apiFetch<void>(`/api/packages/${packageId}`, {
    method: 'DELETE',
  });
}

// ============ Company Info APIs ============

export async function getCompanyInfo(): Promise<ApiResponse<CompanyInfo>> {
  return apiFetch<CompanyInfo>('/api/company/info');
}

export async function updateCompanyInfo(data: UpdateCompanyInfoDTO): Promise<ApiResponse<CompanyInfo>> {
  return apiFetch<CompanyInfo>('/api/company/info', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ============ User Settings APIs ============

export async function getUserSettings(): Promise<ApiResponse<UserSettings>> {
  return apiFetch<UserSettings>('/api/settings/user');
}

export async function updateUserSettings(data: UpdateUserSettingsDTO): Promise<ApiResponse<UserSettings>> {
  return apiFetch<UserSettings>('/api/settings/user', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
