'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, User, Phone, Mail, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// 모바일용 간소화된 리드 등록 스키마 (필수 필드만)
const mobileLeadSchema = z.object({
  companyName: z.string().min(1, '회사명을 입력해주세요'),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email('올바른 이메일 형식이 아닙니다').optional().or(z.literal('')),
  notes: z.string().optional(),
});

type MobileLeadFormData = z.infer<typeof mobileLeadSchema>;

interface MobileLeadFormProps {
  onSubmit?: (data: MobileLeadFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function MobileLeadForm({ onSubmit, isSubmitting }: MobileLeadFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MobileLeadFormData>({
    resolver: zodResolver(mobileLeadSchema),
    defaultValues: {
      companyName: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      notes: '',
    },
  });

  const handleFormSubmit = async (data: MobileLeadFormData) => {
    if (onSubmit) {
      await onSubmit(data);
      return;
    }

    setLoading(true);
    try {
      // API 호출 로직
      toast({
        title: '리드 등록 완료',
        description: '새로운 리드가 등록되었습니다.',
      });
      router.push('/leads');
    } catch (error) {
      toast({
        title: '등록 실패',
        description: '리드 등록 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="touch-manipulation"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">리드 등록</h1>
        </div>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4">
        {/* 회사 정보 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              회사 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">
                회사명 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="companyName"
                placeholder="회사명을 입력하세요"
                {...register('companyName')}
                className="h-12 text-base"
              />
              {errors.companyName && (
                <p className="text-sm text-destructive">{errors.companyName.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 담당자 정보 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              담당자 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">담당자명</Label>
              <Input
                id="contactName"
                placeholder="담당자명을 입력하세요"
                {...register('contactName')}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                연락처
              </Label>
              <Input
                id="contactPhone"
                type="tel"
                placeholder="010-0000-0000"
                {...register('contactPhone')}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                이메일
              </Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="email@example.com"
                {...register('contactEmail')}
                className="h-12 text-base"
              />
              {errors.contactEmail && (
                <p className="text-sm text-destructive">{errors.contactEmail.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 메모 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              메모
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="추가 메모를 입력하세요"
              {...register('notes')}
              className="min-h-[100px] text-base resize-none"
            />
          </CardContent>
        </Card>

        {/* 제출 버튼 */}
        <div className="sticky bottom-0 pt-4 pb-safe bg-background border-t -mx-4 px-4">
          <Button
            type="submit"
            className="w-full h-12 text-base font-medium"
            disabled={loading || isSubmitting}
          >
            {loading || isSubmitting ? '등록 중...' : '리드 등록'}
          </Button>
        </div>
      </form>
    </div>
  );
}
