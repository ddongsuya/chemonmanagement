'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  Users, 
  FileText, 
  BarChart3, 
  Menu,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
}

const mainNavItems: NavItem[] = [
  { href: '/dashboard', icon: <Home className="h-5 w-5" />, label: '홈' },
  { href: '/leads', icon: <Users className="h-5 w-5" />, label: '리드' },
  { href: '/quotations', icon: <FileText className="h-5 w-5" />, label: '견적' },
  { href: '/reports', icon: <BarChart3 className="h-5 w-5" />, label: '리포트' },
];

const moreNavItems: NavItem[] = [
  { href: '/customers', icon: <Users className="h-5 w-5" />, label: '고객사' },
  { href: '/contracts', icon: <FileText className="h-5 w-5" />, label: '계약' },
  { href: '/studies', icon: <FileText className="h-5 w-5" />, label: '스터디' },
  { href: '/pipeline', icon: <BarChart3 className="h-5 w-5" />, label: '파이프라인' },
  { href: '/calendar', icon: <FileText className="h-5 w-5" />, label: '캘린더' },
  { href: '/settings', icon: <Menu className="h-5 w-5" />, label: '설정' },
];

export function MobileNavigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {mainNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full py-2 text-xs transition-colors',
              isActive(item.href)
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {item.icon}
            <span className="mt-1">{item.label}</span>
          </Link>
        ))}
        
        {/* 더보기 메뉴 */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-2 text-xs transition-colors',
                'text-muted-foreground hover:text-foreground'
              )}
            >
              <Menu className="h-5 w-5" />
              <span className="mt-1">더보기</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[70vh]">
            <SheetHeader>
              <SheetTitle>메뉴</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-4 py-4">
              {moreNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex flex-col items-center justify-center p-4 rounded-lg transition-colors',
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted'
                  )}
                >
                  {item.icon}
                  <span className="mt-2 text-sm">{item.label}</span>
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

// 모바일 FAB (Floating Action Button)
export function MobileFAB() {
  const [isOpen, setIsOpen] = useState(false);

  const quickActions = [
    { href: '/leads/new', label: '리드 등록', icon: <Users className="h-4 w-4" /> },
    { href: '/quotations/new', label: '견적서 작성', icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <div className="fixed bottom-20 right-4 z-40 md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button
            className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-6 w-6" />
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>빠른 작업</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-2 py-4">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-4 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                  {action.icon}
                </div>
                <span className="font-medium">{action.label}</span>
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
