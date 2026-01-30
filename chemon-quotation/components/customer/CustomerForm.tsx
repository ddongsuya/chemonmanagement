'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { Customer } from '@/types';
import { createCustomer, updateCustomer } from '@/lib/data-api';
import { useToast } from '@/hooks/use-toast';

interface CustomerFormProps {
  customer?: Customer;
  onSuccess: () => void;
}

export default function CustomerForm({ customer, onSuccess }: CustomerFormProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    company_name: customer?.company_name || '',
    address: customer?.address || '',
    contact_person: customer?.contact_person || '',
    contact_email: customer?.contact_email || '',
    contact_phone: customer?.contact_phone || '',
    notes: customer?.notes || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.contact_person.trim()) {
      newErrors.contact_person = '담당자명을 입력해주세요';
    }
    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = '올바른 이메일 형식이 아닙니다';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const apiData = {
        name: formData.contact_person,
        company: formData.company_name || null,
        email: formData.contact_email || null,
        phone: formData.contact_phone || null,
        address: formData.address || null,
        notes: formData.notes || null,
      };

      let response;
      if (customer) {
        response = await updateCustomer(customer.id, apiData);
      } else {
        response = await createCustomer(apiData);
      }

      if (response.success) {
        toast({
          title: customer ? '수정 완료' : '등록 완료',
          description: customer ? '고객 정보가 수정되었습니다.' : '새 고객이 등록되었습니다.',
        });
        onSuccess();
      } else {
        toast({
          title: '오류',
          description: response.error?.message || '저장에 실패했습니다.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '서버 연결에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {customer ? '고객사 정보 수정' : '신규 고객사 등록'}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-5 py-4 px-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="contact_person">
              담당자명 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contact_person"
              value={formData.contact_person}
              onChange={(e) =>
                setFormData({ ...formData, contact_person: e.target.value })
              }
              placeholder="담당자명"
              className={errors.contact_person ? 'border-red-500' : ''}
            />
            {errors.contact_person && (
              <p className="text-sm text-red-500">{errors.contact_person}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="company_name">회사명</Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) =>
                setFormData({ ...formData, company_name: e.target.value })
              }
              placeholder="(주)회사명"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact_phone">연락처</Label>
            <Input
              id="contact_phone"
              value={formData.contact_phone}
              onChange={(e) =>
                setFormData({ ...formData, contact_phone: e.target.value })
              }
              placeholder="010-0000-0000"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact_email">이메일</Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={(e) =>
                setFormData({ ...formData, contact_email: e.target.value })
              }
              placeholder="email@company.com"
              className={errors.contact_email ? 'border-red-500' : ''}
            />
            {errors.contact_email && (
              <p className="text-sm text-red-500">{errors.contact_email}</p>
            )}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="address">주소</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="회사 주소"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="notes">메모</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="고객 관련 메모"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="pt-6">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              취소
            </Button>
          </DialogClose>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {customer ? '수정' : '등록'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
