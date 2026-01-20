// src/routes/customerData.ts
// 고객 관련 데이터 API (Requester, MeetingRecord, TestReception, InvoiceSchedule, CalendarEvent, ProgressStage)

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import {
  RequesterService,
  MeetingRecordService,
  TestReceptionService,
  InvoiceScheduleService,
  CalendarEventService,
  ProgressStageService,
} from '../services/customerDataService';

const router = Router();
router.use(authenticate);

// ==================== Requester Routes ====================

// 고객사별 의뢰자 목록
router.get('/customers/:customerId/requesters', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId } = req.params;
    const { activeOnly } = req.query;
    
    const requesters = activeOnly === 'true'
      ? await RequesterService.getActive(customerId)
      : await RequesterService.getAll(customerId);
    
    res.json({ success: true, data: { requesters } });
  } catch (error) {
    next(error);
  }
});

// 의뢰자 상세
router.get('/requesters/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requester = await RequesterService.getById(req.params.id);
    if (!requester) {
      return res.status(404).json({ success: false, message: '의뢰자를 찾을 수 없습니다.' });
    }
    res.json({ success: true, data: { requester } });
  } catch (error) {
    next(error);
  }
});

// 의뢰자 생성
router.post('/customers/:customerId/requesters', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId } = req.params;
    const requester = await RequesterService.create({
      customer: { connect: { id: customerId } },
      ...req.body,
    });
    res.status(201).json({ success: true, data: { requester } });
  } catch (error) {
    next(error);
  }
});

// 의뢰자 수정
router.put('/requesters/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requester = await RequesterService.update(req.params.id, req.body);
    res.json({ success: true, data: { requester } });
  } catch (error) {
    next(error);
  }
});

// 의뢰자 삭제
router.delete('/requesters/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hasRelated = await RequesterService.hasRelatedData(req.params.id);
    const result = await RequesterService.delete(req.params.id, hasRelated);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// ==================== MeetingRecord Routes ====================

// 고객사별 미팅 기록 목록
router.get('/customers/:customerId/meeting-records', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId } = req.params;
    const { requestsOnly, pendingOnly } = req.query;
    
    let records;
    if (pendingOnly === 'true') {
      records = await MeetingRecordService.getPendingRequests(customerId);
    } else if (requestsOnly === 'true') {
      records = await MeetingRecordService.getRequests(customerId);
    } else {
      records = await MeetingRecordService.getByCustomerId(customerId);
    }
    
    res.json({ success: true, data: { meetingRecords: records } });
  } catch (error) {
    next(error);
  }
});

// 미팅 기록 상세
router.get('/meeting-records/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await MeetingRecordService.getById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: '미팅 기록을 찾을 수 없습니다.' });
    }
    res.json({ success: true, data: { meetingRecord: record } });
  } catch (error) {
    next(error);
  }
});

// 미팅 기록 생성
router.post('/customers/:customerId/meeting-records', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId } = req.params;
    const { requesterId, ...data } = req.body;
    
    const record = await MeetingRecordService.create({
      customer: { connect: { id: customerId } },
      requester: requesterId ? { connect: { id: requesterId } } : undefined,
      ...data,
      date: new Date(data.date),
      requestStatus: data.isRequest && !data.requestStatus ? 'pending' : data.requestStatus,
    });
    
    // 캘린더 이벤트 자동 생성
    if (data.type === 'meeting') {
      await CalendarEventService.createFromMeeting(record);
    }
    
    res.status(201).json({ success: true, data: { meetingRecord: record } });
  } catch (error) {
    next(error);
  }
});

// 미팅 기록 수정
router.put('/meeting-records/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requesterId, ...data } = req.body;
    const updateData: any = { ...data };
    
    if (data.date) updateData.date = new Date(data.date);
    if (requesterId !== undefined) {
      updateData.requester = requesterId ? { connect: { id: requesterId } } : { disconnect: true };
    }
    
    const record = await MeetingRecordService.update(req.params.id, updateData);
    res.json({ success: true, data: { meetingRecord: record } });
  } catch (error) {
    next(error);
  }
});

// 요청사항 상태 업데이트
router.patch('/meeting-records/:id/request-status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, response } = req.body;
    const record = await MeetingRecordService.updateRequestStatus(req.params.id, status, response);
    res.json({ success: true, data: { meetingRecord: record } });
  } catch (error) {
    next(error);
  }
});

// 미팅 기록 삭제
router.delete('/meeting-records/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await MeetingRecordService.delete(req.params.id);
    res.json({ success: true, message: '미팅 기록이 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
});


// ==================== TestReception Routes ====================

// 고객사별 시험 접수 목록
router.get('/customers/:customerId/test-receptions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const receptions = await TestReceptionService.getByCustomerId(req.params.customerId);
    res.json({ success: true, data: { testReceptions: receptions } });
  } catch (error) {
    next(error);
  }
});

// 상태별 시험 접수 목록
router.get('/test-receptions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const receptions = status
      ? await TestReceptionService.getByStatus(status as string)
      : await TestReceptionService.getByStatus('received');
    res.json({ success: true, data: { testReceptions: receptions } });
  } catch (error) {
    next(error);
  }
});

// 시험 접수 상세
router.get('/test-receptions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reception = await TestReceptionService.getById(req.params.id);
    if (!reception) {
      return res.status(404).json({ success: false, message: '시험 접수를 찾을 수 없습니다.' });
    }
    res.json({ success: true, data: { testReception: reception } });
  } catch (error) {
    next(error);
  }
});

// 시험번호로 조회
router.get('/test-receptions/by-number/:testNumber', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reception = await TestReceptionService.getByTestNumber(req.params.testNumber);
    if (!reception) {
      return res.status(404).json({ success: false, message: '시험 접수를 찾을 수 없습니다.' });
    }
    res.json({ success: true, data: { testReception: reception } });
  } catch (error) {
    next(error);
  }
});

// 시험 접수 생성
router.post('/customers/:customerId/test-receptions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId } = req.params;
    const { requesterId, ...data } = req.body;
    
    const reception = await TestReceptionService.create({
      customer: { connect: { id: customerId } },
      requester: requesterId ? { connect: { id: requesterId } } : undefined,
      ...data,
      receptionDate: data.receptionDate ? new Date(data.receptionDate) : new Date(),
      expectedCompletionDate: data.expectedCompletionDate ? new Date(data.expectedCompletionDate) : undefined,
    });
    
    res.status(201).json({ success: true, data: { testReception: reception } });
  } catch (error) {
    next(error);
  }
});

// 시험 접수 수정
router.put('/test-receptions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requesterId, ...data } = req.body;
    const updateData: any = { ...data };
    
    if (data.receptionDate) updateData.receptionDate = new Date(data.receptionDate);
    if (data.expectedCompletionDate) updateData.expectedCompletionDate = new Date(data.expectedCompletionDate);
    if (data.actualCompletionDate) updateData.actualCompletionDate = new Date(data.actualCompletionDate);
    if (requesterId !== undefined) {
      updateData.requester = requesterId ? { connect: { id: requesterId } } : { disconnect: true };
    }
    
    const reception = await TestReceptionService.update(req.params.id, updateData);
    res.json({ success: true, data: { testReception: reception } });
  } catch (error) {
    next(error);
  }
});

// 시험 접수 상태 업데이트
router.patch('/test-receptions/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const reception = await TestReceptionService.updateStatus(req.params.id, status);
    res.json({ success: true, data: { testReception: reception } });
  } catch (error) {
    next(error);
  }
});

// 시험 접수 삭제
router.delete('/test-receptions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await TestReceptionService.delete(req.params.id);
    res.json({ success: true, message: '시험 접수가 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
});

// ==================== InvoiceSchedule Routes ====================

// 고객사별 세금계산서 일정 목록
router.get('/customers/:customerId/invoice-schedules', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schedules = await InvoiceScheduleService.getByCustomerId(req.params.customerId);
    res.json({ success: true, data: { invoiceSchedules: schedules } });
  } catch (error) {
    next(error);
  }
});

// 시험 접수별 세금계산서 일정
router.get('/test-receptions/:testReceptionId/invoice-schedules', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schedules = await InvoiceScheduleService.getByTestReceptionId(req.params.testReceptionId);
    res.json({ success: true, data: { invoiceSchedules: schedules } });
  } catch (error) {
    next(error);
  }
});

// 임박한 세금계산서 일정
router.get('/invoice-schedules/upcoming', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days = '7' } = req.query;
    const schedules = await InvoiceScheduleService.getUpcoming(parseInt(days as string));
    res.json({ success: true, data: { invoiceSchedules: schedules } });
  } catch (error) {
    next(error);
  }
});

// 연체된 세금계산서 일정
router.get('/invoice-schedules/overdue', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schedules = await InvoiceScheduleService.getOverdue();
    res.json({ success: true, data: { invoiceSchedules: schedules } });
  } catch (error) {
    next(error);
  }
});

// 세금계산서 일정 상세
router.get('/invoice-schedules/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schedule = await InvoiceScheduleService.getById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: '세금계산서 일정을 찾을 수 없습니다.' });
    }
    res.json({ success: true, data: { invoiceSchedule: schedule } });
  } catch (error) {
    next(error);
  }
});

// 세금계산서 일정 생성
router.post('/customers/:customerId/invoice-schedules', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId } = req.params;
    const { testReceptionId, ...data } = req.body;
    
    const schedule = await InvoiceScheduleService.create({
      customer: { connect: { id: customerId } },
      testReception: testReceptionId ? { connect: { id: testReceptionId } } : undefined,
      ...data,
      scheduledDate: new Date(data.scheduledDate),
    });
    
    // 캘린더 이벤트 자동 생성
    await CalendarEventService.createFromInvoice(schedule);
    
    res.status(201).json({ success: true, data: { invoiceSchedule: schedule } });
  } catch (error) {
    next(error);
  }
});

// 분할 지급 일정 생성
router.post('/customers/:customerId/invoice-schedules/installments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId } = req.params;
    const { testReceptionId, totalAmount, installments, startDate, intervalDays } = req.body;
    
    const schedules = await InvoiceScheduleService.createInstallments(
      testReceptionId,
      customerId,
      totalAmount,
      installments,
      new Date(startDate),
      intervalDays
    );
    
    // 각 일정에 대해 캘린더 이벤트 생성
    for (const schedule of schedules) {
      await CalendarEventService.createFromInvoice(schedule);
    }
    
    res.status(201).json({ success: true, data: { invoiceSchedules: schedules } });
  } catch (error) {
    next(error);
  }
});

// 세금계산서 일정 수정
router.put('/invoice-schedules/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { testReceptionId, ...data } = req.body;
    const updateData: any = { ...data };
    
    if (data.scheduledDate) updateData.scheduledDate = new Date(data.scheduledDate);
    if (data.issuedDate) updateData.issuedDate = new Date(data.issuedDate);
    
    const schedule = await InvoiceScheduleService.update(req.params.id, updateData);
    res.json({ success: true, data: { invoiceSchedule: schedule } });
  } catch (error) {
    next(error);
  }
});

// 세금계산서 발행 완료 처리
router.patch('/invoice-schedules/:id/issue', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invoiceNumber } = req.body;
    const schedule = await InvoiceScheduleService.markAsIssued(req.params.id, invoiceNumber);
    res.json({ success: true, data: { invoiceSchedule: schedule } });
  } catch (error) {
    next(error);
  }
});

// 세금계산서 일정 삭제
router.delete('/invoice-schedules/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await InvoiceScheduleService.delete(req.params.id);
    res.json({ success: true, message: '세금계산서 일정이 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
});

// ==================== CalendarEvent Routes ====================

// 전체 캘린더 이벤트
router.get('/calendar-events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    let events;
    if (startDate && endDate) {
      events = await CalendarEventService.getByDateRange(
        new Date(startDate as string),
        new Date(endDate as string)
      );
    } else if (type) {
      events = await CalendarEventService.getByType(type as string);
    } else {
      events = await CalendarEventService.getAll();
    }
    
    res.json({ success: true, data: { calendarEvents: events } });
  } catch (error) {
    next(error);
  }
});

// 고객사별 캘린더 이벤트
router.get('/customers/:customerId/calendar-events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await CalendarEventService.getByCustomerId(req.params.customerId);
    res.json({ success: true, data: { calendarEvents: events } });
  } catch (error) {
    next(error);
  }
});

// 캘린더 이벤트 상세
router.get('/calendar-events/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await CalendarEventService.getById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: '캘린더 이벤트를 찾을 수 없습니다.' });
    }
    res.json({ success: true, data: { calendarEvent: event } });
  } catch (error) {
    next(error);
  }
});

// 캘린더 이벤트 생성
router.post('/calendar-events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId, testReceptionId, invoiceScheduleId, meetingRecordId, ...data } = req.body;
    
    const event = await CalendarEventService.create({
      customer: customerId ? { connect: { id: customerId } } : undefined,
      testReception: testReceptionId ? { connect: { id: testReceptionId } } : undefined,
      invoiceSchedule: invoiceScheduleId ? { connect: { id: invoiceScheduleId } } : undefined,
      meetingRecord: meetingRecordId ? { connect: { id: meetingRecordId } } : undefined,
      ...data,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    });
    
    res.status(201).json({ success: true, data: { calendarEvent: event } });
  } catch (error) {
    next(error);
  }
});

// 캘린더 이벤트 수정
router.put('/calendar-events/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = { ...req.body };
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);
    
    const event = await CalendarEventService.update(req.params.id, data);
    res.json({ success: true, data: { calendarEvent: event } });
  } catch (error) {
    next(error);
  }
});

// 캘린더 이벤트 삭제
router.delete('/calendar-events/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await CalendarEventService.delete(req.params.id);
    res.json({ success: true, message: '캘린더 이벤트가 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
});

// ==================== ProgressStage Routes ====================

// 고객사 진행 단계 조회
router.get('/customers/:customerId/progress-stage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let progress = await ProgressStageService.getByCustomerId(req.params.customerId);
    
    // 없으면 자동 생성
    if (!progress) {
      progress = await ProgressStageService.create(req.params.customerId);
    }
    
    res.json({ success: true, data: { progressStage: progress } });
  } catch (error) {
    next(error);
  }
});

// 진행 단계 상세
router.get('/progress-stages/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const progress = await ProgressStageService.getById(req.params.id);
    if (!progress) {
      return res.status(404).json({ success: false, message: '진행 단계를 찾을 수 없습니다.' });
    }
    res.json({ success: true, data: { progressStage: progress } });
  } catch (error) {
    next(error);
  }
});

// 진행 단계 생성
router.post('/customers/:customerId/progress-stage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { quotationId, contractId } = req.body;
    const progress = await ProgressStageService.create(req.params.customerId, quotationId, contractId);
    res.status(201).json({ success: true, data: { progressStage: progress } });
  } catch (error) {
    next(error);
  }
});

// 단계 전환
router.patch('/progress-stages/:id/stage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { newStage, notes } = req.body;
    const progress = await ProgressStageService.updateStage(req.params.id, newStage, notes);
    if (!progress) {
      return res.status(404).json({ success: false, message: '진행 단계를 찾을 수 없습니다.' });
    }
    res.json({ success: true, data: { progressStage: progress } });
  } catch (error) {
    next(error);
  }
});

// 체크리스트 항목 업데이트
router.patch('/progress-stages/:id/checklist', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { checklistItemId, isCompleted, completedBy } = req.body;
    const progress = await ProgressStageService.updateChecklist(
      req.params.id,
      checklistItemId,
      isCompleted,
      completedBy
    );
    if (!progress) {
      return res.status(404).json({ success: false, message: '진행 단계를 찾을 수 없습니다.' });
    }
    res.json({ success: true, data: { progressStage: progress } });
  } catch (error) {
    next(error);
  }
});

// 진행 단계 삭제
router.delete('/progress-stages/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ProgressStageService.delete(req.params.id);
    res.json({ success: true, message: '진행 단계가 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
});

export default router;
