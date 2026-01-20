import { PrismaClient } from '@prisma/client';
import { AppError, ErrorCodes } from '../types/error';
import {
  PackageTemplate,
  CreatePackageDTO,
  UpdatePackageDTO,
  CompanyInfo,
  UpdateCompanyInfoDTO,
  UserSettings,
  UpdateUserSettingsDTO,
} from '../types/package';

export class PackageService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ==================== Package Templates ====================

  async getPackages(): Promise<PackageTemplate[]> {
    const packages = await this.prisma.packageTemplate.findMany({
      where: { isActive: true },
      orderBy: { packageId: 'asc' },
    });

    return packages.map((p) => ({
      ...p,
      tests: (p.tests as unknown) || [],
      optionalTests: (p.optionalTests as unknown) || [],
    })) as PackageTemplate[];
  }

  async getAllPackages(): Promise<PackageTemplate[]> {
    const packages = await this.prisma.packageTemplate.findMany({
      orderBy: { packageId: 'asc' },
    });

    return packages.map((p) => ({
      ...p,
      tests: (p.tests as unknown) || [],
      optionalTests: (p.optionalTests as unknown) || [],
    })) as PackageTemplate[];
  }

  async getPackageById(packageId: string): Promise<PackageTemplate | null> {
    const pkg = await this.prisma.packageTemplate.findUnique({
      where: { packageId },
    });

    if (!pkg) return null;

    return {
      ...pkg,
      tests: (pkg.tests as unknown) || [],
      optionalTests: (pkg.optionalTests as unknown) || [],
    } as PackageTemplate;
  }

  async createPackage(data: CreatePackageDTO): Promise<PackageTemplate> {
    // Check for duplicate packageId
    const existing = await this.prisma.packageTemplate.findUnique({
      where: { packageId: data.packageId },
    });

    if (existing) {
      throw new AppError('이미 존재하는 패키지 ID입니다', 400, ErrorCodes.DUPLICATE_RESOURCE);
    }

    const pkg = await this.prisma.packageTemplate.create({
      data: {
        packageId: data.packageId,
        packageName: data.packageName,
        description: data.description,
        modality: data.modality,
        clinicalPhase: data.clinicalPhase,
        tests: (data.tests || []) as unknown as any,
        optionalTests: (data.optionalTests || []) as unknown as any,
      },
    });

    return {
      ...pkg,
      tests: (pkg.tests as unknown) || [],
      optionalTests: (pkg.optionalTests as unknown) || [],
    } as PackageTemplate;
  }

  async updatePackage(packageId: string, data: UpdatePackageDTO): Promise<PackageTemplate> {
    const existing = await this.prisma.packageTemplate.findUnique({
      where: { packageId },
    });

    if (!existing) {
      throw new AppError('패키지를 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    const pkg = await this.prisma.packageTemplate.update({
      where: { packageId },
      data: {
        packageName: data.packageName,
        description: data.description,
        modality: data.modality,
        clinicalPhase: data.clinicalPhase,
        tests: data.tests as unknown as any,
        optionalTests: data.optionalTests as unknown as any,
        isActive: data.isActive,
      },
    });

    return {
      ...pkg,
      tests: (pkg.tests as unknown) || [],
      optionalTests: (pkg.optionalTests as unknown) || [],
    } as PackageTemplate;
  }

  async deletePackage(packageId: string): Promise<void> {
    const existing = await this.prisma.packageTemplate.findUnique({
      where: { packageId },
    });

    if (!existing) {
      throw new AppError('패키지를 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    await this.prisma.packageTemplate.delete({
      where: { packageId },
    });
  }

  // ==================== Company Info ====================

  async getCompanyInfo(): Promise<CompanyInfo | null> {
    const info = await this.prisma.companyInfo.findFirst();
    return info as CompanyInfo | null;
  }

  async updateCompanyInfo(data: UpdateCompanyInfoDTO): Promise<CompanyInfo> {
    const existing = await this.prisma.companyInfo.findFirst();

    if (existing) {
      const updated = await this.prisma.companyInfo.update({
        where: { id: existing.id },
        data,
      });
      return updated as CompanyInfo;
    } else {
      // Create new if not exists
      if (!data.name) {
        throw new AppError('회사명은 필수입니다', 400, ErrorCodes.VALIDATION_ERROR);
      }
      const created = await this.prisma.companyInfo.create({
        data: {
          name: data.name,
          nameEn: data.nameEn,
          businessNumber: data.businessNumber,
          ceoName: data.ceoName,
          address: data.address,
          addressEn: data.addressEn,
          tel: data.tel,
          fax: data.fax,
          email: data.email,
          website: data.website,
          logo: data.logo,
        },
      });
      return created as CompanyInfo;
    }
  }

  // ==================== User Settings ====================

  async getUserSettings(userId: string): Promise<UserSettings> {
    let settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Create default settings for user
      settings = await this.prisma.userSettings.create({
        data: { userId },
      });
    }

    return settings as UserSettings;
  }

  async updateUserSettings(userId: string, data: UpdateUserSettingsDTO): Promise<UserSettings> {
    let settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Create with provided data
      settings = await this.prisma.userSettings.create({
        data: {
          userId,
          ...data,
        },
      });
    } else {
      settings = await this.prisma.userSettings.update({
        where: { userId },
        data,
      });
    }

    return settings as UserSettings;
  }
}

export default PackageService;
