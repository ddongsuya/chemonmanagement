'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  Announcement,
  AnnouncementPriority,
  AnnouncementFilters,
  CreateAnnouncementDTO,
  UpdateAnnouncementDTO,
} from '@/lib/admin-api';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const priorityLabels: Record<AnnouncementPriority, string> = {
  LOW: '낮음',
  NORMAL: '보통',
  HIGH: '높음',
  URGENT: '긴급',
};

const priorityColors: Record<AnnouncementPriority, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  NORMAL: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

interface AnnouncementFormData {
  title: string;
  content: string;
  priority: AnnouncementPriority;
  startDate: string;
  endDate: string;
}

const initialFormData: AnnouncementFormData = {
  title: '',
  content: '',
  priority: 'NORMAL',
  startDate: format(new Date(), 'yyyy-MM-dd'),
  endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
};

export default function AnnouncementsPage() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AnnouncementFilters>({
    search: '',
    priority: undefined,
    isActive: undefined,
    page: 1,
    limit: 20,
  });

  // Dialog states
  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    announcement: Announcement | null;
  }>({ open: false, mode: 'create', announcement: null });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    announcement: Announcement | null;
  }>({ open: false, announcement: null });

  const [formData, setFormData] = useState<AnnouncementFormData>(initialFormData);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAnnouncements(filters);
      if (response.success && response.data) {
        setAnnouncements(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '공지사항 목록을 불러오는데 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handlePriorityFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      priority: value === 'all' ? undefined : (value as AnnouncementPriority),
      page: 1,
    }));
  };

  const handleActiveFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      isActive: value === 'all' ? undefined : value === 'true',
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const openCreateDialog = () => {
    setFormData(initialFormData);
    setFormDialog({ open: true, mode: 'create', announcement: null });
  };

  const openEditDialog = (announcement: Announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      startDate: format(new Date(announcement.startDate), 'yyyy-MM-dd'),
      endDate: format(new Date(announcement.endDate), 'yyyy-MM-dd'),
    });
    setFormDialog({ open: true, mode: 'edit', announcement });
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: '오류',
        description: '제목과 내용을 입력해주세요',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      if (formDialog.mode === 'create') {
        const data: CreateAnnouncementDTO = {
          title: formData.title,
          content: formData.content,
          priority: formData.priority,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
        };
        const response = await createAnnouncement(data);
        if (response.success) {
          toast({
            title: '성공',
            description: '공지사항이 등록되었습니다',
          });
          fetchAnnouncements();
        } else {
          toast({
            title: '오류',
            description: response.error?.message || '공지사항 등록에 실패했습니다',
            variant: 'destructive',
          });
        }
      } else if (formDialog.announcement) {
        const data: UpdateAnnouncementDTO = {
          title: formData.title,
          content: formData.content,
          priority: formData.priority,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
        };
        const response = await updateAnnouncement(formDialog.announcement.id, data);
        if (response.success) {
          toast({
            title: '성공',
            description: '공지사항이 수정되었습니다',
          });
          fetchAnnouncements();
        } else {
          toast({
            title: '오류',
            description: response.error?.message || '공지사항 수정에 실패했습니다',
            variant: 'destructive',
          });
        }
      }
      setFormDialog({ open: false, mode: 'create', announcement: null });
    } catch (error) {
      toast({
        title: '오류',
        description: '작업에 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.announcement) return;

    setActionLoading(true);
    try {
      const response = await deleteAnnouncement(deleteDialog.announcement.id);
      if (response.success) {
        toast({
          title: '성공',
          description: '공지사항이 삭제되었습니다',
        });
        fetchAnnouncements();
      } else {
        toast({
          title: '오류',
          description: response.error?.message || '공지사항 삭제에 실패했습니다',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '삭제에 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
      setDeleteDialog({ open: false, announcement: null });
    }
  };

  const handleToggleActive = async (announcement: Announcement) => {
    setActionLoading(true);
    try {
      const response = await updateAnnouncement(announcement.id, {
        isActive: !announcement.isActive,
      });
      if (response.success) {
        toast({
          title: '성공',
          description: `공지사항이 ${announcement.isActive ? '비활성화' : '활성화'}되었습니다`,
        });
        fetchAnnouncements();
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
    }
  };

  const isWithinPeriod = (announcement: Announcement) => {
    const now = new Date();
    const start = new Date(announcement.startDate);
    const end = new Date(announcement.endDate);
    return now >= start && now <= end;
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">공지사항 관리</h1>
          <p className="text-muted-foreground">시스템 공지사항을 관리합니다</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchAnnouncements} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            공지사항 등록
          </Button>
        </div>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="제목으로 검색..."
                  className="pl-9"
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
            <Select
              value={filters.priority || 'all'}
              onValueChange={handlePriorityFilter}
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="중요도" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 중요도</SelectItem>
                <SelectItem value="LOW">낮음</SelectItem>
                <SelectItem value="NORMAL">보통</SelectItem>
                <SelectItem value="HIGH">높음</SelectItem>
                <SelectItem value="URGENT">긴급</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.isActive === undefined ? 'all' : String(filters.isActive)}
              onValueChange={handleActiveFilter}
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="true">활성</SelectItem>
                <SelectItem value="false">비활성</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 공지사항 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>공지사항 목록</CardTitle>
          <CardDescription>
            총 {pagination.total}개의 공지사항이 있습니다
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
                    <TableHead>제목</TableHead>
                    <TableHead>중요도</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>게시 기간</TableHead>
                    <TableHead>조회수</TableHead>
                    <TableHead>등록일</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        공지사항이 없습니다
                      </TableCell>
                    </TableRow>
                  ) : (
                    announcements.map((announcement) => (
                      <TableRow key={announcement.id}>
                        <TableCell>
                          <div className="max-w-xs truncate font-medium">
                            {announcement.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={priorityColors[announcement.priority]}>
                            {priorityLabels[announcement.priority]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={announcement.isActive ? 'default' : 'secondary'}
                            >
                              {announcement.isActive ? '활성' : '비활성'}
                            </Badge>
                            {announcement.isActive && !isWithinPeriod(announcement) && (
                              <Badge variant="outline" className="text-orange-600">
                                기간 외
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(announcement.startDate), 'yyyy-MM-dd')} ~{' '}
                            {format(new Date(announcement.endDate), 'yyyy-MM-dd')}
                          </div>
                        </TableCell>
                        <TableCell>{announcement.viewCount}</TableCell>
                        <TableCell>
                          {format(new Date(announcement.createdAt), 'yyyy-MM-dd', {
                            locale: ko,
                          })}
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
                              <DropdownMenuItem
                                onClick={() => openEditDialog(announcement)}
                              >
                                <Pencil className="w-4 h-4 mr-2" />
                                수정
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleActive(announcement)}
                              >
                                {announcement.isActive ? (
                                  <>
                                    <EyeOff className="w-4 h-4 mr-2" />
                                    비활성화
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4 mr-2" />
                                    활성화
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  setDeleteDialog({ open: true, announcement })
                                }
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                삭제
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

      {/* 공지사항 등록/수정 다이얼로그 */}
      <Dialog
        open={formDialog.open}
        onOpenChange={(open) =>
          !open && setFormDialog({ open: false, mode: 'create', announcement: null })
        }
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {formDialog.mode === 'create' ? '공지사항 등록' : '공지사항 수정'}
            </DialogTitle>
            <DialogDescription>
              {formDialog.mode === 'create'
                ? '새로운 공지사항을 등록합니다'
                : '공지사항 내용을 수정합니다'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="공지사항 제목을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">내용</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="공지사항 내용을 입력하세요"
                rows={6}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">중요도</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      priority: value as AnnouncementPriority,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">낮음</SelectItem>
                    <SelectItem value="NORMAL">보통</SelectItem>
                    <SelectItem value="HIGH">높음</SelectItem>
                    <SelectItem value="URGENT">긴급</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">시작일</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">종료일</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                />
              </div>
            </div>
            {(formData.priority === 'HIGH' || formData.priority === 'URGENT') && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-800">
                  ⚠️ 높음 또는 긴급 중요도의 공지사항은 등록 시 모든 활성 사용자에게
                  알림이 발송됩니다.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setFormDialog({ open: false, mode: 'create', announcement: null })
              }
            >
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={actionLoading}>
              {actionLoading
                ? '처리 중...'
                : formDialog.mode === 'create'
                ? '등록'
                : '수정'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !open && setDeleteDialog({ open: false, announcement: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>공지사항 삭제</DialogTitle>
            <DialogDescription>
              &quot;{deleteDialog.announcement?.title}&quot; 공지사항을 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, announcement: null })}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
