'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import Skeleton from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  FolderKanban, RefreshCw, ChevronRight, Check, Clock, Circle,
  Paperclip, Trash2, Image as ImageIcon, FileText, X,
} from 'lucide-react';
import { testReceptionApi, projectStageApi } from '@/lib/customer-data-api';
import type { TestReception } from '@/types/customer';
import { cn } from '@/lib/utils';

// 진행 단계 정의
const PROJECT_STAGES = [
  { key: 'PLAN_DELIVERY', label: '시험계획서 전달', shortLabel: '계획서' },
  { key: 'DRAFT_REPORT', label: '보고서(안) 발행', shortLabel: '보고서(안)' },
  { key: 'FINAL_REPORT', label: '최종보고서 발행', shortLabel: '최종보고서' },
  { key: 'INVOICE_ISSUED', label: '세금계산서 발행', shortLabel: '세금계산서' },
] as const;

type StageKey = typeof PROJECT_STAGES[number]['key'];

function getStageIndex(stage: string): number {
  return PROJECT_STAGES.findIndex(s => s.key === stage);
}

interface ProjectAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

interface ProjectData extends TestReception {
  projectStage?: string;
  projectStageHistory?: { stage: string; date: string; note: string; updatedBy: string }[];
  projectAttachments?: ProjectAttachment[];
}

// ─── 스테퍼 컴포넌트 ───
function StageStepper({ currentStage, onStageClick }: {
  currentStage: string;
  onStageClick?: (stage: StageKey) => void;
}) {
  const currentIdx = getStageIndex(currentStage);

  return (
    <div className="flex items-center gap-1">
      {PROJECT_STAGES.map((stage, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isPending = idx > currentIdx;

        return (
          <div key={stage.key} className="flex items-center">
            <button
              onClick={() => onStageClick?.(stage.key)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
                isCompleted && 'bg-green-50 text-green-700 hover:bg-green-100',
                isCurrent && 'bg-blue-50 text-blue-700 font-medium hover:bg-blue-100',
                isPending && 'bg-slate-50 text-slate-400 hover:bg-slate-100',
              )}
            >
              {isCompleted ? (
                <Check className="w-3 h-3" />
              ) : isCurrent ? (
                <Clock className="w-3 h-3" />
              ) : (
                <Circle className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">{stage.shortLabel}</span>
            </button>
            {idx < PROJECT_STAGES.length - 1 && (
              <ChevronRight className={cn('w-3 h-3 mx-0.5', isCompleted ? 'text-green-400' : 'text-slate-300')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── 상세 패널 ───
function ProjectDetailPanel({ project, onClose, onUpdate }: {
  project: ProjectData;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const { toast } = useToast();
  const [stageNote, setStageNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [attachUrl, setAttachUrl] = useState('');
  const [attachName, setAttachName] = useState('');

  const currentIdx = getStageIndex(project.projectStage || 'PLAN_DELIVERY');
  const history = project.projectStageHistory || [];
  const attachments = project.projectAttachments || [];

  const handleAdvanceStage = async (targetStage: StageKey) => {
    setUpdating(true);
    try {
      await projectStageApi.updateStage(project.id, targetStage, stageNote);
      toast({ title: '단계 업데이트 완료' });
      setStageNote('');
      onUpdate();
    } catch {
      toast({ title: '오류', description: '단계 업데이트에 실패했습니다', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const handleAddAttachment = async () => {
    if (!attachUrl || !attachName) return;
    try {
      await projectStageApi.addAttachment(project.id, {
        name: attachName,
        url: attachUrl,
        type: attachUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 'file',
      });
      toast({ title: '첨부파일 추가 완료' });
      setAttachUrl('');
      setAttachName('');
      onUpdate();
    } catch {
      toast({ title: '오류', description: '첨부파일 추가에 실패했습니다', variant: 'destructive' });
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    try {
      await projectStageApi.removeAttachment(project.id, attachmentId);
      toast({ title: '첨부파일 삭제 완료' });
      onUpdate();
    } catch {
      toast({ title: '오류', description: '삭제에 실패했습니다', variant: 'destructive' });
    }
  };

  return (
    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-base flex items-center gap-2">
          <FolderKanban className="w-4 h-4" />
          {project.test_number || '시험번호 미발행'} — {project.test_title || '제목 없음'}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-5">
        {/* 프로젝트 기본 정보 */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">물질코드:</span> {project.substance_code || '-'}</div>
          <div><span className="text-muted-foreground">프로젝트코드:</span> {project.project_code || '-'}</div>
          <div><span className="text-muted-foreground">시험물질:</span> {project.substance_name || '-'}</div>
          <div><span className="text-muted-foreground">의뢰기관:</span> {project.institution_name || '-'}</div>
          <div><span className="text-muted-foreground">시험책임자:</span> {project.test_director || '-'}</div>
          <div><span className="text-muted-foreground">상태:</span> {project.status}</div>
        </div>

        {/* 진행 단계 스테퍼 (큰 버전) */}
        <div>
          <h4 className="text-sm font-semibold mb-3">진행 단계</h4>
          <div className="space-y-2">
            {PROJECT_STAGES.map((stage, idx) => {
              const isCompleted = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              const stageHistoryItem = history.find((h: any) => h.stage === stage.key);

              return (
                <div
                  key={stage.key}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border',
                    isCompleted && 'border-green-200 bg-green-50/50',
                    isCurrent && 'border-blue-200 bg-blue-50/50',
                    !isCompleted && !isCurrent && 'border-slate-100',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                      isCompleted && 'bg-green-600 text-white',
                      isCurrent && 'bg-blue-600 text-white',
                      !isCompleted && !isCurrent && 'bg-slate-200 text-slate-500',
                    )}>
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <div>
                      <p className={cn('text-sm', (isCompleted || isCurrent) && 'font-medium')}>{stage.label}</p>
                      {stageHistoryItem && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(stageHistoryItem.date).toLocaleDateString('ko-KR')}
                          {stageHistoryItem.note && ` — ${stageHistoryItem.note}`}
                        </p>
                      )}
                    </div>
                  </div>
                  {!isCompleted && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      disabled={updating}
                      onClick={() => handleAdvanceStage(stage.key)}
                    >
                      {isCurrent ? '완료 처리' : '이 단계로 설정'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* 메모 입력 */}
          <div className="mt-3">
            <Textarea
              placeholder="단계 전환 메모 (선택사항)"
              value={stageNote}
              onChange={(e) => setStageNote(e.target.value)}
              className="text-sm h-16 resize-none"
            />
          </div>
        </div>

        {/* 첨부파일 */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Paperclip className="w-4 h-4" /> 첨부파일
          </h4>

          {attachments.length > 0 && (
            <div className="space-y-2 mb-3">
              {attachments.map((att: ProjectAttachment) => (
                <div key={att.id} className="flex items-center justify-between p-2 rounded border text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    {att.type === 'image' ? (
                      <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <a href={att.url} target="_blank" rel="noopener noreferrer"
                      className="truncate text-blue-600 hover:underline">
                      {att.name}
                    </a>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(att.uploadedAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveAttachment(att.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* 이미지/파일 URL 입력 */}
          <div className="flex gap-2">
            <Input
              placeholder="파일명"
              value={attachName}
              onChange={(e) => setAttachName(e.target.value)}
              className="text-sm flex-1"
            />
            <Input
              placeholder="URL (이미지 또는 파일 링크)"
              value={attachUrl}
              onChange={(e) => setAttachUrl(e.target.value)}
              className="text-sm flex-[2]"
            />
            <Button variant="outline" size="sm" onClick={handleAddAttachment}
              disabled={!attachUrl || !attachName}>
              추가
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}


// ─── 메인 탭 컴포넌트 ───
export default function ProjectManagementTab({ customerId }: { customerId: string }) {
  const { toast } = useToast();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await testReceptionApi.getByCustomerId(customerId);
      setProjects(data as ProjectData[]);
    } catch {
      setError('프로젝트 데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUpdate = () => {
    loadData();
    // 선택된 프로젝트도 갱신
    if (selectedProject) {
      testReceptionApi.getById(selectedProject.id).then(updated => {
        if (updated) setSelectedProject(updated as ProjectData);
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#FAF2E9] rounded-xl p-6 text-center">
          <p className="text-sm text-destructive mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-1" /> 재시도
          </Button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-[#FAF2E9] rounded-xl p-6 text-center">
          <FolderKanban className="w-8 h-8 mx-auto mb-2 text-slate-500" />
          <p className="text-sm text-slate-500">등록된 프로젝트가 없습니다</p>
          <p className="text-xs text-slate-500 mt-1">시험접수 탭에서 시험을 등록하면 여기에 표시됩니다</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#FAF2E9] rounded-xl md:rounded-[2.5rem] p-4 md:p-8 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr>
              <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">물질코드</th>
              <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">프로젝트코드</th>
              <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">시험물질</th>
              <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">의뢰기관</th>
              <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">시험번호</th>
              <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">시험제목</th>
              <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">시험책임자</th>
              <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">진행단계</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map(p => (
              <tr
                key={p.id}
                className="hover:bg-[#FFF8F1] cursor-pointer transition-colors"
                onClick={() => setSelectedProject(p)}
              >
                <td className="py-2.5 px-3 whitespace-nowrap">{p.substance_code || '-'}</td>
                <td className="py-2.5 px-3 whitespace-nowrap">{p.project_code || '-'}</td>
                <td className="py-2.5 px-3 whitespace-nowrap">{p.substance_name || '-'}</td>
                <td className="py-2.5 px-3 whitespace-nowrap">{p.institution_name || '-'}</td>
                <td className="py-2.5 px-3 whitespace-nowrap font-mono text-xs">{p.test_number || '-'}</td>
                <td className="py-2.5 px-3 max-w-[200px] truncate">{p.test_title || '-'}</td>
                <td className="py-2.5 px-3 whitespace-nowrap">{p.test_director || '-'}</td>
                <td className="py-2.5 px-3">
                  <StageStepper currentStage={p.projectStage || 'PLAN_DELIVERY'} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 상세 다이얼로그 */}
      <Dialog open={!!selectedProject} onOpenChange={(open) => { if (!open) setSelectedProject(null); }}>
        {selectedProject && (
          <ProjectDetailPanel
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
            onUpdate={handleUpdate}
          />
        )}
      </Dialog>
    </>
  );
}
