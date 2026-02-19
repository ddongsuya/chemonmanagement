'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Users,
  Search,
  Menu,
} from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import MobileNav from './MobileNav';

const tabs = [
  { id: 'dashboard', label: '대시보드', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'quotations', label: '견적', icon: FileText, href: '/quotations' },
  { id: 'customers', label: '고객', icon: Users, href: '/customers' },
  { id: 'search', label: '검색', icon: Search, href: '/search' },
  { id: 'more', label: '더보기', icon: Menu, href: '' },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isActive = (href: string) => {
    if (!href) return false;
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    return pathname === href || pathname.startsWith(href);
  };

  const handleTabClick = (tab: typeof tabs[0]) => {
    if (tab.id === 'more') {
      setSheetOpen(true);
      return;
    }
    router.push(tab.href);
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border/60 pb-safe">
        <div className="flex items-center justify-around h-14">
          {tabs.map((tab) => {
            const active = isActive(tab.href);

            if (tab.id === 'more') {
              return (
                <Sheet key={tab.id} open={sheetOpen} onOpenChange={setSheetOpen}>
                  <SheetTrigger asChild>
                    <button
                      className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full touch-manipulation"
                    >
                      <tab.icon className={cn(
                        'w-5 h-5 transition-colors',
                        'text-muted-foreground'
                      )} />
                      <span className={cn(
                        'text-[10px] transition-colors',
                        'text-muted-foreground'
                      )}>
                        {tab.label}
                      </span>
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-72">
                    <MobileNav onNavigate={() => setSheetOpen(false)} />
                  </SheetContent>
                </Sheet>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full touch-manipulation"
              >
                <tab.icon className={cn(
                  'w-5 h-5 transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground'
                )} />
                <span className={cn(
                  'text-[10px] transition-colors',
                  active ? 'text-primary font-semibold' : 'text-muted-foreground'
                )}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 하단 네비 높이만큼 콘텐츠 패딩 */}
      <div className="md:hidden h-14 pb-safe" />
    </>
  );
}
