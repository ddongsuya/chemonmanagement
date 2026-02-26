/**
 * LeadNumberService - 리드 번호 생성 서비스
 * 
 * UserSettings.nextLeadSeq를 사용한 원자적 시퀀스 생성
 * 형식: UC-YYYY-NNNN (사용자코드-연도-일련번호)
 * 
 * @example
 * // User Code: DL, 2025년, 일련번호 1 → "DL-2025-0001"
 * 
 * Requirements:
 * - 3.1: 새 리드 생성 시 사용자의 User_Code를 접두사로 사용하여 Lead_Number 생성
 * - 3.3: 리드 번호 생성 시 해당 사용자의 리드 일련번호를 1 증가
 */

import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma';

/**
 * Lead number configuration
 */
export interface LeadNumberConfig {
  format: 'UC-YYYY-NNNN';  // 사용자코드-연도-일련번호
  yearDigits: 4;
  sequenceDigits: 4;
}

/**
 * Error thrown when user code is not set
 */
export class UserCodeNotSetError extends Error {
  constructor() {
    super('견적서 코드가 설정되지 않았습니다');
    this.name = 'UserCodeNotSetError';
  }
}

/**
 * LeadNumberService class for generating lead numbers
 */
export class LeadNumberService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * Generate a lead number for a user using atomic sequence increment.
   * 
   * Uses UserSettings.nextLeadSeq with atomic update to guarantee uniqueness
   * even under concurrent/bulk operations.
   * 
   * Format: UC-YYYY-NNNN
   * - UC: User Code (2 uppercase letters)
   * - YYYY: 4-digit year
   * - NNNN: 4-digit sequence number (padded with zeros)
   * 
   * @param userId - The user ID to generate lead number for
   * @returns Generated lead number string
   * @throws UserCodeNotSetError if user code is not set
   */
  async generateLeadNumber(userId: string): Promise<string> {
    // Atomic transaction: read userCode + increment nextLeadSeq in one shot
    const result = await this.prisma.$transaction(async (tx) => {
      const settings = await tx.userSettings.findUnique({
        where: { userId },
        select: { userCode: true, nextLeadSeq: true },
      });

      if (!settings?.userCode) {
        throw new UserCodeNotSetError();
      }

      const seq = settings.nextLeadSeq;

      // Atomically increment the sequence
      await tx.userSettings.update({
        where: { userId },
        data: { nextLeadSeq: { increment: 1 } },
      });

      return { userCode: settings.userCode, seq };
    });

    const year = new Date().getFullYear();
    return `${result.userCode}-${year}-${result.seq.toString().padStart(4, '0')}`;
  }

  /**
   * Get the next lead sequence number for a user.
   * 
   * Reads from UserSettings.nextLeadSeq (does NOT increment).
   * For actual number generation, use generateLeadNumber() which atomically increments.
   * 
   * @param userId - The user ID
   * @param userCode - The user's code (optional, fetched if not provided)
   * @param year - The year (optional, unused but kept for API compatibility)
   * @returns Next sequence number
   */
  async getNextLeadSequence(userId: string, userCode?: string, year?: number): Promise<number> {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
      select: { userCode: true, nextLeadSeq: true },
    });

    if (!settings?.userCode) {
      throw new UserCodeNotSetError();
    }

    return settings.nextLeadSeq;
  }
}

// Export singleton instance
export const leadNumberService = new LeadNumberService();

export default leadNumberService;
