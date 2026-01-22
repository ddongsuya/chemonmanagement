'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuotationStore } from '@/stores/quotationStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QuotationPDF from './QuotationPDF';
import QuotationDetailPDF from './QuotationDetailPDF';
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
import { usePDFDownload } from '@/hooks/usePDFDownload';
import { createQuotation } from '@/lib/data-api';

export default function StepPreview() {
  const router = useRouter();
  const store = useQuotationStore();
  const { toast } = useToast();
  const { downloadPDF, isLoading: pdfLoading } = usePDFDownload();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [savedQuotationNumber, setSavedQuotationNumber] = useState<string | null>(null);

  // 임시 견적번호 (저장 전)
  const tempQuotationNumber = 'TQ-' + new Date().getFullYear() + '-XXXX';
  const displayQuotationNumber = savedQuotationNumber || tempQuotationNumber;

  // 저장
  const handleSave = async () => {
    // 유효성 검사
    const validation = store.validate();
    if (!validation.isValid) {
      toast({
        title: '입력 오류',
        description: validation.errors.join('\n'),
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    
    try {
      // 유효기간 계산
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + store.validDays);
      
      // 백엔드 API로 저장
      const response = await createQuotation({
        quotationType: 'TOXICITY',
        customerId: store.customerId || null,
        customerName: store.customerName,
        projectName: store.projectName,
        modality: store.modality,
        items: store.selectedItems,
        subtotalTest: store.subtotalTest,
        subtotalAnalysis: store.subtotalAnalysis,
        subtotal: store.subtotalTest + store.subtotalAnalysis,
        discountRate: store.discountRate,
        discountAmount: store.discountAmount,
        totalAmount: store.totalAmount,
        validDays: store.validDays,
        validUntil: validUntil.toISOString(),
        notes: store.notes,
        status: 'DRAFT',
      });

      if (response.success && response.data) {
        setSavedQuotationNumber(response.data.quotationNumber);
        
        toast({
          title: '저장 완료',
          description: `견적서 ${response.data.quotationNumber}가 저장되었습니다.`,
        });

        store.reset();
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

  // PDF 다운로드
  const handleDownloadPDF = async () => {
    const success = await downloadPDF({
      quotationNumber: displayQuotationNumber,
      quotationDate: new Date(),
      customerName: store.customerName,
      projectName: store.projectName,
      validDays: store.validDays,
      items: store.selectedItems.map((item) => ({
        id: item.id,
        name: item.test.test_name.split('\n')[0],
        glp: item.test.glp_status || 'N/A',
        amount: item.amount,
        isOption: item.is_option,
      })),
      subtotalTest: store.subtotalTest,
      subtotalAnalysis: store.subtotalAnalysis,
      discountRate: store.discountRate,
      discountAmount: store.discountAmount,
      totalAmount: store.totalAmount,
      notes: store.notes,
    });

    if (success) {
      toast({
        title: 'PDF 다운로드 완료',
        description: '견적서 PDF가 다운로드되었습니다.',
      });
    } else {
      toast({
        title: 'PDF 생성 실패',
        description: 'PDF 생성 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  // Excel 다운로드
  const handleDownloadExcel = () => {
    // TODO: ExcelJS로 Excel 생성 및 다운로드
    toast({
      title: '준비 중',
      description: 'Excel 다운로드 기능은 준비 중입니다.',
    });
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
                {store.customerName} | {store.projectName}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadExcel}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
              >
                {pdfLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                PDF
              </Button>
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

      {/* 미리보기 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preview">견적서 (1페이지)</TabsTrigger>
          <TabsTrigger value="detail">시험항목 상세 (2페이지)</TabsTrigger>
        </TabsList>
        <TabsContent value="preview" className="mt-4">
          <QuotationPDF quotationNumber={displayQuotationNumber} />
        </TabsContent>
        <TabsContent value="detail" className="mt-4">
          <QuotationDetailPDF />
        </TabsContent>
      </Tabs>

      {/* 하단 버튼 */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => store.prevStep()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> 이전
        </Button>
      </div>
    </div>
  );
}
