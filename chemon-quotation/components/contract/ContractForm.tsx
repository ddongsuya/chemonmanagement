'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { numberToKorean, formatDateKorean, calculateWeeks } from '@/lib/contract/number-to-korean';
import { ContractFormData, QuotationItem } from '@/lib/contract/types';
import { Building2, User, Calendar, Wallet, FileText } from 'lucide-react';

interface ContractFormProps {
  initialData: {
    quotationNo: string;
    customerName?: string;
    projectName?: string;
    items: QuotationItem[];
    subtotal: number;
  };
  onSubmit: (formData: ContractFormData) => void;
  isLoading?: boolean;
}

export default function ContractForm({ initialData, onSubmit, isLoading }: ContractFormProps) {
  const [formData, setFormData] = useState<ContractFormData>({
    customerName: initialData.customerName || '',
    customerAddress: '',
    customerCeo: '',
    projectName: initialData.projectName || '',
    startDate: '',
    endDate: '',
    advanceRate: 50,
    contractDate: new Date().toISOString().split('T')[0],
    isDraft: true,
  });

  // 계산된 값들
  const advanceAmount = Math.floor(initialData.subtotal * (formData.advanceRate / 100));
  const remainingAmount = initialData.subtotal - advanceAmount;
  const totalWeeks = formData.startDate && formData.endDate 
    ? calculateWeeks(formData.startDate, formData.endDate) 
    : 0;

  const handleChange = (field: keyof ContractFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isValid = formData.customerName && formData.customerAddress && formData.customerCeo 
    && formData.projectName && formData.startDate && formData.endDate && formData.contractDate;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 견적서 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            견적서 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">견적번호:</span>
              <span className="ml-2 font-mono">{initialData.quotationNo}</span>
            </div>
            <div>
              <span className="text-muted-foreground">시험항목:</span>
              <span className="ml-2">{initialData.items.length}개</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">총 금액 (VAT 별도):</span>
              <span className="ml-2 font-semibold text-primary">{formatCurrency(initialData.subtotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* 고객 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            고객 정보 (갑)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">고객사명 *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleChange('customerName', e.target.value)}
                placeholder="예: (주)바이오팜"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerCeo">대표이사명 *</Label>
              <Input
                id="customerCeo"
                value={formData.customerCeo}
                onChange={(e) => handleChange('customerCeo', e.target.value)}
                placeholder="예: 홍 길 동"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerAddress">주소 *</Label>
            <Input
              id="customerAddress"
              value={formData.customerAddress}
              onChange={(e) => handleChange('customerAddress', e.target.value)}
              placeholder="예: 서울시 강남구 테헤란로 123"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* 프로젝트 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            프로젝트 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="projectName">프로젝트명 (연구과제명) *</Label>
            <Input
              id="projectName"
              value={formData.projectName}
              onChange={(e) => handleChange('projectName', e.target.value)}
              placeholder="예: BP-001 비임상 독성시험"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* 연구 기간 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            연구 기간
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">시작일 *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">종료일 *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                required
              />
            </div>
          </div>
          {totalWeeks > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <span className="text-muted-foreground">연구기간:</span>
                <span className="ml-2 font-medium">
                  {formData.startDate && formatDateKorean(formData.startDate)} ~ {formData.endDate && formatDateKorean(formData.endDate)} (약 {totalWeeks}주)
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 지급 조건 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            지급 조건
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>선금 비율: {formData.advanceRate}%</Label>
            <Slider
              value={[formData.advanceRate]}
              onValueChange={(value) => handleChange('advanceRate', value[0])}
              min={0}
              max={100}
              step={10}
              className="w-full"
            />
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">선금 ({formData.advanceRate}%)</h4>
              <p className="text-lg font-semibold text-primary">{formatCurrency(advanceAmount)}</p>
              <p className="text-sm text-muted-foreground">금 {numberToKorean(advanceAmount)}원정</p>
              <p className="text-xs text-muted-foreground mt-2">계약일로부터 30일 이내</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">잔금 ({100 - formData.advanceRate}%)</h4>
              <p className="text-lg font-semibold text-primary">{formatCurrency(remainingAmount)}</p>
              <p className="text-sm text-muted-foreground">금 {numberToKorean(remainingAmount)}원정</p>
              <p className="text-xs text-muted-foreground mt-2">최종결과보고서(안) 제출 후 30일 이내</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 계약 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>계약 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contractDate">계약일 *</Label>
              <Input
                id="contractDate"
                type="date"
                value={formData.contractDate}
                onChange={(e) => handleChange('contractDate', e.target.value)}
                required
              />
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="isDraft"
                checked={formData.isDraft}
                onCheckedChange={(checked) => handleChange('isDraft', checked as boolean)}
              />
              <Label htmlFor="isDraft" className="cursor-pointer">
                계약서(안)으로 생성 - 제목에 {'"(안)"'} 표시
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 제출 버튼 */}
      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={!isValid || isLoading} size="lg">
          {isLoading ? '생성 중...' : '계약서 생성'}
        </Button>
      </div>
    </form>
  );
}
