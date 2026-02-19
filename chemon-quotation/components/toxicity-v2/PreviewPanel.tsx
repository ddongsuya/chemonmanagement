'use client';

import { useState, useEffect } from 'react';
import { useToxicityV2Store } from '@/stores/toxicityV2Store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import PreviewCover from './PreviewCover';
import PreviewQuote from './PreviewQuote';
import PreviewDetail from './PreviewDetail';

/** 탭 정의 */
const TABS = [
  { value: 'cover', label: '표지' },
  { value: 'quote', label: '견적서' },
  { value: 'detail', label: '상세내역' },
  { value: 'all', label: '전체' },
] as const;

export default function PreviewPanel() {
  const { previewTab, setPreviewTab } = useToxicityV2Store();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // 반응형: 1024px 미만 감지
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      if (!e.matches) setMobileOpen(false);
    };
    handler(mql);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // 모바일: 토글 버튼 + 패널
  if (isMobile) {
    return (
      <>
        {/* 미리보기 토글 버튼 */}
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-40 shadow-lg lg:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? '닫기' : '미리보기'}
        </Button>

        {/* 모바일 패널 (하단 슬라이드) */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-black/40 lg:hidden">
            {/* 배경 클릭으로 닫기 */}
            <div className="flex-1" onClick={() => setMobileOpen(false)} />

            {/* 패널 */}
            <div className="bg-white rounded-t-xl max-h-[85vh] flex flex-col shadow-xl">
              {/* 헤더 */}
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <span className="font-semibold text-sm">미리보기</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    인쇄
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    PDF
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setMobileOpen(false)}>
                    ✕
                  </Button>
                </div>
              </div>

              {/* 탭 + 콘텐츠 */}
              <PreviewTabs previewTab={previewTab} setPreviewTab={setPreviewTab} />
            </div>
          </div>
        )}
      </>
    );
  }

  // 데스크톱: 우측 패널
  return (
    <div className="flex flex-col h-full border-l border-gray-200 bg-gray-50">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <span className="font-semibold text-sm">미리보기</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            인쇄
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            PDF
          </Button>
        </div>
      </div>

      {/* 탭 + 콘텐츠 */}
      <PreviewTabs previewTab={previewTab} setPreviewTab={setPreviewTab} />
    </div>
  );
}

/** 탭 UI + 콘텐츠 (데스크톱/모바일 공용) */
function PreviewTabs({
  previewTab,
  setPreviewTab,
}: {
  previewTab: 'cover' | 'quote' | 'detail' | 'all';
  setPreviewTab: (tab: 'cover' | 'quote' | 'detail' | 'all') => void;
}) {
  return (
    <Tabs
      value={previewTab}
      onValueChange={(v) => setPreviewTab(v as 'cover' | 'quote' | 'detail' | 'all')}
      className="flex flex-col flex-1 min-h-0"
    >
      <TabsList className="mx-4 mt-3 grid grid-cols-4">
        {TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="flex-1 overflow-y-auto p-4">
        <TabsContent value="cover">
          <PreviewCover />
        </TabsContent>

        <TabsContent value="quote">
          <PreviewQuote />
        </TabsContent>

        <TabsContent value="detail">
          <PreviewDetail />
        </TabsContent>

        <TabsContent value="all">
          <div className="space-y-8">
            <PreviewCover />
            <PreviewQuote />
            <PreviewDetail />
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
