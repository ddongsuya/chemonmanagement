'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { VALIDITY_OPTIONS } from '@/lib/constants';

export default function EditQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // TODO: API에서 데이터 로드
  const [formData, setFormData] = useState({
    customer_name: '(주)바이오팜',
    project_name: 'IND 패키지',
    valid_days: 30,
    notes: '특이사항 없음',
    discount_rate: 10,
  });

  const handleSave = async () => {
    setSaving(true);
    // TODO: API 연동
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    router.push(`/quotations/${params.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="견적서 수정"
        description={`견적번호: Q-2025-042`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/quotations/${params.id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" /> 취소
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>고객사</Label>
              <Input
                value={formData.customer_name}
                onChange={(e) =>
                  setFormData({ ...formData, customer_name: e.target.value })
                }
                disabled
              />
              <p className="text-xs text-gray-500">
                고객사는 변경할 수 없습니다
              </p>
            </div>

            <div className="space-y-2">
              <Label>프로젝트명</Label>
              <Input
                value={formData.project_name}
                onChange={(e) =>
                  setFormData({ ...formData, project_name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>견적 유효기간</Label>
              <Select
                value={formData.valid_days.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, valid_days: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VALIDITY_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value.toString()}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>할인율 (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.discount_rate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discount_rate: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>특이사항</Label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="견적 관련 특이사항을 입력하세요"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" asChild>
              <Link href={`/quotations/${params.id}`}>취소</Link>
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              저장
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>시험 항목 수정</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            시험 항목을 수정하려면 견적서를 복사하여 새로 작성해주세요.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
