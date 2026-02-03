'use client';

import { useState } from 'react';
import { useEfficacyQuotationStore } from '@/stores/efficacyQuotationStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, Building2 } from 'lucide-react';
import { VALIDITY_OPTIONS } from '@/lib/constants';
import { addDays, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import CustomerSelector from '@/components/quotation/CustomerSelector';
import { Lead } from '@/lib/lead-api';

/**
 * StepBasicInfo Component for Efficacy Quotation
 * Step 1 of efficacy quotation wizard - Basic information input
 * Now uses shared CustomerSelector component for consistent customer/lead selection
 */

export default function StepBasicInfo() {
  const {
    customerId,
    customerName,
    leadId,
    projectName,
    validDays,
    notes,
    setCustomer,
    setLead,
    setProjectName,
    setValidDays,
    setNotes,
    nextStep,
  } = useEfficacyQuotationStore();

  const [errors, setErrors] = useState<{ customer?: string; project?: string }>({});

  // Calculate validity date
  const validUntil = format(addDays(new Date(), validDays), 'yyyy년 MM월 dd일', {
    locale: ko,
  });

  /**
   * 기존 고객 선택 핸들러
   */
  const handleCustomerSelect = (selectedCustomerId: string, selectedCustomerName: string) => {
    setCustomer(selectedCustomerId, selectedCustomerName);
    setErrors((prev) => ({ ...prev, customer: undefined }));
  };

  /**
   * 리드 선택 핸들러
   */
  const handleLeadSelect = (lead: Lead) => {
    setLead(
      lead.id,
      lead.companyName,
      lead.contactName,
      lead.contactEmail || '',
      lead.contactPhone || ''
    );
    setErrors((prev) => ({ ...prev, customer: undefined }));
  };

  /**
   * 신규 고객 생성 핸들러
   */
  const handleNewCustomerCreate = (lead: Lead) => {
    // CustomerSelector 내부에서 이미 onLeadSelect를 호출하므로
    // 추가 처리가 필요한 경우에만 사용
  };

  const handleNext = () => {
    const newErrors: { customer?: string; project?: string } = {};

    // 고객 또는 리드가 선택되어야 함
    if (!customerId && !leadId) {
      newErrors.customer = '고객사 또는 리드를 선택해주세요';
    }
    if (!projectName.trim()) {
      newErrors.project = '프로젝트명을 입력해주세요';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    nextStep();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          기본 정보 입력
        </CardTitle>
        <CardDescription>
          효력시험 견적서의 기본 정보를 입력해주세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 고객사/리드 선택 - CustomerSelector 컴포넌트 사용 */}
        <div className="space-y-2">
          <Label>
            고객사 / 리드 <span className="text-red-500">*</span>
          </Label>
          <CustomerSelector
            selectedCustomerId={customerId || null}
            selectedLeadId={leadId}
            onCustomerSelect={handleCustomerSelect}
            onLeadSelect={handleLeadSelect}
            onNewCustomerCreate={handleNewCustomerCreate}
          />
          {errors.customer && (
            <p className="text-sm text-red-500">{errors.customer}</p>
          )}
          {customerName && (
            <p className="text-sm text-gray-500">
              선택됨: {customerName}
              {leadId && <span className="ml-2 text-orange-600">(리드)</span>}
            </p>
          )}
        </div>

        {/* Project name */}
        <div className="space-y-2">
          <Label htmlFor="projectName">
            프로젝트명 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="projectName"
            value={projectName}
            onChange={(e) => {
              setProjectName(e.target.value);
              if (e.target.value.trim()) {
                setErrors((prev) => ({ ...prev, project: undefined }));
              }
            }}
            placeholder="예: ABC-001 효력시험"
            className={errors.project ? 'border-red-500' : ''}
          />
          {errors.project && (
            <p className="text-sm text-red-500">{errors.project}</p>
          )}
        </div>

        {/* Validity period */}
        <div className="space-y-2">
          <Label htmlFor="validDays">견적 유효기간</Label>
          <Select
            value={validDays.toString()}
            onValueChange={(value) => setValidDays(parseInt(value))}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VALIDITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500">유효기한: {validUntil}</p>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">특이사항</Label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="견적 관련 특이사항이나 메모를 입력하세요"
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* Next button */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleNext} size="lg">
            다음: 모델 선택
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
