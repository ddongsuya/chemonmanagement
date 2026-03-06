/**
 * Custom Field Service
 * 커스텀 필드 정의 및 값 관리
 */

import { PrismaClient, CustomFieldType } from '@prisma/client';

const prisma = new PrismaClient();

export async function createField(params: {
  name: string;
  fieldType: CustomFieldType;
  options?: unknown;
  isRequired?: boolean;
  displayOrder?: number;
  createdBy: string;
}) {
  return prisma.customerCustomField.create({ data: params });
}

export async function getFields() {
  return prisma.customerCustomField.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
  });
}

export async function updateField(fieldId: string, data: {
  name?: string;
  fieldType?: CustomFieldType;
  options?: unknown;
  isRequired?: boolean;
  displayOrder?: number;
  isActive?: boolean;
}) {
  return prisma.customerCustomField.update({ where: { id: fieldId }, data });
}

export async function deleteField(fieldId: string) {
  return prisma.customerCustomField.update({
    where: { id: fieldId },
    data: { isActive: false },
  });
}

export async function getCustomerFieldValues(customerId: string) {
  return prisma.customerCustomFieldValue.findMany({
    where: { customerId },
    include: { field: true },
  });
}

export async function setCustomerFieldValue(customerId: string, fieldId: string, value: string) {
  return prisma.customerCustomFieldValue.upsert({
    where: { customerId_fieldId: { customerId, fieldId } },
    update: { value },
    create: { customerId, fieldId, value },
  });
}

export async function setCustomerFieldValues(
  customerId: string,
  values: { fieldId: string; value: string }[]
) {
  const ops = values.map((v) =>
    prisma.customerCustomFieldValue.upsert({
      where: { customerId_fieldId: { customerId, fieldId: v.fieldId } },
      update: { value: v.value },
      create: { customerId, fieldId: v.fieldId, value: v.value },
    })
  );
  return prisma.$transaction(ops);
}
