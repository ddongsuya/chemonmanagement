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
  Zap,
  X,
  Megaphone,
  Search,
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
  description?: string;
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
      { title: '리드 관리', href: '/leads', icon: UserPlus, description: '잠재 고객 관리' },
      { title: '파이프라인', href: '/pipeline', icon: Kanban, description: '영업 현황' },
      { title: '고객사 관리', href: '/customers', icon: Users, description: '고객 정보' },
      { title: '매출 대시보드', href: '/sales', icon: TrendingUp, description: '매출 분석' },
    ],
  },
  {
    title: '견적관리',
    icon: FileText,
    items: [
      { title: '견적서 작성', href: '/quotations/new', icon: FileText, description: '새 견적 작성' },
      { title: '견적 목록', href: '/quotations', icon: FolderOpen, description: '견적 조회' },
      { title: '패키지 템플릿', href: '/packages', icon: Package, description: '템플릿 관리' },
    ],
  },
  {
    title: '계약/시험',
    icon: FileSignature,
    items: [
      { title: '계약 관리', href: '/contracts', icon: FileSignature, description: '계약 현황' },
      { title: '시험 관리', href: '/studies', icon: FlaskConical, description: '시험 진행' },
      { title: '시험의뢰서', href: '/clinical-pathology/test-requests', icon: ClipboardList, description: '의뢰서 관리' },
      { title: '상담기록', href: '/consultations', icon: MessageSquare, description: '상담 이력' },
    ],
  },
];

const standaloneItems: MenuItem[] = [
  { title: '통합 검색', href: '/search', icon: Search, description: '견적서 검색' },
  { title: '캘린더', href: '/calendar', icon: Calendar, description: '일정 관리' },
  { title: '계산기', href: '/calculators', icon: Calculator, description: '시험 계산기' },
  { title: '통계/리포트', href: '/reports', icon: BarChart3, description: '분석 리포트' },
  { title: '설정', href: '/settings', icon: Settings, description: '시스템 설정' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [openGroups, setOpenGroups] = useState<string[]>(['영업관리', '견적관리', '계약/시험']);

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

  const handleNavigationClick = (href: string) => {
    if (!isExpanded) {
      setIsExpanded(true);
      setTimeout(() => router.push(href), 150);
    } else {
      router.push(href);
    }
  };

  return (
    <div className="hidden md:block ml-4 my-4">
      <aside
        className={cn(
          'flex flex-col h-[calc(100vh-2rem)] transition-all duration-300 ease-in-out',
          'rounded-3xl overflow-hidden',
          'gradient-sidebar shadow-2xl border border-white/5',
          isExpanded ? 'w-64' : 'w-20'
        )}
      >
        {/* 헤더 - 로고 */}
        <div className="p-5 flex flex-col items-center relative">
          {/* 닫기 버튼 (확장 시) */}
          {isExpanded && (
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full 
                         flex items-center justify-center transition-all duration-200 hover:scale-110"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>
          )}
          
          {/* 로고 아이콘 */}
          <div 
            className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full 
                       flex items-center justify-center shadow-lg shadow-orange-500/30 cursor-pointer
                       hover:scale-110 transition-transform duration-200"
            onClick={() => !isExpanded && setIsExpanded(true)}
          >
            <Zap className="w-6 h-6 text-white" />
          </div>
          
          {/* 로고 텍스트 (확장 시) */}
          {isExpanded && (
            <div className="mt-3 text-center">
              <h2 className="text-white font-semibold text-base">CHEMON</h2>
              <p className="text-white/60 text-xs mt-0.5">견적관리 시스템</p>
            </div>
          )}
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-2">
            {/* 공지사항 (맨 위) */}
            <div className="relative group">
              <button
                onClick={() => handleNavigationClick('/announcements')}
                className={cn(
                  'transition-all duration-300 flex items-center relative overflow-hidden',
                  'hover:scale-105',
                  isExpanded 
                    ? 'w-full px-4 py-3 justify-start rounded-xl' 
                    : 'w-12 h-12 justify-center mx-auto rounded-full',
                  isActive('/announcements')
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30'
                    : 'bg-white/5 hover:bg-white/10'
                )}
              >
                <Megaphone className={cn(
                  'w-5 h-5 flex-shrink-0',
                  isActive('/announcements') ? 'text-white' : 'text-white/70'
                )} />
                
                {isExpanded && (
                  <div className="ml-3 overflow-hidden">
                    <div className={cn(
                      'font-medium text-sm whitespace-nowrap',
                      isActive('/announcements') ? 'text-white' : 'text-white/70'
                    )}>
                      공지사항
                    </div>
                    {isActive('/announcements') && (
                      <div className="text-xs text-white/70 mt-0.5">Announcements</div>
                    )}
                  </div>
                )}
                
                {/* 활성 인디케이터 */}
                {isActive('/announcements') && !isExpanded && (
                  <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-l-full" />
                )}
                {isActive('/announcements') && isExpanded && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full animate-pulse" />
                )}
              </button>

              {/* 툴팁 (접힌 상태) */}
              {!isExpanded && (
                <div className="absolute left-full ml-3 px-3 py-2 bg-gradient-to-br from-blue-500 to-blue-600 
                               text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 
                               pointer-events-none whitespace-nowrap z-50 shadow-lg 
                               transform translate-x-2 group-hover:translate-x-0">
                  <div className="font-medium text-sm">공지사항</div>
                  <div className="text-xs opacity-75 mt-0.5">Announcements</div>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-blue-500 rotate-45" />
                </div>
              )}
            </div>

            {/* 대시보드 (단독) */}
            <div className="relative group">
              <button
                onClick={() => handleNavigationClick('/dashboard')}
                className={cn(
                  'transition-all duration-300 flex items-center relative overflow-hidden',
                  'hover:scale-105',
                  isExpanded 
                    ? 'w-full px-4 py-3 justify-start rounded-xl' 
                    : 'w-12 h-12 justify-center mx-auto rounded-full',
                  isActive('/dashboard')
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30'
                    : 'bg-white/5 hover:bg-white/10'
                )}
              >
                <LayoutDashboard className={cn(
                  'w-5 h-5 flex-shrink-0',
                  isActive('/dashboard') ? 'text-white' : 'text-white/70'
                )} />
                
                {isExpanded && (
                  <div className="ml-3 overflow-hidden">
                    <div className={cn(
                      'font-medium text-sm whitespace-nowrap',
                      isActive('/dashboard') ? 'text-white' : 'text-white/70'
                    )}>
                      대시보드
                    </div>
                    {isActive('/dashboard') && (
                      <div className="text-xs text-white/70 mt-0.5">Overview</div>
                    )}
                  </div>
                )}
                
                {/* 활성 인디케이터 */}
                {isActive('/dashboard') && !isExpanded && (
                  <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-400 rounded-l-full" />
                )}
                {isActive('/dashboard') && isExpanded && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full animate-pulse" />
                )}
              </button>

              {/* 툴팁 (접힌 상태) */}
              {!isExpanded && (
                <div className="absolute left-full ml-3 px-3 py-2 bg-gradient-to-br from-orange-500 to-orange-600 
                               text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 
                               pointer-events-none whitespace-nowrap z-50 shadow-lg 
                               transform translate-x-2 group-hover:translate-x-0">
                  <div className="font-medium text-sm">대시보드</div>
                  <div className="text-xs opacity-75 mt-0.5">Overview</div>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-orange-500 rotate-45" />
                </div>
              )}
            </div>

            {/* 그룹 메뉴 */}
            {menuGroups.map((group) => (
              <div key={group.title}>
                {isExpanded ? (
                  <Collapsible
                    open={openGroups.includes(group.title)}
                    onOpenChange={() => toggleGroup(group.title)}
                  >
                    <CollapsibleTrigger asChild>
                      <button
                        className={cn(
                          'w-full flex items-center justify-between px-4 py-2.5 rounded-xl',
                          'transition-all duration-200',
                          isGroupActive(group)
                            ? 'bg-white/10 text-white'
                            : 'text-white/60 hover:bg-white/5 hover:text-white/80'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <group.icon className="w-5 h-5 flex-shrink-0" />
                          <span className="font-medium text-sm">{group.title}</span>
                        </div>
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 transition-transform duration-200',
                            openGroups.includes(group.title) && 'rotate-180'
                          )}
                        />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-1 ml-3 space-y-1">
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            'flex items-center gap-3 px-4 py-2 rounded-lg',
                            'transition-all duration-200 text-sm',
                            isActive(item.href)
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/20'
                              : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                          )}
                        >
                          <item.icon className="w-4 h-4 flex-shrink-0" />
                          <span>{item.title}</span>
                        </Link>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <div className="relative group">
                    <button
                      onClick={() => handleNavigationClick(group.items[0].href)}
                      className={cn(
                        'w-12 h-12 mx-auto rounded-full flex items-center justify-center',
                        'transition-all duration-300 hover:scale-110',
                        isGroupActive(group)
                          ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30'
                          : 'bg-white/5 hover:bg-white/10'
                      )}
                    >
                      <group.icon className={cn(
                        'w-5 h-5',
                        isGroupActive(group) ? 'text-white' : 'text-white/70'
                      )} />
                    </button>
                    
                    {/* 툴팁 */}
                    <div className="absolute left-full ml-3 px-3 py-2 bg-gradient-to-br from-orange-500 to-orange-600 
                                   text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 
                                   pointer-events-none whitespace-nowrap z-50 shadow-lg 
                                   transform translate-x-2 group-hover:translate-x-0">
                      <div className="font-medium text-sm">{group.title}</div>
                      <div className="text-xs opacity-75 mt-0.5">{group.items.length}개 메뉴</div>
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-orange-500 rotate-45" />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* 구분선 */}
            <div className="py-2">
              <div className="border-t border-white/10" />
            </div>

            {/* 기타 단독 메뉴 */}
            {standaloneItems.map((item) => (
              <div key={item.href} className="relative group">
                <button
                  onClick={() => handleNavigationClick(item.href)}
                  className={cn(
                    'transition-all duration-300 flex items-center relative',
                    'hover:scale-105',
                    isExpanded 
                      ? 'w-full px-4 py-2.5 justify-start rounded-xl' 
                      : 'w-12 h-12 justify-center mx-auto rounded-full',
                    isActive(item.href)
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30'
                      : 'bg-white/5 hover:bg-white/10'
                  )}
                >
                  <item.icon className={cn(
                    'w-5 h-5 flex-shrink-0',
                    isActive(item.href) ? 'text-white' : 'text-white/70'
                  )} />
                  
                  {isExpanded && (
                    <span className={cn(
                      'ml-3 font-medium text-sm',
                      isActive(item.href) ? 'text-white' : 'text-white/70'
                    )}>
                      {item.title}
                    </span>
                  )}
                </button>

                {/* 툴팁 (접힌 상태) */}
                {!isExpanded && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-gradient-to-br from-orange-500 to-orange-600 
                                 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 
                                 pointer-events-none whitespace-nowrap z-50 shadow-lg 
                                 transform translate-x-2 group-hover:translate-x-0">
                    <div className="font-medium text-sm">{item.title}</div>
                    <div className="text-xs opacity-75 mt-0.5">{item.description}</div>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-orange-500 rotate-45" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* 하단 영역 */}
        <div className="p-4 border-t border-white/10">
          {/* 관리자 패널 (관리자만) */}
          {user?.role === 'ADMIN' && (
            <div className="relative group mb-3">
              <button
                onClick={() => handleNavigationClick('/admin')}
                className={cn(
                  'transition-all duration-300 flex items-center',
                  'hover:scale-105',
                  isExpanded 
                    ? 'w-full px-4 py-2.5 justify-start rounded-xl' 
                    : 'w-12 h-12 justify-center mx-auto rounded-full',
                  'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                )}
              >
                <Shield className="w-5 h-5 flex-shrink-0" />
                {isExpanded && <span className="ml-3 font-medium text-sm">관리자 패널</span>}
              </button>
              
              {!isExpanded && (
                <div className="absolute left-full ml-3 px-3 py-2 bg-red-500 
                               text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 
                               pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  <div className="font-medium text-sm">관리자 패널</div>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-red-500 rotate-45" />
                </div>
              )}
            </div>
          )}

          {/* 유저 프로필 & 로그아웃 */}
          <div className={cn(
            'flex items-center gap-3',
            isExpanded ? 'justify-between' : 'justify-center'
          )}>
            {/* 프로필 아바타 */}
            <div className="relative group">
              <div 
                className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full 
                           flex items-center justify-center shadow-lg cursor-pointer
                           hover:scale-110 transition-all duration-300 flex-shrink-0"
                onClick={() => !isExpanded && setIsExpanded(true)}
              >
                <span className="text-white font-semibold">
                  {user?.name?.slice(0, 1) || 'U'}
                </span>
              </div>
              
              {/* 프로필 툴팁 (접힌 상태) */}
              {!isExpanded && (
                <div className="absolute left-full ml-3 px-3 py-2 bg-gradient-to-br from-orange-500 to-orange-600 
                               text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 
                               pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  <div className="font-medium text-sm">{user?.name || '사용자'}</div>
                  <div className="text-xs opacity-75 mt-0.5">{user?.role === 'ADMIN' ? '관리자' : '사용자'}</div>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-orange-500 rotate-45" />
                </div>
              )}
            </div>
            
            {/* 프로필 정보 & 로그아웃 (확장 시) */}
            {isExpanded && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium text-sm truncate">
                    {user?.name || '사용자'}
                  </div>
                  <div className="text-white/60 text-xs">
                    {user?.role === 'ADMIN' ? '관리자' : '사용자'}
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 
                             flex items-center justify-center transition-all duration-200
                             text-white/60 hover:text-red-400"
                  title="로그아웃"
                >
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
