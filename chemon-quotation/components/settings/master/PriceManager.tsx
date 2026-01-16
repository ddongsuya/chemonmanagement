'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function PriceManager() {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>단가 일괄 수정</AlertTitle>
        <AlertDescription>
          Excel 파일을 다운로드하여 단가를 수정한 후 업로드하면 일괄 적용됩니다.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col sm:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-base">1. 현재 단가 다운로드</CardTitle>
            <CardDescription>
              현재 설정된 단가를 Excel로 다운로드합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              단가표 다운로드
            </Button>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-base">2. 수정된 단가 업로드</CardTitle>
            <CardDescription>수정한 Excel 파일을 업로드합니다</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              단가표 업로드
            </Button>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-gray-500">
        * 단가 변경 이력은 시스템에 기록됩니다.
      </p>
    </div>
  );
}
