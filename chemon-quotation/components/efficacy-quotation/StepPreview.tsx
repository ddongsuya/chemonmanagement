'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useEfficacyQuotationStore } from '@/stores/efficacyQuotationStore';
import { createQuotation } from '@/lib/data-api';
import { getCompanyInfo } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Save,
  Loader2,
  Printer,
  FlaskConical,
  Download,
} from 'lucide-react';
import EfficacyStudyDesignDiagram from './EfficacyStudyDesignDiagram';
import UnifiedQuotationPreview, {
  type CompanyInfo,
  type CustomerInfo,
  type QuotationItem,
  type QuotationAmounts,
} from '@/components/quotation/UnifiedQuotationPreview';

// Dynamic import for PDF components (client-side only)
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <span>PDF 준비중...</span> }
);
const EfficacyQuotationPDF = dynamic(
  () => import('./EfficacyQuotationPDF'),
  { ssr: false }
);

/**
 * StepPreview Component
 * Step 5 of efficacy quotation wizard - Preview and save
 * Uses UnifiedQuotationPreview for consistent layout across all quotation types
 * Requirements: 2.1, 2.2, 5.1, 5.2, 6.1, 6.3, 6.4
 */

// Category display order
const CATEGORY_ORDER = [
  '동물비',
  '사육비',
  '측정',
  '조직병리',
  '분석',
  '기타',
];

export default function StepPreview() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [savedQuotationNumber, setSavedQuotationNumber] = useState<string | null>(null);

  const {
    customerId,
    customerName,
    projectName,
    validDays,
    notes,
    selectedModelId,
    selectedModel,
    selectedItems,
    subtotalByCategory,
    subtotal,
    vat,
    grandTotal,
    studyDesign,
    prevStep,
    reset,
  } = useEfficacyQuotationStore();

  // Get company info - Requirement 2.2
  const rawCompanyInfo = getCompanyInfo();
  
  // Map to UnifiedQuotationPreview CompanyInfo format
  const companyInfo: CompanyInfo = useMemo(() => ({
    name: rawCompanyInfo.name,
    nameEn: rawCompanyInfo.name_en,
    address: rawCompanyInfo.address,
    addressEn: rawCompanyInfo.address_en,
    tel: rawCompanyInfo.tel,
    fax: rawCompanyInfo.fax,
    email: rawCompanyInfo.email,
    logo: rawCompanyInfo.logo,
    businessNumber: rawCompanyInfo.business_number,
    ceoName: rawCompanyInfo.ceo_name,
  }), [rawCompanyInfo]);

  // Map customer info to UnifiedQuotationPreview format
  const customerInfo: CustomerInfo = useMemo(() => ({
    id: customerId || undefined,
    name: customerName || '-',
    projectName: projectName || undefined,
  }), [customerId, customerName, projectName]);

  // Map selected items to UnifiedQuotationPreview QuotationItem format
  const quotationItems: QuotationItem[] = useMemo(() => 
    selectedItems.map((item) => ({
      id: item.id,
      name: item.item_name,
      category: item.category,
      unitPrice: item.unit_price,
      quantity: item.quantity,
      multiplier: item.multiplier,
      amount: item.amount,
      isDefault: item.is_default,
    })),
    [selectedItems]
  );

  // Map amounts to UnifiedQuotationPreview format
  const amounts: QuotationAmounts = useMemo(() => ({
    subtotal,
    subtotalByCategory,
    vat,
    total: grandTotal,
  }), [subtotal, subtotalByCategory, vat, grandTotal]);

  // Generate quotation number - Requirement 2.1
  const tempQuotationNumber = 'EQ-' + new Date().getFullYear() + '-XXXX';
  const displayQuotationNumber = savedQuotationNumber || tempQuotationNumber;
  const quotationDate = new Date();
  const validUntil = new Date(quotationDate);
  validUntil.setDate(validUntil.getDate() + validDays);

  // Model info section to display before items
  const modelInfoSection = useMemo(() => {
    if (!selectedModel) return null;
    
    return (
      <div className="border rounded-lg p-4 mb-6 bg-blue-50 dark:bg-blue-900/20">
        <div className="flex items-center gap-2 mb-3">
          <FlaskConical className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-blue-800 dark:text-blue-300">
            효력시험 모델
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">모델명</p>
            <p className="font-medium">{selectedModel.model_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">카테고리</p>
            <p className="font-medium">{selectedModel.category}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-500">적응증</p>
            <p className="font-medium">{selectedModel.indication}</p>
          </div>
        </div>
      </div>
    );
  }, [selectedModel]);

  // Study design diagram as additional content
  const studyDesignContent = useMemo(() => {
    if (!studyDesign || (studyDesign.groups.length === 0 && studyDesign.phases.length === 0)) {
      return null;
    }
    
    return (
      <EfficacyStudyDesignDiagram
        studyDesign={studyDesign}
        testName={selectedModel?.model_name || ''}
        className="border rounded-lg"
      />
    );
  }, [studyDesign, selectedModel]);

  // Handle save
  const handleSave = async () => {
    if (!selectedModelId || !selectedModel) {
      toast({
        title: '저장 실패',
        description: '모델이 선택되지 않았습니다.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      // 백엔드 API로 저장
      const response = await createQuotation({
        quotationType: 'EFFICACY',
        customerId: customerId || null,
        customerName: customerName,
        projectName: projectName,
        modality: selectedModel.model_name,
        modelId: selectedModelId,
        modelCategory: selectedModel.category,
        indication: selectedModel.indication,
        items: selectedItems,
        subtotal: subtotal,
        vat: vat,
        totalAmount: grandTotal,
        validDays: validDays,
        validUntil: validUntil.toISOString(),
        notes: notes,
        status: 'DRAFT',
      });

      if (response.success && response.data) {
        setSavedQuotationNumber(response.data.quotationNumber);
        
        toast({
          title: '저장 완료',
          description: `견적서 ${response.data.quotationNumber}가 저장되었습니다.`,
        });

        reset();
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

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  if (!selectedModel) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">먼저 효력시험 모델을 선택해주세요.</p>
          <Button variant="outline" onClick={prevStep} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            이전 단계로 돌아가기
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <Card className="print:hidden">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              {/* Requirement 2.1: Display quotation number in header area */}
              <h2 className="text-lg font-semibold">
                견적번호: {displayQuotationNumber}
              </h2>
              <p className="text-sm text-gray-500">
                {customerName} | {projectName}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                인쇄
              </Button>
              {typeof window !== 'undefined' && EfficacyQuotationPDF && (
                <PDFDownloadLink
                  document={
                    <EfficacyQuotationPDF
                      quotationNumber={displayQuotationNumber}
                      quotationDate={quotationDate}
                      validUntil={validUntil}
                      customerName={customerName || '-'}
                      projectName={projectName || '-'}
                      modelName={selectedModel.model_name}
                      modelCategory={selectedModel.category}
                      indication={selectedModel.indication}
                      items={selectedItems}
                      subtotalByCategory={subtotalByCategory}
                      subtotal={subtotal}
                      vat={vat}
                      grandTotal={grandTotal}
                      notes={notes}
                      company={rawCompanyInfo}
                      studyDesign={studyDesign}
                      includeStudyDesign={studyDesign.groups.length > 0 || studyDesign.phases.length > 0}
                    />
                  }
                  fileName={`효력시험견적서_${displayQuotationNumber}.pdf`}
                >
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    PDF 다운로드
                  </Button>
                </PDFDownloadLink>
              )}
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                저장
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unified Quotation Preview - Requirements 2.1, 2.2, 2.3 */}
      <UnifiedQuotationPreview
        quotationType="EFFICACY"
        quotationNumber={displayQuotationNumber}
        companyInfo={companyInfo}
        customerInfo={customerInfo}
        items={quotationItems}
        amounts={amounts}
        notes={notes}
        validUntil={validUntil}
        quotationDate={quotationDate}
        validDays={validDays}
        title="효력시험 견적서"
        showVat={true}
        groupByCategory={true}
        categoryOrder={CATEGORY_ORDER}
        preItemsContent={modelInfoSection}
        additionalContent={studyDesignContent}
      />

      {/* Navigation */}
      <Card className="print:hidden">
        <CardContent className="py-4">
          <div className="flex justify-between">
            <Button variant="outline" onClick={prevStep}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              이전: 금액 계산
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              견적서 저장
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
