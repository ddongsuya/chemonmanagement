'use client';

import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { syncPendingActions, getPendingActions } from '@/lib/offline-cache';
import { Button } from '@/components/ui/button';

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: number; failed: number } | null>(null);

  useEffect(() => {
    // 초기 상태 설정
    setIsOnline(navigator.onLine);

    // 온라인/오프라인 이벤트 리스너
    const handleOnline = () => {
      setIsOnline(true);
      // 온라인 복귀 시 자동 동기화
      handleSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncResult(null);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 펜딩 액션 수 확인
    checkPendingActions();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkPendingActions = async () => {
    try {
      const actions = await getPendingActions();
      setPendingCount(actions.length);
    } catch (error) {
      console.error('Failed to check pending actions:', error);
    }
  };

  const handleSync = async () => {
    if (isSyncing || !isOnline) return;

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const result = await syncPendingActions();
      setSyncResult(result);
      await checkPendingActions();

      // 3초 후 결과 메시지 숨기기
      setTimeout(() => {
        setSyncResult(null);
      }, 3000);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // 온라인이고 펜딩 액션이 없으면 표시하지 않음
  if (isOnline && pendingCount === 0 && !syncResult) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        !isOnline ? 'bg-yellow-500 text-yellow-950' : 
        syncResult ? (syncResult.failed > 0 ? 'bg-orange-500 text-orange-950' : 'bg-green-500 text-green-950') :
        'bg-blue-500 text-blue-950',
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-2 text-sm font-medium">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <>
              <WifiOff className="h-4 w-4" />
              <span>오프라인 모드</span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-yellow-600/20 text-xs">
                  {pendingCount}개 대기 중
                </span>
              )}
            </>
          ) : syncResult ? (
            <>
              {syncResult.failed > 0 ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              <span>
                {syncResult.success}개 동기화 완료
                {syncResult.failed > 0 && `, ${syncResult.failed}개 실패`}
              </span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>{pendingCount}개 동기화 대기 중</span>
            </>
          )}
        </div>

        {isOnline && pendingCount > 0 && !syncResult && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
            className="h-7 px-2 text-xs hover:bg-white/20"
          >
            {isSyncing ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              '동기화'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// 네트워크 상태 훅
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
