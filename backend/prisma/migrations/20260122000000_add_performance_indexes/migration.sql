-- 성능 최적화를 위한 인덱스 추가

-- Quotation 테이블 인덱스
CREATE INDEX IF NOT EXISTS "Quotation_userId_idx" ON "Quotation"("userId");
CREATE INDEX IF NOT EXISTS "Quotation_customerId_idx" ON "Quotation"("customerId");
CREATE INDEX IF NOT EXISTS "Quotation_status_idx" ON "Quotation"("status");
CREATE INDEX IF NOT EXISTS "Quotation_quotationType_idx" ON "Quotation"("quotationType");
CREATE INDEX IF NOT EXISTS "Quotation_createdAt_idx" ON "Quotation"("createdAt");
CREATE INDEX IF NOT EXISTS "Quotation_status_userId_idx" ON "Quotation"("status", "userId");

-- Customer 테이블 인덱스
CREATE INDEX IF NOT EXISTS "Customer_userId_idx" ON "Customer"("userId");
CREATE INDEX IF NOT EXISTS "Customer_grade_idx" ON "Customer"("grade");
CREATE INDEX IF NOT EXISTS "Customer_name_idx" ON "Customer"("name");
CREATE INDEX IF NOT EXISTS "Customer_company_idx" ON "Customer"("company");
