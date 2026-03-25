// src/routes/studyDocuments.ts
// 시험 문서 송부 이력 API + 타임라인

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../lib/prisma';
import { StudyDocumentType } from '@prisma/client';

const router = Router();
router.use(authenticate);

// ─── 문서 이력 조회 (시험별) ───
router.get('/studies/:studyId/documents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studyId } = req.params;
    const { documentType, year, month } = req.query;

    const where: any = { studyId };
    if (documentType) where.documentType = documentType as string;
    if (year) where.sentYear = parseInt(year as string);
    if (month) where.sentMonth = parseInt(month as string);

    const documents = await prisma.studyDocument.findMany({
      where,
      include: { creator: { select: { id: true, name: true } } },
      orderBy: [{ sentYear: 'desc' }, { sentMonth: 'desc' }, { createdAt: 'desc' }],
    });

    res.json({ success: true, data: { documents } });
  } catch (error) {
    next(error);
  }
});

// ─── 문서 기록 추가 ───
router.post('/studies/:studyId/documents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studyId } = req.params;
    const userId = (req as any).user?.id;
    const { documentType, version, sentYear, sentMonth, sentDate, comment } = req.body;

    const study = await prisma.study.findUnique({ where: { id: studyId } });
    if (!study) {
      return res.status(404).json({ success: false, message: '시험을 찾을 수 없습니다.' });
    }

    const doc = await prisma.studyDocument.create({
      data: {
        studyId,
        documentType,
        version: version || 'N_A',
        sentYear: sentYear || new Date().getFullYear(),
        sentMonth: sentMonth || new Date().getMonth() + 1,
        sentDate: sentDate ? new Date(sentDate) : null,
        comment,
        createdBy: userId,
      },
      include: { creator: { select: { id: true, name: true } } },
    });

    res.status(201).json({ success: true, data: { document: doc } });
  } catch (error) {
    next(error);
  }
});


// ─── 문서 기록 수정 ───
router.put('/documents/:documentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { documentId } = req.params;
    const { documentType, version, sentYear, sentMonth, sentDate, comment } = req.body;

    const doc = await prisma.studyDocument.update({
      where: { id: documentId },
      data: {
        ...(documentType && { documentType }),
        ...(version && { version }),
        ...(sentYear && { sentYear }),
        ...(sentMonth && { sentMonth }),
        ...(sentDate !== undefined && { sentDate: sentDate ? new Date(sentDate) : null }),
        ...(comment !== undefined && { comment }),
      },
      include: { creator: { select: { id: true, name: true } } },
    });

    res.json({ success: true, data: { document: doc } });
  } catch (error) {
    next(error);
  }
});

// ─── 문서 기록 삭제 ───
router.delete('/documents/:documentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { documentId } = req.params;
    await prisma.studyDocument.delete({ where: { id: documentId } });
    res.json({ success: true, message: '문서 기록이 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
});

// ─── 타임라인 API (계약 단위) ───
router.get('/contracts/:contractId/timeline', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contractId } = req.params;
    const { studyCode, documentType, year, month } = req.query;

    // 해당 계약의 시험 목록
    const studyWhere: any = { contractId };
    if (studyCode) studyWhere.studyNumber = studyCode as string;

    const docWhere: any = {};
    if (documentType) docWhere.documentType = documentType as StudyDocumentType;
    if (year) docWhere.sentYear = parseInt(year as string);
    if (month) docWhere.sentMonth = parseInt(month as string);

    const studies = await prisma.study.findMany({
      where: studyWhere,
      include: {
        documents: {
          where: Object.keys(docWhere).length > 0 ? docWhere : undefined,
          include: { creator: { select: { id: true, name: true } } },
          orderBy: [{ sentYear: 'asc' }, { sentMonth: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    // 월별 그룹핑
    const monthMap = new Map<string, any[]>();
    for (const study of studies) {
      for (const doc of study.documents) {
        const key = `${doc.sentYear}-${String(doc.sentMonth).padStart(2, '0')}`;
        if (!monthMap.has(key)) monthMap.set(key, []);
        monthMap.get(key)!.push({
          id: doc.id,
          studyCode: study.studyNumber,
          studyTitle: study.testName,
          studyDirector: study.studyDirector || study.testReceptionId || '-',
          documentType: doc.documentType,
          version: doc.version,
          comment: doc.comment,
          sentDate: doc.sentDate,
          createdBy: doc.creator,
          isAlert: ['SUSPENSION_RECORD', 'SUSPENSION_REPORT'].includes(doc.documentType),
        });
      }
    }

    const months = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, events]) => ({
        year: parseInt(key.split('-')[0]),
        month: parseInt(key.split('-')[1]),
        label: `${key.split('-')[0]}년 ${parseInt(key.split('-')[1])}월`,
        events,
      }));

    // 요약 통계
    const allDocs = studies.flatMap(s => s.documents);
    const byDocType: Record<string, number> = {};
    for (const d of allDocs) {
      byDocType[d.documentType] = (byDocType[d.documentType] || 0) + 1;
    }
    const byStatus: Record<string, number> = {};
    for (const s of studies) {
      byStatus[s.status] = (byStatus[s.status] || 0) + 1;
    }

    const studyList = studies.map(s => ({
      id: s.id,
      studyCode: s.studyNumber,
      studyTitle: s.testName,
      studyDirector: s.studyDirector || '-',
      status: s.status,
      documentCount: s.documents.length,
    }));

    res.json({
      success: true,
      data: {
        months,
        summary: {
          totalStudies: studies.length,
          totalDocuments: allDocs.length,
          byDocumentType: byDocType,
          byStatus,
        },
        studyList,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── 시험 일괄 등록 ───
router.post('/contracts/:contractId/studies/bulk', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contractId } = req.params;
    const userId = (req as any).user?.id;
    const { studies: studyRows } = req.body;

    if (!Array.isArray(studyRows) || studyRows.length === 0) {
      return res.status(400).json({ success: false, message: '등록할 시험 데이터가 없습니다.' });
    }

    const contract = await prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) {
      return res.status(404).json({ success: false, message: '계약을 찾을 수 없습니다.' });
    }

    // 시험번호 생성
    const year = new Date().getFullYear();
    const existingCount = await prisma.study.count({
      where: { studyNumber: { startsWith: `ST-${year}` } },
    });

    const created = [];
    for (let i = 0; i < studyRows.length; i++) {
      const row = studyRows[i];
      const studyNumber = row.studyCode || `ST-${year}-${String(existingCount + i + 1).padStart(4, '0')}`;

      const study = await prisma.study.create({
        data: {
          studyNumber,
          contractId,
          userId,
          studyType: contract.contractType || 'TOXICITY',
          testName: row.studyTitle || row.testName || '미지정',
          substanceCode: row.substanceCode || null,
          projectCode: row.projectCode || null,
          testSubstance: row.testSubstance || null,
          sponsor: row.sponsor || null,
          studyDirector: row.studyDirector || null,
          receivedDate: new Date(),
          status: 'REGISTERED',
        },
      });
      created.push(study);
    }

    res.status(201).json({
      success: true,
      data: { studies: created, count: created.length },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
