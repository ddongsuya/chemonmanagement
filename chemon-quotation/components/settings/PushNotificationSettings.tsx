'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StitchCard } from '@/components/ui/StitchCard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Bell, BellOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getVapidPublicKey(): Promise<{ success: boolean; data: { publicKey: string; isConfigured: boolean } }> {
  const response = await fetch(`${API_BASE}/api/push/vapid-public-key`);
  return response.json();
}

async function getPushStatus(token: string): Promise<{ success: boolean; data: { isSubscribed: boolean; subscriptionCount: number } }> {
  const response = await fetch(`${API_BASE}/api/push/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

async function subscribePush(token: string, subscription: PushSubscriptionJSON): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/api/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ endpoint: subscription.endpoint, keys: subscription.keys }),
  });
  return response.json();
}

async function unsubscribePush(token: string, endpoint: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/api/push/unsubscribe`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ endpoint }),
  });
  return response.json();
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
  return outputArray.buffer;
}

export default function PushNotificationSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [currentSubscription, setCurrentSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getToken = () => {
    if (typeof window !== 'undefined') { return localStorage.getItem('accessToken') || ''; }
    return '';
  };

  const { data: vapidData, isLoading: isLoadingVapid } = useQuery({
    queryKey: ['vapidPublicKey'], queryFn: getVapidPublicKey,
  });

  const { data: statusData, isLoading: isLoadingStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['pushStatus'], queryFn: () => getPushStatus(getToken()), enabled: !!getToken(),
  });

  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      setIsSupported(supported);
      if (supported) {
        setPermission(Notification.permission);
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setCurrentSubscription(subscription);
        } catch (error) { console.error('Failed to get subscription:', error); }
      }
    };
    checkSupport();
  }, []);

  const handleSubscribe = async () => {
    if (!isSupported || !vapidData?.data?.publicKey) {
      toast({ title: '오류', description: '푸시 알림을 지원하지 않는 환경입니다.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      if (permissionResult !== 'granted') {
        toast({ title: '권한 거부', description: '푸시 알림 권한이 거부되었습니다.', variant: 'destructive' });
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidData.data.publicKey),
      });
      setCurrentSubscription(subscription);
      const result = await subscribePush(getToken(), subscription.toJSON());
      if (result.success) {
        toast({ title: '구독 완료', description: '푸시 알림이 활성화되었습니다.' });
        refetchStatus();
      } else { throw new Error('서버 등록 실패'); }
    } catch (error) {
      console.error('Subscribe error:', error);
      toast({ title: '오류', description: '푸시 알림 구독에 실패했습니다.', variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const handleUnsubscribe = async () => {
    if (!currentSubscription) return;
    setIsLoading(true);
    try {
      await currentSubscription.unsubscribe();
      await unsubscribePush(getToken(), currentSubscription.endpoint);
      setCurrentSubscription(null);
      toast({ title: '구독 해제', description: '푸시 알림이 비활성화되었습니다.' });
      refetchStatus();
    } catch (error) {
      console.error('Unsubscribe error:', error);
      toast({ title: '오류', description: '푸시 알림 구독 해제에 실패했습니다.', variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const isSubscribed = !!currentSubscription || statusData?.data?.isSubscribed;
  const isConfigured = vapidData?.data?.isConfigured;

  if (isLoadingVapid || isLoadingStatus) {
    return (
      <StitchCard variant="surface-low">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>설정을 불러오는 중...</span>
        </div>
      </StitchCard>
    );
  }

  return (
    <StitchCard variant="surface-low">
      <div className="mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          푸시 알림
        </h2>
        <p className="text-sm text-slate-500">
          리드 등록, 견적서 상태 변경 등 중요한 알림을 실시간으로 받습니다
        </p>
      </div>
      <div className="space-y-6">
        {!isSupported && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              이 브라우저는 푸시 알림을 지원하지 않습니다. Chrome, Firefox, Edge 등 최신 브라우저를 사용해주세요.
            </AlertDescription>
          </Alert>
        )}

        {isSupported && !isConfigured && (
          <Alert className="rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              푸시 알림 서버가 설정되지 않았습니다. 관리자에게 문의하세요.
            </AlertDescription>
          </Alert>
        )}

        {isSupported && isConfigured && (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">알림 권한</label>
                <p className="text-sm text-slate-500">브라우저 알림 권한 상태</p>
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                permission === 'granted' ? 'bg-emerald-50 text-emerald-600'
                : permission === 'denied' ? 'bg-red-50 text-red-600'
                : 'bg-slate-100 text-slate-600'
              }`}>
                {permission === 'granted' ? '허용됨' : permission === 'denied' ? '거부됨' : '미설정'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">푸시 알림</label>
                <p className="text-sm text-slate-500">
                  {isSubscribed ? '푸시 알림이 활성화되어 있습니다' : '푸시 알림을 활성화하면 중요한 알림을 실시간으로 받을 수 있습니다'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isSubscribed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <BellOff className="w-5 h-5 text-slate-400" />
                )}
                <Switch
                  checked={isSubscribed}
                  onCheckedChange={(checked) => { if (checked) { handleSubscribe(); } else { handleUnsubscribe(); } }}
                  disabled={isLoading || permission === 'denied'}
                />
              </div>
            </div>

            {permission === 'denied' && (
              <Alert className="rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  알림 권한이 거부되었습니다. 브라우저 설정에서 이 사이트의 알림을 허용해주세요.
                </AlertDescription>
              </Alert>
            )}

            <div className="pt-4">
              <div className="h-px bg-[#EFE7DD] mb-4" />
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">받을 수 있는 알림</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" />새 리드 등록 알림</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" />견적서 상태 변경 알림</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" />계약 상태 변경 알림</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" />백업 완료/실패 알림 (관리자)</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </StitchCard>
  );
}
