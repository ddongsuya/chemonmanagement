'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Bell, BellOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// API 함수들
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
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    }),
  });
  return response.json();
}

async function unsubscribePush(token: string, endpoint: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/api/push/unsubscribe`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ endpoint }),
  });
  return response.json();
}

// URL-safe base64 to Uint8Array 변환
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

export default function PushNotificationSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [currentSubscription, setCurrentSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 토큰 가져오기
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken') || '';
    }
    return '';
  };

  // VAPID 공개 키 조회
  const { data: vapidData, isLoading: isLoadingVapid } = useQuery({
    queryKey: ['vapidPublicKey'],
    queryFn: getVapidPublicKey,
  });

  // 푸시 구독 상태 조회
  const { data: statusData, isLoading: isLoadingStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['pushStatus'],
    queryFn: () => getPushStatus(getToken()),
    enabled: !!getToken(),
  });

  // 브라우저 지원 여부 및 권한 확인
  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);

        // 현재 구독 확인
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setCurrentSubscription(subscription);
        } catch (error) {
          console.error('Failed to get subscription:', error);
        }
      }
    };

    checkSupport();
  }, []);

  // 푸시 알림 구독
  const handleSubscribe = async () => {
    if (!isSupported || !vapidData?.data?.publicKey) {
      toast({
        title: '오류',
        description: '푸시 알림을 지원하지 않는 환경입니다.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // 알림 권한 요청
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        toast({
          title: '권한 거부',
          description: '푸시 알림 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.',
          variant: 'destructive',
        });
        return;
      }

      // Service Worker 등록 확인
      const registration = await navigator.serviceWorker.ready;

      // 푸시 구독 생성
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidData.data.publicKey),
      });

      setCurrentSubscription(subscription);

      // 서버에 구독 정보 전송
      const result = await subscribePush(getToken(), subscription.toJSON());

      if (result.success) {
        toast({
          title: '구독 완료',
          description: '푸시 알림이 활성화되었습니다.',
        });
        refetchStatus();
      } else {
        throw new Error('서버 등록 실패');
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      toast({
        title: '오류',
        description: '푸시 알림 구독에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 푸시 알림 구독 해제
  const handleUnsubscribe = async () => {
    if (!currentSubscription) return;

    setIsLoading(true);
    try {
      // 브라우저 구독 해제
      await currentSubscription.unsubscribe();

      // 서버에서 구독 삭제
      await unsubscribePush(getToken(), currentSubscription.endpoint);

      setCurrentSubscription(null);
      toast({
        title: '구독 해제',
        description: '푸시 알림이 비활성화되었습니다.',
      });
      refetchStatus();
    } catch (error) {
      console.error('Unsubscribe error:', error);
      toast({
        title: '오류',
        description: '푸시 알림 구독 해제에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isSubscribed = !!currentSubscription || statusData?.data?.isSubscribed;
  const isConfigured = vapidData?.data?.isConfigured;

  if (isLoadingVapid || isLoadingStatus) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>설정을 불러오는 중...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          푸시 알림
        </CardTitle>
        <CardDescription>
          리드 등록, 견적서 상태 변경 등 중요한 알림을 실시간으로 받습니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 지원 여부 확인 */}
        {!isSupported && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              이 브라우저는 푸시 알림을 지원하지 않습니다.
              Chrome, Firefox, Edge 등 최신 브라우저를 사용해주세요.
            </AlertDescription>
          </Alert>
        )}

        {/* 서버 설정 확인 */}
        {isSupported && !isConfigured && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              푸시 알림 서버가 설정되지 않았습니다. 관리자에게 문의하세요.
            </AlertDescription>
          </Alert>
        )}

        {/* 권한 상태 */}
        {isSupported && isConfigured && (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>알림 권한</Label>
                <p className="text-sm text-muted-foreground">
                  브라우저 알림 권한 상태
                </p>
              </div>
              <Badge
                variant={
                  permission === 'granted'
                    ? 'default'
                    : permission === 'denied'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {permission === 'granted'
                  ? '허용됨'
                  : permission === 'denied'
                  ? '거부됨'
                  : '미설정'}
              </Badge>
            </div>

            {/* 구독 상태 */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>푸시 알림</Label>
                <p className="text-sm text-muted-foreground">
                  {isSubscribed
                    ? '푸시 알림이 활성화되어 있습니다'
                    : '푸시 알림을 활성화하면 중요한 알림을 실시간으로 받을 수 있습니다'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isSubscribed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <BellOff className="w-5 h-5 text-muted-foreground" />
                )}
                <Switch
                  checked={isSubscribed}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleSubscribe();
                    } else {
                      handleUnsubscribe();
                    }
                  }}
                  disabled={isLoading || permission === 'denied'}
                />
              </div>
            </div>

            {/* 권한 거부 시 안내 */}
            {permission === 'denied' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  알림 권한이 거부되었습니다. 브라우저 설정에서 이 사이트의 알림을 허용해주세요.
                </AlertDescription>
              </Alert>
            )}

            {/* 알림 종류 안내 */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">받을 수 있는 알림</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  새 리드 등록 알림
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  견적서 상태 변경 알림
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  계약 상태 변경 알림
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  백업 완료/실패 알림 (관리자)
                </li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
