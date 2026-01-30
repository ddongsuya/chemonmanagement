'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowLeft, Save } from 'lucide-react';
import { createLead, getPipelineStages, PipelineStage, LeadSource } from '@/lib/lead-api';
import { useToast } from '@/hooks/use-toast';

const sourceOptions = [
  { value: 'EMAIL', label: '이메일' },
  { value: 'PHONE', label: '전화' },
  { value: 'WEBSITE', label: '웹사이트' },
  { value: 'REFERRAL', label: '소개' },
  { value: 'EXHIBITION', label: '전시회' },
  { value: 'OTHER', label: '기타' },
];

const inquiryTypeOptions = [
  { value: 'TOXICITY', label: '독성시험' },
  { value: 'EFFICACY', label: '효력시험' },
];

export default function NewLeadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
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
    stageId: '',
  });

  useEffect(() => {
    loadStages();
  }, []);

  const loadStages = async () => {
    try {
      const res = await getPipelineStages();
      if (res.success && res.data?.stages) {
        setStages(res.data.stages);
        // 기본 단계 설정
        const defaultStage = res.data.stages.find(s => s.isDefault);
        if (defaultStage) {
          setFormData(prev => ({ ...prev, stageId: defaultStage.id }));
        }
      }
    } catch (error) {
      console.error('Failed to load stages:', error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyName || !formData.contactName) {
      toast({ title: '오류', description: '회사명과 담당자명은 필수입니다.', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      await createLead({
        ...formData,
        source: formData.source as LeadSource,
        expectedAmount: formData.expectedAmount ? Number(formData.expectedAmount) : undefined,
        expectedDate: formData.expectedDate || undefined,
      });
      toast({ title: '성공', description: '리드가 생성되었습니다.' });
      router.push('/leads');
    } catch (error) {
      toast({ title: '오류', description: '리드 생성에 실패했습니다.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">새 리드 등록</h1>
          <p className="text-muted-foreground">잠재 고객 정보를 입력하세요</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 회사 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>회사 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">회사명 *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  placeholder="회사명을 입력하세요"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">담당자명 *</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => handleChange('contactName', e.target.value)}
                    placeholder="담당자명"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">직책</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => handleChange('position', e.target.value)}
                    placeholder="직책"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">부서</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  placeholder="부서명"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">연락처</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => handleChange('contactPhone', e.target.value)}
                    placeholder="010-0000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">이메일</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleChange('contactEmail', e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 문의 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>문의 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source">유입 경로</Label>
                  <Select value={formData.source} onValueChange={(v) => handleChange('source', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inquiryType">문의 유형</Label>
                  <Select value={formData.inquiryType} onValueChange={(v) => handleChange('inquiryType', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {inquiryTypeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stageId">파이프라인 단계</Label>
                <Select value={formData.stageId} onValueChange={(v) => handleChange('stageId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="단계 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expectedAmount">예상 금액</Label>
                  <Input
                    id="expectedAmount"
                    type="number"
                    value={formData.expectedAmount}
                    onChange={(e) => handleChange('expectedAmount', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedDate">예상 계약일</Label>
                  <Input
                    id="expectedDate"
                    type="date"
                    value={formData.expectedDate}
                    onChange={(e) => handleChange('expectedDate', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inquiryDetail">문의 내용</Label>
                <Textarea
                  id="inquiryDetail"
                  value={formData.inquiryDetail}
                  onChange={(e) => handleChange('inquiryDetail', e.target.value)}
                  placeholder="문의 내용을 입력하세요"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? '저장 중...' : '저장'}
          </Button>
        </div>
      </form>
    </div>
  );
}
