'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import CustomerForm from '@/components/customer/CustomerForm';
import CustomerDetailTabs, { TabValue } from '@/components/customer/CustomerDetailTabs';
import CustomerAlerts from '@/components/customer/CustomerAlerts';
import MeetingRecordForm from '@/components/customer/MeetingRecordForm';
import TestReceptionForm from '@/components/customer/TestReceptionForm';
import Skeleton from '@/components/ui/Skeleton';
import {
  ArrowLeft,
  Edit,
  Trash2,
} from 'lucide-react';
import { getCustomerById, getQuotations, deleteCustomer } from '@/lib/data-api';
import { requesterApi } from '@/lib/customer-data-api';
import { Customer, Requester } from '@/types/customer';
import { useToast } from '@/hooks/use-toast';

/**
 * CustomerDetailPage - 고객사 상세 페이지
 * Requirements: 7.1 - 회사정보, 의뢰자목록, 진행단계, 견적/계약이력, 시험목록, 미팅기록을 탭으로 구분하여 표시
 * Requirements: 7.2 - 긴급 처리가 필요한 항목을 상단 알림 영역에 강조 표시
 * Requirements: 7.3 - 빠른 작업 버튼 (새 견적 작성, 미팅 기록, 시험 접수)
 */
export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [showTestReceptionDialog, setShowTestReceptionDialog] = useState(false);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [activeTab, setActiveTab] = useState<TabValue>('overview');
  const [customer, setCustomer] = useState<Customer | null>(null);

  // 고객사 데이터 로드
  useEffect(() => {
    async function loadCustomer() {
      setLoading(true);
      try {
        const response = await getCustomerById(params.id as string);
        if (response.success && response.data) {
          const c = response.data;
          setCustomer({
            id: c.id,
            company_name: c.company || c.name,
            business_number: '',
            address: c.address || '',
            contact_person: c.name,
            contact_email: c.email || '',
            contact_phone: c.phone || '',
            notes: c.notes || null,
            created_at: c.createdAt,
            updated_at: c.updatedAt,
            quotation_count: 0,
            total_amount: 0,
          });
        } else {
          toast({
            title: '오류',
            description: response.error?.message || '고객 정보를 불러오는데 실패했습니다',
            variant: 'destructive',
          });
          router.push('/customers');
        }
      } catch (error) {
        toast({
          title: '오류',
          description: '서버 연결에 실패했습니다',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    loadCustomer();
  }, [params.id, router, toast]);

  // API에서 해당 고객의 견적 이력 로드
  useEffect(() => {
    if (!customer) return;
    
    async function loadQuotations() {
      try {
        const response = await getQuotations({ customerId: customer!.id, limit: 100 });
        if (response.success && response.data) {
          const customerQuotations = response.data.data.map(q => ({
            id: q.id,
            quotation_number: q.quotationNumber,
            project_name: q.projectName,
            modality: q.modality,
            status: q.status.toLowerCase(),
            total_amount: q.totalAmount,
            created_at: q.createdAt.split('T')[0],
          }));
          setQuotations(customerQuotations);
        }
      } catch (error) {
        console.error('Failed to load quotations:', error);
      }
    }
    loadQuotations();
  }, [customer]);

  const handleDelete = async () => {
    if (!customer) return;
    
    try {
      const response = await deleteCustomer(customer.id);
      if (response.success) {
        toast({
          title: '삭제 완료',
          description: `${customer.company_name}이(가) 삭제되었습니다`,
        });
        router.push('/customers');
      } else {
        toast({
          title: '삭제 실패',
          description: response.error?.message || '고객 삭제에 실패했습니다',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '서버 연결에 실패했습니다',
        variant: 'destructive',
      });
    }
  };

  // 빠른 작업 핸들러 - Requirements 7.3
  const handleQuickAction = useCallback((action: 'quotation' | 'meeting' | 'test_reception') => {
    switch (action) {
      case 'quotation':
        router.push(`/quotations/new?customerId=${params.id}`);
        break;
      case 'meeting':
        setShowMeetingDialog(true);
        break;
      case 'test_reception':
        setShowTestReceptionDialog(true);
        break;
    }
  }, [params.id, router]);

  // 알림에서 탭 이동 핸들러
  const handleAlertNavigate = useCallback((tab: string) => {
    setActiveTab(tab as TabValue);
  }, []);

  // 탭 변경 핸들러
  const handleTabChange = useCallback((tab: TabValue) => {
    setActiveTab(tab);
  }, []);

  // 미팅 기록 저장 성공 핸들러
  const handleMeetingSuccess = () => {
    setShowMeetingDialog(false);
    setActiveTab('meetings');
  };

  // 시험 접수 저장 성공 핸들러
  const handleTestReceptionSuccess = () => {
    setShowTestReceptionDialog(false);
    setActiveTab('test-receptions');
  };

  // 수정 성공 핸들러
  const handleEditSuccess = () => {
    setShowEditDialog(false);
    // 고객 데이터 다시 로드
    window.location.reload();
  };

  if (loading) {
    return (
      <div>
        <PageHeader
          title="고객사 상세"
          description="로딩 중..."
        />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">고객 정보를 찾을 수 없습니다</p>
      </div>
    );
  }

  // 통계 계산
  const quotationCount = quotations.length;
  const totalAmount = quotations.reduce((sum, q) => sum + q.total_amount, 0);

  // 계약 완료 여부 확인
  const isContractCompleted = quotations.some(q => q.status === 'accepted' || q.status === 'won');
  const contractId = '';
  const quotationId = quotations.find(q => q.status === 'accepted' || q.status === 'won')?.id || '';

  // 의뢰자 목록 로드
  useEffect(() => {
    if (!customer) return;
    
    async function loadRequesters() {
      try {
        const data = await requesterApi.getByCustomerId(customer!.id);
        setRequesters(data);
      } catch (error) {
        console.error('Failed to load requesters:', error);
      }
    }
    loadRequesters();
  }, [customer]);

  return (
    <div>
      <PageHeader
        title={customer.company_name}
        description="고객사 상세 정보"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/customers">
                <ArrowLeft className="w-4 h-4 mr-2" /> 목록
              </Link>
            </Button>
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" /> 수정
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <CustomerForm
                  customer={customer as any}
                  onSuccess={handleEditSuccess}
                />
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" /> 삭제
            </Button>
          </div>
        }
      />

      {/* 긴급 알림 영역 - Requirements 7.2 */}
      <CustomerAlerts
        customerId={customer.id}
        onNavigate={handleAlertNavigate}
      />

      {/* 탭 기반 레이아웃 - Requirements 7.1 */}
      <CustomerDetailTabs
        customer={customer}
        quotationCount={quotationCount}
        totalAmount={totalAmount}
        contractId={contractId}
        quotationId={quotationId}
        isContractCompleted={isContractCompleted}
        defaultTab={activeTab}
        onTabChange={handleTabChange}
        onQuickAction={handleQuickAction}
      />

      {/* 삭제 확인 Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>고객사 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{customer.company_name}</strong>을(를) 삭제하시겠습니까?
              <br />
              관련된 견적서는 삭제되지 않습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 미팅 기록 추가 Dialog - Requirements 7.3 */}
      <Dialog open={showMeetingDialog} onOpenChange={setShowMeetingDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <MeetingRecordForm
            customerId={customer.id}
            onSuccess={handleMeetingSuccess}
            onCancel={() => setShowMeetingDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 시험 접수 추가 Dialog - Requirements 7.3 */}
      <Dialog open={showTestReceptionDialog} onOpenChange={setShowTestReceptionDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <TestReceptionForm
            customerId={customer.id}
            contractId={contractId}
            quotationId={quotationId}
            requesters={requesters}
            onSuccess={handleTestReceptionSuccess}
            onCancel={() => setShowTestReceptionDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
