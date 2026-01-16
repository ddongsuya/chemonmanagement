'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  PieChart,
  TrendingUp,
  FileText,
  BarChart3,
} from 'lucide-react';
import ModalityChart from './ModalityChart';
import MonthlyTrendChart from './MonthlyTrendChart';
import RecentQuotations from './RecentQuotations';

interface CarouselItem {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  component: React.ReactNode;
}

const carouselItems: CarouselItem[] = [
  {
    id: 'modality',
    title: '모달리티별 분포',
    icon: PieChart,
    color: 'bg-blue-500',
    component: <ModalityChart />,
  },
  {
    id: 'trend',
    title: '월별 추이',
    icon: TrendingUp,
    color: 'bg-emerald-500',
    component: <MonthlyTrendChart />,
  },
  {
    id: 'recent',
    title: '최근 견적서',
    icon: FileText,
    color: 'bg-pink-500',
    component: <RecentQuotations />,
  },
];

export default function DashboardCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  const goToPrev = () => {
    setActiveIndex((prev) =>
      prev === 0 ? carouselItems.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setActiveIndex((prev) =>
      prev === carouselItems.length - 1 ? 0 : prev + 1
    );
  };

  const goToSlide = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="space-y-4">
      {/* 탭 네비게이션 - 큰 아이콘 스타일 */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrev}
          className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-3">
          {carouselItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = index === activeIndex;

            return (
              <button
                key={item.id}
                onClick={() => goToSlide(index)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300',
                  isActive
                    ? 'bg-white dark:bg-slate-800 shadow-soft-lg scale-110'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 opacity-60 hover:opacity-100'
                )}
              >
                <div
                  className={cn(
                    'w-14 h-14 rounded-xl flex items-center justify-center transition-all',
                    isActive ? item.color : 'bg-slate-200 dark:bg-slate-700'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-7 h-7',
                      isActive ? 'text-white' : 'text-slate-500'
                    )}
                  />
                </div>
                <span
                  className={cn(
                    'text-xs font-medium whitespace-nowrap',
                    isActive
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-500'
                  )}
                >
                  {item.title}
                </span>
              </button>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="relative overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {carouselItems.map((item) => (
            <div key={item.id} className="w-full flex-shrink-0">
              {item.component}
            </div>
          ))}
        </div>
      </div>

      {/* 인디케이터 */}
      <div className="flex justify-center gap-2">
        {carouselItems.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              index === activeIndex
                ? 'w-8 bg-blue-500'
                : 'w-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'
            )}
          />
        ))}
      </div>
    </div>
  );
}
