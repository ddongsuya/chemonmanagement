import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { PackageService } from '../services/packageService';
import { authenticate } from '../middleware/auth';
import { AppError, ErrorCodes } from '../types/error';

const router = Router();
const prisma = new PrismaClient();
const packageService = new PackageService(prisma);

// ==================== Package Templates ====================

/**
 * @swagger
 * /api/packages:
 *   get:
 *     summary: 패키지 템플릿 목록 조회
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: all
 *         schema:
 *           type: string
 *         description: 'true'면 비활성 포함 전체 조회
 *     responses:
 *       200:
 *         description: 패키지 목록
 */
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const includeAll = req.query.all === 'true';
    const packages = includeAll
      ? await packageService.getAllPackages()
      : await packageService.getPackages();

    res.json({
      success: true,
      data: packages,
      count: packages.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/packages/{packageId}:
 *   get:
 *     summary: 패키지 템플릿 상세 조회
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: packageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 패키지 상세
 */
router.get('/:packageId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pkg = await packageService.getPackageById(req.params.packageId);

    if (!pkg) {
      throw new AppError('패키지를 찾을 수 없습니다', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }

    res.json({
      success: true,
      data: pkg,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/packages:
 *   post:
 *     summary: 패키지 템플릿 생성
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - packageId
 *               - packageName
 *             properties:
 *               packageId:
 *                 type: string
 *               packageName:
 *                 type: string
 *               description:
 *                 type: string
 *               modality:
 *                 type: string
 *               clinicalPhase:
 *                 type: string
 *               tests:
 *                 type: array
 *               optionalTests:
 *                 type: array
 *     responses:
 *       201:
 *         description: 생성된 패키지
 */
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { packageId, packageName, description, modality, clinicalPhase, tests, optionalTests } = req.body;

    if (!packageId || !packageName) {
      throw new AppError('패키지 ID와 이름은 필수입니다', 400, ErrorCodes.VALIDATION_ERROR);
    }

    const pkg = await packageService.createPackage({
      packageId,
      packageName,
      description,
      modality,
      clinicalPhase,
      tests,
      optionalTests,
    });

    res.status(201).json({
      success: true,
      data: pkg,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/packages/{packageId}:
 *   put:
 *     summary: 패키지 템플릿 수정
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: packageId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 수정된 패키지
 */
router.put('/:packageId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pkg = await packageService.updatePackage(req.params.packageId, req.body);

    res.json({
      success: true,
      data: pkg,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/packages/{packageId}:
 *   delete:
 *     summary: 패키지 템플릿 삭제
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: packageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 삭제 완료
 */
router.delete('/:packageId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await packageService.deletePackage(req.params.packageId);

    res.json({
      success: true,
      message: '패키지가 삭제되었습니다',
    });
  } catch (error) {
    next(error);
  }
});

// ==================== Company Info ====================

/**
 * @swagger
 * /api/company/info:
 *   get:
 *     summary: 회사 정보 조회
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 회사 정보
 */
router.get('/info', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const info = await packageService.getCompanyInfo();

    res.json({
      success: true,
      data: info,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/company/info:
 *   put:
 *     summary: 회사 정보 수정
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 수정된 회사 정보
 */
router.put('/info', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const info = await packageService.updateCompanyInfo(req.body);

    res.json({
      success: true,
      data: info,
    });
  } catch (error) {
    next(error);
  }
});

// ==================== User Settings ====================

/**
 * @swagger
 * /api/settings/user:
 *   get:
 *     summary: 사용자 설정 조회
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 설정
 */
router.get('/user', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const settings = await packageService.getUserSettings(userId);

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/settings/user:
 *   put:
 *     summary: 사용자 설정 수정
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 수정된 사용자 설정
 */
router.put('/user', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const settings = await packageService.updateUserSettings(userId, req.body);

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
