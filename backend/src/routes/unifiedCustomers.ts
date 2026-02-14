/**
 * Unified Customers API Routes
 * 
 * 리드(Lead)와 고객(Customer)을 통합하여 조회하는 API 엔드포인트
 * 
 * Requirements:
 * - 6.1: GET /api/unified-customers 엔드포인트 제공
 * - 6.3: stageId 파라미터로 필터링
 * - 6.4: type 파라미터로 필터링
 * - 6.5: search 파라미터로 필터링
 * 
 * @module routes/unifiedCustomers
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { unifiedCustomerService } from '../services/unifiedCustomerService';
import { UnifiedCustomerFilters } from '../types/unifiedCustomer';

const router = Router();

// 모든 라우트에 인증 적용
router.use(authenticate);

/**
 * GET /api/unified-customers
 * 
 * 통합 고객 목록 조회 API
 * 
 * Query Parameters:
 * - type: 'all' | 'lead' | 'customer' - 유형 필터 (기본값: 'all')
 * - stageId: string - 파이프라인 단계 ID 필터
 * - search: string - 검색어 (회사명, 담당자명, 이메일, 전화번호)
 * - page: number - 페이지 번호 (기본값: 1)
 * - limit: number - 페이지당 항목 수 (기본값: 20, 최대: 100)
 * - sortBy: 'updatedAt' | 'createdAt' | 'companyName' - 정렬 기준 (기본값: 'updatedAt')
 * - sortOrder: 'asc' | 'desc' - 정렬 순서 (기본값: 'desc')
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     entities: UnifiedEntity[],
 *     pagination: { total, page, limit, totalPages },
 *     stats: { totalCount, leadCount, customerCount, stageDistribution }
 *   }
 * }
 * 
 * Requirements:
 * - 6.1: GET /api/unified-customers 엔드포인트 제공
 * - 6.3: stageId 파라미터로 필터링
 * - 6.4: type 파라미터로 필터링
 * - 6.5: search 파라미터로 필터링
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    
    // 쿼리 파라미터 파싱
    const {
      type,
      stageId,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query;

    // 필터 객체 구성
    const filters: UnifiedCustomerFilters = {};

    // type 파라미터 검증 및 적용 (Requirements 6.4)
    if (type) {
      const validTypes = ['all', 'lead', 'customer'];
      if (validTypes.includes(type as string)) {
        filters.type = type as 'all' | 'lead' | 'customer';
      }
    }

    // stageId 파라미터 적용 (Requirements 6.3)
    if (stageId && typeof stageId === 'string' && stageId.trim()) {
      filters.stageId = stageId.trim();
    }

    // search 파라미터 적용 (Requirements 6.5)
    if (search && typeof search === 'string' && search.trim()) {
      filters.search = search.trim();
    }

    // page 파라미터 파싱 및 검증
    if (page) {
      const parsedPage = parseInt(page as string, 10);
      if (!isNaN(parsedPage) && parsedPage > 0) {
        filters.page = parsedPage;
      }
    }

    // limit 파라미터 파싱 및 검증 (최대 100)
    if (limit) {
      const parsedLimit = parseInt(limit as string, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        filters.limit = Math.min(parsedLimit, 100);
      }
    }

    // sortBy 파라미터 검증 및 적용
    if (sortBy) {
      const validSortBy = ['updatedAt', 'createdAt', 'companyName'];
      if (validSortBy.includes(sortBy as string)) {
        filters.sortBy = sortBy as 'updatedAt' | 'createdAt' | 'companyName';
      }
    }

    // sortOrder 파라미터 검증 및 적용
    if (sortOrder) {
      const validSortOrder = ['asc', 'desc'];
      if (validSortOrder.includes(sortOrder as string)) {
        filters.sortOrder = sortOrder as 'asc' | 'desc';
      }
    }

    // 서비스 호출
    const result = await unifiedCustomerService.getUnifiedCustomers(filters, userId);

    // 응답 반환 (Requirements 6.1)
    res.json({
      success: true,
      data: {
        entities: result.data,
        pagination: result.pagination,
        stats: result.stats,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/unified-customers/stages
 * 
 * 파이프라인 단계 목록 조회 API
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     stages: PipelineStage[]
 *   }
 * }
 */
router.get('/stages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stages = await unifiedCustomerService.getPipelineStages();

    res.json({
      success: true,
      data: {
        stages,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
