'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search, Loader2, Users, FileText, FileSignature, FlaskConical,
  ClipboardList, MessageSquare, UserPlus, ArrowRight,
} from 'lucide-react';
import {
  globalSearch, GlobalSearchResult, SearchResponse,
  SearchCategory, CATEGORY_LABELS, STATUS_LABELS,
} from '@/lib/search-api';
import { useToast } from '@/hooks/use-toast';

const CATEGORY_CONFIG: Record<SearchCategory, { icon: typeof Search; color: string }> = {
  customer: { icon: Users, color: 'text-blue-600 bg-blue-50' },
  quotation: { icon: FileText, color: 'text-amber-600 bg-amber-50' },
  contract: { icon: FileSignature, color: 'text-emerald-600 bg-emerald-50' },
  study: { icon: FlaskConical, color: 'text-purple-600 bg-purple-50' },
  test_reception: { icon: ClipboardList, color: 'text-orange-600 bg-orange-50' },
  consultation: { icon: MessageSquare, color: 'text-slate-600 bg-slate-100' },
  lead: { icon: UserPlus, color: 'text-pink-600 bg-pink-50' },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SearchCategory | 'all'>('all');

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const q = searchQuery ?? query;
    if (!q.trim()) {
      toast({ title: '알림', description: '검색어를 입력해주세요.' });
      return;
    }
    setLoading(true);
    try {
      const categories = activeCategory !== 'all' ? [activeCategory] : undefined;
      const response = await globalSearch({ query: q.trim(), categories, limit: 50 });
      setResults(response);
      const params = new URLSearchParams();
      params.set('q', q.trim());
      router.replace(`/search?${params.toString()}`, { scroll: false });
    } catch {
      toast({ title: '오류', description: '검색 중 오류가 발생했습니다.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [query, activeCategory, router, toast]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) { setQuery(q); handleSearch(q); }
  }, []);

  const filteredResults = results?.results.filter(
    r => activeCategory === 'all' || r.category === activeCategory
  ) || [];

  const totalCount = results ? Object.values(results.counts).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">통합 검색</h1>
        <p className="text-sm text-muted-foreground">고객사, 견적, 계약, 시험, 상담, 리드를 한 번에 검색</p>
      </div>

      {/* 검색 바 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="고객사명, 견적번호, 계약번호, 시험번호, 물질명..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
            autoFocus
          />
        </div>
        <Button onClick={() => handleSearch()} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          <span className="ml-1.5 hidden sm:inline">검색</span>
        </Button>
      </div>

      {/* 카테고리 탭 */}
      {results && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            전체 ({totalCount})
          </button>
          {(Object.keys(CATEGORY_LABELS) as SearchCategory[]).map(cat => {
            const count = results.counts[cat] || 0;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {CATEGORY_LABELS[cat]} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* 결과 목록 */}
      {results && (
        filteredResults.length > 0 ? (
          <div className="space-y-2">
            {filteredResults.map((result) => (
              <SearchResultCard key={`${result.category}-${result.id}`} result={result} router={router} />
            ))}
          </div>
        ) : (
          <Card className="border">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">검색 결과가 없습니다.</p>
            </CardContent>
          </Card>
        )
      )}

      {/* 초기 상태 */}
      {!results && !loading && (
        <Card className="border">
          <CardContent className="py-16 text-center">
            <Search className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">검색어를 입력하면 웹앱 전체 데이터에서 검색합니다.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SearchResultCard({ result, router }: { result: GlobalSearchResult; router: ReturnType<typeof useRouter> }) {
  const config = CATEGORY_CONFIG[result.category];
  const Icon = config.icon;
  const [iconBg, iconText] = config.color.split(' ');

  return (
    <Card
      className="border cursor-pointer hover:bg-muted/30 transition-colors duration-150"
      onClick={() => router.push(result.href)}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium truncate">{result.title}</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {CATEGORY_LABELS[result.category]}
              </Badge>
              {result.status && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {STATUS_LABELS[result.status] || result.status}
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-xs text-muted-foreground truncate max-w-[70%]">{result.subtitle}</p>
              <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(result.date)}</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground/40 shrink-0 hidden sm:block" />
        </div>
      </CardContent>
    </Card>
  );
}
