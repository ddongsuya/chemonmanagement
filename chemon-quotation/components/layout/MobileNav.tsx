'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  BarChart3,
  Settings,
  Calendar,
} from 'lucide-react';
import { SheetClose } from '@/components/ui/sheet';

const menuItems = [
  { title: '대시보드', href: '/', icon: LayoutDashboard },
  { title: '견적서 작성', href: '/quotations/new', icon: FileText },
  { title: '견적 관리', href: '/quotations', icon: FileText },
  { title: '고객사 관리', href: '/customers', icon: Users },
  { title: '캘린더', href: '/calendar', icon: Calendar },
  { title: '패키지 템플릿', href: '/packages', icon: Package },
  { title: '통계/리포트', href: '/reports', icon: BarChart3 },
  { title: '설정', href: '/settings', icon: Settings },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* 로고 */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <span className="text-xl font-bold text-primary">CHEMON</span>
        <span className="ml-2 text-sm text-gray-500">견적관리</span>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <SheetClose asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                </SheetClose>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 하단 정보 */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          CHEMON 견적관리시스템 v1.0
        </p>
      </div>
    </div>
  );
}
