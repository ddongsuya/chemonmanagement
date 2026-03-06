/**
 * Customer Import/Export API Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth';
import * as importExportService from '../services/importExportService';

const router = Router();

// multer 설정
const upload = multer({
  dest: path.join(process.cwd(), 'uploads'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다. xlsx, xls, csv만 가능합니다.'));
    }
  },
});

/**
 * @swagger
 * /api/customer-import-export/upload:
 *   post:
 *     tags: [ImportExport]
 *     summary: 가져오기 파일 업로드 및 헤더 파싱
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: 파일 파싱 결과
 */
// POST /api/customer-import-export/upload - 파일 업로드 및 헤더 파싱
router.post('/upload', authenticate, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: { message: '파일이 필요합니다' } });
    }
    const result = await importExportService.parseUploadedFile(req.file.path);
    res.json({
      success: true,
      data: {
        filePath: req.file.path,
        ...result,
      },
    });
  } catch (error) { next(error); }
});

/**
 * @swagger
 * /api/customer-import-export/validate:
 *   post:
 *     tags: [ImportExport]
 *     summary: 가져오기 데이터 유효성 검사
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: 유효성 검사 결과
 */
// POST /api/customer-import-export/validate - 유효성 검사
router.post('/validate', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filePath, mapping } = req.body;
    if (!filePath || !mapping) {
      return res.status(400).json({ success: false, error: { message: 'filePath와 mapping이 필요합니다' } });
    }
    const result = await importExportService.validateImport(filePath, mapping, req.user!.id);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

/**
 * @swagger
 * /api/customer-import-export/execute:
 *   post:
 *     tags: [ImportExport]
 *     summary: 가져오기 실행
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: 가져오기 결과
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImportResult'
 */
// POST /api/customer-import-export/execute - 가져오기 실행
router.post('/execute', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filePath, mapping, skipDuplicates = true } = req.body;
    if (!filePath || !mapping) {
      return res.status(400).json({ success: false, error: { message: 'filePath와 mapping이 필요합니다' } });
    }
    const result = await importExportService.executeImport(filePath, mapping, req.user!.id, skipDuplicates);

    // 임시 파일 정리
    try { fs.unlinkSync(filePath); } catch {}

    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

/**
 * @swagger
 * /api/customer-import-export/export:
 *   post:
 *     tags: [ImportExport]
 *     summary: 고객 데이터 내보내기
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Excel/CSV 파일 다운로드
 */
// POST /api/customer-import-export/export - 내보내기
router.post('/export', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { columns, format, filters } = req.body;
    const filePath = await importExportService.exportCustomers({
      userId: req.user!.id,
      columns,
      format,
      filters: filters ? {
        ...filters,
        createdFrom: filters.createdFrom ? new Date(filters.createdFrom) : undefined,
        createdTo: filters.createdTo ? new Date(filters.createdTo) : undefined,
      } : undefined,
    });
    res.download(filePath, path.basename(filePath), () => {
      try { fs.unlinkSync(filePath); } catch {}
    });
  } catch (error) { next(error); }
});

/**
 * @swagger
 * /api/customer-import-export/template:
 *   get:
 *     tags: [ImportExport]
 *     summary: 가져오기 템플릿 다운로드
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Excel 템플릿 파일 다운로드
 */
// GET /api/customer-import-export/template - 가져오기 템플릿 다운로드
router.get('/template', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filePath = await importExportService.generateImportTemplate();
    res.download(filePath, 'customer_import_template.xlsx');
  } catch (error) { next(error); }
});

export default router;
