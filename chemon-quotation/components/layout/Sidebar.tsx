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
  ChevronDown,
  LogOut,
  FolderOpen,
  Calendar,
  Calculator,
  Shield,
  UserPlus,
  Kanban,
  LucideIcon,
  X,
  Megaphone,
  Search,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { useState } from 'react';
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
      { title: '파이프라인', href: '/pipeline', icon: Kanban },
      { title: '고객사 관리', href: '/customers', icon: Users },
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
];

const standaloneItems: MenuItem[] = [
  { title: '통합 검색', href: '/search', icon: Search },
  { title: '캘린더', href: '/calendar', icon: Calendar },
  { title: '계산기', href: '/calculators', icon: Calculator },
  { title: '통계/리포트', href: '/reports', icon: BarChart3 },
  { title: '설정', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [openGroups, setOpenGroups] = useState<string[]>(['영업관리', '견적관리']);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const toggleGroup = (title: string) => {
    setOpenGroups(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    return pathname === href || (href !== '/' && href !== '/quotations/new' && pathname.startsWith(href));
  };

  const isGroupActive = (group: MenuGroup) => {
    return group.items.some(item => isActive(item.href));
  };

  return (
    <div className="hidden md:block">
      <aside
        className={cn(
          'flex flex-col h-dvh transition-[width] duration-200 ease-out',
          'bg-slate-50 border-r border-slate-200',
          isExpanded ? 'w-60' : 'w-[68px]'
        )}
      >
        {/* 헤더 */}
        <div className={cn(
          'h-14 flex items-center border-b border-slate-200 flex-shrink-0',
          isExpanded ? 'px-5 justify-between' : 'justify-center'
        )}>
          {isExpanded ? (
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                  <span className="text-white text-xs font-bold">C</span>
                </div>
                <div>
                  <span className="text-blue-700 font-black text-sm tracking-tight block leading-none">Chemon</span>
                  <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Management</span>
                </div>
              </div>
              <button onClick={() => setIsExpanded(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button onClick={() => setIsExpanded(true)} className="text-slate-400 hover:text-slate-600 transition-colors">
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5">
          <div className="space-y-0.5">
            <NavItem icon={Megaphone} title="공지사항" href="/announcements" isActive={isActive('/announcements')} isExpanded={isExpanded} onClick={() => router.push('/announcements')} />
            <NavItem icon={LayoutDashboard} title="대시보드" href="/dashboard" isActive={isActive('/dashboard')} isExpanded={isExpanded} onClick={() => router.push('/dashboard')} />

            <div className="py-2"><div className="border-t border-slate-200" /></div>

            {menuGroups.map((group) => (
              <div key={group.title}>
                {isExpanded ? (
                  <Collapsible open={openGroups.includes(group.title)} onOpenChange={() => toggleGroup(group.title)}>
                    <CollapsibleTrigger asChild>
                      <button className={cn(
                        'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md',
                        'transition-colors duration-150 text-[11px] font-medium uppercase tracking-wider',
                        isGroupActive(group) ? 'text-slate-700' : 'text-slate-400 hover:text-slate-600'
                      )}>
                        <span>{group.title}</span>
                        <ChevronDown className={cn('w-3 h-3 transition-transform duration-150', openGroups.includes(group.title) && 'rotate-180')} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-0.5">
                      {group.items.map((item) => (
                        <NavItem key={item.href} icon={item.icon} title={item.title} href={item.href} isActive={isActive(item.href)} isExpanded={isExpanded} onClick={() => router.push(item.href)} />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <div className="relative group">
                    <button
                      onClick={() => router.push(group.items[0].href)}
                      className={cn(
                        'w-full h-9 flex items-center justify-center rounded-xl transition-all duration-200',
                        isGroupActive(group) ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'
                      )}
                    >
                      <group.icon className="w-[18px] h-[18px]" />
                    </button>
                    <Tooltip label={group.title} />
                  </div>
                )}
              </div>
            ))}

            <div className="py-2"><div className="border-t border-slate-200" /></div>

            {standaloneItems.map((item) => (
              <NavItem key={item.href} icon={item.icon} title={item.title} href={item.href} isActive={isActive(item.href)} isExpanded={isExpanded} onClick={() => router.push(item.href)} />
            ))}
          </div>
        </nav>

        {/* 하단 */}
        <div className="border-t border-slate-200 p-2.5 flex-shrink-0">
          {user?.role === 'ADMIN' && (
            <NavItem icon={Shield} title="관리자 패널" href="/admin" isActive={isActive('/admin')} isExpanded={isExpanded} onClick={() => router.push('/admin')} variant="admin" />
          )}
          <div className={cn('flex items-center gap-2.5 mt-1.5 px-2 py-2 rounded-md', isExpanded ? '' : 'justify-center')}>
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
              <span className="text-slate-600 text-xs font-medium">{user?.name?.slice(0, 1) || 'U'}</span>
            </div>
            {isExpanded && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-800 text-sm font-medium truncate">{user?.name || '사용자'}</div>
                  <div className="text-slate-400 text-[11px]">{user?.role === 'ADMIN' ? '관리자' : '사용자'}</div>
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors" title="로그아웃">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function NavItem({ icon: Icon, title, href, isActive, isExpanded, onClick, variant }: {
  icon: LucideIcon; title: string; href: string; isActive: boolean; isExpanded: boolean; onClick: () => void; variant?: 'admin';
}) {
  const isAdmin = variant === 'admin';
  if (!isExpanded) {
    return (
      <div className="relative group">
        <button onClick={onClick} className={cn(
          'w-full h-9 flex items-center justify-center rounded-xl transition-all duration-200',
          isAdmin ? 'text-red-400 hover:bg-red-50' : isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'
        )}>
          <Icon className="w-[18px] h-[18px]" />
        </button>
        <Tooltip label={title} />
      </div>
    );
  }
  return (
    <button onClick={onClick} className={cn(
      'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] transition-all duration-200',
      isAdmin ? 'text-red-400 hover:bg-red-50' : isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-800'
    )}>
      <Icon className="w-[18px] h-[18px] flex-shrink-0" />
      <span className="truncate">{title}</span>
    </button>
  );
}

function Tooltip({ label }: { label: string }) {
  return (
    <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-50">
      {label}
    </div>
  );
}
