// src/services/customerDataService.ts
// 고객 관련 데이터 서비스 (Requester, MeetingRecord, TestReception, InvoiceSchedule, CalendarEvent, ProgressStage)

import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

// ==================== Requester Service ====================

export const RequesterService = {
  async getAll(customerId: string) {
    return prisma.requester.findMany({
      where: { customerId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  },

  async getById(id: string) {
    return prisma.requester.findUnique({ where: { id } });
  },

  async getActive(customerId: string) {
    return prisma.requester.findMany({
      where: { customerId, isActive: true },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  },

  async getPrimary(customerId: string) {
    return prisma.requester.findFirst({
      where: { customerId, isPrimary: true, isActive: true },
    });
  },

  async create(data: Prisma.RequesterCreateInput) {
    return prisma.requester.create({ data });
  },

  async update(id: string, data: Prisma.RequesterUpdateInput) {
    return prisma.requester.update({ where: { id }, data });
  },

  async delete(id: string, hasRelatedData: boolean = false) {
    if (hasRelatedData) {
      // 연관 데이터가 있으면 비활성화
      await prisma.requester.update({
        where: { id },
        data: { isActive: false },
      });
      return { deleted: false, deactivated: true };
    }
    await prisma.requester.delete({ where: { id } });
    return { deleted: true, deactivated: false };
  },

  async hasRelatedData(id: string) {
    const [meetingCount, testReceptionCount] = await Promise.all([
      prisma.meetingRecord.count({ where: { requesterId: id } }),
      prisma.testReception.count({ where: { requesterId: id } }),
    ]);
    return meetingCount > 0 || testReceptionCount > 0;
  },
};

// ==================== MeetingRecord Service ====================

export const MeetingRecordService = {
  async getByCustomerId(customerId: string) {
    return prisma.meetingRecord.findMany({
      where: { customerId },
      include: { requester: true },
      orderBy: { date: 'desc' },
    });
  },

  async getById(id: string) {
    return prisma.meetingRecord.findUnique({
      where: { id },
      include: { requester: true },
    });
  },

  async getByRequesterId(requesterId: string) {
    return prisma.meetingRecord.findMany({
      where: { requesterId },
      orderBy: { date: 'desc' },
    });
  },

  async getRequests(customerId: string) {
    return prisma.meetingRecord.findMany({
      where: { customerId, isRequest: true },
      include: { requester: true },
      orderBy: { date: 'desc' },
    });
  },

  async getPendingRequests(customerId: string) {
    return prisma.meetingRecord.findMany({
      where: {
        customerId,
        isRequest: true,
        requestStatus: { in: ['pending', 'in_progress'] },
      },
      include: { requester: true },
      orderBy: { date: 'desc' },
    });
  },

  async create(data: Prisma.MeetingRecordCreateInput) {
    return prisma.meetingRecord.create({
      data,
      include: { requester: true },
    });
  },

  async update(id: string, data: Prisma.MeetingRecordUpdateInput) {
    return prisma.meetingRecord.update({
      where: { id },
      data,
      include: { requester: true },
    });
  },

  async updateRequestStatus(
    id: string,
    status: string,
    response?: string
  ) {
    const updateData: Prisma.MeetingRecordUpdateInput = { requestStatus: status };
    if (status === 'completed') {
      updateData.requestCompletedAt = new Date();
      if (response) updateData.requestResponse = response;
    }
    return prisma.meetingRecord.update({
      where: { id },
      data: updateData,
      include: { requester: true },
    });
  },

  async delete(id: string) {
    // 연결된 캘린더 이벤트도 삭제
    await prisma.calendarEvent.deleteMany({ where: { meetingRecordId: id } });
    return prisma.meetingRecord.delete({ where: { id } });
  },
};

// ==================== TestReception Service ====================

export const TestReceptionService = {
  async getByCustomerId(customerId: string) {
    return prisma.testReception.findMany({
      where: { customerId },
      include: { requester: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getById(id: string) {
    return prisma.testReception.findUnique({
      where: { id },
      include: { requester: true, invoiceSchedules: true },
    });
  },

  async getByStatus(status: string) {
    return prisma.testReception.findMany({
      where: { status },
      include: { requester: true, customer: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getByTestNumber(testNumber: string) {
    return prisma.testReception.findUnique({
      where: { testNumber },
      include: { requester: true },
    });
  },

  async create(data: Prisma.TestReceptionCreateInput) {
    return prisma.testReception.create({
      data,
      include: { requester: true },
    });
  },

  async update(id: string, data: Prisma.TestReceptionUpdateInput) {
    return prisma.testReception.update({
      where: { id },
      data,
      include: { requester: true },
    });
  },

  async updateStatus(id: string, status: string) {
    const updateData: Prisma.TestReceptionUpdateInput = { status };
    if (status === 'completed') {
      updateData.actualCompletionDate = new Date();
    }
    return prisma.testReception.update({
      where: { id },
      data: updateData,
      include: { requester: true },
    });
  },

  async delete(id: string) {
    // 연결된 데이터도 삭제
    await prisma.invoiceSchedule.deleteMany({ where: { testReceptionId: id } });
    await prisma.calendarEvent.deleteMany({ where: { testReceptionId: id } });
    return prisma.testReception.delete({ where: { id } });
  },

  // 시험번호 발행 (Requirements 3.3)
  async issueTestNumber(
    id: string,
    testNumber: string,
    issuedBy: string,
    testTitle?: string,
    testDirector?: string
  ) {
    // 중복 시험번호 확인
    const existingReception = await prisma.testReception.findUnique({
      where: { testNumber },
    });
    
    if (existingReception && existingReception.id !== id) {
      throw new Error('DUPLICATE_TEST_NUMBER');
    }
    
    return prisma.testReception.update({
      where: { id },
      data: {
        testNumber,
        testTitle,
        testDirector,
        testNumberIssuedAt: new Date(),
        testNumberIssuedBy: issuedBy,
      },
      include: { requester: true, customer: true },
    });
  },

  // 시험번호 중복 확인
  async checkTestNumberExists(testNumber: string, excludeId?: string) {
    const reception = await prisma.testReception.findUnique({
      where: { testNumber },
    });
    
    if (!reception) return false;
    if (excludeId && reception.id === excludeId) return false;
    return true;
  },

  // 시험 접수 + 상담기록 조회 (Requirements 3.4, 3.5)
  async getByIdWithConsultation(id: string) {
    const testReception = await prisma.testReception.findUnique({
      where: { id },
      include: {
        requester: true,
        customer: true,
        invoiceSchedules: true,
      },
    });

    if (!testReception) {
      return null;
    }

    // 해당 고객의 상담기록 조회 (customerId로 연결)
    const consultationRecords = await prisma.consultationRecord.findMany({
      where: {
        customerId: testReception.customerId,
        deletedAt: null,
      },
      orderBy: { consultDate: 'desc' },
    });

    return {
      ...testReception,
      consultationRecords,
    };
  },
};


// ==================== InvoiceSchedule Service ====================

export const InvoiceScheduleService = {
  async getByCustomerId(customerId: string) {
    return prisma.invoiceSchedule.findMany({
      where: { customerId },
      include: { testReception: true },
      orderBy: { scheduledDate: 'asc' },
    });
  },

  async getByTestReceptionId(testReceptionId: string) {
    return prisma.invoiceSchedule.findMany({
      where: { testReceptionId },
      orderBy: { installmentNumber: 'asc' },
    });
  },

  async getById(id: string) {
    return prisma.invoiceSchedule.findUnique({
      where: { id },
      include: { testReception: true, customer: true },
    });
  },

  async getUpcoming(daysAhead: number = 7) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    return prisma.invoiceSchedule.findMany({
      where: {
        status: 'pending',
        scheduledDate: { gte: now, lte: futureDate },
      },
      include: { testReception: true, customer: true },
      orderBy: { scheduledDate: 'asc' },
    });
  },

  async getOverdue() {
    return prisma.invoiceSchedule.findMany({
      where: {
        status: 'pending',
        scheduledDate: { lt: new Date() },
      },
      include: { testReception: true, customer: true },
      orderBy: { scheduledDate: 'asc' },
    });
  },

  async getByStatus(status: string) {
    return prisma.invoiceSchedule.findMany({
      where: { status },
      include: { testReception: true, customer: true },
      orderBy: { scheduledDate: 'asc' },
    });
  },

  async create(data: Prisma.InvoiceScheduleCreateInput) {
    return prisma.invoiceSchedule.create({
      data,
      include: { testReception: true },
    });
  },

  async update(id: string, data: Prisma.InvoiceScheduleUpdateInput) {
    return prisma.invoiceSchedule.update({
      where: { id },
      data,
      include: { testReception: true },
    });
  },

  async markAsIssued(id: string, invoiceNumber: string) {
    return prisma.invoiceSchedule.update({
      where: { id },
      data: {
        status: 'issued',
        issuedDate: new Date(),
        invoiceNumber,
      },
      include: { testReception: true },
    });
  },

  async createInstallments(
    testReceptionId: string,
    customerId: string,
    totalAmount: number,
    installments: number,
    startDate: Date,
    intervalDays: number = 30
  ) {
    const amountPerInstallment = Math.floor(totalAmount / installments);
    const remainder = totalAmount - amountPerInstallment * installments;

    const schedules = [];
    for (let i = 0; i < installments; i++) {
      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(scheduledDate.getDate() + i * intervalDays);

      const amount = i === installments - 1
        ? amountPerInstallment + remainder
        : amountPerInstallment;

      const schedule = await prisma.invoiceSchedule.create({
        data: {
          testReception: { connect: { id: testReceptionId } },
          customer: { connect: { id: customerId } },
          amount,
          scheduledDate,
          paymentType: 'partial',
          installmentNumber: i + 1,
          totalInstallments: installments,
          status: 'pending',
        },
      });
      schedules.push(schedule);
    }
    return schedules;
  },

  async delete(id: string) {
    await prisma.calendarEvent.deleteMany({ where: { invoiceScheduleId: id } });
    return prisma.invoiceSchedule.delete({ where: { id } });
  },
};

// ==================== CalendarEvent Service ====================

export const CalendarEventService = {
  async getAll() {
    return prisma.calendarEvent.findMany({
      include: { customer: true, meetingRecord: true, invoiceSchedule: true },
      orderBy: { startDate: 'asc' },
    });
  },

  async getByCustomerId(customerId: string) {
    return prisma.calendarEvent.findMany({
      where: { customerId },
      orderBy: { startDate: 'asc' },
    });
  },

  async getByDateRange(startDate: Date, endDate: Date) {
    return prisma.calendarEvent.findMany({
      where: {
        OR: [
          { startDate: { gte: startDate, lte: endDate } },
          { endDate: { gte: startDate, lte: endDate } },
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: endDate } },
            ],
          },
        ],
      },
      include: { customer: true, meetingRecord: true, invoiceSchedule: true },
      orderBy: { startDate: 'asc' },
    });
  },

  async getById(id: string) {
    return prisma.calendarEvent.findUnique({
      where: { id },
      include: { customer: true, meetingRecord: true, invoiceSchedule: true },
    });
  },

  async getByType(type: string) {
    return prisma.calendarEvent.findMany({
      where: { type },
      include: { customer: true },
      orderBy: { startDate: 'asc' },
    });
  },

  async create(data: Prisma.CalendarEventCreateInput) {
    return prisma.calendarEvent.create({
      data,
      include: { customer: true },
    });
  },

  async createFromMeeting(meetingRecord: any) {
    const endDate = meetingRecord.duration
      ? new Date(new Date(meetingRecord.date).getTime() + meetingRecord.duration * 60 * 1000)
      : null;

    return prisma.calendarEvent.create({
      data: {
        customer: { connect: { id: meetingRecord.customerId } },
        meetingRecord: { connect: { id: meetingRecord.id } },
        type: 'meeting',
        title: meetingRecord.title,
        description: meetingRecord.content,
        startDate: meetingRecord.date,
        endDate,
        allDay: !meetingRecord.time,
        color: '#3B82F6',
      },
    });
  },

  async createFromInvoice(invoiceSchedule: any) {
    return prisma.calendarEvent.create({
      data: {
        customer: { connect: { id: invoiceSchedule.customerId } },
        invoiceSchedule: { connect: { id: invoiceSchedule.id } },
        testReception: invoiceSchedule.testReceptionId
          ? { connect: { id: invoiceSchedule.testReceptionId } }
          : undefined,
        type: 'invoice',
        title: `세금계산서 발행 예정 - ${Number(invoiceSchedule.amount).toLocaleString()}원`,
        description: invoiceSchedule.notes,
        startDate: invoiceSchedule.scheduledDate,
        allDay: true,
        color: '#EF4444',
      },
    });
  },

  async update(id: string, data: Prisma.CalendarEventUpdateInput) {
    return prisma.calendarEvent.update({
      where: { id },
      data,
      include: { customer: true },
    });
  },

  async delete(id: string) {
    return prisma.calendarEvent.delete({ where: { id } });
  },

  async deleteByMeetingId(meetingRecordId: string) {
    return prisma.calendarEvent.deleteMany({ where: { meetingRecordId } });
  },

  async deleteByInvoiceId(invoiceScheduleId: string) {
    return prisma.calendarEvent.deleteMany({ where: { invoiceScheduleId } });
  },
};

// ==================== CustomerProgressStage Service ====================

export const ProgressStageService = {
  async getByCustomerId(customerId: string) {
    return prisma.customerProgressStage.findUnique({
      where: { customerId },
    });
  },

  async getById(id: string) {
    return prisma.customerProgressStage.findUnique({ where: { id } });
  },

  async create(customerId: string, quotationId?: string, contractId?: string) {
    const defaultChecklist = createDefaultChecklist();
    const now = new Date();

    return prisma.customerProgressStage.create({
      data: {
        customer: { connect: { id: customerId } },
        quotationId,
        contractId,
        currentStage: 'inquiry',
        checklist: defaultChecklist,
        stageHistory: [{ stage: 'inquiry', entered_at: now.toISOString() }],
      },
    });
  },

  async update(id: string, data: Prisma.CustomerProgressStageUpdateInput) {
    return prisma.customerProgressStage.update({ where: { id }, data });
  },

  async updateStage(id: string, newStage: string, notes?: string) {
    const progress = await prisma.customerProgressStage.findUnique({ where: { id } });
    if (!progress) return null;

    const now = new Date().toISOString();
    const history = progress.stageHistory as any[];

    // 현재 단계 완료 처리
    const updatedHistory = history.map((h: any) => {
      if (h.stage === progress.currentStage && !h.completed_at) {
        return { ...h, completed_at: now, notes };
      }
      return h;
    });

    // 새 단계 추가
    updatedHistory.push({ stage: newStage, entered_at: now });

    return prisma.customerProgressStage.update({
      where: { id },
      data: {
        currentStage: newStage,
        stageHistory: updatedHistory,
      },
    });
  },

  async updateChecklist(id: string, checklistItemId: string, isCompleted: boolean, completedBy?: string) {
    const progress = await prisma.customerProgressStage.findUnique({ where: { id } });
    if (!progress) return null;

    const now = new Date().toISOString();
    const checklist = progress.checklist as any[];

    const updatedChecklist = checklist.map((item: any) => {
      if (item.id === checklistItemId) {
        return {
          ...item,
          is_completed: isCompleted,
          completed_at: isCompleted ? now : undefined,
          completed_by: isCompleted ? completedBy : undefined,
        };
      }
      return item;
    });

    return prisma.customerProgressStage.update({
      where: { id },
      data: { checklist: updatedChecklist },
    });
  },

  async delete(id: string) {
    return prisma.customerProgressStage.delete({ where: { id } });
  },
};

// 기본 체크리스트 생성 헬퍼
function createDefaultChecklist() {
  const stages = [
    { stage: 'inquiry', items: ['고객 문의 내용 확인', '담당자 정보 확인', '시험 가능 여부 검토'] },
    { stage: 'quotation_sent', items: ['견적서 작성', '견적서 내부 검토', '견적서 발송'] },
    { stage: 'test_request', items: ['시험 의뢰서 수령', '의뢰 내용 확인', '시험 일정 협의'] },
    { stage: 'contract_signed', items: ['계약서 작성', '계약 조건 협의', '계약서 서명', '계약서 보관'] },
    { stage: 'test_reception', items: ['시험번호 부여', '시험책임자 배정', '시험물질 접수', '시험 접수 등록'] },
    { stage: 'test_management', items: ['시험 진행 상황 모니터링', '중간 보고', '시험 완료 확인', '최종 보고서 작성', '보고서 발송'] },
    { stage: 'fund_management', items: ['세금계산서 발행', '입금 확인', '수금 완료 처리'] },
  ];

  const checklist: any[] = [];
  let itemIndex = 0;

  for (const stageData of stages) {
    for (const title of stageData.items) {
      checklist.push({
        id: `${stageData.stage}-${++itemIndex}`,
        stage: stageData.stage,
        title,
        is_completed: false,
      });
    }
  }

  return checklist;
}
