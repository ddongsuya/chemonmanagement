'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Plus,
  Edit,
  Trash2,
  Package,
  Search,
  X,
  RotateCcw,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// 데이터 import (v2)
import defaultPackageTemplates from '@/data/package_templates.json';
import masterData from '@/data/chemon_master_data.json';
import categoriesData from '@/data/categories.json';
import modalitiesData from '@/data/modalities.json';

const STORAGE_KEY = 'chemon_package_templates';

interface PackageTest {
  test_id: string;
  category: string;
  name: string;
  required: boolean;
}

interface OptionalTest {
  test_id: string;
  name: string;
  parent: string;
}

interface PackageTemplate {
  package_id: string;
  package_name: string;
  description: string;
  modality: string;
  clinical_phase: string;
  tests: PackageTest[];
  optional_tests: OptionalTest[];
}

interface MasterTest {
  test_id: string;
  test_name: string;
  category_name: string;
  category_code: string;
  glp_status: string;
  unit_price: number | null;
  modality: string;
}

const emptyPackage: PackageTemplate = {
  package_id: '',
  package_name: '',
  description: '',
  modality: '',
  clinical_phase: '',
  tests: [],
  optional_tests: [],
};


export default function PackageManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [packages, setPackages] = useState<PackageTemplate[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageTemplate | null>(null);
  const [formData, setFormData] = useState<PackageTemplate>(emptyPackage);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // localStorage에서 로드
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPackages(JSON.parse(saved));
      } catch {
        setPackages(defaultPackageTemplates as unknown as PackageTemplate[]);
      }
    } else {
      setPackages(defaultPackageTemplates as unknown as PackageTemplate[]);
    }
  }, []);

  // 저장 및 캐시 무효화
  const savePackages = (newPackages: PackageTemplate[]) => {
    setPackages(newPackages);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPackages));
    queryClient.invalidateQueries({ queryKey: ['packages'] });
    queryClient.invalidateQueries({ queryKey: ['allPackages'] });
  };

  // 마스터데이터 필터링 (v2)
  const filteredMasterTests = useMemo(() => {
    let tests = masterData as unknown as MasterTest[];
    
    if (selectedCategory !== 'all') {
      tests = tests.filter((t) => t.category_code === selectedCategory);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      tests = tests.filter(
        (t) =>
          t.test_name.toLowerCase().includes(term) ||
          t.test_id.toLowerCase().includes(term)
      );
    }
    
    return tests.slice(0, 100);
  }, [selectedCategory, searchTerm]);

  // 카테고리별 그룹화 (v2)
  const groupedTests = useMemo(() => {
    const groups: Record<string, MasterTest[]> = {};
    filteredMasterTests.forEach((test) => {
      if (!groups[test.category_name]) {
        groups[test.category_name] = [];
      }
      groups[test.category_name].push(test);
    });
    return groups;
  }, [filteredMasterTests]);

  // 새 패키지 추가
  const handleAddNew = () => {
    setEditingPackage(null);
    setFormData({
      ...emptyPackage,
      package_id: `PKG-${Date.now()}`,
    });
    setIsDialogOpen(true);
  };

  // 패키지 수정
  const handleEdit = (pkg: PackageTemplate) => {
    setEditingPackage(pkg);
    setFormData({ ...pkg });
    setIsDialogOpen(true);
  };

  // 패키지 삭제
  const handleDelete = (packageId: string) => {
    if (confirm('이 패키지를 삭제하시겠습니까?')) {
      const newPackages = packages.filter((p) => p.package_id !== packageId);
      savePackages(newPackages);
      toast({ title: '삭제 완료', description: '패키지가 삭제되었습니다.' });
    }
  };

  // 시험항목 추가/제거
  const toggleTest = (test: MasterTest, required: boolean) => {
    const exists = formData.tests.find((t) => t.test_id === test.test_id);
    
    if (exists) {
      setFormData({
        ...formData,
        tests: formData.tests.filter((t) => t.test_id !== test.test_id),
      });
    } else {
      setFormData({
        ...formData,
        tests: [
          ...formData.tests,
          {
            test_id: test.test_id,
            category: test.category_name,
            name: test.test_name,
            required,
          },
        ],
      });
    }
  };

  // 필수 여부 변경
  const toggleRequired = (testId: string) => {
    setFormData({
      ...formData,
      tests: formData.tests.map((t) =>
        t.test_id === testId ? { ...t, required: !t.required } : t
      ),
    });
  };

  // 선택된 시험 제거
  const removeTest = (testId: string) => {
    setFormData({
      ...formData,
      tests: formData.tests.filter((t) => t.test_id !== testId),
    });
  };

  // 저장
  const handleSave = () => {
    if (!formData.package_name.trim()) {
      toast({
        title: '오류',
        description: '패키지명을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.tests.length === 0) {
      toast({
        title: '오류',
        description: '최소 1개 이상의 시험항목을 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    let newPackages: PackageTemplate[];
    if (editingPackage) {
      newPackages = packages.map((p) =>
        p.package_id === editingPackage.package_id ? formData : p
      );
    } else {
      newPackages = [...packages, formData];
    }

    savePackages(newPackages);
    setIsDialogOpen(false);
    toast({
      title: '저장 완료',
      description: editingPackage
        ? '패키지가 수정되었습니다.'
        : '새 패키지가 추가되었습니다.',
    });
  };

  // 초기화
  const handleReset = () => {
    if (confirm('모든 패키지를 기본값으로 초기화하시겠습니까?')) {
      localStorage.removeItem(STORAGE_KEY);
      setPackages(defaultPackageTemplates as unknown as PackageTemplate[]);
      toast({ title: '초기화 완료', description: '기본 패키지로 복원되었습니다.' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {packages.length}개의 패키지 템플릿
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            초기화
          </Button>
          <Button onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-2" />
            새 패키지
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {packages.map((pkg) => (
          <Card key={pkg.package_id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                {pkg.package_name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {pkg.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">{pkg.tests.length}개 시험</Badge>
                  <Badge variant="secondary">{pkg.modality}</Badge>
                  {pkg.clinical_phase && (
                    <Badge variant="outline">{pkg.clinical_phase}</Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(pkg)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(pkg.package_id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>


      {/* 패키지 편집 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? '패키지 수정' : '새 패키지 추가'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {/* 기본 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>패키지명 *</Label>
                <Input
                  value={formData.package_name}
                  onChange={(e) =>
                    setFormData({ ...formData, package_name: e.target.value })
                  }
                  placeholder="예: IND 기본 패키지"
                />
              </div>
              <div className="space-y-2">
                <Label>모달리티</Label>
                <Select
                  value={formData.modality}
                  onValueChange={(v) =>
                    setFormData({ ...formData, modality: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {(modalitiesData as string[]).map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>임상단계</Label>
                <Select
                  value={formData.clinical_phase}
                  onValueChange={(v) =>
                    setFormData({ ...formData, clinical_phase: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IND">IND</SelectItem>
                    <SelectItem value="NDA">NDA</SelectItem>
                    <SelectItem value="Phase 1">Phase 1</SelectItem>
                    <SelectItem value="Phase 2">Phase 2</SelectItem>
                    <SelectItem value="Phase 3">Phase 3</SelectItem>
                    <SelectItem value="해당분야별">해당분야별</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>설명</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="패키지 설명"
                  rows={2}
                />
              </div>
            </div>

            {/* 선택된 시험항목 */}
            <div className="space-y-2">
              <Label>선택된 시험항목 ({formData.tests.length}개)</Label>
              {formData.tests.length > 0 ? (
                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                  {formData.tests.map((test) => (
                    <div
                      key={test.test_id}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={test.required}
                          onCheckedChange={() => toggleRequired(test.test_id)}
                        />
                        <span className="text-sm">
                          {test.name}
                          <span className="text-xs text-gray-400 ml-2">
                            ({test.category})
                          </span>
                        </span>
                        {test.required ? (
                          <Badge variant="default" className="text-xs">
                            필수
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            선택
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeTest(test.test_id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 p-3 border rounded-lg">
                  아래에서 시험항목을 선택해주세요
                </p>
              )}
            </div>

            {/* 시험항목 선택 */}
            <div className="space-y-2">
              <Label>마스터데이터에서 시험항목 선택</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="시험명 또는 코드로 검색..."
                    className="pl-9"
                  />
                </div>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="카테고리" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 카테고리</SelectItem>
                    {(categoriesData as { code: string; name: string }[]).map(
                      (cat) => (
                        <SelectItem key={cat.code} value={cat.code}>
                          {cat.name}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {Object.keys(groupedTests).length > 0 ? (
                  <Accordion type="multiple" className="w-full">
                    {Object.entries(groupedTests).map(([category, tests]) => (
                      <AccordionItem key={category} value={category}>
                        <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="w-4 h-4" />
                            {category}
                            <Badge variant="secondary" className="text-xs">
                              {tests.length}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-2">
                          <div className="space-y-1">
                            {tests.map((test) => {
                              const isSelected = formData.tests.some(
                                (t) => t.test_id === test.test_id
                              );
                              return (
                                <div
                                  key={test.test_id}
                                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                                    isSelected
                                      ? 'bg-primary/10 border border-primary/30'
                                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                  }`}
                                  onClick={() => toggleTest(test, true)}
                                >
                                  <div className="flex items-center gap-2">
                                    <Checkbox checked={isSelected} />
                                    <span className="text-sm">
                                      {test.test_name}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    {test.test_id}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <p className="text-sm text-gray-400 p-4 text-center">
                    검색 결과가 없습니다
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSave}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
