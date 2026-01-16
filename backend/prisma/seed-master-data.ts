import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface MasterData {
  meta: {
    version: string;
    totalItems: number;
    generatedAt: string;
  };
  masters: {
    categories: Array<{
      id: number;
      sheet: string;
      category: string;
      subcategory: string;
    }>;
    animalClasses: Array<{ id: number; name: string }>;
    species: Array<{ id: number; name: string }>;
    routes: Array<{ id: number; name: string }>;
    durations: string[];
  };
  items: Array<{
    id: number;
    sheet: string;
    category: string;
    subcategory: string;
    testName: string | null;
    oecd: string | null;
    testType: string | null;
    animalClass: string | null;
    species: string | null;
    sexConfig: string | null;
    animalsPerSex: number | null;
    controlGroups: number | null;
    testGroups: number | null;
    totalGroups: number | null;
    routeGroup: string | null;
    routes: string | null;
    duration: string | null;
    leadTime: string | null;
    price: number | null;
    samplingPointsTest: number | null;
    samplingPointsControl: number | null;
    samplingCount: number | null;
    samplingDays: string | null;
    totalSamplingPoints: number | null;
    priceWithAnalysis: number | null;
    priceSamplingOnly: string | number | null;
    optionNote: string | null;
    remarks: string | null;
  }>;
}

async function main() {
  console.log('🌱 Starting master data seeding (new structure)...');

  // 새 마스터데이터 파일 로드
  const dataPath = path.join(__dirname, '../../chemon-quotation/data/toxicity_master_data.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const masterData: MasterData = JSON.parse(rawData);

  console.log(`📊 Meta: version=${masterData.meta.version}, totalItems=${masterData.meta.totalItems}`);

  // 1. 카테고리 시딩
  await seedCategories(masterData.masters.categories);

  // 2. 동물 분류 시딩
  await seedAnimalClasses(masterData.masters.animalClasses);

  // 3. 동물 종 시딩
  await seedSpecies(masterData.masters.species);

  // 4. 투여경로 시딩
  await seedRoutes(masterData.masters.routes);

  // 5. 독성시험 항목 시딩
  await seedToxicityTests(masterData.items);

  // 6. 효력시험 데이터 시딩 (기존 유지)
  await seedEfficacyPriceItems();
  await seedEfficacyModels();
  await seedModalities();

  console.log('✅ Master data seeding completed!');
}

async function seedCategories(categories: MasterData['masters']['categories']) {
  console.log('📋 Seeding toxicity categories...');
  
  await prisma.toxicityCategory.deleteMany({});
  
  for (const cat of categories) {
    await prisma.toxicityCategory.create({
      data: {
        categoryId: cat.id,
        sheet: cat.sheet,
        category: cat.category,
        subcategory: cat.subcategory,
      },
    });
  }
  
  console.log(`✅ Toxicity categories: ${categories.length} created`);
}

async function seedAnimalClasses(animalClasses: MasterData['masters']['animalClasses']) {
  console.log('🐭 Seeding animal classes...');
  
  await prisma.animalClass.deleteMany({});
  
  for (const ac of animalClasses) {
    await prisma.animalClass.create({
      data: {
        classId: ac.id,
        name: ac.name,
      },
    });
  }
  
  console.log(`✅ Animal classes: ${animalClasses.length} created`);
}

async function seedSpecies(species: MasterData['masters']['species']) {
  console.log('🧬 Seeding species...');
  
  await prisma.species.deleteMany({});
  
  for (const sp of species) {
    await prisma.species.create({
      data: {
        speciesId: sp.id,
        name: sp.name,
      },
    });
  }
  
  console.log(`✅ Species: ${species.length} created`);
}

async function seedRoutes(routes: MasterData['masters']['routes']) {
  console.log('💉 Seeding routes...');
  
  await prisma.route.deleteMany({});
  
  for (const rt of routes) {
    await prisma.route.create({
      data: {
        routeId: rt.id,
        name: rt.name,
      },
    });
  }
  
  console.log(`✅ Routes: ${routes.length} created`);
}

async function seedToxicityTests(items: MasterData['items']) {
  console.log('🧪 Seeding toxicity tests...');
  
  await prisma.toxicityTest.deleteMany({});
  
  let created = 0;
  let skipped = 0;

  for (const item of items) {
    try {
      // price가 숫자가 아닌 경우 null로 처리
      let priceValue = null;
      if (item.price !== null && typeof item.price === 'number') {
        priceValue = item.price;
      }
      
      // priceWithAnalysis도 동일하게 처리
      let priceWithAnalysisValue = null;
      if (item.priceWithAnalysis !== null && typeof item.priceWithAnalysis === 'number') {
        priceWithAnalysisValue = item.priceWithAnalysis;
      }

      await prisma.toxicityTest.create({
        data: {
          itemId: item.id,
          sheet: item.sheet,
          category: item.category,
          subcategory: item.subcategory,
          testName: item.testName,
          oecd: item.oecd,
          testType: item.testType,
          animalClass: item.animalClass,
          species: item.species,
          sexConfig: item.sexConfig,
          animalsPerSex: item.animalsPerSex,
          controlGroups: item.controlGroups,
          testGroups: item.testGroups,
          totalGroups: item.totalGroups,
          routeGroup: item.routeGroup,
          routes: item.routes,
          duration: item.duration,
          leadTime: item.leadTime,
          price: priceValue,
          samplingPointsTest: item.samplingPointsTest,
          samplingPointsControl: item.samplingPointsControl,
          samplingCount: item.samplingCount,
          samplingDays: item.samplingDays,
          totalSamplingPoints: item.totalSamplingPoints,
          priceWithAnalysis: priceWithAnalysisValue,
          priceSamplingOnly: item.priceSamplingOnly?.toString() || null,
          optionNote: item.optionNote,
          remarks: item.remarks,
        },
      });
      created++;
    } catch (error) {
      console.error(`Error seeding item ${item.id}:`, error);
      skipped++;
    }
  }

  console.log(`✅ Toxicity tests: ${created} created, ${skipped} skipped`);
}

async function seedEfficacyPriceItems() {
  console.log('💰 Seeding efficacy price items...');
  
  const dataPath = path.join(__dirname, '../../chemon-quotation/data/efficacy_master_data.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const data = JSON.parse(rawData);
  
  const items = data.price_master || [];
  console.log(`Found ${items.length} efficacy price items`);

  let created = 0;

  for (const item of items) {
    try {
      await prisma.efficacyPriceItem.upsert({
        where: { itemId: item.item_id },
        update: {
          category: item.category,
          subcategory: item.subcategory || null,
          itemName: item.item_name,
          itemDetail: item.item_detail || null,
          unitPrice: item.unit_price || 0,
          unit: item.unit || null,
          remarks: item.remarks || null,
          isActive: item.is_active !== false,
        },
        create: {
          itemId: item.item_id,
          category: item.category,
          subcategory: item.subcategory || null,
          itemName: item.item_name,
          itemDetail: item.item_detail || null,
          unitPrice: item.unit_price || 0,
          unit: item.unit || null,
          remarks: item.remarks || null,
          isActive: item.is_active !== false,
        },
      });
      created++;
    } catch (error) {
      console.error(`Error seeding price item ${item.item_id}:`, error);
    }
  }

  console.log(`✅ Efficacy price items: ${created} created/updated`);
}

async function seedEfficacyModels() {
  console.log('🧬 Seeding efficacy models...');
  
  const dataPath = path.join(__dirname, '../../chemon-quotation/data/efficacy_master_data.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const data = JSON.parse(rawData);
  
  const models = data.models || [];
  console.log(`Found ${models.length} efficacy models`);

  let created = 0;

  for (const model of models) {
    try {
      await prisma.efficacyModel.upsert({
        where: { modelId: model.model_id },
        update: {
          modelName: model.model_name,
          category: model.category,
          indication: model.indication || null,
          animalType: model.animal_type || null,
          inductionMethod: model.induction_method || null,
          duration: model.duration || null,
          description: model.description || null,
          defaultItems: model.default_items || null,
          isActive: model.is_active !== false,
        },
        create: {
          modelId: model.model_id,
          modelName: model.model_name,
          category: model.category,
          indication: model.indication || null,
          animalType: model.animal_type || null,
          inductionMethod: model.induction_method || null,
          duration: model.duration || null,
          description: model.description || null,
          defaultItems: model.default_items || null,
          isActive: model.is_active !== false,
        },
      });
      created++;
    } catch (error) {
      console.error(`Error seeding model ${model.model_id}:`, error);
    }
  }

  console.log(`✅ Efficacy models: ${created} created/updated`);
}

async function seedModalities() {
  console.log('🏷️ Seeding modalities...');
  
  const modalities = [
    { code: 'SM', name: '저분자화합물', level: 1 },
    { code: 'SM-SYN', name: '합성의약품', level: 2, parentCode: 'SM' },
    { code: 'SM-NAT', name: '천연물의약품', level: 2, parentCode: 'SM' },
    { code: 'SM-CMB', name: '복합제', level: 2, parentCode: 'SM' },
    { code: 'BIO', name: '바이오의약품', level: 1 },
    { code: 'BIO-AB', name: '항체의약품', level: 2, parentCode: 'BIO' },
    { code: 'BIO-PEP', name: '펩타이드', level: 2, parentCode: 'BIO' },
    { code: 'BIO-PRO', name: '단백질의약품', level: 2, parentCode: 'BIO' },
    { code: 'ADV', name: '첨단바이오의약품', level: 1 },
    { code: 'ADV-CELL', name: '세포치료제', level: 2, parentCode: 'ADV' },
    { code: 'ADV-GENE', name: '유전자치료제', level: 2, parentCode: 'ADV' },
    { code: 'VAC', name: '백신', level: 1 },
    { code: 'MED', name: '의료기기', level: 1 },
    { code: 'COS', name: '화장품', level: 1 },
    { code: 'FOOD', name: '건강기능식품', level: 1 },
    { code: 'CHEM', name: '농약/화학물질', level: 1 },
  ];

  let created = 0;

  for (const mod of modalities) {
    await prisma.modality.upsert({
      where: { code: mod.code },
      update: {
        name: mod.name,
        level: mod.level,
        parentCode: mod.parentCode || null,
        isActive: true,
      },
      create: {
        code: mod.code,
        name: mod.name,
        level: mod.level,
        parentCode: mod.parentCode || null,
        isActive: true,
      },
    });
    created++;
  }

  console.log(`✅ Modalities: ${created} created/updated`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
