/**
 * Customer Tag Service
 * 태그 CRUD 및 일괄 작업
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function addTag(customerId: string, name: string, color: string | null, createdBy: string) {
  return prisma.customerTag.upsert({
    where: { customerId_name: { customerId, name } },
    update: { color },
    create: { customerId, name, color, createdBy },
  });
}

export async function removeTag(customerId: string, tagId: string) {
  return prisma.customerTag.delete({ where: { id: tagId } });
}

export async function getCustomerTags(customerId: string) {
  return prisma.customerTag.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAllTagNames() {
  const tags = await prisma.customerTag.findMany({
    select: { name: true, color: true },
    distinct: ['name'],
    orderBy: { name: 'asc' },
  });
  return tags;
}

export async function bulkAddTags(customerIds: string[], tagName: string, color: string | null, createdBy: string) {
  const ops = customerIds.map((customerId) =>
    prisma.customerTag.upsert({
      where: { customerId_name: { customerId, name: tagName } },
      update: {},
      create: { customerId, name: tagName, color, createdBy },
    })
  );
  return prisma.$transaction(ops);
}

export async function bulkRemoveTags(customerIds: string[], tagName: string) {
  return prisma.customerTag.deleteMany({
    where: { customerId: { in: customerIds }, name: tagName },
  });
}
