'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Skeleton from '@/components/ui/Skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { getCustomerById, updateCustomer, Customer } from '@/lib/data-api';
import { customerLeadCheckApi, requesterApi } from '@/lib/customer-data-api';
import { getHealthScore, getDataQuality } from '@/lib/unified-customer-api';
import type { Requester } from '@/types/customer';
import RequesterSelector from '@/components/customer-detail/RequesterSelector';
import CustomerForm from '@/components/customer/CustomerForm';
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
import NotesTab from '@/components/customer-detail/NotesTab';
import DocumentsTab from '@/components/customer-detail/DocumentsTab';
import AuditLogTab from '@/components/customer-detail/AuditLogTab';
import CustomFieldsSection from '@/components/customer-detail/CustomFieldsSection';
import ActivityTimelineTab from '@/components/customer-detail/ActivityTimelineTab';
import ProjectManagementTab from '@/components/customer-detail/ProjectManagementTab';
import InlineMeetingForm from '@/components/customer-detail/InlineMeetingForm';
import InlineRequesterForm from '@/components/customer-detail/InlineRequesterForm';
import InlineConsultationForm from '@/components/customer-detail/InlineConsultationForm';
import InlineTestReceptionForm from '@/components/customer-detail/InlineTestReceptionForm';
import {
  ChevronRight, Edit, MoreHorizontal, Building2, User, Phone, Mail,
  Heart, TrendingDown, BarChart3, FileText, Briefcase, DollarSign,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── 상수 ───────────────────────────────────────────────
const GRADE_OPTIONS = [
  { value: 'LEAD', label: '리드', color: '#6B7280' },
  { value: 'PROSPECT', label: '잠재고객', color: '#3B82F6' },
  { value: 'CUSTOMER', label: '고객', color: '#10B981' },
  { value: 'VIP', label: 'VIP', color: '#8B5CF6' },
  { value: 'INACTIVE', label: '비활성', color: '#EF4444' },
] as const;

type TabType = 'overview' | 'calendar' | 'meetings' | 'tests' | 'invoices' | 'requesters'
  | 'quotations' | 'contracts' | 'lead-activities' | 'consultations'
  | 'notes' | 'documents' | 'audit-log' | 'activity-timeline' | 'projects';

const PRIMARY_TABS: { value: TabType; label: string }[] = [
  { value: 'overview', label: '개요' },
  { value: 'meetings', label: '미팅' },
  { value: 'quotations', label: '견적서' },
  { value: 'contracts', label: '계약' },
  { value: 'projects', label: '프로젝트 관리' },
  { value: 'tests', label: '시험접수' },
  { value: 'consultations', label: '상담' },
  { value: 'activity-timeline', label: '커뮤니케이션' },
];

const SECONDARY_TABS: { value: TabType; label: string }[] = [
  { value: 'calendar', label: '캘린더' },
  { value: 'invoices', label: '세금계산서' },
  { value: 'notes', label: '메모' },
  { value: 'documents', label: '문서' },
  { value: 'audit-log', label: '변경이력' },
  { value: 'requesters', label: '의뢰자' },
];

// ─── 유틸 ───────────────────────────────────────────────
function MiniGauge({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative h-9 w-9">
        <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3" className="stroke-muted" />
          <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3" stroke={color}
            strokeDasharray={`${(value / 100) * 94.2} 94.2`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold" style={{ color }}>{value}</span>
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, action }: {
  icon?: React.ElementType; label: string; value: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 group">
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground min-w-0">
        {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
        <span className="shrink-0">{label}</span>
      </div>
      <div className="flex items-center gap-2 text-sm font-medium text-right min-w-0">
        <span className="truncate">{value || '-'}</span>
        {action && <span className="opacity-0 group-hover:opacity-100 transition-opacity">{action}</span>}
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ──────────────────────────────────────
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
  const [tabReloadKey, setTabReloadKey] = useState(0);

  // 담당자 선택
  const [selectedRequesterId, setSelectedRequesterId] = useState<string | null>(null);
  const [selectedRequester, setSelectedRequester] = useState<Requester | null>(null);

  // CRM 점수
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [churnRisk, setChurnRisk] = useState<number | null>(null);
  const [dataQuality, setDataQuality] = useState<number | null>(null);

  const reloadTab = () => setTabReloadKey(k => k + 1);

  const loadCustomer = async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const response = await getCustomerById(customerId);
      if (response.success && response.data) {
        // email/phone이 object인 경우 방어 처리
        const data = response.data;
        if (data.email && typeof data.email !== 'string') data.email = '';
        if (data.phone && typeof data.phone !== 'string') data.phone = '';
        setCustomer(data);
        customerLeadCheckApi.hasLinkedLead(customerId).then(setHasLinkedLead).catch(() => {});
        // CRM 점수 로드
        const [hsRes, dqRes] = await Promise.allSettled([
          getHealthScore(customerId), getDataQuality(customerId),
        ]);
        if (hsRes.status === 'fulfilled' && hsRes.value.success && hsRes.value.data) {
          const d = hsRes.value.data as any;
          setHealthScore(d.score ?? null);
          setChurnRisk(d.churnRiskScore ?? null);
        }
        if (dqRes.status === 'fulfilled' && dqRes.value.success && dqRes.value.data) {
          const d = dqRes.value.data as any;
          setDataQuality(d.score ?? null);
        }
      } else {
        toast({ title: '오류', description: response.error?.message || '고객 정보를 불러오는데 실패했습니다', variant: 'destructive' });
        router.push('/customers');
      }
    } catch {
      toast({ title: '오류', description: '서버 연결에 실패했습니다', variant: 'destructive' });
      router.push('/customers');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadCustomer(); }, [customerId]);

  // 선택된 담당자 정보 로드
  useEffect(() => {
    if (!selectedRequesterId) {
      setSelectedRequester(null);
      return;
    }
    requesterApi.getById(selectedRequesterId).then(r => setSelectedRequester(r));
  }, [selectedRequesterId]);

  const handleGradeChange = async (newGrade: string) => {
    if (!customer) return;
    setGradeUpdating(true);
    try {
      const response = await updateCustomer(customer.id, { grade: newGrade as any });
      if (response.success) {
        setCustomer(prev => prev ? { ...prev, grade: newGrade as any } : null);
        const label = GRADE_OPTIONS.find(g => g.value === newGrade)?.label || newGrade;
        toast({ title: '등급 변경 완료', description: `${label}(으)로 변경되었습니다.` });
      } else {
        toast({ title: '오류', description: response.error?.message || '등급 변경에 실패했습니다.', variant: 'destructive' });
      }
    } catch {
      toast({ title: '오류', description: '서버 연결에 실패했습니다.', variant: 'destructive' });
    } finally { setGradeUpdating(false); }
  };

  const handleEditSuccess = () => { setEditOpen(false); loadCustomer(); };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse p-6">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-10 bg-muted rounded" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-32 bg-muted rounded" />
          <div className="h-32 bg-muted rounded col-span-2" />
        </div>
      </div>
    );
  }

  if (!customer) return null;

  const daysSinceCreated = customer.createdAt
    ? Math.floor((Date.now() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const gradeConfig = GRADE_OPTIONS.find(g => g.value === customer.grade) || GRADE_OPTIONS[2];
  const isSecondaryTab = SECONDARY_TABS.some(t => t.value === activeTab);

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* ─── Sticky 헤더 ─── */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* 브레드크럼 */}
          <div className="flex items-center gap-2 py-2.5 text-sm text-muted-foreground">
            <button onClick={() => router.push('/customers')} className="hover:text-foreground transition-colors">
              고객사 관리
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium truncate">{customer.company || customer.name}</span>
          </div>

          {/* 메인 헤더 */}
          <div className="flex items-start justify-between pb-4">
            <div className="flex items-start gap-4 min-w-0">
              {/* 이니셜 아바타 */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-semibold text-lg shrink-0">
                {(customer.company || customer.name).charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-semibold text-slate-900 truncate">
                    {customer.company || customer.name}
                  </h1>
                  {customer.grade === 'VIP' && (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">VIP</span>
                  )}
                  <Select value={customer.grade || 'CUSTOMER'} onValueChange={handleGradeChange} disabled={gradeUpdating}>
                    <SelectTrigger className="w-[110px] h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{customer.name}</span>
                  <span>·</span>
                  <span>{daysSinceCreated}일 거래</span>
                  {customer.phone && (
                    <a href={`tel:${customer.phone}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                      <Phone className="w-3.5 h-3.5" />{typeof customer.phone === 'string' ? customer.phone : ''}
                    </a>
                  )}
                  {customer.email && typeof customer.email === 'string' && (
                    <a href={`mailto:${customer.email}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                      <Mail className="w-3.5 h-3.5" />{customer.email}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* 우측: 점수 게이지 + 액션 */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="hidden sm:flex items-center gap-3">
                {healthScore != null && (
                  <MiniGauge value={healthScore} label="건강도"
                    color={healthScore >= 70 ? '#10B981' : healthScore >= 40 ? '#F59E0B' : '#EF4444'} />
                )}
                {churnRisk != null && (
                  <MiniGauge value={churnRisk} label="이탈위험"
                    color={churnRisk >= 70 ? '#EF4444' : churnRisk >= 40 ? '#F59E0B' : '#10B981'} />
                )}
                {dataQuality != null && (
                  <MiniGauge value={dataQuality} label="데이터"
                    color={dataQuality >= 70 ? '#10B981' : dataQuality >= 40 ? '#F59E0B' : '#EF4444'} />
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Edit className="w-3.5 h-3.5 mr-1.5" />수정
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm"><MoreHorizontal className="w-4 h-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.back()}>뒤로가기</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 담당자 선택 바 ─── */}
      <div className="bg-white border-b sticky top-[auto] z-[9]">
        <div className="max-w-7xl mx-auto">
          <RequesterSelector
            customerId={customerId}
            selectedRequesterId={selectedRequesterId}
            onSelect={setSelectedRequesterId}
          />
        </div>
      </div>

      {/* ─── 본문: 3컬럼 레이아웃 ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ─── 좌측 사이드바 ─── */}
          <div className="lg:col-span-1 space-y-4">
            {/* 모바일: 점수 게이지 */}
            <div className="flex sm:hidden items-center gap-3 justify-center bg-white rounded-xl border p-3">
              {healthScore != null && (
                <MiniGauge value={healthScore} label="건강도"
                  color={healthScore >= 70 ? '#10B981' : healthScore >= 40 ? '#F59E0B' : '#EF4444'} />
              )}
              {churnRisk != null && (
                <MiniGauge value={churnRisk} label="이탈위험"
                  color={churnRisk >= 70 ? '#EF4444' : churnRisk >= 40 ? '#F59E0B' : '#10B981'} />
              )}
              {dataQuality != null && (
                <MiniGauge value={dataQuality} label="데이터"
                  color={dataQuality >= 70 ? '#10B981' : dataQuality >= 40 ? '#F59E0B' : '#EF4444'} />
              )}
            </div>

            {/* 기본 정보 */}
            <div className="bg-white rounded-xl border">
              <div className="px-4 py-3 border-b">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> 기본 정보
                </h3>
              </div>
              <div className="px-4 py-1 divide-y divide-slate-100">
                <InfoRow icon={Building2} label="회사명" value={customer.company} />
                <InfoRow icon={User} label="담당자" value={customer.name} />
                {customer.address && <InfoRow label="주소" value={customer.address} />}
                <InfoRow label="등록일" value={new Date(customer.createdAt).toLocaleDateString('ko-KR')} />
                <InfoRow label="수정일" value={new Date(customer.updatedAt).toLocaleDateString('ko-KR')} />
              </div>
            </div>

            {/* 연락처 — 선택된 담당자 기준 */}
            <div className="bg-white rounded-xl border">
              <div className="px-4 py-3 border-b">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {selectedRequester ? `${selectedRequester.name} 연락처` : '연락처'}
                </h3>
              </div>
              <div className="px-4 py-1 divide-y divide-slate-100">
                {selectedRequester ? (
                  <>
                    <InfoRow icon={User} label="담당자" value={selectedRequester.name} />
                    {selectedRequester.position && <InfoRow label="직책" value={selectedRequester.position} />}
                    {selectedRequester.department && <InfoRow label="부서" value={selectedRequester.department} />}
                    <InfoRow icon={Phone} label="전화" value={selectedRequester.phone} action={
                      selectedRequester.phone ? <a href={`tel:${selectedRequester.phone}`} className="text-xs text-blue-600 hover:underline">통화</a> : null
                    } />
                    <InfoRow icon={Mail} label="이메일" value={selectedRequester.email} action={
                      selectedRequester.email ? <a href={`mailto:${selectedRequester.email}`} className="text-xs text-blue-600 hover:underline">발송</a> : null
                    } />
                  </>
                ) : (
                  <>
                    <InfoRow icon={Phone} label="전화" value={typeof customer.phone === 'string' ? customer.phone : ''} action={
                      customer.phone && typeof customer.phone === 'string' ? <a href={`tel:${customer.phone}`} className="text-xs text-blue-600 hover:underline">통화</a> : null
                    } />
                    <InfoRow icon={Mail} label="이메일" value={typeof customer.email === 'string' ? customer.email : ''} action={
                      customer.email && typeof customer.email === 'string' ? <a href={`mailto:${customer.email}`} className="text-xs text-blue-600 hover:underline">발송</a> : null
                    } />
                  </>
                )}
              </div>
            </div>

            {/* 메모 */}
            {customer.notes && (
              <div className="bg-white rounded-xl border">
                <div className="px-4 py-3 border-b">
                  <h3 className="text-sm font-semibold text-slate-900">메모</h3>
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{customer.notes}</p>
                </div>
              </div>
            )}

            {/* 커스텀 필드 */}
            <CustomFieldsSection customerId={customerId} />
          </div>

          {/* ─── 우측 메인 콘텐츠 ─── */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
              <div className="bg-white rounded-xl border">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0 overflow-x-auto no-scrollbar">
                  {PRIMARY_TABS.map(tab => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm shrink-0"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                  {hasLinkedLead && (
                    <TabsTrigger
                      value="lead-activities"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm shrink-0"
                    >
                      리드 활동
                    </TabsTrigger>
                  )}
                  {/* 더보기 드롭다운 */}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className={cn(
                        'px-4 py-3 text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 shrink-0',
                        isSecondaryTab && 'text-foreground font-medium'
                      )}
                    >
                      {isSecondaryTab
                        ? SECONDARY_TABS.find(t => t.value === activeTab)?.label
                        : '더보기'}
                      <ChevronDown className="w-3 h-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {SECONDARY_TABS.map(tab => (
                        <DropdownMenuItem key={tab.value} onClick={() => setActiveTab(tab.value)}>
                          {tab.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TabsList>

                {/* 탭 콘텐츠 */}
                <TabsContent value="overview" className="p-5 mt-0">
                  <OverviewTab customer={customer} customerId={customerId} onTabChange={setActiveTab} requesterId={selectedRequesterId} />
                </TabsContent>

                <TabsContent value="calendar" className="p-5 mt-0">
                  <CalendarView customerId={customerId} />
                </TabsContent>

                <TabsContent value="meetings" className="p-5 mt-0">
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <InlineMeetingForm customerId={customerId} requesterId={selectedRequesterId} onSuccess={reloadTab} />
                    </div>
                    <MeetingRecordTab key={`meetings-${tabReloadKey}-${selectedRequesterId}`} customerId={customerId} requesterId={selectedRequesterId} />
                  </div>
                </TabsContent>

                <TabsContent value="tests" className="p-5 mt-0">
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <InlineTestReceptionForm customerId={customerId} requesterId={selectedRequesterId} onSuccess={reloadTab} />
                    </div>
                    <TestReceptionTab key={`tests-${tabReloadKey}-${selectedRequesterId}`} customerId={customerId} requesterId={selectedRequesterId} />
                  </div>
                </TabsContent>

                <TabsContent value="invoices" className="p-5 mt-0">
                  <InvoiceScheduleTab customerId={customerId} />
                </TabsContent>

                <TabsContent value="quotations" className="p-5 mt-0">
                  <QuotationTab customerId={customerId} customerName={customer?.company || customer?.name} />
                </TabsContent>

                <TabsContent value="contracts" className="p-5 mt-0">
                  <ContractTab customerId={customerId} customerName={customer?.company || customer?.name} />
                </TabsContent>

                <TabsContent value="projects" className="p-5 mt-0">
                  <ProjectManagementTab customerId={customerId} />
                </TabsContent>

                <TabsContent value="consultations" className="p-5 mt-0">
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <InlineConsultationForm customerId={customerId} onSuccess={reloadTab} />
                    </div>
                    <ConsultationTab key={`consultations-${tabReloadKey}`} customerId={customerId} />
                  </div>
                </TabsContent>

                <TabsContent value="activity-timeline" className="p-5 mt-0">
                  <ActivityTimelineTab customerId={customerId} requesterId={selectedRequesterId} />
                </TabsContent>

                <TabsContent value="notes" className="p-5 mt-0">
                  <NotesTab customerId={customerId} />
                </TabsContent>

                <TabsContent value="documents" className="p-5 mt-0">
                  <DocumentsTab customerId={customerId} />
                </TabsContent>

                <TabsContent value="audit-log" className="p-5 mt-0">
                  <AuditLogTab customerId={customerId} />
                </TabsContent>

                {hasLinkedLead && (
                  <TabsContent value="lead-activities" className="p-5 mt-0">
                    <LeadActivityTab customerId={customerId} />
                  </TabsContent>
                )}

                <TabsContent value="requesters" className="p-5 mt-0">
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <InlineRequesterForm customerId={customerId} onSuccess={reloadTab} />
                    </div>
                    <RequesterTab key={`requesters-${tabReloadKey}`} customerId={customerId} />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

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
