# CHEMON 견적관리 시스템 - Seed 적용 가이드

## 📁 파일 위치

다운로드 받은 파일들을 아래 위치에 복사하세요:

```
backend/
├── prisma/
│   ├── schema.prisma    ← 다운로드 받은 schema.prisma
│   └── seed.ts          ← 다운로드 받은 seed.ts
└── package.json         ← 아래 설정 추가 필요
```

---

## 🔧 package.json 설정 추가

`backend/package.json` 파일에 아래 내용을 추가하세요:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

만약 ts-node가 없다면 설치:
```bash
npm install -D ts-node
```

또는 tsx 사용 시:
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

---

## 🚀 실행 순서

### 1단계: 기존 스키마 백업
```bash
cd backend
cp prisma/schema.prisma prisma/schema.prisma.backup
```

### 2단계: 새 파일 복사
- `schema.prisma` → `backend/prisma/schema.prisma`
- `seed.ts` → `backend/prisma/seed.ts`

### 3단계: 마이그레이션 실행
```bash
# 개발 환경
npx prisma migrate dev --name add_lead_contract_pipeline

# 프로덕션 환경 (주의!)
npx prisma migrate deploy
```

### 4단계: Seed 실행
```bash
npx prisma db seed
```

### 5단계: 확인
```bash
# Prisma Studio에서 데이터 확인
npx prisma studio
```

---

## ✅ Seed 실행 결과

성공 시 아래와 같이 출력됩니다:

```
🌱 Seeding database...
📋 Creating pipeline stages...
✅ Created 9 pipeline stages
📝 Creating stage tasks...
✅ Created 38 stage tasks
⚙️ Creating system settings...
✅ Created 16 system settings

🎉 Seeding completed successfully!

📊 Summary:
   - Pipeline Stages: 9
   - Stage Tasks: 38
   - System Settings: 16
```

---

## 📋 생성되는 파이프라인 단계

| 순서 | 단계명 | 코드 | 색상 | 태스크 수 |
|------|--------|------|------|-----------|
| 1 | 문의접수 | INQUIRY | 🔵 파랑 | 4개 |
| 2 | 검토 | REVIEW | 🟡 노랑 | 3개 |
| 3 | 견적서 송부 | QUOTATION | 🟢 초록 | 4개 |
| 4 | 연구소 현황 파악 | LAB_CHECK_1 | 🟠 주황 | 3개 |
| 5 | 시험의뢰검토 | TEST_REVIEW | 🔴 빨강 | 5개 |
| 6 | 계약진행 | CONTRACT | 🟣 보라 | 4개 |
| 7 | 연구소 현황 파악 (2차) | LAB_CHECK_2 | 🟠 주황 | 2개 |
| 8 | 시험접수 | TEST_RECEIPT | 🔵 청록 | 3개 |
| 9 | 관리 | MANAGEMENT | ⚫ 회색 | 7개 |

---

## ⚠️ 주의사항

1. **프로덕션 환경 적용 전 반드시 백업**
   ```bash
   pg_dump your_database > backup_$(date +%Y%m%d).sql
   ```

2. **기존 데이터 영향 없음**
   - 새 테이블 생성
   - 기존 테이블에 nullable 필드 추가 (기본값 처리)

3. **Seed 재실행 가능**
   - `upsert` 사용으로 중복 실행해도 안전
   - StageTask는 deleteMany 후 재생성 (커스터마이징 시 주의)

---

## 🔄 롤백 방법

문제 발생 시:
```bash
# 마지막 마이그레이션 롤백
npx prisma migrate resolve --rolled-back add_lead_contract_pipeline

# 또는 백업에서 복원
psql your_database < backup_20250119.sql
```
