/**
 * Data Quality Service
 * 
 * 고객 데이터 품질 점수 산출 및 중복 감지 엔진
 */

import { PrismaClient, Customer } from '@prisma/client';

const prisma = new PrismaClient();

interface DataQualityResult {
  score: number;
  missingFields: string[];
  fieldScores: Record<string, { weight: number; filled: boolean }>;
}

interface DuplicateCandidate {
  customerId: string;
  companyName: string;
  contactName: string;
  phone: string | null;
  email: string | null;
  similarityScore: number;
  matchDetails: {
    companyNameSimilarity: number;
    phoneMatch: boolean;
    emailMatch: boolean;
  };
}

const REQUIRED_FIELDS: { field: keyof Customer; label: string; weight: number }[] = [
  { field: 'company', label: '회사명', weight: 20 },
  { field: 'name', label: '담당자명', weight: 20 },
  { field: 'phone', label: '연락처', weight: 15 },
  { field: 'email', label: '이메일', weight: 15 },
  { field: 'address', label: '주소', weight: 15 },
  { field: 'segment', label: '세그먼트', weight: 15 },
];

/**
 * 데이터 품질 점수 산출
 */
export function calculateDataQualityScore(customer: Customer): DataQualityResult {
  const missingFields: string[] = [];
  const fieldScores: Record<string, { weight: number; filled: boolean }> = {};
  let totalScore = 0;

  for (const { field, label, weight } of REQUIRED_FIELDS) {
    const value = customer[field];
    const filled = value !== null && value !== undefined && String(value).trim() !== '';
    fieldScores[label] = { weight, filled };
    if (filled) {
      totalScore += weight;
    } else {
      missingFields.push(label);
    }
  }

  return { score: totalScore, missingFields, fieldScores };
}

/**
 * Levenshtein 편집 거리 계산
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

/**
 * 문자열 유사도 (0~1)
 */
export function stringSimilarity(a: string, b: string): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const normA = a.trim().toLowerCase();
  const normB = b.trim().toLowerCase();
  if (normA === normB) return 1;
  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(normA, normB) / maxLen;
}

/**
 * 연락처 정규화 (숫자만 추출)
 */
function normalizePhone(phone: string | null): string {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
}

/**
 * 이메일 정규화
 */
function normalizeEmail(email: string | null): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

/**
 * 중복 고객 감지
 */
export async function detectDuplicates(
  companyName: string,
  phone?: string | null,
  email?: string | null,
  excludeId?: string
): Promise<DuplicateCandidate[]> {
  const customers = await prisma.customer.findMany({
    where: {
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: {
      id: true,
      company: true,
      name: true,
      phone: true,
      email: true,
    },
  });

  const candidates: DuplicateCandidate[] = [];
  const normPhone = normalizePhone(phone || null);
  const normEmail = normalizeEmail(email || null);

  for (const c of customers) {
    const companyNameSimilarity = stringSimilarity(companyName, c.company || '');
    const phoneMatch = normPhone !== '' && normalizePhone(c.phone) === normPhone;
    const emailMatch = normEmail !== '' && normalizeEmail(c.email) === normEmail;

    const similarityScore =
      companyNameSimilarity * 0.5 +
      (phoneMatch ? 1 : 0) * 0.25 +
      (emailMatch ? 1 : 0) * 0.25;

    if (similarityScore >= 0.7) {
      candidates.push({
        customerId: c.id,
        companyName: c.company || '',
        contactName: c.name,
        phone: c.phone,
        email: c.email,
        similarityScore,
        matchDetails: { companyNameSimilarity, phoneMatch, emailMatch },
      });
    }
  }

  return candidates.sort((a, b) => b.similarityScore - a.similarityScore);
}

/**
 * 고객 병합
 */
export async function mergeCustomers(
  primaryId: string,
  secondaryId: string,
  fieldSelections: Record<string, 'primary' | 'secondary'>,
  mergedBy: string
): Promise<void> {
  const [primary, secondary] = await Promise.all([
    prisma.customer.findUnique({ where: { id: primaryId } }),
    prisma.customer.findUnique({ where: { id: secondaryId } }),
  ]);

  if (!primary || !secondary) {
    throw new Error('병합 대상 고객을 찾을 수 없습니다.');
  }

  // 필드별 선택된 값으로 업데이트
  const updateData: Record<string, unknown> = {};
  for (const [field, source] of Object.entries(fieldSelections)) {
    if (source === 'secondary') {
      updateData[field] = (secondary as Record<string, unknown>)[field];
    }
  }

  await prisma.$transaction(async (tx) => {
    // 1. primary 고객 업데이트
    if (Object.keys(updateData).length > 0) {
      await tx.customer.update({
        where: { id: primaryId },
        data: updateData,
      });
    }

    // 2. secondary의 관계 데이터를 primary로 이전
    await tx.meetingRecord.updateMany({
      where: { customerId: secondaryId },
      data: { customerId: primaryId },
    });
    await tx.consultationRecord.updateMany({
      where: { customerId: secondaryId },
      data: { customerId: primaryId },
    });
    await tx.contract.updateMany({
      where: { customerId: secondaryId },
      data: { customerId: primaryId },
    });
    await tx.quotation.updateMany({
      where: { customerId: secondaryId },
      data: { customerId: primaryId },
    });
    await tx.testReception.updateMany({
      where: { customerId: secondaryId },
      data: { customerId: primaryId },
    });
    await tx.invoiceSchedule.updateMany({
      where: { customerId: secondaryId },
      data: { customerId: primaryId },
    });
    await tx.customerNote.updateMany({
      where: { customerId: secondaryId },
      data: { customerId: primaryId },
    });
    await tx.customerDocument.updateMany({
      where: { customerId: secondaryId },
      data: { customerId: primaryId },
    });

    // 3. secondary 소프트 삭제
    await tx.customer.update({
      where: { id: secondaryId },
      data: { deletedAt: new Date() },
    });

    // 4. 감사 로그 기록
    await tx.customerAuditLog.create({
      data: {
        customerId: primaryId,
        action: 'MERGE',
        metadata: {
          mergedFromId: secondaryId,
          mergedFromCompany: secondary.company,
          fieldSelections,
        },
        changedBy: mergedBy,
      },
    });
  });
}
