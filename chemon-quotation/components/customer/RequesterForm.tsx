'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { Requester } from '@/types/customer';
import { saveRequester, updateRequester } from '@/lib/requester-storage';

interface RequesterFormProps {
  customerId: string;
  requester?: Requester;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function RequesterForm({
  customerId,
  requester,
  onSuccess,
  onCancel,
}: RequesterFormProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: requester?.name || '',
    position: requester?.position || '',
    department: requester?.department || '',
    phone: requester?.phone || '',
    email: requester?.email || '',
    is_primary: requester?.is_primary || false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = !!requester;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
    }
    if (formData.phone && !/^[\d-]+$/.test(formData.phone)) {
      newErrors.phone = '올바른 연락처 형식이 아닙니다';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const now = new Date().toISOString();

      if (isEditMode && requester) {
        // 수정 모드: Requirements 1.4
        updateRequester(requester.id, {
          name: formData.name,
          position: formData.position,
          department: formData.department,
          phone: formData.phone,
          email: formData.email,
          is_primary: formData.is_primary,
        });
      } else {
        // 등록 모드: Requirements 1.1
        const newRequester: Requester = {
          id: crypto.randomUUID(),
          customer_id: customerId,
          name: formData.name,
          position: formData.position,
          department: formData.department,
          phone: formData.phone,
          email: formData.email,
          is_primary: formData.is_primary,
          is_active: true,
          created_at: now,
          updated_at: now,
        };
        saveRequester(newRequester);
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to save requester:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {isEditMode ? '의뢰자 정보 수정' : '신규 의뢰자 등록'}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              이름 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="홍길동"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">직책</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) =>
                setFormData({ ...formData, position: e.target.value })
              }
              placeholder="과장"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">부서</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
              placeholder="연구개발팀"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">연락처</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="010-0000-0000"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="email@company.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="flex items-center space-x-2 sm:col-span-2">
            <Checkbox
              id="is_primary"
              checked={formData.is_primary}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_primary: checked === true })
              }
            />
            <Label htmlFor="is_primary" className="cursor-pointer">
              주 담당자로 설정
            </Label>
          </div>
        </div>

        <DialogFooter className="pt-4">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              취소
            </Button>
          ) : (
            <DialogClose asChild>
              <Button type="button" variant="outline">
                취소
              </Button>
            </DialogClose>
          )}
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditMode ? '수정' : '등록'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
