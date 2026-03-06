/**
 * Customer Note Service
 * 메모 CRUD, 고정, @멘션 알림
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createNote(params: {
  customerId: string;
  content: string;
  mentions?: string[];
  createdBy: string;
}) {
  return prisma.customerNote.create({
    data: {
      customerId: params.customerId,
      content: params.content,
      mentions: params.mentions || [],
      createdBy: params.createdBy,
    },
  });
}

export async function updateNote(noteId: string, data: { content?: string; isPinned?: boolean }) {
  return prisma.customerNote.update({
    where: { id: noteId },
    data,
  });
}

export async function deleteNote(noteId: string) {
  return prisma.customerNote.delete({ where: { id: noteId } });
}

export async function getNotes(customerId: string, page = 1, limit = 20) {
  const [data, total] = await Promise.all([
    prisma.customerNote.findMany({
      where: { customerId },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customerNote.count({ where: { customerId } }),
  ]);

  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function getPinnedNotes(customerId: string) {
  return prisma.customerNote.findMany({
    where: { customerId, isPinned: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function togglePin(noteId: string) {
  const note = await prisma.customerNote.findUnique({ where: { id: noteId } });
  if (!note) throw new Error('메모를 찾을 수 없습니다.');
  return prisma.customerNote.update({
    where: { id: noteId },
    data: { isPinned: !note.isPinned },
  });
}
