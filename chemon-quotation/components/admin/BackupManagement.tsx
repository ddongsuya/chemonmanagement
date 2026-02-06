'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  Database,
  Download,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Trash2,
  RefreshCw,
  HardDrive,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { getAccessToken } from '@/lib/auth-api';
import BackupProgress, { BackupProgressStatus } from './BackupProgress';
import BackupRestoreDialog, { RestoreOptions } from './BackupRestoreDialog';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 백업 상태 타입
type BackupStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
type BackupType = 'AUTO' | 'MANUAL';

// 백업 데이터 인터페이스
interface Backup {
  id: string;
  filename: string;
  size: string | number;
  status: BackupStatus;
  type: BackupType;
  createdAt: string;
}

interface BackupListResponse {
  backups: Backup[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface RestoreResult {
  success: boolean;
  restoredTables: string[];
  recordCounts: Record<string, number>;
  errors?: string[];
}

/**
 * 백업 관리 메인 컴포넌트
 * Requirements: 1.2.1 - 관리자 페이지에서 "지금 백업" 버튼 제공
 * Requirements: 1.2.2 - 백업 진행 상태 표시 (진행률 또는 스피너)
 * Requirements: 1.2.4 - 백업 히스토리 목록 표시 (날짜, 크기, 상태)
 */
export default function BackupManagement() {
  const { toast } = useToast();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progressStatus, setProgressStatus] = useState<BackupProgressStatus>('idle');
  const [progressMessage, setProgressMessage] = useState<string>('');
  
  // 복구 다이얼로그 상태
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  /**
   * 백업 목록 조회
   */
  const fetchBackups = useCallback(async () => {
    try {
      const accessToken = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/admin/backups`, {
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setBackups(data.data.backups || []);
      } else {
        throw new Error(data.error?.message || '백업 목록을 불러오는데 실패했습니다');
      }
    } catch (error) {
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '백업 목록을 불러오는데 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  /**
   * 수동 백업 생성
   * Requirements: 1.2.1 - 관리자 페이지에서 "지금 백업" 버튼 제공
   */
  const handleCreateBackup = async () => {
    setProgressStatus('creating');
    setProgressMessage('백업 데이터 수집 중...');

    try {
      const accessToken = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/admin/backups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ type: 'MANUAL' }),
      });

      const data = await response.json();

      if (data.success) {
        setProgressStatus('completed');
        setProgressMessage('백업이 성공적으로 생성되었습니다');
        toast({
          title: '백업 완료',
          description: `백업 파일이 생성되었습니다: ${data.data.filename}`,
        });
        fetchBackups();
        
        // 3초 후 진행 상태 초기화
        setTimeout(() => {
          setProgressStatus('idle');
          setProgressMessage('');
        }, 3000);
      } else {
        throw new Error(data.error?.message || '백업 생성에 실패했습니다');
      }
    } catch (error) {
      setProgressStatus('failed');
      setProgressMessage(error instanceof Error ? error.message : '백업 생성에 실패했습니다');
      toast({
        title: '백업 실패',
        description: error instanceof Error ? error.message : '백업 생성에 실패했습니다',
        variant: 'destructive',
      });
      
      // 5초 후 진행 상태 초기화
      setTimeout(() => {
        setProgressStatus('idle');
        setProgressMessage('');
      }, 5000);
    }
  };

  /**
   * 백업 다운로드
   * Requirements: 1.2.3 - 백업 완료 후 다운로드 링크 제공
   */
  const handleDownload = async (backup: Backup) => {
    setProgressStatus('downloading');
    setProgressMessage(`${backup.filename} 다운로드 준비 중...`);

    try {
      const accessToken = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/admin/backups/${backup.id}/download`, {
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('다운로드에 실패했습니다');
      }

      // Blob으로 변환하여 다운로드
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = backup.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setProgressStatus('completed');
      setProgressMessage('다운로드가 완료되었습니다');
      
      setTimeout(() => {
        setProgressStatus('idle');
        setProgressMessage('');
      }, 3000);
    } catch (error) {
      setProgressStatus('failed');
      setProgressMessage(error instanceof Error ? error.message : '다운로드에 실패했습니다');
      toast({
        title: '다운로드 실패',
        description: error instanceof Error ? error.message : '다운로드에 실패했습니다',
        variant: 'destructive',
      });
      
      setTimeout(() => {
        setProgressStatus('idle');
        setProgressMessage('');
      }, 5000);
    }
  };

  /**
   * 복구 다이얼로그 열기
   */
  const handleOpenRestoreDialog = (backup: Backup) => {
    setSelectedBackup(backup);
    setRestoreDialogOpen(true);
  };

  /**
   * 백업 복구 실행
   * Requirements: 1.3.1 - 백업 파일 선택하여 복구 시작 가능
   * Requirements: 1.3.3 - 테이블별 선택적 복구 옵션 제공
   */
  const handleRestore = async (options: RestoreOptions) => {
    if (!selectedBackup) return;

    setIsRestoring(true);
    setProgressStatus('restoring');
    setProgressMessage('데이터 복구 중...');

    try {
      const accessToken = getAccessToken();
      const response = await fetch(
        `${API_BASE_URL}/api/admin/backups/${selectedBackup.id}/restore`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(options),
        }
      );

      const data = await response.json();

      if (data.success) {
        const result: RestoreResult = data.data;
        setProgressStatus('completed');
        setProgressMessage('복구가 완료되었습니다');
        
        // 복구 결과 표시
        const restoredCount = Object.values(result.recordCounts).reduce((a, b) => a + b, 0);
        toast({
          title: '복구 완료',
          description: `${result.restoredTables.length}개 테이블, 총 ${restoredCount}개 레코드가 복구되었습니다`,
        });
        
        setRestoreDialogOpen(false);
        fetchBackups();
      } else {
        throw new Error(data.error?.message || '복구에 실패했습니다');
      }
    } catch (error) {
      setProgressStatus('failed');
      setProgressMessage(error instanceof Error ? error.message : '복구에 실패했습니다');
      toast({
        title: '복구 실패',
        description: error instanceof Error ? error.message : '복구에 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setIsRestoring(false);
      
      setTimeout(() => {
        setProgressStatus('idle');
        setProgressMessage('');
      }, 5000);
    }
  };

  /**
   * 백업 삭제
   */
  const handleDelete = async (backup: Backup) => {
    if (!confirm(`"${backup.filename}" 백업을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const accessToken = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/admin/backups/${backup.id}`, {
        method: 'DELETE',
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (response.ok) {
        toast({
          title: '삭제 완료',
          description: '백업이 삭제되었습니다',
        });
        fetchBackups();
      } else {
        const data = await response.json();
        throw new Error(data.error?.message || '삭제에 실패했습니다');
      }
    } catch (error) {
      toast({
        title: '삭제 실패',
        description: error instanceof Error ? error.message : '삭제에 실패했습니다',
        variant: 'destructive',
      });
    }
  };

  /**
   * 파일 크기 포맷팅
   */
  const formatFileSize = (size: string | number): string => {
    const bytes = typeof size === 'string' ? parseInt(size, 10) : size;
    if (isNaN(bytes)) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let value = bytes;
    
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }
    
    return `${value.toFixed(1)} ${units[unitIndex]}`;
  };

  /**
   * 날짜 포맷팅
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * 상태 배지 렌더링
   */
  const renderStatusBadge = (status: BackupStatus) => {
    const statusConfig: Record<BackupStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      PENDING: { label: '대기 중', variant: 'secondary' },
      IN_PROGRESS: { label: '진행 중', variant: 'outline' },
      COMPLETED: { label: '완료', variant: 'default' },
      FAILED: { label: '실패', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  /**
   * 타입 배지 렌더링
   */
  const renderTypeBadge = (type: BackupType) => {
    return (
      <Badge variant="outline" className={type === 'AUTO' ? 'border-blue-300 text-blue-600' : 'border-green-300 text-green-600'}>
        {type === 'AUTO' ? '자동' : '수동'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Database className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle>백업 관리</CardTitle>
                <CardDescription>
                  시스템 데이터를 백업하고 복구할 수 있습니다
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchBackups}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                새로고침
              </Button>
              <Button
                onClick={handleCreateBackup}
                disabled={progressStatus !== 'idle'}
              >
                <Plus className="h-4 w-4 mr-2" />
                지금 백업
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* 진행 상태 표시 */}
        {progressStatus !== 'idle' && (
          <CardContent className="pt-0">
            <BackupProgress
              status={progressStatus}
              message={progressMessage}
            />
          </CardContent>
        )}
      </Card>

      {/* 백업 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            백업 히스토리
          </CardTitle>
          <CardDescription>
            생성된 백업 파일 목록입니다. 다운로드하거나 복구할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : backups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">백업 파일이 없습니다</p>
              <p className="text-sm text-muted-foreground mt-1">
                &quot;지금 백업&quot; 버튼을 클릭하여 첫 번째 백업을 생성하세요
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>파일명</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      생성일
                    </div>
                  </TableHead>
                  <TableHead>크기</TableHead>
                  <TableHead>타입</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell className="font-medium">{backup.filename}</TableCell>
                    <TableCell>{formatDate(backup.createdAt)}</TableCell>
                    <TableCell>{formatFileSize(backup.size)}</TableCell>
                    <TableCell>{renderTypeBadge(backup.type)}</TableCell>
                    <TableCell>{renderStatusBadge(backup.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDownload(backup)}
                            disabled={backup.status !== 'COMPLETED'}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            다운로드
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenRestoreDialog(backup)}
                            disabled={backup.status !== 'COMPLETED'}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            복구
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(backup)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 복구 다이얼로그 */}
      {selectedBackup && (
        <BackupRestoreDialog
          open={restoreDialogOpen}
          onOpenChange={setRestoreDialogOpen}
          backupFilename={selectedBackup.filename}
          backupDate={formatDate(selectedBackup.createdAt)}
          onConfirm={handleRestore}
          isRestoring={isRestoring}
        />
      )}
    </div>
  );
}
