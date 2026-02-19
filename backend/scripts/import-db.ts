// JSON 백업에서 DB 복원
// 사용법: npx ts-node scripts/import-db.ts <backup_file>
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function importAll() {
  const backupFile = process.argv[2];
  if (!backupFile) {
    console.error('사용법: npx ts-node scripts/import-db.ts <backup_file>');
    console.error('예시: npx ts-node scripts/import-db.ts exports/db_export_2026-02-19.json');
    process.exit(1);
  }

  const filepath = path.resolve(backupFile);
  if (!fs.existsSync(filepath)) {
    console.error(`❌ 파일을 찾을 수 없습니다: ${filepath}`);
    process.exit(1);
  }

  console.log(`🔄 복원 시작: ${backupFile}`);
  const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

  // 복원 순서 (외래키 의존성 고려)
  const restoreOrder = [
    { name: 'users', model: prisma.user },
    { name: 'customers', model: prisma.customer },
    { name: 'requesters', model: prisma.requester },
    { name: 'pipelineStages', model: prisma.pipelineStage },
    { name: 'stageTasks', model: prisma.stageTask },
    { name: 'leads', model: prisma.lead },
    { name: 'quotations', model: prisma.quotation },
    { name: 'contracts', model: prisma.contract },
    { name: 'studies', model: prisma.study },
    { name: 'activities', model: prisma.activity },
    { name: 'notifications', model: prisma.notification },
    { name: 'systemSettings', model: prisma.systemSetting },
    { name: 'packageTemplates', model: prisma.packageTemplate },
    { name: 'announcements', model: prisma.announcement },
    { name: 'announcementComments', model: prisma.announcementComment },
    { name: 'userSettings', model: prisma.userSettings },
    { name: 'companyInfo', model: prisma.companyInfo },
    { name: 'toxicityTests', model: prisma.toxicityTest },
    { name: 'toxicityCategories', model: prisma.toxicityCategory },
    { name: 'animalClasses', model: prisma.animalClass },
    { name: 'species', model: prisma.species },
    { name: 'routes', model: prisma.route },
    { name: 'efficacyPriceItems', model: prisma.efficacyPriceItem },
    { name: 'efficacyModels', model: prisma.efficacyModel },
    { name: 'modalities', model: prisma.modality },
    { name: 'clinicalTestItems', model: prisma.clinicalTestItem },
    { name: 'clinicalQcSettings', model: prisma.clinicalQcSetting },
  ];

  for (const { name, model } of restoreOrder) {
    const rows = data[name];
    if (!rows || rows.length === 0) {
      console.log(`  - ${name}: 데이터 없음, 건너뜀`);
      continue;
    }

    try {
      // 날짜 문자열을 Date 객체로 변환
      const parsed = rows.map((row: Record<string, unknown>) => {
        const result = { ...row };
        for (const [key, val] of Object.entries(result)) {
          if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
            result[key] = new Date(val);
          }
        }
        return result;
      });

      // createMany로 일괄 삽입 (skipDuplicates로 중복 방지)
      const result = await (model as any).createMany({
        data: parsed,
        skipDuplicates: true,
      });
      console.log(`  ✓ ${name}: ${result.count}건 복원`);
    } catch (e: any) {
      console.log(`  ✗ ${name}: ${e.message.slice(0, 100)}`);
    }
  }

  console.log('\n✅ 복원 완료');
  await prisma.$disconnect();
}

importAll().catch(console.error);
