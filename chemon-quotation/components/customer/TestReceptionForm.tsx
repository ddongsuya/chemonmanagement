'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { TestReception, Requester } from '@/types/customer';
import { testReceptionApi } from '@/lib/customer-data-api';

interface TestReceptionFormProps {
  customerId: string;
  contractId: string;
  quotationId: string;
  requesters: Requester[];
  testReception?: TestReception;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function TestReceptionForm({
  customerId,
  contractId,
  quotationId,
  requesters,
  testReception,
  onSuccess,
  onCancel,
}: TestReceptionFormProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    requester_id: testReception?.requester_id || '',
    substance_code: testReception?.substance_code || '',
    project_code: testReception?.project_code || '',
    substance_name: testReception?.substance_name || '',
    institution_name: testReception?.institution_name || '',
    test_number: testReception?.test_number || '',
    test_title: testReception?.test_title || '',
    test_director: testReception?.test_director || '',
    total_amount: testReception?.total_amount || 0,
    expected_completion_date: testReception?.expected_completion_date?.split('T')[0] || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = !!testReception;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.requester_id) {
      newErrors.requester_id = '의뢰자를 선택해주세요';
    }
    if (!formData.substance_code.trim()) {
      newErrors.substance_code = '물질코드를 입력해주세요';
    }
    if (!formData.project_code.trim()) {
      newErrors.project_code = '프로젝트코드를 입력해주세요';
    }
    if (!formData.substance_name.trim()) {
      newErrors.substance_name = '시험물질명을 입력해주세요';
    }
    if (!formData.institution_name.trim()) {
      newErrors.institution_name = '의뢰기관명을 입력해주세요';
    }
    if (!formData.test_number.trim()) {
      newErrors.test_number = '시험번호를 입력해주세요';
    }
    if (!formData.test_title.trim()) {
      newErrors.test_title = '시험제목을 입력해주세요';
    }
    if (!formData.test_director.trim()) {
      newErrors.test_director = '시험책임자를 입력해주세요';
    }
    if (formData.total_amount < 0) {
      newErrors.total_amount = '금액은 0 이상이어야 합니다';
    }
    if (!formData.expected_completion_date) {
      newErrors.expected_completion_date = '예상 완료일을 입력해주세요';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const receptionData = {
        requester_id: formData.requester_id,
        contract_id: contractId,
        quotation_id: quotationId,
        substance_code: formData.substance_code,
        project_code: formData.project_code,
        substance_name: formData.substance_name,
        institution_name: formData.institution_name,
        test_number: formData.test_number,
        test_title: formData.test_title,
        test_director: formData.test_director,
        total_amount: formData.total_amount,
        paid_amount: 0,
        remaining_amount: formData.total_amount,
        status: 'received' as const,
        reception_date: new Date().toISOString(),
        expected_completion_date: new Date(formData.expected_completion_date).toISOString(),
      };

      if (isEditMode && testReception) {
        // 수정 모드: Requirements 2.5
        await testReceptionApi.update(testReception.id, receptionData);
      } else {
        // 등록 모드: Requirements 2.2
        await testReceptionApi.create(customerId, receptionData as any);
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to save test reception:', error);
    } finally {
      setSaving(false);
    }
  };

  const activeRequesters = requesters.filter(r => r.is_active);

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {isEditMode ? '시험 접수 정보 수정' : '신규 시험 접수 등록'}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-5 py-4 max-h-[70vh] overflow-y-auto px-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* 의뢰자 선택 */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="requester_id">
              의뢰자 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.requester_id}
              onValueChange={(value) =>
                setFormData({ ...formData, requester_id: value })
              }
            >
              <SelectTrigger className={errors.requester_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="의뢰자를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {activeRequesters.map((requester) => (
                  <SelectItem key={requester.id} value={requester.id}>
                    {requester.name} ({requester.department || requester.position || '부서 미지정'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.requester_id && (
              <p className="text-sm text-red-500">{errors.requester_id}</p>
            )}
          </div>

          {/* 물질코드 */}
          <div className="space-y-1.5">
            <Label htmlFor="substance_code">
              물질코드 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="substance_code"
              value={formData.substance_code}
              onChange={(e) =>
                setFormData({ ...formData, substance_code: e.target.value })
              }
              placeholder="예: CHM-001"
              className={errors.substance_code ? 'border-red-500' : ''}
            />
            {errors.substance_code && (
              <p className="text-sm text-red-500">{errors.substance_code}</p>
            )}
          </div>

          {/* 프로젝트코드 */}
          <div className="space-y-1.5">
            <Label htmlFor="project_code">
              프로젝트코드 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="project_code"
              value={formData.project_code}
              onChange={(e) =>
                setFormData({ ...formData, project_code: e.target.value })
              }
              placeholder="예: PRJ-2024-001"
              className={errors.project_code ? 'border-red-500' : ''}
            />
            {errors.project_code && (
              <p className="text-sm text-red-500">{errors.project_code}</p>
            )}
          </div>

          {/* 시험물질명 */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="substance_name">
              시험물질명 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="substance_name"
              value={formData.substance_name}
              onChange={(e) =>
                setFormData({ ...formData, substance_name: e.target.value })
              }
              placeholder="시험물질명을 입력하세요"
              className={errors.substance_name ? 'border-red-500' : ''}
            />
            {errors.substance_name && (
              <p className="text-sm text-red-500">{errors.substance_name}</p>
            )}
          </div>

          {/* 의뢰기관명 */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="institution_name">
              의뢰기관명 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="institution_name"
              value={formData.institution_name}
              onChange={(e) =>
                setFormData({ ...formData, institution_name: e.target.value })
              }
              placeholder="의뢰기관명을 입력하세요"
              className={errors.institution_name ? 'border-red-500' : ''}
            />
            {errors.institution_name && (
              <p className="text-sm text-red-500">{errors.institution_name}</p>
            )}
          </div>

          {/* 시험번호 */}
          <div className="space-y-1.5">
            <Label htmlFor="test_number">
              시험번호 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="test_number"
              value={formData.test_number}
              onChange={(e) =>
                setFormData({ ...formData, test_number: e.target.value })
              }
              placeholder="예: TEST-2024-0001"
              className={errors.test_number ? 'border-red-500' : ''}
            />
            {errors.test_number && (
              <p className="text-sm text-red-500">{errors.test_number}</p>
            )}
          </div>

          {/* 시험책임자 */}
          <div className="space-y-1.5">
            <Label htmlFor="test_director">
              시험책임자 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="test_director"
              value={formData.test_director}
              onChange={(e) =>
                setFormData({ ...formData, test_director: e.target.value })
              }
              placeholder="시험책임자 이름"
              className={errors.test_director ? 'border-red-500' : ''}
            />
            {errors.test_director && (
              <p className="text-sm text-red-500">{errors.test_director}</p>
            )}
          </div>

          {/* 시험제목 */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="test_title">
              시험제목 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="test_title"
              value={formData.test_title}
              onChange={(e) =>
                setFormData({ ...formData, test_title: e.target.value })
              }
              placeholder="시험제목을 입력하세요"
              className={errors.test_title ? 'border-red-500' : ''}
            />
            {errors.test_title && (
              <p className="text-sm text-red-500">{errors.test_title}</p>
            )}
          </div>

          {/* 금액 */}
          <div className="space-y-1.5">
            <Label htmlFor="total_amount">총 금액 (원)</Label>
            <Input
              id="total_amount"
              type="number"
              value={formData.total_amount}
              onChange={(e) =>
                setFormData({ ...formData, total_amount: parseInt(e.target.value) || 0 })
              }
              placeholder="0"
              min="0"
              className={errors.total_amount ? 'border-red-500' : ''}
            />
            {errors.total_amount && (
              <p className="text-sm text-red-500">{errors.total_amount}</p>
            )}
          </div>

          {/* 예상 완료일 */}
          <div className="space-y-1.5">
            <Label htmlFor="expected_completion_date">
              예상 완료일 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="expected_completion_date"
              type="date"
              value={formData.expected_completion_date}
              onChange={(e) =>
                setFormData({ ...formData, expected_completion_date: e.target.value })
              }
              className={errors.expected_completion_date ? 'border-red-500' : ''}
            />
            {errors.expected_completion_date && (
              <p className="text-sm text-red-500">{errors.expected_completion_date}</p>
            )}
          </div>
        </div>

        <DialogFooter className="pt-6">
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
