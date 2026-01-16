import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// ==================== Toxicity Tests (새 구조) ====================

/**
 * GET /api/master/toxicity-tests
 * Get all toxicity tests
 */
router.get(
  '/toxicity-tests',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category, subcategory, sheet, animalClass, species, routeGroup, search, active } = req.query;

      const where: any = {};
      
      if (active !== 'all') {
        where.isActive = true;
      }
      
      if (category) {
        where.category = category as string;
      }
      
      if (subcategory) {
        where.subcategory = subcategory as string;
      }
      
      if (sheet) {
        where.sheet = sheet as string;
      }
      
      if (animalClass) {
        where.animalClass = animalClass as string;
      }
      
      if (species) {
        where.species = species as string;
      }
      
      if (routeGroup) {
        where.routeGroup = routeGroup as string;
      }
      
      if (search) {
        where.OR = [
          { testName: { contains: search as string, mode: 'insensitive' } },
          { category: { contains: search as string, mode: 'insensitive' } },
          { subcategory: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const tests = await prisma.toxicityTest.findMany({
        where,
        orderBy: [
          { sheet: 'asc' },
          { subcategory: 'asc' },
          { itemId: 'asc' },
        ],
      });

      res.json({
        success: true,
        data: tests,
        count: tests.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/master/toxicity-tests/categories
 * Get all toxicity categories from master table
 */
router.get(
  '/toxicity-tests/categories',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await prisma.toxicityCategory.findMany({
        where: { isActive: true },
        orderBy: [{ category: 'asc' }, { subcategory: 'asc' }],
      });

      // Group by category
      const grouped: Record<string, string[]> = {};
      categories.forEach((c) => {
        if (!grouped[c.category]) {
          grouped[c.category] = [];
        }
        if (!grouped[c.category].includes(c.subcategory)) {
          grouped[c.category].push(c.subcategory);
        }
      });

      res.json({
        success: true,
        data: {
          data: grouped,
          raw: categories,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/master/toxicity-tests/:itemId
 * Get single toxicity test by itemId
 */
router.get(
  '/toxicity-tests/:itemId',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const itemId = parseInt(req.params.itemId);
      
      if (isNaN(itemId)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_ID', message: '유효하지 않은 ID입니다' },
        });
      }

      const test = await prisma.toxicityTest.findUnique({
        where: { itemId },
      });

      if (!test) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: '시험항목을 찾을 수 없습니다' },
        });
      }

      res.json({
        success: true,
        data: test,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== Master Reference Data ====================

/**
 * GET /api/master/animal-classes
 * Get all animal classes
 */
router.get(
  '/animal-classes',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const classes = await prisma.animalClass.findMany({
        where: { isActive: true },
        orderBy: { classId: 'asc' },
      });

      res.json({
        success: true,
        data: classes,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/master/species
 * Get all species
 */
router.get(
  '/species',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const species = await prisma.species.findMany({
        where: { isActive: true },
        orderBy: { speciesId: 'asc' },
      });

      res.json({
        success: true,
        data: species,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/master/routes
 * Get all routes
 */
router.get(
  '/routes',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const routes = await prisma.route.findMany({
        where: { isActive: true },
        orderBy: { routeId: 'asc' },
      });

      res.json({
        success: true,
        data: routes,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== Efficacy Price Items ====================

/**
 * GET /api/master/efficacy-prices
 * Get all efficacy price items
 */
router.get(
  '/efficacy-prices',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category, subcategory, search, active } = req.query;

      const where: any = {};
      
      if (active !== 'all') {
        where.isActive = true;
      }
      
      if (category) {
        where.category = category as string;
      }
      
      if (subcategory) {
        where.subcategory = subcategory as string;
      }
      
      if (search) {
        where.OR = [
          { itemId: { contains: search as string, mode: 'insensitive' } },
          { itemName: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const items = await prisma.efficacyPriceItem.findMany({
        where,
        orderBy: [
          { category: 'asc' },
          { subcategory: 'asc' },
          { itemId: 'asc' },
        ],
      });

      res.json({
        success: true,
        data: items,
        count: items.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/master/efficacy-prices/categories
 * Get unique categories for efficacy prices
 */
router.get(
  '/efficacy-prices/categories',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await prisma.efficacyPriceItem.findMany({
        where: { isActive: true },
        select: { category: true, subcategory: true },
        distinct: ['category', 'subcategory'],
        orderBy: [{ category: 'asc' }, { subcategory: 'asc' }],
      });

      const grouped: Record<string, string[]> = {};
      categories.forEach((c) => {
        if (!grouped[c.category]) {
          grouped[c.category] = [];
        }
        if (c.subcategory && !grouped[c.category].includes(c.subcategory)) {
          grouped[c.category].push(c.subcategory);
        }
      });

      res.json({
        success: true,
        data: grouped,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== Efficacy Models ====================

/**
 * GET /api/master/efficacy-models
 * Get all efficacy models
 */
router.get(
  '/efficacy-models',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category, search, active } = req.query;

      const where: any = {};
      
      if (active !== 'all') {
        where.isActive = true;
      }
      
      if (category) {
        where.category = category as string;
      }
      
      if (search) {
        where.OR = [
          { modelId: { contains: search as string, mode: 'insensitive' } },
          { modelName: { contains: search as string, mode: 'insensitive' } },
          { indication: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const models = await prisma.efficacyModel.findMany({
        where,
        orderBy: [
          { category: 'asc' },
          { modelId: 'asc' },
        ],
      });

      res.json({
        success: true,
        data: models,
        count: models.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/master/efficacy-models/categories
 * Get unique categories for efficacy models
 */
router.get(
  '/efficacy-models/categories',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await prisma.efficacyModel.findMany({
        where: { isActive: true },
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      });

      res.json({
        success: true,
        data: categories.map((c) => c.category),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/master/efficacy-models/:modelId
 * Get single efficacy model by modelId
 */
router.get(
  '/efficacy-models/:modelId',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const model = await prisma.efficacyModel.findUnique({
        where: { modelId: req.params.modelId },
      });

      if (!model) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: '모델을 찾을 수 없습니다' },
        });
      }

      res.json({
        success: true,
        data: model,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== Modalities ====================

/**
 * GET /api/master/modalities
 * Get all modalities
 */
router.get(
  '/modalities',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { level, active } = req.query;

      const where: any = {};
      
      if (active !== 'all') {
        where.isActive = true;
      }
      
      if (level) {
        where.level = parseInt(level as string);
      }

      const modalities = await prisma.modality.findMany({
        where,
        orderBy: [
          { level: 'asc' },
          { code: 'asc' },
        ],
      });

      res.json({
        success: true,
        data: modalities,
        count: modalities.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/master/modalities/hierarchy
 * Get modalities in hierarchical structure
 */
router.get(
  '/modalities/hierarchy',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const modalities = await prisma.modality.findMany({
        where: { isActive: true },
        orderBy: [{ level: 'asc' }, { code: 'asc' }],
      });

      // Build hierarchy
      const level1 = modalities.filter((m) => m.level === 1);
      const hierarchy = level1.map((parent) => ({
        ...parent,
        children: modalities.filter((m) => m.parentCode === parent.code),
      }));

      res.json({
        success: true,
        data: hierarchy,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
