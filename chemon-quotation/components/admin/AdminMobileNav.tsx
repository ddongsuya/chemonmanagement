'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Settings,
  LogOut,
  ArrowLeft,
  Activity,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { SheetClose } from '@/components/ui/sheet';

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

export default function AdminMobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* 로고 */}
      <div className="h-16 flex items-center px-4 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-white">CHEMON</span>
            <p className="text-xs text-white/60">관리자 패널</p>
          </div>
        </Link>
      </div>

      {/* 일반 페이지로 돌아가기 */}
      <div className="px-4 py-3">
        <SheetClose asChild>
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
        </SheetClose>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 py-2 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {adminMenuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <SheetClose asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                      'transition-all duration-200 ease-in-out group',
                      isActive
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'w-5 h-5 flex-shrink-0 transition-transform',
                        !isActive && 'group-hover:scale-110'
                      )}
                    />
                    <span className="font-medium text-sm">{item.title}</span>
                  </Link>
                </SheetClose>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 하단 영역 */}
      <div className="p-3 border-t border-white/10">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start text-white/70 hover:text-white hover:bg-red-500/20"
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span className="text-sm">로그아웃</span>
        </Button>
      </div>
    </div>
  );
}
