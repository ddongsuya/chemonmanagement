'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Settings, FileText } from 'lucide-react';

/**
 * QuotationCodeGuard 컴포넌트
 * 
 * 견적서 코드(User_Code) 미설정 시 안내를 표시하는 가드 컴포넌트입니다.
 * 
 * Requirements:
 * - 5.1: 효력시험 견적서 작성 화면에 접근하면 User_Code 설정 여부를 확인하고 미설정 시 설정 안내 표시
 * - 5.2: 임상병리시험 견적서 작성 화면에 접근하면 User_Code 설정 여부를 확인하고 미설정 시 설정 안내 표시
 * - 5.3: User_Code가 미설정된 상태에서 견적서 작성을 시도하면 설정 페이지로 이동하는 링크와 함께 안내 메시지 표시
 */

export interface QuotationCodeGuardProps {
  /** 사용자의 견적서 코드 (2글자 영문) */
  userCode?: string;
  /** 견적서 코드가 설정된 경우 렌더링할 자식 컴포넌트 */
  children: ReactNode;
  /** 견적서 유형 */
  quotationType: 'TOXICITY' | 'EFFICACY' | 'CLINICAL';
}

/** 견적서 유형별 한글 이름 매핑 */
const QUOTATION_TYPE_LABELS: Record<QuotationCodeGuardProps['quotationType'], string> = {
  TOXICITY: '독성시험',
  EFFICACY: '효력시험',
  CLINICAL: '임상병리시험',
};

/**
 * QuotationCodeGuard
 * 
 * User_Code가 설정되지 않은 경우 안내 메시지와 설정 페이지 링크를 표시하고,
 * 설정된 경우 자식 컴포넌트를 렌더링합니다.
 * 
 * @example
 * ```tsx
 * <QuotationCodeGuard userCode={userCode} quotationType="EFFICACY">
 *   <EfficacyQuotationWizard />
 * </QuotationCodeGuard>
 * ```
 */
export function QuotationCodeGuard({
  userCode,
  children,
  quotationType,
}: QuotationCodeGuardProps) {
  // User_Code가 설정된 경우 자식 컴포넌트 렌더링
  if (userCode && userCode.trim().length > 0) {
    return <>{children}</>;
  }

  const quotationTypeLabel = QUOTATION_TYPE_LABELS[quotationType];

  // User_Code 미설정 시 안내 메시지 표시
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
            <AlertCircle className="h-7 w-7 text-orange-600" />
          </div>
          <CardTitle className="text-xl">견적서 코드 설정 필요</CardTitle>
          <CardDescription>
            {quotationTypeLabel} 견적서를 작성하려면 먼저 견적서 코드를 설정해야 합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50">
            <FileText className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800">견적서 코드란?</AlertTitle>
            <AlertDescription className="text-orange-700">
              견적서 코드는 견적번호 생성에 사용되는 2글자 영문 코드입니다.
              <br />
              예: <span className="font-mono font-semibold">25-01-DL-0001</span> (DL이 견적서 코드)
            </AlertDescription>
          </Alert>

          <div className="text-center pt-2">
            <Button asChild size="lg">
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                설정 페이지로 이동
              </Link>
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            설정 페이지에서 견적서 코드를 설정한 후 다시 시도해주세요.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default QuotationCodeGuard;
