'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Info, Megaphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore } from '@/stores/authStore';
import { getActiveAnnouncements, Announcement, AnnouncementPriority } from '@/lib/announcement-api';
import { cn } from '@/lib/utils';

interface AnnouncementModalProps {
  showOnLoad?: boolean;
}

export default function AnnouncementModal({ showOnLoad = true }: AnnouncementModalProps) {
  const { isAuthenticated } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch important announcements on mount
  useEffect(() => {
    if (!isAuthenticated || !showOnLoad) return;

    const fetchImportantAnnouncements = async () => {
      try {
        const response = await getActiveAnnouncements();
        if (response.success && response.data) {
          // Filter for HIGH and URGENT priority only
          const important = response.data.filter(
            (a) => a.priority === 'HIGH' || a.priority === 'URGENT'
          );

          // Check which ones haven't been seen in this session
          const seenKey = 'seen_announcements_session';
          const seenIds = new Set<string>();
          
          if (typeof window !== 'undefined') {
            const stored = sessionStorage.getItem(seenKey);
            if (stored) {
              try {
                JSON.parse(stored).forEach((id: string) => seenIds.add(id));
              } catch {
                // Ignore parse errors
              }
            }
          }

          const unseen = important.filter((a) => !seenIds.has(a.id));
          
          if (unseen.length > 0) {
            setAnnouncements(unseen);
            setIsOpen(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch announcements:', error);
      }
    };

    // Delay to allow page to load first
    const timer = setTimeout(fetchImportantAnnouncements, 1000);
    return () => clearTimeout(timer);
  }, [isAuthenticated, showOnLoad]);

  // Mark current announcement as seen when modal closes
  const handleClose = () => {
    if (announcements.length > 0) {
      const seenKey = 'seen_announcements_session';
      const seenIds: string[] = [];
      
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem(seenKey);
        if (stored) {
          try {
            seenIds.push(...JSON.parse(stored));
          } catch {
            // Ignore parse errors
          }
        }
        
        // Add all shown announcements to seen list
        announcements.forEach((a) => {
          if (!seenIds.includes(a.id)) {
            seenIds.push(a.id);
          }
        });
        
        sessionStorage.setItem(seenKey, JSON.stringify(seenIds));
      }
    }
    
    setIsOpen(false);
  };

  // Get priority styles
  const getPriorityStyles = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'URGENT':
        return {
          badge: 'destructive' as const,
          icon: AlertTriangle,
          label: '긴급',
          headerBg: 'bg-red-50 dark:bg-red-900/20',
          iconColor: 'text-red-500',
        };
      case 'HIGH':
        return {
          badge: 'default' as const,
          icon: AlertTriangle,
          label: '중요',
          headerBg: 'bg-orange-50 dark:bg-orange-900/20',
          iconColor: 'text-orange-500',
        };
      case 'NORMAL':
        return {
          badge: 'secondary' as const,
          icon: Megaphone,
          label: '공지',
          headerBg: 'bg-blue-50 dark:bg-blue-900/20',
          iconColor: 'text-blue-500',
        };
      case 'LOW':
        return {
          badge: 'outline' as const,
          icon: Info,
          label: '안내',
          headerBg: 'bg-gray-50 dark:bg-gray-900/20',
          iconColor: 'text-gray-500',
        };
      default:
        return {
          badge: 'secondary' as const,
          icon: Megaphone,
          label: '공지',
          headerBg: 'bg-blue-50 dark:bg-blue-900/20',
          iconColor: 'text-blue-500',
        };
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!isAuthenticated || announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];
  const styles = getPriorityStyles(currentAnnouncement.priority);
  const Icon = styles.icon;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <div className={cn('px-6 py-4', styles.headerBg)}>
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn('w-5 h-5', styles.iconColor)} />
              <Badge variant={styles.badge}>{styles.label}</Badge>
              {announcements.length > 1 && (
                <span className="text-xs text-gray-500 ml-auto">
                  {currentIndex + 1} / {announcements.length}
                </span>
              )}
            </div>
            <DialogTitle className="text-lg font-semibold">
              {currentAnnouncement.title}
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Content */}
        <ScrollArea className="max-h-[300px]">
          <div className="px-6 py-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {currentAnnouncement.content}
            </p>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              <span>게시일: {formatDate(currentAnnouncement.createdAt)}</span>
              {currentAnnouncement.creatorName && (
                <span className="ml-2">• 작성자: {currentAnnouncement.creatorName}</span>
              )}
            </div>
            <div className="flex gap-2">
              {announcements.length > 1 && currentIndex < announcements.length - 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                >
                  다음 공지
                </Button>
              )}
              <Button size="sm" onClick={handleClose}>
                확인
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
