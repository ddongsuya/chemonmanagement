/**
 * LeadNumberService - 리드 번호 생성 서비스
 * 
 * 사용자 코드 기반으로 리드 번호를 생성합니다.
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
   * Generate a lead number for a user
   * 
   * Format: UC-YYYY-NNNN
   * - UC: User Code (2 uppercase letters)
   * - YYYY: 4-digit year
   * - NNNN: 4-digit sequence number (padded with zeros)
   * 
   * @param userId - The user ID to generate lead number for
   * @returns Generated lead number string
   * @throws UserCodeNotSetError if user code is not set
   * 
   * @example
   * // User Code: DL, 2025년, 일련번호 1
   * generateLeadNumber('user-id') // Returns: "DL-2025-0001"
   * 
   * Validates: Requirements 3.1, 3.3
   */
  async generateLeadNumber(userId: string): Promise<string> {
    // Get user settings to retrieve userCode
    const userSettings = await this.prisma.userSettings.findUnique({
      where: { userId },
      select: { userCode: true },
    });

    const userCode = userSettings?.userCode;

    // Requirement 3.4: If userCode is not set, throw error
    if (!userCode) {
      throw new UserCodeNotSetError();
    }

    // Get current year (4 digits)
    const now = new Date();
    const year = now.getFullYear(); // 2025

    // Get next sequence number
    const sequence = await this.getNextLeadSequence(userId, userCode, year);

    // Format: UC-YYYY-NNNN
    // Requirement 3.1: Use user code as prefix
    // Requirement 3.2: Format example "DL-2025-0001"
    return `${userCode}-${year}-${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Get the next lead sequence number for a user
   * 
   * Finds the highest sequence number for the user's leads in the current year
   * and returns the next sequence number.
   * 
   * @param userId - The user ID
   * @param userCode - The user's code
   * @param year - The year to get sequence for
   * @returns Next sequence number
   * 
   * Validates: Requirement 3.3
   */
  async getNextLeadSequence(userId: string, userCode?: string, year?: number): Promise<number> {
    // If userCode not provided, fetch it
    let resolvedUserCode = userCode;
    if (!resolvedUserCode) {
      const userSettings = await this.prisma.userSettings.findUnique({
        where: { userId },
        select: { userCode: true },
      });
      resolvedUserCode = userSettings?.userCode ?? undefined;
      
      if (!resolvedUserCode) {
        throw new UserCodeNotSetError();
      }
    }

    // If year not provided, use current year
    const resolvedYear = year ?? new Date().getFullYear();

    // Build prefix for searching: UC-YYYY-
    const prefix = `${resolvedUserCode}-${resolvedYear}-`;

    // Find the last lead number with this prefix for this user
    const lastLead = await this.prisma.lead.findFirst({
      where: {
        userId,
        leadNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        leadNumber: 'desc',
      },
      select: {
        leadNumber: true,
      },
    });

    // If no previous lead, start at 1
    if (!lastLead) {
      return 1;
    }

    // Extract sequence from last lead number
    // Format: UC-YYYY-NNNN
    const parts = lastLead.leadNumber.split('-');
    if (parts.length >= 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        return lastSeq + 1;
      }
    }

    // Fallback to 1 if parsing fails
    return 1;
  }
}

// Export singleton instance
export const leadNumberService = new LeadNumberService();

export default leadNumberService;
