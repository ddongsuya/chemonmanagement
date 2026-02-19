'use client';

import { useState } from 'react';
import { useQuotationStore } from '@/stores/quotationStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import CustomerSelector from './CustomerSelector';
import { Lead } from '@/lib/lead-api';

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
  } = useQuotationStore();

  const [errors, setErrors] = useState<{ customer?: string; project?: string }>({});

  // 유효기한 계산
  const validUntil = format(addDays(new Date(), validDays), 'yyyy년 MM월 dd일', { locale: ko });

  /**
   * 기존 고객 선택 핸들러 (Requirements 1.2)
   * CustomerSelector에서 기존 고객을 선택했을 때 호출됩니다.
   */
  const handleCustomerSelect = (selectedCustomerId: string, selectedCustomerName: string) => {
    setCustomer(selectedCustomerId, selectedCustomerName);
    setErrors((prev) => ({ ...prev, customer: undefined }));
  };

  /**
   * 리드 선택 핸들러 (Requirements 1.4)
   * CustomerSelector에서 리드를 선택했을 때 호출됩니다.
   * 리드의 companyName, contactName, contactEmail, contactPhone 정보를 견적서에 자동으로 채웁니다.
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
   * 신규 고객 생성 핸들러 (Requirements 1.6)
   * CustomerSelector에서 신규 고객(리드)을 생성했을 때 호출됩니다.
   * DetailedCustomerForm을 통해 생성된 리드가 자동으로 견적서에 연결됩니다.
   */
  const handleNewCustomerCreate = (lead: Lead) => {
    // 신규 생성된 리드도 handleLeadSelect와 동일하게 처리
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
          견적서의 기본 정보를 입력해주세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 고객사/리드 선택 - CustomerSelector 컴포넌트 사용 (Requirements 1.1) */}
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

        {/* 프로젝트명 */}
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
            placeholder="예: ABC-001 Phase 1 비임상시험"
            className={errors.project ? 'border-red-500' : ''}
          />
          {errors.project && (
            <p className="text-sm text-red-500">{errors.project}</p>
          )}
        </div>

        {/* 견적 유효기간 */}
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
          <p className="text-sm text-gray-500">
            유효기한: {validUntil}
          </p>
        </div>

        {/* 특이사항 */}
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

        {/* 다음 버튼 */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleNext} size="lg">
            다음: 시험 선택
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
