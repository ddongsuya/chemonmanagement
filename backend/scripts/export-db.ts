// DB 전체 데이터를 JSON으로 내보내기
// 사용법: npx ts-node scripts/export-db.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportAll() {
  console.log('📦 DB 데이터 내보내기 시작...');

  const data: Record<string, unknown[]> = {};

  // 모든 테이블 데이터 수집
  const tables = [
    { name: 'users', fn: () => prisma.user.findMany() },
    { name: 'leads', fn: () => prisma.lead.findMany() },
    { name: 'quotations', fn: () => prisma.quotation.findMany() },
    { name: 'contracts', fn: () => prisma.contract.findMany() },
    { name: 'studies', fn: () => prisma.study.findMany() },
    { name: 'customers', fn: () => prisma.customer.findMany() },
    { name: 'requesters', fn: () => prisma.requester.findMany() },
    { name: 'pipelineStages', fn: () => prisma.pipelineStage.findMany() },
    { name: 'stageTasks', fn: () => prisma.stageTask.findMany() },
    { name: 'activities', fn: () => prisma.activity.findMany() },
    { name: 'notifications', fn: () => prisma.notification.findMany() },
    { name: 'systemSettings', fn: () => prisma.systemSetting.findMany() },
    { name: 'packageTemplates', fn: () => prisma.packageTemplate.findMany() },
    { name: 'announcements', fn: () => prisma.announcement.findMany() },
    { name: 'announcementComments', fn: () => prisma.announcementComment.findMany() },
    { name: 'userSettings', fn: () => prisma.userSettings.findMany() },
    { name: 'companyInfo', fn: () => prisma.companyInfo.findMany() },
    { name: 'toxicityTests', fn: () => prisma.toxicityTest.findMany() },
    { name: 'toxicityCategories', fn: () => prisma.toxicityCategory.findMany() },
    { name: 'animalClasses', fn: () => prisma.animalClass.findMany() },
    { name: 'species', fn: () => prisma.species.findMany() },
    { name: 'routes', fn: () => prisma.route.findMany() },
    { name: 'efficacyPriceItems', fn: () => prisma.efficacyPriceItem.findMany() },
    { name: 'efficacyModels', fn: () => prisma.efficacyModel.findMany() },
    { name: 'modalities', fn: () => prisma.modality.findMany() },
    { name: 'clinicalTestItems', fn: () => prisma.clinicalTestItem.findMany() },
    { name: 'clinicalQcSettings', fn: () => prisma.clinicalQcSetting.findMany() },
  ];

  for (const table of tables) {
    try {
      const rows = await table.fn();
      data[table.name] = rows as unknown[];
      console.log(`  ✓ ${table.name}: ${rows.length}건`);
    } catch (e: any) {
      console.log(`  ✗ ${table.name}: ${e.message}`);
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `db_export_${timestamp}.json`;
  const filepath = path.join(__dirname, '..', 'exports', filename);

  fs.writeFileSync(filepath, JSON.stringify(data, replacer, 2), 'utf-8');
  
  const size = (fs.statSync(filepath).size / 1024).toFixed(1);
  console.log(`\n✅ 내보내기 완료: ${filename} (${size} KB)`);

  await prisma.$disconnect();
}

function replacer(_key: string, value: unknown) {
  if (typeof value === 'bigint') return Number(value);
  return value;
}

exportAll().catch(console.error);
