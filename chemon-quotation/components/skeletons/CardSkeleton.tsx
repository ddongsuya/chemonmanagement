import React from 'react';
import Skeleton from '../ui/Skeleton';

interface CardSkeletonProps {
  lines?: number;
  showImage?: boolean;
}

const CardSkeleton: React.FC<CardSkeletonProps> = ({
  lines = 3,
  showImage = false,
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700 p-6">
      {showImage && <Skeleton className="h-40 w-full mb-4" />}
      <Skeleton className="h-6 w-3/4 mb-4" />
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4"
            width={i === lines - 1 ? '60%' : '100%'}
          />
        ))}
      </div>
    </div>
  );
};

export default CardSkeleton;
