'use client';

import { useState, useMemo } from 'react';
import { useEfficacyQuotationStore } from '@/stores/efficacyQuotationStore';
import { getEfficacyMasterData } from '@/lib/efficacy-storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ArrowLeft, ArrowRight, Search, Plus, Trash2, Package, ListPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getOptionalItemsForModel,
  filterItemsBySearch,
} from '@/lib/efficacy-item-utils';
import type { PriceItem, ModelItem } from '@/types/efficacy';

/**
 * StepItemConfiguration Component
 * Step 3 of efficacy quotation wizard - Item configuration
 * Redesigned with table-based layout for better visibility
 * Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3
 */

// Format number with Korean won
function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

export default function StepItemConfiguration() {
  const {
    selectedModelId,
    selectedModel,
    selectedItems,
    subtotal,
    addItem,
    removeItem,
    updateItem,
    nextStep,
    prevStep,
  } = useEfficacyQuotationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('selected');

  // Get master data for price lookup
  const masterData = getEfficacyMasterData();
  const priceMap = useMemo(() => {
    const map = new Map<string, PriceItem>();
    masterData.price_master.forEach((p) => map.set(p.item_id, p));
    return map;
  }, [masterData.price_master]);

  // Get optional items for the selected model
  const optionalItems = useMemo(() => {
    if (!selectedModelId) return [];
    return getOptionalItemsForModel(selectedModelId);
  }, [selectedModelId]);

  // Filter optional items by search query
  const filteredOptionalItems = useMemo(() => {
    return filterItemsBySearch(optionalItems, searchQuery);
  }, [optionalItems, searchQuery]);

  // Get IDs of already selected items
  const selectedItemIds = useMemo(() => {
    return new Set(selectedItems.map((item) => item.item_id));
  }, [selectedItems]);

  // Available optional items (not yet selected)
  const availableOptionalItems = useMemo(() => {
    return filteredOptionalItems.filter(
      (item) => !selectedItemIds.has(item.item_id)
    );
  }, [filteredOptionalItems, selectedItemIds]);

  // Group selected items by category
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, typeof selectedItems> = {};
    selectedItems.forEach((item) => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    return grouped;
  }, [selectedItems]);

  // Handle item update
  const handleQuantityChange = (itemId: string, value: string) => {
    const item = selectedItems.find((i) => i.id === itemId);
    if (!item) return;
    const qty = Math.max(0, parseInt(value) || 0);
    updateItem(itemId, qty, item.multiplier);
  };

  const handleMultiplierChange = (itemId: string, value: string) => {
    const item = selectedItems.find((i) => i.id === itemId);
    if (!item) return;
    const mult = Math.max(0, parseInt(value) || 0);
    updateItem(itemId, item.quantity, mult);
  };

  // Handle item removal
  const handleItemRemove = (itemId: string) => {
    removeItem(itemId);
  };

  // Handle adding optional item
  const handleAddOptionalItem = (modelItem: ModelItem) => {
    addItem(modelItem);
    setActiveTab('selected');
  };

  if (!selectedModelId || !selectedModel) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">먼저 효력시험 모델을 선택해주세요.</p>
          <Button variant="outline" onClick={prevStep} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            모델 선택으로 돌아가기
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>항목 구성</CardTitle>
              <CardDescription>
                {selectedModel.model_name} 모델의 항목을 구성합니다.
                수량과 횟수를 입력하여 견적을 산출합니다.
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">현재 소계</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {formatKRW(subtotal)}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs for Selected Items and Optional Items */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="selected" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                선택된 항목
                <Badge variant="secondary" className="ml-1">
                  {selectedItems.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="optional" className="flex items-center gap-2">
                <ListPlus className="w-4 h-4" />
                옵션 항목 추가
                <Badge variant="outline" className="ml-1">
                  {availableOptionalItems.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="pt-4">
            {/* Selected Items Tab */}
            <TabsContent value="selected" className="mt-0">
              {selectedItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>선택된 항목이 없습니다.</p>
                  <p className="text-sm mt-1">옵션 항목 탭에서 항목을 추가해주세요.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(itemsByCategory).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Badge variant="outline">{category}</Badge>
                        <span className="text-xs text-gray-500">
                          ({items.length}개)
                        </span>
                      </h3>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50 dark:bg-gray-800">
                              <TableHead className="w-[40%]">항목명</TableHead>
                              <TableHead className="text-right w-[15%]">단가</TableHead>
                              <TableHead className="text-center w-[12%]">수량</TableHead>
                              <TableHead className="text-center w-[12%]">횟수</TableHead>
                              <TableHead className="text-right w-[15%]">금액</TableHead>
                              <TableHead className="w-[6%]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map((item) => (
                              <TableRow key={item.id} className={cn(
                                item.is_default 
                                  ? 'bg-green-50/50 dark:bg-green-900/10' 
                                  : ''
                              )}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">
                                      {item.item_name}
                                    </span>
                                    <Badge
                                      variant="secondary"
                                      className={cn(
                                        'text-xs',
                                        item.is_default
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-blue-100 text-blue-800'
                                      )}
                                    >
                                      {item.is_default ? '기본' : '옵션'}
                                    </Badge>
                                  </div>
                                  {item.usage_note && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {item.usage_note}
                                    </p>
                                  )}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {formatKRW(item.unit_price)}
                                  <span className="text-xs text-gray-400 ml-1">
                                    /{item.unit}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleQuantityChange(item.id, e.target.value)
                                    }
                                    className="h-8 w-20 text-center mx-auto"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={item.multiplier}
                                    onChange={(e) =>
                                      handleMultiplierChange(item.id, e.target.value)
                                    }
                                    className="h-8 w-20 text-center mx-auto"
                                  />
                                </TableCell>
                                <TableCell className="text-right font-semibold text-sm">
                                  {formatKRW(item.amount)}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-400 hover:text-red-500"
                                    onClick={() => handleItemRemove(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}

                  {/* Summary */}
                  <div className="flex justify-end pt-4 border-t">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        총 {selectedItems.length}개 항목
                      </p>
                      <p className="text-lg font-bold">
                        소계: {formatKRW(subtotal)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Optional Items Tab */}
            <TabsContent value="optional" className="mt-0">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="항목 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {availableOptionalItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ListPlus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>
                    {searchQuery
                      ? '검색 결과가 없습니다.'
                      : '추가 가능한 옵션 항목이 없습니다.'}
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-800">
                        <TableHead className="w-[50%]">항목명</TableHead>
                        <TableHead className="text-right w-[25%]">단가</TableHead>
                        <TableHead className="text-center w-[25%]">추가</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableOptionalItems.map((modelItem) => {
                        const priceItem = priceMap.get(modelItem.item_id);
                        if (!priceItem) return null;

                        return (
                          <TableRow
                            key={modelItem.item_id}
                            className="hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
                            onClick={() => handleAddOptionalItem(modelItem)}
                          >
                            <TableCell>
                              <span className="font-medium text-sm">
                                {priceItem.item_name}
                              </span>
                              {modelItem.usage_note && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {modelItem.usage_note}
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {formatKRW(priceItem.unit_price)}
                              <span className="text-xs text-gray-400 ml-1">
                                /{priceItem.unit}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                추가
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Navigation buttons */}
      <Card>
        <CardContent className="py-4">
          <div className="flex justify-between">
            <Button variant="outline" onClick={prevStep}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              이전: 모델 선택
            </Button>
            <Button onClick={nextStep} disabled={selectedItems.length === 0}>
              다음: 금액 계산
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
