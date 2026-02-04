-- AlterEnum: Position
-- 기존 Position enum 값들을 새로운 값으로 변경

-- 1. position 컬럼이 존재하면 null로 설정 (안전하게 처리)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'position'
    ) THEN
        UPDATE "User" SET "position" = NULL WHERE "position" IS NOT NULL;
        -- 기존 컬럼 삭제 (타입 변경 대신)
        ALTER TABLE "User" DROP COLUMN "position";
    END IF;
END $$;

-- 2. 기존 Position enum 삭제
DROP TYPE IF EXISTS "Position" CASCADE;

-- 3. 새로운 Position enum 생성
CREATE TYPE "Position" AS ENUM ('MANAGER', 'CENTER_HEAD', 'DIVISION_HEAD', 'CEO', 'CHAIRMAN');

-- 4. User 테이블에 position 컬럼 추가
ALTER TABLE "User" ADD COLUMN "position" "Position";

-- 5. 기존 Title enum 삭제 (있으면)
DROP TYPE IF EXISTS "Title" CASCADE;

-- 6. Title enum 생성
CREATE TYPE "Title" AS ENUM ('TEAM_LEADER');

-- 7. title 컬럼이 없으면 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'title'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "title" "Title";
    END IF;
END $$;
