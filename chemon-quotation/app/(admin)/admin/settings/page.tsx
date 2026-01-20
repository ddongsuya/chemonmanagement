'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Skeleton from '@/components/ui/Skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Settings,
  Shield,
  Mail,
  History,
  Save,
  RefreshCw,
  Database,
  Download,
  Trash2,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import {
  getSettings,
  updateSettings,
  getSettingsHistory,
  getBackups,
  createBackup,
  deleteBackup,
  SystemSettings,
  SettingChange,
  UpdateSettingsDTO,
  Backup,
} from '@/lib/admin-api';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const settingLabels: Record<string, string> = {
  allowRegistration: '회원가입 허용',
  sessionTimeout: '세션 만료 시간',
  maxLoginAttempts: '최대 로그인 시도',
  lockoutDuration: '계정 잠금 시간',
  smtpHost: 'SMTP 호스트',
  smtpPort: 'SMTP 포트',
  smtpUser: 'SMTP 사용자',
  smtpFrom: '발신자 이메일',
};

const backupStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  PENDING: { label: '대기중', variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
  IN_PROGRESS: { label: '진행중', variant: 'default', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  COMPLETED: { label: '완료', variant: 'outline', icon: <CheckCircle className="w-3 h-3 text-green-500" /> },
  FAILED: { label: '실패', variant: 'destructive', icon: <XCircle className="w-3 h-3" /> },
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [history, setHistory] = useState<SettingChange[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [formData, setFormData] = useState<SystemSettings>({
    allowRegistration: true,
    defaultUserRole: 'USER',
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpFrom: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsResponse, historyResponse, backupsResponse] = await Promise.all([
        getSettings(),
        getSettingsHistory(50),
        getBackups({ limit: 20 }),
      ]);

      if (settingsResponse.success && settingsResponse.data) {
        setSettings(settingsResponse.data);
        setFormData(settingsResponse.data);
      }

      if (historyResponse.success && historyResponse.data) {
        setHistory(historyResponse.data);
      }

      if (backupsResponse.success && backupsResponse.data) {
        setBackups(backupsResponse.data.data);
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '설정을 불러오는데 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: UpdateSettingsDTO = {
        allowRegistration: formData.allowRegistration,
        sessionTimeout: formData.sessionTimeout,
        maxLoginAttempts: formData.maxLoginAttempts,
        lockoutDuration: formData.lockoutDuration,
        smtpHost: formData.smtpHost,
        smtpPort: formData.smtpPort,
        smtpUser: formData.smtpUser,
        smtpFrom: formData.smtpFrom,
      };

      const response = await updateSettings(updateData);
      if (response.success && response.data) {
        setSettings(response.data);
        setFormData(response.data);
        setHasChanges(false);
        toast({
          title: '성공',
          description: '설정이 저장되었습니다',
        });
        // Refresh history
        const historyResponse = await getSettingsHistory(50);
        if (historyResponse.success && historyResponse.data) {
          setHistory(historyResponse.data);
        }
      } else {
        toast({
          title: '오류',
          description: response.error?.message || '설정 저장에 실패했습니다',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '설정 저장에 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (settings) {
      setFormData(settings);
      setHasChanges(false);
    }
  };

  const handleCreateBackup = async (type: 'FULL' | 'INCREMENTAL') => {
    setCreatingBackup(true);
    try {
      const response = await createBackup(type);
      if (response.success && response.data) {
        toast({
          title: '성공',
          description: '백업이 시작되었습니다',
        });
        // Refresh backups list
        const backupsResponse = await getBackups({ limit: 20 });
        if (backupsResponse.success && backupsResponse.data) {
          setBackups(backupsResponse.data.data);
        }
      } else {
        toast({
          title: '오류',
          description: response.error?.message || '백업 생성에 실패했습니다',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '백업 생성에 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDeleteBackup = async (id: string) => {
    try {
      const response = await deleteBackup(id);
      if (response.success) {
        toast({
          title: '성공',
          description: '백업이 삭제되었습니다',
        });
        setBackups((prev) => prev.filter((b) => b.id !== id));
      } else {
        toast({
          title: '오류',
          description: response.error?.message || '백업 삭제에 실패했습니다',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '백업 삭제에 실패했습니다',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">시스템 설정</h1>
          <p className="text-muted-foreground">시스템 설정을 관리합니다</p>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">시스템 설정</h1>
          <p className="text-muted-foreground">시스템 설정을 관리합니다</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
          {hasChanges && (
            <>
              <Button onClick={handleReset} variant="outline" size="sm">
                취소
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? '저장 중...' : '저장'}
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            일반
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            보안
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            이메일
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            백업
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            변경 이력
          </TabsTrigger>
        </TabsList>

        {/* 일반 설정 */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>일반 설정</CardTitle>
              <CardDescription>시스템의 기본 설정을 관리합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>회원가입 허용</Label>
                  <p className="text-sm text-muted-foreground">
                    새로운 사용자의 회원가입을 허용합니다
                  </p>
                </div>
                <Switch
                  checked={formData.allowRegistration}
                  onCheckedChange={(checked) =>
                    handleChange('allowRegistration', checked)
                  }
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">세션 만료 시간 (분)</Label>
                <p className="text-sm text-muted-foreground">
                  사용자 세션이 만료되는 시간을 설정합니다
                </p>
                <Input
                  id="sessionTimeout"
                  type="number"
                  min={1}
                  max={1440}
                  value={formData.sessionTimeout}
                  onChange={(e) =>
                    handleChange('sessionTimeout', parseInt(e.target.value) || 60)
                  }
                  className="w-32"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 보안 설정 */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>보안 설정</CardTitle>
              <CardDescription>로그인 및 계정 보안 설정을 관리합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">최대 로그인 시도 횟수</Label>
                <p className="text-sm text-muted-foreground">
                  계정 잠금 전 허용되는 로그인 실패 횟수입니다
                </p>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  min={1}
                  max={10}
                  value={formData.maxLoginAttempts}
                  onChange={(e) =>
                    handleChange('maxLoginAttempts', parseInt(e.target.value) || 5)
                  }
                  className="w-32"
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="lockoutDuration">계정 잠금 시간 (분)</Label>
                <p className="text-sm text-muted-foreground">
                  로그인 실패 시 계정이 잠기는 시간입니다
                </p>
                <Input
                  id="lockoutDuration"
                  type="number"
                  min={1}
                  max={1440}
                  value={formData.lockoutDuration}
                  onChange={(e) =>
                    handleChange('lockoutDuration', parseInt(e.target.value) || 15)
                  }
                  className="w-32"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 이메일 설정 */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>이메일 설정</CardTitle>
              <CardDescription>SMTP 서버 설정을 관리합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP 호스트</Label>
                  <Input
                    id="smtpHost"
                    value={formData.smtpHost}
                    onChange={(e) => handleChange('smtpHost', e.target.value)}
                    placeholder="smtp.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP 포트</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    min={1}
                    max={65535}
                    value={formData.smtpPort}
                    onChange={(e) =>
                      handleChange('smtpPort', parseInt(e.target.value) || 587)
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">SMTP 사용자</Label>
                  <Input
                    id="smtpUser"
                    value={formData.smtpUser}
                    onChange={(e) => handleChange('smtpUser', e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpFrom">발신자 이메일</Label>
                  <Input
                    id="smtpFrom"
                    type="email"
                    value={formData.smtpFrom}
                    onChange={(e) => handleChange('smtpFrom', e.target.value)}
                    placeholder="noreply@example.com"
                  />
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ SMTP 비밀번호는 보안상의 이유로 이 페이지에서 설정할 수 없습니다.
                  환경 변수를 통해 설정해주세요.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 백업 설정 */}
        <TabsContent value="backup">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>데이터베이스 백업</CardTitle>
                <CardDescription>시스템 데이터를 백업하고 관리합니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleCreateBackup('FULL')}
                    disabled={creatingBackup}
                  >
                    {creatingBackup ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    전체 백업
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCreateBackup('INCREMENTAL')}
                    disabled={creatingBackup}
                  >
                    {creatingBackup ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    증분 백업
                  </Button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    💡 전체 백업은 모든 데이터를 포함하며, 증분 백업은 마지막 백업 이후 변경된 데이터만 포함합니다.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>백업 목록</CardTitle>
                <CardDescription>생성된 백업 파일 목록입니다</CardDescription>
              </CardHeader>
              <CardContent>
                {backups.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>생성된 백업이 없습니다</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>파일명</TableHead>
                        <TableHead>유형</TableHead>
                        <TableHead>크기</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>생성일시</TableHead>
                        <TableHead className="text-right">작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {backups.map((backup) => {
                        const statusConfig = backupStatusConfig[backup.status];
                        return (
                          <TableRow key={backup.id}>
                            <TableCell className="font-medium">
                              {backup.filename}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {backup.type === 'FULL' ? '전체' : '증분'}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatFileSize(backup.size)}</TableCell>
                            <TableCell>
                              <Badge variant={statusConfig.variant} className="flex items-center gap-1 w-fit">
                                {statusConfig.icon}
                                {statusConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(backup.createdAt), 'yyyy-MM-dd HH:mm', {
                                locale: ko,
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {backup.status === 'COMPLETED' && (
                                  <Button variant="ghost" size="sm">
                                    <Download className="w-4 h-4" />
                                  </Button>
                                )}
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>백업 삭제</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        이 백업을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>취소</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteBackup(backup.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        삭제
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 변경 이력 */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>변경 이력</CardTitle>
              <CardDescription>최근 설정 변경 내역입니다</CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  변경 이력이 없습니다
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>설정 항목</TableHead>
                      <TableHead>이전 값</TableHead>
                      <TableHead>새 값</TableHead>
                      <TableHead>변경자</TableHead>
                      <TableHead>변경일시</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((change) => (
                      <TableRow key={change.id}>
                        <TableCell className="font-medium">
                          {settingLabels[change.key] || change.key}
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-1 py-0.5 rounded">
                            {change.oldValue || '-'}
                          </code>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-1 py-0.5 rounded">
                            {change.newValue}
                          </code>
                        </TableCell>
                        <TableCell>{change.changedBy}</TableCell>
                        <TableCell>
                          {format(new Date(change.changedAt), 'yyyy-MM-dd HH:mm', {
                            locale: ko,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
