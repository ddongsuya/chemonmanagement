// Clinical Pathology Service
// 임상병리검사 견적서 및 시험의뢰서 관리

import { PrismaClient, ClinicalTestCategory, SampleType, ClinicalQuotationStatus, ClinicalTestRequestStatus, ClinicalReportType, SampleDisposal } from '@prisma/client';

const prisma = new PrismaClient();

// ==================== 검사항목 마스터 ====================

export async function getTestItems(params: {
  category?: ClinicalTestCategory;
  isActive?: boolean;
  search?: string;
}) {
  const { category, isActive = true, search } = params;
  
  const where: any = {};
  if (category) where.category = category;
  if (isActive !== undefined) where.isActive = isActive;
  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { nameKr: { contains: search, mode: 'insensitive' } },
      { nameEn: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  const items = await prisma.clinicalTestItem.findMany({
    where,
    orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
  });
  
  // 카테고리별 그룹화
  const groupedByCategory: Record<string, typeof items> = {};
  items.forEach(item => {
    if (!groupedByCategory[item.category]) {
      groupedByCategory[item.category] = [];
    }
    groupedByCategory[item.category].push(item);
  });
  
  return { items, groupedByCategory };
}

export async function getTestItemById(id: string) {
  return prisma.clinicalTestItem.findUnique({ where: { id } });
}

export async function createTestItem(data: {
  category: ClinicalTestCategory;
  code: string;
  nameKr: string;
  nameEn: string;
  unit?: string;
  method?: string;
  unitPrice: number;
  isPackage?: boolean;
  packageItems?: string[];
  requiredSampleTypes?: SampleType[];
  minSampleVolume?: number;
  requiresItem?: string;
  displayOrder?: number;
}) {
  return prisma.clinicalTestItem.create({ data });
}

export async function updateTestItem(id: string, data: Partial<{
  category: ClinicalTestCategory;
  code: string;
  nameKr: string;
  nameEn: string;
  unit: string;
  method: string;
  unitPrice: number;
  isPackage: boolean;
  packageItems: string[];
  requiredSampleTypes: SampleType[];
  minSampleVolume: number;
  requiresItem: string;
  displayOrder: number;
  isActive: boolean;
}>) {
  return prisma.clinicalTestItem.update({ where: { id }, data });
}

export async function toggleTestItemActive(id: string) {
  const item = await prisma.clinicalTestItem.findUnique({ where: { id } });
  if (!item) throw new Error('검사항목을 찾을 수 없습니다.');
  
  return prisma.clinicalTestItem.update({
    where: { id },
    data: { isActive: !item.isActive },
  });
}

// ==================== QC 설정 ====================

export async function getQcSettings() {
  return prisma.clinicalQcSetting.findMany({
    where: { isActive: true },
    orderBy: { category: 'asc' },
  });
}

export async function updateQcSettings(settings: Array<{
  category: ClinicalTestCategory;
  thresholdCount: number;
  qcFee: number;
}>) {
  const results = await Promise.all(
    settings.map(setting =>
      prisma.clinicalQcSetting.upsert({
        where: { category: setting.category },
        update: {
          thresholdCount: setting.thresholdCount,
          qcFee: setting.qcFee,
        },
        create: {
          category: setting.category,
          thresholdCount: setting.thresholdCount,
          qcFee: setting.qcFee,
        },
      })
    )
  );
  return results;
}


// ==================== 견적서 번호 생성 ====================

async function generateQuotationNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  
  // 해당 월의 마지막 견적서 번호 조회
  const prefix = `${year}-DL-${month}`;
  const lastQuotation = await prisma.clinicalQuotation.findFirst({
    where: { quotationNumber: { startsWith: prefix } },
    orderBy: { quotationNumber: 'desc' },
  });
  
  let sequence = 1;
  if (lastQuotation) {
    const lastSeq = parseInt(lastQuotation.quotationNumber.split('-').pop() || '0');
    sequence = lastSeq + 1;
  }
  
  return `${prefix}-${sequence.toString().padStart(4, '0')}`;
}

// ==================== 금액 계산 ====================

export async function calculateQuotation(params: {
  totalSamples: number;
  items: Array<{ testItemId: string; quantity: number }>;
  discountType?: 'RATE' | 'AMOUNT';
  discountValue?: number;
  vatRate?: number;
}) {
  const { totalSamples, items, discountType, discountValue, vatRate = 10 } = params;
  
  // 검사항목 조회
  const testItemIds = items.map(i => i.testItemId);
  const testItems = await prisma.clinicalTestItem.findMany({
    where: { id: { in: testItemIds } },
  });
  
  const testItemMap = new Map(testItems.map(t => [t.id, t]));
  
  // 항목별 금액 계산
  const calculatedItems = items.map(item => {
    const testItem = testItemMap.get(item.testItemId);
    if (!testItem) throw new Error(`검사항목을 찾을 수 없습니다: ${item.testItemId}`);
    
    const amount = testItem.unitPrice * item.quantity;
    return {
      testItemId: item.testItemId,
      code: testItem.code,
      nameKr: testItem.nameKr,
      category: testItem.category,
      unitPrice: testItem.unitPrice,
      quantity: item.quantity,
      amount,
    };
  });
  
  // 소계
  const subtotal = calculatedItems.reduce((sum, item) => sum + item.amount, 0);
  
  // QC 비용 계산
  const qcSettings = await getQcSettings();
  const usedCategories = new Set(calculatedItems.map(item => item.category));
  const qcFees: Record<string, number> = {};
  
  usedCategories.forEach(category => {
    const setting = qcSettings.find(s => s.category === category);
    if (setting && totalSamples < setting.thresholdCount) {
      qcFees[category] = setting.qcFee;
    }
  });
  
  const totalQcFee = Object.values(qcFees).reduce((sum, fee) => sum + fee, 0);
  
  // 합계 (할인 전)
  const totalBeforeDiscount = subtotal + totalQcFee;
  
  // 할인 계산
  let discountAmount = 0;
  if (discountType === 'RATE' && discountValue) {
    discountAmount = Math.round(totalBeforeDiscount * (discountValue / 100));
  } else if (discountType === 'AMOUNT' && discountValue) {
    discountAmount = discountValue;
  }
  
  // VAT 전 금액
  const totalBeforeVat = totalBeforeDiscount - discountAmount;
  
  // 부가세
  const vatAmount = Math.round(totalBeforeVat * (vatRate / 100));
  
  // 최종 금액
  const totalAmount = totalBeforeVat + vatAmount;
  
  return {
    items: calculatedItems,
    subtotal,
    qcFees,
    totalQcFee,
    discountAmount,
    totalBeforeVat,
    vatAmount,
    totalAmount,
  };
}

// ==================== 견적서 CRUD ====================

export async function getQuotations(params: {
  status?: ClinicalQuotationStatus;
  customerId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  userId?: string;
}) {
  const { status, customerId, search, dateFrom, dateTo, page = 1, limit = 20, userId } = params;
  
  const where: any = {};
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (userId) where.createdById = userId;
  if (search) {
    where.OR = [
      { quotationNumber: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
      { contactName: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }
  
  const [quotations, total] = await Promise.all([
    prisma.clinicalQuotation.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, company: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.clinicalQuotation.count({ where }),
  ]);
  
  return {
    quotations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getQuotationById(id: string) {
  const quotation = await prisma.clinicalQuotation.findUnique({
    where: { id },
    include: {
      customer: true,
      contactPerson: true,
      createdBy: { select: { id: true, name: true, email: true } },
      items: {
        include: { testItem: true },
        orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
      },
      testRequest: true,
    },
  });
  
  return quotation;
}


export async function createQuotation(data: {
  customerId?: string;
  customerName: string;
  contactPersonId?: string;
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  testStandard: string;
  animalSpecies: string;
  sampleTypes: SampleType[];
  totalSamples: number;
  maleSamples: number;
  femaleSamples: number;
  items: Array<{ testItemId: string; quantity: number }>;
  discountType?: string;
  discountValue?: number;
  discountReason?: string;
  vatRate?: number;
  validDays?: number;
  notes?: string;
  createdById: string;
}) {
  const quotationNumber = await generateQuotationNumber();
  const validDays = data.validDays || 60;
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + validDays);
  
  // 금액 계산
  const calculation = await calculateQuotation({
    totalSamples: data.totalSamples,
    items: data.items,
    discountType: data.discountType as 'RATE' | 'AMOUNT' | undefined,
    discountValue: data.discountValue,
    vatRate: data.vatRate,
  });
  
  // 검사항목 조회
  const testItemIds = data.items.map(i => i.testItemId);
  const testItems = await prisma.clinicalTestItem.findMany({
    where: { id: { in: testItemIds } },
  });
  const testItemMap = new Map(testItems.map(t => [t.id, t]));
  
  const quotation = await prisma.clinicalQuotation.create({
    data: {
      quotationNumber,
      customerId: data.customerId,
      customerName: data.customerName,
      contactPersonId: data.contactPersonId,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      testStandard: data.testStandard,
      animalSpecies: data.animalSpecies,
      sampleTypes: data.sampleTypes,
      totalSamples: data.totalSamples,
      maleSamples: data.maleSamples,
      femaleSamples: data.femaleSamples,
      subtotal: calculation.subtotal,
      qcFees: calculation.qcFees,
      totalQcFee: calculation.totalQcFee,
      discountType: data.discountType,
      discountValue: data.discountValue,
      discountAmount: calculation.discountAmount,
      discountReason: data.discountReason,
      totalBeforeVat: calculation.totalBeforeVat,
      vatRate: data.vatRate || 10,
      vatAmount: calculation.vatAmount,
      totalAmount: calculation.totalAmount,
      validDays,
      validUntil,
      notes: data.notes,
      createdById: data.createdById,
      items: {
        create: data.items.map((item, index) => {
          const testItem = testItemMap.get(item.testItemId)!;
          const calcItem = calculation.items.find(c => c.testItemId === item.testItemId)!;
          return {
            testItemId: item.testItemId,
            category: testItem.category,
            code: testItem.code,
            nameKr: testItem.nameKr,
            nameEn: testItem.nameEn,
            unit: testItem.unit,
            method: testItem.method,
            isPackage: testItem.isPackage,
            unitPrice: testItem.unitPrice,
            quantity: item.quantity,
            amount: calcItem.amount,
            displayOrder: index,
          };
        }),
      },
    },
    include: {
      items: true,
      customer: true,
      createdBy: { select: { id: true, name: true } },
    },
  });
  
  return { quotation, quotationNumber };
}

export async function updateQuotation(id: string, data: Partial<{
  customerId: string;
  customerName: string;
  contactPersonId: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  testStandard: string;
  animalSpecies: string;
  sampleTypes: SampleType[];
  totalSamples: number;
  maleSamples: number;
  femaleSamples: number;
  items: Array<{ testItemId: string; quantity: number }>;
  discountType: string;
  discountValue: number;
  discountReason: string;
  vatRate: number;
  validDays: number;
  notes: string;
}>) {
  const existing = await prisma.clinicalQuotation.findUnique({ where: { id } });
  if (!existing) throw new Error('견적서를 찾을 수 없습니다.');
  if (existing.status !== 'DRAFT') throw new Error('작성중 상태의 견적서만 수정할 수 있습니다.');
  
  // 항목이 변경된 경우 금액 재계산
  let calculation: Awaited<ReturnType<typeof calculateQuotation>> | null = null;
  
  if (data.items) {
    calculation = await calculateQuotation({
      totalSamples: data.totalSamples || existing.totalSamples,
      items: data.items,
      discountType: (data.discountType || existing.discountType) as 'RATE' | 'AMOUNT' | undefined,
      discountValue: data.discountValue ?? existing.discountValue ?? undefined,
      vatRate: data.vatRate || existing.vatRate,
    });
  }
  
  // 유효기간 재계산
  let validUntil = existing.validUntil;
  if (data.validDays) {
    validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + data.validDays);
  }
  
  return prisma.$transaction(async (tx) => {
    // 기존 항목 삭제 (항목이 변경된 경우)
    if (data.items) {
      await tx.clinicalQuotationItem.deleteMany({ where: { quotationId: id } });
      
      // 검사항목 조회
      const testItemIds = data.items.map(i => i.testItemId);
      const testItems = await tx.clinicalTestItem.findMany({
        where: { id: { in: testItemIds } },
      });
      const testItemMap = new Map(testItems.map(t => [t.id, t]));
      
      // 새 항목 생성
      await tx.clinicalQuotationItem.createMany({
        data: data.items.map((item, index) => {
          const testItem = testItemMap.get(item.testItemId)!;
          const calcItem = calculation!.items.find(c => c.testItemId === item.testItemId);
          return {
            quotationId: id,
            testItemId: item.testItemId,
            category: testItem.category,
            code: testItem.code,
            nameKr: testItem.nameKr,
            nameEn: testItem.nameEn,
            unit: testItem.unit,
            method: testItem.method,
            isPackage: testItem.isPackage,
            unitPrice: testItem.unitPrice,
            quantity: item.quantity,
            amount: calcItem?.amount ?? 0,
            displayOrder: index,
          };
        }),
      });
    }
    
    // 견적서 업데이트
    const updateData: any = {
      ...(data.customerId !== undefined && { customerId: data.customerId }),
      ...(data.customerName && { customerName: data.customerName }),
      ...(data.contactPersonId !== undefined && { contactPersonId: data.contactPersonId }),
      ...(data.contactName && { contactName: data.contactName }),
      ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone }),
      ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail }),
      ...(data.testStandard && { testStandard: data.testStandard }),
      ...(data.animalSpecies && { animalSpecies: data.animalSpecies }),
      ...(data.sampleTypes && { sampleTypes: data.sampleTypes }),
      ...(data.totalSamples !== undefined && { totalSamples: data.totalSamples }),
      ...(data.maleSamples !== undefined && { maleSamples: data.maleSamples }),
      ...(data.femaleSamples !== undefined && { femaleSamples: data.femaleSamples }),
      ...(data.discountType !== undefined && { discountType: data.discountType }),
      ...(data.discountValue !== undefined && { discountValue: data.discountValue }),
      ...(data.discountReason !== undefined && { discountReason: data.discountReason }),
      ...(data.vatRate !== undefined && { vatRate: data.vatRate }),
      ...(data.validDays !== undefined && { validDays: data.validDays, validUntil }),
      ...(data.notes !== undefined && { notes: data.notes }),
    };
    
    if (calculation) {
      updateData.subtotal = calculation.subtotal;
      updateData.qcFees = calculation.qcFees;
      updateData.totalQcFee = calculation.totalQcFee;
      updateData.discountAmount = calculation.discountAmount;
      updateData.totalBeforeVat = calculation.totalBeforeVat;
      updateData.vatAmount = calculation.vatAmount;
      updateData.totalAmount = calculation.totalAmount;
    }
    
    return tx.clinicalQuotation.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        customer: true,
        createdBy: { select: { id: true, name: true } },
      },
    });
  });
}

export async function deleteQuotation(id: string) {
  const existing = await prisma.clinicalQuotation.findUnique({ where: { id } });
  if (!existing) throw new Error('견적서를 찾을 수 없습니다.');
  if (existing.status !== 'DRAFT') throw new Error('작성중 상태의 견적서만 삭제할 수 있습니다.');
  
  return prisma.clinicalQuotation.delete({ where: { id } });
}


// ==================== 견적서 상태 변경 ====================

export async function sendQuotation(id: string) {
  const existing = await prisma.clinicalQuotation.findUnique({ where: { id } });
  if (!existing) throw new Error('견적서를 찾을 수 없습니다.');
  if (existing.status !== 'DRAFT') throw new Error('작성중 상태의 견적서만 발송할 수 있습니다.');
  
  return prisma.clinicalQuotation.update({
    where: { id },
    data: {
      status: 'SENT',
      sentAt: new Date(),
    },
  });
}

export async function acceptQuotation(id: string) {
  const existing = await prisma.clinicalQuotation.findUnique({ where: { id } });
  if (!existing) throw new Error('견적서를 찾을 수 없습니다.');
  if (existing.status !== 'SENT') throw new Error('발송완료 상태의 견적서만 승인할 수 있습니다.');
  
  return prisma.clinicalQuotation.update({
    where: { id },
    data: {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
    },
  });
}

export async function rejectQuotation(id: string) {
  const existing = await prisma.clinicalQuotation.findUnique({ where: { id } });
  if (!existing) throw new Error('견적서를 찾을 수 없습니다.');
  if (existing.status !== 'SENT') throw new Error('발송완료 상태의 견적서만 거절할 수 있습니다.');
  
  return prisma.clinicalQuotation.update({
    where: { id },
    data: { status: 'REJECTED' },
  });
}

export async function copyQuotation(id: string, userId: string) {
  const original = await prisma.clinicalQuotation.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!original) throw new Error('견적서를 찾을 수 없습니다.');
  
  const quotationNumber = await generateQuotationNumber();
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + original.validDays);
  
  const newQuotation = await prisma.clinicalQuotation.create({
    data: {
      quotationNumber,
      customerId: original.customerId,
      customerName: original.customerName,
      contactPersonId: original.contactPersonId,
      contactName: original.contactName,
      contactPhone: original.contactPhone,
      contactEmail: original.contactEmail,
      testStandard: original.testStandard,
      animalSpecies: original.animalSpecies,
      sampleTypes: original.sampleTypes,
      totalSamples: original.totalSamples,
      maleSamples: original.maleSamples,
      femaleSamples: original.femaleSamples,
      subtotal: original.subtotal,
      qcFees: original.qcFees as object,
      totalQcFee: original.totalQcFee,
      discountType: original.discountType,
      discountValue: original.discountValue,
      discountAmount: original.discountAmount,
      discountReason: original.discountReason,
      totalBeforeVat: original.totalBeforeVat,
      vatRate: original.vatRate,
      vatAmount: original.vatAmount,
      totalAmount: original.totalAmount,
      validDays: original.validDays,
      validUntil,
      notes: original.notes,
      status: 'DRAFT',
      createdById: userId,
      items: {
        create: original.items.map(item => ({
          testItemId: item.testItemId,
          category: item.category,
          code: item.code,
          nameKr: item.nameKr,
          nameEn: item.nameEn,
          unit: item.unit,
          method: item.method,
          isPackage: item.isPackage,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          amount: item.amount,
          displayOrder: item.displayOrder,
        })),
      },
    },
    include: {
      items: true,
      customer: true,
      createdBy: { select: { id: true, name: true } },
    },
  });
  
  return newQuotation;
}

// ==================== 시험의뢰서 ====================

export async function convertToTestRequest(quotationId: string, userId: string) {
  const quotation = await prisma.clinicalQuotation.findUnique({
    where: { id: quotationId },
    include: { items: true, customer: true },
  });
  
  if (!quotation) throw new Error('견적서를 찾을 수 없습니다.');
  if (quotation.status !== 'ACCEPTED') throw new Error('승인된 견적서만 시험의뢰서로 전환할 수 있습니다.');
  
  return prisma.$transaction(async (tx) => {
    const testRequest = await tx.clinicalTestRequest.create({
      data: {
        quotationId: quotation.id,
        customerName: quotation.customerName,
        contactName: quotation.contactName,
        contactPhone: quotation.contactPhone,
        contactEmail: quotation.contactEmail,
        address: quotation.customer?.address,
        animalSpecies: quotation.animalSpecies,
        sampleTypes: quotation.sampleTypes,
        totalSamples: quotation.totalSamples,
        maleSamples: quotation.maleSamples,
        femaleSamples: quotation.femaleSamples,
        reportType: 'FULL',
        sampleDisposal: 'DISPOSE',
        status: 'DRAFT',
        createdById: userId,
        items: {
          create: quotation.items.map(item => ({
            testItemId: item.testItemId,
            category: item.category,
            code: item.code,
            nameKr: item.nameKr,
            nameEn: item.nameEn,
            isSelected: true,
            displayOrder: item.displayOrder,
          })),
        },
      },
    });
    
    await tx.clinicalQuotation.update({
      where: { id: quotationId },
      data: { status: 'CONVERTED' },
    });
    
    return testRequest;
  });
}

export async function getTestRequests(params: {
  status?: ClinicalTestRequestStatus;
  quotationId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  userId?: string;
}) {
  const { status, quotationId, search, dateFrom, dateTo, page = 1, limit = 20, userId } = params;
  
  const where: any = {};
  if (status) where.status = status;
  if (quotationId) where.quotationId = quotationId;
  if (userId) where.createdById = userId;
  if (search) {
    where.OR = [
      { testNumber: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
      { contactName: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }
  
  const [requests, total] = await Promise.all([
    prisma.clinicalTestRequest.findMany({
      where,
      include: {
        quotation: { select: { id: true, quotationNumber: true, totalAmount: true } },
        createdBy: { select: { id: true, name: true } },
        testDirector: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.clinicalTestRequest.count({ where }),
  ]);
  
  return {
    requests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTestRequestById(id: string) {
  return prisma.clinicalTestRequest.findUnique({
    where: { id },
    include: {
      quotation: true,
      createdBy: { select: { id: true, name: true, email: true } },
      testDirector: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } },
      operationManager: { select: { id: true, name: true } },
      items: {
        include: { testItem: true },
        orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
      },
    },
  });
}


export async function updateTestRequest(id: string, data: Partial<{
  customerName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  postalCode: string;
  fax: string;
  desiredCompletionDate: Date;
  reportType: ClinicalReportType;
  includeStatistics: boolean;
  animalSpecies: string;
  sampleTypes: SampleType[];
  totalSamples: number;
  maleSamples: number;
  femaleSamples: number;
  sampleSendDate: Date;
  sampleDisposal: SampleDisposal;
  returnAddress: string;
  testDescription: string;
}>) {
  const existing = await prisma.clinicalTestRequest.findUnique({ where: { id } });
  if (!existing) throw new Error('시험의뢰서를 찾을 수 없습니다.');
  if (existing.status !== 'DRAFT') throw new Error('작성중 상태의 시험의뢰서만 수정할 수 있습니다.');
  
  return prisma.clinicalTestRequest.update({
    where: { id },
    data,
  });
}

export async function deleteTestRequest(id: string) {
  const existing = await prisma.clinicalTestRequest.findUnique({ where: { id } });
  if (!existing) throw new Error('시험의뢰서를 찾을 수 없습니다.');
  if (existing.status !== 'DRAFT') throw new Error('작성중 상태의 시험의뢰서만 삭제할 수 있습니다.');
  
  // 연결된 견적서 상태 복원
  await prisma.clinicalQuotation.update({
    where: { id: existing.quotationId },
    data: { status: 'ACCEPTED' },
  });
  
  return prisma.clinicalTestRequest.delete({ where: { id } });
}

export async function submitTestRequest(id: string) {
  const existing = await prisma.clinicalTestRequest.findUnique({ where: { id } });
  if (!existing) throw new Error('시험의뢰서를 찾을 수 없습니다.');
  if (existing.status !== 'DRAFT') throw new Error('작성중 상태의 시험의뢰서만 제출할 수 있습니다.');
  
  return prisma.clinicalTestRequest.update({
    where: { id },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date(),
    },
  });
}

export async function receiveTestRequest(id: string, data: {
  testNumber: string;
  testDirectorId: string;
  receiverId: string;
  operationManagerId?: string;
}) {
  const existing = await prisma.clinicalTestRequest.findUnique({ where: { id } });
  if (!existing) throw new Error('시험의뢰서를 찾을 수 없습니다.');
  if (existing.status !== 'SUBMITTED') throw new Error('제출된 시험의뢰서만 접수할 수 있습니다.');
  
  return prisma.clinicalTestRequest.update({
    where: { id },
    data: {
      testNumber: data.testNumber,
      testDirectorId: data.testDirectorId,
      receiverId: data.receiverId,
      operationManagerId: data.operationManagerId,
      status: 'RECEIVED',
      receivedDate: new Date(),
    },
  });
}

export async function startTestRequest(id: string) {
  const existing = await prisma.clinicalTestRequest.findUnique({ where: { id } });
  if (!existing) throw new Error('시험의뢰서를 찾을 수 없습니다.');
  if (existing.status !== 'RECEIVED') throw new Error('접수완료 상태의 시험의뢰서만 진행할 수 있습니다.');
  
  return prisma.clinicalTestRequest.update({
    where: { id },
    data: { status: 'IN_PROGRESS' },
  });
}

export async function completeTestRequest(id: string) {
  const existing = await prisma.clinicalTestRequest.findUnique({ where: { id } });
  if (!existing) throw new Error('시험의뢰서를 찾을 수 없습니다.');
  if (existing.status !== 'IN_PROGRESS') throw new Error('진행중 상태의 시험의뢰서만 완료할 수 있습니다.');
  
  return prisma.clinicalTestRequest.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  });
}

export async function cancelTestRequest(id: string) {
  const existing = await prisma.clinicalTestRequest.findUnique({ where: { id } });
  if (!existing) throw new Error('시험의뢰서를 찾을 수 없습니다.');
  if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
    throw new Error('완료 또는 취소된 시험의뢰서는 취소할 수 없습니다.');
  }
  
  return prisma.clinicalTestRequest.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });
}

// ==================== 통계 ====================

export async function getStatistics(userId?: string) {
  const where: any = userId ? { createdById: userId } : {};
  
  const [
    totalQuotations,
    draftQuotations,
    sentQuotations,
    acceptedQuotations,
    totalTestRequests,
    inProgressRequests,
    completedRequests,
  ] = await Promise.all([
    prisma.clinicalQuotation.count({ where }),
    prisma.clinicalQuotation.count({ where: { ...where, status: 'DRAFT' } }),
    prisma.clinicalQuotation.count({ where: { ...where, status: 'SENT' } }),
    prisma.clinicalQuotation.count({ where: { ...where, status: 'ACCEPTED' } }),
    prisma.clinicalTestRequest.count({ where }),
    prisma.clinicalTestRequest.count({ where: { ...where, status: 'IN_PROGRESS' } }),
    prisma.clinicalTestRequest.count({ where: { ...where, status: 'COMPLETED' } }),
  ]);
  
  // 이번 달 견적 금액 합계
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const monthlyQuotations = await prisma.clinicalQuotation.aggregate({
    where: {
      ...where,
      createdAt: { gte: startOfMonth },
      status: { in: ['SENT', 'ACCEPTED', 'CONVERTED'] },
    },
    _sum: { totalAmount: true },
    _count: true,
  });
  
  return {
    quotations: {
      total: totalQuotations,
      draft: draftQuotations,
      sent: sentQuotations,
      accepted: acceptedQuotations,
    },
    testRequests: {
      total: totalTestRequests,
      inProgress: inProgressRequests,
      completed: completedRequests,
    },
    monthly: {
      count: monthlyQuotations._count,
      amount: monthlyQuotations._sum.totalAmount || 0,
    },
  };
}
