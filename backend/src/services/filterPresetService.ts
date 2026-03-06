/**
 * Filter Preset Service
 * 필터 프리셋 CRUD
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function createPreset(params: {
  userId: string;
  name: string;
  filters: Prisma.InputJsonValue;
  sortBy?: string;
  sortOrder?: string;
}) {
  return prisma.filterPreset.create({ data: params });
}

export async function getPresets(userId: string) {
  return prisma.filterPreset.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
  });
}

export async function updatePreset(presetId: string, data: {
  name?: string;
  filters?: Prisma.InputJsonValue;
  sortBy?: string;
  sortOrder?: string;
  isDefault?: boolean;
}) {
  return prisma.filterPreset.update({ where: { id: presetId }, data });
}

export async function deletePreset(presetId: string) {
  return prisma.filterPreset.delete({ where: { id: presetId } });
}

export async function setDefaultPreset(userId: string, presetId: string) {
  await prisma.filterPreset.updateMany({
    where: { userId, isDefault: true },
    data: { isDefault: false },
  });
  return prisma.filterPreset.update({
    where: { id: presetId },
    data: { isDefault: true },
  });
}
