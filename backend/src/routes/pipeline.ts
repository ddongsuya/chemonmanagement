// src/routes/pipeline.ts
// 파이프라인 관리 API

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

router.use(authenticate);

// 파이프라인 단계 목록 조회
router.get('/stages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stages = await prisma.pipelineStage.findMany({
      where: { isActive: true },
      include: {
        tasks: { where: { isActive: true }, orderBy: { order: 'asc' } },
        _count: { select: { leads: true } },
      },
      orderBy: { order: 'asc' },
    });

    res.json({ success: true, data: { stages } });
  } catch (error) {
    next(error);
  }
});

// 파이프라인 단계 생성
router.post('/stages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, code, order, color, description, isDefault } = req.body;

    const stage = await prisma.pipelineStage.create({
      data: { name, code, order, color, description, isDefault },
    });

    res.status(201).json({ success: true, data: { stage } });
  } catch (error) {
    next(error);
  }
});

// 파이프라인 단계 수정
router.put('/stages/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const stage = await prisma.pipelineStage.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, data: { stage } });
  } catch (error) {
    next(error);
  }
});

// 파이프라인 단계 순서 변경
router.patch('/stages/reorder', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stages } = req.body; // [{ id, order }]

    await Promise.all(
      stages.map((s: { id: string; order: number }) =>
        prisma.pipelineStage.update({
          where: { id: s.id },
          data: { order: s.order },
        })
      )
    );

    res.json({ success: true, message: '순서가 변경되었습니다.' });
  } catch (error) {
    next(error);
  }
});

// 파이프라인 단계 삭제 (비활성화)
router.delete('/stages/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // 해당 단계에 리드가 있는지 확인
    const leadCount = await prisma.lead.count({ where: { stageId: id } });
    if (leadCount > 0) {
      return res.status(400).json({
        success: false,
        message: '해당 단계에 리드가 있어 삭제할 수 없습니다.',
      });
    }

    await prisma.pipelineStage.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ success: true, message: '단계가 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
});

// 단계별 태스크 목록 조회
router.get('/stages/:stageId/tasks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stageId } = req.params;

    const tasks = await prisma.stageTask.findMany({
      where: { stageId, isActive: true },
      orderBy: { order: 'asc' },
    });

    res.json({ success: true, data: { tasks } });
  } catch (error) {
    next(error);
  }
});

// 태스크 생성
router.post('/stages/:stageId/tasks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stageId } = req.params;
    const { name, order, isRequired, description } = req.body;

    const task = await prisma.stageTask.create({
      data: { stageId, name, order, isRequired, description },
    });

    res.status(201).json({ success: true, data: { task } });
  } catch (error) {
    next(error);
  }
});

// 태스크 수정
router.put('/tasks/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const task = await prisma.stageTask.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, data: { task } });
  } catch (error) {
    next(error);
  }
});

// 태스크 삭제
router.delete('/tasks/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.stageTask.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ success: true, message: '태스크가 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
});

// 파이프라인 보드 데이터 (칸반용)
router.get('/board', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    const stages = await prisma.pipelineStage.findMany({
      where: { isActive: true },
      include: {
        leads: {
          where: { userId, deletedAt: null },
          include: {
            customer: true,
            _count: { select: { activities: true } },
          },
          orderBy: { updatedAt: 'desc' },
        },
        tasks: { where: { isActive: true }, orderBy: { order: 'asc' } },
      },
      orderBy: { order: 'asc' },
    });

    res.json({ success: true, data: { stages } });
  } catch (error) {
    next(error);
  }
});

export default router;
