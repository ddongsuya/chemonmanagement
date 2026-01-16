'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LayoutDashboard,
  Users,
  FlaskConical,
  Receipt,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { Customer } from '@/types/customer';
import OverviewTab from './tabs/OverviewTab';
import RequesterTab from './tabs/RequesterTab';
import TestReceptionTab from './tabs/TestReceptionTab';
import InvoiceScheduleTab from './tabs/InvoiceScheduleTab';
import MeetingRecordTab from './tabs/MeetingRecordTab';
import TimelineTab from './tabs/TimelineTab';

/**
 * CustomerDetailTabs - 고객사 상세 페이지 탭 컨테이너
 * Requirements: 7.1 - 회사정보, 의뢰자목록, 진행단계, 견적/계약이력, 시험목록, 미팅기록을 탭으로 구분하여 표시
 */

export type TabValue = 'overview' | 'requesters' | 'test-receptions' | 'invoices' | 'meetings' | 'timeline';

interface CustomerDetailTabsProps {
  customer: Customer;
  quotationCount?: number;
  totalAmount?: number;
  contractId?: string;
  quotationId?: string;
  isContractCompleted?: boolean;
  defaultTab?: TabValue;
  onTabChange?: (tab: TabValue) => void;
  onQuickAction?: (action: 'quotation' | 'meeting' | 'test_reception') => void;
}

interface TabConfig {
  value: TabValue;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabConfig[] = [
  { value: 'overview', label: '개요', icon: <LayoutDashboard className="w-4 h-4" /> },
  { value: 'requesters', label: '의뢰자', icon: <Users className="w-4 h-4" /> },
  { value: 'test-receptions', label: '시험접수', icon: <FlaskConical className="w-4 h-4" /> },
  { value: 'invoices', label: '세금계산서', icon: <Receipt className="w-4 h-4" /> },
  { value: 'meetings', label: '미팅기록', icon: <MessageSquare className="w-4 h-4" /> },
  { value: 'timeline', label: '타임라인', icon: <Clock className="w-4 h-4" /> },
];

export default function CustomerDetailTabs({
  customer,
  quotationCount = 0,
  totalAmount = 0,
  contractId = '',
  quotationId = '',
  isContractCompleted = false,
  defaultTab = 'overview',
  onTabChange,
  onQuickAction,
}: CustomerDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>(defaultTab);

  const handleTabChange = (value: string) => {
    const tabValue = value as TabValue;
    setActiveTab(tabValue);
    onTabChange?.(tabValue);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-6 mb-6">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="flex items-center gap-2"
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="overview">
        <OverviewTab
          customer={customer}
          quotationCount={quotationCount}
          totalAmount={totalAmount}
          onQuickAction={onQuickAction}
        />
      </TabsContent>

      <TabsContent value="requesters">
        <RequesterTab customerId={customer.id} />
      </TabsContent>

      <TabsContent value="test-receptions">
        <TestReceptionTab
          customerId={customer.id}
          contractId={contractId}
          quotationId={quotationId}
          isContractCompleted={isContractCompleted}
        />
      </TabsContent>

      <TabsContent value="invoices">
        <InvoiceScheduleTab customerId={customer.id} />
      </TabsContent>

      <TabsContent value="meetings">
        <MeetingRecordTab customerId={customer.id} />
      </TabsContent>

      <TabsContent value="timeline">
        <TimelineTab customerId={customer.id} />
      </TabsContent>
    </Tabs>
  );
}
