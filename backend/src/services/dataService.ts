import { PrismaClient, Quotation, Customer, Prisma, QuotationType } from '@prisma/client';
import { AppError, ErrorCodes } from '../types/error';
import {
  CreateQuotationDTO,
  UpdateQuotationDTO,
  QuotationFilters,
  QuotationResponse,
} from '../types/quotation';
import {
  CreateCustomerDTO,
  UpdateCustomerDTO,
  CustomerFilters,
  CustomerResponse,
  CustomerWithLeadResponse,
  LinkedLeadInfo,
} from '../types/customer';
import { PaginatedResult } from '../types';

export class DataService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ==================== Quotation Number Service ====================

  /**
   * QuotationType for unified quotation number generation
   * Supports: TOXICITY, EFFICACY, CLINICAL (all use the same number format)
   */
  public static readonly SUPPORTED_QUOTATION_TYPES = ['TOXICITY', 'EFFICACY', 'CLINICAL'] as const;

  /**
   * Quotation number format configuration
   * Format: YY-MM-UC-NNNN (연도-월-사용자코드-일련번호)
   */
  public static readonly QUOTATION_NUMBER_CONFIG = {
    format: 'YY-MM-UC-NNNN' as const,
    yearDigits: 2,
    sequenceDigits: 4,
  };

  /**
   * Validate if user has a valid user code set
   * @param userId - User ID to validate
   * @returns true if user code is set, false otherwise
   */
  async validateUserCode(userId: string): Promise<boolean> {
    const userSettings = await this.prisma.userSettings.findUnique({
      where: { userId },
      select: { userCode: true },
    });
    
    return !!(userSettings?.userCode);
  }

  /**
   * Get the next sequence number for quotation generation
   * Uses nextQuotationSeq from UserSettings if available, otherwise calculates from existing quotations
   * @param userId - User ID
   * @returns Next sequence number
   */
  async getNextQuotationSequence(userId: string): Promise<number> {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    
    // 사용자 설정에서 userCode 조회
    const userSettings = await this.prisma.userSettings.findUnique({
      where: { userId },
      select: { userCode: true },
    });
    
    const userCode = userSettings?.userCode;
    
    if (!userCode) {
      throw new AppError(
        '견적서 코드가 설정되지 않았습니다. 설정 > 프로필에서 견적서 코드를 먼저 설정해주세요.',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }
    
    // 형식: YY-MM-UC-NNNN
    const prefix = `${year}-${month}-${userCode}-`;
    
    // 해당 사용자의 해당 월 마지막 견적번호 조회 (모든 시험 유형 통합)
    const lastQuotation = await this.prisma.quotation.findFirst({
      where: {
        userId,
        quotationNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        quotationNumber: 'desc',
      },
    });

    if (lastQuotation) {
      const parts = lastQuotation.quotationNumber.split('-');
      const lastSeq = parseInt(parts[3], 10);
      return lastSeq + 1;
    }
    
    return 1;
  }

  /**
   * Generate quotation number with user code
   * Format: YY-MM-UC-NNNN (연도-월-사용자코드-일련번호)
   * Example: 26-01-DL-0001
   * 
   * This method generates a unified quotation number for all test types:
   * - TOXICITY (독성시험)
   * - EFFICACY (효력시험)
   * - CLINICAL (임상병리시험)
   * 
   * All test types share the same sequence number, ensuring sequential numbering
   * regardless of the test type. This satisfies Requirements 1.1, 1.2, 1.3, 1.4, 1.5.
   * 
   * @param userId - User ID for quotation ownership
   * @param quotationType - Type of test (TOXICITY, EFFICACY, or CLINICAL)
   * @returns Generated quotation number in YY-MM-UC-NNNN format
   * @throws AppError if userCode is not set
   * 
   * @example
   * // User Code: DL, 2025년 1월, 일련번호 1
   * generateQuotationNumber('user-id', 'TOXICITY') // Returns: "25-01-DL-0001"
   * generateQuotationNumber('user-id', 'EFFICACY') // Returns: "25-01-DL-0002" (next in sequence)
   * generateQuotationNumber('user-id', 'CLINICAL') // Returns: "25-01-DL-0003" (next in sequence)
   */
  async generateQuotationNumber(userId: string, quotationType: QuotationType | 'CLINICAL'): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // 26
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 01
    
    // 사용자 설정에서 userCode 조회
    const userSettings = await this.prisma.userSettings.findUnique({
      where: { userId },
      select: { userCode: true },
    });
    
    const userCode = userSettings?.userCode;
    
    // userCode 미설정 시 에러
    if (!userCode) {
      throw new AppError(
        '견적서 코드가 설정되지 않았습니다. 설정 > 프로필에서 견적서 코드를 먼저 설정해주세요.',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }
    
    // 형식: YY-MM-UC-NNNN
    const prefix = `${year}-${month}-${userCode}-`;
    
    // 해당 사용자의 해당 월 마지막 견적번호 조회
    // 모든 시험 유형(TOXICITY, EFFICACY, CLINICAL)에서 동일한 시퀀스 사용
    // Requirements 1.4: 시험 유형에 관계없이 일련번호 순차 증가
    const lastQuotation = await this.prisma.quotation.findFirst({
      where: {
        userId,
        quotationNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        quotationNumber: 'desc',
      },
    });

    let seq = 1;
    if (lastQuotation) {
      const parts = lastQuotation.quotationNumber.split('-');
      const lastSeq = parseInt(parts[3], 10);
      seq = lastSeq + 1;
    }

    return `${prefix}${seq.toString().padStart(4, '0')}`;
  }

  // ==================== Quotation Methods ====================

  /**
   * Create a new quotation with retry logic for race condition handling
   */
  async createQuotation(userId: string, data: CreateQuotationDTO): Promise<QuotationResponse> {
    // If customerId is provided, verify ownership
    if (data.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: {
          id: data.customerId,
          userId,
          deletedAt: null,
        },
      });

      if (!customer) {
        throw new AppError('고객을 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
      }
    }

    // If leadId is provided, verify lead exists and belongs to user
    if (data.leadId) {
      const lead = await this.prisma.lead.findFirst({
        where: {
          id: data.leadId,
          userId,
          deletedAt: null,
        },
      });

      if (!lead) {
        throw new AppError('리드를 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
      }
    }

    // validUntil 계산
    const validUntil = data.validUntil 
      ? new Date(data.validUntil)
      : new Date(Date.now() + (data.validDays || 30) * 24 * 60 * 60 * 1000);

    // 레이스 컨디션 방지를 위한 재시도 로직 (최대 3회)
    const MAX_RETRIES = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const quotationNumber = await this.generateQuotationNumber(userId, data.quotationType);
        
        const quotation = await this.prisma.quotation.create({
          data: {
            quotationNumber,
            quotationType: data.quotationType,
            userId,
            customerId: data.customerId || null,
            customerName: data.customerName,
            projectName: data.projectName,
            modality: data.modality || null,
            modelId: data.modelId || null,
            modelCategory: data.modelCategory || null,
            indication: data.indication || null,
            leadId: data.leadId || null,  // 리드 연결 추가
            items: data.items as unknown as Prisma.InputJsonValue,
            subtotalTest: data.subtotalTest ? new Prisma.Decimal(data.subtotalTest) : null,
            subtotalAnalysis: data.subtotalAnalysis ? new Prisma.Decimal(data.subtotalAnalysis) : null,
            subtotal: data.subtotal ? new Prisma.Decimal(data.subtotal) : null,
            discountRate: data.discountRate ? new Prisma.Decimal(data.discountRate) : null,
            discountAmount: data.discountAmount ? new Prisma.Decimal(data.discountAmount) : null,
            vat: data.vat ? new Prisma.Decimal(data.vat) : null,
            totalAmount: new Prisma.Decimal(data.totalAmount),
            validDays: data.validDays || 30,
            validUntil,
            notes: data.notes || null,
            status: data.status || 'DRAFT',
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                company: true,
              },
            },
            lead: {
              select: {
                id: true,
                companyName: true,
                contactName: true,
                status: true,
              },
            },
          },
        });

        return this.toQuotationResponse(quotation);
      } catch (error: unknown) {
        // Prisma unique constraint violation (P2002) - quotationNumber 중복
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          lastError = error;
          // 재시도 전 짧은 지연 (랜덤 백오프)
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
          continue;
        }
        // 다른 에러는 즉시 throw
        throw error;
      }
    }

    // 모든 재시도 실패
    throw new AppError(
      '견적번호 생성 중 충돌이 발생했습니다. 잠시 후 다시 시도해주세요.',
      409,
      ErrorCodes.CONFLICT
    );
  }

  /**
   * Get quotations list with pagination and filters
   * 
   * IMMUTABILITY GUARANTEE (Requirements 5.5, 3.5):
   * This method returns quotationNumbers exactly as stored in the database.
   * When a user changes their User_Code, existing quotation numbers are NOT affected.
   * Each quotation retains the number assigned at creation time.
   */
  async getQuotations(
    userId: string,
    filters: QuotationFilters
  ): Promise<PaginatedResult<QuotationResponse>> {
    const { page, limit, quotationType, status, customerId, search, startDate, endDate } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.QuotationWhereInput = {
      userId,
      deletedAt: null,
      ...(quotationType && { quotationType }),
      ...(status && { status }),
      ...(customerId && { customerId }),
      ...(search && {
        OR: [
          { quotationNumber: { contains: search, mode: 'insensitive' } },
          { customerName: { contains: search, mode: 'insensitive' } },
          { projectName: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(startDate && { createdAt: { gte: startDate } }),
      ...(endDate && { createdAt: { lte: endDate } }),
    };

    const [quotations, total] = await Promise.all([
      this.prisma.quotation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              company: true,
            },
          },
          lead: {
            select: {
              id: true,
              companyName: true,
              contactName: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.quotation.count({ where }),
    ]);

    return {
      data: quotations.map((q) => this.toQuotationResponse(q)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get quotation by ID with ownership verification
   * 
   * IMMUTABILITY GUARANTEE (Requirements 5.5, 3.5):
   * This method returns the quotationNumber exactly as stored in the database.
   * When a user changes their User_Code, existing quotation numbers are NOT affected.
   * The stored quotationNumber is immutable and reflects the code at the time of creation.
   */
  async getQuotationById(userId: string, id: string): Promise<QuotationResponse> {
    const quotation = await this.prisma.quotation.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
        lead: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            status: true,
          },
        },
      },
    });

    if (!quotation) {
      throw new AppError('견적서를 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    // Ownership verification
    if (quotation.userId !== userId) {
      throw new AppError('접근 권한이 없습니다', 403, ErrorCodes.RESOURCE_ACCESS_DENIED);
    }

    return this.toQuotationResponse(quotation);
  }

  /**
   * Get quotation by quotation number
   */
  async getQuotationByNumber(userId: string, quotationNumber: string): Promise<QuotationResponse> {
    const quotation = await this.prisma.quotation.findFirst({
      where: {
        quotationNumber,
        deletedAt: null,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
        lead: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            status: true,
          },
        },
      },
    });

    if (!quotation) {
      throw new AppError('견적서를 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    if (quotation.userId !== userId) {
      throw new AppError('접근 권한이 없습니다', 403, ErrorCodes.RESOURCE_ACCESS_DENIED);
    }

    return this.toQuotationResponse(quotation);
  }

  /**
   * Update quotation with ownership verification
   */
  async updateQuotation(
    userId: string,
    id: string,
    data: UpdateQuotationDTO
  ): Promise<QuotationResponse> {
    const existing = await this.prisma.quotation.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new AppError('견적서를 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    if (existing.userId !== userId) {
      throw new AppError('접근 권한이 없습니다', 403, ErrorCodes.RESOURCE_ACCESS_DENIED);
    }

    if (data.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: {
          id: data.customerId,
          userId,
          deletedAt: null,
        },
      });

      if (!customer) {
        throw new AppError('고객을 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
      }
    }

    // If leadId is provided, verify lead exists and belongs to user
    if (data.leadId) {
      const lead = await this.prisma.lead.findFirst({
        where: {
          id: data.leadId,
          userId,
          deletedAt: null,
        },
      });

      if (!lead) {
        throw new AppError('리드를 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
      }
    }

    const quotation = await this.prisma.quotation.update({
      where: { id },
      data: {
        ...(data.customerId !== undefined && { customerId: data.customerId }),
        ...(data.customerName && { customerName: data.customerName }),
        ...(data.projectName && { projectName: data.projectName }),
        ...(data.modality !== undefined && { modality: data.modality }),
        ...(data.modelId !== undefined && { modelId: data.modelId }),
        ...(data.modelCategory !== undefined && { modelCategory: data.modelCategory }),
        ...(data.indication !== undefined && { indication: data.indication }),
        ...(data.leadId !== undefined && { leadId: data.leadId }),  // 리드 연결 추가
        ...(data.items && { items: data.items as unknown as Prisma.InputJsonValue }),
        ...(data.subtotalTest !== undefined && { 
          subtotalTest: data.subtotalTest ? new Prisma.Decimal(data.subtotalTest) : null 
        }),
        ...(data.subtotalAnalysis !== undefined && { 
          subtotalAnalysis: data.subtotalAnalysis ? new Prisma.Decimal(data.subtotalAnalysis) : null 
        }),
        ...(data.subtotal !== undefined && { 
          subtotal: data.subtotal ? new Prisma.Decimal(data.subtotal) : null 
        }),
        ...(data.discountRate !== undefined && { 
          discountRate: data.discountRate ? new Prisma.Decimal(data.discountRate) : null 
        }),
        ...(data.discountAmount !== undefined && { 
          discountAmount: data.discountAmount ? new Prisma.Decimal(data.discountAmount) : null 
        }),
        ...(data.vat !== undefined && { 
          vat: data.vat ? new Prisma.Decimal(data.vat) : null 
        }),
        ...(data.totalAmount !== undefined && { totalAmount: new Prisma.Decimal(data.totalAmount) }),
        ...(data.validDays !== undefined && { validDays: data.validDays }),
        ...(data.validUntil !== undefined && {
          validUntil: data.validUntil ? new Date(data.validUntil) : null,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.status && { status: data.status }),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
        lead: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            status: true,
          },
        },
      },
    });

    return this.toQuotationResponse(quotation);
  }

  /**
   * Soft delete quotation with ownership verification
   */
  async deleteQuotation(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.quotation.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new AppError('견적서를 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    if (existing.userId !== userId) {
      throw new AppError('접근 권한이 없습니다', 403, ErrorCodes.RESOURCE_ACCESS_DENIED);
    }

    await this.prisma.quotation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Convert Prisma Quotation to QuotationResponse
   * 
   * IMMUTABILITY GUARANTEE (Requirements 5.5):
   * The quotationNumber is returned exactly as stored in the database.
   * No regeneration or modification occurs - the number reflects the User_Code
   * at the time of quotation creation, ensuring existing numbers remain unchanged
   * even when the user's User_Code is modified.
   */
  private toQuotationResponse(
    quotation: Quotation & {
      customer?: { id: string; name: string; company: string | null } | null;
      lead?: { id: string; companyName: string; contactName: string; status: string } | null;
    }
  ): QuotationResponse {
    return {
      id: quotation.id,
      quotationNumber: quotation.quotationNumber,
      quotationType: quotation.quotationType,
      userId: quotation.userId,
      customerId: quotation.customerId,
      customerName: quotation.customerName,
      projectName: quotation.projectName,
      modality: quotation.modality,
      modelId: quotation.modelId,
      modelCategory: quotation.modelCategory,
      indication: quotation.indication,
      leadId: quotation.leadId,  // 리드 ID 추가
      items: quotation.items as unknown[],
      subtotalTest: quotation.subtotalTest ? Number(quotation.subtotalTest) : null,
      subtotalAnalysis: quotation.subtotalAnalysis ? Number(quotation.subtotalAnalysis) : null,
      subtotal: quotation.subtotal ? Number(quotation.subtotal) : null,
      discountRate: quotation.discountRate ? Number(quotation.discountRate) : null,
      discountAmount: quotation.discountAmount ? Number(quotation.discountAmount) : null,
      vat: quotation.vat ? Number(quotation.vat) : null,
      totalAmount: Number(quotation.totalAmount),
      validDays: quotation.validDays,
      validUntil: quotation.validUntil,
      notes: quotation.notes,
      status: quotation.status,
      createdAt: quotation.createdAt,
      updatedAt: quotation.updatedAt,
      deletedAt: quotation.deletedAt,
      customer: quotation.customer,
      lead: quotation.lead,  // 리드 정보 추가
    };
  }


  // ==================== Customer Methods ====================

  /**
   * Create a new customer
   */
  async createCustomer(userId: string, data: CreateCustomerDTO): Promise<CustomerResponse> {
    const customer = await this.prisma.customer.create({
      data: {
        userId,
        name: data.name,
        company: data.company || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        notes: data.notes || null,
      },
    });

    return this.toCustomerResponse(customer);
  }

  /**
   * Get customers list with pagination and filters
   * Supports grade filtering and includes linked Lead information
   */
  async getCustomers(
    userId: string,
    filters: CustomerFilters
  ): Promise<PaginatedResult<CustomerWithLeadResponse & { quotationCount: number; totalAmount: number }>> {
    const { page, limit, search, grade } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {
      userId,
      deletedAt: null,
      ...(grade && { grade }),  // grade 필터 추가
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          quotations: {
            where: { deletedAt: null },
            select: {
              id: true,
              totalAmount: true,
            },
          },
          // 연결된 리드 정보 포함 (가장 최근 리드)
          leads: {
            select: {
              id: true,
              source: true,
              status: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: customers.map((c) => {
        // 연결된 리드 정보 추출
        const linkedLead: LinkedLeadInfo | undefined = c.leads && c.leads.length > 0
          ? {
              id: c.leads[0].id,
              source: c.leads[0].source,
              status: c.leads[0].status,
            }
          : undefined;

        return {
          ...this.toCustomerResponse(c),
          linkedLead,
          quotationCount: c.quotations?.length || 0,
          totalAmount: c.quotations?.reduce((sum, q) => sum + Number(q.totalAmount), 0) || 0,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get customer by ID with ownership verification
   */
  async getCustomerById(userId: string, id: string): Promise<CustomerResponse> {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!customer) {
      throw new AppError('고객을 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    if (customer.userId !== userId) {
      throw new AppError('접근 권한이 없습니다', 403, ErrorCodes.RESOURCE_ACCESS_DENIED);
    }

    return this.toCustomerResponse(customer);
  }

  /**
   * Update customer with ownership verification
   */
  async updateCustomer(
    userId: string,
    id: string,
    data: UpdateCustomerDTO
  ): Promise<CustomerResponse> {
    const existing = await this.prisma.customer.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new AppError('고객을 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    if (existing.userId !== userId) {
      throw new AppError('접근 권한이 없습니다', 403, ErrorCodes.RESOURCE_ACCESS_DENIED);
    }

    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.company !== undefined && { company: data.company }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    return this.toCustomerResponse(customer);
  }

  /**
   * Soft delete customer with ownership verification
   */
  async deleteCustomer(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.customer.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new AppError('고객을 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    if (existing.userId !== userId) {
      throw new AppError('접근 권한이 없습니다', 403, ErrorCodes.RESOURCE_ACCESS_DENIED);
    }

    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Convert Prisma Customer to CustomerResponse
   */
  private toCustomerResponse(customer: Customer): CustomerResponse {
    return {
      id: customer.id,
      userId: customer.userId,
      name: customer.name,
      company: customer.company,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      notes: customer.notes,
      grade: customer.grade,  // grade 필드 추가
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      deletedAt: customer.deletedAt,
    };
  }
}

export default DataService;
