// 통합 검색 라우트
import { Router, Request, Response } from 'express';
import { unifiedSearch, SearchParams } from '../services/searchService';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: 통합 검색
 *     description: 모든 견적서 유형(독성, 효력, 임상병리)을 통합 검색합니다.
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: 검색어 (견적번호, 고객명, 프로젝트명)
 *       - in: query
 *         name: types
 *         schema:
 *           type: string
 *         description: 검색할 견적 유형 (쉼표 구분, TOXICITY,EFFICACY,CLINICAL_PATHOLOGY)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: 상태 필터
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: 시작일
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: 종료일
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 검색 결과
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { q, types, status, dateFrom, dateTo, page, limit } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '검색어를 입력해주세요.',
      });
    }

    const searchParams: SearchParams = {
      query: q.trim(),
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    };

    // 유형 필터
    if (types && typeof types === 'string') {
      const typeArray = types.split(',').filter(t => 
        ['TOXICITY', 'EFFICACY', 'CLINICAL_PATHOLOGY'].includes(t)
      ) as ('TOXICITY' | 'EFFICACY' | 'CLINICAL_PATHOLOGY')[];
      if (typeArray.length > 0) {
        searchParams.types = typeArray;
      }
    }

    // 상태 필터
    if (status && typeof status === 'string') {
      searchParams.status = status;
    }

    // 날짜 필터
    if (dateFrom && typeof dateFrom === 'string') {
      searchParams.dateFrom = new Date(dateFrom);
    }
    if (dateTo && typeof dateTo === 'string') {
      searchParams.dateTo = new Date(dateTo);
    }

    const result = await unifiedSearch(searchParams);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: '검색 중 오류가 발생했습니다.',
    });
  }
});

export default router;
