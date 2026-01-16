'use client';

import { CalendarEvent } from '@/types/customer';
import { cn } from '@/lib/utils';
import {
  Users,
  FileText,
  Clock,
  Bell,
  Calendar,
} from 'lucide-react';

interface EventCardProps {
  event: CalendarEvent;
  compact?: boolean;
  onClick?: () => void;
}

// 이벤트 유형별 색상 및 아이콘
const EVENT_TYPE_CONFIG: Record<
  CalendarEvent['type'],
  { color: string; bgColor: string; icon: React.ElementType; label: string }
> = {
  meeting: {
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/50',
    icon: Users,
    label: '미팅',
  },
  invoice: {
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/50',
    icon: FileText,
    label: '세금계산서',
  },
  deadline: {
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100 dark:bg-orange-900/50',
    icon: Clock,
    label: '마감',
  },
  reminder: {
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100 dark:bg-purple-900/50',
    icon: Bell,
    label: '알림',
  },
  other: {
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    icon: Calendar,
    label: '기타',
  },
};

export default function EventCard({ event, compact = false, onClick }: EventCardProps) {
  const config = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG.other;
  const Icon = config.icon;

  // 커스텀 색상이 있으면 사용
  const customStyle = event.color
    ? { backgroundColor: event.color + '20', borderLeftColor: event.color }
    : {};

  if (compact) {
    // 컴팩트 모드 (월간 뷰에서 사용)
    return (
      <div
        className={cn(
          'event-card px-1.5 py-0.5 rounded text-xs truncate cursor-pointer',
          'hover:opacity-80 transition-opacity',
          event.color ? '' : config.bgColor,
          event.color ? '' : config.color
        )}
        style={event.color ? { backgroundColor: event.color + '30', color: event.color } : {}}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        title={event.title}
      >
        {event.title}
      </div>
    );
  }

  // 상세 모드
  return (
    <div
      className={cn(
        'event-card p-3 rounded-lg border-l-4 cursor-pointer',
        'hover:shadow-md transition-shadow',
        event.color ? '' : config.bgColor
      )}
      style={
        event.color
          ? { backgroundColor: event.color + '15', borderLeftColor: event.color }
          : { borderLeftColor: 'currentColor' }
      }
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <Icon
          className={cn('w-4 h-4 mt-0.5 flex-shrink-0', event.color ? '' : config.color)}
          style={event.color ? { color: event.color } : {}}
        />
        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              'font-medium text-sm truncate',
              event.color ? '' : config.color
            )}
            style={event.color ? { color: event.color } : {}}
          >
            {event.title}
          </h4>
          {event.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {event.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span className={cn('px-1.5 py-0.5 rounded', config.bgColor, config.color)}>
              {config.label}
            </span>
            {!event.all_day && (
              <span>
                {new Date(event.start_date).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
            {event.all_day && <span>종일</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
