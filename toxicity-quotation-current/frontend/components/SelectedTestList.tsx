'use client';

import { useQuotationStore } from '@/stores/quotationStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/lib/utils';
import { X, FileText } from 'lucide-react';

export default function SelectedTestList() {
  const { selectedItems, removeItem, subtotalTest } = useQuotationStore();

  // 본시험만 필터링 (옵션 제외)
  const mainItems = selectedItems.filter((item) => !item.is_option);

  // 특정 본시험의 옵션 가져오기
  const getOptionsForItem = (itemId: string) => {
    return selectedItems.filter((item) => item.parent_item_id === itemId);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="w-5 h-5" />
          선택된 시험
          <span className="ml-auto text-sm font-normal text-gray-500">
            {selectedItems.length}개
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>선택된 시험이 없습니다</p>
            <p className="text-sm">좌측에서 시험을 선택해주세요</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[350px]">
              <div className="space-y-2 pr-4">
                {mainItems.map((item, index) => {
                  const options = getOptionsForItem(item.id);
                  const testName = item.test.test_name.split('\n')[0];

                  return (
                    <div key={item.id}>
                      {/* 본시험 */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">
                            {index + 1}.{' '}
                            {testName.length > 20
                              ? testName.slice(0, 20) + '...'
                              : testName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {formatCurrency(item.amount)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6"
                            onClick={() => removeItem(item.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* 옵션 시험 */}
                      {options.map((opt) => (
                        <div
                          key={opt.id}
                          className="flex items-center justify-between p-2 pl-6 text-sm text-gray-600"
                        >
                          <span>
                            └ {opt.test.option_type || '옵션'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span>{formatCurrency(opt.amount)}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-6 h-6"
                              onClick={() => removeItem(opt.id)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* 소계 */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between font-semibold">
                <span>시험비용 소계</span>
                <span className="text-primary">
                  {formatCurrency(subtotalTest)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                * 조제물분석 비용은 다음 단계에서 자동 계산됩니다
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
