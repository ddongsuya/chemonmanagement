'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Menu, FileText, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import UserMenu from './UserMenu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import MobileNav from './MobileNav';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { NotificationDropdown } from '@/components/notification';
import { getQuotations, getCustomers } from '@/lib/data-api';

interface SearchResult {
  id: string;
  type: 'quotation' | 'customer';
  title: string;
  subtitle: string;
  href: string;
}

interface HeaderProps {
  title?: string;
}

export default function Header({ title }: HeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // 검색 실행
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const searchAll = async () => {
      setIsSearching(true);
      const results: SearchResult[] = [];

      try {
        // 견적서 검색
        const quotationResponse = await getQuotations({ search: searchQuery, limit: 5 });
        if (quotationResponse.success && quotationResponse.data) {
          const quotationData = quotationResponse.data.data || [];
          quotationData.forEach(q => {
            results.push({
              id: q.id,
              type: 'quotation',
              title: q.quotationNumber,
              subtitle: `${q.customerName} - ${q.projectName}`,
              href: `/quotations/${q.id}`,
            });
          });
        }

        // 고객사 검색
        const customerResponse = await getCustomers({ search: searchQuery, limit: 5 });
        if (customerResponse.success && customerResponse.data) {
          const customerData = customerResponse.data.data || [];
          customerData.forEach(c => {
            results.push({
              id: c.id,
              type: 'customer',
              title: c.name,
              subtitle: c.company || c.email || '고객사',
              href: `/customers?search=${encodeURIComponent(c.name)}`,
            });
          });
        }

        setSearchResults(results.slice(0, 10));
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchAll, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // 외부 클릭 시 결과 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    router.push(result.href);
    setSearchQuery('');
    setShowResults(false);
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'quotation':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'customer':
        return <Users className="w-4 h-4 text-violet-500" />;
    }
  };

  return (
    <header className="h-14 bg-card/80 backdrop-blur-md border-b border-border/60 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      {/* 좌측: 모바일 메뉴 + 타이틀 */}
      <div className="flex items-center gap-4">
        {/* 모바일 메뉴 버튼 */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <MobileNav />
          </SheetContent>
        </Sheet>

        {/* 페이지 타이틀 */}
        {title && (
          <h1 className="text-base font-medium text-foreground hidden sm:block">
            {title}
          </h1>
        )}
      </div>

      {/* 우측: 검색 + 알림 + 사용자 */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* 검색 (PC만) */}
        <div className="hidden md:flex items-center" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="견적번호, 고객사, 프로젝트 검색..."
              className="w-72 pl-9 pr-8 bg-muted/50 border-border/50 focus:bg-card text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowResults(true)}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* 검색 결과 드롭다운 */}
            {showResults && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-soft-lg z-50 max-h-96 overflow-y-auto">
                {searchResults.length > 0 ? (
                  <ul className="py-1">
                    {searchResults.map((result) => (
                      <li key={`${result.type}-${result.id}`}>
                        <button
                          onClick={() => handleResultClick(result)}
                          className="w-full px-4 py-2 flex items-center gap-3 hover:bg-muted/50 text-left transition-colors"
                        >
                          {getResultIcon(result.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {result.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {result.subtitle}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {result.type === 'quotation' ? '견적' : '고객'}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                    {isSearching ? '검색 중...' : '검색 결과가 없습니다'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 테마 토글 */}
        <ThemeToggle />

        {/* 알림 */}
        <NotificationDropdown />

        {/* 사용자 메뉴 */}
        <UserMenu />
      </div>
    </header>
  );
}
