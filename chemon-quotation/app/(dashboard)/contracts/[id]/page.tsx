'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StitchCard } from '@/components/ui/StitchCard';
import { StitchBadge } from '@/components/ui/StitchBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  StitchTable,
  StitchTableBody,
  StitchTableCell,
  StitchTableHead,
  StitchTableHeader,
  StitchTableRow,
} from '@/components/ui/StitchTable';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Edit,
  Trash2,
  Plus,
  FileText,
  FlaskConical,
  FileSignature,
} from 'lucide-react';
import WonSign from '@/components/icons/WonSign';
import {
  getContract,
  updateContract,
  deleteContract,
  updateContractStatus,
  createStudy,
  createAmendment,
  Contract,
  Study,
  ContractAmendment,
} from '@/lib/contract-api';
import { useToast } from '@/hooks/use-toast';
import ContractPaymentForm from '@/components/contract/ContractPaymentForm';
import PaymentScheduleTable from '@/components/contract/PaymentScheduleTable';

const statusLabels: Record<string, string> = {
  NEGOTIATING: '협의중',
  SIGNED: '체결',
  TEST_RECEIVED: '시험접수',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
  TERMINATED: '해지',
};

const statusColors: Record<string, string> = {
  NEGOTIATING: 'bg-amber-50 text-amber-600',
  SIGNED: 'bg-blue-50 text-blue-600',
  TEST_RECEIVED: 'bg-violet-50 text-violet-600',
  IN_PROGRESS: 'bg-emerald-50 text-emerald-600',
  COMPLETED: 'bg-emerald-50 text-emerald-600',
  TERMINATED: 'bg-red-50 text-red-600',
};

const studyStatusLabels: Record<string, string> = {
  REGISTERED: '접수',
  PREPARING: '준비중',
  IN_PROGRESS: '진행중',
  ANALYSIS: '분석중',
  REPORT_DRAFT: '보고서 작성중',
  REPORT_REVIEW: '보고서 검토중',
  COMPLETED: '완료',
  SUSPENDED: '중단',
};

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Contract>>({});
  const [studyDialogOpen, setStudyDialogOpen] = useState(false);
  const [amendmentDialogOpen, setAmendmentDialogOpen] = useState(false);
  const [newStudy, setNewStudy] = useState({
    testName: '',
    studyType: 'TOXICITY' as 'TOXICITY' | 'EFFICACY',
    receivedDate: '',
    expectedEndDate: '',
    notes: '',
  });
  const [newAmendment, setNewAmendment] = useState({
    reason: '',
    amountChange: 0,
    newEndDate: '',
  });

  useEffect(() => {
    if (params.id) loadContract();
  }, [params.id]);

  const loadContract = async () => {
    try {
      setLoading(true);
      const data = await getContract(params.id as string);
      if (data) {
        setContract(data as any);
        setEditForm(data as any);
      }
    } catch (error) {
      toast({ title: '오류', description: '계약을 불러오는데 실패했습니다.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!contract) return;
    try {
      await updateContract(contract.id, editForm);
      toast({ title: '성공', description: '계약이 수정되었습니다.' });
      setIsEditing(false);
      loadContract();
    } catch (error) {
      toast({ title: '오류', description: '수정에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!contract || !confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteContract(contract.id);
      toast({ title: '성공', description: '계약이 삭제되었습니다.' });
      router.push('/contracts');
    } catch (error) {
      toast({ title: '오류', description: '삭제에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!contract) return;
    try {
      await updateContractStatus(contract.id, status as any);
      toast({ title: '성공', description: '상태가 변경되었습니다.' });
      loadContract();
    } catch (error) {
      toast({ title: '오류', description: '상태 변경에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleAddStudy = async () => {
    if (!contract || !newStudy.testName) return;
    try {
      await createStudy({
        contract_id: contract.id,
        study_type: newStudy.studyType,
        test_name: newStudy.testName,
        received_date: newStudy.receivedDate || undefined,
        expected_end_date: newStudy.expectedEndDate || undefined,
        notes: newStudy.notes || undefined,
        status: 'REGISTERED',
      });
      toast({ title: '성공', description: '시험이 추가되었습니다.' });
      setStudyDialogOpen(false);
      setNewStudy({ testName: '', studyType: 'TOXICITY', receivedDate: '', expectedEndDate: '', notes: '' });
      loadContract();
    } catch (error) {
      toast({ title: '오류', description: '시험 추가에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleAddAmendment = async () => {
    if (!contract || !newAmendment.reason) return;
    try {
      const newTotal = Number(contract.total_amount) + newAmendment.amountChange;
      await createAmendment({
        contract_id: contract.id,
        version: ((contract as any).amendments?.length || 0) + 1,
        reason: newAmendment.reason,
        changes: {},
        amount_change: newAmendment.amountChange,
        new_total_amount: newTotal,
        new_end_date: newAmendment.newEndDate || undefined,
      });
      toast({ title: '성공', description: '변경계약이 추가되었습니다.' });
      setAmendmentDialogOpen(false);
      setNewAmendment({ reason: '', amountChange: 0, newEndDate: '' });
      loadContract();
    } catch (error) {
      toast({ title: '오류', description: '변경계약 추가에 실패했습니다.', variant: 'destructive' });
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR');
  };

  const formatAmount = (amount?: number) => {
    if (!amount) return '-';
    return Number(amount).toLocaleString() + '원';
  };

  if (loading) return <div className="flex items-center justify-center h-64">로딩 중...</div>;
  if (!contract) return <div className="flex items-center justify-center h-64">계약을 찾을 수 없습니다.</div>;

  // Helper to get display values
  const contractTitle = contract.title || contract.project_name || '';
  const contractNumber = contract.contractNumber || contract.contract_number || '';
  const contractType = contract.contractType || contract.contract_type || 'TOXICITY';
  const totalAmount = contract.totalAmount ?? contract.total_amount ?? 0;
  const paidAmount = contract.paidAmount ?? contract.paid_amount ?? 0;
  const signedDate = contract.signedDate || contract.signed_date;
  const startDate = contract.startDate || contract.start_date;
  const endDate = contract.endDate || contract.end_date;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold tracking-tight">{contractTitle}</h1>
              <StitchBadge className={statusColors[contract.status]}>{statusLabels[contract.status]}</StitchBadge>
            </div>
            <p className="text-sm text-slate-500">{contractNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => setIsEditing(!isEditing)}>
            <Edit className="w-4 h-4 mr-2" />{isEditing ? '취소' : '수정'}
          </Button>
          <Button variant="destructive" className="rounded-xl" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />삭제
          </Button>
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">계약 정보</TabsTrigger>
          <TabsTrigger value="payment">지급 관리</TabsTrigger>
          <TabsTrigger value="studies">시험 ({contract.studies?.length || 0})</TabsTrigger>
          <TabsTrigger value="amendments">변경계약 ({contract.amendments?.length || 0})</TabsTrigger>
          <TabsTrigger value="quotations">견적서</TabsTrigger>
        </TabsList>

        {/* 계약 정보 탭 */}
        <TabsContent value="info" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StitchCard variant="surface-low">
              <div className="flex items-center gap-2 mb-4">
                <FileSignature className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">계약 정보</h3>
              </div>
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">계약명</label>
                      <Input className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" value={(editForm as any).title || (editForm as any).project_name || ''} onChange={(e) => setEditForm({ ...editForm, project_name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">계약 유형</label>
                        <Select value={(editForm as any).contractType || (editForm as any).contract_type} onValueChange={(v: any) => setEditForm({ ...editForm, contract_type: v })}>
                          <SelectTrigger className="bg-white border-none rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TOXICITY">독성시험</SelectItem>
                            <SelectItem value="EFFICACY">효력시험</SelectItem>
                            <SelectItem value="CLINICAL_PATHOLOGY">임상병리</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">계약금액</label>
                        <Input className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" type="number" value={(editForm as any).totalAmount || (editForm as any).total_amount || ''} onChange={(e) => setEditForm({ ...editForm, total_amount: Number(e.target.value) })} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-slate-500">계약명</span><span className="font-medium">{contractTitle}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">계약 유형</span><StitchBadge variant="neutral">{contractType === 'TOXICITY' ? '독성' : contractType === 'EFFICACY' ? '효력' : contractType === 'CLINICAL_PATHOLOGY' ? '임상병리' : contractType}</StitchBadge></div>
                    <div className="flex justify-between"><span className="text-slate-500">계약금액</span><span className="font-medium">{formatAmount(totalAmount)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">수금액</span><span>{formatAmount(paidAmount)}</span></div>
                  </div>
                )}
              </div>
            </StitchCard>

            <StitchCard variant="surface-low">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">고객사 정보</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-slate-500">고객사</span><span className="font-medium">{contract.customer?.company || contract.customer?.name || contract.customer_name || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">담당자</span><span>{contract.customer?.name || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">연락처</span><span>{contract.customer?.phone || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">이메일</span><span>{contract.customer?.email || '-'}</span></div>
              </div>
            </StitchCard>

            <StitchCard variant="surface-low">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">일정</h3>
              </div>
              <div className="space-y-4">
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">체결일</label>
                      <Input className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" type="date" value={((editForm as any).signedDate || (editForm as any).signed_date || '')?.split('T')[0] || ''} onChange={(e) => setEditForm({ ...editForm, signed_date: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">시작일</label>
                      <Input className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" type="date" value={((editForm as any).startDate || (editForm as any).start_date || '')?.split('T')[0] || ''} onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">종료일</label>
                      <Input className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" type="date" value={((editForm as any).endDate || (editForm as any).end_date || '')?.split('T')[0] || ''} onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-slate-500">체결일</span><span>{formatDate(signedDate)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">시작일</span><span>{formatDate(startDate)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">종료일</span><span>{formatDate(endDate)}</span></div>
                  </div>
                )}
              </div>
            </StitchCard>

            <StitchCard variant="surface-low">
              <h3 className="text-lg font-bold mb-4">상태 변경</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusLabels).map(([key, label]) => (
                  <Button key={key} variant={contract.status === key ? 'default' : 'outline'} size="sm" className="rounded-xl" onClick={() => handleStatusChange(key)} disabled={contract.status === key}>{label}</Button>
                ))}
              </div>
            </StitchCard>
          </div>

          <StitchCard variant="surface-low">
            <h3 className="text-lg font-bold mb-4">계약 조건 / 비고</h3>
            {isEditing ? (
              <Textarea value={(editForm as any).terms || ''} onChange={(e) => setEditForm({ ...editForm, terms: e.target.value })} rows={4} className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" />
            ) : (
              <p className="whitespace-pre-wrap">{contract.terms || '내용이 없습니다.'}</p>
            )}
          </StitchCard>

          {isEditing && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>취소</Button>
              <Button onClick={handleSave}>저장</Button>
            </div>
          )}
        </TabsContent>

        {/* 지급 관리 탭 */}
        <TabsContent value="payment" className="space-y-6">
          <ContractPaymentForm
            contractId={contract.id}
            totalAmount={totalAmount}
            currentPaymentType={(contract as any).paymentType || 'FULL'}
            currentAdvanceRate={(contract as any).advancePaymentRate}
            currentAdvanceAmount={(contract as any).advancePaymentAmount}
            currentBalanceAmount={(contract as any).balancePaymentAmount}
            onSubmit={async (data) => {
              try {
                await updateContract(contract.id, data as any);
                toast({ title: '성공', description: '지급조건이 저장되었습니다.' });
                loadContract();
              } catch (error) {
                toast({ title: '오류', description: '저장에 실패했습니다.', variant: 'destructive' });
              }
            }}
          />
          
          <PaymentScheduleTable
            contractId={contract.id}
            schedules={(contract as any).paymentSchedules || []}
            summary={{
              totalAmount: totalAmount,
              paidAmount: paidAmount,
              remainingAmount: totalAmount - paidAmount,
              completionRate: totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0,
            }}
            onStatusChange={async (scheduleId, status) => {
              toast({ title: '성공', description: '지급 상태가 변경되었습니다.' });
              loadContract();
            }}
            onAddSchedule={async (schedule) => {
              toast({ title: '성공', description: '지급 일정이 추가되었습니다.' });
              loadContract();
            }}
            onDeleteSchedule={async (scheduleId) => {
              toast({ title: '성공', description: '지급 일정이 삭제되었습니다.' });
              loadContract();
            }}
          />
        </TabsContent>

        {/* 시험 탭 */}
        <TabsContent value="studies">
          <StitchCard variant="surface-low">
            <div className="flex flex-row items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">시험 목록</h3>
              </div>
              <Dialog open={studyDialogOpen} onOpenChange={setStudyDialogOpen}>
                <DialogTrigger asChild><Button className="bg-gradient-to-r from-primary to-orange-400 rounded-xl font-bold"><Plus className="w-4 h-4 mr-2" />시험 추가</Button></DialogTrigger>
                <DialogContent className="bg-[#E9E1D8] rounded-2xl">
                  <DialogHeader><DialogTitle className="font-bold">시험 추가</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">시험명</label>
                      <Input className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" value={newStudy.testName} onChange={(e) => setNewStudy({ ...newStudy, testName: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">시험 유형</label>
                      <Select value={newStudy.studyType} onValueChange={(v: any) => setNewStudy({ ...newStudy, studyType: v })}>
                        <SelectTrigger className="bg-white border-none rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TOXICITY">독성시험</SelectItem>
                          <SelectItem value="EFFICACY">효력시험</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">접수일</label>
                        <Input className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" type="date" value={newStudy.receivedDate} onChange={(e) => setNewStudy({ ...newStudy, receivedDate: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">예상 종료일</label>
                        <Input className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" type="date" value={newStudy.expectedEndDate} onChange={(e) => setNewStudy({ ...newStudy, expectedEndDate: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">비고</label>
                      <Textarea className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" value={newStudy.notes} onChange={(e) => setNewStudy({ ...newStudy, notes: e.target.value })} />
                    </div>
                    <Button onClick={handleAddStudy} className="w-full bg-gradient-to-r from-primary to-orange-400 rounded-xl font-bold">추가</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {contract.studies && contract.studies.length > 0 ? (
              <StitchTable>
                <StitchTableHeader>
                  <StitchTableRow>
                    <StitchTableHead>시험번호</StitchTableHead>
                    <StitchTableHead>시험명</StitchTableHead>
                    <StitchTableHead>유형</StitchTableHead>
                    <StitchTableHead>상태</StitchTableHead>
                    <StitchTableHead>시작일</StitchTableHead>
                    <StitchTableHead>예상종료일</StitchTableHead>
                  </StitchTableRow>
                </StitchTableHeader>
                <StitchTableBody>
                  {contract.studies.map((study) => (
                    <StitchTableRow key={study.id}>
                      <StitchTableCell className="font-bold text-primary">{study.studyNumber}</StitchTableCell>
                      <StitchTableCell>{study.testName}</StitchTableCell>
                      <StitchTableCell><StitchBadge variant="neutral">{study.studyType === 'TOXICITY' ? '독성' : '효력'}</StitchBadge></StitchTableCell>
                      <StitchTableCell><StitchBadge variant="info">{studyStatusLabels[study.status]}</StitchBadge></StitchTableCell>
                      <StitchTableCell>{formatDate(study.startDate)}</StitchTableCell>
                      <StitchTableCell>{formatDate(study.expectedEndDate)}</StitchTableCell>
                    </StitchTableRow>
                  ))}
                </StitchTableBody>
              </StitchTable>
            ) : (
              <div className="text-center py-8 text-slate-500">등록된 시험이 없습니다.</div>
            )}
          </StitchCard>
        </TabsContent>

        {/* 변경계약 탭 */}
        <TabsContent value="amendments">
          <StitchCard variant="surface-low">
            <div className="flex flex-row items-center justify-between mb-6">
              <h3 className="text-lg font-bold">변경계약 이력</h3>
              <Dialog open={amendmentDialogOpen} onOpenChange={setAmendmentDialogOpen}>
                <DialogTrigger asChild><Button className="bg-gradient-to-r from-primary to-orange-400 rounded-xl font-bold"><Plus className="w-4 h-4 mr-2" />변경계약 추가</Button></DialogTrigger>
                <DialogContent className="bg-[#E9E1D8] rounded-2xl">
                  <DialogHeader><DialogTitle className="font-bold">변경계약 추가</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">변경 사유</label>
                      <Textarea className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" value={newAmendment.reason} onChange={(e) => setNewAmendment({ ...newAmendment, reason: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">금액 증감</label>
                      <Input className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" type="number" value={newAmendment.amountChange} onChange={(e) => setNewAmendment({ ...newAmendment, amountChange: Number(e.target.value) })} />
                      <p className="text-sm text-slate-500">변경 후 총액: {formatAmount(totalAmount + newAmendment.amountChange)}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">변경 종료일</label>
                      <Input className="bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40" type="date" value={newAmendment.newEndDate} onChange={(e) => setNewAmendment({ ...newAmendment, newEndDate: e.target.value })} />
                    </div>
                    <Button onClick={handleAddAmendment} className="w-full bg-gradient-to-r from-primary to-orange-400 rounded-xl font-bold">추가</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {contract.amendments && contract.amendments.length > 0 ? (
              <StitchTable>
                <StitchTableHeader>
                  <StitchTableRow>
                    <StitchTableHead>변경번호</StitchTableHead>
                    <StitchTableHead>변경 사유</StitchTableHead>
                    <StitchTableHead>금액 증감</StitchTableHead>
                    <StitchTableHead>변경 후 총액</StitchTableHead>
                    <StitchTableHead>등록일</StitchTableHead>
                  </StitchTableRow>
                </StitchTableHeader>
                <StitchTableBody>
                  {contract.amendments.map((amendment) => (
                    <StitchTableRow key={amendment.id}>
                      <StitchTableCell className="font-bold text-primary">{amendment.amendmentNumber}</StitchTableCell>
                      <StitchTableCell>{amendment.reason}</StitchTableCell>
                      <StitchTableCell className={amendment.amountChange && amendment.amountChange > 0 ? 'text-emerald-600' : 'text-red-600'}>
                        {amendment.amountChange && amendment.amountChange > 0 ? '+' : ''}{formatAmount(amendment.amountChange)}
                      </StitchTableCell>
                      <StitchTableCell>{formatAmount(amendment.newTotalAmount)}</StitchTableCell>
                      <StitchTableCell>{formatDate(amendment.createdAt)}</StitchTableCell>
                    </StitchTableRow>
                  ))}
                </StitchTableBody>
              </StitchTable>
            ) : (
              <div className="text-center py-8 text-slate-500">변경계약 이력이 없습니다.</div>
            )}
          </StitchCard>
        </TabsContent>

        {/* 견적서 탭 */}
        <TabsContent value="quotations">
          <StitchCard variant="surface-low">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold">연결된 견적서</h3>
            </div>
            {contract.quotations && contract.quotations.length > 0 ? (
              <div className="space-y-2">
                {contract.quotations.map((q: any) => (
                  <div key={q.id} className="flex items-center justify-between p-4 bg-white rounded-xl cursor-pointer hover:translate-y-[-1px] hover:shadow-ambient transition-all duration-200" onClick={() => router.push(`/quotations/${q.id}`)}>
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="font-bold">{q.quotationNumber}</p>
                        <p className="text-sm text-slate-500">{q.projectName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatAmount(q.totalAmount)}</p>
                      <p className="text-sm text-slate-500">{formatDate(q.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">연결된 견적서가 없습니다.</div>
            )}
          </StitchCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
