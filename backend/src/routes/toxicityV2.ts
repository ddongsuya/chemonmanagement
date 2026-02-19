/**
 * Toxicity V2 API Routes
 * 
 * v2 독성시험 데이터 조회 API
 * GET /api/toxicity-v2/items?mode={mode}
 * GET /api/toxicity-v2/categories?mode={mode}
 * GET /api/toxicity-v2/relations
 * GET /api/toxicity-v2/overlays
 * GET /api/toxicity-v2/metadata
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getItemsByMode,
  getCategoriesByMode,
  getRelations,
  getOverlays,
  getMetadata,
} from '../services/toxicityV2Service';

const router = Router();

const VALID_MODES = [
  'drug_single', 'drug_combo', 'drug_vaccine',
  'drug_screen_tox', 'drug_screen_cv',
  'hf_indv', 'hf_prob', 'hf_temp',
  'md_bio',
];

/**
 * @swagger
 * /api/toxicity-v2/items:
 *   get:
 *     summary: 모드별 시험 항목 조회
 *     tags: [ToxicityV2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mode
 *         required: true
 *         schema:
 *           type: string
 *           enum: [drug_single, drug_combo, drug_vaccine, drug_screen_tox, drug_screen_cv, hf_indv, hf_prob, hf_temp, md_bio]
 *     responses:
 *       200:
 *         description: 시험 항목 목록
 */
router.get('/items', authenticate, async (req: Request, res: Response) => {
  try {
    const { mode } = req.query;

    if (!mode || typeof mode !== 'string' || !VALID_MODES.includes(mode)) {
      return res.status(400).json({
        success: false,
        error: '유효한 시험 모드를 지정해주세요.',
      });
    }

    const items = await getItemsByMode(mode);
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('ToxicityV2 items error:', error);
    res.status(500).json({ success: false, error: '시험 항목 조회 중 오류가 발생했습니다.' });
  }
});


/**
 * @swagger
 * /api/toxicity-v2/categories:
 *   get:
 *     summary: 모드별 카테고리 목록 조회
 *     tags: [ToxicityV2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 카테고리 목록
 */
router.get('/categories', authenticate, async (req: Request, res: Response) => {
  try {
    const { mode } = req.query;

    if (!mode || typeof mode !== 'string' || !VALID_MODES.includes(mode)) {
      return res.status(400).json({
        success: false,
        error: '유효한 시험 모드를 지정해주세요.',
      });
    }

    const categories = await getCategoriesByMode(mode);
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('ToxicityV2 categories error:', error);
    res.status(500).json({ success: false, error: '카테고리 조회 중 오류가 발생했습니다.' });
  }
});

/**
 * @swagger
 * /api/toxicity-v2/relations:
 *   get:
 *     summary: 시험 관계 트리 조회
 *     tags: [ToxicityV2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 시험 관계 트리
 */
router.get('/relations', authenticate, async (_req: Request, res: Response) => {
  try {
    const relations = await getRelations();
    res.json({ success: true, data: relations });
  } catch (error) {
    console.error('ToxicityV2 relations error:', error);
    res.status(500).json({ success: false, error: '시험 관계 조회 중 오류가 발생했습니다.' });
  }
});

/**
 * @swagger
 * /api/toxicity-v2/overlays:
 *   get:
 *     summary: OECD 오버레이 조회
 *     tags: [ToxicityV2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OV/OE 오버레이 데이터
 */
router.get('/overlays', authenticate, async (_req: Request, res: Response) => {
  try {
    const overlays = await getOverlays();
    res.json({ success: true, data: overlays });
  } catch (error) {
    console.error('ToxicityV2 overlays error:', error);
    res.status(500).json({ success: false, error: '오버레이 조회 중 오류가 발생했습니다.' });
  }
});

/**
 * @swagger
 * /api/toxicity-v2/metadata:
 *   get:
 *     summary: 메타데이터 조회 (FN, GL, CC, IM, CATS)
 *     tags: [ToxicityV2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 메타데이터
 */
router.get('/metadata', authenticate, async (_req: Request, res: Response) => {
  try {
    const metadata = await getMetadata();
    res.json({ success: true, data: metadata });
  } catch (error) {
    console.error('ToxicityV2 metadata error:', error);
    res.status(500).json({ success: false, error: '메타데이터 조회 중 오류가 발생했습니다.' });
  }
});

export default router;
