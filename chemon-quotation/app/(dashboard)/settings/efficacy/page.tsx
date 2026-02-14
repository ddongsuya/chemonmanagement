'use client';

import { useState, useEffect, useMemo } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Database,
  Search,
  Loader2,
} from 'lucide-react';
import WonSign from '@/components/icons/WonSign';
import { useToast } from '@/hooks/use-toast';
import {
  getEfficacyPriceItems,
  getEfficacyModels,
  EfficacyPriceItem,
  EfficacyModel,
} from '@/lib/master-api';

export default function EfficacySettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('price');
  const [loading, setLoading] = useState(true);
  
  // Price master state
  const [priceItems, setPriceItems] = useState<EfficacyPriceItem[]>([]);
  const [priceSearch, setPriceSearch] = useState('');
  const [priceCategory, setPriceCategory] = useState<string>('all');
  
  // Model pool state
  const [models, setModels] = useState<EfficacyModel[]>([]);
  const [modelSearch, setModelSearch] = useState('');
  const [modelCategory, setModelCategory] = useState<string>('all');

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
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
      console.error('Failed to load data:', error);
      toast({
        title: '오류',
        description: '데이터를 불러오는데 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Price master categories
  const priceCategories = useMemo(() => {
    const cats = new Set(priceItems.map(item => item.category));
    return Array.from(cats).sort();
  }, [priceItems]);

  // Model categories
  const modelCategories = useMemo(() => {
    const cats = new Set(models.map(model => model.category));
    return Array.from(cats).sort();
  }, [models]);

  // Filtered price items
  const filteredPriceItems = useMemo(() => {
    return priceItems.filter(item => {
      const matchesSearch = priceSearch === '' || 
        item.itemName.toLowerCase().includes(priceSearch.toLowerCase()) ||
        item.itemId.toLowerCase().includes(priceSearch.toLowerCase());
      const matchesCategory = priceCategory === 'all' || item.category === priceCategory;
      return matchesSearch && matchesCategory;
    });
  }, [priceItems, priceSearch, priceCategory]);

  // Filtered models
  const filteredModels = useMemo(() => {
    return models.filter(model => {
      const matchesSearch = modelSearch === '' || 
        model.modelName.toLowerCase().includes(modelSearch.toLowerCase()) ||
        model.modelId.toLowerCase().includes(modelSearch.toLowerCase());
      const matchesCategory = modelCategory === 'all' || model.category === modelCategory;
      return matchesSearch && matchesCategory;
    });
  }, [models, modelSearch, modelCategory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">데이터를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="효력시험 설정" 
        description="효력시험 견적 관련 마스터 데이터를 조회합니다 (읽기 전용)"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="price" className="flex items-center gap-2">
            <WonSign className="w-4 h-4" />
            <span>단가 마스터 ({priceItems.length})</span>
          </TabsTrigger>
          <TabsTrigger value="model" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span>모델 목록 ({models.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* 단가 마스터 탭 */}
        <TabsContent value="price">
          <Card>
            <CardHeader>
              <CardTitle>단가 마스터</CardTitle>
              <CardDescription>
                효력시험 견적에 사용되는 단가 항목입니다 (읽기 전용)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 필터 */}
              <div className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="항목명 또는 ID로 검색..."
                    value={priceSearch}
                    onChange={(e) => setPriceSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={priceCategory} onValueChange={setPriceCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 카테고리</SelectItem>
                    {priceCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 테이블 */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">ID</TableHead>
                      <TableHead>카테고리</TableHead>
                      <TableHead>항목명</TableHead>
                      <TableHead className="text-right">단가</TableHead>
                      <TableHead>단위</TableHead>
                      <TableHead className="w-20">상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPriceItems.slice(0, 50).map((item) => (
                      <TableRow key={item.itemId} className={!item.isActive ? 'opacity-50' : ''}>
                        <TableCell className="font-mono text-xs">{item.itemId}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.itemName}</TableCell>
                        <TableCell className="text-right font-medium">
                          ₩{item.unitPrice.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">{item.unit || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={item.isActive ? 'default' : 'secondary'}>
                            {item.isActive ? '활성' : '비활성'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredPriceItems.length > 50 && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  {filteredPriceItems.length}개 중 50개 표시 중
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 모델 목록 탭 */}
        <TabsContent value="model">
          <Card>
            <CardHeader>
              <CardTitle>모델 목록</CardTitle>
              <CardDescription>
                효력시험 모델 목록입니다 (읽기 전용)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 필터 */}
              <div className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="모델명 또는 ID로 검색..."
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={modelCategory} onValueChange={setModelCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 카테고리</SelectItem>
                    {modelCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 모델 카드 그리드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredModels.map((model) => (
                  <Card key={model.modelId} className={!model.isActive ? 'opacity-50' : ''}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{model.modelName}</CardTitle>
                          <p className="text-xs text-muted-foreground font-mono">{model.modelId}</p>
                        </div>
                        <Badge variant={model.isActive ? 'default' : 'secondary'}>
                          {model.isActive ? '활성' : '비활성'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Badge variant="outline">{model.category}</Badge>
                          {model.indication && (
                            <Badge variant="secondary">{model.indication}</Badge>
                          )}
                        </div>
                        {model.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {model.description}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
