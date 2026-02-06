'use client';

import { Loader2, CheckCircle2, XCircle, Download, RotateCcw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export type BackupProgressStatus = 'idle' | 'creating' | 'restoring' | 'downloading' | 'completed' | 'failed';

interface BackupProgressProps {
  status: BackupProgressStatus;
  progress?: number;
  message?: string;
  className?: string;
}

/**
 * 백업/복구 진행 상태 표시 컴포넌트
 * Requirements: 1.2.2 - 백업 진행 상태 표시 (진행률 또는 스피너)
 */
export default function BackupProgress({
  status,
  progress = 0,
  message,
  className,
}: BackupProgressProps) {
  if (status === 'idle') {
    return null;
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'creating':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'restoring':
        return <RotateCcw className="h-5 w-5 animate-spin text-orange-500" />;
      case 'downloading':
        return <Download className="h-5 w-5 animate-bounce text-green-500" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    if (message) return message;
    
    switch (status) {
      case 'creating':
        return '백업 생성 중...';
      case 'restoring':
        return '데이터 복구 중...';
      case 'downloading':
        return '다운로드 준비 중...';
      case 'completed':
        return '완료되었습니다';
      case 'failed':
        return '작업에 실패했습니다';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'creating':
        return 'bg-blue-50 border-blue-200';
      case 'restoring':
        return 'bg-orange-50 border-orange-200';
      case 'downloading':
        return 'bg-green-50 border-green-200';
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const showProgress = ['creating', 'restoring', 'downloading'].includes(status) && progress > 0;

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-all duration-300',
        getStatusColor(),
        className
      )}
    >
      <div className="flex items-center gap-3">
        {getStatusIcon()}
        <div className="flex-1">
          <p className="text-sm font-medium">{getStatusText()}</p>
          {showProgress && (
            <div className="mt-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{progress}% 완료</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
