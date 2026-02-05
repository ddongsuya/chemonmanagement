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
  ArrowLeft,
  Building2,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  Plus,
  MessageSquare,
  FileText,
  CheckCircle,
  XCircle,
  UserCheck,
} from 'lucide-react';
import {
  getLead,
  updateLead,
  deleteLead,
  updateLeadStatus,
  convertLead,
  addLeadActivity,
  Lead,
  LeadActivity,
  LeadSource,
} from '@/lib/lead-api';
import { useToast } from '@/hooks/use-toast';
import LostReasonDialog from '@/components/lead/LostReasonDialog';

const statusLabels: Record<string, string> = {
  NEW: '신규',
  CONTACTED: '연락완료',
  QUALIFIED: '검토완료',
  PROPOSAL: '견적발송',
  NEGOTIATION: '협상중',
  CONVERTED: '계약전환',
  LOST: '실패',
  DORMANT: '휴면',
};

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-yellow-100 text-yellow-800',
  QUALIFIED: 'bg-green-100 text-green-800',
  PROPOSAL: 'bg-purple-100 text-purple-800',
  NEGOTIATION: 'bg-orange-100 text-orange-800',
  CONVERTED: 'bg-emerald-100 text-emerald-800',
  LOST: 'bg-red-100 text-red-800',
  DORMANT: 'bg-gray-100 text-gray-800',
};

const sourceLabels: Record<string, string> = {
  EMAIL: '이메일',
  PHONE: '전화',
  WEBSITE: '웹사이트',
  REFERRAL: '소개',
  EXHIBITION: '전시회',
  OTHER: '기타',
};

const activityTypes = [
  { value: 'CALL', label: '전화', icon: Phone },
  { value: 'EMAIL', label: '이메일', icon: Mail },
  { value: 'MEETING', label: '미팅', icon: User },
  { value: 'NOTE', label: '메모', icon: MessageSquare },
];

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: 'CALL',
    subject: '',
    content: '',
    nextAction: '',
    nextDate: '',
  });
  const [lostReasonDialogOpen, setLostReasonDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      loadLead();
    }
  }, [params.id]);

  const loadLead = async () => {
    try {
      setLoading(true);
      const res = await getLead(params.id as string);
      if (res.success && res.data?.lead) {
        setLead(res.data.lead);
        setEditForm(res.data.lead);
      }
    } catch (error) {
      toast({ title: '오류', description: '리드를 불러오는데 실패했습니다.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!lead) return;
    try {
      await updateLead(lead.id, editForm);
      toast({ title: '성공', description: '리드가 수정되었습니다.' });
      setIsEditing(false);
      loadLead();
    } catch (error) {
      toast({ title: '오류', description: '수정에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!lead || !confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteLead(lead.id);
      toast({ title: '성공', description: '리드가 삭제되었습니다.' });
      router.push('/leads');
    } catch (error) {
      toast({ title: '오류', description: '삭제에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!lead) return;
    
    // LOST 상태로 변경 시 미진행 사유 다이얼로그 표시
    if (status === 'LOST') {
      setPendingStatus(status);
      setLostReasonDialogOpen(true);
      return;
    }
    
    try {
      await updateLeadStatus(lead.id, status);
      toast({ title: '성공', description: '상태가 변경되었습니다.' });
      loadLead();
    } catch (error) {
      toast({ title: '오류', description: '상태 변경에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleLostReasonSubmit = async (data: { lostReason: string; lostReasonDetail?: string }) => {
    if (!lead || !pendingStatus) return;
    try {
      await updateLeadStatus(lead.id, pendingStatus, data);
      toast({ title: '성공', description: '상태가 변경되었습니다.' });
      setLostReasonDialogOpen(false);
      setPendingStatus(null);
      loadLead();
    } catch (error) {
      toast({ title: '오류', description: '상태 변경에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleConvert = async () => {
    if (!lead || !confirm('이 리드를 고객으로 전환하시겠습니까?')) return;
    try {
      await convertLead(lead.id);
      toast({ title: '성공', description: '고객으로 전환되었습니다.' });
      loadLead();
    } catch (error) {
      toast({ title: '오류', description: '전환에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleAddActivity = async () => {
    if (!lead || !newActivity.subject || !newActivity.content) return;
    try {
      await addLeadActivity(lead.id, newActivity);
      toast({ title: '성공', description: '활동이 추가되었습니다.' });
      setActivityDialogOpen(false);
      setNewActivity({ type: 'CALL', subject: '', content: '', nextAction: '', nextDate: '' });
      loadLead();
    } catch (error) {
      toast({ title: '오류', description: '활동 추가에 실패했습니다.', variant: 'destructive' });
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('ko-KR');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">로딩 중...</div>;
  }

  if (!lead) {
    return <div className="flex items-center justify-center h-64">리드를 찾을 수 없습니다.</div>;
  }

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
              <h1 className="text-2xl font-bold">{lead.companyName}</h1>
              <Badge className={statusColors[lead.status]}>{statusLabels[lead.status]}</Badge>
            </div>
            <p className="text-muted-foreground">{lead.leadNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {lead.status !== 'CONVERTED' && lead.status !== 'LOST' && (
            <Button onClick={handleConvert} variant="outline">
              <UserCheck className="w-4 h-4 mr-2" />
              고객 전환
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
            <Edit className="w-4 h-4 mr-2" />
            {isEditing ? '취소' : '수정'}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            삭제
          </Button>
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">기본 정보</TabsTrigger>
          <TabsTrigger value="activities">활동 기록</TabsTrigger>
          <TabsTrigger value="quotations">견적서</TabsTrigger>
        </TabsList>

        {/* 기본 정보 탭 */}
        <TabsContent value="info" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 회사 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  회사 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label>회사명</Label>
                      <Input
                        value={editForm.companyName || ''}
                        onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>유입 경로</Label>
                        <Select
                          value={editForm.source || ''}
                          onValueChange={(v) => setEditForm({ ...editForm, source: v as LeadSource })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(sourceLabels).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>문의 유형</Label>
                        <Select
                          value={editForm.inquiryType || ''}
                          onValueChange={(v) => setEditForm({ ...editForm, inquiryType: v })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TOXICITY">독성시험</SelectItem>
                            <SelectItem value="EFFICACY">효력시험</SelectItem>
                            <SelectItem value="CLINICAL_PATHOLOGY">임상병리</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">회사명</span>
                      <span className="font-medium">{lead.companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">유입 경로</span>
                      <span>{sourceLabels[lead.source] || lead.source}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">문의 유형</span>
                      <span>{lead.inquiryType === 'TOXICITY' ? '독성시험' : lead.inquiryType === 'EFFICACY' ? '효력시험' : lead.inquiryType === 'CLINICAL_PATHOLOGY' ? '임상병리' : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">등록일</span>
                      <span>{formatDate(lead.createdAt)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 담당자 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  담당자 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>담당자명</Label>
                        <Input
                          value={editForm.contactName || ''}
                          onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>직책</Label>
                        <Input
                          value={editForm.position || ''}
                          onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>연락처</Label>
                        <Input
                          value={editForm.contactPhone || ''}
                          onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>이메일</Label>
                        <Input
                          value={editForm.contactEmail || ''}
                          onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">담당자명</span>
                      <span className="font-medium">{lead.contactName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">직책</span>
                      <span>{lead.position || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">연락처</span>
                      <span>{lead.contactPhone || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">이메일</span>
                      <span>{lead.contactEmail || '-'}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 영업 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  영업 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label>예상 금액</Label>
                      <Input
                        type="number"
                        value={editForm.expectedAmount || ''}
                        onChange={(e) => setEditForm({ ...editForm, expectedAmount: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>예상 계약일</Label>
                      <Input
                        type="date"
                        value={editForm.expectedDate?.split('T')[0] || ''}
                        onChange={(e) => setEditForm({ ...editForm, expectedDate: e.target.value })}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">예상 금액</span>
                      <span className="font-medium">
                        {lead.expectedAmount ? `₩${Number(lead.expectedAmount).toLocaleString()}` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">예상 계약일</span>
                      <span>{formatDate(lead.expectedDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">현재 단계</span>
                      <Badge variant="outline" style={{ borderColor: lead.stage?.color, color: lead.stage?.color }}>
                        {lead.stage?.name || '-'}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 상태 변경 */}
            <Card>
              <CardHeader>
                <CardTitle>상태 변경</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <Button
                      key={key}
                      variant={lead.status === key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(key)}
                      disabled={lead.status === key}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 문의 내용 */}
          <Card>
            <CardHeader>
              <CardTitle>문의 내용</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editForm.inquiryDetail || ''}
                  onChange={(e) => setEditForm({ ...editForm, inquiryDetail: e.target.value })}
                  rows={4}
                />
              ) : (
                <p className="whitespace-pre-wrap">{lead.inquiryDetail || '문의 내용이 없습니다.'}</p>
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

        {/* 활동 기록 탭 */}
        <TabsContent value="activities" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />활동 추가</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>활동 추가</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>유형</Label>
                    <Select value={newActivity.type} onValueChange={(v) => setNewActivity({ ...newActivity, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {activityTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>제목</Label>
                    <Input
                      value={newActivity.subject}
                      onChange={(e) => setNewActivity({ ...newActivity, subject: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>내용</Label>
                    <Textarea
                      value={newActivity.content}
                      onChange={(e) => setNewActivity({ ...newActivity, content: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>다음 액션</Label>
                    <Input
                      value={newActivity.nextAction}
                      onChange={(e) => setNewActivity({ ...newActivity, nextAction: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>다음 일정</Label>
                    <Input
                      type="datetime-local"
                      value={newActivity.nextDate}
                      onChange={(e) => setNewActivity({ ...newActivity, nextDate: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddActivity} className="w-full">추가</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-6">
              {(lead as any).activities?.length > 0 ? (
                <div className="space-y-4">
                  {(lead as any).activities.map((activity: LeadActivity) => {
                    const typeInfo = activityTypes.find((t) => t.value === activity.type);
                    const Icon = typeInfo?.icon || MessageSquare;
                    return (
                      <div key={activity.id} className="flex gap-4 p-4 border rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{activity.subject}</h4>
                            <span className="text-sm text-muted-foreground">
                              {formatDateTime(activity.contactedAt)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{activity.content}</p>
                          {activity.nextAction && (
                            <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                              <span className="font-medium">다음 액션:</span> {activity.nextAction}
                              {activity.nextDate && ` (${formatDateTime(activity.nextDate)})`}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  활동 기록이 없습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 견적서 탭 */}
        <TabsContent value="quotations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>연결된 견적서</CardTitle>
              <Button onClick={() => router.push(`/quotations/new?leadId=${lead.id}`)}>
                <Plus className="w-4 h-4 mr-2" />
                견적서 작성
              </Button>
            </CardHeader>
            <CardContent>
              {(lead as any).quotations?.length > 0 ? (
                <div className="space-y-2">
                  {(lead as any).quotations.map((q: any) => (
                    <div
                      key={q.id}
                      className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/quotations/${q.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{q.quotationNumber}</p>
                          <p className="text-sm text-muted-foreground">{q.projectName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₩{Number(q.totalAmount).toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(q.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  연결된 견적서가 없습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 미진행 사유 다이얼로그 */}
      <LostReasonDialog
        open={lostReasonDialogOpen}
        onOpenChange={setLostReasonDialogOpen}
        leadNumber={lead.leadNumber}
        onSubmit={handleLostReasonSubmit}
      />
    </div>
  );
}
