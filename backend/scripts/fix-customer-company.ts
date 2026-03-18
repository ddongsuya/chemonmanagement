/**
 * 일회성 데이터 패치 스크립트
 * Customer.company가 null인 레코드에 대해 연결된 Lead의 companyName으로 채워줌
 * 
 * 실행: npx ts-node scripts/fix-customer-company.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // company가 null인 Customer 조회
  const customersWithoutCompany = await prisma.customer.findMany({
    where: {
      company: null,
      deletedAt: null,
    },
    include: {
      leads: {
        where: { deletedAt: null },
        select: { companyName: true },
        take: 1,
      },
    },
  });

  console.log(`company가 null인 고객: ${customersWithoutCompany.length}건`);

  let updated = 0;
  for (const customer of customersWithoutCompany) {
    const companyName = customer.leads[0]?.companyName || customer.name;
    await prisma.customer.update({
      where: { id: customer.id },
      data: { company: companyName },
    });
    console.log(`  [${customer.id}] ${customer.name} → company: "${companyName}"`);
    updated++;
  }

  console.log(`\n완료: ${updated}건 업데이트됨`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
