'use client';

import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Eye, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  getToxicityTests,
  getToxicityTestCategories,
  ToxicityTest,
} from '@/lib/master-api';

export default function TestItemManager() {
  const { toast } = useToast();
  const [tests, setTests] = useState<ToxicityTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSheet, setSelectedSheet] = useState('all');
  
  // Dialog states
  const [selectedTest, setSelectedTest] = useState<ToxicityTest | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Categories from API
  const [categories, setCategories] = useState<Record<string, string[]>>({});

  // Load data from API
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [testsResponse, categoriesResponse] = await Promise.all([
          getToxicityTests(),
          getToxicityTestCategories(),
        ]);

        if (testsResponse.success && testsResponse.data) {
          setTests(testsResponse.data);
        }
        if (categoriesResponse.success && categoriesResponse.data) {
          setCategories(categoriesResponse.data.data || {});
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        toast({
          title: '오류',
          description: '데이터를 불러오는데 실패했습니다.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [toast]);

  // Sheet 목록 추출
  const sheets = useMemo(() => {
    const set = new Set(tests.map((t) => t.sheet));
    return Array.from(set).sort();
  }, [tests]);

  // 카테고리 목록 추출
  const categoryList = useMemo(() => {
    const set = new Set(tests.map((t) => t.category));
    return Array.from(set).sort();
  }, [tests]);

  // 필터링
  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      if (selectedCategory !== 'all' && test.category !== selectedCategory)
        return false;
      if (selectedSheet !== 'all' && test.sheet !== selectedSheet)
        return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          (test.testName && test.testName.toLowerCase().includes(query)) ||
          test.category.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [tests, selectedCategory, selectedSheet, searchQuery]);

  // 상세보기
  const handleViewDetail = (test: ToxicityTest) => {
    setSelectedTest(test);
    setShowDetail(true);
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
      {/* 필터 영역 */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedSheet} onValueChange={setSelectedSheet}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="시트" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 시트</SelectItem>
            {sheets.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
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
            placeholder="시험명, 카테고리 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* 결과 수 */}
      <p className="text-sm text-gray-500">총 {filteredTests.length}개 항목 (읽기 전용)</p>

      {/* 테이블 */}
      <div className="border rounded-lg">
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">ID</TableHead>
                <TableHead className="w-24">시트</TableHead>
                <TableHead>시험명</TableHead>
                <TableHead className="w-24">동물종</TableHead>
                <TableHead className="w-32 text-right">단가</TableHead>
                <TableHead className="w-20">상태</TableHead>
                <TableHead className="w-16 text-center">보기</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTests.slice(0, 100).map((test) => (
                <TableRow key={test.id}>
                  <TableCell className="font-mono text-xs">
                    {test.itemId}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {test.sheet}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {test.testName || test.category}
                  </TableCell>
                  <TableCell className="text-sm">
                    {test.species || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {test.price ? formatCurrency(parseInt(test.price.replace(/,/g, ''))) : '별도협의'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={test.isActive ? 'default' : 'secondary'}>
                      {test.isActive ? '활성' : '비활성'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetail(test)}
                        title="상세보기"
                      >
                        <Eye className="w-4 h-4" />
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
                  <span className="text-gray-500">항목 ID:</span>
                  <span className="ml-2 font-mono">{selectedTest.itemId}</span>
                </div>
                <div>
                  <span className="text-gray-500">시트:</span>
                  <span className="ml-2">{selectedTest.sheet}</span>
                </div>
                <div>
                  <span className="text-gray-500">카테고리:</span>
                  <span className="ml-2">{selectedTest.category}</span>
                </div>
                <div>
                  <span className="text-gray-500">서브카테고리:</span>
                  <span className="ml-2">{selectedTest.subcategory || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">시험유형:</span>
                  <span className="ml-2">{selectedTest.testType || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">OECD:</span>
                  <span className="ml-2">{selectedTest.oecd || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">단가:</span>
                  <span className="ml-2 font-semibold text-primary">
                    {selectedTest.price ? formatCurrency(parseInt(selectedTest.price.replace(/,/g, ''))) : '별도협의'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">동물분류:</span>
                  <span className="ml-2">{selectedTest.animalClass || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">동물종:</span>
                  <span className="ml-2">{selectedTest.species || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">투여경로:</span>
                  <span className="ml-2">{selectedTest.routes || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">시험기간:</span>
                  <span className="ml-2">{selectedTest.duration || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">리드타임:</span>
                  <span className="ml-2">{selectedTest.leadTime || '-'}</span>
                </div>
              </div>

              {selectedTest.testName && (
                <div>
                  <span className="text-gray-500 text-sm">시험명:</span>
                  <p className="mt-1 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm">
                    {selectedTest.testName}
                  </p>
                </div>
              )}

              {selectedTest.animalsPerSex && selectedTest.animalsPerSex > 0 && (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">동물수/성별:</span>
                    <span className="ml-2">{selectedTest.animalsPerSex}마리</span>
                  </div>
                  <div>
                    <span className="text-gray-500">성별구성:</span>
                    <span className="ml-2">{selectedTest.sexConfig || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">총군수:</span>
                    <span className="ml-2">{selectedTest.totalGroups || '-'}군</span>
                  </div>
                </div>
              )}

              {selectedTest.remarks && (
                <div>
                  <span className="text-gray-500 text-sm">비고:</span>
                  <p className="mt-1 text-sm text-orange-600">{selectedTest.remarks}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
