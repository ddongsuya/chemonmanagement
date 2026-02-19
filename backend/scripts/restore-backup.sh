#!/bin/bash
# DB 백업 복원 스크립트
# 사용법: ./scripts/restore-backup.sh <backup_file> <database_url>
# 예시: ./scripts/restore-backup.sh exports/db_backup_20260219.sql "postgresql://user:pass@host/db?sslmode=require"

BACKUP_FILE=$1
DATABASE_URL=$2

if [ -z "$BACKUP_FILE" ] || [ -z "$DATABASE_URL" ]; then
  echo "사용법: $0 <backup_file> <database_url>"
  echo "예시: $0 exports/db_backup_20260219.sql \"postgresql://user:pass@host/db\""
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ 백업 파일을 찾을 수 없습니다: $BACKUP_FILE"
  exit 1
fi

echo "🔄 복원 시작: $BACKUP_FILE"
echo "📍 대상 DB: $(echo $DATABASE_URL | sed 's/:[^:@]*@/:***@/')"

psql "$DATABASE_URL" < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ 복원 완료"
else
  echo "❌ 복원 실패"
  exit 1
fi
