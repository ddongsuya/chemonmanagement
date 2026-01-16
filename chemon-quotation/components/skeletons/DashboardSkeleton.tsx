import React from 'react';
import Skeleton from '../ui/Skeleton';

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 헤더 스켈레톤 */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* 통계 카드 스켈레톤 - 1행 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-12 w-12" circle />
            </div>
          </div>
        ))}
      </div>

      {/* 통계 카드 스켈레톤 - 2행 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-20" />
              </div>
              <Skeleton className="h-12 w-12" circle />
            </div>
          </div>
        ))}
      </div>

      {/* 차트 영역 스켈레톤 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 최근 견적 */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700 p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 파이 차트 */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700 p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="flex justify-center">
            <Skeleton className="h-48 w-48" circle />
          </div>
        </div>
      </div>

      {/* 라인 차트 스켈레톤 */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700 p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
};

export default DashboardSkeleton;
