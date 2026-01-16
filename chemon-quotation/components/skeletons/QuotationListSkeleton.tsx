import React from 'react';
import Skeleton from '../ui/Skeleton';

const QuotationListSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700 p-6">
      {/* 필터 스켈레톤 */}
      <div className="flex gap-3 mb-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 flex-1 max-w-xs" />
      </div>

      {/* 테이블 헤더 스켈레톤 */}
      <div className="flex items-center gap-4 p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-32 flex-1" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* 테이블 행 스켈레톤 */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 border-b dark:border-gray-700"
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-40 flex-1" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}

      {/* 페이지네이션 스켈레톤 */}
      <div className="flex items-center justify-between mt-4 pt-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-1">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
};

export default QuotationListSkeleton;
