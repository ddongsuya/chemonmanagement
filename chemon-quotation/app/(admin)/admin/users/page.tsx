'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Skeleton from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  MoreHorizontal,
  UserCheck,
  UserX,
  Shield,
  Key,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
} from 'lucide-react';
import {
  getUsers,
  updateUserStatus,
  updateUserRole,
  resetUserPassword,
  updateUserPermissions,
  AdminUser,
  AdminUserWithPermissions,
  UserListFilters,
  PaginatedResult,
} from '@/lib/admin-api';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';
type UserRole = 'USER' | 'ADMIN';

const statusLabels: Record<UserStatus, string> = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
  LOCKED: '잠금',
};

const statusColors: Record<UserStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  LOCKED: 'bg-red-100 text-red-800',
};

const roleLabels: Record<UserRole, string> = {
  USER: '사용자',
  ADMIN: '관리자',
};

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<UserListFilters>({
    search: '',
    status: undefined,
    role: undefined,
    page: 1,
    limit: 20,
  });

  // Dialog states
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    user: AdminUser | null;
    newStatus: 'ACTIVE' | 'INACTIVE' | null;
  }>({ open: false, user: null, newStatus: null });

  const [roleDialog, setRoleDialog] = useState<{
    open: boolean;
    user: AdminUser | null;
    newRole: 'USER' | 'ADMIN' | null;
  }>({ open: false, user: null, newRole: null });

  const [passwordDialog, setPasswordDialog] = useState<{
    open: boolean;
    user: AdminUser | null;
    tempPassword: string | null;
  }>({ open: false, user: null, tempPassword: null });

  const [permissionDialog, setPermissionDialog] = useState<{
    open: boolean;
    user: AdminUser | null;
    canViewAllSales: boolean;
  }>({ open: false, user: null, canViewAllSales: false });

  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getUsers(filters);
      if (response.success && response.data) {
        setUsers(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '사용자 목록을 불러오는데 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleStatusFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value === 'all' ? undefined : (value as UserStatus),
      page: 1,
    }));
  };

  const handleRoleFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      role: value === 'all' ? undefined : (value as UserRole),
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleStatusChange = async () => {
    if (!statusDialog.user || !statusDialog.newStatus) return;

    setActionLoading(true);
    try {
      const response = await updateUserStatus(statusDialog.user.id, statusDialog.newStatus);
      if (response.success) {
        toast({
          title: '성공',
          description: `사용자 상태가 ${statusLabels[statusDialog.newStatus]}(으)로 변경되었습니다`,
        });
        fetchUsers();
      } else {
        toast({
          title: '오류',
          description: response.error?.message || '상태 변경에 실패했습니다',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '상태 변경에 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
      setStatusDialog({ open: false, user: null, newStatus: null });
    }
  };

  const handleRoleChange = async () => {
    if (!roleDialog.user || !roleDialog.newRole) return;

    setActionLoading(true);
    try {
      const response = await updateUserRole(roleDialog.user.id, roleDialog.newRole);
      if (response.success) {
        toast({
          title: '성공',
          description: `사용자 권한이 ${roleLabels[roleDialog.newRole]}(으)로 변경되었습니다`,
        });
        fetchUsers();
      } else {
        toast({
          title: '오류',
          description: response.error?.message || '권한 변경에 실패했습니다',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '권한 변경에 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
      setRoleDialog({ open: false, user: null, newRole: null });
    }
  };

  const handleResetPassword = async (user: AdminUser) => {
    setActionLoading(true);
    try {
      const response = await resetUserPassword(user.id);
      if (response.success && response.data) {
        setPasswordDialog({
          open: true,
          user,
          tempPassword: response.data.tempPassword,
        });
      } else {
        toast({
          title: '오류',
          description: response.error?.message || '비밀번호 초기화에 실패했습니다',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '비밀번호 초기화에 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermissionChange = async () => {
    if (!permissionDialog.user) return;

    setActionLoading(true);
    try {
      const response = await updateUserPermissions(permissionDialog.user.id, {
        canViewAllSales: permissionDialog.canViewAllSales,
      });
      if (response.success) {
        toast({
          title: '성공',
          description: `매출 조회 권한이 ${permissionDialog.canViewAllSales ? '부여' : '해제'}되었습니다`,
        });
        fetchUsers();
      } else {
        toast({
          title: '오류',
          description: response.error?.message || '권한 변경에 실패했습니다',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '권한 변경에 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
      setPermissionDialog({ open: false, user: null, canViewAllSales: false });
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">사용자 관리</h1>
          <p className="text-muted-foreground">시스템 사용자를 관리합니다</p>
        </div>
        <Button onClick={fetchUsers} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          새로고침
        </Button>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="이름 또는 이메일로 검색..."
                  className="pl-9"
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
            <Select
              value={filters.status || 'all'}
              onValueChange={handleStatusFilter}
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="ACTIVE">활성</SelectItem>
                <SelectItem value="INACTIVE">비활성</SelectItem>
                <SelectItem value="LOCKED">잠금</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.role || 'all'}
              onValueChange={handleRoleFilter}
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="권한" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 권한</SelectItem>
                <SelectItem value="USER">사용자</SelectItem>
                <SelectItem value="ADMIN">관리자</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 사용자 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>사용자 목록</CardTitle>
          <CardDescription>
            총 {pagination.total}명의 사용자가 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>사용자</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>권한</TableHead>
                    <TableHead>견적서</TableHead>
                    <TableHead>고객</TableHead>
                    <TableHead>마지막 로그인</TableHead>
                    <TableHead>가입일</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        사용자가 없습니다
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[user.status]}>
                            {statusLabels[user.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                            {roleLabels[user.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>{user._count?.quotations || 0}</TableCell>
                        <TableCell>{user._count?.customers || 0}</TableCell>
                        <TableCell>
                          {user.lastLoginAt
                            ? format(new Date(user.lastLoginAt), 'yyyy-MM-dd HH:mm', { locale: ko })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(user.createdAt), 'yyyy-MM-dd', { locale: ko })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>작업</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {user.status === 'ACTIVE' ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setStatusDialog({
                                      open: true,
                                      user,
                                      newStatus: 'INACTIVE',
                                    })
                                  }
                                >
                                  <UserX className="w-4 h-4 mr-2" />
                                  비활성화
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setStatusDialog({
                                      open: true,
                                      user,
                                      newStatus: 'ACTIVE',
                                    })
                                  }
                                >
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  활성화
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() =>
                                  setRoleDialog({
                                    open: true,
                                    user,
                                    newRole: user.role === 'ADMIN' ? 'USER' : 'ADMIN',
                                  })
                                }
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                {user.role === 'ADMIN' ? '사용자로 변경' : '관리자로 변경'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleResetPassword(user)}
                              >
                                <Key className="w-4 h-4 mr-2" />
                                비밀번호 초기화
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  setPermissionDialog({
                                    open: true,
                                    user,
                                    canViewAllSales: !(user as AdminUserWithPermissions).canViewAllSales,
                                  })
                                }
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                {(user as AdminUserWithPermissions).canViewAllSales
                                  ? '매출 조회 권한 해제'
                                  : '매출 조회 권한 부여'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* 페이지네이션 */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    {pagination.total}개 중 {(pagination.page - 1) * pagination.limit + 1}-
                    {Math.min(pagination.page * pagination.limit, pagination.total)}개 표시
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm">
                      {pagination.page} / {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 상태 변경 확인 다이얼로그 */}
      <Dialog
        open={statusDialog.open}
        onOpenChange={(open) =>
          !open && setStatusDialog({ open: false, user: null, newStatus: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사용자 상태 변경</DialogTitle>
            <DialogDescription>
              {statusDialog.user?.name}님의 상태를{' '}
              {statusDialog.newStatus && statusLabels[statusDialog.newStatus]}(으)로
              변경하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setStatusDialog({ open: false, user: null, newStatus: null })
              }
            >
              취소
            </Button>
            <Button onClick={handleStatusChange} disabled={actionLoading}>
              {actionLoading ? '처리 중...' : '변경'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 권한 변경 확인 다이얼로그 */}
      <Dialog
        open={roleDialog.open}
        onOpenChange={(open) =>
          !open && setRoleDialog({ open: false, user: null, newRole: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사용자 권한 변경</DialogTitle>
            <DialogDescription>
              {roleDialog.user?.name}님의 권한을{' '}
              {roleDialog.newRole && roleLabels[roleDialog.newRole]}(으)로
              변경하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setRoleDialog({ open: false, user: null, newRole: null })
              }
            >
              취소
            </Button>
            <Button onClick={handleRoleChange} disabled={actionLoading}>
              {actionLoading ? '처리 중...' : '변경'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 비밀번호 초기화 결과 다이얼로그 */}
      <Dialog
        open={passwordDialog.open}
        onOpenChange={(open) =>
          !open && setPasswordDialog({ open: false, user: null, tempPassword: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>비밀번호 초기화 완료</DialogTitle>
            <DialogDescription>
              {passwordDialog.user?.name}님의 임시 비밀번호가 생성되었습니다.
              사용자에게 전달해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">임시 비밀번호</p>
              <p className="text-xl font-mono font-bold">
                {passwordDialog.tempPassword}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (passwordDialog.tempPassword) {
                  navigator.clipboard.writeText(passwordDialog.tempPassword);
                  toast({
                    title: '복사됨',
                    description: '임시 비밀번호가 클립보드에 복사되었습니다',
                  });
                }
              }}
              variant="outline"
            >
              복사
            </Button>
            <Button
              onClick={() =>
                setPasswordDialog({ open: false, user: null, tempPassword: null })
              }
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 매출 조회 권한 변경 다이얼로그 */}
      <Dialog
        open={permissionDialog.open}
        onOpenChange={(open) =>
          !open && setPermissionDialog({ open: false, user: null, canViewAllSales: false })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>매출 조회 권한 변경</DialogTitle>
            <DialogDescription>
              {permissionDialog.user?.name}님의 전체 매출 조회 권한을{' '}
              {permissionDialog.canViewAllSales ? '부여' : '해제'}하시겠습니까?
              {permissionDialog.canViewAllSales && (
                <span className="block mt-2 text-amber-600">
                  이 권한을 부여하면 모든 담당자의 매출 정보를 조회할 수 있습니다.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setPermissionDialog({ open: false, user: null, canViewAllSales: false })
              }
            >
              취소
            </Button>
            <Button onClick={handlePermissionChange} disabled={actionLoading}>
              {actionLoading ? '처리 중...' : '변경'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
