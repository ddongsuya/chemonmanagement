// 통합 검색 라우트 — 웹앱 전체 데이터 검색
import { Router, Request, Response } from 'express';
import { globalSearch, SearchCategory } from '../services/searchService';
import { authenticate } from '../middleware/auth';

const router = Router();

const VALID_CATEGORIES: SearchCategory[] = [
  'customer', 'quotation', 'contract', 'study', 'test_reception', 'consultation', 'lead',
];

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { q, categories, page, limit } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({ success: false, error: '검색어를 입력해주세요.' });
    }

    const parsedCategories = categories && typeof categories === 'string'
      ? categories.split(',').filter(c => VALID_CATEGORIES.includes(c as SearchCategory)) as SearchCategory[]
      : undefined;

    const result = await globalSearch({
      query: q.trim(),
      categories: parsedCategories,
      userId: (req as any).user.id,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 30,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, error: '검색 중 오류가 발생했습니다.' });
  }
});

export default router;
