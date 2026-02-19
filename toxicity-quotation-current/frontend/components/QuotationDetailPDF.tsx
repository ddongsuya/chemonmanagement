'use client';

import { useState } from 'react';
import { useQuotationStore } from '@/stores/quotationStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { QuotationItem, Test } from '@/types';

interface EditableTestData {
  animal_species: string | null;
  animals_per_sex: number | null;
  sex_type: string | null;
  control_groups: number | null;
  test_groups: number | null;
  total_groups: number | null;
  route: string | null;
  dosing_period: string | null;
  lead_time_weeks: number | null;
  glp_status: string;
  guidelines: string;
  clinical_phase: string;
  unit_price: number | null;
}

export default function QuotationDetailPDF() {
  const { selectedItems, customerName, projectName, updateItem } = useQuotationStore();
  const [editingItem, setEditingItem] = useState<QuotationItem | null>(null);
  const [editData, setEditData] = useState<EditableTestData | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const mainItems = selectedItems.filter((item) => !item.is_option);

  // 수정 다이얼로그 열기
  const handleEdit = (item: QuotationItem) => {
    const test = item.test;
    setEditingItem(item);
    setEditData({
      animal_species: test.animal_species || null,
      animals_per_sex: test.animals_per_sex || null,
      sex_type: test.sex_type || null,
      control_groups: test.control_groups || null,
      test_groups: test.test_groups || null,
      total_groups: test.total_groups || null,
      route: test.route || null,
      dosing_period: test.dosing_period || null,
      lead_time_weeks: test.lead_time_weeks || null,
      glp_status: test.glp_status || 'N/A',
      guidelines: test.guidelines || '',
      clinical_phase: test.clinical_phase || '',
      unit_price: item.unit_price,
    });
    setShowEditDialog(true);
  };


  // 저장
  const handleSave = () => {
    if (!editingItem || !editData) return;

    // 군수 자동 계산
    const totalGroups = (editData.control_groups || 0) + (editData.test_groups || 0);

    // test 객체 업데이트 (v2)
    const updatedTest: Test = {
      ...editingItem.test,
      animal_species: editData.animal_species || '',
      animals_per_sex: editData.animals_per_sex || 0,
      sex_type: editData.sex_type || '',
      control_groups: editData.control_groups || 0,
      test_groups: editData.test_groups || 0,
      total_groups: totalGroups || editData.total_groups || 0,
      route: editData.route || '',
      dosing_period: editData.dosing_period || '',
      lead_time_weeks: editData.lead_time_weeks || 0,
      glp_status: editData.glp_status as 'GLP' | 'Non-GLP' | 'N/A',
      guidelines: editData.guidelines || '',
      clinical_phase: editData.clinical_phase || '',
      unit_price: editData.unit_price || 0,
    };

    // QuotationItem 업데이트
    updateItem(editingItem.id, {
      test: updatedTest,
      unit_price: editData.unit_price || 0,
      amount: (editData.unit_price || 0) * editingItem.quantity,
    });

    setShowEditDialog(false);
    setEditingItem(null);
    setEditData(null);
  };

  return (
    <div className="bg-white p-8 shadow-lg max-w-4xl mx-auto print:shadow-none">
      {/* 헤더 */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-primary">CHEMON</h1>
        <h2 className="text-xl font-semibold mt-2">시험항목 상세내역</h2>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        고객사: {customerName || '-'} | 프로젝트: {projectName || '-'}
      </p>

      {/* 시험별 상세 */}
      <div className="space-y-6">
        {mainItems.map((item, index) => {
          const test = item.test;
          const options = selectedItems.filter(
            (opt) => opt.parent_item_id === item.id
          );

          return (
            <div key={item.id} className="border rounded-lg p-4 relative group">
              {/* 수정 버튼 */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                onClick={() => handleEdit(item)}
              >
                <Pencil className="w-4 h-4 mr-1" />
                수정
              </Button>

              <h3 className="font-semibold text-lg mb-3 pr-16">
                {index + 1}. {test.test_name.split('\n')[0]}
              </h3>

              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 w-28 text-gray-600">시험계</td>
                    <td className="py-2">{test.animal_species || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 text-gray-600">동물수</td>
                    <td className="py-2">
                      {test.sex_type}{' '}
                      {test.animals_per_sex
                        ? `${test.animals_per_sex}마리/군`
                        : '-'}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 text-gray-600">군구성</td>
                    <td className="py-2">
                      {test.control_groups && test.test_groups
                        ? `대조군 ${test.control_groups} + 시험군 ${test.test_groups} = ${test.total_groups}군`
                        : '-'}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 text-gray-600">투여경로</td>
                    <td className="py-2">{test.route || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 text-gray-600">투여기간</td>
                    <td className="py-2">{test.dosing_period || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 text-gray-600">소요기간</td>
                    <td className="py-2">
                      {test.lead_time_weeks
                        ? `약 ${test.lead_time_weeks}주`
                        : '-'}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 text-gray-600">GLP 여부</td>
                    <td className="py-2">{test.glp_status || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 text-gray-600">가이드라인</td>
                    <td className="py-2 text-xs">{test.guidelines || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 text-gray-600">임상단계</td>
                    <td className="py-2">{test.clinical_phase || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-600 font-medium">단가</td>
                    <td className="py-2 font-semibold text-primary">
                      {item.unit_price ? formatCurrency(item.unit_price) : '별도협의'}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* 옵션 시험 */}
              {options.length > 0 && (
                <div className="mt-4 pl-4 border-l-2 border-primary/30">
                  {options.map((opt) => (
                    <div key={opt.id} className="text-sm py-2 flex justify-between items-center group/opt">
                      <div>
                        <span className="font-medium">
                          └ {opt.test.option_type || opt.test.test_name.split('\n')[0]}
                        </span>
                        {opt.test.test_name.includes('채혈') && (
                          <p className="text-gray-600 text-xs mt-1">
                            채혈포인트:{' '}
                            {opt.test.option_type?.match(/\d+pt/)?.[0] || '-'}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-medium">
                          {opt.unit_price ? formatCurrency(opt.unit_price) : '-'}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover/opt:opacity-100 transition-opacity print:hidden"
                          onClick={() => handleEdit(opt)}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 푸터 */}
      <div className="mt-8 pt-4 border-t text-sm text-gray-500">
        <p>
          * 상기 내용은 표준 시험 조건이며, 협의에 따라 변경될 수 있습니다.
        </p>
        <p className="mt-1 text-xs print:hidden text-blue-600">
          💡 각 시험항목에 마우스를 올리면 수정 버튼이 나타납니다.
        </p>
      </div>


      {/* 수정 다이얼로그 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>시험항목 수정</DialogTitle>
          </DialogHeader>

          {editingItem && editData && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-sm">{editingItem.test.test_name.split('\n')[0]}</p>
                <p className="text-xs text-gray-500 mt-1">시험ID: {editingItem.test.test_id}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>단가 (원)</Label>
                  <Input
                    type="number"
                    value={editData.unit_price || ''}
                    onChange={(e) => setEditData({
                      ...editData,
                      unit_price: e.target.value ? Number(e.target.value) : null
                    })}
                    placeholder="별도협의시 비워두세요"
                  />
                </div>

                <div className="space-y-2">
                  <Label>시험계 (동물종)</Label>
                  <Input
                    value={editData.animal_species || ''}
                    onChange={(e) => setEditData({ ...editData, animal_species: e.target.value || null })}
                    placeholder="예: SD rat, Beagle dog"
                  />
                </div>

                <div className="space-y-2">
                  <Label>성별 유형</Label>
                  <Select
                    value={editData.sex_type || ''}
                    onValueChange={(v) => setEditData({ ...editData, sex_type: v || null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="암수 각각">암수 각각</SelectItem>
                      <SelectItem value="수컷">수컷</SelectItem>
                      <SelectItem value="암컷">암컷</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>동물수/성별 (마리/군)</Label>
                  <Input
                    type="number"
                    value={editData.animals_per_sex || ''}
                    onChange={(e) => setEditData({
                      ...editData,
                      animals_per_sex: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>대조군 수</Label>
                  <Input
                    type="number"
                    value={editData.control_groups || ''}
                    onChange={(e) => setEditData({
                      ...editData,
                      control_groups: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>시험군 수</Label>
                  <Input
                    type="number"
                    value={editData.test_groups || ''}
                    onChange={(e) => setEditData({
                      ...editData,
                      test_groups: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>투여경로</Label>
                  <Input
                    value={editData.route || ''}
                    onChange={(e) => setEditData({ ...editData, route: e.target.value || null })}
                    placeholder="예: 경구, 정맥, 피하"
                  />
                </div>

                <div className="space-y-2">
                  <Label>투여기간</Label>
                  <Input
                    value={editData.dosing_period || ''}
                    onChange={(e) => setEditData({ ...editData, dosing_period: e.target.value || null })}
                    placeholder="예: 4주, 13주"
                  />
                </div>

                <div className="space-y-2">
                  <Label>소요기간 (주)</Label>
                  <Input
                    type="number"
                    value={editData.lead_time_weeks || ''}
                    onChange={(e) => setEditData({
                      ...editData,
                      lead_time_weeks: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>GLP 상태</Label>
                  <Select
                    value={editData.glp_status}
                    onValueChange={(v) => setEditData({ ...editData, glp_status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GLP">GLP</SelectItem>
                      <SelectItem value="Non-GLP">Non-GLP</SelectItem>
                      <SelectItem value="N/A">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label>가이드라인</Label>
                  <Input
                    value={editData.guidelines}
                    onChange={(e) => setEditData({ ...editData, guidelines: e.target.value })}
                    placeholder="예: OECD TG 407"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label>임상단계</Label>
                  <Input
                    value={editData.clinical_phase}
                    onChange={(e) => setEditData({ ...editData, clinical_phase: e.target.value })}
                    placeholder="예: Phase 1, 해당분야별"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              취소
            </Button>
            <Button onClick={handleSave}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
