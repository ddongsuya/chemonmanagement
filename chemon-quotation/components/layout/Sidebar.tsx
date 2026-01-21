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
  ChevronDown,
  FileSignature,
  ClipboardList,
  LogOut,
  FolderOpen,
  Calendar,
  Calculator,
  Shield,
  UserPlus,
  Kanban,
  FlaskConical,
  MessageSquare,
  LucideIcon,
  TrendingUp,
  Microscope,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface MenuItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

interface MenuGroup {
  title: string;
  icon: LucideIcon;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    title: '영업관리',
    icon: UserPlus,
    items: [
      { title: '리드 관리', href: '/leads', icon: UserPlus },
      { title: '파이프라인', href: '/pipeline', icon: Kanban },
      { title: '고객사 관리', href: '/customers', icon: Users },
      { title: '매출 대시보드', href: '/sales', icon: TrendingUp },
    ],
  },
  {
    title: '견적관리',
    icon: FileText,
    items: [
      { title: '견적서 작성', href: '/quotations/new', icon: FileText },
      { title: '견적 목록', href: '/quotations', icon: FolderOpen },
      { title: '패키지 템플릿', href: '/packages', icon: Package },
    ],
  },
  {
    title: '계약/시험',
    icon: FileSignature,
    items: [
      { title: '계약 관리', href: '/contracts', icon: FileSignature },
      { title: '시험 관리', href: '/studies', icon: FlaskConical },
      { title: '상담기록', href: '/consultations', icon: MessageSquare },
    ],
  },
  {
    title: '임상병리검사',
    icon: Microscope,
    items: [
      { title: '견적서 관리', href: '/clinical-pathology/quotations', icon: FileText },
      { title: '시험의뢰서', href: '/clinical-pathology/test-requests', icon: ClipboardList },
      { title: '설정', href: '/clinical-pathology/settings', icon: Settings },
    ],
  },
];

const standaloneItems: MenuItem[] = [
  { title: '대시보드', href: '/dashboard', icon: LayoutDashboard },
  { title: '캘린더', href: '/calendar', icon: Calendar },
  { title: '계산기', href: '/calculators', icon: Calculator },
  { title: '통계/리포트', href: '/reports', icon: BarChart3 },
  { title: '설정', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(['영업관리', '견적관리', '계약/시험', '임상병리검사']);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const toggleGroup = (title: string) => {
    setOpenGroups(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    return pathname === href || (href !== '/' && href !== '/quotations/new' && pathname.startsWith(href));
  };

  const isGroupActive = (group: MenuGroup) => {
    return group.items.some(item => isActive(item.href));
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
          {/* 대시보드 (단독) */}
          <li>
            <Link
              href="/dashboard"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                'transition-all duration-200 ease-in-out group',
                isActive('/dashboard')
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
                collapsed && 'justify-center px-2'
              )}
            >
              <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium text-sm">대시보드</span>}
            </Link>
          </li>

          {/* 그룹 메뉴 */}
          {menuGroups.map((group) => (
            <li key={group.title}>
              {collapsed ? (
                // 접힌 상태: 그룹 아이콘만 표시, 첫 번째 항목으로 이동
                <Link
                  href={group.items[0].href}
                  className={cn(
                    'flex items-center justify-center px-2 py-2.5 rounded-xl',
                    'transition-all duration-200 ease-in-out',
                    isGroupActive(group)
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <group.icon className="w-5 h-5" />
                </Link>
              ) : (
                // 펼친 상태: 접을 수 있는 그룹
                <Collapsible
                  open={openGroups.includes(group.title)}
                  onOpenChange={() => toggleGroup(group.title)}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2.5 rounded-xl',
                        'transition-all duration-200 ease-in-out',
                        isGroupActive(group)
                          ? 'bg-white/10 text-white'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <group.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium text-sm">{group.title}</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 transition-transform',
                          openGroups.includes(group.title) && 'rotate-180'
                        )}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-1 ml-4 space-y-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg',
                          'transition-all duration-200 ease-in-out text-sm',
                          isActive(item.href)
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                            : 'text-white/60 hover:bg-white/10 hover:text-white'
                        )}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </li>
          ))}

          {/* 구분선 */}
          <li className="py-2">
            <div className="border-t border-white/10" />
          </li>

          {/* 기타 단독 메뉴 */}
          {standaloneItems.slice(1).map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                  'transition-all duration-200 ease-in-out group',
                  isActive(item.href)
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                  collapsed && 'justify-center px-2'
                )}
              >
                <item.icon
                  className={cn(
                    'w-5 h-5 flex-shrink-0 transition-transform',
                    !isActive(item.href) && 'group-hover:scale-110'
                  )}
                />
                {!collapsed && <span className="font-medium text-sm">{item.title}</span>}
              </Link>
            </li>
          ))}
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
