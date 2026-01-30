'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Skeleton from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Megaphone,
  AlertTriangle,
  Info,
  Search,
  Eye,
  MessageSquare,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { getActiveAnnouncements, Announcement, AnnouncementPriority } from '@/lib/announcement-api';
import { cn } from '@/lib/utils';

// Priority badge styles
const priorityStyles: Record<AnnouncementPriority, { bg: string; text: string; label: string; icon: typeof Megaphone }> = {
  URGENT: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: '긴급', icon: AlertTriangle },
  HIGH: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', label: '중요', icon: AlertTriangle },
  NORMAL: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: '공지', icon: Megaphone },
  LOW: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', label: '안내', icon: Info },
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-orange-500" />
            공지사항
          </h1>
          <p className="text-gray-500 mt-1">
            회사 공지사항 및 안내사항을 확인하세요
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="제목 또는 내용 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Priority Filter */}
            <div className="flex gap-2">
              <Button
                variant={selectedPriority === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPriority('ALL')}
              >
                전체
              </Button>
              {(['URGENT', 'HIGH', 'NORMAL', 'LOW'] as AnnouncementPriority[]).map((priority) => {
                const style = priorityStyles[priority];
                return (
                  <Button
                    key={priority}
                    variant={selectedPriority === priority ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPriority(priority)}
                    className={selectedPriority === priority ? '' : cn(style.bg, style.text)}
                  >
                    {style.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Announcements List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {searchQuery || selectedPriority !== 'ALL'
                ? '검색 결과가 없습니다.'
                : '등록된 공지사항이 없습니다.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAnnouncements.map((announcement) => {
            const style = priorityStyles[announcement.priority];
            const Icon = style.icon;

            return (
              <Link key={announcement.id} href={`/announcements/${announcement.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      {/* Priority Icon */}
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                        style.bg
                      )}>
                        <Icon className={cn('w-5 h-5', style.text)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={cn(style.bg, style.text, 'border-0')}>
                            {style.label}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatRelativeTime(announcement.createdAt)}
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg group-hover:text-orange-500 transition-colors truncate">
                          {announcement.title}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                          {announcement.content}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
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
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-orange-500 transition-colors shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
