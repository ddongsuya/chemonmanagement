'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ArrowLeft,
  Activity,
  Shield,
  BarChart3,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';

const adminMenuItems = [
  {
    title: '대시보드',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: '사용자 관리',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: '매출 통계',
    href: '/admin/sales',
    icon: BarChart3,
  },
  {
    title: '공지사항 관리',
    href: '/admin/announcements',
    icon: Megaphone,
  },
  {
    title: '활동 로그',
    href: '/admin/logs',
    icon: Activity,
  },
  {
    title: '시스템 설정',
    href: '/admin/settings',
    icon: Settings,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col transition-all duration-300 ease-in-out',
        'bg-slate-900 text-white',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* 로고 */}
      <div className="h-16 flex items-center px-4 border-b border-white/10">
        {collapsed ? (
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center mx-auto">
            <Shield className="w-5 h-5 text-red-400" />
          </div>
        ) : (
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white">CHEMON</span>
              <p className="text-xs text-white/60">관리자 패널</p>
            </div>
          </Link>
        )}
      </div>

      {/* 일반 페이지로 돌아가기 */}
      {!collapsed && (
        <div className="px-4 py-3">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="text-sm">일반 페이지로</span>
            </Button>
          </Link>
        </div>
      )}

      {/* 메뉴 */}
      <nav className="flex-1 py-2 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {adminMenuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                    'transition-all duration-200 ease-in-out group',
                    isActive
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
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
