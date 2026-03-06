/**
 * Audit Log Service
 * 
 * 고객 데이터 변경 이력 추적
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuditLogFilters {
  customerId: string;
  fieldName?: string;
  changedBy?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

/**
 * 변경 이력 기록
 */
export async function logChange(params: {
  customerId: string;
  action: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
  changedBy: string;
}) {
  return prisma.customerAuditLog.create({
    data: {
      customerId: params.customerId,
      action: params.action,
      fieldName: params.fieldName,
      oldValue: params.oldValue,
      newValue: params.newValue,
      metadata: params.metadata || undefined,
      changedBy: params.changedBy,
    },
  });
}

/**
 * 객체 비교 후 변경된 필드 자동 감사 로그 생성
 */
export async function logFieldChanges(
  customerId: string,
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
  changedBy: string
) {
  const logs = [];
  for (const key of Object.keys(newData)) {
    const oldVal = oldData[key];
    const newVal = newData[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      logs.push(
        logChange({
          customerId,
          action: 'UPDATE',
          fieldName: key,
          oldValue: oldVal != null ? String(oldVal) : undefined,
          newValue: newVal != null ? String(newVal) : undefined,
          changedBy,
        })
      );
    }
  }
  return Promise.all(logs);
}

/**
 * 감사 로그 조회 (필터링 지원)
 */
export async function getAuditLogs(filters: AuditLogFilters) {
  const { customerId, fieldName, changedBy, fromDate, toDate, page = 1, limit = 20 } = filters;

  const where: Record<string, unknown> = { customerId };
  if (fieldName) where.fieldName = fieldName;
  if (changedBy) where.changedBy = changedBy;
  if (fromDate || toDate) {
    where.createdAt = {
      ...(fromDate ? { gte: fromDate } : {}),
      ...(toDate ? { lte: toDate } : {}),
    };
  }

  const [data, total] = await Promise.all([
    prisma.customerAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customerAuditLog.count({ where }),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
