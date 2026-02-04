// 통합 검색 서비스
// 모든 견적서 유형(독성, 효력, 임상병리)을 통합 검색

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface UnifiedSearchResult {
  id: string;
  type: 'TOXICITY' | 'EFFICACY' | 'CLINICAL_PATHOLOGY';
  quotationNumber: string;
  customerName: string;
  projectName?: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
  createdBy: {
    id: string;
    name: string;
  };
}

export interface SearchParams {
  query: string;
  types?: ('TOXICITY' | 'EFFICACY' | 'CLINICAL_PATHOLOGY')[];
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  results: UnifiedSearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  counts: {
    toxicity: number;
    efficacy: number;
    clinicalPathology: number;
    total: number;
  };
}

export async function unifiedSearch(params: SearchParams): Promise<SearchResponse> {
  const {
    query,
    types = ['TOXICITY', 'EFFICACY', 'CLINICAL_PATHOLOGY'],
    status,
    dateFrom,
    dateTo,
    userId,
    page = 1,
    limit = 20,
  } = params;

  const searchTerm = `%${query}%`;
  const results: UnifiedSearchResult[] = [];
  let toxicityCount = 0;
  let efficacyCount = 0;
  let clinicalCount = 0;

  // 독성/효력 견적서 검색 (Quotation 테이블)
  if (types.includes('TOXICITY') || types.includes('EFFICACY')) {
    const quotationTypes = types.filter(t => t === 'TOXICITY' || t === 'EFFICACY');
    
    const whereClause: any = {
      deletedAt: null,
      quotationType: { in: quotationTypes },
      OR: [
        { quotationNumber: { contains: query, mode: 'insensitive' } },
        { customerName: { contains: query, mode: 'insensitive' } },
        { projectName: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (status) {
      whereClause.status = status;
    }
    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt.gte = dateFrom;
      if (dateTo) whereClause.createdAt.lte = dateTo;
    }
    if (userId) {
      whereClause.userId = userId;
    }

    const quotations = await prisma.quotation.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 유형별 카운트
    toxicityCount = quotations.filter(q => q.quotationType === 'TOXICITY').length;
    efficacyCount = quotations.filter(q => q.quotationType === 'EFFICACY').length;

    for (const q of quotations) {
      results.push({
        id: q.id,
        type: q.quotationType as 'TOXICITY' | 'EFFICACY',
        quotationNumber: q.quotationNumber,
        customerName: q.customerName,
        projectName: q.projectName,
        totalAmount: Number(q.totalAmount),
        status: q.status,
        createdAt: q.createdAt,
        createdBy: q.user,
      });
    }
  }

  // 임상병리 견적서 검색 (ClinicalQuotation 테이블)
  if (types.includes('CLINICAL_PATHOLOGY')) {
    const clinicalWhere: any = {
      OR: [
        { quotationNumber: { contains: query, mode: 'insensitive' } },
        { customerName: { contains: query, mode: 'insensitive' } },
        { contactName: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (status) {
      clinicalWhere.status = status;
    }
    if (dateFrom || dateTo) {
      clinicalWhere.createdAt = {};
      if (dateFrom) clinicalWhere.createdAt.gte = dateFrom;
      if (dateTo) clinicalWhere.createdAt.lte = dateTo;
    }
    if (userId) {
      clinicalWhere.createdById = userId;
    }

    const clinicalQuotations = await prisma.clinicalQuotation.findMany({
      where: clinicalWhere,
      include: {
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    clinicalCount = clinicalQuotations.length;

    for (const cq of clinicalQuotations) {
      results.push({
        id: cq.id,
        type: 'CLINICAL_PATHOLOGY',
        quotationNumber: cq.quotationNumber,
        customerName: cq.customerName,
        projectName: cq.animalSpecies, // 동물종을 프로젝트명 대신 표시
        totalAmount: Number(cq.totalAmount),
        status: cq.status,
        createdAt: cq.createdAt,
        createdBy: cq.createdBy,
      });
    }
  }

  // 결과 정렬 (최신순)
  results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // 페이지네이션
  const total = results.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const paginatedResults = results.slice(startIndex, startIndex + limit);

  return {
    results: paginatedResults,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
    counts: {
      toxicity: toxicityCount,
      efficacy: efficacyCount,
      clinicalPathology: clinicalCount,
      total: toxicityCount + efficacyCount + clinicalCount,
    },
  };
}
