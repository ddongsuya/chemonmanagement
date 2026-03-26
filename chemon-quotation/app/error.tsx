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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FFF8F1]">
      <div className="text-center max-w-sm space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto shadow-ambient">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">ERROR</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">오류가 발생했습니다</h2>
          <p className="text-sm text-slate-500 mt-2">
            페이지를 불러오는 중 문제가 발생했습니다.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = '/dashboard'}
            className="rounded-xl font-bold text-slate-700 hover:bg-[#FAF2E9]"
          >
            대시보드로 이동
          </Button>
          <Button
            size="sm"
            onClick={reset}
            className="rounded-xl font-bold bg-gradient-to-r from-primary to-orange-400 text-white"
          >
            다시 시도
          </Button>
        </div>
      </div>
    </div>
  );
}
