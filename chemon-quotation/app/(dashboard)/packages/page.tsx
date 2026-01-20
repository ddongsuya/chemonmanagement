'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  ChevronRight,
  Eye,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
  PackageTemplate,
  PackageTest,
  CreatePackageDTO,
  UpdatePackageDTO,
} from '@/lib/package-api';

// 데이터 import (v2)
import masterData from '@/data/chemon_master_data.json';
import categoriesData from '@/data/categories.json';
import modalitiesData from '@/data/modalities.json';

interface MasterTest {
  test_id: string;
  test_name: string;
  category_name: string;
  category_code: string;
  glp_status: string;
  unit_price: number | null;
  modality: string;
}

interface FormPackageTest {
  test_id: string;
  category: string;
  name: string;
  required: boolean;
}

interface FormData {
  packageId: string;
  packageName: string;
  description: string;
  modality: string;
  clinicalPhase: string;
  tests: FormPackageTest[];
}

const emptyFormData: FormData = {
  packageId: '',
  packageName: '',
  description: '',
  modality: '',
  clinicalPhase: '',
  tests: [],
};

export default function PackagesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageTemplate | null>(null);
  const [viewingPackage, setViewingPackage] = useState<PackageTemplate | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterModality, setFilterModality] = useState<string>('all');

  // API에서 패키지 목록 조회
  const { data: packagesResponse, isLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: () => getPackages(true),
  });

  const packages = packagesResponse?.data || [];

  // 패키지 생성 mutation
  const createMutation = useMutation({
    mutationFn: (data: CreatePackageDTO) => createPackage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      setIsDialogOpen(false);
      toast({ title: '저장 완료', description: '새 패키지가 추가되었습니다.' });
    },
    onError: () => {
      toast({ title: '오류', description: '패키지 생성에 실패했습니다.', variant: 'destructive' });
    },
  });

  // 패키지 수정 mutation
  const updateMutation = useMutation({
    mutationFn: ({ packageId, data }: { packageId: string; data: UpdatePackageDTO }) =>
      updatePackage(packageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      setIsDialogOpen(false);
      toast({ title: '저장 완료', description: '패키지가 수정되었습니다.' });
    },
    onError: () => {
      toast({ title: '오류', description: '패키지 수정에 실패했습니다.', variant: 'destructive' });
    },
  });

  // 패키지 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: (packageId: string) => deletePackage(packageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast({ title: '삭제 완료', description: '패키지가 삭제되었습니다.' });
    },
    onError: () => {
      toast({ title: '오류', description: '패키지 삭제에 실패했습니다.', variant: 'destructive' });
    },
  });

  // 필터링된 패키지
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      if (filterModality !== 'all' && pkg.modality !== filterModality) {
        return false;
      }
      return true;
    });
  }, [packages, filterModality]);

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
      ...emptyFormData,
      packageId: `PKG-${Date.now()}`,
    });
    setSearchTerm('');
    setSelectedCategory('all');
    setIsDialogOpen(true);
  };

  // 패키지 수정
  const handleEdit = (pkg: PackageTemplate) => {
    setEditingPackage(pkg);
    setFormData({
      packageId: pkg.packageId,
      packageName: pkg.packageName,
      description: pkg.description || '',
      modality: pkg.modality || '',
      clinicalPhase: pkg.clinicalPhase || '',
      tests: (pkg.tests || []).map((t) => ({
        test_id: t.test_id,
        category: t.category,
        name: t.name,
        required: t.required,
      })),
    });
    setSearchTerm('');
    setSelectedCategory('all');
    setIsDialogOpen(true);
  };

  // 패키지 상세보기
  const handleView = (pkg: PackageTemplate) => {
    setViewingPackage(pkg);
    setIsViewDialogOpen(true);
  };

  // 패키지 삭제
  const handleDelete = (packageId: string) => {
    if (confirm('이 패키지를 삭제하시겠습니까?')) {
      deleteMutation.mutate(packageId);
    }
  };

  // 시험항목 추가/제거
  const toggleTest = (test: MasterTest) => {
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
            required: true,
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
    if (!formData.packageName.trim()) {
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

    const apiTests: PackageTest[] = formData.tests.map((t) => ({
      test_id: t.test_id,
      category: t.category,
      name: t.name,
      required: t.required,
    }));

    if (editingPackage) {
      updateMutation.mutate({
        packageId: editingPackage.packageId,
        data: {
          packageName: formData.packageName,
          description: formData.description || undefined,
          modality: formData.modality || undefined,
          clinicalPhase: formData.clinicalPhase || undefined,
          tests: apiTests,
        },
      });
    } else {
      createMutation.mutate({
        packageId: formData.packageId,
        packageName: formData.packageName,
        description: formData.description || undefined,
        modality: formData.modality || undefined,
        clinicalPhase: formData.clinicalPhase || undefined,
        tests: apiTests,
      });
    }
  };

  // 모달리티 목록 추출
  const modalityList = useMemo(() => {
    const set = new Set(packages.map((p) => p.modality).filter(Boolean) as string[]);
    return Array.from(set);
  }, [packages]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>패키지 목록을 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">패키지 관리</h1>
          <p className="text-muted-foreground mt-1">
            시험 패키지 템플릿을 관리합니다. 견적 작성 시 패키지를 선택하면 포함된 시험항목이 자동으로 추가됩니다.
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          새 패키지
        </Button>
      </div>

      {/* 필터 */}
      <div className="flex gap-4 items-center">
        <Select value={filterModality} onValueChange={setFilterModality}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="모달리티 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 모달리티</SelectItem>
            {modalityList.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filteredPackages.length}개의 패키지
        </span>
      </div>

      {/* 패키지 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPackages.map((pkg) => (
          <Card key={pkg.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                {pkg.packageName}
                {!pkg.isActive && (
                  <Badge variant="outline" className="text-xs">비활성</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {pkg.description || '설명 없음'}
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="default">{(pkg.tests || []).length}개 시험</Badge>
                {pkg.modality && <Badge variant="secondary">{pkg.modality}</Badge>}
                {pkg.clinicalPhase && (
                  <Badge variant="outline">{pkg.clinicalPhase}</Badge>
                )}
              </div>
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleView(pkg)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  상세
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(pkg)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  수정
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(pkg.packageId)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPackages.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>등록된 패키지가 없습니다.</p>
          <Button className="mt-4" onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-2" />
            첫 패키지 만들기
          </Button>
        </div>
      )}

      {/* 상세보기 다이얼로그 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {viewingPackage?.packageName}
            </DialogTitle>
          </DialogHeader>
          {viewingPackage && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {viewingPackage.modality && (
                  <Badge variant="secondary">{viewingPackage.modality}</Badge>
                )}
                {viewingPackage.clinicalPhase && (
                  <Badge variant="outline">{viewingPackage.clinicalPhase}</Badge>
                )}
              </div>
              {viewingPackage.description && (
                <p className="text-sm text-muted-foreground">
                  {viewingPackage.description}
                </p>
              )}
              <div>
                <h4 className="font-medium mb-2">
                  포함된 시험항목 ({(viewingPackage.tests || []).length}개)
                </h4>
                <div className="border rounded-lg max-h-80 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="text-left p-2">시험명</th>
                        <th className="text-left p-2">카테고리</th>
                        <th className="text-center p-2">필수</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(viewingPackage.tests || []).map((test) => (
                        <tr key={test.test_id} className="border-t">
                          <td className="p-2">{test.name}</td>
                          <td className="p-2 text-muted-foreground">
                            {test.category}
                          </td>
                          <td className="p-2 text-center">
                            {test.required ? (
                              <Badge variant="default" className="text-xs">필수</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">선택</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              닫기
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              if (viewingPackage) handleEdit(viewingPackage);
            }}>
              수정하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  value={formData.packageName}
                  onChange={(e) =>
                    setFormData({ ...formData, packageName: e.target.value })
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
                  value={formData.clinicalPhase}
                  onValueChange={(v) =>
                    setFormData({ ...formData, clinicalPhase: v })
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
                      className="flex items-center justify-between bg-muted rounded px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={test.required}
                          onCheckedChange={() => toggleRequired(test.test_id)}
                        />
                        <span className="text-sm">
                          {test.name}
                          <span className="text-xs text-muted-foreground ml-2">
                            ({test.category})
                          </span>
                        </span>
                        {test.required ? (
                          <Badge variant="default" className="text-xs">필수</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">선택</Badge>
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
                <p className="text-sm text-muted-foreground p-3 border rounded-lg">
                  아래에서 시험항목을 선택해주세요
                </p>
              )}
            </div>

            {/* 시험항목 선택 */}
            <div className="space-y-2">
              <Label>마스터데이터에서 시험항목 선택</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                                      : 'hover:bg-muted'
                                  }`}
                                  onClick={() => toggleTest(test)}
                                >
                                  <div className="flex items-center gap-2">
                                    <Checkbox checked={isSelected} />
                                    <span className="text-sm">
                                      {test.test_name}
                                    </span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
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
                  <p className="text-sm text-muted-foreground p-4 text-center">
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
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
