'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Loader2, 
  Search, 
  Check,
  AlertCircle,
  RefreshCw,
  Plus
} from 'lucide-react';
import { getCustomers, Customer, CustomerGrade } from '@/lib/data-api';
import { getLeads, Lead, createLead } from '@/lib/lead-api';
import DetailedCustomerForm, { CreateLeadDTO } from './DetailedCustomerForm';
import { useToast } from '@/hooks/use-toast';

// CustomerSelector Props 인터페이스 (설계 문서 기반)
export interface CustomerSelectorProps {
  selectedCustomerId: string | null;
  selectedLeadId: string | null;
  onCustomerSelect: (customerId: string, customerName: string) => void;
  onLeadSelect: (lead: Lead) => void;
  onNewCustomerCreate?: (lead: Lead) => void;
}

// 고객 등급 배지 설정
const gradeConfig: Record<CustomerGrade, { label: string; className: string }> = {
  LEAD: { label: '리드', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  PROSPECT: { label: '잠재고객', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  CUSTOMER: { label: '고객', className: 'bg-green-100 text-green-700 border-green-200' },
  VIP: { label: 'VIP', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  INACTIVE: { label: '비활성', className: 'bg-red-100 text-red-700 border-red-200' },
};

// 리드 상태 배지 설정
const leadStatusConfig: Record<string, { label: string; className: string }> = {
  NEW: { label: '신규', className: 'bg-blue-100 text-blue-700' },
  CONTACTED: { label: '연락완료', className: 'bg-cyan-100 text-cyan-700' },
  QUALIFIED: { label: '검토중', className: 'bg-yellow-100 text-yellow-700' },
  PROPOSAL: { label: '견적발송', className: 'bg-orange-100 text-orange-700' },
  NEGOTIATION: { label: '협상중', className: 'bg-pink-100 text-pink-700' },
  CONVERTED: { label: '전환완료', className: 'bg-green-100 text-green-700' },
  LOST: { label: '실패', className: 'bg-gray-100 text-gray-700' },
};

// 유입경로 라벨
const sourceLabels: Record<string, string> = {
  WEBSITE: '웹사이트',
  REFERRAL: '소개',
  COLD_CALL: '콜드콜',
  EXHIBITION: '전시회',
  ADVERTISEMENT: '광고',
  PARTNER: '파트너',
  OTHER: '기타',
};

export default function CustomerSelector({
  selectedCustomerId,
  selectedLeadId,
  onCustomerSelect,
  onLeadSelect,
  onNewCustomerCreate,
}: CustomerSelectorProps) {
  const { toast } = useToast();
  
  // 상태 관리
  const [activeTab, setActiveTab] = useState<'customers' | 'leads'>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [leadSearch, setLeadSearch] = useState('');
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [leadError, setLeadError] = useState<string | null>(null);
  
  // 신규 고객 등록 다이얼로그 상태 (Requirements 1.5)
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [isCreatingLead, setIsCreatingLead] = useState(false);

  // 고객 목록 로드 (Requirements 1.2: grade가 CUSTOMER 이상인 고객)
  const loadCustomers = useCallback(async () => {
    setIsLoadingCustomers(true);
    setCustomerError(null);
    try {
      const response = await getCustomers({ 
        limit: 100,
        search: customerSearch || undefined,
      });
      if (response.success && response.data) {
        // grade가 CUSTOMER, VIP인 고객만 필터링 (Requirements 1.2)
        const customerList = response.data.data || [];
        const filteredCustomers = customerList.filter(
          (c: Customer) => c.grade === 'CUSTOMER' || c.grade === 'VIP'
        );
        setCustomers(filteredCustomers);
      } else {
        setCustomerError(response.error?.message || '고객 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
      setCustomerError('고객 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingCustomers(false);
    }
  }, [customerSearch]);

  // 리드 목록 로드 (Requirements 1.3: status가 CONVERTED가 아닌 리드)
  const loadLeads = useCallback(async () => {
    setIsLoadingLeads(true);
    setLeadError(null);
    try {
      const response = await getLeads({ 
        limit: 100,
        excludeConverted: true, // CONVERTED 상태 제외
        search: leadSearch || undefined,
      });
      if (response.success && response.data) {
        setLeads(response.data.leads || []);
      } else {
        setLeadError(response.error?.message || '리드 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to load leads:', error);
      setLeadError('리드 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingLeads(false);
    }
  }, [leadSearch]);

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (activeTab === 'customers') {
      loadCustomers();
    } else {
      loadLeads();
    }
  }, [activeTab, loadCustomers, loadLeads]);

  // 고객 선택 핸들러
  const handleCustomerSelect = (customer: Customer) => {
    onCustomerSelect(customer.id, customer.company || customer.name);
  };

  // 리드 선택 핸들러 (Requirements 1.4: 데이터 자동 채우기)
  const handleLeadSelect = (lead: Lead) => {
    onLeadSelect(lead);
  };

  /**
   * 신규 고객 폼 제출 핸들러 (Requirements 1.6)
   * 폼 제출 시 Lead API를 호출하여 리드를 생성하고 견적서에 연결합니다.
   */
  const handleNewCustomerSubmit = async (data: CreateLeadDTO) => {
    setIsCreatingLead(true);
    try {
      const response = await createLead({
        companyName: data.companyName,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        department: data.department,
        position: data.position,
        source: data.source,
        inquiryType: data.inquiryType,
        inquiryDetail: data.inquiryDetail,
        expectedAmount: data.expectedAmount,
        expectedDate: data.expectedDate,
      });

      if (response.success && response.data?.lead) {
        const newLead = response.data.lead;
        
        // 리드 목록에 추가
        setLeads((prev) => [newLead, ...prev]);
        
        // 생성된 리드를 견적서에 연결 (Requirements 1.6)
        onLeadSelect(newLead);
        
        // onNewCustomerCreate 콜백이 있으면 호출
        if (onNewCustomerCreate) {
          onNewCustomerCreate(newLead);
        }
        
        // 다이얼로그 닫기
        setShowNewCustomerDialog(false);
        
        // 리드 목록 탭으로 전환
        setActiveTab('leads');
        
        toast({
          title: '등록 완료',
          description: `${newLead.companyName}이(가) 리드로 등록되었습니다.`,
        });
      } else {
        toast({
          title: '등록 실패',
          description: response.error?.message || '리드 등록에 실패했습니다.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to create lead:', error);
      toast({
        title: '등록 실패',
        description: '리드 등록 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingLead(false);
    }
  };

  // 고객 카드 렌더링
  const renderCustomerCard = (customer: Customer) => {
    const isSelected = selectedCustomerId === customer.id;
    const gradeInfo = gradeConfig[customer.grade] || gradeConfig.CUSTOMER;

    return (
      <div
        key={customer.id}
        onClick={() => handleCustomerSelect(customer)}
        className={`
          p-4 rounded-lg border cursor-pointer transition-all duration-200
          ${isSelected 
            ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' 
            : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
          }
        `}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="font-medium text-gray-900 truncate">
                {customer.company || customer.name}
              </span>
              {isSelected && (
                <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
              )}
            </div>
            {customer.name && customer.company && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <User className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{customer.name}</span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{customer.email}</span>
              </div>
            )}
          </div>
          <Badge className={`ml-2 flex-shrink-0 ${gradeInfo.className}`}>
            {gradeInfo.label}
          </Badge>
        </div>
      </div>
    );
  };

  // 리드 카드 렌더링
  const renderLeadCard = (lead: Lead) => {
    const isSelected = selectedLeadId === lead.id;
    const statusInfo = leadStatusConfig[lead.status] || leadStatusConfig.NEW;

    return (
      <div
        key={lead.id}
        onClick={() => handleLeadSelect(lead)}
        className={`
          p-4 rounded-lg border cursor-pointer transition-all duration-200
          ${isSelected 
            ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' 
            : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
          }
        `}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="font-medium text-gray-900 truncate">
                {lead.companyName}
              </span>
              {isSelected && (
                <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <User className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{lead.contactName}</span>
              {lead.position && (
                <span className="text-gray-400">({lead.position})</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              {lead.contactEmail && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate max-w-[150px]">{lead.contactEmail}</span>
                </div>
              )}
              {lead.contactPhone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  <span>{lead.contactPhone}</span>
                </div>
              )}
            </div>
            {lead.source && (
              <div className="mt-2 text-xs text-gray-400">
                유입경로: {sourceLabels[lead.source] || lead.source}
              </div>
            )}
          </div>
          <Badge className={`ml-2 flex-shrink-0 ${statusInfo.className}`}>
            {statusInfo.label}
          </Badge>
        </div>
      </div>
    );
  };

  // 에러 상태 렌더링
  const renderError = (error: string, onRetry: () => void) => (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
      <p className="text-sm text-gray-600 mb-4">{error}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="w-4 h-4 mr-2" />
        다시 시도
      </Button>
    </div>
  );

  // 로딩 상태 렌더링
  const renderLoading = () => (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      <span className="ml-2 text-sm text-gray-500">로딩 중...</span>
    </div>
  );

  // 빈 상태 렌더링
  const renderEmpty = (message: string) => (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Building2 className="w-10 h-10 text-gray-300 mb-3" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {/* Requirements 1.1: "기존 고객", "리드 목록" 두 가지 탭 표시 */}
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'customers' | 'leads')}
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              기존 고객
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              리드 목록
            </TabsTrigger>
          </TabsList>

          {/* 기존 고객 탭 */}
          <TabsContent value="customers" className="mt-0">
            {/* 검색 입력 */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="고객사명 또는 담당자명으로 검색..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 고객 목록 */}
            <ScrollArea className="h-[300px]">
              {isLoadingCustomers ? (
                renderLoading()
              ) : customerError ? (
                renderError(customerError, loadCustomers)
              ) : customers.length === 0 ? (
                renderEmpty(
                  customerSearch 
                    ? '검색 결과가 없습니다.' 
                    : '등록된 고객이 없습니다.'
                )
              ) : (
                <div className="space-y-2 pr-4">
                  {customers.map(renderCustomerCard)}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* 리드 목록 탭 */}
          <TabsContent value="leads" className="mt-0">
            {/* 검색 입력 */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="회사명 또는 담당자명으로 검색..."
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 리드 목록 */}
            <ScrollArea className="h-[300px]">
              {isLoadingLeads ? (
                renderLoading()
              ) : leadError ? (
                renderError(leadError, loadLeads)
              ) : leads.length === 0 ? (
                renderEmpty(
                  leadSearch 
                    ? '검색 결과가 없습니다.' 
                    : '등록된 리드가 없습니다.'
                )
              ) : (
                <div className="space-y-2 pr-4">
                  {leads.map(renderLeadCard)}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Requirements 1.5: 신규 고객 등록 버튼 */}
        <div className="mt-4 pt-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowNewCustomerDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            신규 고객 등록
          </Button>
        </div>

        {/* 신규 고객 등록 다이얼로그 (Requirements 1.5, 1.6) */}
        <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>신규 고객 등록</DialogTitle>
            </DialogHeader>
            <DetailedCustomerForm
              onSubmit={handleNewCustomerSubmit}
              onCancel={() => setShowNewCustomerDialog(false)}
              isLoading={isCreatingLead}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
