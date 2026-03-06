'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="text-center max-w-sm space-y-4">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">페이지 오류</h2>
          <p className="text-sm text-muted-foreground mt-1">
            이 페이지를 불러오는 중 문제가 발생했습니다.
          </p>
          {error.message && process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-muted-foreground mt-2 font-mono bg-muted p-2 rounded">
              {error.message}
            </p>
          )}
        </div>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard'}>
            <Home className="w-4 h-4 mr-1" />
            대시보드
          </Button>
          <Button size="sm" onClick={reset}>
            <RefreshCw className="w-4 h-4 mr-1" />
            다시 시도
          </Button>
        </div>
      </div>
    </div>
  );
}
