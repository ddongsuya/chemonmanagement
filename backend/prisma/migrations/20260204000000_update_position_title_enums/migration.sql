-- AlterEnum: Position
-- 기존 Position enum 값들을 새로운 값으로 변경

-- 1. 기존 사용자의 position을 null로 설정 (기존 값들이 새 enum에 없으므로)
UPDATE "User" SET "position" = NULL WHERE "position" IS NOT NULL;

-- 2. 기존 Position enum 삭제 및 재생성
DROP TYPE IF EXISTS "Position" CASCADE;

CREATE TYPE "Position" AS ENUM ('MANAGER', 'CENTER_HEAD', 'DIVISION_HEAD', 'CEO', 'CHAIRMAN');

-- 3. User 테이블의 position 컬럼 타입 재설정
ALTER TABLE "User" ALTER COLUMN "position" TYPE "Position" USING "position"::text::"Position";

-- 4. Title enum 생성
CREATE TYPE "Title" AS ENUM ('TEAM_LEADER');

-- 5. User 테이블에 title 컬럼 추가
ALTER TABLE "User" ADD COLUMN "title" "Title";
