import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { UserCodeValidator } from '../services/userCodeValidator';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { AppError, ErrorCodes } from '../types/error';

const router = Router();
const userCodeValidator = new UserCodeValidator(prisma);

/**
 * 견적서 코드 저장 요청 스키마
 */
const updateUserCodeSchema = z.object({
  userCode: z.string().min(1, '견적서 코드를 입력해주세요'),
});

/**
 * 견적서 코드 저장 응답 인터페이스
 */
interface UpdateUserCodeResponse {
  success: boolean;
  userCode: string;
  error?: string;
}

/**
 * 견적서 코드 검증 요청 스키마
 */
const validateUserCodeSchema = z.object({
  userCode: z.string().min(1, '견적서 코드를 입력해주세요'),
});

/**
 * 견적서 코드 검증 응답 인터페이스
 */
interface ValidateUserCodeResponse {
  isValid: boolean;
  isDuplicate: boolean;
  normalizedCode: string;
  error?: string;
}

/**
 * @swagger
 * /api/user-code/validate:
 *   post:
 *     summary: 견적서 코드 중복 검사
 *     description: |
 *       사용자가 입력한 견적서 코드의 유효성과 중복 여부를 검사합니다.
 *       - 형식 검증: 2글자 영문만 허용
 *       - 중복 검사: 대소문자 구분 없이 다른 사용자와의 중복 확인
 *       - 자신의 기존 코드와 동일한 경우 중복 오류 없이 허용
 *     tags: [UserCode]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userCode
 *             properties:
 *               userCode:
 *                 type: string
 *                 description: 검증할 견적서 코드 (2글자 영문)
 *                 example: "DL"
 *     responses:
 *       200:
 *         description: 검증 결과 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     isValid:
 *                       type: boolean
 *                       description: 코드 사용 가능 여부
 *                     isDuplicate:
 *                       type: boolean
 *                       description: 다른 사용자와 중복 여부
 *                     normalizedCode:
 *                       type: string
 *                       description: 대문자로 정규화된 코드
 *                     error:
 *                       type: string
 *                       description: 오류 메시지 (유효하지 않은 경우)
 *       400:
 *         description: 유효성 검사 실패
 *       401:
 *         description: 인증 필요
 */
router.post(
  '/validate',
  authenticate,
  validateBody(validateUserCodeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userCode } = req.body;
      const userId = req.user!.id;

      // 형식 검증
      const isValidFormat = userCodeValidator.isValidFormat(userCode);
      if (!isValidFormat) {
        const response: ValidateUserCodeResponse = {
          isValid: false,
          isDuplicate: false,
          normalizedCode: userCodeValidator.normalizeCode(userCode),
          error: '견적서 코드는 2글자 영문이어야 합니다',
        };
        
        res.json({
          success: true,
          data: response,
        });
        return;
      }

      // 중복 검사 (Requirements 4.1, 4.2, 4.3, 4.5)
      const validationResult = await userCodeValidator.validateUniqueness(userCode, userId);
      
      const response: ValidateUserCodeResponse = {
        isValid: validationResult.isValid,
        isDuplicate: !validationResult.isValid && validationResult.error === '이미 사용 중인 견적서 코드입니다',
        normalizedCode: validationResult.normalizedCode || userCodeValidator.normalizeCode(userCode),
        error: validationResult.error,
      };

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/user-settings/user-code:
 *   put:
 *     summary: 견적서 코드 저장
 *     description: |
 *       사용자의 견적서 코드를 저장합니다.
 *       - 저장 전 중복 검사 수행 (Requirements 4.1, 4.2, 4.3)
 *       - 자신의 기존 코드와 동일한 경우 중복 오류 없이 저장 허용 (Requirement 4.5)
 *       - 대문자로 정규화 후 저장 (Requirement 4.6)
 *     tags: [UserCode]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userCode
 *             properties:
 *               userCode:
 *                 type: string
 *                 description: 저장할 견적서 코드 (2글자 영문)
 *                 example: "DL"
 *     responses:
 *       200:
 *         description: 저장 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       description: 저장 성공 여부
 *                     userCode:
 *                       type: string
 *                       description: 저장된 견적서 코드 (대문자)
 *                     error:
 *                       type: string
 *                       description: 오류 메시지 (실패 시)
 *       400:
 *         description: 유효성 검사 실패 또는 중복 코드
 *       401:
 *         description: 인증 필요
 */
router.put(
  '/user-code',
  authenticate,
  validateBody(updateUserCodeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userCode } = req.body;
      const userId = req.user!.id;

      // 저장 전 중복 검사 수행 (Requirements 4.1, 4.2, 4.3, 4.5)
      const validationResult = await userCodeValidator.validateUniqueness(userCode, userId);

      if (!validationResult.isValid) {
        // 형식 오류 또는 중복 오류
        throw new AppError(
          validationResult.error || '견적서 코드 저장에 실패했습니다',
          400,
          ErrorCodes.VALIDATION_ERROR
        );
      }

      // 대문자 정규화 후 저장 (Requirement 4.6)
      const normalizedCode = userCodeValidator.normalizeCode(userCode);

      // UserSettings 업데이트 또는 생성
      const updatedSettings = await prisma.userSettings.upsert({
        where: { userId },
        update: { userCode: normalizedCode },
        create: { userId, userCode: normalizedCode },
      });

      const response: UpdateUserCodeResponse = {
        success: true,
        userCode: updatedSettings.userCode || normalizedCode,
      };

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
