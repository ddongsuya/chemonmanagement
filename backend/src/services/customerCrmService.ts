// src/services/customerCrmService.ts
// 고객사 CRM 통합 데이터 서비스 (견적서, 계약, 리드 활동, 상담기록, 활동 타임라인)

import prisma from '../lib/prisma';

export interface TimelineItem {
  id: string;
  type: 'quotation' | 'contract' | 'meeting' | 'calendar_event' | 'lead_activity' | 'consultation';
  title: string;
  description: string;
  date: string;
  metadata?: Record<string, any>;
}

// 동일 회사의 모든 Customer ID를 찾는 헬퍼 (크로스 모듈 데이터 연동)
// 1) company/name 직접 매칭
// 2) Lead.companyName을 통한 간접 매칭
async function findRelatedCustomerIds(customerId: string): Promise<string[]> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true, company: true, name: true, userId: true,
      leads: {
        where: { deletedAt: null },
        select: { companyName: true },
        take: 1,
      },
    },
  });
  if (!customer) return [customerId];

  // 회사명 후보 수집 (company, name, lead.companyName)
  const nameSet = new Set<string>();
  if (customer.company) nameSet.add(customer.company);
  if (customer.name) nameSet.add(customer.name);
  if (customer.leads[0]?.companyName) nameSet.add(customer.leads[0].companyName);

  if (nameSet.size === 0) return [customerId];

  const names = Array.from(nameSet);

  // 직접 매칭: company 또는 name이 후보 중 하나와 일치
  const directMatch = await prisma.customer.findMany({
    where: {
      userId: customer.userId,
      deletedAt: null,
      OR: [
        { company: { in: names } },
        { name: { in: names } },
      ],
    },
    select: { id: true },
  });

  // 간접 매칭: Lead.companyName이 후보 중 하나와 일치하는 Customer
  const leadMatch = await prisma.lead.findMany({
    where: {
      deletedAt: null,
      companyName: { in: names },
      customer: { userId: customer.userId, deletedAt: null },
    },
    select: { customerId: true },
  });

  const idSet = new Set<string>([customerId]);
  for (const c of directMatch) idSet.add(c.id);
  for (const l of leadMatch) {
    if (l.customerId) idSet.add(l.customerId);
  }

  return Array.from(idSet);
}

export const CustomerCrmService = {
  // 고객사 견적서 조회 (Quotation + ClinicalQuotation 통합)
  // 동일 회사명의 모든 Customer 레코드에서 견적서를 조회
  async getQuotationsByCustomerId(customerId: string) {
    const relatedIds = await findRelatedCustomerIds(customerId);
    const [quotations, clinicalQuotations] = await Promise.all([
      prisma.quotation.findMany({
        where: { customerId: { in: relatedIds }, deletedAt: null },
        select: {
          id: true,
          quotationNumber: true,
          quotationType: true,
          projectName: true,
          status: true,
          totalAmount: true,
          customerName: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.clinicalQuotation.findMany({
        where: { customerId: { in: relatedIds } },
        select: {
          id: true,
          quotationNumber: true,
          customerName: true,
          status: true,
          totalAmount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const unified = [
      ...quotations.map(q => ({
        id: q.id,
        quotationNumber: q.quotationNumber,
        quotationType: q.quotationType,
        projectName: q.projectName,
        status: q.status,
        totalAmount: Number(q.totalAmount),
        customerName: q.customerName,
        createdAt: q.createdAt.toISOString(),
      })),
      ...clinicalQuotations.map(q => ({
        id: q.id,
        quotationNumber: q.quotationNumber,
        quotationType: 'CLINICAL_PATHOLOGY' as const,
        projectName: q.customerName || '',
        status: q.status,
        totalAmount: Number(q.totalAmount),
        customerName: '',
        createdAt: q.createdAt.toISOString(),
      })),
    ];

    return unified.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // 고객사 계약 조회
  // 동일 회사명의 모든 Customer 레코드에서 계약을 조회
  async getContractsByCustomerId(customerId: string) {
    const relatedIds = await findRelatedCustomerIds(customerId);
    const contracts = await prisma.contract.findMany({
      where: { customerId: { in: relatedIds }, deletedAt: null },
      select: {
        id: true,
        contractNumber: true,
        contractType: true,
        title: true,
        status: true,
        totalAmount: true,
        signedDate: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return contracts.map(c => ({
      id: c.id,
      contractNumber: c.contractNumber,
      contractType: c.contractType,
      title: c.title,
      status: c.status,
      totalAmount: Number(c.totalAmount),
      signedDate: c.signedDate?.toISOString() || null,
      startDate: c.startDate?.toISOString() || null,
      endDate: c.endDate?.toISOString() || null,
      createdAt: c.createdAt.toISOString(),
    }));
  },

  // 고객사 리드 활동 조회
  async getLeadActivitiesByCustomerId(customerId: string) {
    const relatedIds = await findRelatedCustomerIds(customerId);
    const leads = await prisma.lead.findMany({
      where: { customerId: { in: relatedIds }, deletedAt: null },
      include: {
        stage: true,
        activities: {
          include: { user: { select: { name: true } } },
          orderBy: { contactedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (leads.length === 0) {
      return { lead: null, activities: [] };
    }

    const lead = leads[0];
    return {
      lead: {
        id: lead.id,
        leadNumber: lead.leadNumber,
        source: lead.source,
        status: lead.status,
        stageName: lead.stage.name,
        expectedAmount: lead.expectedAmount ? Number(lead.expectedAmount) : null,
        convertedAt: lead.convertedAt?.toISOString() || null,
        companyName: lead.companyName,
        contactName: lead.contactName,
      },
      activities: lead.activities.map(a => ({
        id: a.id,
        type: a.type,
        subject: a.subject,
        content: a.content,
        contactedAt: a.contactedAt.toISOString(),
        nextAction: a.nextAction,
        nextDate: a.nextDate?.toISOString() || null,
        userName: a.user.name,
      })),
    };
  },

  // 고객사 상담기록 조회
  async getConsultationsByCustomerId(customerId: string) {
    const relatedIds = await findRelatedCustomerIds(customerId);
    const records = await prisma.consultationRecord.findMany({
      where: { customerId: { in: relatedIds }, deletedAt: null },
      include: {
        contract: { select: { contractNumber: true } },
      },
      orderBy: { consultDate: 'desc' },
    });

    return records.map(r => ({
      id: r.id,
      recordNumber: r.recordNumber,
      consultDate: r.consultDate.toISOString(),
      substanceName: r.substanceName,
      clientRequests: r.clientRequests,
      internalNotes: r.internalNotes,
      contractNumber: r.contract?.contractNumber || null,
    }));
  },

  // 통합 활동 타임라인 (최근 10건)
  // 동일 회사명의 모든 Customer 레코드에서 활동을 조회
  async getActivityTimeline(customerId: string): Promise<TimelineItem[]> {
    const relatedIds = await findRelatedCustomerIds(customerId);
    const [quotations, contracts, meetings, events, consultations, leadData] = await Promise.all([
      prisma.quotation.findMany({
        where: { customerId: { in: relatedIds }, deletedAt: null },
        select: { id: true, quotationNumber: true, projectName: true, status: true, quotationType: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.contract.findMany({
        where: { customerId: { in: relatedIds }, deletedAt: null },
        select: { id: true, contractNumber: true, title: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.meetingRecord.findMany({
        where: { customerId: { in: relatedIds } },
        select: { id: true, title: true, type: true, date: true },
        orderBy: { date: 'desc' },
        take: 10,
      }),
      prisma.calendarEvent.findMany({
        where: { customerId: { in: relatedIds } },
        select: { id: true, title: true, type: true, startDate: true },
        orderBy: { startDate: 'desc' },
        take: 10,
      }),
      prisma.consultationRecord.findMany({
        where: { customerId: { in: relatedIds }, deletedAt: null },
        select: { id: true, recordNumber: true, substanceName: true, consultDate: true },
        orderBy: { consultDate: 'desc' },
        take: 10,
      }),
      prisma.lead.findMany({
        where: { customerId: { in: relatedIds }, deletedAt: null },
        select: {
          activities: {
            select: { id: true, subject: true, type: true, contactedAt: true },
            orderBy: { contactedAt: 'desc' },
            take: 10,
          },
        },
      }),
    ]);

    const timeline: TimelineItem[] = [];

    for (const q of quotations) {
      timeline.push({
        id: q.id,
        type: 'quotation',
        title: `견적서 ${q.quotationNumber}`,
        description: q.projectName || '',
        date: q.createdAt.toISOString(),
        metadata: { status: q.status, quotationType: q.quotationType },
      });
    }

    for (const c of contracts) {
      timeline.push({
        id: c.id,
        type: 'contract',
        title: `계약 ${c.contractNumber}`,
        description: c.title,
        date: c.createdAt.toISOString(),
        metadata: { status: c.status },
      });
    }

    for (const m of meetings) {
      timeline.push({
        id: m.id,
        type: 'meeting',
        title: m.title,
        description: m.type,
        date: m.date.toISOString(),
      });
    }

    for (const e of events) {
      if (e.type !== 'meeting') {
        timeline.push({
          id: e.id,
          type: 'calendar_event',
          title: e.title,
          description: e.type,
          date: e.startDate.toISOString(),
        });
      }
    }

    for (const c of consultations) {
      timeline.push({
        id: c.id,
        type: 'consultation',
        title: `상담 ${c.recordNumber}`,
        description: c.substanceName || '',
        date: c.consultDate.toISOString(),
      });
    }

    for (const lead of leadData) {
      for (const a of lead.activities) {
        timeline.push({
          id: a.id,
          type: 'lead_activity',
          title: a.subject,
          description: a.type,
          date: a.contactedAt.toISOString(),
        });
      }
    }

    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return timeline.slice(0, 10);
  },

  // 고객사에 연결된 리드 존재 여부 확인
  async hasLinkedLead(customerId: string): Promise<boolean> {
    const relatedIds = await findRelatedCustomerIds(customerId);
    const count = await prisma.lead.count({
      where: { customerId: { in: relatedIds }, deletedAt: null },
    });
    return count > 0;
  },
};
