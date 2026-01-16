'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  FileSignature,
  ClipboardList,
  LogOut,
  FolderOpen,
  Calendar,
  Calculator,
  Shield,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';

const menuItems = [
  {
    title: '대시보드',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: '견적서 작성',
    href: '/quotations/new',
    icon: FileText,
  },
  {
    title: '견적 관리',
    href: '/quotations',
    icon: FolderOpen,
  },
  {
    title: '고객사 관리',
    href: '/customers',
    icon: Users,
  },
  {
    title: '캘린더',
    href: '/calendar',
    icon: Calendar,
  },
  {
    title: '패키지 템플릿',
    href: '/packages',
    icon: Package,
  },
  {
    title: '계약서 관리',
    href: '/contracts',
    icon: FileSignature,
  },
  {
    title: '상담기록지',
    href: '/consultation/new',
    icon: ClipboardList,
  },
  {
    title: '통계/리포트',
    href: '/reports',
    icon: BarChart3,
  },
  {
    title: '계산기',
    href: '/calculators',
    icon: Calculator,
  },
  {
    title: '설정',
    href: '/settings',
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col transition-all duration-300 ease-in-out',
        'bg-[hsl(222,47%,15%)] text-white',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* 로고 */}
      <div className="h-16 flex items-center px-4 border-b border-white/10">
        {collapsed ? (
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mx-auto">
            <span className="text-lg font-bold text-white">C</span>
          </div>
        ) : (
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-lg font-bold text-white">C</span>
            </div>
            <div>
              <span className="text-lg font-bold text-white">CHEMON</span>
              <p className="text-xs text-white/60">견적관리 시스템</p>
            </div>
          </Link>
        )}
      </div>

      {/* 검색 (확장 시에만) */}
      {!collapsed && (
        <div className="px-4 py-3">
          <div className="relative">
            <input
              type="text"
              placeholder="메뉴 검색..."
              className="w-full h-9 pl-3 pr-3 text-sm bg-white/5 border border-white/10 rounded-lg 
                         text-white placeholder:text-white/40 focus:outline-none focus:border-blue-400/50
                         focus:bg-white/10 transition-all"
            />
          </div>
        </div>
      )}

      {/* 메뉴 */}
      <nav className="flex-1 py-2 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' &&
                item.href !== '/quotations/new' &&
                pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                    'transition-all duration-200 ease-in-out group',
                    isActive
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-white/70 hover:bg-white/10 hover:text-white',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <item.icon
                    className={cn(
                      'w-5 h-5 flex-shrink-0 transition-transform',
                      !isActive && 'group-hover:scale-110'
                    )}
                  />
                  {!collapsed && (
                    <span className="font-medium text-sm">{item.title}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 하단 영역 */}
      <div className="p-3 border-t border-white/10 space-y-2">
        {/* 관리자 패널 링크 (관리자만) */}
        {user?.role === 'ADMIN' && (
          <Link href="/admin">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'w-full text-white/70 hover:text-white hover:bg-red-500/20',
                collapsed ? 'justify-center' : 'justify-start'
              )}
            >
              <Shield className="w-4 h-4" />
              {!collapsed && <span className="text-sm ml-2">관리자 패널</span>}
            </Button>
          </Link>
        )}

        {/* 접기/펼치기 버튼 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full text-white/70 hover:text-white hover:bg-white/10',
            collapsed ? 'justify-center' : 'justify-start'
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span className="text-sm">사이드바 접기</span>
            </>
          )}
        </Button>

        {/* 로그아웃 버튼 */}
        {!collapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-white/70 hover:text-white hover:bg-red-500/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span className="text-sm">로그아웃</span>
          </Button>
        )}
      </div>
    </aside>
  );
}
