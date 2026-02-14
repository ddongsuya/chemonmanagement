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
  TestTube,
  Loader2,
  Settings2,
} from 'lucide-react';
import WonSign from '@/components/icons/WonSign';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  getTestItems,
  getQcSettings,
} from '@/lib/clinical-pathology-api';
import type {
  ClinicalTestItem,
  ClinicalQcSetting,
  ClinicalTestCategory,
} from '@/types/clinical-pathology';
import { CATEGORY_LABELS } from '@/types/clinical-pathology';

// Category colors
const categoryColors: Record<string, { bg: string; text: string; active: string }> = {
  'CBC': { bg: 'bg-red-100', text: 'text-red-700', active: 'bg-red-500 text-white' },
  'DIFF': { bg: 'bg-orange-100', text: 'text-orange-700', active: 'bg-orange-500 text-white' },
  'RETIC': { bg: 'bg-yellow-100', text: 'text-yellow-700', active: 'bg-yellow-500 text-white' },
  'CHEMISTRY_GENERAL': { bg: 'bg-green-100', text: 'text-green-700', active: 'bg-green-500 text-white' },
  'ELECTROLYTE': { bg: 'bg-teal-100', text: 'text-teal-700', active: 'bg-teal-500 text-white' },
  'CHEMISTRY_ADDITIONAL': { bg: 'bg-cyan-100', text: 'text-cyan-700', active: 'bg-cyan-500 text-white' },
  'COAGULATION': { bg: 'bg-blue-100', text: 'text-blue-700', active: 'bg-blue-500 text-white' },
  'URINALYSIS': { bg: 'bg-purple-100', text: 'text-purple-700', active: 'bg-purple-500 text-white' },
  'URINE_CHEMISTRY': { bg: 'bg-pink-100', text: 'text-pink-700', active: 'bg-pink-500 text-white' },
};

const getCategoryColor = (category: string) => {
  return categoryColors[category] || { bg: 'bg-gray-100', text: 'text-gray-700', active: 'bg-gray-500 text-white' };
};

export default function ClinicalPathologyMasterManager() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('items');
  const [testItems, setTestItems] = useState<ClinicalTestItem[]>([]);
  const [qcSettings, setQcSettings] = useState<ClinicalQcSetting[]>([]);
  const [loading, setLoading] = useState(true);

  // Test Items state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ClinicalTestCategory | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ClinicalTestItem | null>(null);

  // Load master data from API
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [itemsResponse, qcResponse] = await Promise.all([
          getTestItems(),
          getQcSettings(),
        ]);
        
        if (itemsResponse && itemsResponse.items) {
          setTestItems(itemsResponse.items);
        }
        if (qcResponse) {
          setQcSettings(qcResponse);
        }
      } catch (error) {
        console.error('Failed to load clinical pathology master data:', error);
        toast({
          title: '오류',
          description: '임상병리 마스터 데이터를 불러오는데 실패했습니다.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [toast]);

  // Get unique categories with counts
  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    testItems.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  }, [testItems]);

  // Filtered test items
  const filteredItems = useMemo(() => {
    return testItems.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.nameKr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        !selectedCategory || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [testItems, searchQuery, selectedCategory]);

  // Handle item view
  const handleViewItem = (item: ClinicalTestItem) => {
    setSelectedItem(item);
    setShowDetailDialog(true);
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
            검사항목 {testItems.length}개, QC 설정 {qcSettings.length}개
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="items" className="flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            검사항목
          </TabsTrigger>
          <TabsTrigger value="qc" className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            QC 설정
          </TabsTrigger>
        </TabsList>

        {/* 검사항목 탭 */}
        <TabsContent value="items" className="space-y-4">
          {/* Category Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">카테고리 선택</Label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                  !selectedCategory
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                전체 ({testItems.length})
              </button>
              {categoriesWithCounts.map(([cat, count]) => {
                const colors = getCategoryColor(cat);
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat as ClinicalTestCategory)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                      isSelected ? colors.active : `${colors.bg} ${colors.text} hover:opacity-80`
                    )}
                  >
                    {CATEGORY_LABELS[cat as ClinicalTestCategory] || cat} ({count})
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
                placeholder="검사명 또는 코드로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Results info */}
          <div className="text-sm text-muted-foreground">
            {selectedCategory && (
              <Badge variant="secondary" className="mr-2">
                {CATEGORY_LABELS[selectedCategory]}
              </Badge>
            )}
            {filteredItems.length}개 항목
          </div>

          <ScrollArea className="h-[400px] border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">코드</TableHead>
                  <TableHead className="w-32">카테고리</TableHead>
                  <TableHead>검사명 (한글)</TableHead>
                  <TableHead>검사명 (영문)</TableHead>
                  <TableHead className="text-right w-28">단가</TableHead>
                  <TableHead className="w-20">단위</TableHead>
                  <TableHead className="w-20">상태</TableHead>
                  <TableHead className="w-16">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {searchQuery || selectedCategory
                        ? '검색 결과가 없습니다.'
                        : '등록된 검사항목이 없습니다.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.code}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_LABELS[item.category] || item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.nameKr}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.nameEn}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell>{item.unit || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={item.isActive ? 'default' : 'secondary'}>
                          {item.isActive ? '활성' : '비활성'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleViewItem(item)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>

        {/* QC 설정 탭 */}
        <TabsContent value="qc" className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            카테고리별 QC 수수료 설정입니다. 검체 수가 임계값을 초과하면 QC 수수료가 적용됩니다.
          </div>

          <ScrollArea className="h-[400px] border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>카테고리</TableHead>
                  <TableHead className="text-right">임계 검체수</TableHead>
                  <TableHead className="text-right">QC 수수료</TableHead>
                  <TableHead className="w-20">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qcSettings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      등록된 QC 설정이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  qcSettings.map((setting) => (
                    <TableRow key={setting.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {CATEGORY_LABELS[setting.category] || setting.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{setting.thresholdCount}개 초과</TableCell>
                      <TableCell className="text-right">{formatCurrency(setting.qcFee)}</TableCell>
                      <TableCell>
                        <Badge variant={setting.isActive ? 'default' : 'secondary'}>
                          {setting.isActive ? '활성' : '비활성'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Item Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>검사항목 상세</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">코드</p>
                  <p className="font-mono">{selectedItem.code}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">카테고리</p>
                  <p>{CATEGORY_LABELS[selectedItem.category]}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">검사명 (한글)</p>
                  <p className="font-medium">{selectedItem.nameKr}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">검사명 (영문)</p>
                  <p>{selectedItem.nameEn}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">단가</p>
                  <p className="font-medium">{formatCurrency(selectedItem.unitPrice)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">단위</p>
                  <p>{selectedItem.unit || '-'}</p>
                </div>
                {selectedItem.method && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">검사방법</p>
                    <p>{selectedItem.method}</p>
                  </div>
                )}
                {selectedItem.isPackage && selectedItem.packageItems.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">패키지 항목</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedItem.packageItems.map((code) => (
                        <Badge key={code} variant="outline" className="text-xs">
                          {code}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedItem.requiredSampleTypes.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">필요 검체</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedItem.requiredSampleTypes.map((type) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
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
