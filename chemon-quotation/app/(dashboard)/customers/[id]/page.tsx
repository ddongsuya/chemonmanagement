'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import Skeleton from '@/components/ui/Skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getCustomerById, updateCustomer, Customer } from '@/lib/data-api';
import { customerLeadCheckApi } from '@/lib/customer-data-api';
import CustomerForm from '@/components/customer/CustomerForm';
import CustomerSummaryHeader from '@/components/customer-detail/CustomerSummaryHeader';
import OverviewTab from '@/components/customer-detail/OverviewTab';
import MeetingRecordTab from '@/components/customer-detail/MeetingRecordTab';
import TestReceptionTab from '@/components/customer-detail/TestReceptionTab';
import InvoiceScheduleTab from '@/components/customer-detail/InvoiceScheduleTab';
import RequesterTab from '@/components/customer-detail/RequesterTab';
import QuotationTab from '@/components/customer-detail/QuotationTab';
import ContractTab from '@/components/customer-detail/ContractTab';
import LeadActivityTab from '@/components/customer-detail/LeadActivityTab';
import ConsultationTab from '@/components/customer-detail/ConsultationTab';
import CalendarView from '@/components/calendar/CalendarView';

type TabType = 'overview' | 'calendar' | 'meetings' | 'tests' | 'invoices' | 'requesters'
  | 'quotations' | 'contracts' | 'lead-activities' | 'consultations';

/**
 * 고객 상세 페이지 (탭 기반 UI)
 */
export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [gradeUpdating, setGradeUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [hasLinkedLead, setHasLinkedLead] = useState(false);

  const loadCustomer = async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const response = await getCustomerById(customerId);
      if (response.success && response.data) {
        setCustomer(response.data);
        // 리드 연결 여부 확인
        customerLeadCheckApi.hasLinkedLead(customerId).then(setHasLinkedLead).catch(() => {});
      } else {
        toast({
          title: '오류',
          description: response.error?.message || '고객 정보를 불러오는데 실패했습니다',
          variant: 'destructive',
        });
        router.push('/customers');
      }
    } catch {
      toast({ title: '오류', description: '서버 연결에 실패했습니다', variant: 'destructive' });
      router.push('/customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCustomer(); }, [customerId]);

  const handleGradeChange = async (newGrade: string) => {
    if (!customer) return;
    setGradeUpdating(true);
    try {
      const response = await updateCustomer(customer.id, { grade: newGrade as any });
      if (response.success) {
        setCustomer(prev => prev ? { ...prev, grade: newGrade as any } : null);
        const label = { LEAD: '리드', PROSPECT: '잠재고객', CUSTOMER: '고객', VIP: 'VIP', INACTIVE: '비활성' }[newGrade] || newGrade;
        toast({ title: '등급 변경 완료', description: `${label}(으)로 변경되었습니다.` });
      } else {
        toast({ title: '오류', description: response.error?.message || '등급 변경에 실패했습니다.', variant: 'destructive' });
      }
    } catch {
      toast({ title: '오류', description: '서버 연결에 실패했습니다.', variant: 'destructive' });
    } finally {
      setGradeUpdating(false);
    }
  };

  const handleEditSuccess = () => {
    setEditOpen(false);
    loadCustomer();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
        <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div>
      <CustomerSummaryHeader
        customer={{
          id: customer.id,
          company: customer.company,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          grade: customer.grade,
        }}
        onGradeChange={handleGradeChange}
        gradeUpdating={gradeUpdating}
        onEdit={() => setEditOpen(true)}
        onBack={() => router.back()}
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
        <TabsList className="w-full overflow-x-auto flex justify-start">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="calendar">캘린더</TabsTrigger>
          <TabsTrigger value="meetings">미팅 기록</TabsTrigger>
          <TabsTrigger value="quotations">견적서</TabsTrigger>
          <TabsTrigger value="contracts">계약</TabsTrigger>
          <TabsTrigger value="tests">시험 접수</TabsTrigger>
          <TabsTrigger value="invoices">세금계산서</TabsTrigger>
          <TabsTrigger value="consultations">상담기록</TabsTrigger>
          {hasLinkedLead && <TabsTrigger value="lead-activities">리드 활동</TabsTrigger>}
          <TabsTrigger value="requesters">의뢰자</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab
            customer={customer}
            customerId={customerId}
            onTabChange={setActiveTab}
          />
        </TabsContent>

        <TabsContent value="calendar">
          <CalendarView customerId={customerId} />
        </TabsContent>

        <TabsContent value="meetings">
          <MeetingRecordTab customerId={customerId} />
        </TabsContent>

        <TabsContent value="tests">
          <TestReceptionTab customerId={customerId} />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoiceScheduleTab customerId={customerId} />
        </TabsContent>

        <TabsContent value="quotations">
          <QuotationTab customerId={customerId} />
        </TabsContent>

        <TabsContent value="contracts">
          <ContractTab customerId={customerId} />
        </TabsContent>

        <TabsContent value="consultations">
          <ConsultationTab customerId={customerId} />
        </TabsContent>

        {hasLinkedLead && (
          <TabsContent value="lead-activities">
            <LeadActivityTab customerId={customerId} />
          </TabsContent>
        )}

        <TabsContent value="requesters">
          <RequesterTab customerId={customerId} />
        </TabsContent>
      </Tabs>

      {/* 수정 다이얼로그 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <CustomerForm
            customer={{
              id: customer.id,
              company_name: customer.company || '',
              business_number: null,
              address: customer.address || null,
              contact_person: customer.name,
              contact_email: customer.email || null,
              contact_phone: customer.phone || null,
              notes: customer.notes || null,
              created_at: customer.createdAt,
              updated_at: customer.updatedAt,
              quotation_count: 0,
              total_amount: 0,
              grade: customer.grade as any,
            }}
            onSuccess={handleEditSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
