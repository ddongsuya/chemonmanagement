'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StitchCard } from '@/components/ui/StitchCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Key, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { changePassword } from '@/lib/auth-api';
import { getUserSettings, updateUserSettings } from '@/lib/package-api';
import UserCodeSetting from './UserCodeSetting';
import PushNotificationSettings from './PushNotificationSettings';

export default function ProfileSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [userCode, setUserCode] = useState('DL');

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [passwordError, setPasswordError] = useState('');

  const { data: settingsResponse, isLoading } = useQuery({
    queryKey: ['userSettings'],
    queryFn: getUserSettings,
  });

  useEffect(() => {
    if (settingsResponse?.data?.userCode) {
      setUserCode(settingsResponse.data.userCode);
    }
  }, [settingsResponse]);

  const saveCodeMutation = useMutation({
    mutationFn: (code: string) => updateUserSettings({ userCode: code }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
      toast({ title: '저장 완료', description: '견적서 코드가 저장되었습니다.' });
    },
    onError: () => {
      toast({ title: '오류', description: '코드 저장에 실패했습니다.', variant: 'destructive' });
    },
  });

  const handleSaveUserCode = (code: string) => {
    setUserCode(code);
    saveCodeMutation.mutate(code);
  };

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
        toast({ title: '변경 완료', description: '비밀번호가 변경되었습니다.' });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>설정을 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 프로필 정보 */}
      <StitchCard variant="surface-low">
        <div className="mb-4">
          <h2 className="text-xl font-bold">프로필 정보</h2>
          <p className="text-sm text-slate-500">회원가입 시 입력한 정보입니다</p>
        </div>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="text-2xl bg-primary text-white">
                {userName.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{userName}</h3>
                <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${userRole === 'ADMIN' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'}`}>
                  {userRole === 'ADMIN' ? (
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" />관리자</span>
                  ) : '사용자'}
                </span>
              </div>
              <p className="text-slate-500">{userEmail}</p>
              {userDepartment && userPosition && (
                <p className="text-slate-500 text-sm">{userDepartment} {userPosition}</p>
              )}
            </div>
          </div>

          <div className="h-px bg-[#EFE7DD]" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">이름</label>
              <Input value={userName} disabled className="bg-[#F5EDE3] border-none rounded-xl" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">이메일</label>
              <Input value={userEmail} disabled className="bg-[#F5EDE3] border-none rounded-xl" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">연락처</label>
              <Input value={userPhone} disabled placeholder="미입력" className="bg-[#F5EDE3] border-none rounded-xl" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">부서</label>
              <Input value={userDepartment} disabled placeholder="미입력" className="bg-[#F5EDE3] border-none rounded-xl" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">직책</label>
              <Input value={userPosition} disabled placeholder="미입력" className="bg-[#F5EDE3] border-none rounded-xl" />
            </div>
          </div>
          <p className="text-xs text-slate-400">프로필 정보 변경은 관리자에게 문의하세요</p>
        </div>
      </StitchCard>

      {/* 견적서 설정 */}
      <StitchCard variant="surface-low">
        <div className="mb-4">
          <h2 className="text-xl font-bold">견적서 설정</h2>
          <p className="text-sm text-slate-500">견적번호에 사용될 개인 코드를 설정합니다</p>
        </div>
        <UserCodeSetting currentCode={userCode} currentSeq={1} onSave={handleSaveUserCode} />
      </StitchCard>

      {/* 비밀번호 변경 */}
      <StitchCard variant="surface-low">
        <div className="mb-4">
          <h2 className="text-xl font-bold">보안</h2>
          <p className="text-sm text-slate-500">비밀번호를 변경합니다</p>
        </div>
        <Dialog open={showPasswordDialog} onOpenChange={(open) => {
          setShowPasswordDialog(open);
          if (!open) { setPasswordData({ current: '', new: '', confirm: '' }); setPasswordError(''); }
        }}>
          <DialogTrigger asChild>
            <Button variant="outline" className="rounded-xl">
              <Key className="w-4 h-4 mr-2" />
              비밀번호 변경
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#E9E1D8] rounded-xl">
            <DialogHeader>
              <DialogTitle>비밀번호 변경</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {passwordError && (
                <div className="p-3 bg-red-50 rounded-xl text-red-600 text-sm">{passwordError}</div>
              )}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">현재 비밀번호</label>
                <Input type="password" value={passwordData.current} onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })} className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">새 비밀번호</label>
                <Input type="password" value={passwordData.new} onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })} className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" />
                <p className="text-xs text-slate-400">8자 이상 입력해주세요</p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">새 비밀번호 확인</label>
                <Input type="password" value={passwordData.confirm} onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })} className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" />
              </div>
              <Button onClick={handleChangePassword} className="w-full rounded-xl" disabled={changingPassword}>
                {changingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                변경하기
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </StitchCard>

      {/* 푸시 알림 설정 */}
      <PushNotificationSettings />
    </div>
  );
}
