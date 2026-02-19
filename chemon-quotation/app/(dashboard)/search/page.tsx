'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  FileText,
  FlaskConical,
  Microscope,
  Loader2,
  Calendar,
  Filter,
  X,
} from 'lucide-react';
import {
  unifiedSearch,
  UnifiedSearchResult,
  SearchResponse,
  TYPE_LABELS,
  STATUS_LABELS,
} from '@/lib/search-api';
import { useToast } from '@/hooks/use-toast';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  TOXICITY: <FileText className="w-4 h-4 text-orange-500" />,
  EFFICACY: <FlaskConical className="w-4 h-4 text-amber-500" />,
  CLINICAL_PATHOLOGY: <Microscope className="w-4 h-4 text-emerald-500" />,
};

const TYPE_COLORS: Record<string, string> = {
  TOXICITY: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  EFFICACY: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  CLINICAL_PATHOLOGY: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-yellow-100 text-yellow-800',
  CONVERTED: 'bg-purple-100 text-purple-800',
};

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // 필터 상태
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    'TOXICITY', 'EFFICACY', 'CLINICAL_PATHOLOGY'
  ]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const q = searchQuery ?? query;
    if (!q.trim()) {
      toast({ title: '알림', description: '검색어를 입력해주세요.' });
      return;
    }

    setLoading(true);
    try {
      const response = await unifiedSearch({
        query: q.trim(),
        types: selectedTypes as any,
        status: selectedStatus || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setResults(response);
      
      // URL 업데이트
      const params = new URLSearchParams();
      params.set('q', q.trim());
      router.replace(`/search?${params.toString()}`, { scroll: false });
    } catch (error) {
      console.error('Search error:', error);
      toast({ title: '오류', description: '검색 중 오류가 발생했습니다.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [query, selectedTypes, selectedStatus, dateFrom, dateTo, router, toast]);

  // URL에서 검색어가 있으면 자동 검색
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      handleSearch(q);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSelectedTypes(['TOXICITY', 'EFFICACY', 'CLINICAL_PATHOLOGY']);
    setSelectedStatus('');
    setDateFrom('');
    setDateTo('');
  };

  const navigateToDetail = (result: UnifiedSearchResult) => {
    if (result.type === 'CLINICAL_PATHOLOGY') {
      router.push(`/clinical-pathology/quotations/${result.id}`);
    } else {
      router.push(`/quotations/${result.id}`);
    }
  };

  const formatAmount = (amount: number) => {
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(1)}억`;
    }
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(0)}만`;
    }
    return amount.toLocaleString();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">통합 검색</h1>
        <p className="text-sm text-muted-foreground">모든 견적서를 한 번에 검색하세요</p>
      </div>

      {/* 검색 바 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="견적번호, 고객명, 프로젝트명으로 검색..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10"
              />
            </div>
            <Button onClick={() => handleSearch()} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span className="ml-2">검색</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-muted' : ''}
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {/* 필터 패널 */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">필터</h3>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  초기화
                </Button>
              </div>

              {/* 유형 필터 */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">견적 유형</label>
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  {['TOXICITY', 'EFFICACY', 'CLINICAL_PATHOLOGY'].map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedTypes.includes(type)}
                        onCheckedChange={() => handleTypeToggle(type)}
                      />
                      <span className="flex items-center gap-1">
                        {TYPE_ICONS[type]}
                        {TYPE_LABELS[type]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 상태 필터 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">상태</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">전체</SelectItem>
                      {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">시작일</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">종료일</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 검색 결과 */}
      {results && (
        <>
          {/* 결과 요약 */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <span className="text-sm text-muted-foreground">
              총 <span className="font-semibold text-foreground">{results.counts.total}</span>건
            </span>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {results.counts.toxicity > 0 && (
                <Badge variant="outline" className="gap-1">
                  {TYPE_ICONS.TOXICITY}
                  독성 {results.counts.toxicity}
                </Badge>
              )}
              {results.counts.efficacy > 0 && (
                <Badge variant="outline" className="gap-1">
                  {TYPE_ICONS.EFFICACY}
                  효력 {results.counts.efficacy}
                </Badge>
              )}
              {results.counts.clinicalPathology > 0 && (
                <Badge variant="outline" className="gap-1">
                  {TYPE_ICONS.CLINICAL_PATHOLOGY}
                  임상병리 {results.counts.clinicalPathology}
                </Badge>
              )}
            </div>
          </div>

          {/* 결과 목록 */}
          {results.results.length > 0 ? (
            <div className="space-y-3">
              {results.results.map((result) => (
                <Card
                  key={`${result.type}-${result.id}`}
                  className="cursor-pointer hover:shadow-md transition-shadow touch-manipulation active:bg-muted/30"
                  onClick={() => navigateToDetail(result)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        {TYPE_ICONS[result.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{result.quotationNumber}</span>
                          <Badge className={`${TYPE_COLORS[result.type]} text-[10px] sm:text-xs`}>
                            {TYPE_LABELS[result.type]}
                          </Badge>
                          <Badge className={`${STATUS_COLORS[result.status] || 'bg-gray-100'} text-[10px] sm:text-xs`}>
                            {STATUS_LABELS[result.status] || result.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 truncate">
                          {result.customerName}
                          {result.projectName && ` · ${result.projectName}`}
                        </div>
                        <div className="flex items-center justify-between mt-2 sm:mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(result.createdAt)} · {result.createdBy.name}
                          </span>
                          <span className="font-semibold text-sm">{formatAmount(result.totalAmount)}원</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                검색 결과가 없습니다.
              </CardContent>
            </Card>
          )}

          {/* 페이지네이션 */}
          {results.pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: results.pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === results.pagination.page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    // 페이지 변경 로직
                  }}
                >
                  {page}
                </Button>
              ))}
            </div>
          )}
        </>
      )}

      {/* 초기 상태 */}
      {!results && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">견적서 통합 검색</h3>
            <p className="text-muted-foreground">
              독성시험, 효력시험, 임상병리 견적서를 한 번에 검색할 수 있습니다.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
