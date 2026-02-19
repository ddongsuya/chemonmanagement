'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Save, X, Building2, Mail, Phone, Briefcase } from 'lucide-react';
import { LeadSource } from '@/lib/lead-api';

// CreateLeadDTO 인터페이스 (설계 문서 기반)
export interface CreateLeadDTO {
  companyName: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  department?: string;
  position?: string;
  source: LeadSource;
  inquiryType?: string;
  inquiryDetail?: string;
  expectedAmount?: number;
  expectedDate?: string;
}

// DetailedCustomerForm Props 인터페이스 (설계 문서 기반)
export interface DetailedCustomerFormProps {
  onSubmit: (data: CreateLeadDTO) => void;
  onCancel: () => void;
  isLoading: boolean;
}

// 유입경로 옵션
const sourceOptions: { value: LeadSource; label: string }[] = [
  { value: 'WEBSITE', label: '웹사이트' },
  { value: 'REFERRAL', label: '소개' },
  { value: 'COLD_CALL', label: '콜드콜' },
  { value: 'EXHIBITION', label: '전시회' },
  { value: 'ADVERTISEMENT', label: '광고' },
  { value: 'PARTNER', label: '파트너' },
  { value: 'OTHER', label: '기타' },
];

// 문의유형 옵션
const inquiryTypeOptions = [
  { value: 'TOXICITY', label: '독성시험' },
  { value: 'EFFICACY', label: '효력시험' },
  { value: 'CLINICAL_PATHOLOGY', label: '임상병리' },
];

/**
 * DetailedCustomerForm 컴포넌트
 * 
 * 견적서 작성 시 신규 고객(리드) 등록을 위한 상세 입력 폼입니다.
 * Lead 등록 폼과 동일한 필드를 제공합니다.
 * 
 * Requirements 1.5: Lead_Form과 동일한 상세 입력 폼 표시
 * - 회사명, 담당자명, 직책, 부서, 연락처, 이메일, 유입경로, 문의유형, 예상금액, 예상계약일
 */
export default function DetailedCustomerForm({
  onSubmit,
  onCancel,
  isLoading,
}: DetailedCustomerFormProps) {
  // 폼 상태 관리
  const [formData, setFormData] = useState<{
    companyName: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    department: string;
    position: string;
    source: LeadSource;
    inquiryType: string;
    inquiryDetail: string;
    expectedAmount: string;
    expectedDate: string;
  }>({
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    department: '',
    position: '',
    source: 'OTHER',
    inquiryType: '',
    inquiryDetail: '',
    expectedAmount: '',
    expectedDate: '',
  });

  // 유효성 검사 에러 상태
  const [errors, setErrors] = useState<{
    companyName?: string;
    contactName?: string;
    contactEmail?: string;
  }>({});

  // 필드 변경 핸들러
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 에러 클리어
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // 이메일 유효성 검사
  const validateEmail = (email: string): boolean => {
    if (!email) return true; // 선택 필드이므로 빈 값은 유효
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 폼 제출 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    const newErrors: typeof errors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = '회사명은 필수입니다';
    }

    if (!formData.contactName.trim()) {
      newErrors.contactName = '담당자명은 필수입니다';
    }

    if (formData.contactEmail && !validateEmail(formData.contactEmail)) {
      newErrors.contactEmail = '올바른 이메일 형식이 아닙니다';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // CreateLeadDTO 형식으로 변환하여 제출
    const submitData: CreateLeadDTO = {
      companyName: formData.companyName.trim(),
      contactName: formData.contactName.trim(),
      contactEmail: formData.contactEmail.trim() || undefined,
      contactPhone: formData.contactPhone.trim() || undefined,
      department: formData.department.trim() || undefined,
      position: formData.position.trim() || undefined,
      source: formData.source,
      inquiryType: formData.inquiryType || undefined,
      inquiryDetail: formData.inquiryDetail.trim() || undefined,
      expectedAmount: formData.expectedAmount ? Number(formData.expectedAmount) : undefined,
      expectedDate: formData.expectedDate || undefined,
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5 text-orange-500" />
            신규 고객 등록
          </CardTitle>
          <CardDescription>
            리드 정보를 입력하여 신규 고객을 등록합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 회사 정보 섹션 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              회사 정보
            </h3>
            
            {/* 회사명 */}
            <div className="space-y-2">
              <Label htmlFor="companyName">
                회사명 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                placeholder="회사명을 입력하세요"
                className={errors.companyName ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.companyName && (
                <p className="text-sm text-red-500">{errors.companyName}</p>
              )}
            </div>

            {/* 담당자명 & 직책 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">
                  담당자명 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) => handleChange('contactName', e.target.value)}
                  placeholder="담당자명"
                  className={errors.contactName ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.contactName && (
                  <p className="text-sm text-red-500">{errors.contactName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">직책</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleChange('position', e.target.value)}
                  placeholder="직책"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* 부서 */}
            <div className="space-y-2">
              <Label htmlFor="department">부서</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                placeholder="부서명"
                disabled={isLoading}
              />
            </div>

            {/* 연락처 & 이메일 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPhone">연락처</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => handleChange('contactPhone', e.target.value)}
                    placeholder="010-0000-0000"
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleChange('contactEmail', e.target.value)}
                    placeholder="email@example.com"
                    className={`pl-10 ${errors.contactEmail ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.contactEmail && (
                  <p className="text-sm text-red-500">{errors.contactEmail}</p>
                )}
              </div>
            </div>
          </div>

          {/* 문의 정보 섹션 */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              문의 정보
            </h3>

            {/* 유입경로 & 문의유형 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">유입경로</Label>
                <Select
                  value={formData.source}
                  onValueChange={(v) => handleChange('source', v)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inquiryType">문의유형</Label>
                <Select
                  value={formData.inquiryType}
                  onValueChange={(v) => handleChange('inquiryType', v)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {inquiryTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 예상금액 & 예상계약일 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expectedAmount">예상금액</Label>
                <Input
                  id="expectedAmount"
                  type="number"
                  value={formData.expectedAmount}
                  onChange={(e) => handleChange('expectedAmount', e.target.value)}
                  placeholder="0"
                  min="0"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedDate">예상계약일</Label>
                <Input
                  id="expectedDate"
                  type="date"
                  value={formData.expectedDate}
                  onChange={(e) => handleChange('expectedDate', e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* 문의 내용 */}
            <div className="space-y-2">
              <Label htmlFor="inquiryDetail">문의 내용</Label>
              <Textarea
                id="inquiryDetail"
                value={formData.inquiryDetail}
                onChange={(e) => handleChange('inquiryDetail', e.target.value)}
                placeholder="문의 내용을 입력하세요"
                rows={3}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  등록 중...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  등록
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
