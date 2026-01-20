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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  Database,
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  RefreshCw,
  Download,
  Upload,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PriceItem, EfficacyModel, ModelItem } from '@/types/efficacy';

// localStorage keys
const PRICE_MASTER_KEY = 'chemon_efficacy_price_master';
const MODEL_POOL_KEY = 'chemon_efficacy_model_pool';

// Default data loader
async function loadDefaultData() {
  try {
    const response = await fetch('/data/efficacy_master_data.json');
    return await response.json();
  } catch {
    return { price_master: [], model_item_pool: [] };
  }
}

export default function EfficacySettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('price');
  const [loading, setLoading] = useState(true);
  
  // Price master state
  const [priceItems, setPriceItems] = useState<PriceItem[]>([]);
  const [priceSearch, setPriceSearch] = useState('');
  const [priceCategory, setPriceCategory] = useState<string>('all');
  const [editingPrice, setEditingPrice] = useState<PriceItem | null>(null);
  const [isAddingPrice, setIsAddingPrice] = useState(false);
  
  // Model pool state
  const [models, setModels] = useState<EfficacyModel[]>([]);
  const [modelSearch, setModelSearch] = useState('');
  const [modelCategory, setModelCategory] = useState<string>('all');
  const [editingModel, setEditingModel] = useState<EfficacyModel | null>(null);
  const [isAddingModel, setIsAddingModel] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Try localStorage first
      const storedPrices = localStorage.getItem(PRICE_MASTER_KEY);
      const storedModels = localStorage.getItem(MODEL_POOL_KEY);
      
      if (storedPrices && storedModels) {
        setPriceItems(JSON.parse(storedPrices));
        setModels(JSON.parse(storedModels));
      } else {
        // Load from default JSON
        const defaultData = await loadDefaultData();
        setPriceItems(defaultData.price_master || []);
        setModels(defaultData.model_item_pool || []);
        
        // Save to localStorage
        localStorage.setItem(PRICE_MASTER_KEY, JSON.stringify(defaultData.price_master || []));
        localStorage.setItem(MODEL_POOL_KEY, JSON.stringify(defaultData.model_item_pool || []));
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '데이터를 불러오는데 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveData = () => {
    localStorage.setItem(PRICE_MASTER_KEY, JSON.stringify(priceItems));
    localStorage.setItem(MODEL_POOL_KEY, JSON.stringify(models));
    toast({
      title: '저장 완료',
      description: '마스터 데이터가 저장되었습니다',
    });
  };

  const resetToDefault = async () => {
    const defaultData = await loadDefaultData();
    setPriceItems(defaultData.price_master || []);
    setModels(defaultData.model_item_pool || []);
    localStorage.setItem(PRICE_MASTER_KEY, JSON.stringify(defaultData.price_master || []));
    localStorage.setItem(MODEL_POOL_KEY, JSON.stringify(defaultData.model_item_pool || []));
    toast({
      title: '초기화 완료',
      description: '기본 데이터로 초기화되었습니다',
    });
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
        item.item_name.toLowerCase().includes(priceSearch.toLowerCase()) ||
        item.item_id.toLowerCase().includes(priceSearch.toLowerCase());
      const matchesCategory = priceCategory === 'all' || item.category === priceCategory;
      return matchesSearch && matchesCategory;
    });
  }, [priceItems, priceSearch, priceCategory]);

  // Filtered models
  const filteredModels = useMemo(() => {
    return models.filter(model => {
      const matchesSearch = modelSearch === '' || 
        model.model_name.toLowerCase().includes(modelSearch.toLowerCase()) ||
        model.model_id.toLowerCase().includes(modelSearch.toLowerCase());
      const matchesCategory = modelCategory === 'all' || model.category === modelCategory;
      return matchesSearch && matchesCategory;
    });
  }, [models, modelSearch, modelCategory]);

  // Price item handlers
  const handleSavePriceItem = (item: PriceItem) => {
    if (editingPrice) {
      setPriceItems(prev => prev.map(p => p.item_id === item.item_id ? item : p));
    } else {
      setPriceItems(prev => [...prev, item]);
    }
    setEditingPrice(null);
    setIsAddingPrice(false);
  };

  const handleDeletePriceItem = (itemId: string) => {
    setPriceItems(prev => prev.filter(p => p.item_id !== itemId));
  };

  const handleTogglePriceActive = (itemId: string) => {
    setPriceItems(prev => prev.map(p => 
      p.item_id === itemId ? { ...p, is_active: !p.is_active } : p
    ));
  };

  // Model handlers
  const handleSaveModel = (model: EfficacyModel) => {
    if (editingModel) {
      setModels(prev => prev.map(m => m.model_id === model.model_id ? model : m));
    } else {
      setModels(prev => [...prev, model]);
    }
    setEditingModel(null);
    setIsAddingModel(false);
  };

  const handleDeleteModel = (modelId: string) => {
    setModels(prev => prev.filter(m => m.model_id !== modelId));
  };

  const handleToggleModelActive = (modelId: string) => {
    setModels(prev => prev.map(m => 
      m.model_id === modelId ? { ...m, is_active: !m.is_active } : m
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="유효성 설정" 
        description="유효성 견적 관련 마스터 데이터를 관리합니다"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetToDefault}>
              <RefreshCw className="w-4 h-4 mr-2" />
              초기화
            </Button>
            <Button onClick={saveData}>
              <Save className="w-4 h-4 mr-2" />
              저장
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="price" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span>단가 마스터 ({priceItems.length})</span>
          </TabsTrigger>
          <TabsTrigger value="model" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span>모델 아이템 풀 ({models.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* 단가 마스터 탭 */}
        <TabsContent value="price">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>단가 마스터</CardTitle>
                  <CardDescription>
                    유효성 견적에 사용되는 단가 항목을 관리합니다
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddingPrice(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  항목 추가
                </Button>
              </div>
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
                      <TableHead>상세</TableHead>
                      <TableHead className="text-right">단가</TableHead>
                      <TableHead>단위</TableHead>
                      <TableHead className="w-20">상태</TableHead>
                      <TableHead className="w-24 text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPriceItems.slice(0, 50).map((item) => (
                      <TableRow key={item.item_id} className={!item.is_active ? 'opacity-50' : ''}>
                        <TableCell className="font-mono text-xs">{item.item_id}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.item_name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {item.item_detail || '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₩{item.unit_price.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">{item.unit}</TableCell>
                        <TableCell>
                          <Switch
                            checked={item.is_active}
                            onCheckedChange={() => handleTogglePriceActive(item.item_id)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingPrice(item)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePriceItem(item.item_id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
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

        {/* 모델 아이템 풀 탭 */}
        <TabsContent value="model">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>모델 아이템 풀</CardTitle>
                  <CardDescription>
                    유효성 모델별 기본 아이템 구성을 관리합니다
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddingModel(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  모델 추가
                </Button>
              </div>
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
                  <Card key={model.model_id} className={!model.is_active ? 'opacity-50' : ''}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{model.model_name}</CardTitle>
                          <p className="text-xs text-muted-foreground font-mono">{model.model_id}</p>
                        </div>
                        <Switch
                          checked={model.is_active}
                          onCheckedChange={() => handleToggleModelActive(model.model_id)}
                        />
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
                        <div className="text-sm">
                          <span className="text-muted-foreground">기본 아이템: </span>
                          <span className="font-medium">{model.default_items?.length || 0}개</span>
                        </div>
                        <div className="flex justify-end gap-1 pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingModel(model)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteModel(model.model_id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 단가 항목 편집 다이얼로그 */}
      <PriceItemDialog
        open={isAddingPrice || editingPrice !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingPrice(false);
            setEditingPrice(null);
          }
        }}
        item={editingPrice}
        categories={priceCategories}
        onSave={handleSavePriceItem}
      />

      {/* 모델 편집 다이얼로그 */}
      <ModelDialog
        open={isAddingModel || editingModel !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingModel(false);
            setEditingModel(null);
          }
        }}
        model={editingModel}
        categories={modelCategories}
        priceItems={priceItems}
        onSave={handleSaveModel}
      />
    </div>
  );
}

// 단가 항목 편집 다이얼로그
function PriceItemDialog({
  open,
  onOpenChange,
  item,
  categories,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PriceItem | null;
  categories: string[];
  onSave: (item: PriceItem) => void;
}) {
  const [formData, setFormData] = useState<Partial<PriceItem>>({});

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        item_id: `ITEM-${Date.now()}`,
        category: '',
        subcategory: '',
        item_name: '',
        item_detail: '',
        unit_price: 0,
        unit: '',
        remarks: '',
        is_active: true,
      });
    }
  }, [item, open]);

  const handleSubmit = () => {
    if (!formData.item_id || !formData.category || !formData.item_name || !formData.unit_price) {
      return;
    }
    onSave(formData as PriceItem);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? '단가 항목 수정' : '단가 항목 추가'}</DialogTitle>
          <DialogDescription>
            단가 마스터 항목 정보를 입력하세요
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>항목 ID</Label>
              <Input
                value={formData.item_id || ''}
                onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
                disabled={!!item}
              />
            </div>
            <div className="space-y-2">
              <Label>카테고리</Label>
              <Input
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                list="categories"
              />
              <datalist id="categories">
                {categories.map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="space-y-2">
            <Label>항목명</Label>
            <Input
              value={formData.item_name || ''}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>상세 설명</Label>
            <Input
              value={formData.item_detail || ''}
              onChange={(e) => setFormData({ ...formData, item_detail: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>단가</Label>
              <Input
                type="number"
                value={formData.unit_price || 0}
                onChange={(e) => setFormData({ ...formData, unit_price: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>단위</Label>
              <Input
                value={formData.unit || ''}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="/head, /회 등"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>비고</Label>
            <Input
              value={formData.remarks || ''}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 모델 편집 다이얼로그
function ModelDialog({
  open,
  onOpenChange,
  model,
  categories,
  priceItems,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: EfficacyModel | null;
  categories: string[];
  priceItems: PriceItem[];
  onSave: (model: EfficacyModel) => void;
}) {
  const [formData, setFormData] = useState<Partial<EfficacyModel>>({});

  useEffect(() => {
    if (model) {
      setFormData(model);
    } else {
      setFormData({
        model_id: `MODEL-${Date.now()}`,
        model_name: '',
        category: '',
        indication: '',
        description: '',
        default_items: [],
        optional_items: [],
        is_active: true,
      });
    }
  }, [model, open]);

  const handleSubmit = () => {
    if (!formData.model_id || !formData.model_name || !formData.category) {
      return;
    }
    onSave(formData as EfficacyModel);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{model ? '모델 수정' : '모델 추가'}</DialogTitle>
          <DialogDescription>
            유효성 모델 정보를 입력하세요
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>모델 ID</Label>
              <Input
                value={formData.model_id || ''}
                onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
                disabled={!!model}
              />
            </div>
            <div className="space-y-2">
              <Label>카테고리</Label>
              <Input
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                list="model-categories"
              />
              <datalist id="model-categories">
                {categories.map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="space-y-2">
            <Label>모델명</Label>
            <Input
              value={formData.model_name || ''}
              onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>적응증</Label>
            <Input
              value={formData.indication || ''}
              onChange={(e) => setFormData({ ...formData, indication: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>설명</Label>
            <Input
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            기본 아이템 및 선택 아이템은 저장 후 상세 편집에서 관리할 수 있습니다.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
