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
} from '../types/customer';
import { PaginatedResult } from '../types';

export class DataService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ==================== Quotation Methods ====================

  /**
   * Generate quotation number
   * Format: TQ-YYYY-NNNN (독성) or EQ-YYYY-NNNN (효력)
   */
  private async generateQuotationNumber(type: QuotationType): Promise<string> {
    const prefix = type === 'TOXICITY' ? 'TQ' : 'EQ';
    const year = new Date().getFullYear();
    
    // 해당 연도의 마지막 견적번호 조회
    const lastQuotation = await this.prisma.quotation.findFirst({
      where: {
        quotationNumber: {
          startsWith: `${prefix}-${year}-`,
        },
      },
      orderBy: {
        quotationNumber: 'desc',
      },
    });

    let seq = 1;
    if (lastQuotation) {
      const lastSeq = parseInt(lastQuotation.quotationNumber.split('-')[2], 10);
      seq = lastSeq + 1;
    }

    return `${prefix}-${year}-${seq.toString().padStart(4, '0')}`;
  }

  /**
   * Create a new quotation
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

    const quotationNumber = await this.generateQuotationNumber(data.quotationType);
    
    // validUntil 계산
    const validUntil = data.validUntil 
      ? new Date(data.validUntil)
      : new Date(Date.now() + (data.validDays || 30) * 24 * 60 * 60 * 1000);

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
      },
    });

    return this.toQuotationResponse(quotation);
  }

  /**
   * Get quotations list with pagination and filters
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
   */
  private toQuotationResponse(
    quotation: Quotation & {
      customer?: { id: string; name: string; company: string | null } | null;
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
   */
  async getCustomers(
    userId: string,
    filters: CustomerFilters
  ): Promise<PaginatedResult<CustomerResponse & { quotationCount: number; totalAmount: number }>> {
    const { page, limit, search } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {
      userId,
      deletedAt: null,
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
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: customers.map((c) => ({
        ...this.toCustomerResponse(c),
        quotationCount: c.quotations?.length || 0,
        totalAmount: c.quotations?.reduce((sum, q) => sum + Number(q.totalAmount), 0) || 0,
      })),
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
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      deletedAt: customer.deletedAt,
    };
  }
}

export default DataService;
