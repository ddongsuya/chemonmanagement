'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import ConsultationForm from '@/components/consultation/ConsultationForm';
import ConsultationDownloadButton from '@/components/consultation/ConsultationDownloadButton';
import ConsultationPreview from '@/components/consultation/ConsultationPreview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuotationStore } from '@/stores/quotationStore';
import {
  ConsultationRecordData,
  QuotationContentItem,
} from '@/lib/consultation/types';
import { getQuotationById } from '@/lib/data-api';
import { efficacyQuotationApi } from '@/lib/efficacy-api';
import {
  ArrowLeft,
  FileText,
  Check,
  Eye,
  Edit,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';

function ConsultationNewContent() {
  const searchParams = useSearchParams();
  const store = useQuotationStore();

  const [consultationData, setConsultationData] =
    useState<ConsultationRecordData | null>(null);
  const [quotationItems, setQuotationItems] = useState<QuotationContentItem[]>(
    []
  );
  const [isGenerated, setIsGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // URL에서 quotationId 가져오기
  const quotationId = searchParams.get('quotationId');
  const efficacyQuotationId = searchParams.get('efficacyQuotationId');

  // 견적서 데이터 로드
  const [quotationData, setQuotationData] = useState<{
    projectName: string;
    items: any[];
    customerName: string;
    customerContact?: string;
    customerTel?: string;
    customerEmail?: string;
    isEfficacy?: boolean;
    modelName?: string;
    indication?: string;
  } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (efficacyQuotationId) {
          // API에서 효력시험 견적 데이터 로드
          const efficacyQuotation = await efficacyQuotationApi.getById(efficacyQuotationId);
          if (efficacyQuotation) {
            setQuotationData({
              projectName: efficacyQuotation.project_name,
              items: efficacyQuotation.items,
              customerName: efficacyQuotation.customer_name,
              isEfficacy: true,
              modelName: efficacyQuotation.model_name,
              indication: efficacyQuotation.indication,
            });

            // 효력시험 견적 내용 시트용 데이터 준비
            const contentItems: QuotationContentItem[] = efficacyQuotation.items.map(
              (item, index) => ({
                no: index + 1,
                testName: item.item_name,
                species: '-',
                duration: '-',
            route: '-',
            animalCount: String(item.quantity),
            groupCount: String(item.multiplier),
            options: item.usage_note || '-',
            remarks: item.is_default ? '기본항목' : '옵션항목',
          })
        );
        setQuotationItems(contentItems);
          }
        } else if (quotationId) {
          const response = await getQuotationById(quotationId);
          if (response.success && response.data) {
            const quotation = response.data;
            const rawItems = Array.isArray(quotation.items) ? quotation.items : [];
            setQuotationData({
              projectName: quotation.projectName,
              items: rawItems,
              customerName: quotation.customerName,
            });

            // 견적 내용 시트용 데이터 준비
            const contentItems: QuotationContentItem[] = rawItems
              .filter((item: any) => !item.is_option && !item.isOption)
              .map((item: any, index: number) => ({
                no: index + 1,
                testName: item.test?.test_name?.split('\n')[0] || item.testName || item.test_name || '',
                species: item.test?.animal_species || item.species || '-',
                duration: item.test?.dosing_period || item.duration || '-',
                route: item.test?.route || item.route || '-',
                animalCount: '-',
                groupCount: '-',
                options: rawItems
                  .filter((opt: any) => (opt.is_option || opt.isOption) && opt.parent_item_id === item.id)
                  .map((opt: any) => opt.test?.test_name?.split('\n')[0] || opt.testName || '')
                  .join(', ') || '-',
                remarks: '-',
              }));
            setQuotationItems(contentItems);
          }
        } else if (store.selectedItems.length > 0) {
          setQuotationData({
            projectName: store.projectName,
            items: store.selectedItems,
            customerName: store.customerName,
          });

          const contentItems: QuotationContentItem[] = store.selectedItems
            .filter((item) => !item.is_option)
            .map((item, index) => ({
              no: index + 1,
              testName: item.test?.test_name?.split('\n')[0] || '',
              species: item.test?.animal_species || '-',
              duration: item.test?.dosing_period || '-',
              route: item.test?.route || '-',
              animalCount: '-',
              groupCount: '-',
              options:
                store.selectedItems
                  .filter((opt) => opt.is_option && opt.parent_item_id === item.id)
                  .map((opt) => opt.test?.test_name?.split('\n')[0])
                  .join(', ') || '-',
              remarks: '-',
            }));
          setQuotationItems(contentItems);
        }
      } catch (error) {
        console.error('Failed to load quotation:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [quotationId, efficacyQuotationId, store]);

  // 폼 제출 처리
  const handleFormSubmit = (data: ConsultationRecordData) => {
    setConsultationData(data);
    setIsGenerated(true);
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="상담기록지 생성"
          description="견적서를 기반으로 상담기록지를 생성합니다"
        />
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-spin" />
            <p className="text-muted-foreground">데이터를 불러오는 중...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!quotationData || quotationData.items.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="상담기록지 생성"
          description="견적서를 기반으로 상담기록지를 생성합니다"
        />
        <Card>
          <CardContent className="py-12 text-center">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">
              견적서 데이터가 없습니다
            </h3>
            <p className="text-muted-foreground mb-4">
              {(quotationId || efficacyQuotationId)
                ? '요청한 견적서를 찾을 수 없습니다.'
                : '먼저 견적서를 작성하거나, 기존 견적서에서 상담기록지 생성을 선택해주세요.'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button asChild>
                <Link href="/quotations/new">새 견적서 작성</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/quotations">견적 목록</Link>
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
        title="상담기록지 생성"
        description="견적서를 기반으로 상담기록지(엑셀)를 자동 생성합니다"
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
        <ConsultationForm
          quotationData={quotationData}
          onSubmit={handleFormSubmit}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              상담기록지 생성 완료
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 요약 정보 */}
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p>
                <span className="text-muted-foreground">시험물질:</span>{' '}
                <span className="font-medium">
                  {consultationData?.basic.substanceName}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">의뢰기관:</span>{' '}
                <span className="font-medium">
                  {consultationData?.basic.clientCompany}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">작성자:</span>{' '}
                <span className="font-medium">
                  {consultationData?.basic.authorName}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">시험항목:</span>{' '}
                <span className="font-medium">{quotationItems.length}개</span>
              </p>
            </div>

            <Separator />

            {/* 미리보기 / 액션 탭 */}
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  상담기록지 미리보기
                </TabsTrigger>
                <TabsTrigger value="actions" className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  다운로드 / 수정
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="mt-4">
                {consultationData && (
                  <ConsultationPreview
                    data={consultationData}
                    quotationItems={quotationItems}
                  />
                )}
              </TabsContent>

              <TabsContent value="actions" className="mt-4">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" />
                      상담기록지 다운로드
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      미리보기 내용을 확인하신 후 엑셀 파일로 다운로드하세요. (2개 시트: 상담기록지, 견적내용)
                    </p>
                    {consultationData && (
                      <ConsultationDownloadButton
                        data={consultationData}
                        quotationItems={quotationItems}
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
                      상담기록지 내용을 수정하려면 아래 버튼을 클릭하세요.
                    </p>
                    <Button variant="outline" onClick={() => setIsGenerated(false)}>
                      수정하기
                    </Button>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="outline" asChild>
                      <Link href="/quotations">견적 목록으로</Link>
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

export default function ConsultationNewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">로딩 중...</div>}>
      <ConsultationNewContent />
    </Suspense>
  );
}
