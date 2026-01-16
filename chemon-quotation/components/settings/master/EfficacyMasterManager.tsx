'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Plus,
  Pencil,
  Eye,
  RotateCcw,
  DollarSign,
  Beaker,
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  getEfficacyMasterData,
  saveEfficacyMasterData,
  resetEfficacyMasterData,
} from '@/lib/efficacy-storage';
import {
  PriceItem,
  EfficacyModel,
  ModelItem,
  EfficacyMasterData,
} from '@/types/efficacy';

// Category colors for tabs
const categoryColors: Record<string, { bg: string; text: string; active: string }> = {
  '동물비': { bg: 'bg-blue-100', text: 'text-blue-700', active: 'bg-blue-500 text-white' },
  '사육비': { bg: 'bg-green-100', text: 'text-green-700', active: 'bg-green-500 text-white' },
  '측정': { bg: 'bg-purple-100', text: 'text-purple-700', active: 'bg-purple-500 text-white' },
  '조직병리': { bg: 'bg-pink-100', text: 'text-pink-700', active: 'bg-pink-500 text-white' },
  '분석': { bg: 'bg-orange-100', text: 'text-orange-700', active: 'bg-orange-500 text-white' },
  '기타': { bg: 'bg-gray-100', text: 'text-gray-700', active: 'bg-gray-500 text-white' },
};

// Model category colors
const modelCategoryColors: Record<string, { bg: string; text: string; active: string }> = {
  '피부': { bg: 'bg-pink-100', text: 'text-pink-700', active: 'bg-pink-500 text-white' },
  '피부/면역': { bg: 'bg-pink-100', text: 'text-pink-700', active: 'bg-pink-500 text-white' },
  '항암': { bg: 'bg-red-100', text: 'text-red-700', active: 'bg-red-500 text-white' },
  '면역/항암': { bg: 'bg-red-100', text: 'text-red-700', active: 'bg-red-500 text-white' },
  '근골격': { bg: 'bg-blue-100', text: 'text-blue-700', active: 'bg-blue-500 text-white' },
  '대사': { bg: 'bg-green-100', text: 'text-green-700', active: 'bg-green-500 text-white' },
  '대사/혈관': { bg: 'bg-green-100', text: 'text-green-700', active: 'bg-green-500 text-white' },
  '신경': { bg: 'bg-purple-100', text: 'text-purple-700', active: 'bg-purple-500 text-white' },
  '심혈관': { bg: 'bg-orange-100', text: 'text-orange-700', active: 'bg-orange-500 text-white' },
  '세포': { bg: 'bg-cyan-100', text: 'text-cyan-700', active: 'bg-cyan-500 text-white' },
  '소화기': { bg: 'bg-yellow-100', text: 'text-yellow-700', active: 'bg-yellow-500 text-white' },
  '비뇨기': { bg: 'bg-indigo-100', text: 'text-indigo-700', active: 'bg-indigo-500 text-white' },
};

const getCategoryColor = (category: string, isModel = false) => {
  const colors = isModel ? modelCategoryColors : categoryColors;
  return colors[category] || { bg: 'bg-gray-100', text: 'text-gray-700', active: 'bg-gray-500 text-white' };
};

// Empty templates
const emptyPriceItem: Partial<PriceItem> = {
  item_id: '',
  category: '',
  subcategory: null,
  item_name: '',
  item_detail: '',
  unit_price: 0,
  unit: '',
  remarks: '',
  is_active: true,
};

export default function EfficacyMasterManager() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('price');
  const [masterData, setMasterData] = useState<EfficacyMasterData | null>(null);

  // Price Master state
  const [priceSearchQuery, setPriceSearchQuery] = useState('');
  const [selectedPriceCategory, setSelectedPriceCategory] = useState<string | null>(null);
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [showPriceDetailDialog, setShowPriceDetailDialog] = useState(false);
  const [editingPriceItem, setEditingPriceItem] = useState<Partial<PriceItem>>(emptyPriceItem);
  const [selectedPriceItem, setSelectedPriceItem] = useState<PriceItem | null>(null);
  const [isNewPriceItem, setIsNewPriceItem] = useState(false);

  // Model state
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [selectedModelCategory, setSelectedModelCategory] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Load master data
  useEffect(() => {
    const data = getEfficacyMasterData();
    setMasterData(data);
  }, []);

  // Get unique categories from price master with counts
  const priceCategoriesWithCounts = useMemo(() => {
    if (!masterData) return [];
    const counts: Record<string, number> = {};
    masterData.price_master.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  }, [masterData]);

  // Get unique model categories with counts
  const modelCategoriesWithCounts = useMemo(() => {
    if (!masterData) return [];
    const counts: Record<string, number> = {};
    masterData.models.forEach((m) => {
      counts[m.category] = (counts[m.category] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  }, [masterData]);

  // Filtered price items
  const filteredPriceItems = useMemo(() => {
    if (!masterData) return [];
    return masterData.price_master.filter((item) => {
      const matchesSearch =
        priceSearchQuery === '' ||
        item.item_name.toLowerCase().includes(priceSearchQuery.toLowerCase()) ||
        item.item_id.toLowerCase().includes(priceSearchQuery.toLowerCase());
      const matchesCategory =
        !selectedPriceCategory || item.category === selectedPriceCategory;
      return matchesSearch && matchesCategory;
    });
  }, [masterData, priceSearchQuery, selectedPriceCategory]);

  // Filtered models
  const filteredModels = useMemo(() => {
    if (!masterData || !masterData.models) return [];
    return masterData.models.filter((model) => {
      const matchesSearch =
        modelSearchQuery === '' ||
        model.model_name.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
        model.indication.toLowerCase().includes(modelSearchQuery.toLowerCase());
      const matchesCategory =
        !selectedModelCategory || model.category === selectedModelCategory;
      return matchesSearch && matchesCategory;
    });
  }, [masterData, modelSearchQuery, selectedModelCategory]);

  // Handle price item edit
  const handleEditPriceItem = (item: PriceItem) => {
    setEditingPriceItem({ ...item });
    setIsNewPriceItem(false);
    setShowPriceDialog(true);
  };

  // Handle price item view
  const handleViewPriceItem = (item: PriceItem) => {
    setSelectedPriceItem(item);
    setShowPriceDetailDialog(true);
  };

  // Handle new price item
  const handleNewPriceItem = () => {
    setEditingPriceItem({ ...emptyPriceItem, category: selectedPriceCategory || '' });
    setIsNewPriceItem(true);
    setShowPriceDialog(true);
  };

  // Save price item
  const handleSavePriceItem = () => {
    if (!masterData || !editingPriceItem.item_id || !editingPriceItem.item_name) return;

    const updatedPriceMaster = isNewPriceItem
      ? [...masterData.price_master, editingPriceItem as PriceItem]
      : masterData.price_master.map((p) =>
          p.item_id === editingPriceItem.item_id ? (editingPriceItem as PriceItem) : p
        );

    const updatedData = { ...masterData, price_master: updatedPriceMaster };
    saveEfficacyMasterData(updatedData);
    setMasterData(updatedData);
    setShowPriceDialog(false);

    toast({
      title: isNewPriceItem ? '항목 추가 완료' : '항목 수정 완료',
      description: `${editingPriceItem.item_name} 항목이 ${isNewPriceItem ? '추가' : '수정'}되었습니다.`,
    });
  };

  // Reset master data
  const handleResetMasterData = () => {
    const resetData = resetEfficacyMasterData();
    setMasterData(resetData);
    setShowResetDialog(false);

    toast({
      title: '초기화 완료',
      description: '효력시험 마스터 데이터가 기본값으로 초기화되었습니다.',
    });
  };

  if (!masterData) {
    return <div className="text-center py-8">데이터를 불러오는 중...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            효력시험 단가 항목 {masterData.price_master.length}개, 모델 {masterData.models.length}개
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowResetDialog(true)}>
          <RotateCcw className="w-4 h-4 mr-2" />
          초기화
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="price" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            단가 마스터
          </TabsTrigger>
          <TabsTrigger value="models" className="flex items-center gap-2">
            <Beaker className="w-4 h-4" />
            모델 목록
          </TabsTrigger>
        </TabsList>

        {/* 단가 마스터 탭 */}
        <TabsContent value="price" className="space-y-4">
          {/* Category Filter Tabs */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">카테고리 선택</Label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedPriceCategory(null)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                  !selectedPriceCategory
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                전체 ({masterData.price_master.length})
              </button>
              {priceCategoriesWithCounts.map(([cat, count]) => {
                const colors = getCategoryColor(cat);
                const isSelected = selectedPriceCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedPriceCategory(cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                      isSelected ? colors.active : `${colors.bg} ${colors.text} hover:opacity-80`
                    )}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search and Add */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="항목명 또는 ID로 검색..."
                value={priceSearchQuery}
                onChange={(e) => setPriceSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleNewPriceItem}>
              <Plus className="w-4 h-4 mr-2" />
              항목 추가
            </Button>
          </div>

          {/* Results info */}
          <div className="text-sm text-muted-foreground">
            {selectedPriceCategory && (
              <Badge variant="secondary" className="mr-2">
                {selectedPriceCategory}
              </Badge>
            )}
            {filteredPriceItems.length}개 항목
          </div>

          <ScrollArea className="h-[400px] border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">ID</TableHead>
                  <TableHead className="w-24">카테고리</TableHead>
                  <TableHead>항목명</TableHead>
                  <TableHead className="text-right w-28">단가</TableHead>
                  <TableHead className="w-20">단위</TableHead>
                  <TableHead className="w-20">상태</TableHead>
                  <TableHead className="w-24">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPriceItems.map((item) => (
                  <TableRow key={item.item_id}>
                    <TableCell className="font-mono text-xs">{item.item_id}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category}</Badge>
                    </TableCell>
                    <TableCell>{item.item_name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? 'default' : 'secondary'}>
                        {item.is_active ? '활성' : '비활성'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewPriceItem(item)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditPriceItem(item)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>

        {/* 모델 목록 탭 */}
        <TabsContent value="models" className="space-y-4">
          {/* Category Filter Tabs */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">카테고리 선택</Label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedModelCategory(null)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                  !selectedModelCategory
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                전체 ({masterData.models.length})
              </button>
              {modelCategoriesWithCounts.map(([cat, count]) => {
                const colors = getCategoryColor(cat, true);
                const isSelected = selectedModelCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedModelCategory(cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                      isSelected ? colors.active : `${colors.bg} ${colors.text} hover:opacity-80`
                    )}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="모델명 또는 적응증으로 검색..."
                value={modelSearchQuery}
                onChange={(e) => setModelSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Results info */}
          <div className="text-sm text-muted-foreground">
            {selectedModelCategory && (
              <Badge variant="secondary" className="mr-2">
                {selectedModelCategory}
              </Badge>
            )}
            {filteredModels.length}개 모델
          </div>

          <ScrollArea className="h-[400px] border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">ID</TableHead>
                  <TableHead className="w-20">카테고리</TableHead>
                  <TableHead>모델명</TableHead>
                  <TableHead>적응증</TableHead>
                  <TableHead className="w-24">기본항목</TableHead>
                  <TableHead className="w-24">옵션항목</TableHead>
                  <TableHead className="w-20">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModels.map((model) => {
                  const modelItems = (masterData.model_items || []).filter(
                    (mi) => mi.model_id === model.model_id
                  );
                  const defaultCount = modelItems.filter((mi) => mi.is_default).length;
                  const optionalCount = modelItems.filter((mi) => !mi.is_default).length;

                  return (
                    <TableRow key={model.model_id}>
                      <TableCell className="font-mono text-xs">{model.model_id}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{model.category}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{model.model_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{model.indication}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="default">{defaultCount}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{optionalCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={model.is_active ? 'default' : 'secondary'}>
                          {model.is_active ? '활성' : '비활성'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Price Item Edit Dialog */}
      <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {isNewPriceItem ? '새 단가 항목 추가' : '단가 항목 수정'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6">
            {/* 왼쪽: 기존 항목 목록 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">기존 등록 항목</Label>
                <Badge variant="outline">
                  {editingPriceItem.category
                    ? masterData.price_master.filter((p) => p.category === editingPriceItem.category).length
                    : masterData.price_master.length}개
                </Badge>
              </div>
              <ScrollArea className="h-[320px] border rounded-lg">
                <div className="p-2 space-y-1">
                  {masterData.price_master
                    .filter((p) => !editingPriceItem.category || p.category === editingPriceItem.category)
                    .map((item) => {
                      const isDuplicate =
                        editingPriceItem.item_name &&
                        item.item_name.toLowerCase() === editingPriceItem.item_name.toLowerCase();
                      return (
                        <div
                          key={item.item_id}
                          className={`p-2 rounded text-sm ${
                            isDuplicate ? 'bg-red-100 border border-red-300' : 'hover:bg-muted'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium">{item.item_name}</span>
                              {isDuplicate && (
                                <Badge variant="destructive" className="ml-2 text-xs">중복</Badge>
                              )}
                            </div>
                            <span className="text-muted-foreground text-xs">
                              {formatCurrency(item.unit_price)}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.item_id} · {item.unit}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </ScrollArea>
            </div>

            {/* 오른쪽: 새 항목 입력 */}
            <div className="space-y-4 border-l pl-6">
              <Label className="text-base font-semibold">
                {isNewPriceItem ? '새 항목 정보' : '항목 수정'}
              </Label>

              <div className="space-y-2">
                <Label>카테고리 *</Label>
                <Select
                  value={editingPriceItem.category || ''}
                  onValueChange={(value) => {
                    if (isNewPriceItem) {
                      const categoryPrefix: Record<string, string> = {
                        동물비: 'ANI',
                        사육비: 'HSB',
                        측정: 'MSR',
                        조직병리: 'HST',
                        분석: 'ANL',
                        기타: 'ETC',
                      };
                      const prefix = categoryPrefix[value] || 'ETC';
                      const existingCount = masterData.price_master.filter(
                        (p) => p.item_id.startsWith(prefix)
                      ).length;
                      const newId = `${prefix}-${String(existingCount + 1).padStart(3, '0')}`;
                      setEditingPriceItem({ ...editingPriceItem, category: value, item_id: newId });
                    } else {
                      setEditingPriceItem({ ...editingPriceItem, category: value });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="동물비">동물비</SelectItem>
                    <SelectItem value="사육비">사육비</SelectItem>
                    <SelectItem value="측정">측정</SelectItem>
                    <SelectItem value="조직병리">조직병리</SelectItem>
                    <SelectItem value="분석">분석</SelectItem>
                    <SelectItem value="기타">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editingPriceItem.item_id && (
                <div className="p-2 bg-muted rounded text-sm">
                  <span className="text-muted-foreground">자동 생성 ID: </span>
                  <span className="font-mono">{editingPriceItem.item_id}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label>항목명 *</Label>
                <Input
                  value={editingPriceItem.item_name || ''}
                  onChange={(e) => setEditingPriceItem({ ...editingPriceItem, item_name: e.target.value })}
                  placeholder="예: SD랫드, ICR마우스"
                />
                {editingPriceItem.item_name &&
                  masterData.price_master.some(
                    (p) =>
                      p.item_name.toLowerCase() === editingPriceItem.item_name?.toLowerCase() &&
                      p.item_id !== editingPriceItem.item_id
                  ) && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      ⚠️ 동일한 항목명이 이미 존재합니다
                    </p>
                  )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>단가 *</Label>
                  <Input
                    type="number"
                    value={editingPriceItem.unit_price || 0}
                    onChange={(e) =>
                      setEditingPriceItem({ ...editingPriceItem, unit_price: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>단위 *</Label>
                  <Select
                    value={editingPriceItem.unit || ''}
                    onValueChange={(value) => setEditingPriceItem({ ...editingPriceItem, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="단위 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="/head">/head (마리당)</SelectItem>
                      <SelectItem value="/day">/day (일당)</SelectItem>
                      <SelectItem value="/회">/회 (회당)</SelectItem>
                      <SelectItem value="/건">/건 (건당)</SelectItem>
                      <SelectItem value="/sample">/sample (샘플당)</SelectItem>
                      <SelectItem value="/식">/식 (일괄)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={editingPriceItem.is_active ?? true}
                  onCheckedChange={(checked) => setEditingPriceItem({ ...editingPriceItem, is_active: checked })}
                />
                <Label>활성화</Label>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowPriceDialog(false)}>취소</Button>
            <Button
              onClick={handleSavePriceItem}
              disabled={
                !editingPriceItem.category ||
                !editingPriceItem.item_name ||
                !editingPriceItem.unit ||
                (isNewPriceItem &&
                  masterData.price_master.some(
                    (p) => p.item_name.toLowerCase() === editingPriceItem.item_name?.toLowerCase()
                  ))
              }
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Price Item Detail Dialog */}
      <Dialog open={showPriceDetailDialog} onOpenChange={setShowPriceDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>단가 항목 상세</DialogTitle>
          </DialogHeader>
          {selectedPriceItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">항목 ID</p>
                  <p className="font-mono">{selectedPriceItem.item_id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">카테고리</p>
                  <p>{selectedPriceItem.category}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">항목명</p>
                  <p className="font-medium">{selectedPriceItem.item_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">단가</p>
                  <p className="font-medium">{formatCurrency(selectedPriceItem.unit_price)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">단위</p>
                  <p>{selectedPriceItem.unit}</p>
                </div>
                {selectedPriceItem.remarks && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">비고</p>
                    <p>{selectedPriceItem.remarks}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>마스터 데이터 초기화</AlertDialogTitle>
            <AlertDialogDescription>
              효력시험 마스터 데이터를 기본값으로 초기화합니다. 수정한 내용이 모두 삭제됩니다. 계속하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetMasterData}>초기화</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
