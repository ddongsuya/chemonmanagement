// Package Template Types

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
  createdAt: Date;
  updatedAt: Date;
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

// Company Info Types

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
  createdAt: Date;
  updatedAt: Date;
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

// User Settings Types

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
  createdAt: Date;
  updatedAt: Date;
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
