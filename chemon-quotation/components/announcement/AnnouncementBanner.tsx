'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, AlertTriangle, Info, Megaphone, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { getActiveAnnouncements, Announcement, AnnouncementPriority } from '@/lib/announcement-api';
import { cn } from '@/lib/utils';

interface AnnouncementBannerProps {
  className?: string;
}

export default function AnnouncementBanner({ className }: AnnouncementBannerProps) {
  const { isAuthenticated } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load dismissed announcements from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dismissed_announcements');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setDismissedIds(new Set(parsed));
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, []);

  // Fetch active announcements
  const fetchAnnouncements = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await getActiveAnnouncements();
      if (response.success && response.data) {
        // Filter out dismissed announcements (except URGENT ones)
        const filtered = response.data.filter(
          (a) => a.priority === 'URGENT' || !dismissedIds.has(a.id)
        );
        setAnnouncements(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, dismissedIds]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Auto-rotate announcements every 5 seconds
  useEffect(() => {
    if (announcements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [announcements.length]);

  // Handle dismiss
  const handleDismiss = (id: string) => {
    const newDismissed = new Set(dismissedIds);
    newDismissed.add(id);
    setDismissedIds(newDismissed);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('dismissed_announcements', JSON.stringify(Array.from(newDismissed)));
    }

    // Remove from current list
    const newAnnouncements = announcements.filter((a) => a.id !== id);
    setAnnouncements(newAnnouncements);
    
    // Adjust current index if needed
    if (currentIndex >= newAnnouncements.length) {
      setCurrentIndex(Math.max(0, newAnnouncements.length - 1));
    }
  };

  // Navigate to previous/next announcement
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  // Get priority styles
  const getPriorityStyles = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'URGENT':
        return {
          bg: 'bg-red-500 dark:bg-red-600',
          text: 'text-white',
          icon: AlertTriangle,
          label: '긴급',
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-500 dark:bg-orange-600',
          text: 'text-white',
          icon: AlertTriangle,
          label: '중요',
        };
      case 'NORMAL':
        return {
          bg: 'bg-blue-500 dark:bg-blue-600',
          text: 'text-white',
          icon: Megaphone,
          label: '공지',
        };
      case 'LOW':
        return {
          bg: 'bg-gray-500 dark:bg-gray-600',
          text: 'text-white',
          icon: Info,
          label: '안내',
        };
      default:
        return {
          bg: 'bg-blue-500 dark:bg-blue-600',
          text: 'text-white',
          icon: Megaphone,
          label: '공지',
        };
    }
  };

  if (isLoading || !isAuthenticated || announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];
  const styles = getPriorityStyles(currentAnnouncement.priority);
  const Icon = styles.icon;

  return (
    <div
      className={cn(
        'relative flex items-center justify-between px-4 py-2',
        styles.bg,
        styles.text,
        className
      )}
    >
      {/* Navigation - Previous */}
      {announcements.length > 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-white/80 hover:text-white hover:bg-white/10"
          onClick={goToPrevious}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center gap-2 min-w-0 px-2">
        <Icon className="w-4 h-4 shrink-0" />
        <span className="text-xs font-semibold px-1.5 py-0.5 bg-white/20 rounded">
          {styles.label}
        </span>
        <span className="text-sm font-medium truncate">
          {currentAnnouncement.title}
        </span>
        {currentAnnouncement.content && (
          <span className="text-sm opacity-90 truncate hidden sm:inline">
            - {currentAnnouncement.content.substring(0, 50)}
            {currentAnnouncement.content.length > 50 ? '...' : ''}
          </span>
        )}
      </div>

      {/* Navigation - Next & Pagination */}
      <div className="flex items-center gap-2 shrink-0">
        {announcements.length > 1 && (
          <>
            <span className="text-xs opacity-75">
              {currentIndex + 1} / {announcements.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/80 hover:text-white hover:bg-white/10"
              onClick={goToNext}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}

        {/* Dismiss button (not for URGENT) */}
        {currentAnnouncement.priority !== 'URGENT' && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => handleDismiss(currentAnnouncement.id)}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
