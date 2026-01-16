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
import {
  ArrowLeft,
  Edit,
  Trash2,
} from 'lucide-react';
import { getAllQuotations } from '@/lib/quotation-storage';
import { getRequestersByCustomerId } from '@/lib/requester-storage';
import { Customer } from '@/types/customer';

/**
 * CustomerDetailPage - 고객사 상세 페이지
 * Requirements: 7.1 - 회사정보, 의뢰자목록, 진행단계, 견적/계약이력, 시험목록, 미팅기록을 탭으로 구분하여 표시
 * Requirements: 7.2 - 긴급 처리가 필요한 항목을 상단 알림 영역에 강조 표시
 * Requirements: 7.3 - 빠른 작업 버튼 (새 견적 작성, 미팅 기록, 시험 접수)
 */
export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [showTestReceptionDialog, setShowTestReceptionDialog] = useState(false);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabValue>('overview');
  const [customer, setCustomer] = useState<Customer | null>(null);

  // 고객사 데이터 로드
  useEffect(() => {
    // TODO: API에서 데이터 로드 (현재는 mock)
    const mockCustomer: Customer = {
      id: params.id as string,
      company_name: '(주)바이오팜',
      business_number: '123-45-67890',
      address: '서울시 강남구 테헤란로 123',
      contact_person: '김철수',
      contact_email: 'kim@biopharma.co.kr',
      contact_phone: '02-1234-5678',
      notes: null,
      created_at: '2024-01-15',
      updated_at: '2024-12-01',
      quotation_count: 0,
      total_amount: 0,
    };
    setCustomer(mockCustomer);
  }, [params.id]);

  // localStorage에서 해당 고객의 견적 이력 로드
  useEffect(() => {
    if (!customer) return;
    
    const allQuotations = getAllQuotations();
    // 고객명으로 필터링 (실제로는 customer_id로 필터링해야 함)
    const customerQuotations = allQuotations
      .filter(q => q.customer_name === customer.company_name || q.customer_id === params.id)
      .map(q => ({
        id: q.id,
        quotation_number: q.quotation_number,
        project_name: q.project_name,
        modality: q.modality,
        status: q.status,
        total_amount: q.total_amount,
        created_at: q.created_at.split('T')[0],
      }));
    setQuotations(customerQuotations);
  }, [params.id, customer]);

  const handleDelete = () => {
    // TODO: API 연동
    console.log('삭제:', customer?.company_name);
    router.push('/customers');
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
    // 미팅 기록 탭으로 이동
    setActiveTab('meetings');
  };

  // 시험 접수 저장 성공 핸들러
  const handleTestReceptionSuccess = () => {
    setShowTestReceptionDialog(false);
    // 시험 접수 탭으로 이동
    setActiveTab('test-receptions');
  };

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  // 통계 계산
  const quotationCount = quotations.length;
  const totalAmount = quotations.reduce((sum, q) => sum + q.total_amount, 0);

  // 계약 완료 여부 확인 (실제로는 계약 데이터에서 확인해야 함)
  const isContractCompleted = quotations.some(q => q.status === 'won');
  const contractId = ''; // TODO: 실제 계약 ID
  const quotationId = quotations.find(q => q.status === 'won')?.id || '';

  // 의뢰자 목록 로드
  const requesters = getRequestersByCustomerId(customer.id);

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
                  onSuccess={() => setShowEditDialog(false)}
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
