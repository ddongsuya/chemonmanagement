'use client';

import { useState } from 'react';
import { useQuotationStore } from '@/stores/quotationStore';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { COMPANY_INFO } from '@/lib/constants';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Pencil } from 'lucide-react';
import { QuotationItem } from '@/types';

interface Props {
  quotationNumber: string;
}

export default function QuotationPDF({ quotationNumber }: Props) {
  const {
    customerName,
    projectName,
    validDays,
    selectedItems,
    subtotalTest,
    subtotalAnalysis,
    discountRate,
    discountAmount,
    totalAmount,
    updateItem,
  } = useQuotationStore();

  const { user } = useAuthStore();

  const [editingItem, setEditingItem] = useState<QuotationItem | null>(null);
  const [editPrice, setEditPrice] = useState<number | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);
  const mainItems = selectedItems.filter((item) => !item.is_option);

  // 담당자 정보 (로그인한 사용자 정보 사용)
  const managerName = user?.name || '담당자';
  const managerEmail = user?.email || 'contact@chemon.co.kr';

  // 가격 수정 다이얼로그 열기
  const handleEditPrice = (item: QuotationItem) => {
    setEditingItem(item);
    setEditPrice(item.unit_price);
    setShowEditDialog(true);
  };

  // 가격 저장
  const handleSavePrice = () => {
    if (!editingItem) return;

    const newPrice = editPrice || 0;
    updateItem(editingItem.id, {
      unit_price: newPrice,
      amount: newPrice * editingItem.quantity,
    });

    setShowEditDialog(false);
    setEditingItem(null);
    setEditPrice(null);
  };

  // 빠른 가격 수정 (Popover)
  const QuickPriceEdit = ({ item }: { item: QuotationItem }) => {
    const [price, setPrice] = useState(item.unit_price);
    const [open, setOpen] = useState(false);

    const handleSave = () => {
      const newPrice = price || 0;
      updateItem(item.id, {
        unit_price: newPrice,
        amount: newPrice * item.quantity,
      });
      setOpen(false);
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="text-right w-full hover:bg-blue-50 rounded px-1 -mx-1 transition-colors group print:hover:bg-transparent">
            <span>{formatCurrency(item.amount).replace('원', '')}</span>
            <Pencil className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-50 print:hidden" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 print:hidden" align="end">
          <div className="space-y-3">
            <div className="text-sm font-medium truncate">
              {item.test.test_name.split('\n')[0].slice(0, 30)}
            </div>
            <div className="space-y-2">
              <Label>단가 (원)</Label>
              <Input
                type="number"
                value={price || ''}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : 0)}
                placeholder="금액 입력"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                취소
              </Button>
              <Button size="sm" onClick={handleSave} className="flex-1">
                적용
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div
      className="bg-white p-8 shadow-lg max-w-4xl mx-auto print:shadow-none"
      id="quotation-pdf"
    >
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">CHEMON</h1>
        <h2 className="text-2xl font-semibold">견 적 서</h2>
      </div>

      {/* 견적 정보 */}
      <div className="flex justify-between mb-6 text-sm">
        <div>
          <p>
            <strong>견적번호:</strong> {quotationNumber}
          </p>
          <p>
            <strong>견적일자:</strong> {formatDate(new Date())}
          </p>
          <p>
            <strong>유효기간:</strong> {formatDate(validUntil)}까지
          </p>
        </div>
      </div>

      {/* 수신/발신 */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div className="border p-4 rounded">
          <h3 className="font-semibold mb-2 text-gray-700">수신</h3>
          <p className="font-medium">{customerName || '-'}</p>
          <p className="text-sm text-gray-600">프로젝트: {projectName || '-'}</p>
        </div>
        <div className="border p-4 rounded">
          <h3 className="font-semibold mb-2 text-gray-700">발신</h3>
          <p className="font-medium">{COMPANY_INFO.name}</p>
          <p className="text-sm text-gray-600">{COMPANY_INFO.address}</p>
          <p className="text-sm text-gray-600">Tel: {COMPANY_INFO.tel}</p>
        </div>
      </div>

      {/* 안내 메시지 */}
      <p className="text-xs text-blue-600 mb-2 print:hidden">
        💡 금액을 클릭하면 바로 수정할 수 있습니다.
      </p>

      {/* 견적 테이블 */}
      <table className="w-full border-collapse mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left w-12">No</th>
            <th className="border p-2 text-left">시험항목</th>
            <th className="border p-2 text-center w-20">규격</th>
            <th className="border p-2 text-right w-32">금액(원)</th>
          </tr>
        </thead>
        <tbody>
          {selectedItems.map((item) => (
            <tr key={item.id} className="group">
              <td className="border p-2">
                {item.is_option
                  ? ''
                  : mainItems.findIndex((m) => m.id === item.id) + 1}
              </td>
              <td className="border p-2 text-sm">
                {item.is_option && (
                  <span className="text-gray-400 mr-1">└</span>
                )}
                {item.test.option_type ||
                  item.test.test_name.split('\n')[0].slice(0, 35)}
              </td>
              <td className="border p-2 text-center text-sm">
                {item.test.glp_status || 'N/A'}
              </td>
              <td className="border p-2">
                <QuickPriceEdit item={item} />
              </td>
            </tr>
          ))}

          {/* 조제물분석 */}
          {subtotalAnalysis > 0 && (
            <tr>
              <td className="border p-2">{mainItems.length + 1}</td>
              <td className="border p-2">조제물분석</td>
              <td className="border p-2 text-center">-</td>
              <td className="border p-2 text-right">
                {formatCurrency(subtotalAnalysis).replace('원', '')}
              </td>
            </tr>
          )}

          {/* 소계 */}
          <tr className="bg-gray-50 font-semibold">
            <td colSpan={3} className="border p-2 text-right">
              소계
            </td>
            <td className="border p-2 text-right">
              {formatCurrency(subtotalTest + subtotalAnalysis).replace('원', '')}
            </td>
          </tr>

          {/* 할인 */}
          {discountRate > 0 && (
            <tr className="text-red-600">
              <td colSpan={3} className="border p-2 text-right">
                할인 ({discountRate}%)
              </td>
              <td className="border p-2 text-right">
                -{formatCurrency(discountAmount).replace('원', '')}
              </td>
            </tr>
          )}

          {/* 합계 */}
          <tr className="bg-primary/10 font-bold">
            <td colSpan={3} className="border p-2 text-right">
              합계
            </td>
            <td className="border p-2 text-right text-primary">
              {formatCurrency(totalAmount).replace('원', '')}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 주석 */}
      <div className="text-sm text-gray-600 space-y-1 mb-6">
        <p>* 부가가치세 별도</p>
        <p>* 상기 금액은 견적 유효기간 내 계약 체결 시 적용됩니다.</p>
        <p>* 시험항목 상세내역은 다음 페이지를 참고해 주시기 바랍니다.</p>
      </div>

      {/* 푸터 */}
      <div className="border-t pt-4 text-sm text-gray-600">
        <p>
          담당자: {managerName} ({managerEmail}) / {COMPANY_INFO.tel}
        </p>
      </div>

      {/* 가격 수정 다이얼로그 (대체 방식) */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>가격 수정</DialogTitle>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-sm">
                  {editingItem.test.test_name.split('\n')[0]}
                </p>
              </div>

              <div className="space-y-2">
                <Label>단가 (원)</Label>
                <Input
                  type="number"
                  value={editPrice || ''}
                  onChange={(e) => setEditPrice(e.target.value ? Number(e.target.value) : null)}
                  placeholder="금액 입력"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              취소
            </Button>
            <Button onClick={handleSavePrice}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
