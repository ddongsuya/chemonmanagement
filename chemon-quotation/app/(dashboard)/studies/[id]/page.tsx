'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Building2,
  Calendar,
  FileSignature,
  FlaskConical,
  Pencil,
  Save,
  Trash2,
  X,
  Link2,
  Unlink,
  ChevronRight,
} from 'lucide-react';
import {
  getStudy,
  updateStudy,
  updateStudyStatus,
  deleteStudy,
  unlinkTestReception,
  Study,
} from '@/lib/study-api';
import {
  StudyStatus,
  STUDY_STATUS_LABELS,
  STUDY_STATUS_COLORS,
} from '@/lib/study-dashboard-api';
import { useToast } from '@/hooks/use-toast';
import StudyDocumentTimeline from '@/components/study/StudyDocumentTimeline';

// Status flow order for the stepper
const STATUS_FLOW: StudyStatus[] = [
  'REGISTERED', 'PREPARING', 'IN_PROGRESS', 'ANALYSIS',
  'REPORT_DRAFT', 'REPORT_REVIEW', 'COMPLETED',
];

function getStatusBadgeClass(status: StudyStatus): string {
  const map: Record<StudyStatus, string> = {
    REGISTERED: 'border-gray-300 text-gray-600',
    PREPARING: 'border-blue-300 text-blue-600',
    IN_PROGRESS: 'border-green-300 text-green-600',
    ON_HOLD: 'border-amber-300 text-amber-600',
    ANALYSIS: 'border-purple-300 text-purple-600',
    REPORT_DRAFT: 'border-amber-300 text-amber-600',
    REPORT_REVIEW: 'border-pink-300 text-pink-600',
    COMPLETED: 'border-emerald-300 text-emerald-600',
    SUSPENDED: 'border-red-300 text-red-600',
  };
  return map[status] || '';
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function StudyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [study, setStudy] = useState<Study | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Study>>({});

  const loadStudy = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getStudy(id);
      setStudy(result.study);
    } catch {
      toast({ title: '오류', description: '시험 정보를 불러올 수 없습니다.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    loadStudy();
  }, [loadStudy]);

  const handleStatusChange = async (newStatus: StudyStatus) => {
    if (!study) return;
    try {
      const result = await updateStudyStatus(study.id, newStatus);
      setStudy(prev => prev ? { ...prev, ...result.study } : prev);
      toast({ title: '상태 변경', description: `${STUDY_STATUS_LABELS[newStatus]}(으)로 변경되었습니다.` });
    } catch {
      toast({ title: '오류', description: '상태 변경에 실패했습니다.', variant: 'destructive' });
    }
  };

  const startEdit = () => {
    if (!study) return;
    setEditForm({
      testName: study.testName,
      studyType: study.studyType,
      receivedDate: study.receivedDate?.split('T')[0] || '',
      startDate: study.startDate?.split('T')[0] || '',
      expectedEndDate: study.expectedEndDate?.split('T')[0] || '',
      actualEndDate: study.actualEndDate?.split('T')[0] || '',
      reportDraftDate: study.reportDraftDate?.split('T')[0] || '',
      reportFinalDate: study.reportFinalDate?.split('T')[0] || '',
      notes: study.notes || '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!study) return;
    try {
      setSaving(true);
      const result = await updateStudy(study.id, editForm);
      setStudy(prev => prev ? { ...prev, ...result.study } : prev);
      setEditing(false);
      toast({ title: '저장 완료', description: '시험 정보가 수정되었습니다.' });
    } catch {
      toast({ title: '오류', description: '저장에 실패했습니다.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!study) return;
    try {
      await deleteStudy(study.id);
      toast({ title: '삭제 완료', description: '시험이 삭제되었습니다.' });
      router.push('/studies');
    } catch {
      toast({ title: '오류', description: '삭제에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleUnlinkReception = async () => {
    if (!study) return;
    try {
      const result = await unlinkTestReception(study.id);
      setStudy(prev => prev ? { ...prev, ...result.study, testReception: null } : prev);
      toast({ title: '연결 해제', description: '시험 접수 연결이 해제되었습니다.' });
    } catch {
      toast({ title: '오류', description: '연결 해제에 실패했습니다.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-4 bg-muted rounded w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-48 bg-muted rounded-lg" />
            <div className="h-48 bg-muted rounded-lg" />
          </div>
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!study) {
    return (
      <div className="text-center py-20">
        <FlaskConical className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground">시험을 찾을 수 없습니다.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/studies')}>
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  const currentStatusIndex = STATUS_FLOW.indexOf(study.status);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" className="mt-0.5" onClick={() => router.push('/studies')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold">{study.studyNumber}</h1>
              <Badge variant="outline" className={getStatusBadgeClass(study.status)}>
                {STUDY_STATUS_LABELS[study.status]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{study.testName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                <X className="w-4 h-4 mr-1" /> 취소
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-1" /> {saving ? '저장중...' : '저장'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={startEdit}>
                <Pencil className="w-4 h-4 mr-1" /> 수정
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
                    <Trash2 className="w-4 h-4 mr-1" /> 삭제
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>시험 삭제</AlertDialogTitle>
                    <AlertDialogDescription>
                      {study.studyNumber}을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                      삭제
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      {/* 상태 스테퍼 */}
      {study.status !== 'SUSPENDED' && (
        <Card className="border shadow-sm">
          <CardContent className="py-4">
            <div className="flex items-center overflow-x-auto gap-1">
              {STATUS_FLOW.map((status, idx) => {
                const isActive = status === study.status;
                const isPast = idx < currentStatusIndex;
                const color = STUDY_STATUS_COLORS[status];
                return (
                  <React.Fragment key={status}>
                    {idx > 0 && (
                      <div className={`flex-shrink-0 w-6 h-px ${isPast ? 'bg-primary' : 'bg-border'}`} />
                    )}
                    <button
                      onClick={() => !isActive && handleStatusChange(status)}
                      disabled={isActive}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150 ${
                        isActive
                          ? 'text-white'
                          : isPast
                          ? 'bg-muted text-foreground hover:bg-muted/80'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}
                      style={isActive ? { backgroundColor: color } : undefined}
                    >
                      {STUDY_STATUS_LABELS[status]}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 메인 콘텐츠: 3컬럼 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측 2컬럼: 시험 정보 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 기본 정보 */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-muted-foreground" />
                시험 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoField label="시험번호" value={study.studyNumber} />
                <InfoField label="시험 유형" value={study.studyType || '-'} editing={editing}
                  editNode={
                    <Input value={editForm.studyType || ''} onChange={(e) => setEditForm(p => ({ ...p, studyType: e.target.value }))} />
                  } />
                <InfoField label="시험명" value={study.testName} editing={editing} colSpan
                  editNode={
                    <Input value={editForm.testName || ''} onChange={(e) => setEditForm(p => ({ ...p, testName: e.target.value }))} />
                  } />
                <InfoField label="접수일" value={formatDate(study.receivedDate)} editing={editing}
                  editNode={
                    <Input type="date" value={editForm.receivedDate || ''} onChange={(e) => setEditForm(p => ({ ...p, receivedDate: e.target.value }))} />
                  } />
                <InfoField label="시작일" value={formatDate(study.startDate)} editing={editing}
                  editNode={
                    <Input type="date" value={editForm.startDate || ''} onChange={(e) => setEditForm(p => ({ ...p, startDate: e.target.value }))} />
                  } />
                <InfoField label="예상 종료일" value={formatDate(study.expectedEndDate)} editing={editing}
                  editNode={
                    <Input type="date" value={editForm.expectedEndDate || ''} onChange={(e) => setEditForm(p => ({ ...p, expectedEndDate: e.target.value }))} />
                  } />
                <InfoField label="실제 종료일" value={formatDate(study.actualEndDate)} editing={editing}
                  editNode={
                    <Input type="date" value={editForm.actualEndDate || ''} onChange={(e) => setEditForm(p => ({ ...p, actualEndDate: e.target.value }))} />
                  } />
                <InfoField label="보고서 초안일" value={formatDate(study.reportDraftDate)} editing={editing}
                  editNode={
                    <Input type="date" value={editForm.reportDraftDate || ''} onChange={(e) => setEditForm(p => ({ ...p, reportDraftDate: e.target.value }))} />
                  } />
                <InfoField label="보고서 최종일" value={formatDate(study.reportFinalDate)} editing={editing}
                  editNode={
                    <Input type="date" value={editForm.reportFinalDate || ''} onChange={(e) => setEditForm(p => ({ ...p, reportFinalDate: e.target.value }))} />
                  } />
              </div>

              {/* 메모 */}
              <div className="mt-4">
                <label className="text-xs text-muted-foreground mb-1 block">메모</label>
                {editing ? (
                  <Textarea
                    value={editForm.notes || ''}
                    onChange={(e) => setEditForm(p => ({ ...p, notes: e.target.value }))}
                    rows={3}
                    placeholder="메모를 입력하세요..."
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{study.notes || '메모 없음'}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 시험 접수 연결 */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-muted-foreground" />
                  시험 접수 연결
                </CardTitle>
                {study.testReception && (
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 h-7"
                    onClick={handleUnlinkReception}>
                    <Unlink className="w-3.5 h-3.5 mr-1" /> 연결 해제
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {study.testReception ? (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{study.testReception.receptionNumber}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {study.testReception.customer?.company || study.testReception.customer?.name || '-'}
                      </p>
                      {study.testReception.requester && (
                        <p className="text-xs text-muted-foreground">
                          의뢰자: {study.testReception.requester.name}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">{study.testReception.status}</Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Link2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">연결된 시험 접수가 없습니다</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 우측 1컬럼: 관련 정보 */}
        <div className="space-y-6">
          {/* 계약 정보 */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-muted-foreground" />
                계약 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              {study.contract ? (
                <div
                  className="p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors duration-150"
                  onClick={() => router.push(`/contracts/${study.contract!.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium font-mono">{study.contract.contractNumber}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{study.contract.title}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                  {study.contract.customer && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                      <Building2 className="w-3 h-3" />
                      {study.contract.customer.company || study.contract.customer.name}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">계약 정보 없음</p>
              )}
            </CardContent>
          </Card>

          {/* 타임라인 */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                타임라인
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <TimelineItem label="등록" date={study.createdAt} />
                <TimelineItem label="접수일" date={study.receivedDate} />
                <TimelineItem label="시작일" date={study.startDate} />
                <TimelineItem label="예상 종료" date={study.expectedEndDate} />
                <TimelineItem label="실제 종료" date={study.actualEndDate} />
                <TimelineItem label="보고서 초안" date={study.reportDraftDate} />
                <TimelineItem label="보고서 최종" date={study.reportFinalDate} />
                <TimelineItem label="최종 수정" date={study.updatedAt} />
              </div>
            </CardContent>
          </Card>

          {/* 문서 송부 이력 */}
          <Card className="border shadow-sm">
            <CardContent className="pt-5 pb-4">
              <StudyDocumentTimeline studyId={study.id} studyCode={study.studyNumber} />
            </CardContent>
          </Card>

          {/* 중단 처리 */}
          {study.status !== 'COMPLETED' && study.status !== 'SUSPENDED' && (
            <Card className="border shadow-sm border-red-100 dark:border-red-900/30">
              <CardContent className="pt-5 pb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                  onClick={() => handleStatusChange('SUSPENDED')}
                >
                  시험 중단
                </Button>
              </CardContent>
            </Card>
          )}
          {study.status === 'SUSPENDED' && (
            <Card className="border shadow-sm border-amber-100 dark:border-amber-900/30">
              <CardContent className="pt-5 pb-4">
                <p className="text-xs text-muted-foreground mb-2">중단된 시험입니다. 재개하려면 상태를 변경하세요.</p>
                <Select onValueChange={(v) => handleStatusChange(v as StudyStatus)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="상태 변경..." />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FLOW.map((s) => (
                      <SelectItem key={s} value={s}>{STUDY_STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───

function InfoField({ label, value, editing, editNode, colSpan }: {
  label: string;
  value: string;
  editing?: boolean;
  editNode?: React.ReactNode;
  colSpan?: boolean;
}) {
  return (
    <div className={colSpan ? 'sm:col-span-2' : ''}>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      {editing && editNode ? editNode : <p className="text-sm font-medium">{value}</p>}
    </div>
  );
}

function TimelineItem({ label, date }: { label: string; date?: string | null }) {
  if (!date) return null;
  return (
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-primary/60 flex-shrink-0" />
      <div className="flex-1 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs">{formatDate(date)}</span>
      </div>
    </div>
  );
}
