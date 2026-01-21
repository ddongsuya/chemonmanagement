-- AlterTable: Study에 testReceptionId 필드 추가
ALTER TABLE "Study" ADD COLUMN "testReceptionId" TEXT;

-- CreateIndex: testReceptionId에 유니크 인덱스 추가
CREATE UNIQUE INDEX "Study_testReceptionId_key" ON "Study"("testReceptionId");

-- AddForeignKey: Study -> TestReception 관계 추가
ALTER TABLE "Study" ADD CONSTRAINT "Study_testReceptionId_fkey" FOREIGN KEY ("testReceptionId") REFERENCES "TestReception"("id") ON DELETE SET NULL ON UPDATE CASCADE;
