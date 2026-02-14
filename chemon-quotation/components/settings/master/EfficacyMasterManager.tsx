'use client';

import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Eye,
  Beaker,
  Loader2,
} from 'lucide-react';
import WonSign from '@/components/icons/WonSign';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  getEfficacyPriceItems,
  getEfficacyModels,
  EfficacyPriceItem,
  EfficacyModel,
} from '@/lib/master-api';

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

export default function EfficacyMasterManager() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('price');
  const [priceItems, setPriceItems] = useState<EfficacyPriceItem[]>([]);
  const [models, setModels] = useState<EfficacyModel[]>([]);
  const [loading, setLoading] = useState(true);

  // Price Master state
  const [priceSearchQuery, setPriceSearchQuery] = useState('');
  const [selectedPriceCategory, setSelectedPriceCategory] = useState<string | null>(null);
  const [showPriceDetailDialog, setShowPriceDetailDialog] = useState(false);
  const [selectedPriceItem, setSelectedPriceItem] = useState<EfficacyPriceItem | null>(null);

  // Model state
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [selectedModelCategory, setSelectedModelCategory] = useState<string | null>(null);

  // Load master data from API
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [priceResponse, modelResponse] = await Promise.all([
          getEfficacyPriceItems(),
          getEfficacyModels(),
        ]);
        
        if (priceResponse.success && priceResponse.data) {
          setPriceItems(priceResponse.data);
        }
        if (modelResponse.success && modelResponse.data) {
          setModels(modelResponse.data);
        }
      } catch (error) {
        console.error('Failed to load master data:', error);
        toast({
          title: '오류',
          description: '마스터 데이터를 불러오는데 실패했습니다.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [toast]);

  // Get unique categories from price master with counts
  const priceCategoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    priceItems.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  }, [priceItems]);

  // Get unique model categories with counts
  const modelCategoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    models.forEach((m) => {
      counts[m.category] = (counts[m.category] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  }, [models]);

  // Filtered price items
  const filteredPriceItems = useMemo(() => {
    return priceItems.filter((item) => {
      const matchesSearch =
        priceSearchQuery === '' ||
        item.itemName.toLowerCase().includes(priceSearchQuery.toLowerCase()) ||
        item.itemId.toLowerCase().includes(priceSearchQuery.toLowerCase());
      const matchesCategory =
        !selectedPriceCategory || item.category === selectedPriceCategory;
      return matchesSearch && matchesCategory;
    });
  }, [priceItems, priceSearchQuery, selectedPriceCategory]);

  // Filtered models
  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      const matchesSearch =
        modelSearchQuery === '' ||
        model.modelName.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
        (model.indication && model.indication.toLowerCase().includes(modelSearchQuery.toLowerCase()));
      const matchesCategory =
        !selectedModelCategory || model.category === selectedModelCategory;
      return matchesSearch && matchesCategory;
    });
  }, [models, modelSearchQuery, selectedModelCategory]);

  // Handle price item view
  const handleViewPriceItem = (item: EfficacyPriceItem) => {
    setSelectedPriceItem(item);
    setShowPriceDetailDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">데이터를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            효력시험 단가 항목 {priceItems.length}개, 모델 {models.length}개
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="price" className="flex items-center gap-2">
            <WonSign className="w-4 h-4" />
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
                전체 ({priceItems.length})
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

          {/* Search */}
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
                  <TableHead className="w-16">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPriceItems.map((item) => (
                  <TableRow key={item.itemId}>
                    <TableCell className="font-mono text-xs">{item.itemId}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category}</Badge>
                    </TableCell>
                    <TableCell>{item.itemName}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? 'default' : 'secondary'}>
                        {item.isActive ? '활성' : '비활성'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleViewPriceItem(item)}>
                        <Eye className="w-4 h-4" />
                      </Button>
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
                전체 ({models.length})
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
                  <TableHead className="w-20">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModels.map((model) => (
                  <TableRow key={model.modelId}>
                    <TableCell className="font-mono text-xs">{model.modelId}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{model.category}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{model.modelName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{model.indication || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={model.isActive ? 'default' : 'secondary'}>
                        {model.isActive ? '활성' : '비활성'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>
      </Tabs>

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
                  <p className="font-mono">{selectedPriceItem.itemId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">카테고리</p>
                  <p>{selectedPriceItem.category}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">항목명</p>
                  <p className="font-medium">{selectedPriceItem.itemName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">단가</p>
                  <p className="font-medium">{formatCurrency(selectedPriceItem.unitPrice)}</p>
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
    </div>
  );
}
