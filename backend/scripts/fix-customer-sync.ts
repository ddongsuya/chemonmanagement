/**
 * 고객사 데이터 동기화 수정 스크립트
 * 
 * 1) Customer.company가 null인 레코드 → Lead.companyName 또는 name으로 채움
 * 2) 동일 회사의 중복 Customer 레코드 → 계약/견적서를 주 레코드로 재연결
 * 3) email 필드가 object인 경우 → 문자열로 변환
 * 
 * 실행: npx ts-node scripts/fix-customer-sync.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== 고객사 데이터 동기화 수정 시작 ===\n');

  // 1단계: company가 null인 Customer 채우기
  console.log('--- 1단계: company 필드 채우기 ---');
  const customersWithoutCompany = await prisma.customer.findMany({
    where: { company: null, deletedAt: null },
    include: {
      leads: {
        where: { deletedAt: null },
        select: { companyName: true },
        take: 1,
      },
    },
  });

  console.log(`company가 null인 고객: ${customersWithoutCompany.length}건`);
  let step1Updated = 0;
  for (const customer of customersWithoutCompany) {
    const companyName = customer.leads[0]?.companyName || customer.name;
    await prisma.customer.update({
      where: { id: customer.id },
      data: { company: companyName },
    });
    console.log(`  [${customer.id}] name="${customer.name}" → company="${companyName}"`);
    step1Updated++;
  }
  console.log(`  → ${step1Updated}건 업데이트\n`);

  // 2단계: 동일 회사 중복 Customer 레코드 찾기 및 계약/견적서 재연결
  console.log('--- 2단계: 중복 Customer 병합 (계약/견적서 재연결) ---');

  // userId별로 그룹핑
  const allCustomers = await prisma.customer.findMany({
    where: { deletedAt: null },
    select: {
      id: true, userId: true, company: true, name: true, email: true,
      createdAt: true, updatedAt: true,
      _count: {
        select: {
          contracts: true,
          quotations: true,
          leads: true,
          meetingRecords: true,
          requesters: true,
        },
      },
    },
  });

  // userId + company 기준으로 그룹핑
  const groups = new Map<string, typeof allCustomers>();
  for (const c of allCustomers) {
    const key = `${c.userId}::${(c.company || c.name || '').toLowerCase().trim()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }

  let step2Merged = 0;
  for (const [key, group] of groups) {
    if (group.length <= 1) continue;

    // 주 레코드 선택: 데이터가 가장 많은 것 (관계 수 합산)
    const sorted = group.sort((a, b) => {
      const scoreA = a._count.contracts + a._count.quotations + a._count.leads + a._count.meetingRecords + a._count.requesters;
      const scoreB = b._count.contracts + b._count.quotations + b._count.leads + b._count.meetingRecords + b._count.requesters;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); // 오래된 것 우선
    });

    const primary = sorted[0];
    const duplicates = sorted.slice(1);

    console.log(`  중복 그룹: "${key}" (${group.length}건)`);
    console.log(`    주 레코드: [${primary.id}] company="${primary.company}" name="${primary.name}"`);

    for (const dup of duplicates) {
      console.log(`    병합 대상: [${dup.id}] company="${dup.company}" name="${dup.name}"`);
      console.log(`      계약: ${dup._count.contracts}, 견적: ${dup._count.quotations}, 리드: ${dup._count.leads}`);

      // 계약 재연결
      if (dup._count.contracts > 0) {
        const updated = await prisma.contract.updateMany({
          where: { customerId: dup.id, deletedAt: null },
          data: { customerId: primary.id },
        });
        console.log(`      → 계약 ${updated.count}건 재연결`);
      }

      // 견적서 재연결
      if (dup._count.quotations > 0) {
        const updated = await prisma.quotation.updateMany({
          where: { customerId: dup.id, deletedAt: null },
          data: { customerId: primary.id },
        });
        console.log(`      → 견적서 ${updated.count}건 재연결`);
      }

      // 리드 재연결
      if (dup._count.leads > 0) {
        const updated = await prisma.lead.updateMany({
          where: { customerId: dup.id, deletedAt: null },
          data: { customerId: primary.id },
        });
        console.log(`      → 리드 ${updated.count}건 재연결`);
      }

      // 미팅 기록 재연결
      if (dup._count.meetingRecords > 0) {
        const updated = await prisma.meetingRecord.updateMany({
          where: { customerId: dup.id },
          data: { customerId: primary.id },
        });
        console.log(`      → 미팅 ${updated.count}건 재연결`);
      }

      // 의뢰자 재연결
      if (dup._count.requesters > 0) {
        const updated = await prisma.requester.updateMany({
          where: { customerId: dup.id },
          data: { customerId: primary.id },
        });
        console.log(`      → 의뢰자 ${updated.count}건 재연결`);
      }

      // 상담기록 재연결
      await prisma.consultationRecord.updateMany({
        where: { customerId: dup.id },
        data: { customerId: primary.id },
      });

      // 시험접수 재연결
      await prisma.testReception.updateMany({
        where: { customerId: dup.id },
        data: { customerId: primary.id },
      });

      // 세금계산서 재연결
      await prisma.invoiceSchedule.updateMany({
        where: { customerId: dup.id },
        data: { customerId: primary.id },
      });

      // 캘린더 이벤트 재연결
      await prisma.calendarEvent.updateMany({
        where: { customerId: dup.id },
        data: { customerId: primary.id },
      });

      // 임상병리 견적서 재연결
      await prisma.clinicalQuotation.updateMany({
        where: { customerId: dup.id },
        data: { customerId: primary.id },
      });

      // 중복 레코드 소프트 삭제
      await prisma.customer.update({
        where: { id: dup.id },
        data: { deletedAt: new Date() },
      });
      console.log(`      → 중복 레코드 소프트 삭제 완료`);
      step2Merged++;
    }
  }
  console.log(`  → ${step2Merged}건 병합 완료\n`);

  // 3단계: email 필드가 object인 경우 수정
  console.log('--- 3단계: email 필드 정리 ---');
  const allCustomersForEmail = await prisma.customer.findMany({
    where: { deletedAt: null, email: { not: null } },
    select: { id: true, email: true },
  });

  let step3Fixed = 0;
  for (const c of allCustomersForEmail) {
    if (c.email && typeof c.email === 'object') {
      const emailStr = JSON.stringify(c.email);
      console.log(`  [${c.id}] email이 object: ${emailStr}`);
      // 객체에서 이메일 추출 시도
      const emailObj = c.email as any;
      const extracted = emailObj.email || emailObj.value || emailObj.address || '';
      await prisma.customer.update({
        where: { id: c.id },
        data: { email: typeof extracted === 'string' ? extracted : '' },
      });
      console.log(`    → "${extracted}"로 수정`);
      step3Fixed++;
    }
  }
  console.log(`  → ${step3Fixed}건 수정\n`);

  console.log('=== 완료 ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
