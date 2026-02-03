// prisma/seed.ts
// CHEMON 견적관리 시스템 - 초기 데이터 Seed
// 실행: npx prisma db seed

import { PrismaClient, CustomerGrade } from '@prisma/client';
import bcrypt from 'bcrypt';
import { seedClinicalPathology } from './seed-clinical-pathology';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  console.log('🌱 Seeding database...');

  // ==================== 0. 초기 관리자 계정 생성 ====================
  console.log('👤 Creating admin user...');

  const adminPassword = await bcrypt.hash('admin1234!', SALT_ROUNDS);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@chemon.co.kr' },
    update: {},
    create: {
      email: 'admin@chemon.co.kr',
      password: adminPassword,
      name: '시스템관리자',
      role: 'ADMIN',
      status: 'ACTIVE',
      department: 'SUPPORT',
      position: 'MANAGER',
      canViewAllSales: true,
    },
  });

  console.log(`✅ Admin user created: ${adminUser.email}`);
  console.log('   📧 Email: admin@chemon.co.kr');
  console.log('   🔑 Password: admin1234!');
  console.log('   ⚠️  Please change the password after first login!');

  // ==================== 1. 파이프라인 단계 생성 ====================
  console.log('📋 Creating pipeline stages...');

  const stages = await Promise.all([
    prisma.pipelineStage.upsert({
      where: { code: 'INQUIRY' },
      update: {},
      create: {
        name: '문의접수',
        code: 'INQUIRY',
        order: 1,
        color: '#3B82F6', // blue
        description: '고객 문의 최초 접수 단계',
        isDefault: true,
        isActive: true,
      },
    }),
    prisma.pipelineStage.upsert({
      where: { code: 'REVIEW' },
      update: {},
      create: {
        name: '검토',
        code: 'REVIEW',
        order: 2,
        color: '#EAB308', // yellow
        description: '시험 가능 여부 및 조건 검토',
        isDefault: false,
        isActive: true,
      },
    }),
    prisma.pipelineStage.upsert({
      where: { code: 'QUOTATION' },
      update: {},
      create: {
        name: '견적서 송부',
        code: 'QUOTATION',
        order: 3,
        color: '#22C55E', // green
        description: '견적서 작성 및 고객 발송',
        isDefault: false,
        isActive: true,
      },
    }),
    prisma.pipelineStage.upsert({
      where: { code: 'LAB_CHECK_1' },
      update: {},
      create: {
        name: '연구소 현황 파악',
        code: 'LAB_CHECK_1',
        order: 4,
        color: '#F97316', // orange
        description: '장비 및 인력 가용성 확인',
        isDefault: false,
        isActive: true,
      },
    }),
    prisma.pipelineStage.upsert({
      where: { code: 'TEST_REVIEW' },
      update: {},
      create: {
        name: '시험의뢰검토',
        code: 'TEST_REVIEW',
        order: 5,
        color: '#EF4444', // red
        description: '시험계획서 및 규제 요건 검토',
        isDefault: false,
        isActive: true,
      },
    }),
    prisma.pipelineStage.upsert({
      where: { code: 'CONTRACT' },
      update: {},
      create: {
        name: '계약진행',
        code: 'CONTRACT',
        order: 6,
        color: '#A855F7', // purple
        description: '계약서 작성 및 체결',
        isDefault: false,
        isActive: true,
      },
    }),
    prisma.pipelineStage.upsert({
      where: { code: 'LAB_CHECK_2' },
      update: {},
      create: {
        name: '연구소 현황 파악 (2차)',
        code: 'LAB_CHECK_2',
        order: 7,
        color: '#F97316', // orange
        description: '시험 준비 상태 및 물질 입고 확인',
        isDefault: false,
        isActive: true,
      },
    }),
    prisma.pipelineStage.upsert({
      where: { code: 'TEST_RECEIPT' },
      update: {},
      create: {
        name: '시험접수',
        code: 'TEST_RECEIPT',
        order: 8,
        color: '#06B6D4', // cyan
        description: '시험번호 부여 및 시험 시작',
        isDefault: false,
        isActive: true,
      },
    }),
    prisma.pipelineStage.upsert({
      where: { code: 'MANAGEMENT' },
      update: {},
      create: {
        name: '관리',
        code: 'MANAGEMENT',
        order: 9,
        color: '#6B7280', // gray
        description: '진행 관리 및 보고서 발행',
        isDefault: false,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${stages.length} pipeline stages`);

  // 단계별 ID 매핑
  const stageMap = stages.reduce((acc, stage) => {
    acc[stage.code] = stage.id;
    return acc;
  }, {} as Record<string, string>);

  // ==================== 2. 단계별 세부 태스크 생성 ====================
  console.log('📝 Creating stage tasks...');

  const tasks = [
    // 1. 문의접수 단계 태스크
    { stageCode: 'INQUIRY', name: '문의 내용 확인', order: 1, isRequired: true, description: '고객 문의 내용 파악 및 기록' },
    { stageCode: 'INQUIRY', name: '담당자 배정', order: 2, isRequired: true, description: '담당 영업/기술 담당자 지정' },
    { stageCode: 'INQUIRY', name: '초기 상담 완료', order: 3, isRequired: false, description: '유선 또는 이메일 초기 상담' },
    { stageCode: 'INQUIRY', name: '요구사항 정리', order: 4, isRequired: false, description: '고객 요구사항 문서화' },

    // 2. 검토 단계 태스크
    { stageCode: 'REVIEW', name: '시험 가능 여부 확인', order: 1, isRequired: true, description: '기술적 수행 가능성 검토' },
    { stageCode: 'REVIEW', name: '예상 일정 산출', order: 2, isRequired: false, description: '시험 소요 기간 산정' },
    { stageCode: 'REVIEW', name: '예상 비용 산출', order: 3, isRequired: false, description: '개략적인 비용 산정' },

    // 3. 견적서 송부 단계 태스크
    { stageCode: 'QUOTATION', name: '견적서 작성', order: 1, isRequired: true, description: '상세 견적서 작성' },
    { stageCode: 'QUOTATION', name: '내부 검토/승인', order: 2, isRequired: false, description: '팀장/관리자 견적 검토' },
    { stageCode: 'QUOTATION', name: '고객 발송', order: 3, isRequired: true, description: '견적서 이메일 발송' },
    { stageCode: 'QUOTATION', name: '견적 설명 미팅', order: 4, isRequired: false, description: '필요시 견적 상세 설명' },

    // 4. 연구소 현황 파악 (1차) 태스크
    { stageCode: 'LAB_CHECK_1', name: '장비 가용성 확인', order: 1, isRequired: false, description: '필요 장비 사용 가능 여부' },
    { stageCode: 'LAB_CHECK_1', name: '인력 배정 검토', order: 2, isRequired: false, description: '시험 수행 인력 확인' },
    { stageCode: 'LAB_CHECK_1', name: '시험 일정 조율', order: 3, isRequired: false, description: '예상 시험 일정 수립' },

    // 5. 시험의뢰검토 단계 태스크
    { stageCode: 'TEST_REVIEW', name: '시험계획서 검토', order: 1, isRequired: true, description: '시험계획서 내용 검토' },
    { stageCode: 'TEST_REVIEW', name: '규제 요건 확인', order: 2, isRequired: false, description: 'GLP/OECD 등 규제 요건' },
    { stageCode: 'TEST_REVIEW', name: '물질 정보 확인', order: 3, isRequired: false, description: '시험물질 특성 및 취급 정보' },
    { stageCode: 'TEST_REVIEW', name: '특이사항 검토', order: 4, isRequired: false, description: '특별 요구사항 검토' },
    { stageCode: 'TEST_REVIEW', name: '최종 승인', order: 5, isRequired: true, description: '시험 수행 최종 승인' },

    // 6. 계약진행 단계 태스크
    { stageCode: 'CONTRACT', name: '계약서 작성', order: 1, isRequired: true, description: '계약서 초안 작성' },
    { stageCode: 'CONTRACT', name: '법무 검토', order: 2, isRequired: false, description: '법무팀 계약서 검토' },
    { stageCode: 'CONTRACT', name: '계약 조건 협의', order: 3, isRequired: false, description: '고객과 계약 조건 협의' },
    { stageCode: 'CONTRACT', name: '계약 체결', order: 4, isRequired: true, description: '최종 계약 서명' },

    // 7. 연구소 현황 파악 (2차) 태스크
    { stageCode: 'LAB_CHECK_2', name: '시험 준비 상태 확인', order: 1, isRequired: false, description: '시험 시작 준비 완료 확인' },
    { stageCode: 'LAB_CHECK_2', name: '물질 입고 확인', order: 2, isRequired: true, description: '시험물질 입고 및 상태 확인' },

    // 8. 시험접수 단계 태스크
    { stageCode: 'TEST_RECEIPT', name: '시험번호 부여', order: 1, isRequired: true, description: '공식 시험번호 생성' },
    { stageCode: 'TEST_RECEIPT', name: '시험계획서 확정', order: 2, isRequired: false, description: '최종 시험계획서 승인' },
    { stageCode: 'TEST_RECEIPT', name: '시험 시작', order: 3, isRequired: true, description: '시험 공식 시작' },

    // 9. 관리 단계 태스크
    { stageCode: 'MANAGEMENT', name: '진행 상황 모니터링', order: 1, isRequired: false, description: '시험 진행 상태 추적' },
    { stageCode: 'MANAGEMENT', name: '중간보고', order: 2, isRequired: false, description: '필요시 중간 보고서 제공' },
    { stageCode: 'MANAGEMENT', name: '이슈 대응', order: 3, isRequired: false, description: '시험 중 발생 이슈 처리' },
    { stageCode: 'MANAGEMENT', name: '최종보고서 작성', order: 4, isRequired: true, description: '시험 완료 후 보고서 작성' },
    { stageCode: 'MANAGEMENT', name: '보고서 검토/승인', order: 5, isRequired: true, description: 'QA 검토 및 SD 승인' },
    { stageCode: 'MANAGEMENT', name: '보고서 발행', order: 6, isRequired: true, description: '최종 보고서 발행 및 전달' },
    { stageCode: 'MANAGEMENT', name: '완료 처리', order: 7, isRequired: true, description: '시험 공식 완료 처리' },
  ];

  // 기존 태스크 삭제 후 재생성 (upsert가 복잡해서 deleteMany + createMany 사용)
  await prisma.stageTask.deleteMany({});
  
  const createdTasks = await prisma.stageTask.createMany({
    data: tasks.map(task => ({
      stageId: stageMap[task.stageCode],
      name: task.name,
      order: task.order,
      isRequired: task.isRequired,
      description: task.description,
      isActive: true,
    })),
  });

  console.log(`✅ Created ${createdTasks.count} stage tasks`);

  // ==================== 3. 시스템 설정 초기값 ====================
  console.log('⚙️ Creating system settings...');

  const settings = [
    { key: 'LEAD_NUMBER_PREFIX', value: 'LD' },
    { key: 'LEAD_NUMBER_YEAR_FORMAT', value: 'YYYY' },
    { key: 'QUOTATION_NUMBER_PREFIX', value: 'QT' },
    { key: 'CONTRACT_NUMBER_PREFIX', value: 'CT' },
    { key: 'STUDY_NUMBER_PREFIX', value: 'ST' },
    { key: 'CONSULTATION_NUMBER_PREFIX', value: 'CR' },
    { key: 'AMENDMENT_NUMBER_SUFFIX', value: 'A' },
    { key: 'DEFAULT_QUOTATION_VALID_DAYS', value: '30' },
    { key: 'DEFAULT_VAT_RATE', value: '10' },
    { key: 'COMPANY_NAME', value: '(주)코어스템켐온' },
    { key: 'COMPANY_ADDRESS', value: '경기도 용인시 기흥구 흥덕중앙로 120' },
    { key: 'COMPANY_PHONE', value: '031-888-9999' },
    { key: 'COMPANY_FAX', value: '031-888-9998' },
    { key: 'COMPANY_EMAIL', value: 'info@corestemchemon.com' },
    { key: 'COMPANY_BUSINESS_NUMBER', value: '123-45-67890' },
    { key: 'COMPANY_CEO', value: '홍길동' },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log(`✅ Created ${settings.length} system settings`);

  // ==================== 4. Clinical Pathology 마스터데이터 ====================
  await seedClinicalPathology();

  // ==================== 5. 업데이트 공지사항 ====================
  console.log('📢 Creating update announcements...');

  const now = new Date();
  const oneMonthLater = new Date(now);
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

  const announcements = [
    {
      title: '🎉 v1.2.0 업데이트 - 통합 견적서 코드 시스템',
      content: `## 새로운 기능

### 통합 견적서 번호 체계
- 모든 시험 유형(독성, 효력, 임상병리)에서 동일한 번호 형식 사용
- 형식: \`YY-UC-MM-NNNN\` (예: 26-DL-01-0001)

### 리드 번호 개선
- 사용자 코드 기반 리드 번호 생성
- 형식: \`UC-YYYY-NNNN\` (예: DL-2026-0001)

### 견적서 코드 중복 방지
- 사용자 간 코드 중복 검사 (대소문자 무시)
- 실시간 중복 확인 피드백

## ⚠️ 주의사항
- 견적서 작성 전 **설정 > 견적서 코드**에서 코드를 먼저 설정해야 합니다
- 기존에 생성된 견적서/리드 번호는 변경되지 않습니다`,
      priority: 'IMPORTANT',
      startDate: now,
      endDate: oneMonthLater,
    },
    {
      title: '📋 v1.1.0 업데이트 - 공지사항 댓글 & 임상병리 모듈',
      content: `## 새로운 기능

### 공지사항 댓글
- 공지사항에 댓글 작성 가능
- 대댓글 지원

### 임상병리 모듈
- 임상병리시험 견적서 작성 기능 추가
- 검사 항목별 가격 관리

### 성능 개선
- 데이터베이스 인덱스 최적화
- 페이지 로딩 속도 개선`,
      priority: 'NORMAL',
      startDate: new Date('2026-01-30'),
      endDate: new Date('2026-02-28'),
    },
  ];

  for (const announcement of announcements) {
    await prisma.announcement.upsert({
      where: { 
        // title은 unique가 아니므로 id로 찾거나 새로 생성
        id: `seed-${announcement.title.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '-')}`,
      },
      update: {
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority as any,
        startDate: announcement.startDate,
        endDate: announcement.endDate,
      },
      create: {
        id: `seed-${announcement.title.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '-')}`,
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority as any,
        startDate: announcement.startDate,
        endDate: announcement.endDate,
        createdBy: adminUser.id,
        isActive: true,
      },
    });
  }

  console.log(`✅ Created ${announcements.length} update announcements`);

  // ==================== 6. 완료 ====================
  console.log('');
  console.log('🎉 Seeding completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   - Admin User: admin@chemon.co.kr (password: admin1234!)`);
  console.log(`   - Pipeline Stages: ${stages.length}`);
  console.log(`   - Stage Tasks: ${createdTasks.count}`);
  console.log(`   - Update Announcements: ${announcements.length}`);
  console.log(`   - System Settings: ${settings.length}`);
  console.log('');
  console.log('⚠️  IMPORTANT: Change the admin password after first login!');
  console.log('');
  console.log('💡 Next steps:');
  console.log('   1. Run `npx prisma studio` to view the data');
  console.log('   2. Login with admin@chemon.co.kr / admin1234!');
  console.log('   3. Change the admin password in Settings');
  console.log('   4. Create additional users as needed');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
