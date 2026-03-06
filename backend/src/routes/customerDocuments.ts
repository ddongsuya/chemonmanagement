/**
 * Customer Documents API Routes
 * 문서 업로드/관리
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import * as docService from '../services/customerDocumentService';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(process.cwd(), 'uploads', 'customer-documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

// GET /api/customer-documents/:customerId - 문서 목록
router.get('/:customerId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docs = await docService.getDocuments(req.params.customerId);
    res.json({ success: true, data: docs });
  } catch (error) { next(error); }
});

// POST /api/customer-documents/:customerId - 문서 업로드
router.post('/:customerId', authenticate, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: { message: '파일이 필요합니다' } });
    const doc = await docService.uploadDocument({
      customerId: req.params.customerId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      filePath: req.file.path,
      uploadedBy: req.user!.id,
    });
    res.status(201).json({ success: true, data: doc });
  } catch (error) { next(error); }
});

// GET /api/customer-documents/:customerId/:docId/download - 문서 다운로드
router.get('/:customerId/:docId/download', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = await docService.getDocument(req.params.docId);
    if (!doc) return res.status(404).json({ success: false, error: { message: '문서를 찾을 수 없습니다' } });
    res.download(doc.filePath, doc.fileName);
  } catch (error) { next(error); }
});

// DELETE /api/customer-documents/:customerId/:docId - 문서 삭제
router.delete('/:customerId/:docId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = await docService.getDocument(req.params.docId);
    if (doc?.filePath && fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }
    await docService.deleteDocument(req.params.docId);
    res.status(204).send();
  } catch (error) { next(error); }
});

export default router;
