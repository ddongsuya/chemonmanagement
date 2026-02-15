'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  PieChart,
  TrendingUp,
  FileText,
  Filter,
  Trophy,
  FlaskConical,
} from 'lucide-react';
import WonSign from '@/components/icons/WonSign';
import { Button } from '@/components/ui/button';
import ModalityChart from './ModalityChart';
import MonthlyTrendChart from './MonthlyTrendChart';
import RecentQuotations from './RecentQuotations';
import RevenueChart from './RevenueChart';
import PipelineFunnel from './PipelineFunnel';
import TeamLeaderboard from './TeamLeaderboard';
import StudyStatusWidget from './StudyStatusWidget';

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
    id: 'revenue',
    title: '매출 현황',
    icon: WonSign,
    color: 'bg-green-500',
    component: <RevenueChart />,
  },
  {
    id: 'pipeline',
    title: '파이프라인',
    icon: Filter,
    color: 'bg-indigo-500',
    component: <PipelineFunnel />,
  },
  {
    id: 'leaderboard',
    title: '영업 성과',
    icon: Trophy,
    color: 'bg-yellow-500',
    component: <TeamLeaderboard />,
  },
  {
    id: 'study',
    title: '시험 현황',
    icon: FlaskConical,
    color: 'bg-purple-500',
    component: <StudyStatusWidget />,
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
    <div className="space-y-3">
      {/* 탭 네비게이션 */}
      <div className="flex items-center justify-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrev}
          className="rounded-full h-8 w-8 flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {carouselItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = index === activeIndex;

            return (
              <button
                key={item.id}
                onClick={() => goToSlide(index)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 flex-shrink-0 text-sm',
                  isActive
                    ? 'bg-card shadow-soft font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="whitespace-nowrap">{item.title}</span>
              </button>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          className="rounded-full h-8 w-8 flex-shrink-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="relative overflow-hidden rounded-xl">
        <div
          className="flex transition-transform duration-400 ease-out"
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
      <div className="flex justify-center gap-1">
        {carouselItems.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              'h-1 rounded-full transition-all duration-200',
              index === activeIndex
                ? 'w-5 bg-primary'
                : 'w-1.5 bg-border hover:bg-muted-foreground/30'
            )}
          />
        ))}
      </div>
    </div>
  );
}
