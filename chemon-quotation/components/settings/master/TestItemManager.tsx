'use client';

import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Badge } from '@/components/ui/badge';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Eye, Download, Plus, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// 마스터 데이터 import (v2)
import masterTestsOriginal from '@/data/chemon_master_data.json';
import categoriesData from '@/data/categories.json';
import { Test } from '@/types';

const STORAGE_KEY = 'chemon_master_tests';

const emptyTest: Partial<Test> = {
  test_id: '',
  modality: '저분자화합물',
  category_code: 'CN-01',
  category_name: '일반독성시험',
  source_file: '',
  sub_category: null,
  oecd_code: 'N',
  test_type: 'in vivo',
  test_name: '',
  animal_species: null,
  dosing_period: null,
  route: null,
  lead_time_weeks: null,
  unit_price: null,
  remarks: null,
  glp_status: 'GLP',
  clinical_phase: '해당분야별',
  guidelines: '',
  test_class: '독립',
  parent_test_id: null,
  option_type: null,
  analysis_count: 1,
  analysis_excluded: null,
  animals_per_sex: null,
  sex_type: null,
  control_groups: null,
  test_groups: null,
  total_groups: null,
};


export default function TestItemManager() {
  const { toast } = useToast();
  const [tests, setTests] = useState<Test[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedModality, setSelectedModality] = useState('all');
  
  // Dialog states
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingTest, setEditingTest] = useState<Partial<Test>>(emptyTest);
  const [isNewTest, setIsNewTest] = useState(false);

  const categories = categoriesData as { code: string; name: string }[];

  // localStorage에서 데이터 로드
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setTests(JSON.parse(stored));
      } catch {
        setTests(masterTestsOriginal as unknown as Test[]);
      }
    } else {
      setTests(masterTestsOriginal as unknown as Test[]);
    }
  }, []);

  // 데이터 저장
  const saveTests = (newTests: Test[]) => {
    setTests(newTests);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTests));
  };

  // 모달리티 목록 추출 (v2)
  const modalities = useMemo(() => {
    const set = new Set(tests.map((t) => t.modality));
    return Array.from(set).sort();
  }, [tests]);

  // 카테고리 목록 추출 (v2)
  const categoryList = useMemo(() => {
    const set = new Set(tests.map((t) => t.category_name));
    return Array.from(set).sort();
  }, [tests]);

  // 필터링
  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      if (selectedCategory !== 'all' && test.category_name !== selectedCategory)
        return false;
      if (selectedModality !== 'all' && test.modality !== selectedModality)
        return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          test.test_id.toLowerCase().includes(query) ||
          test.test_name.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [tests, selectedCategory, selectedModality, searchQuery]);

  // 상세보기
  const handleViewDetail = (test: Test) => {
    setSelectedTest(test);
    setShowDetail(true);
  };

  // 새 항목 추가
  const handleAddNew = () => {
    setIsNewTest(true);
    setEditingTest({ ...emptyTest });
    setShowEditDialog(true);
  };

  // 수정
  const handleEdit = (test: Test) => {
    setIsNewTest(false);
    setEditingTest({ ...test });
    setShowEditDialog(true);
  };

  // 삭제 확인
  const handleDeleteConfirm = (test: Test) => {
    setSelectedTest(test);
    setShowDeleteDialog(true);
  };

  // 삭제 실행
  const handleDelete = () => {
    if (!selectedTest) return;
    const newTests = tests.filter((t) => t.test_id !== selectedTest.test_id);
    saveTests(newTests);
    setShowDeleteDialog(false);
    setSelectedTest(null);
    toast({
      title: '삭제 완료',
      description: `${selectedTest.test_id} 항목이 삭제되었습니다.`,
    });
  };

  // 저장 (추가/수정)
  const handleSave = () => {
    if (!editingTest.test_id || !editingTest.test_name) {
      toast({
        title: '입력 오류',
        description: '시험ID와 시험명은 필수입니다.',
        variant: 'destructive',
      });
      return;
    }

    if (isNewTest) {
      // 중복 체크
      if (tests.some((t) => t.test_id === editingTest.test_id)) {
        toast({
          title: '중복 오류',
          description: '이미 존재하는 시험ID입니다.',
          variant: 'destructive',
        });
        return;
      }
      const newTests = [...tests, editingTest as Test];
      saveTests(newTests);
      toast({
        title: '추가 완료',
        description: `${editingTest.test_id} 항목이 추가되었습니다.`,
      });
    } else {
      const newTests = tests.map((t) =>
        t.test_id === editingTest.test_id ? (editingTest as Test) : t
      );
      saveTests(newTests);
      toast({
        title: '수정 완료',
        description: `${editingTest.test_id} 항목이 수정되었습니다.`,
      });
    }
    setShowEditDialog(false);
  };

  // 원본 데이터로 초기화
  const handleReset = () => {
    if (confirm('모든 변경사항이 초기화됩니다. 계속하시겠습니까?')) {
      localStorage.removeItem(STORAGE_KEY);
      setTests(masterTestsOriginal as unknown as Test[]);
      toast({
        title: '초기화 완료',
        description: '원본 데이터로 복원되었습니다.',
      });
    }
  };

  // Excel 다운로드
  const handleExport = () => {
    toast({
      title: '준비 중',
      description: 'Excel 다운로드 기능은 백엔드 연동 후 구현 예정입니다.',
    });
  };

  return (
    <div className="space-y-4">
      {/* 필터 영역 */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedModality} onValueChange={setSelectedModality}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="모달리티" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 모달리티</SelectItem>
            {modalities.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 카테고리</SelectItem>
            {categoryList.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="시험ID, 시험명 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          새 항목
        </Button>

        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Excel
        </Button>

        <Button variant="ghost" onClick={handleReset} className="text-gray-500">
          초기화
        </Button>
      </div>

      {/* 결과 수 */}
      <p className="text-sm text-gray-500">총 {filteredTests.length}개 항목</p>

      {/* 테이블 */}
      <div className="border rounded-lg">
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">시험ID</TableHead>
                <TableHead>시험명</TableHead>
                <TableHead className="w-24">유형</TableHead>
                <TableHead className="w-20">GLP</TableHead>
                <TableHead className="w-32 text-right">단가</TableHead>
                <TableHead className="w-28 text-center">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTests.slice(0, 100).map((test) => (
                <TableRow key={test.test_id}>
                  <TableCell className="font-mono text-xs">
                    {test.test_id}
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {test.test_name.split('\n')[0]}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {test.test_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={test.glp_status === 'GLP' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {test.glp_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {test.unit_price && test.unit_price > 0
                      ? formatCurrency(test.unit_price)
                      : '별도협의'}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetail(test)}
                        title="상세보기"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(test)}
                        title="수정"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteConfirm(test)}
                        title="삭제"
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {filteredTests.length > 100 && (
        <p className="text-sm text-gray-500 text-center">
          상위 100개만 표시됩니다. 검색을 사용해주세요.
        </p>
      )}


      {/* 상세보기 Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>시험항목 상세</DialogTitle>
          </DialogHeader>
          {selectedTest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">시험ID:</span>
                  <span className="ml-2 font-mono">{selectedTest.test_id}</span>
                </div>
                <div>
                  <span className="text-gray-500">모달리티:</span>
                  <span className="ml-2">{selectedTest.modality}</span>
                </div>
                <div>
                  <span className="text-gray-500">카테고리:</span>
                  <span className="ml-2">{selectedTest.category_name}</span>
                </div>
                <div>
                  <span className="text-gray-500">시험유형:</span>
                  <span className="ml-2">{selectedTest.test_type}</span>
                </div>
                <div>
                  <span className="text-gray-500">GLP:</span>
                  <span className="ml-2">{selectedTest.glp_status}</span>
                </div>
                <div>
                  <span className="text-gray-500">단가:</span>
                  <span className="ml-2 font-semibold text-primary">
                    {selectedTest.unit_price && selectedTest.unit_price > 0
                      ? formatCurrency(selectedTest.unit_price)
                      : '별도협의'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">동물종:</span>
                  <span className="ml-2">{selectedTest.animal_species || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">소요기간:</span>
                  <span className="ml-2">{selectedTest.lead_time_weeks ? `${selectedTest.lead_time_weeks}주` : '-'}</span>
                </div>
              </div>

              <div>
                <span className="text-gray-500 text-sm">시험명:</span>
                <p className="mt-1 whitespace-pre-wrap bg-gray-50 p-3 rounded text-sm">
                  {selectedTest.test_name}
                </p>
              </div>

              <div>
                <span className="text-gray-500 text-sm">가이드라인:</span>
                <p className="mt-1 text-sm">
                  {selectedTest.guidelines || '-'}
                </p>
              </div>

              {selectedTest.animals_per_sex && selectedTest.animals_per_sex > 0 && (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">동물수:</span>
                    <span className="ml-2">
                      {selectedTest.sex_type} {selectedTest.animals_per_sex}마리/군
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">총군수:</span>
                    <span className="ml-2">{selectedTest.total_groups}군</span>
                  </div>
                  <div>
                    <span className="text-gray-500">투여기간:</span>
                    <span className="ml-2">{selectedTest.dosing_period || '-'}</span>
                  </div>
                </div>
              )}

              {selectedTest.remarks && (
                <div>
                  <span className="text-gray-500 text-sm">비고:</span>
                  <p className="mt-1 text-sm text-orange-600">{selectedTest.remarks}</p>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowDetail(false);
                  handleEdit(selectedTest);
                }}>
                  <Pencil className="w-4 h-4 mr-2" />
                  수정
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 추가/수정 Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isNewTest ? '새 시험항목 추가' : '시험항목 수정'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test_id">시험ID *</Label>
              <Input
                id="test_id"
                value={editingTest.test_id || ''}
                onChange={(e) => setEditingTest({ ...editingTest, test_id: e.target.value })}
                disabled={!isNewTest}
                placeholder="예: CN-01-999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modality">모달리티</Label>
              <Select
                value={editingTest.modality || '저분자화합물'}
                onValueChange={(v) => setEditingTest({ ...editingTest, modality: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modalities.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_name">카테고리</Label>
              <Select
                value={editingTest.category_name || '일반독성시험'}
                onValueChange={(v) => {
                  const cat = categories.find(c => c.name === v);
                  setEditingTest({ 
                    ...editingTest, 
                    category_name: v,
                    category_code: cat?.code || editingTest.category_code
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryList.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="test_type">시험유형</Label>
              <Select
                value={editingTest.test_type || 'in vivo'}
                onValueChange={(v) => setEditingTest({ ...editingTest, test_type: v as 'in vivo' | 'in vitro' | '문서' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in vivo">in vivo</SelectItem>
                  <SelectItem value="in vitro">in vitro</SelectItem>
                  <SelectItem value="문서">문서</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="glp_status">GLP 상태</Label>
              <Select
                value={editingTest.glp_status || 'GLP'}
                onValueChange={(v) => setEditingTest({ ...editingTest, glp_status: v as 'GLP' | 'Non-GLP' | 'N/A' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GLP">GLP</SelectItem>
                  <SelectItem value="Non-GLP">Non-GLP</SelectItem>
                  <SelectItem value="N/A">N/A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="test_class">시험분류</Label>
              <Select
                value={editingTest.test_class || '독립'}
                onValueChange={(v) => setEditingTest({ ...editingTest, test_class: v as '본시험' | '옵션' | '독립' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="본시험">본시험</SelectItem>
                  <SelectItem value="옵션">옵션</SelectItem>
                  <SelectItem value="독립">독립</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="test_name">시험명 *</Label>
              <Textarea
                id="test_name"
                value={editingTest.test_name || ''}
                onChange={(e) => setEditingTest({ ...editingTest, test_name: e.target.value })}
                placeholder="시험명을 입력하세요"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_price">단가 (원)</Label>
              <Input
                id="unit_price"
                type="number"
                value={editingTest.unit_price || ''}
                onChange={(e) => setEditingTest({
                  ...editingTest,
                  unit_price: e.target.value ? Number(e.target.value) : null
                })}
                placeholder="별도협의시 비워두세요"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead_time_weeks">소요기간 (주)</Label>
              <Input
                id="lead_time_weeks"
                type="number"
                value={editingTest.lead_time_weeks || ''}
                onChange={(e) => setEditingTest({
                  ...editingTest,
                  lead_time_weeks: e.target.value ? Number(e.target.value) : null
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="animal_species">동물종</Label>
              <Input
                id="animal_species"
                value={editingTest.animal_species || ''}
                onChange={(e) => setEditingTest({ ...editingTest, animal_species: e.target.value || null })}
                placeholder="예: SD rat, Beagle dog"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="route">투여경로</Label>
              <Input
                id="route"
                value={editingTest.route || ''}
                onChange={(e) => setEditingTest({ ...editingTest, route: e.target.value || null })}
                placeholder="예: 경구, 정맥, 피하"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosing_period">투여기간</Label>
              <Input
                id="dosing_period"
                value={editingTest.dosing_period || ''}
                onChange={(e) => setEditingTest({ ...editingTest, dosing_period: e.target.value || null })}
                placeholder="예: 4주, 13주"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="animals_per_sex">동물수/성별</Label>
              <Input
                id="animals_per_sex"
                type="number"
                value={editingTest.animals_per_sex || ''}
                onChange={(e) => setEditingTest({
                  ...editingTest,
                  animals_per_sex: e.target.value ? Number(e.target.value) : null
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_groups">총 군수</Label>
              <Input
                id="total_groups"
                type="number"
                value={editingTest.total_groups || ''}
                onChange={(e) => setEditingTest({
                  ...editingTest,
                  total_groups: e.target.value ? Number(e.target.value) : null
                })}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="guidelines">가이드라인</Label>
              <Input
                id="guidelines"
                value={editingTest.guidelines || ''}
                onChange={(e) => setEditingTest({ ...editingTest, guidelines: e.target.value })}
                placeholder="예: OECD TG 407, ICH M3(R2)"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="remarks">비고</Label>
              <Input
                id="remarks"
                value={editingTest.remarks || ''}
                onChange={(e) => setEditingTest({ ...editingTest, remarks: e.target.value || null })}
                placeholder="비고 입력"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              취소
            </Button>
            <Button onClick={handleSave}>
              {isNewTest ? '추가' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>시험항목 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedTest?.test_id} 항목을 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
