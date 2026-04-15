// 통합 검색 서비스 — 웹앱 전체 데이터 검색
import prisma from '../lib/prisma';

export type SearchCategory = 'customer' | 'quotation' | 'contract' | 'study' | 'test_reception' | 'consultation' | 'lead';

export interface GlobalSearchResult {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle: string;
  status?: string;
  date: string;
  href: string;
  meta?: Record<string, any>;
}

export interface GlobalSearchParams {
  query: string;
  categories?: SearchCategory[];
  userId: string;
  page?: number;
  limit?: number;
}

export interface GlobalSearchResponse {
  results: GlobalSearchResult[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  counts: Record<SearchCategory, number>;
}

export async function globalSearch(params: GlobalSearchParams): Promise<GlobalSearchResponse> {
  const {
    query,
    categories,
    userId,
    page = 1,
    limit = 30,
  } = params;

  const q = query.trim();
  const results: GlobalSearchResult[] = [];
  const counts: Record<SearchCategory, number> = {
    customer: 0, quotation: 0, contract: 0, study: 0,
    test_reception: 0, consultation: 0, lead: 0,
  };

  const shouldSearch = (cat: SearchCategory) => !categories || categories.length === 0 || categories.includes(cat);

  // 1. 고객사 검색
  if (shouldSearch('customer')) {
    const customers = await prisma.customer.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [
          { company: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 50,
      orderBy: { updatedAt: 'desc' },
    });
    counts.customer = customers.length;
    for (const c of customers) {
      results.push({
        id: c.id,
        category: 'customer',
        title: c.company || c.name,
        subtitle: c.company ? c.name : (c.email || ''),
        status: c.grade || undefined,
        date: c.updatedAt.toISOString(),
        href: `/customers/${c.id}`,
      });
    }
  }

  // 2. 견적서 검색
  if (shouldSearch('quotation')) {
    const quotations = await prisma.quotation.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [
          { quotationNumber: { contains: q, mode: 'insensitive' } },
          { customerName: { contains: q, mode: 'insensitive' } },
          { projectName: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true, quotationNumber: true, customerName: true,
        projectName: true, quotationType: true, status: true,
        totalAmount: true, updatedAt: true,
      },
      take: 50,
      orderBy: { updatedAt: 'desc' },
    });
    counts.quotation = quotations.length;
    for (const qt of quotations) {
      results.push({
        id: qt.id,
        category: 'quotation',
        title: qt.quotationNumber,
        subtitle: `${qt.customerName}${qt.projectName ? ' · ' + qt.projectName : ''}`,
        status: qt.status,
        date: qt.updatedAt.toISOString(),
        href: `/quotations/${qt.id}`,
        meta: { type: qt.quotationType, amount: Number(qt.totalAmount) },
      });
    }

    // 임상병리 견적서
    const clinicals = await prisma.clinicalQuotation.findMany({
      where: {
        createdById: userId,
        OR: [
          { quotationNumber: { contains: q, mode: 'insensitive' } },
          { customerName: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true, quotationNumber: true, customerName: true,
        animalSpecies: true, status: true, totalAmount: true, updatedAt: true,
      },
      take: 20,
      orderBy: { updatedAt: 'desc' },
    });
    counts.quotation += clinicals.length;
    for (const cq of clinicals) {
      results.push({
        id: cq.id,
        category: 'quotation',
        title: cq.quotationNumber,
        subtitle: `${cq.customerName} · 임상병리`,
        status: cq.status,
        date: cq.updatedAt.toISOString(),
        href: `/clinical-pathology/quotations/${cq.id}`,
        meta: { type: 'CLINICAL_PATHOLOGY', amount: Number(cq.totalAmount) },
      });
    }
  }

  // 3. 계약 검색
  if (shouldSearch('contract')) {
    const contracts = await prisma.contract.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [
          { contractNumber: { contains: q, mode: 'insensitive' } },
          { title: { contains: q, mode: 'insensitive' } },
          { customer: { company: { contains: q, mode: 'insensitive' } } },
          { customer: { name: { contains: q, mode: 'insensitive' } } },
        ],
      },
      include: { customer: { select: { company: true, name: true } } },
      take: 50,
      orderBy: { updatedAt: 'desc' },
    });
    counts.contract = contracts.length;
    for (const ct of contracts) {
      results.push({
        id: ct.id,
        category: 'contract',
        title: ct.contractNumber,
        subtitle: `${ct.customer?.company || ct.customer?.name || ''} · ${ct.title}`,
        status: ct.status,
        date: ct.updatedAt.toISOString(),
        href: `/contracts/${ct.id}`,
        meta: { amount: Number(ct.totalAmount) },
      });
    }
  }

  // 4. 시험 검색
  if (shouldSearch('study')) {
    const studies = await prisma.study.findMany({
      where: {
        OR: [
          { studyNumber: { contains: q, mode: 'insensitive' } },
          { testName: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: {
        contract: { include: { customer: { select: { id: true, company: true, name: true } } } },
      },
      take: 50,
      orderBy: { updatedAt: 'desc' },
    });
    counts.study = studies.length;
    for (const s of studies) {
      const customerName = s.contract?.customer?.company || s.contract?.customer?.name || '';
      results.push({
        id: s.id,
        category: 'study',
        title: s.studyNumber,
        subtitle: `${customerName}${customerName ? ' · ' : ''}${s.testName}`,
        status: s.status,
        date: s.updatedAt.toISOString(),
        href: `/studies/${s.id}`,
      });
    }
  }

  // 5. 시험접수 검색
  if (shouldSearch('test_reception')) {
    const receptions = await prisma.testReception.findMany({
      where: {
        customer: { userId },
        OR: [
          { testNumber: { contains: q, mode: 'insensitive' } },
          { testTitle: { contains: q, mode: 'insensitive' } },
          { substanceName: { contains: q, mode: 'insensitive' } },
          { customer: { company: { contains: q, mode: 'insensitive' } } },
          { customer: { name: { contains: q, mode: 'insensitive' } } },
        ],
      },
      include: { customer: { select: { id: true, company: true, name: true } } },
      take: 50,
      orderBy: { updatedAt: 'desc' },
    });
    counts.test_reception = receptions.length;
    for (const tr of receptions) {
      results.push({
        id: tr.id,
        category: 'test_reception',
        title: tr.testNumber || tr.testTitle || '시험접수',
        subtitle: `${tr.customer?.company || tr.customer?.name || ''} · ${tr.substanceName || ''}`,
        status: tr.status,
        date: tr.updatedAt.toISOString(),
        href: `/customers/${tr.customerId}`,
      });
    }
  }

  // 6. 상담기록 검색
  if (shouldSearch('consultation')) {
    const consultations = await prisma.consultationRecord.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [
          { recordNumber: { contains: q, mode: 'insensitive' } },
          { clientRequests: { contains: q, mode: 'insensitive' } },
          { internalNotes: { contains: q, mode: 'insensitive' } },
          { substanceName: { contains: q, mode: 'insensitive' } },
          { customer: { company: { contains: q, mode: 'insensitive' } } },
          { customer: { name: { contains: q, mode: 'insensitive' } } },
        ],
      },
      include: { customer: { select: { id: true, company: true, name: true } } },
      take: 50,
      orderBy: { updatedAt: 'desc' },
    });
    counts.consultation = consultations.length;
    for (const cs of consultations) {
      results.push({
        id: cs.id,
        category: 'consultation',
        title: cs.recordNumber,
        subtitle: `${cs.customer?.company || cs.customer?.name || ''} · ${(cs.clientRequests || '').slice(0, 50)}`,
        date: cs.updatedAt.toISOString(),
        href: `/customers/${cs.customerId}`,
      });
    }
  }

  // 7. 리드 검색
  if (shouldSearch('lead')) {
    const leads = await prisma.lead.findMany({
      where: {
        userId,
        OR: [
          { companyName: { contains: q, mode: 'insensitive' } },
          { contactName: { contains: q, mode: 'insensitive' } },
          { contactEmail: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 50,
      orderBy: { updatedAt: 'desc' },
    });
    counts.lead = leads.length;
    for (const l of leads) {
      results.push({
        id: l.id,
        category: 'lead',
        title: l.companyName,
        subtitle: l.contactName || '',
        status: l.status,
        date: l.updatedAt.toISOString(),
        href: `/leads/${l.id}`,
      });
    }
  }

  // 정렬 (최신순)
  results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 페이지네이션
  const total = results.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedResults = results.slice((page - 1) * limit, page * limit);

  return {
    results: paginatedResults,
    pagination: { page, limit, total, totalPages },
    counts,
  };
}

// 하위 호환: 기존 견적서 전용 검색 유지
export { globalSearch as unifiedSearch };
export type { GlobalSearchParams as SearchParams };
