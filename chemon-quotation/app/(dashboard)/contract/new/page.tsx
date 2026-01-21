'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import ContractForm from '@/components/contract/ContractForm';
import ContractDownloadButton from '@/components/contract/ContractDownloadButton';
import ContractPreview from '@/components/contract/ContractPreview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuotationStore } from '@/stores/quotationStore';
import { ContractData, ContractFormData, QuotationItem } from '@/lib/contract/types';
import { numberToKorean, formatDateKorean, calculateWeeks } from '@/lib/contract/number-to-korean';
import { getQuotationById } from '@/lib/data-api';
import { efficacyQuotationApi } from '@/lib/efficacy-api';
import { SavedEfficacyQuotation } from '@/types/efficacy';
import { ArrowLeft, FileText, Check, Eye, Edit, Loader2 } from 'lucide-react';
import Link from 'next/link';

// SavedQuotation 타입 정의
interface SavedQuotation {
  id: string;
  quotation_number: string;
  customer_name: string;
  project_name: string;
  items: Array<{
    test_name: string;
    species?: string;
    duration?: string;
    route?: string;
    unit_price: number;
    quantity: number;
    total_price: number;
  }>;
  total_amount: number;
}

function ContractNewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const store = useQuotationStore();
  
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [isGenerated, setIsGenerated] = useState(false);
  const [loadedQuotation, setLoadedQuotation] = useState<SavedQuotation | null>(null);
  const [loadedEfficacyQuotation, setLoadedEfficacyQuotation] = useState<SavedEfficacyQuotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // URL에서 quotationId 가져오기
  const quotationId = searchParams.get('quotationId');
  const efficacyQuotationId = searchParams.get('efficacyQuotationId');

  // 견적서 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        if (quotationId) {
          // API에서 독성시험 견적 데이터 로드
          const response = await getQuotationById(quotationId);
          if (response.success && response.data) {
            const q = response.data;
            const rawItems = Array.isArray(q.items) ? q.items : [];
            setLoadedQuotation({
              id: q.id,
              quotation_number: q.quotationNumber,
              customer_name: q.customerName,
              project_name: q.projectName,
              items: rawItems.map((item: any) => ({
                test_name: item.testName || item.test_name || item.test?.test_name || '시험항목',
                species: item.species || item.test?.animal_species,
                duration: item.duration || item.test?.dosing_period,
                route: item.route || item.test?.route,
                unit_price: item.unitPrice || item.unit_price || item.amount || 0,
                quantity: item.quantity || 1,
                total_price: item.totalPrice || item.total_price || item.amount || 0,
              })),
              total_amount: Number(q.totalAmount) || 0,
            });
          }
        } else if (efficacyQuotationId) {
          // API에서 효력시험 견적 데이터 로드
          const efficacyQuotation = await efficacyQuotationApi.getById(efficacyQuotationId);
          if (efficacyQuotation) {
            setLoadedEfficacyQuotation(efficacyQuotation);
          }
        }
      } catch (error) {
        console.error('Failed to load quotation:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [quotationId, efficacyQuotationId]);

  // 데이터 소스 결정 (로드된 견적 또는 store)
  const hasStoreData = store.selectedItems.length > 0;
  const hasLoadedData = loadedQuotation !== null;
  const hasEfficacyData = loadedEfficacyQuotation !== null;
  
  // 견적서 데이터 준비
  let quotationNo = '';
  let customerName = '';
  let projectName = '';
  let items: QuotationItem[] = [];
  let subtotal = 0;

  if (hasEfficacyData && loadedEfficacyQuotation) {
    // 효력시험 견적 데이터 사용
    quotationNo = loadedEfficacyQuotation.quotation_number;
    customerName = loadedEfficacyQuotation.customer_name;
    projectName = loadedEfficacyQuotation.project_name;
    items = (loadedEfficacyQuotation.items || []).map((item, index) => ({
      no: index + 1,
      testName: item.item_name || '항목',
      species: undefined,
      duration: undefined,
      route: undefined,
      unitPrice: item.unit_price || 0,
      quantity: (item.quantity || 1) * (item.multiplier || 1),
      totalPrice: item.amount || 0,
    }));
    subtotal = loadedEfficacyQuotation.subtotal || 0;
  } else if (hasLoadedData && loadedQuotation) {
    // API에서 로드된 독성시험 데이터 사용
    quotationNo = loadedQuotation.quotation_number;
    customerName = loadedQuotation.customer_name;
    projectName = loadedQuotation.project_name;
    items = (loadedQuotation.items || []).map((item, index) => ({
      no: index + 1,
      testName: (item.test_name || item.testName || '시험항목').split('\n')[0],
      species: item.species || undefined,
      duration: item.duration || undefined,
      route: item.route || undefined,
      unitPrice: item.unit_price || item.unitPrice || 0,
      quantity: item.quantity || 1,
      totalPrice: item.total_price || item.totalPrice || 0,
    }));
    subtotal = loadedQuotation.total_amount || 0;
  } else if (hasStoreData) {
    // store에서 데이터 가져오기
    quotationNo = `QT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    customerName = store.customerName;
    projectName = store.projectName;
    items = store.selectedItems.map((item, index) => ({
      no: index + 1,
      testName: item.test.test_name.split('\n')[0],
      species: item.test.animal_species || undefined,
      duration: item.test.dosing_period || undefined,
      route: item.test.route || undefined,
      unitPrice: item.unit_price,
      quantity: item.quantity,
      totalPrice: item.amount,
    }));
    subtotal = store.subtotalTest + store.subtotalAnalysis;
  }

  const initialData = {
    quotationNo,
    customerName,
    projectName,
    items,
    subtotal,
  };

  // 폼 제출 처리
  const handleFormSubmit = (formData: ContractFormData) => {
    const subtotal = initialData.subtotal;
    const advanceAmount = Math.floor(subtotal * (formData.advanceRate / 100));
    const remainingAmount = subtotal - advanceAmount;
    const totalWeeks = calculateWeeks(formData.startDate, formData.endDate);

    const data: ContractData = {
      customer: {
        companyName: formData.customerName,
        address: formData.customerAddress,
        ceoName: formData.customerCeo,
      },
      project: {
        name: formData.projectName,
      },
      payment: {
        subtotal,
        vatRate: 10,
        vatAmount: Math.floor(subtotal * 0.1),
        totalAmount: Math.floor(subtotal * 1.1),
        advancePayment: {
          rate: formData.advanceRate,
          amount: advanceAmount,
          amountInKorean: numberToKorean(advanceAmount),
          dueCondition: '계약일로부터 30일 이내',
        },
        remainingPayment: {
          rate: 100 - formData.advanceRate,
          amount: remainingAmount,
          amountInKorean: numberToKorean(remainingAmount),
          dueCondition: '최종결과보고서(안) 제출 후 30일 이내',
        },
      },
      period: {
        startDate: formatDateKorean(formData.startDate),
        endDate: formatDateKorean(formData.endDate),
        totalWeeks,
        displayText: `${formatDateKorean(formData.startDate)} ~ ${formatDateKorean(formData.endDate)} (약 ${totalWeeks}주)`,
      },
      contract: {
        date: formatDateKorean(formData.contractDate),
        isDraft: formData.isDraft,
      },
      quotation: {
        quotationNo: initialData.quotationNo,
        items: initialData.items,
      },
    };

    setContractData(data);
    setIsGenerated(true);
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="계약서 생성"
          description="견적서를 기반으로 위탁연구계약서를 생성합니다"
        />
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-spin" />
            <p className="text-muted-foreground">견적서 데이터를 불러오는 중...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="계약서 생성"
          description="견적서를 기반으로 위탁연구계약서를 생성합니다"
        />
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">견적서 데이터가 없습니다</h3>
            <p className="text-muted-foreground mb-4">
              {(quotationId || efficacyQuotationId)
                ? '요청한 견적서를 찾을 수 없습니다.' 
                : '먼저 견적서를 작성하거나, 기존 견적서에서 계약서 생성을 선택해주세요.'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button asChild>
                <Link href="/quotations/new">
                  새 견적서 작성
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/quotations">
                  견적 목록
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="위탁연구계약서 생성"
        description="견적서를 기반으로 위탁연구계약서를 자동 생성합니다"
        actions={
          <Button variant="outline" asChild>
            <Link href="/quotations">
              <ArrowLeft className="w-4 h-4 mr-2" />
              견적 목록
            </Link>
          </Button>
        }
      />

      {!isGenerated ? (
        <ContractForm
          initialData={initialData}
          onSubmit={handleFormSubmit}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              계약서 생성 완료
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 요약 정보 */}
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p><span className="text-muted-foreground">고객사:</span> <span className="font-medium">{contractData?.customer.companyName}</span></p>
              <p><span className="text-muted-foreground">프로젝트:</span> <span className="font-medium">{contractData?.project.name}</span></p>
              <p><span className="text-muted-foreground">연구기간:</span> <span className="font-medium">{contractData?.period.displayText}</span></p>
              <p><span className="text-muted-foreground">계약금액:</span> <span className="font-medium text-primary">₩ {contractData?.payment.subtotal.toLocaleString()} (VAT 별도)</span></p>
            </div>
            
            <Separator />

            {/* 미리보기 / 액션 탭 */}
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  계약서 미리보기
                </TabsTrigger>
                <TabsTrigger value="actions" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  다운로드 / 수정
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="mt-4">
                {contractData && <ContractPreview data={contractData} />}
              </TabsContent>
              
              <TabsContent value="actions" className="mt-4">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      계약서 다운로드
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      미리보기 내용을 확인하신 후 DOCX 파일로 다운로드하세요.
                    </p>
                    {contractData && (
                      <ContractDownloadButton 
                        data={contractData} 
                        quotationId={quotationId || efficacyQuotationId || loadedQuotation?.id || loadedEfficacyQuotation?.id}
                        size="lg" 
                      />
                    )}
                  </div>
                  
                  <div className="p-4 border rounded-lg space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      내용 수정
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      계약서 내용을 수정하려면 아래 버튼을 클릭하세요.
                    </p>
                    <Button variant="outline" onClick={() => setIsGenerated(false)}>
                      수정하기
                    </Button>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button variant="outline" asChild>
                      <Link href="/quotations">
                        견적 목록으로
                      </Link>
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ContractNewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">로딩 중...</div>}>
      <ContractNewContent />
    </Suspense>
  );
}
