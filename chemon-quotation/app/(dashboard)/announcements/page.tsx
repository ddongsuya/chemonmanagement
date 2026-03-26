'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { StitchCard } from '@/components/ui/StitchCard';
import { StitchBadge } from '@/components/ui/StitchBadge';
import { StitchInput } from '@/components/ui/StitchInput';
import { StitchPageHeader } from '@/components/ui/StitchPageHeader';
import Skeleton from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Megaphone,
  AlertTriangle,
  Info,
  Search,
  Eye,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { getActiveAnnouncements, Announcement, AnnouncementPriority } from '@/lib/announcement-api';
import { cn } from '@/lib/utils';

// Priority badge styles (Stitch-compatible)
const priorityStyles: Record<AnnouncementPriority, { bg: string; text: string; label: string; icon: typeof Megaphone; variant: 'error' | 'warning' | 'info' | 'neutral' }> = {
  URGENT: { bg: 'bg-red-50', text: 'text-red-600', label: '긴급', icon: AlertTriangle, variant: 'error' },
  HIGH: { bg: 'bg-orange-50', text: 'text-orange-600', label: '중요', icon: AlertTriangle, variant: 'warning' },
  NORMAL: { bg: 'bg-blue-50', text: 'text-blue-600', label: '공지', icon: Megaphone, variant: 'info' },
  LOW: { bg: 'bg-slate-100', text: 'text-slate-600', label: '안내', icon: Info, variant: 'neutral' },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  return formatDate(dateString);
}

export default function AnnouncementsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<AnnouncementPriority | 'ALL'>('ALL');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    filterAnnouncements();
  }, [announcements, searchQuery, selectedPriority]);

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      const response = await getActiveAnnouncements();
      if (response.success && response.data) {
        setAnnouncements(response.data);
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '공지사항을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAnnouncements = () => {
    let filtered = [...announcements];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.content.toLowerCase().includes(query)
      );
    }

    if (selectedPriority !== 'ALL') {
      filtered = filtered.filter((a) => a.priority === selectedPriority);
    }

    setFilteredAnnouncements(filtered);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <StitchPageHeader
        label="ANNOUNCEMENTS"
        title="공지사항"
        description="회사 공지사항 및 안내사항을 확인하세요"
      />

      {/* Filters */}
      <StitchCard variant="surface-low" padding="md">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <StitchInput
              placeholder="제목 또는 내용 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Priority Filter */}
          <div className="flex gap-2">
            <Button
              variant={selectedPriority === 'ALL' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedPriority('ALL')}
              className={selectedPriority === 'ALL' ? 'bg-gradient-to-r from-primary to-orange-400 rounded-xl font-bold' : 'rounded-xl font-bold'}
            >
              전체
            </Button>
            {(['URGENT', 'HIGH', 'NORMAL', 'LOW'] as AnnouncementPriority[]).map((priority) => {
              const style = priorityStyles[priority];
              return (
                <Button
                  key={priority}
                  variant={selectedPriority === priority ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedPriority(priority)}
                  className={selectedPriority === priority
                    ? 'bg-gradient-to-r from-primary to-orange-400 rounded-xl font-bold'
                    : cn('rounded-xl font-bold', style.bg, style.text)}
                >
                  {style.label}
                </Button>
              );
            })}
          </div>
        </div>
      </StitchCard>

      {/* Announcements List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <StitchCard key={i} variant="elevated" padding="md">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </StitchCard>
          ))}
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <StitchCard variant="surface-low" padding="lg">
          <div className="py-6 text-center">
            <Megaphone className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">
              {searchQuery || selectedPriority !== 'ALL'
                ? '검색 결과가 없습니다.'
                : '등록된 공지사항이 없습니다.'}
            </p>
          </div>
        </StitchCard>
      ) : (
        <div className="space-y-3">
          {filteredAnnouncements.map((announcement) => {
            const style = priorityStyles[announcement.priority];
            const Icon = style.icon;

            return (
              <Link key={announcement.id} href={`/announcements/${announcement.id}`}>
                <StitchCard variant="elevated" padding="md" hover className="cursor-pointer group">
                  <div className="flex items-start gap-4">
                    {/* Priority Icon */}
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      style.bg
                    )}>
                      <Icon className={cn('w-5 h-5', style.text)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StitchBadge variant={style.variant}>
                          {style.label}
                        </StitchBadge>
                        <span className="text-xs text-slate-400">
                          {formatRelativeTime(announcement.createdAt)}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors truncate">
                        {announcement.title}
                      </h3>
                      <p className="text-slate-500 text-sm mt-1 line-clamp-2">
                        {announcement.content}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {announcement.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(announcement.startDate)} ~ {formatDate(announcement.endDate)}
                        </span>
                        {announcement.creatorName && (
                          <span>작성자: {announcement.creatorName}</span>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors shrink-0" />
                  </div>
                </StitchCard>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
