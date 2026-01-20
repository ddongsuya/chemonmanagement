'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  Plus,
  FileText,
  FlaskConical,
  FileSignature,
} from 'lucide-react';
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

const statusLabels: Record<string, string> = {
  NEGOTIATING: '협의중',
  SIGNED: '체결',
  TEST_RECEIVED: '시험접수',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
  TERMINATED: '해지',
};

const statusColors: Record<string, string> = {
  NEGOTIATING: 'bg-yellow-100 text-yellow-800',
  SIGNED: 'bg-blue-100 text-blue-800',
  TEST_RECEIVED: 'bg-purple-100 text-purple-800',
  IN_PROGRESS: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  TERMINATED: 'bg-red-100 text-red-800',
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
    return `₩${Number(amount).toLocaleString()}`;
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
              <h1 className="text-2xl font-bold">{contractTitle}</h1>
              <Badge className={statusColors[contract.status]}>{statusLabels[contract.status]}</Badge>
            </div>
            <p className="text-muted-foreground">{contractNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
            <Edit className="w-4 h-4 mr-2" />{isEditing ? '취소' : '수정'}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />삭제
          </Button>
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">계약 정보</TabsTrigger>
          <TabsTrigger value="studies">시험 ({contract.studies?.length || 0})</TabsTrigger>
          <TabsTrigger value="amendments">변경계약 ({contract.amendments?.length || 0})</TabsTrigger>
          <TabsTrigger value="quotations">견적서</TabsTrigger>
        </TabsList>

        {/* 계약 정보 탭 */}
        <TabsContent value="info" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSignature className="w-5 h-5" />계약 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label>계약명</Label>
                      <Input value={(editForm as any).title || (editForm as any).project_name || ''} onChange={(e) => setEditForm({ ...editForm, project_name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>계약 유형</Label>
                        <Select value={(editForm as any).contractType || (editForm as any).contract_type} onValueChange={(v: any) => setEditForm({ ...editForm, contract_type: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TOXICITY">독성시험</SelectItem>
                            <SelectItem value="EFFICACY">효력시험</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>계약금액</Label>
                        <Input type="number" value={(editForm as any).totalAmount || (editForm as any).total_amount || ''} onChange={(e) => setEditForm({ ...editForm, total_amount: Number(e.target.value) })} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-muted-foreground">계약명</span><span className="font-medium">{contractTitle}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">계약 유형</span><Badge variant="outline">{contractType === 'TOXICITY' ? '독성' : '효력'}</Badge></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">계약금액</span><span className="font-medium">{formatAmount(totalAmount)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">수금액</span><span>{formatAmount(paidAmount)}</span></div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />고객사 정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-muted-foreground">고객사</span><span className="font-medium">{contract.customer?.company || contract.customer?.name || contract.customer_name || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">담당자</span><span>{contract.customer?.name || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">연락처</span><span>{contract.customer?.phone || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">이메일</span><span>{contract.customer?.email || '-'}</span></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />일정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>체결일</Label>
                      <Input type="date" value={((editForm as any).signedDate || (editForm as any).signed_date || '')?.split('T')[0] || ''} onChange={(e) => setEditForm({ ...editForm, signed_date: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>시작일</Label>
                      <Input type="date" value={((editForm as any).startDate || (editForm as any).start_date || '')?.split('T')[0] || ''} onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>종료일</Label>
                      <Input type="date" value={((editForm as any).endDate || (editForm as any).end_date || '')?.split('T')[0] || ''} onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-muted-foreground">체결일</span><span>{formatDate(signedDate)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">시작일</span><span>{formatDate(startDate)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">종료일</span><span>{formatDate(endDate)}</span></div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>상태 변경</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <Button key={key} variant={contract.status === key ? 'default' : 'outline'} size="sm" onClick={() => handleStatusChange(key)} disabled={contract.status === key}>{label}</Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>계약 조건 / 비고</CardTitle></CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea value={(editForm as any).terms || ''} onChange={(e) => setEditForm({ ...editForm, terms: e.target.value })} rows={4} />
              ) : (
                <p className="whitespace-pre-wrap">{contract.terms || '내용이 없습니다.'}</p>
              )}
            </CardContent>
          </Card>

          {isEditing && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>취소</Button>
              <Button onClick={handleSave}>저장</Button>
            </div>
          )}
        </TabsContent>

        {/* 시험 탭 */}
        <TabsContent value="studies">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><FlaskConical className="w-5 h-5" />시험 목록</CardTitle>
              <Dialog open={studyDialogOpen} onOpenChange={setStudyDialogOpen}>
                <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />시험 추가</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>시험 추가</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>시험명</Label>
                      <Input value={newStudy.testName} onChange={(e) => setNewStudy({ ...newStudy, testName: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>시험 유형</Label>
                      <Select value={newStudy.studyType} onValueChange={(v: any) => setNewStudy({ ...newStudy, studyType: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TOXICITY">독성시험</SelectItem>
                          <SelectItem value="EFFICACY">효력시험</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>접수일</Label>
                        <Input type="date" value={newStudy.receivedDate} onChange={(e) => setNewStudy({ ...newStudy, receivedDate: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>예상 종료일</Label>
                        <Input type="date" value={newStudy.expectedEndDate} onChange={(e) => setNewStudy({ ...newStudy, expectedEndDate: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>비고</Label>
                      <Textarea value={newStudy.notes} onChange={(e) => setNewStudy({ ...newStudy, notes: e.target.value })} />
                    </div>
                    <Button onClick={handleAddStudy} className="w-full">추가</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {contract.studies && contract.studies.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>시험번호</TableHead>
                      <TableHead>시험명</TableHead>
                      <TableHead>유형</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>시작일</TableHead>
                      <TableHead>예상종료일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contract.studies.map((study) => (
                      <TableRow key={study.id}>
                        <TableCell className="font-medium">{study.studyNumber}</TableCell>
                        <TableCell>{study.testName}</TableCell>
                        <TableCell><Badge variant="outline">{study.studyType === 'TOXICITY' ? '독성' : '효력'}</Badge></TableCell>
                        <TableCell><Badge>{studyStatusLabels[study.status]}</Badge></TableCell>
                        <TableCell>{formatDate(study.startDate)}</TableCell>
                        <TableCell>{formatDate(study.expectedEndDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">등록된 시험이 없습니다.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 변경계약 탭 */}
        <TabsContent value="amendments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>변경계약 이력</CardTitle>
              <Dialog open={amendmentDialogOpen} onOpenChange={setAmendmentDialogOpen}>
                <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />변경계약 추가</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>변경계약 추가</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>변경 사유</Label>
                      <Textarea value={newAmendment.reason} onChange={(e) => setNewAmendment({ ...newAmendment, reason: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>금액 증감</Label>
                      <Input type="number" value={newAmendment.amountChange} onChange={(e) => setNewAmendment({ ...newAmendment, amountChange: Number(e.target.value) })} />
                      <p className="text-sm text-muted-foreground">변경 후 총액: {formatAmount(totalAmount + newAmendment.amountChange)}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>변경 종료일</Label>
                      <Input type="date" value={newAmendment.newEndDate} onChange={(e) => setNewAmendment({ ...newAmendment, newEndDate: e.target.value })} />
                    </div>
                    <Button onClick={handleAddAmendment} className="w-full">추가</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {contract.amendments && contract.amendments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>변경번호</TableHead>
                      <TableHead>변경 사유</TableHead>
                      <TableHead>금액 증감</TableHead>
                      <TableHead>변경 후 총액</TableHead>
                      <TableHead>등록일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contract.amendments.map((amendment) => (
                      <TableRow key={amendment.id}>
                        <TableCell className="font-medium">{amendment.amendmentNumber}</TableCell>
                        <TableCell>{amendment.reason}</TableCell>
                        <TableCell className={amendment.amountChange && amendment.amountChange > 0 ? 'text-green-600' : 'text-red-600'}>
                          {amendment.amountChange && amendment.amountChange > 0 ? '+' : ''}{formatAmount(amendment.amountChange)}
                        </TableCell>
                        <TableCell>{formatAmount(amendment.newTotalAmount)}</TableCell>
                        <TableCell>{formatDate(amendment.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">변경계약 이력이 없습니다.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 견적서 탭 */}
        <TabsContent value="quotations">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />연결된 견적서</CardTitle></CardHeader>
            <CardContent>
              {contract.quotations && contract.quotations.length > 0 ? (
                <div className="space-y-2">
                  {contract.quotations.map((q: any) => (
                    <div key={q.id} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/quotations/${q.id}`)}>
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{q.quotationNumber}</p>
                          <p className="text-sm text-muted-foreground">{q.projectName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatAmount(q.totalAmount)}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(q.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">연결된 견적서가 없습니다.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
