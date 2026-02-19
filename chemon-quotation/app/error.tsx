'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="text-center max-w-sm space-y-4">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">오류가 발생했습니다</h2>
          <p className="text-sm text-muted-foreground mt-1">
            페이지를 불러오는 중 문제가 발생했습니다.
          </p>
        </div>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard'}>
            대시보드로 이동
          </Button>
          <Button size="sm" onClick={reset}>
            다시 시도
          </Button>
        </div>
      </div>
    </div>
  );
}
