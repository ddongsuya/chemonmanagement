'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Save, RotateCcw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ClinicalTestItem,
  SampleType,
  ClinicalTestCategory,
  SAMPLE_TYPE_LABELS,
  CATEGORY_LABELS,
  ANIMAL_SPECIES,
  SAMPLE_TYPE_CATEGORIES,
} from '@/types/clinical-pathology';
import { clinicalPathologyApi } from '@/lib/clinical-pathology-api';

interface FormData {
  customerName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  testStandard: 'GLP' | 'NON_GLP';
  animalSpecies: string;
  sampleTypes: SampleType[];
  totalSamples: number;
  maleSamples: number;
  femaleSamples: number;
  selectedItems: string[];
  discountType: 'RATE' | 'AMOUNT' | null;
  discountValue: number;
  discountReason: string;
  validDays: number;
  notes: string;
}

const STEPS = [
  { id: 1, title: '기본정보', description: '고객 및 시험 기준' },
  { id: 2, title: '검체정보', description: '동물 종 및 검체' },
  { id: 3, title: '검사항목', description: '검사항목 선택' },
  { id: 4, title: '금액확인', description: '가격 및 할인' },
];

export default function NewClinicalQuotationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [testItems, setTestItems] = useState<ClinicalTestItem[]>([]);
  const [groupedItems, setGroupedItems] = useState<Record<ClinicalTestCategory, ClinicalTestItem[]>>({} as any);
  
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    testStandard: 'NON_GLP',
    animalSpecies: '',
    sampleTypes: [],
    totalSamples: 0,
    maleSamples: 0,
    femaleSamples: 0,
    selectedItems: [],
    discountType: null,
    discountValue: 0,
    discountReason: '',
    validDays: 60,
    notes: '',
  });

  const [calculation, setCalculation] = useState<{
    items: any[];
    subtotal: number;
    qcFees: Record<string, number>;
    totalQcFee: number;
    discountAmount: number;
    totalBeforeVat: number;
    vatAmount: number;
    totalAmount: number;
  } | null>(null);

  // 검사항목 로드
  useEffect(() => {
    const loadTestItems = async () => {
      try {
        const response = await clinicalPathologyApi.getTestItems();
        setTestItems(response.items);
        setGroupedItems(response.groupedByCategory);
      } catch (error) {
        console.error('Failed to load test items:', error);
        toast({ title: '검사항목 로드 실패', variant: 'destructive' });
      }
    };
    loadTestItems();
  }, [toast]);

  // 선택된 검체 종류에 따라 활성화되는 카테고리
  const availableCategories = useMemo(() => {
    const categories = new Set<ClinicalTestCategory>();
    formData.sampleTypes.forEach(type => {
      SAMPLE_TYPE_CATEGORIES[type]?.forEach(cat => categories.add(cat));
    });
    return Array.from(categories);
  }, [formData.sampleTypes]);

  // 금액 계산
  useEffect(() => {
    if (currentStep === 4 && formData.selectedItems.length > 0 && formData.totalSamples > 0) {
      const calculate = async () => {
        try {
          const result = await clinicalPathologyApi.calculate({
            totalSamples: formData.totalSamples,
            items: formData.selectedItems.map(id => ({ testItemId: id, quantity: formData.totalSamples })),
            discountType: formData.discountType || undefined,
            discountValue: formData.discountValue || undefined,
            vatRate: 10,
          });
          setCalculation(result);
        } catch (error) {
          console.error('Calculation error:', error);
        }
      };
      calculate();
    }
  }, [currentStep, formData.selectedItems, formData.totalSamples, formData.discountType, formData.discountValue]);

  const handleSampleTypeToggle = (type: SampleType) => {
    setFormData(prev => {
      const newTypes = prev.sampleTypes.includes(type)
        ? prev.sampleTypes.filter(t => t !== type)
        : [...prev.sampleTypes, type];
      
      // 검체 종류가 변경되면 해당 카테고리의 선택된 항목도 필터링
      const newCategories = new Set<ClinicalTestCategory>();
      newTypes.forEach(t => {
        SAMPLE_TYPE_CATEGORIES[t]?.forEach(cat => newCategories.add(cat));
      });
      
      const newSelectedItems = prev.selectedItems.filter(itemId => {
        const item = testItems.find(i => i.id === itemId);
        return item && newCategories.has(item.category);
      });
      
      return { ...prev, sampleTypes: newTypes, selectedItems: newSelectedItems };
    });
  };

  const handleItemToggle = (itemId: string) => {
    setFormData(prev => {
      const item = testItems.find(i => i.id === itemId);
      if (!item) return prev;
      
      const isSelected = prev.selectedItems.includes(itemId);
      let newSelectedItems: string[];
      
      if (isSelected) {
        newSelectedItems = prev.selectedItems.filter(id => id !== itemId);
        // DIFF 해제 시 CBC도 해제하지 않음 (CBC는 독립적)
      } else {
        newSelectedItems = [...prev.selectedItems, itemId];
        // DIFF 선택 시 CBC 자동 선택
        if (item.code === 'DIFF') {
          const cbcItem = testItems.find(i => i.code === 'CBC');
          if (cbcItem && !newSelectedItems.includes(cbcItem.id)) {
            newSelectedItems.push(cbcItem.id);
          }
        }
      }
      
      return { ...prev, selectedItems: newSelectedItems };
    });
  };

  const handleCategorySelectAll = (category: ClinicalTestCategory, select: boolean) => {
    const categoryItems = groupedItems[category] || [];
    setFormData(prev => {
      let newSelectedItems = [...prev.selectedItems];
      categoryItems.forEach(item => {
        const isSelected = newSelectedItems.includes(item.id);
        if (select && !isSelected) {
          newSelectedItems.push(item.id);
        } else if (!select && isSelected) {
          newSelectedItems = newSelectedItems.filter(id => id !== item.id);
        }
      });
      return { ...prev, selectedItems: newSelectedItems };
    });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.customerName.trim()) {
          toast({ title: '의뢰기관명을 입력해주세요', variant: 'destructive' });
          return false;
        }
        if (!formData.contactName.trim()) {
          toast({ title: '담당자명을 입력해주세요', variant: 'destructive' });
          return false;
        }
        return true;
      case 2:
        if (!formData.animalSpecies) {
          toast({ title: '동물 종을 선택해주세요', variant: 'destructive' });
          return false;
        }
        if (formData.sampleTypes.length === 0) {
          toast({ title: '검체 종류를 선택해주세요', variant: 'destructive' });
          return false;
        }
        if (formData.totalSamples <= 0) {
          toast({ title: '검체 수를 입력해주세요', variant: 'destructive' });
          return false;
        }
        return true;
      case 3:
        if (formData.selectedItems.length === 0) {
          toast({ title: '검사항목을 선택해주세요', variant: 'destructive' });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleReset = () => {
    if (window.confirm('작성 중인 견적서를 초기화하시겠습니까?')) {
      setFormData({
        customerName: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        testStandard: 'NON_GLP',
        animalSpecies: '',
        sampleTypes: [],
        totalSamples: 0,
        maleSamples: 0,
        femaleSamples: 0,
        selectedItems: [],
        discountType: null,
        discountValue: 0,
        discountReason: '',
        validDays: 60,
        notes: '',
      });
      setCurrentStep(1);
      setCalculation(null);
    }
  };

  const handleSave = async () => {
    if (!validateStep(currentStep)) return;
    
    setIsLoading(true);
    try {
      const response = await clinicalPathologyApi.createQuotation({
        customerName: formData.customerName,
        contactName: formData.contactName,
        contactPhone: formData.contactPhone || undefined,
        contactEmail: formData.contactEmail || undefined,
        testStandard: formData.testStandard,
        animalSpecies: formData.animalSpecies,
        sampleTypes: formData.sampleTypes,
        totalSamples: formData.totalSamples,
        maleSamples: formData.maleSamples,
        femaleSamples: formData.femaleSamples,
        items: formData.selectedItems.map(id => ({ testItemId: id, quantity: formData.totalSamples })),
        discountType: formData.discountType || undefined,
        discountValue: formData.discountValue || undefined,
        discountReason: formData.discountReason || undefined,
        validDays: formData.validDays,
        notes: formData.notes || undefined,
      });
      
      toast({ title: '견적서가 저장되었습니다' });
      router.push(`/clinical-pathology/quotations`);
    } catch (error: any) {
      toast({ 
        title: '저장 실패', 
        description: error.message || '견적서 저장에 실패했습니다',
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value);
  };

  // Step 1: 기본정보
  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle>기본정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">의뢰기관 *</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={e => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
              placeholder="의뢰기관명을 입력하세요"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactName">담당자 *</Label>
            <Input
              id="contactName"
              value={formData.contactName}
              onChange={e => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
              placeholder="담당자명을 입력하세요"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">연락처</Label>
            <Input
              id="contactPhone"
              value={formData.contactPhone}
              onChange={e => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
              placeholder="010-0000-0000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">이메일</Label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={e => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
              placeholder="email@example.com"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>시험기준</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="testStandard"
                checked={formData.testStandard === 'GLP'}
                onChange={() => setFormData(prev => ({ ...prev, testStandard: 'GLP' }))}
                className="w-4 h-4"
              />
              <span>GLP</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="testStandard"
                checked={formData.testStandard === 'NON_GLP'}
                onChange={() => setFormData(prev => ({ ...prev, testStandard: 'NON_GLP' }))}
                className="w-4 h-4"
              />
              <span>Non-GLP</span>
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Step 2: 검체정보
  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle>검체정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>동물 종 *</Label>
          <Select
            value={formData.animalSpecies}
            onValueChange={value => setFormData(prev => ({ ...prev, animalSpecies: value }))}
          >
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="동물 종을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {ANIMAL_SPECIES.map(species => (
                <SelectItem key={species.value} value={species.value}>
                  {species.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>검체 종류 * (복수 선택 가능)</Label>
          <div className="flex flex-wrap gap-4">
            {(Object.keys(SAMPLE_TYPE_LABELS) as SampleType[]).map(type => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.sampleTypes.includes(type)}
                  onCheckedChange={() => handleSampleTypeToggle(type)}
                />
                <span>{SAMPLE_TYPE_LABELS[type]}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>검체 수 *</Label>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span>총</span>
              <Input
                type="number"
                min={0}
                value={formData.totalSamples || ''}
                onChange={e => setFormData(prev => ({ ...prev, totalSamples: parseInt(e.target.value) || 0 }))}
                className="w-24"
              />
              <span>개</span>
            </div>
            <span className="text-gray-500">(</span>
            <div className="flex items-center gap-2">
              <span>수컷</span>
              <Input
                type="number"
                min={0}
                value={formData.maleSamples || ''}
                onChange={e => setFormData(prev => ({ ...prev, maleSamples: parseInt(e.target.value) || 0 }))}
                className="w-20"
              />
            </div>
            <div className="flex items-center gap-2">
              <span>암컷</span>
              <Input
                type="number"
                min={0}
                value={formData.femaleSamples || ''}
                onChange={e => setFormData(prev => ({ ...prev, femaleSamples: parseInt(e.target.value) || 0 }))}
                className="w-20"
              />
            </div>
            <span className="text-gray-500">)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Step 3: 검사항목 선택
  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle>검사항목 선택</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {availableCategories.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            검체 종류를 먼저 선택해주세요
          </p>
        ) : (
          availableCategories.map(category => {
            const items = groupedItems[category] || [];
            const selectedCount = items.filter(item => formData.selectedItems.includes(item.id)).length;
            const allSelected = items.length > 0 && selectedCount === items.length;
            
            return (
              <div key={category} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800">{CATEGORY_LABELS[category]}</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCategorySelectAll(category, true)}
                      disabled={allSelected}
                    >
                      전체선택
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCategorySelectAll(category, false)}
                      disabled={selectedCount === 0}
                    >
                      전체해제
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {items.map(item => {
                    const isSelected = formData.selectedItems.includes(item.id);
                    const requiresCbc = item.requiresItem && testItems.find(i => i.id === item.requiresItem)?.code === 'CBC';
                    
                    return (
                      <label
                        key={item.id}
                        className={cn(
                          'flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors',
                          isSelected ? 'bg-purple-50 border-purple-300' : 'hover:bg-gray-50'
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleItemToggle(item.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-sm">{item.code}</span>
                            {requiresCbc && (
                              <span className="text-xs text-orange-600">⚠️ CBC 필수</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 truncate">{item.nameKr}</div>
                          <div className="text-xs text-purple-600">{formatCurrency(item.unitPrice)}원</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );

  // Step 4: 금액확인
  const renderStep4 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>금액 상세</CardTitle>
        </CardHeader>
        <CardContent>
          {calculation ? (
            <div className="space-y-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">항목</th>
                    <th className="text-right py-2">단가</th>
                    <th className="text-right py-2">수량</th>
                    <th className="text-right py-2">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {calculation.items.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2">{item.code} - {item.nameKr}</td>
                      <td className="text-right">{formatCurrency(item.unitPrice)}원</td>
                      <td className="text-right">{item.quantity}</td>
                      <td className="text-right">{formatCurrency(item.amount)}원</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-b">
                    <td colSpan={3} className="py-2 font-medium">소계</td>
                    <td className="text-right font-medium">{formatCurrency(calculation.subtotal)}원</td>
                  </tr>
                  {calculation.totalQcFee > 0 && (
                    <tr className="border-b">
                      <td colSpan={3} className="py-2">QC 비용</td>
                      <td className="text-right">{formatCurrency(calculation.totalQcFee)}원</td>
                    </tr>
                  )}
                  {calculation.discountAmount > 0 && (
                    <tr className="border-b text-red-600">
                      <td colSpan={3} className="py-2">할인</td>
                      <td className="text-right">-{formatCurrency(calculation.discountAmount)}원</td>
                    </tr>
                  )}
                  <tr className="border-b">
                    <td colSpan={3} className="py-2">부가세 (10%)</td>
                    <td className="text-right">{formatCurrency(calculation.vatAmount)}원</td>
                  </tr>
                  <tr className="font-bold text-lg">
                    <td colSpan={3} className="py-3">최종 금액</td>
                    <td className="text-right text-purple-600">{formatCurrency(calculation.totalAmount)}원</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">금액을 계산 중입니다...</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>할인 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="discountType"
                checked={formData.discountType === 'RATE'}
                onChange={() => setFormData(prev => ({ ...prev, discountType: 'RATE' }))}
                className="w-4 h-4"
              />
              <span>할인율 (%)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="discountType"
                checked={formData.discountType === 'AMOUNT'}
                onChange={() => setFormData(prev => ({ ...prev, discountType: 'AMOUNT' }))}
                className="w-4 h-4"
              />
              <span>할인금액 (원)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="discountType"
                checked={formData.discountType === null}
                onChange={() => setFormData(prev => ({ ...prev, discountType: null, discountValue: 0 }))}
                className="w-4 h-4"
              />
              <span>할인 없음</span>
            </label>
          </div>
          {formData.discountType && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                value={formData.discountValue || ''}
                onChange={e => setFormData(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                className="w-32"
              />
              <span>{formData.discountType === 'RATE' ? '%' : '원'}</span>
            </div>
          )}
          <div className="space-y-2">
            <Label>할인 사유</Label>
            <Input
              value={formData.discountReason}
              onChange={e => setFormData(prev => ({ ...prev, discountReason: e.target.value }))}
              placeholder="할인 사유를 입력하세요"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>추가 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Label>유효기간:</Label>
            <Input
              type="number"
              min={1}
              value={formData.validDays}
              onChange={e => setFormData(prev => ({ ...prev, validDays: parseInt(e.target.value) || 60 }))}
              className="w-20"
            />
            <span>일</span>
          </div>
          <div className="space-y-2">
            <Label>비고</Label>
            <Textarea
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="추가 메모를 입력하세요"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="임상병리검사 견적서 작성"
        description="단계별로 임상병리검사 견적서를 작성합니다"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/quotations/new')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              유형 선택
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              초기화
            </Button>
          </div>
        }
      />

      {/* 스텝 인디케이터 */}
      <div className="flex items-center justify-between mb-8 mt-6">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors',
                  currentStep === step.id
                    ? 'bg-purple-600 text-white'
                    : currentStep > step.id
                    ? 'bg-purple-100 text-purple-600'
                    : 'bg-gray-100 text-gray-400'
                )}
              >
                {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
              </div>
              <div className="mt-2 text-center">
                <div className={cn(
                  'text-sm font-medium',
                  currentStep === step.id ? 'text-purple-600' : 'text-gray-500'
                )}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-400">{step.description}</div>
              </div>
            </div>
            {index < STEPS.length - 1 && (
              <div className={cn(
                'flex-1 h-0.5 mx-4',
                currentStep > step.id ? 'bg-purple-300' : 'bg-gray-200'
              )} />
            )}
          </div>
        ))}
      </div>

      {/* 스텝 컨텐츠 */}
      <div className="mb-8">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>

      {/* 네비게이션 버튼 */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          이전
        </Button>
        <div className="flex gap-2">
          {currentStep < 4 ? (
            <Button onClick={handleNext}>
              다음
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? '저장 중...' : '견적서 저장'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
