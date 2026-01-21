// Excel Import/Export Routes
import { Router, Request, Response, NextFunction } from 'express';
import { excelService, ExportType } from '../services/excelService';
import { authenticate } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// 파일 업로드 설정
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.xlsx' && ext !== '.xls') {
      return cb(new Error('Excel 파일만 업로드 가능합니다 (.xlsx, .xls)'));
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/**
 * GET /api/excel/export/:type
 * 데이터 내보내기 (Excel 다운로드)
 */
router.get('/export/:type', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = req.params.type as ExportType;
    const { startDate, endDate, quotationType } = req.query;
    const userId = req.user!.id;

    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (quotationType) filters.type = quotationType;

    let filename: string;
    switch (type) {
      case 'leads':
        filename = await excelService.exportLeads(userId, filters);
        break;
      case 'quotations':
        filename = await excelService.exportQuotations(userId, filters);
        break;
      case 'contracts':
        filename = await excelService.exportContracts(userId, filters);
        break;
      case 'studies':
        filename = await excelService.exportStudies(userId, filters);
        break;
      case 'customers':
        filename = await excelService.exportCustomers(userId);
        break;
      default:
        return res.status(400).json({ success: false, error: { message: '지원하지 않는 내보내기 유형입니다' } });
    }

    res.json({ success: true, data: { filename, downloadUrl: `/exports/${filename}` } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/excel/import/:type
 * 데이터 가져오기 (Excel 업로드)
 */
router.post('/import/:type', authenticate, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = req.params.type as ExportType;
    const userId = req.user!.id;

    if (!req.file) {
      return res.status(400).json({ success: false, error: { message: '파일이 필요합니다' } });
    }

    let result;
    switch (type) {
      case 'leads':
        result = await excelService.importLeads(userId, req.file.path);
        break;
      case 'quotations':
        result = await excelService.importQuotations(userId, req.file.path);
        break;
      case 'contracts':
        result = await excelService.importContracts(userId, req.file.path);
        break;
      case 'customers':
        result = await excelService.importCustomers(userId, req.file.path);
        break;
      default:
        // 업로드된 파일 삭제
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ success: false, error: { message: '지원하지 않는 가져오기 유형입니다' } });
    }

    // 업로드된 파일 삭제
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      data: result,
      message: `${result.success}건 성공, ${result.failed}건 실패`,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

/**
 * GET /api/excel/template/:type
 * 가져오기용 템플릿 다운로드
 */
router.get('/template/:type', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = req.params.type as ExportType;
    const filename = await excelService.generateTemplate(type);
    res.json({ success: true, data: { filename, downloadUrl: `/exports/${filename}` } });
  } catch (error) {
    next(error);
  }
});

export default router;
