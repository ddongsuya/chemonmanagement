-- AlterTable: Add payment condition fields to Contract
ALTER TABLE "Contract" ADD COLUMN "paymentType" TEXT NOT NULL DEFAULT 'FULL';
ALTER TABLE "Contract" ADD COLUMN "advancePaymentRate" DECIMAL(5,2);
ALTER TABLE "Contract" ADD COLUMN "advancePaymentAmount" DECIMAL(15,2);
ALTER TABLE "Contract" ADD COLUMN "balancePaymentAmount" DECIMAL(15,2);

-- Add comment for documentation
COMMENT ON COLUMN "Contract"."paymentType" IS 'Payment type: FULL (일괄지급), INSTALLMENT (분할지급-선금/잔금), PER_TEST (시험번호별 지급)';
COMMENT ON COLUMN "Contract"."advancePaymentRate" IS 'Advance payment rate in percentage (선금 비율 %)';
COMMENT ON COLUMN "Contract"."advancePaymentAmount" IS 'Advance payment amount (선금 금액)';
COMMENT ON COLUMN "Contract"."balancePaymentAmount" IS 'Balance payment amount (잔금 금액)';
