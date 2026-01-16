'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Key, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { changePassword } from '@/lib/auth-api';
import UserCodeSetting from './UserCodeSetting';

const USER_SETTINGS_KEY = 'chemon_user_settings';

interface LocalSettings {
  user_code: string;
  next_quotation_seq: number;
}

const defaultLocalSettings: LocalSettings = {
  user_code: 'DL',
  next_quotation_seq: 1,
};

export default function ProfileSettings() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [localSettings, setLocalSettings] = useState<LocalSettings>(defaultLocalSettings);

  // 비밀번호 변경 데이터
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [passwordError, setPasswordError] = useState('');

  // localStorage에서 로컬 설정 로드
  useEffect(() => {
    const saved = localStorage.getItem(USER_SETTINGS_KEY);
    if (saved) {
      try {
        setLocalSettings({ ...defaultLocalSettings, ...JSON.parse(saved) });
      } catch {
        setLocalSettings(defaultLocalSettings);
      }
    }
  }, []);

  // 견적서 코드 저장
  const handleSaveUserCode = (code: string) => {
    const updated = { ...localSettings, user_code: code };
    setLocalSettings(updated);
    localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(updated));
  };

  // 비밀번호 변경
  const handleChangePassword = async () => {
    setPasswordError('');
    
    if (passwordData.new.length < 8) {
      setPasswordError('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    
    if (passwordData.new !== passwordData.confirm) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await changePassword({
        oldPassword: passwordData.current,
        newPassword: passwordData.new,
      });

      if (response.success) {
        setShowPasswordDialog(false);
        setPasswordData({ current: '', new: '', confirm: '' });
        toast({
          title: '변경 완료',
          description: '비밀번호가 변경되었습니다.',
        });
      } else {
        setPasswordError(response.error?.message || '비밀번호 변경에 실패했습니다.');
      }
    } catch (error) {
      setPasswordError('서버 연결에 실패했습니다.');
    } finally {
      setChangingPassword(false);
    }
  };

  const userName = user?.name || '사용자';
  const userEmail = user?.email || '';
  const userPhone = user?.phone || '';
  const userDepartment = user?.department || '';
  const userPosition = user?.position || '';
  const userRole = user?.role || 'USER';

  return (
    <div className="space-y-6">
      {/* 프로필 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>프로필 정보</CardTitle>
          <CardDescription>회원가입 시 입력한 정보입니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 아바타 */}
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="text-2xl bg-primary text-white">
                {userName.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{userName}</h3>
                <Badge variant={userRole === 'ADMIN' ? 'default' : 'secondary'}>
                  {userRole === 'ADMIN' ? (
                    <>
                      <Shield className="w-3 h-3 mr-1" />
                      관리자
                    </>
                  ) : '사용자'}
                </Badge>
              </div>
              <p className="text-gray-500">{userEmail}</p>
              {userDepartment && userPosition && (
                <p className="text-gray-500 text-sm">
                  {userDepartment} {userPosition}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* 계정 정보 (읽기 전용) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>이름</Label>
              <Input value={userName} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label>이메일</Label>
              <Input value={userEmail} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label>연락처</Label>
              <Input value={userPhone} disabled className="bg-gray-50" placeholder="미입력" />
            </div>
            <div className="space-y-2">
              <Label>부서</Label>
              <Input value={userDepartment} disabled className="bg-gray-50" placeholder="미입력" />
            </div>
            <div className="space-y-2">
              <Label>직책</Label>
              <Input value={userPosition} disabled className="bg-gray-50" placeholder="미입력" />
            </div>
          </div>
          <p className="text-xs text-gray-400">프로필 정보 변경은 관리자에게 문의하세요</p>
        </CardContent>
      </Card>

      {/* 견적서 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>견적서 설정</CardTitle>
          <CardDescription>
            견적번호에 사용될 개인 코드를 설정합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserCodeSetting
            currentCode={localSettings.user_code}
            currentSeq={localSettings.next_quotation_seq}
            onSave={handleSaveUserCode}
          />
        </CardContent>
      </Card>

      {/* 비밀번호 변경 */}
      <Card>
        <CardHeader>
          <CardTitle>보안</CardTitle>
          <CardDescription>비밀번호를 변경합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={showPasswordDialog} onOpenChange={(open) => {
            setShowPasswordDialog(open);
            if (!open) {
              setPasswordData({ current: '', new: '', confirm: '' });
              setPasswordError('');
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Key className="w-4 h-4 mr-2" />
                비밀번호 변경
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>비밀번호 변경</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {passwordError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {passwordError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>현재 비밀번호</Label>
                  <Input
                    type="password"
                    value={passwordData.current}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        current: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>새 비밀번호</Label>
                  <Input
                    type="password"
                    value={passwordData.new}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, new: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-400">8자 이상 입력해주세요</p>
                </div>
                <div className="space-y-2">
                  <Label>새 비밀번호 확인</Label>
                  <Input
                    type="password"
                    value={passwordData.confirm}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirm: e.target.value,
                      })
                    }
                  />
                </div>
                <Button 
                  onClick={handleChangePassword} 
                  className="w-full"
                  disabled={changingPassword}
                >
                  {changingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  변경하기
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
