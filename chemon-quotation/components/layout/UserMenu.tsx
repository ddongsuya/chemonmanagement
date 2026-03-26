'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function UserMenu() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const userName = user?.name || '사용자';
  const userEmail = user?.email || '';
  const initials = userName.slice(0, 2);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 p-1 rounded-full hover:bg-[#FAF2E9] transition-colors">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary text-white text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:block text-sm font-bold text-slate-700">
            {userName}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-[#E9E1D8] rounded-xl shadow-ambient">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-slate-900 font-bold">{userName}</span>
            <span className="text-xs text-slate-500 font-normal">
              {userEmail}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#F5EDE3]" />
        <DropdownMenuItem asChild>
          <Link href="/settings/profile" className="cursor-pointer rounded-lg text-slate-700">
            <User className="w-4 h-4 mr-2" />
            프로필
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer rounded-lg text-slate-700">
            <Settings className="w-4 h-4 mr-2" />
            설정
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#F5EDE3]" />
        <DropdownMenuItem 
          className="text-red-600 cursor-pointer rounded-lg"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
