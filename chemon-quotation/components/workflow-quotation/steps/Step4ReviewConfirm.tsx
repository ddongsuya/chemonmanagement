'use client';

import { useMemo } from 'react';
import { ChevronLeft, AlertTriangle, CheckCircle, Info, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { useWorkflowQuotationStore } from '@/stores/workflowQuotationStore';
import { validateTests, hasBlockingErrors, hasUnconfirmedWarnings } from '@/lib/quotation/validation-rules';

export function Step4ReviewConfirm() {
  const {
    selectedModality,
    projectType,
    targetPhase,
    selectedTests,
    validationResults,
    setValidationResults,
    acknowledgeValidation,
    setStep,
  } = useWorkflowQuotationStore();

  // 검증 실행
  useMemo(() => {
    if (selectedModality && selectedTests.length > 0) {
      const results = validateTests(selectedTests, selectedModality.level2);
      setValidationResults(results);
    }
  }, [selectedModality, selectedTests, setValidationResults]);

  // 총 금액 계산
  const totalPrice = useMemo(() => {
    return selectedTests.reduce((sum, test) => sum + test.totalPrice, 0);
  }, [selectedTests]);

  // 블로킹 에러 확인
  const hasErrors = hasBlockingErrors(validationResults);
  const hasWarnings = hasUnconfirmedWarnings(validationResults);

  const handleBack = () => {
    setStep(3);
  };

  const handleConfirm = () => {
    if (hasErrors) {
      alert('필수 시험이 누락되었습니다. 시험을 추가해주세요.');
      return;
    }
    if (hasWarnings) {
      alert('확인이 필요한 경고가 있습니다.');
      return;
    }
    // 견적서 생성 로직
    alert('견적서가 생성되었습니다!');
  };

  return (
    <div className="space-y-6">
      {/* 검증 결과 알림 */}
      {validationResults.length > 0 && (
        <div className="space-y-3">
          {validationResults.map((result) => (
            <Alert
              key={result.id}
              variant={result.type === 'error' ? 'destructive' : 'default'}
              className={cn(result.acknowledged && 'opacity-50')}
            >
              {result.type === 'error' && <AlertTriangle className="h-4 w-4" />}
              {result.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
              {result.type === 'info' && <Info className="h-4 w-4" />}
              <AlertTitle className="flex items-center justify-between">
                <span>
                  {result.type === 'error' && '오류'}
                  {result.type === 'warning' && '경고'}
                  {result.type === 'info' && '정보'}
                </span>
                {result.action === 'confirm' && !result.acknowledged && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => acknowledgeValidation(result.id)}
                  >
                    확인
                  </Button>
                )}
              </AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* 견적 요약 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            견적 요약
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">모달리티</p>
              <p className="font-medium">
                {selectedModality?.level1_name} &gt; {selectedModality?.level2_name} &gt;{' '}
                {selectedModality?.level3_name}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">프로젝트 유형</p>
              <p className="font-medium">
                {projectType === 'ind_package' && 'IND 패키지'}
                {projectType === 'single_test' && '개별 시험'}
                {projectType === 'drf_only' && 'DRF만'}
                {projectType === 'phase_extension' && '임상단계 확장'}
                {targetPhase && ` (${targetPhase})`}
              </p>
            </div>
          </div>

          <Separator />


          {/* 시험 목록 */}
          <div>
            <h4 className="font-medium mb-3">선택된 시험 ({selectedTests.length}개)</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>시험명</TableHead>
                  <TableHead>단계</TableHead>
                  <TableHead className="text-right">금액</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedTests.map((test, index) => (
                  <TableRow key={test.testId}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{test.testName}</p>
                        <p className="text-xs text-muted-foreground">{test.testNameEn}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{test.workflowStage}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(test.totalPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Separator />

          {/* 금액 합계 */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>시험비용 합계</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>부가세 (10%)</span>
              <span>{formatCurrency(totalPrice * 0.1)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>총 견적금액</span>
              <span className="text-primary">{formatCurrency(totalPrice * 1.1)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 상태 표시 */}
      <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-muted">
        {hasErrors ? (
          <>
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="text-destructive font-medium">
              필수 시험이 누락되었습니다
            </span>
          </>
        ) : hasWarnings ? (
          <>
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="text-yellow-600 font-medium">
              확인이 필요한 경고가 있습니다
            </span>
          </>
        ) : (
          <>
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-600 font-medium">
              모든 검증을 통과했습니다
            </span>
          </>
        )}
      </div>

      {/* 네비게이션 버튼 */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={handleBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          이전
        </Button>
        <Button onClick={handleConfirm} disabled={hasErrors}>
          견적서 생성
        </Button>
      </div>
    </div>
  );
}
