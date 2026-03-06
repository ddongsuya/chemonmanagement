/**
 * Customer Document Service
 * 문서 업로드/관리
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/gif',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export async function uploadDocument(params: {
  customerId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  uploadedBy: string;
}) {
  if (params.fileSize > MAX_FILE_SIZE) {
    throw new Error('파일 크기가 10MB를 초과합니다.');
  }
  if (!ALLOWED_MIME_TYPES.includes(params.mimeType)) {
    throw new Error('허용되지 않는 파일 형식입니다.');
  }

  return prisma.customerDocument.create({ data: params });
}

export async function getDocuments(customerId: string) {
  return prisma.customerDocument.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDocument(docId: string) {
  return prisma.customerDocument.findUnique({ where: { id: docId } });
}

export async function deleteDocument(docId: string) {
  return prisma.customerDocument.delete({ where: { id: docId } });
}
