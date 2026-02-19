'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useToxicityV2Store } from '@/stores/toxicityV2Store';
import { useQuotationStore } from '@/stores/quotationStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PreviewCover from './PreviewCover';
import PreviewQuote from './PreviewQuote';
import PreviewDetail from './PreviewDetail';
import {
  ArrowLeft,
  FileText,
  Printer,
  Save,
  Loader2,
  FileSpreadsheet,
  FileSignature,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { createQuotation } from '@/lib/data-api';
import { getUserSettings } from '@/lib/package-api';
import { formatKRW } from '@/lib/toxicity-v2/priceEngine';
import type { TestMode } from '@/types/toxicity-v2';

/** 모드별 한글 라벨 */
const MODE_LABELS: Record<TestMode, string> = {
  drug_single: '의약품',
  drug_combo: '복합제',
  drug_vaccine: '백신',
  drug_screen_tox: '독성 스크리닝',
  drug_screen_cv: '심혈관계 스크리닝',
  hf_indv: '건기식 (개별인정형)',
  hf_prob: '건기식 (프로바이오틱스)',
  hf_temp: '건기식 (한시적식품)',
  md_bio: '의료기기 (생물학적안전성)',
};

/**
 * StepPreviewV2
 *
 * 독성시험 v2 견적서 위자드 Step 4 — 미리보기/출력
 * toxicityV2Store에서 데이터를 읽어 4탭 미리보기 + 저장/PDF/인쇄 기능을 제공한다.
 */
export default function StepPreviewV2() {
  const router = useRouter();
  const quotationStore = useQuotationStore();
  const v2Store = useToxicityV2Store();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'cover' | 'quote' | 'detail' | 'all'>('all');
  const [savedQuotationNumber, setSavedQuotationNumber] = useState<string | null>(null);

  // useQuery로 사용자 설정 조회 (캐시 공유)
  const { data: settingsResponse } = useQuery({
    queryKey: ['userSettings'],
    queryFn: getUserSettings,
    staleTime: 1000 * 60 * 5,
  });

  const isDevelopment = process.env.NODE_ENV === 'development';
  const userCode = settingsResponse?.data?.userCode || (isDevelopment ? 'DV' : 'XX');

  // 임시 견적번호
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const tempQuotationNumber = `${year}-${userCode}-${month}-XXXX`;
  const displayQuotationNumber = savedQuotationNumber || tempQuotationNumber;

  // 저장
  const handleSave = async () => {
    if (v2Store.selectedTests.length === 0) {
      toast({
        title: '입력 오류',
        description: '최소 1개 이상의 시험 항목을 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + quotationStore.validDays);

      // v2 시험 항목을 저장용 포맷으로 변환
      const items = v2Store.selectedTests.map((t, idx) => ({
        itemId: t.itemId,
        name: t.name,
        category: t.category,
        price: t.price,
        isOption: t.isOption,
        parentId: t.parentId ?? null,
        sortOrder: idx,
        tkConfig: t.tkConfig ?? null,
      }));

      const response = await createQuotation({
        quotationType: 'TOXICITY',
        customerId: quotationStore.customerId || null,
        customerName: quotationStore.customerName || v2Store.info.org,
        projectName: quotationStore.projectName || v2Store.info.substance,
        modality: v2Store.mode ? MODE_LABELS[v2Store.mode] : null,
        items,
        subtotalTest: v2Store.subtotalTest,
        subtotalAnalysis: v2Store.formulationCost,
        subtotal: v2Store.subtotalTest + v2Store.formulationCost,
        discountRate: v2Store.discountRate,
        discountAmount: v2Store.discountAmount,
        totalAmount: v2Store.totalAmount,
        validDays: quotationStore.validDays,
        validUntil: validUntil.toISOString(),
        notes: quotationStore.notes,
        status: 'DRAFT',
      });

      if (response.success && response.data) {
        setSavedQuotationNumber(response.data.quotationNumber);

        // v2Store에도 견적번호 반영
        v2Store.setInfo({ quotationNumber: response.data.quotationNumber });

        toast({
          title: '저장 완료',
          description: `견적서 ${response.data.quotationNumber}가 저장되었습니다.`,
        });

        quotationStore.reset();
        v2Store.reset();
        router.push('/quotations');
      } else {
        toast({
          title: '저장 실패',
          description: response.error?.message || '견적서 저장 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '저장 실패',
        description: '견적서 저장 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // 인쇄
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 액션 버튼 */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                견적번호: {displayQuotationNumber}
              </h2>
              <p className="text-sm text-gray-500">
                {quotationStore.customerName || v2Store.info.org || '-'} |{' '}
                {quotationStore.projectName || v2Store.info.substance || '-'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {v2Store.mode ? MODE_LABELS[v2Store.mode] : '-'} | 시험 {v2Store.selectedTests.length}건 | 합계 {formatKRW(v2Store.totalAmount)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                인쇄
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                저장
              </Button>
              <Button size="sm" variant="secondary" asChild>
                <Link href="/contract/new">
                  <FileSignature className="w-4 h-4 mr-2" />
                  계약서 생성
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 미리보기 탭 (4탭: 표지/견적서/상세내역/전체) */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cover">표지</TabsTrigger>
          <TabsTrigger value="quote">견적서</TabsTrigger>
          <TabsTrigger value="detail">상세내역</TabsTrigger>
          <TabsTrigger value="all">전체</TabsTrigger>
        </TabsList>

        <TabsContent value="cover" className="mt-4">
          <PreviewCover />
        </TabsContent>

        <TabsContent value="quote" className="mt-4">
          <PreviewQuote />
        </TabsContent>

        <TabsContent value="detail" className="mt-4">
          <PreviewDetail />
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <div className="space-y-8">
            <PreviewCover />
            <PreviewQuote />
            <PreviewDetail />
          </div>
        </TabsContent>
      </Tabs>

      {/* 하단 버튼 */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => quotationStore.prevStep()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> 이전
        </Button>
      </div>
    </div>
  );
}
