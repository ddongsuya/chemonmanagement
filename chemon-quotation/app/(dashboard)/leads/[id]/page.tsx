'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  Edit,
  Trash2,
  Plus,
  MessageSquare,
  FileText,
  UserCheck,
  Clock,
  TrendingUp,
  ChevronRight,
  ExternalLink,
  Copy,
  MoreHorizontal,
  Activity,
  Target,
  Briefcase,
  MapPin,
  Hash,
  CalendarDays,
  CircleDot,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
} from 'lucide-react';
import WonSign from '@/components/icons/WonSign';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ─── 상수 ───────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  NEW: { label: '신규', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: CircleDot },
  CONTACTED: { label: '연락완료', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Phone },
  QUALIFIED: { label: '검토완료', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  PROPOSAL: { label: '견적발송', color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200', icon: FileText },
  NEGOTIATION: { label: '협상중', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: TrendingUp },
  CONVERTED: { label: '계약전환', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200', icon: CheckCircle2 },
  LOST: { label: '실패', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
  DORMANT: { label: '휴면', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', icon: Clock },
};

const PIPELINE_STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION'];

const SOURCE_LABELS: Record<string, string> = {
  EMAIL: '이메일', PHONE: '전화', WEBSITE: '웹사이트',
  REFERRAL: '소개', EXHIBITION: '전시회', COLD_CALL: '콜드콜',
  ADVERTISEMENT: '광고', PARTNER: '파트너', OTHER: '기타',
};

const INQUIRY_LABELS: Record<string, string> = {
  TOXICITY: '독성시험', EFFICACY: '효력시험', CLINICAL_PATHOLOGY: '임상병리',
};

const ACTIVITY_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  CALL: { label: '전화', color: 'bg-blue-500', icon: Phone },
  EMAIL: { label: '이메일', color: 'bg-violet-500', icon: Mail },
  MEETING: { label: '미팅', color: 'bg-emerald-500', icon: User },
  NOTE: { label: '메모', color: 'bg-amber-500', icon: MessageSquare },
};

// ─── 유틸 ───────────────────────────────────────────────
function getDaysSince(dateStr?: string): number {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function formatCurrency(amount?: number): string {
  if (!amount) return '-';
  return `₩${Number(amount).toLocaleString()}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getStageProgress(status: string): number {
  const idx = PIPELINE_STAGES.indexOf(status);
  if (status === 'CONVERTED') return 100;
  if (status === 'LOST' || status === 'DORMANT') return 0;
  if (idx === -1) return 0;
  return Math.round(((idx + 1) / PIPELINE_STAGES.length) * 100);
}

// ─── 파이프라인 스테퍼 ──────────────────────────────────
function PipelineStepper({ currentStatus, onStatusChange }: { currentStatus: string; onStatusChange: (s: string) => void }) {
  const currentIdx = PIPELINE_STAGES.indexOf(currentStatus);
  const isTerminal = currentStatus === 'CONVERTED' || currentStatus === 'LOST' || currentStatus === 'DORMANT';

  return (
    <div className="flex items-center w-full gap-0.5">
      {PIPELINE_STAGES.map((stage, i) => {
        const config = STATUS_CONFIG[stage];
        const isActive = stage === currentStatus;
        const isPast = !isTerminal && currentIdx > i;
        const isFuture = !isTerminal && currentIdx < i;

        return (
          <TooltipProvider key={stage}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => !isActive && onStatusChange(stage)}
                  className={`
                    relative flex-1 h-9 flex items-center justify-center text-xs font-medium transition-all
                    ${i === 0 ? 'rounded-l-md' : ''} ${i === PIPELINE_STAGES.length - 1 ? 'rounded-r-md' : ''}
                    ${isActive ? 'bg-slate-900 text-white shadow-sm' : ''}
                    ${isPast ? 'bg-slate-200 text-slate-700' : ''}
                    ${isFuture ? 'bg-slate-50 text-slate-400 border border-slate-200' : ''}
                    ${isTerminal && !isActive ? 'bg-slate-50 text-slate-300 border border-slate-100' : ''}
                    hover:opacity-80 cursor-pointer
                  `}
                >
                  {config.label}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>{config.label} 단계로 변경</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}

// ─── 정보 행 컴포넌트 ───────────────────────────────────
function InfoRow({ icon: Icon, label, value, action }: {
  icon?: React.ElementType;
  label: string;
  value: React.ReactNode;
  action?: React.ReactNode;
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
export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({ type: 'CALL', subject: '', content: '', nextAction: '', nextDate: '' });
  const [lostReasonDialogOpen, setLostReasonDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { if (params.id) loadLead(); }, [params.id]);

  const loadLead = async () => {
    try {
      setLoading(true);
      const res = await getLead(params.id as string);
      if (res.success && res.data?.lead) { setLead(res.data.lead); setEditForm(res.data.lead); }
    } catch { toast({ title: '오류', description: '리드를 불러오는데 실패했습니다.', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!lead) return;
    try {
      await updateLead(lead.id, editForm);
      toast({ title: '성공', description: '리드가 수정되었습니다.' });
      setIsEditing(false); loadLead();
    } catch { toast({ title: '오류', description: '수정에 실패했습니다.', variant: 'destructive' }); }
  };

  const handleDelete = async () => {
    if (!lead || !confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteLead(lead.id);
      toast({ title: '성공', description: '리드가 삭제되었습니다.' }); router.push('/leads');
    } catch { toast({ title: '오류', description: '삭제에 실패했습니다.', variant: 'destructive' }); }
  };

  const handleStatusChange = async (status: string) => {
    if (!lead) return;
    if (status === 'LOST') { setPendingStatus(status); setLostReasonDialogOpen(true); return; }
    try {
      await updateLeadStatus(lead.id, status);
      toast({ title: '성공', description: '상태가 변경되었습니다.' }); loadLead();
    } catch { toast({ title: '오류', description: '상태 변경에 실패했습니다.', variant: 'destructive' }); }
  };

  const handleLostReasonSubmit = async (data: { lostReason: string; lostReasonDetail?: string }) => {
    if (!lead || !pendingStatus) return;
    try {
      await updateLeadStatus(lead.id, pendingStatus, data);
      toast({ title: '성공', description: '상태가 변경되었습니다.' });
      setLostReasonDialogOpen(false); setPendingStatus(null); loadLead();
    } catch { toast({ title: '오류', description: '상태 변경에 실패했습니다.', variant: 'destructive' }); }
  };

  const handleConvert = async () => {
    if (!lead || !confirm('이 리드를 고객으로 전환하시겠습니까?')) return;
    try {
      await convertLead(lead.id);
      toast({ title: '성공', description: '고객으로 전환되었습니다.' }); loadLead();
    } catch { toast({ title: '오류', description: '전환에 실패했습니다.', variant: 'destructive' }); }
  };

  const handleAddActivity = async () => {
    if (!lead || !newActivity.subject || !newActivity.content) return;
    try {
      await addLeadActivity(lead.id, newActivity);
      toast({ title: '성공', description: '활동이 추가되었습니다.' });
      setActivityDialogOpen(false);
      setNewActivity({ type: 'CALL', subject: '', content: '', nextAction: '', nextDate: '' });
      loadLead();
    } catch { toast({ title: '오류', description: '활동 추가에 실패했습니다.', variant: 'destructive' }); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: '복사됨', description: '클립보드에 복사되었습니다.' });
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse p-6">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-10 bg-muted rounded" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-32 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="w-10 h-10 text-muted-foreground" />
        <p className="text-muted-foreground">리드를 찾을 수 없습니다.</p>
        <Button variant="outline" onClick={() => router.push('/leads')}>목록으로</Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[lead.status] || STATUS_CONFIG.NEW;
  const StatusIcon = statusConfig.icon;
  const daysSinceCreated = getDaysSince(lead.createdAt);
  const activities = (lead as any).activities || [];
  const quotations = (lead as any).quotations || [];
  const progress = getStageProgress(lead.status);

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* ─── 상단 헤더 ─── */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* 네비게이션 */}
          <div className="flex items-center gap-2 py-2.5 text-sm text-muted-foreground">
            <button onClick={() => router.push('/leads')} className="hover:text-foreground transition-colors">리드</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium truncate">{lead.companyName}</span>
          </div>

          {/* 메인 헤더 */}
          <div className="flex items-start justify-between pb-4">
            <div className="flex items-start gap-4 min-w-0">
              {/* 이니셜 아바타 */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-lg shrink-0">
                {lead.companyName.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-bold text-slate-900 truncate">{lead.companyName}</h1>
                  <Badge variant="outline" className={`${statusConfig.bg} ${statusConfig.color} border font-medium`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="font-mono">{lead.leadNumber}</span>
                  <span>·</span>
                  <span>{daysSinceCreated}일 경과</span>
                  {lead.expectedAmount && (
                    <>
                      <span>·</span>
                      <span className="font-medium text-slate-700">{formatCurrency(lead.expectedAmount)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center gap-2 shrink-0">
              {lead.status !== 'CONVERTED' && lead.status !== 'LOST' && (
                <Button onClick={handleConvert} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                  고객 전환
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(!isEditing)}>
                    <Edit className="w-3.5 h-3.5 mr-2" />
                    {isEditing ? '편집 취소' : '정보 수정'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('LOST')}>
                    <XCircle className="w-3.5 h-3.5 mr-2" />
                    실패 처리
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('DORMANT')}>
                    <Clock className="w-3.5 h-3.5 mr-2" />
                    휴면 처리
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* 파이프라인 스테퍼 */}
          {!(['CONVERTED', 'LOST', 'DORMANT'] as string[]).includes(lead.status) && (
            <div className="pb-4">
              <PipelineStepper currentStatus={lead.status} onStatusChange={handleStatusChange} />
            </div>
          )}
        </div>
      </div>

      {/* ─── 본문 ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ─── 좌측: 사이드바 정보 ─── */}
          <div className="lg:col-span-1 space-y-4">
            {/* 핵심 지표 카드 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border p-4">
                <div className="text-xs text-muted-foreground mb-1">예상 금액</div>
                <div className="text-lg font-bold text-slate-900">{formatCurrency(lead.expectedAmount)}</div>
              </div>
              <div className="bg-white rounded-xl border p-4">
                <div className="text-xs text-muted-foreground mb-1">진행률</div>
                <div className="text-lg font-bold text-slate-900">{progress}%</div>
                <Progress value={progress} className="h-1.5 mt-1.5" />
              </div>
            </div>

            {/* 회사 정보 */}
            <div className="bg-white rounded-xl border">
              <div className="px-4 py-3 border-b">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  회사 정보
                </h3>
              </div>
              <div className="px-4 py-1 divide-y divide-slate-100">
                {isEditing ? (
                  <div className="py-3 space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">회사명</Label>
                      <Input value={editForm.companyName || ''} onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">유입 경로</Label>
                      <Select value={editForm.source || ''} onValueChange={(v) => setEditForm({ ...editForm, source: v as LeadSource })}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(SOURCE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">문의 유형</Label>
                      <Select value={editForm.inquiryType || ''} onValueChange={(v) => setEditForm({ ...editForm, inquiryType: v })}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(INQUIRY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <>
                    <InfoRow icon={Building2} label="회사명" value={lead.companyName} />
                    <InfoRow icon={Target} label="유입 경로" value={SOURCE_LABELS[lead.source] || lead.source} />
                    <InfoRow icon={Briefcase} label="문의 유형" value={INQUIRY_LABELS[lead.inquiryType || ''] || '-'} />
                    <InfoRow icon={CalendarDays} label="등록일" value={formatDate(lead.createdAt)} />
                    <InfoRow icon={Hash} label="리드 번호" value={
                      <span className="font-mono text-xs">{lead.leadNumber}</span>
                    } action={
                      <button onClick={() => copyToClipboard(lead.leadNumber)} className="p-0.5 hover:bg-slate-100 rounded">
                        <Copy className="w-3 h-3" />
                      </button>
                    } />
                  </>
                )}
              </div>
            </div>

            {/* 담당자 정보 */}
            <div className="bg-white rounded-xl border">
              <div className="px-4 py-3 border-b">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  담당자 정보
                </h3>
              </div>
              <div className="px-4 py-1 divide-y divide-slate-100">
                {isEditing ? (
                  <div className="py-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">담당자명</Label>
                        <Input value={editForm.contactName || ''} onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })} className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">직책</Label>
                        <Input value={editForm.position || ''} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })} className="h-8 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">연락처</Label>
                      <Input value={editForm.contactPhone || ''} onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">이메일</Label>
                      <Input value={editForm.contactEmail || ''} onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })} className="h-8 text-sm" />
                    </div>
                  </div>
                ) : (
                  <>
                    <InfoRow icon={User} label="담당자" value={
                      <span className="font-medium">{lead.contactName}</span>
                    } />
                    <InfoRow icon={Briefcase} label="직책" value={lead.position} />
                    <InfoRow icon={Phone} label="연락처" value={lead.contactPhone} action={
                      lead.contactPhone ? (
                        <a href={`tel:${lead.contactPhone}`} className="p-0.5 hover:bg-slate-100 rounded">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : null
                    } />
                    <InfoRow icon={Mail} label="이메일" value={lead.contactEmail} action={
                      lead.contactEmail ? (
                        <a href={`mailto:${lead.contactEmail}`} className="p-0.5 hover:bg-slate-100 rounded">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : null
                    } />
                  </>
                )}
              </div>
            </div>

            {/* 영업 정보 */}
            <div className="bg-white rounded-xl border">
              <div className="px-4 py-3 border-b">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  영업 정보
                </h3>
              </div>
              <div className="px-4 py-1 divide-y divide-slate-100">
                {isEditing ? (
                  <div className="py-3 space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">예상 금액</Label>
                      <Input type="number" value={editForm.expectedAmount || ''} onChange={(e) => setEditForm({ ...editForm, expectedAmount: Number(e.target.value) })} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">예상 계약일</Label>
                      <Input type="date" value={editForm.expectedDate?.split('T')[0] || ''} onChange={(e) => setEditForm({ ...editForm, expectedDate: e.target.value })} className="h-8 text-sm" />
                    </div>
                  </div>
                ) : (
                  <>
                    <InfoRow icon={WonSign} label="예상 금액" value={
                      <span className="font-semibold text-slate-900">{formatCurrency(lead.expectedAmount)}</span>
                    } />
                    <InfoRow icon={Calendar} label="예상 계약일" value={formatDate(lead.expectedDate)} />
                    <InfoRow icon={Activity} label="현재 단계" value={
                      lead.stage ? (
                        <Badge variant="outline" className="text-xs" style={{ borderColor: lead.stage.color, color: lead.stage.color }}>
                          {lead.stage.name}
                        </Badge>
                      ) : '-'
                    } />
                  </>
                )}
              </div>
            </div>

            {/* 편집 모드 저장/취소 */}
            {isEditing && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1" size="sm">취소</Button>
                <Button onClick={handleSave} className="flex-1" size="sm">저장</Button>
              </div>
            )}
          </div>

          {/* ─── 우측: 메인 콘텐츠 ─── */}
          <div className="lg:col-span-2 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="bg-white rounded-xl border">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
                  <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm">
                    개요
                  </TabsTrigger>
                  <TabsTrigger value="activities" className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm">
                    활동 기록
                    {activities.length > 0 && (
                      <span className="ml-1.5 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{activities.length}</span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="quotations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm">
                    견적서
                    {quotations.length > 0 && (
                      <span className="ml-1.5 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{quotations.length}</span>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* 개요 탭 */}
                <TabsContent value="overview" className="p-5 space-y-6 mt-0">
                  {/* 문의 내용 */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">문의 내용</h4>
                    {isEditing ? (
                      <Textarea
                        value={editForm.inquiryDetail || ''}
                        onChange={(e) => setEditForm({ ...editForm, inquiryDetail: e.target.value })}
                        rows={4}
                        className="text-sm"
                        placeholder="문의 내용을 입력하세요..."
                      />
                    ) : (
                      <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 leading-relaxed">
                        {lead.inquiryDetail || (
                          <span className="text-muted-foreground italic">문의 내용이 없습니다.</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 상태 변경 (터미널 상태일 때) */}
                  {(['CONVERTED', 'LOST', 'DORMANT'] as string[]).includes(lead.status) && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-3">상태 변경</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                          const Icon = config.icon;
                          return (
                            <Button
                              key={key}
                              variant={lead.status === key ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleStatusChange(key)}
                              disabled={lead.status === key}
                              className="text-xs h-8"
                            >
                              <Icon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 최근 활동 미리보기 */}
                  {activities.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-slate-900">최근 활동</h4>
                        <button onClick={() => setActiveTab('activities')} className="text-xs text-blue-600 hover:text-blue-700">
                          전체 보기 →
                        </button>
                      </div>
                      <div className="space-y-2">
                        {activities.slice(0, 3).map((activity: LeadActivity) => {
                          const config = ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG.NOTE;
                          const Icon = config.icon;
                          return (
                            <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                              <div className={`w-7 h-7 rounded-full ${config.color} flex items-center justify-center shrink-0`}>
                                <Icon className="w-3.5 h-3.5 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium truncate">{activity.subject}</span>
                                  <span className="text-xs text-muted-foreground shrink-0 ml-2">{formatDateTime(activity.contactedAt)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{activity.content}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 연결된 견적서 미리보기 */}
                  {quotations.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-slate-900">연결된 견적서</h4>
                        <button onClick={() => setActiveTab('quotations')} className="text-xs text-blue-600 hover:text-blue-700">
                          전체 보기 →
                        </button>
                      </div>
                      <div className="space-y-2">
                        {quotations.slice(0, 2).map((q: any) => (
                          <div
                            key={q.id}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => router.push(`/quotations/${q.id}`)}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{q.quotationNumber}</p>
                                <p className="text-xs text-muted-foreground truncate">{q.projectName}</p>
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-slate-900 shrink-0 ml-3">
                              {formatCurrency(Number(q.totalAmount))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* 활동 기록 탭 */}
                <TabsContent value="activities" className="p-5 mt-0">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-slate-900">활동 타임라인</h4>
                    <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="h-8 text-xs">
                          <Plus className="w-3 h-3 mr-1" />
                          활동 추가
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>활동 추가</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs">유형</Label>
                            <Select value={newActivity.type} onValueChange={(v) => setNewActivity({ ...newActivity, type: v })}>
                              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Object.entries(ACTIVITY_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">제목</Label>
                            <Input value={newActivity.subject} onChange={(e) => setNewActivity({ ...newActivity, subject: e.target.value })} className="h-9" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">내용</Label>
                            <Textarea value={newActivity.content} onChange={(e) => setNewActivity({ ...newActivity, content: e.target.value })} rows={3} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">다음 액션</Label>
                              <Input value={newActivity.nextAction} onChange={(e) => setNewActivity({ ...newActivity, nextAction: e.target.value })} className="h-9" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">다음 일정</Label>
                              <Input type="datetime-local" value={newActivity.nextDate} onChange={(e) => setNewActivity({ ...newActivity, nextDate: e.target.value })} className="h-9" />
                            </div>
                          </div>
                          <Button onClick={handleAddActivity} className="w-full">추가</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {activities.length > 0 ? (
                    <div className="relative">
                      {/* 타임라인 라인 */}
                      <div className="absolute left-[15px] top-4 bottom-4 w-px bg-slate-200" />
                      <div className="space-y-1">
                        {activities.map((activity: LeadActivity, idx: number) => {
                          const config = ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG.NOTE;
                          const Icon = config.icon;
                          return (
                            <div key={activity.id} className="relative flex gap-4 py-3">
                              <div className={`w-8 h-8 rounded-full ${config.color} flex items-center justify-center shrink-0 z-10 ring-4 ring-white`}>
                                <Icon className="w-3.5 h-3.5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0 bg-slate-50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{activity.subject}</span>
                                    <Badge variant="outline" className="text-[10px] h-5">{config.label}</Badge>
                                  </div>
                                  <span className="text-xs text-muted-foreground">{formatDateTime(activity.contactedAt)}</span>
                                </div>
                                <p className="text-sm text-slate-600">{activity.content}</p>
                                {activity.nextAction && (
                                  <div className="mt-2 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded px-2.5 py-1.5">
                                    <Zap className="w-3 h-3" />
                                    <span>{activity.nextAction}</span>
                                    {activity.nextDate && <span className="text-amber-500">· {formatDateTime(activity.nextDate)}</span>}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">활동 기록이 없습니다.</p>
                      <p className="text-xs text-muted-foreground mt-1">첫 번째 활동을 추가해보세요.</p>
                    </div>
                  )}
                </TabsContent>

                {/* 견적서 탭 */}
                <TabsContent value="quotations" className="p-5 mt-0">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-slate-900">연결된 견적서</h4>
                    <Button size="sm" className="h-8 text-xs" onClick={() => router.push(`/quotations/new?leadId=${lead.id}`)}>
                      <Plus className="w-3 h-3 mr-1" />
                      견적서 작성
                    </Button>
                  </div>

                  {quotations.length > 0 ? (
                    <div className="space-y-2">
                      {quotations.map((q: any) => (
                        <div
                          key={q.id}
                          className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors group"
                          onClick={() => router.push(`/quotations/${q.id}`)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4 text-violet-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{q.quotationNumber}</p>
                              <p className="text-xs text-muted-foreground truncate">{q.projectName || '프로젝트명 없음'}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <p className="text-sm font-semibold">{formatCurrency(Number(q.totalAmount))}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(q.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">연결된 견적서가 없습니다.</p>
                      <p className="text-xs text-muted-foreground mt-1">새 견적서를 작성해보세요.</p>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      {/* 미진행 사유 다이얼로그 */}
      <LostReasonDialog
        open={lostReasonDialogOpen}
        onOpenChange={setLostReasonDialogOpen}
        leadId={lead.id}
        leadNumber={lead.leadNumber}
        onSubmit={handleLostReasonSubmit}
      />
    </div>
  );
}
