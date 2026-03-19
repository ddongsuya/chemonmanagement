'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import WorkDashboard from '@/components/dashboard/WorkDashboard';
import SalesDashboard from '@/components/dashboard/SalesDashboard';
import {
  FileText, Plus, FlaskConical, ChevronDown, Beaker, Microscope,
  ClipboardList, BarChart3,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('work');

  return (
    <div className="space-y-5">
      {/* 상단: 환영 메시지 + 빠른 작성 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            안녕하세요, {user?.name || '사용자'}님
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            오늘의 업무 현황을 확인하세요
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1.5 h-8">
              <Plus className="w-3.5 h-3.5" />
              새 견적서
              <ChevronDown className="w-3 h-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => router.push('/quotations/new')} className="cursor-pointer">
              <Beaker className="w-4 h-4 mr-2 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">독성시험 견적</p>
                <p className="text-[11px] text-muted-foreground">일반 독성시험 견적서</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/efficacy-quotations/new')} className="cursor-pointer">
              <FlaskConical className="w-4 h-4 mr-2 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">효력시험 견적</p>
                <p className="text-[11px] text-muted-foreground">효력시험 견적서</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/clinical-pathology/quotations/new')} className="cursor-pointer">
              <Microscope className="w-4 h-4 mr-2 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">임상병리 견적</p>
                <p className="text-[11px] text-muted-foreground">임상병리 견적서</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 탭: 업무 | 매출 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-9">
          <TabsTrigger value="work" className="gap-1.5 text-sm px-4">
            <ClipboardList className="w-3.5 h-3.5" />
            업무
          </TabsTrigger>
          <TabsTrigger value="sales" className="gap-1.5 text-sm px-4">
            <BarChart3 className="w-3.5 h-3.5" />
            매출
          </TabsTrigger>
        </TabsList>

        <TabsContent value="work" className="mt-4">
          <WorkDashboard />
        </TabsContent>

        <TabsContent value="sales" className="mt-4">
          <SalesDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
