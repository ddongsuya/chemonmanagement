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
  Calendar,
  ChevronDown,
  FolderOpen,
  Calculator,
  Shield,
  UserPlus,
  Kanban,
  LucideIcon,
  LogOut,
  Megaphone,
  Search,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface MenuGroup {
  title: string;
  items: { title: string; href: string; icon: LucideIcon }[];
}

const menuGroups: MenuGroup[] = [
  {
    title: '영업관리',
    items: [
      { title: '파이프라인', href: '/pipeline', icon: Kanban },
      { title: '고객사 관리', href: '/customers', icon: Users },
    ],
  },
  {
    title: '견적관리',
    items: [
      { title: '견적서 작성', href: '/quotations/new', icon: FileText },
      { title: '견적 목록', href: '/quotations', icon: FolderOpen },
      { title: '패키지 템플릿', href: '/packages', icon: Package },
    ],
  },
];

const standaloneItems = [
  { title: '공지사항', href: '/announcements', icon: Megaphone },
  { title: '통합 검색', href: '/search', icon: Search },
  { title: '캘린더', href: '/calendar', icon: Calendar },
  { title: '계산기', href: '/calculators', icon: Calculator },
  { title: '통계/리포트', href: '/reports', icon: BarChart3 },
  { title: '설정', href: '/settings', icon: Settings },
];

interface MobileNavProps {
  onNavigate?: () => void;
}

export default function MobileNav({ onNavigate }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [openGroups, setOpenGroups] = useState<string[]>(['영업관리', '견적관리']);

  const isActive = (href: string) => {
    return pathname === href || (href !== '/' && href !== '/quotations/new' && pathname.startsWith(href));
  };

  const toggleGroup = (title: string) => {
    setOpenGroups(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const navigate = (href: string) => {
    router.push(href);
    onNavigate?.();
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full bg-[#E9E1D8] backdrop-blur-xl">
      {/* 로고 */}
      <div className="h-14 flex items-center px-5 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white text-xs font-bold">C</span>
        </div>
        <span className="ml-2.5 font-semibold text-sm text-slate-900">CHEMON</span>
        <span className="ml-1.5 text-xs text-slate-500">CRM</span>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {/* 대시보드 */}
        <button
          onClick={() => navigate('/dashboard')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors touch-manipulation min-h-[44px]',
            isActive('/dashboard')
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-slate-700 hover:bg-[#F5EDE3]'
          )}
        >
          <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
          <span>대시보드</span>
        </button>

        {/* 그룹 메뉴 */}
        {menuGroups.map((group) => (
          <div key={group.title} className="mt-3">
            <button
              onClick={() => toggleGroup(group.title)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 touch-manipulation"
            >
              <span>{group.title}</span>
              <ChevronDown className={cn(
                'w-3.5 h-3.5 transition-transform',
                openGroups.includes(group.title) && 'rotate-180'
              )} />
            </button>

            {openGroups.includes(group.title) && (
              <div className="mt-0.5 space-y-0.5">
                {group.items.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => navigate(item.href)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors touch-manipulation min-h-[44px]',
                      isActive(item.href)
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-slate-700 hover:bg-[#F5EDE3]'
                    )}
                  >
                    <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                    <span>{item.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* 구분선 — tonal layering instead of border */}
        <div className="my-3 h-px bg-[#F5EDE3]" />

        {/* 기타 메뉴 */}
        <div className="space-y-0.5">
          {standaloneItems.map((item) => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors touch-manipulation min-h-[44px]',
                isActive(item.href)
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-slate-700 hover:bg-[#F5EDE3]'
              )}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              <span>{item.title}</span>
            </button>
          ))}
        </div>

        {/* 관리자 패널 */}
        {user?.role === 'ADMIN' && (
          <>
            <div className="my-3 h-px bg-[#F5EDE3]" />
            <button
              onClick={() => navigate('/admin')}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors touch-manipulation min-h-[44px]',
                isActive('/admin')
                  ? 'bg-red-500/10 text-red-500 font-medium'
                  : 'text-red-400/70 hover:bg-red-500/5'
              )}
            >
              <Shield className="w-[18px] h-[18px] flex-shrink-0" />
              <span>관리자 패널</span>
            </button>
          </>
        )}
      </nav>

      {/* 하단: 유저 정보 + 로그아웃 */}
      <div className="bg-[#F5EDE3] p-3 flex-shrink-0">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-[#EFE7DD] flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-slate-600">
              {user?.name?.slice(0, 1) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-900 truncate">{user?.name || '사용자'}</div>
            <div className="text-[11px] text-slate-500">
              {user?.role === 'ADMIN' ? '관리자' : '사용자'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
