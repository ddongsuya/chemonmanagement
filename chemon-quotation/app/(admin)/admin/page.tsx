'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Skeleton from '@/components/ui/Skeleton';
import {
  Users,
  FileText,
  Building2,
  Activity,
  TrendingUp,
  UserCheck,
  UserX,
  Lock,
} from 'lucide-react';
import { getSystemStats, SystemStats, ActivityLog } from '@/lib/admin-api';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ title, value, description, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp
              className={`w-3 h-3 ${
                trend.isPositive ? 'text-green-500' : 'text-red-500 rotate-180'
              }`}
            />
            <span
              className={`text-xs ${
                trend.isPositive ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {trend.isPositive ? '+' : '-'}{trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">지난 주 대비</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityItem({ log }: { log: ActivityLog }) {
  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('REGISTER')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATE') || action.includes('CHANGE')) return 'bg-blue-100 text-blue-800';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800';
    if (action.includes('LOGIN')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'LOGIN': '로그인',
      'LOGOUT': '로그아웃',
      'REGISTER': '회원가입',
      'CREATE_QUOTATION': '견적서 생성',
      'UPDATE_QUOTATION': '견적서 수정',
      'DELETE_QUOTATION': '견적서 삭제',
      'CREATE_CUSTOMER': '고객 생성',
      'UPDATE_CUSTOMER': '고객 수정',
      'DELETE_CUSTOMER': '고객 삭제',
      'CHANGE_PASSWORD': '비밀번호 변경',
      'UPDATE_SETTINGS': '설정 변경',
    };
    return labels[action] || action;
  };

  return (
    <div className="flex items-center gap-4 py-3 border-b last:border-0">
      <div className="flex-shrink-0">
        <Activity className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{log.userName}</span>
          <Badge variant="secondary" className={getActionColor(log.action)}>
            {getActionLabel(log.action)}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {log.resource} {log.resourceId && `(${log.resourceId.slice(0, 8)}...)`}
        </p>
      </div>
      <div className="flex-shrink-0 text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: ko })}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await getSystemStats();
        if (response.success && response.data) {
          setStats(response.data);
        } else {
          setError(response.error?.message || '통계를 불러오는데 실패했습니다');
        }
      } catch (err) {
        setError('통계를 불러오는데 실패했습니다');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">관리자 대시보드</h1>
          <p className="text-muted-foreground">시스템 현황을 한눈에 확인하세요</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-primary hover:underline"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">관리자 대시보드</h1>
        <p className="text-muted-foreground">시스템 현황을 한눈에 확인하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="전체 사용자"
          value={stats?.totalUsers || 0}
          description={`활성: ${stats?.activeUsers || 0}명`}
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          title="오늘 견적서"
          value={stats?.todayQuotations || 0}
          description={`전체: ${stats?.totalQuotations || 0}건`}
          icon={<FileText className="w-4 h-4" />}
        />
        <StatCard
          title="오늘 고객"
          value={stats?.todayCustomers || 0}
          description={`전체: ${stats?.totalCustomers || 0}건`}
          icon={<Building2 className="w-4 h-4" />}
        />
        <StatCard
          title="비활성 계정"
          value={(stats?.inactiveUsers || 0) + (stats?.lockedUsers || 0)}
          description={`잠금: ${stats?.lockedUsers || 0}명`}
          icon={<UserX className="w-4 h-4" />}
        />
      </div>

      {/* 사용자 상태 요약 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-green-500" />
              활성 사용자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats?.activeUsers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserX className="w-4 h-4 text-gray-500" />
              비활성 사용자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">{stats?.inactiveUsers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-500" />
              잠금 계정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats?.lockedUsers || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* 최근 활동 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 활동</CardTitle>
          <CardDescription>시스템에서 발생한 최근 활동 내역입니다</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="divide-y">
              {stats.recentActivity.slice(0, 10).map((log) => (
                <ActivityItem key={log.id} log={log} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              최근 활동이 없습니다
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
