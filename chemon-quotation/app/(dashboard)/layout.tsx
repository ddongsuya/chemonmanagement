'use client';

import { useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AnnouncementBanner, AnnouncementModal } from '@/components/announcement';
import { preloadMasterData } from '@/hooks/useMasterData';
import { useInactivityLogout } from '@/hooks/useInactivityLogout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 마스터데이터 프리로드
  useEffect(() => {
    preloadMasterData();
  }, []);

  // 30분 비활동 시 자동 로그아웃
  useInactivityLogout();

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        {/* 사이드바 */}
        <Sidebar />

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 공지사항 배너 */}
          <AnnouncementBanner />

          {/* 헤더 */}
          <Header />

          {/* 페이지 콘텐츠 */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
            {children}
          </main>
        </div>

        {/* 모바일 하단 네비게이션 */}
        <MobileBottomNav />

        {/* 중요 공지사항 모달 */}
        <AnnouncementModal />
      </div>
    </ProtectedRoute>
  );
}
