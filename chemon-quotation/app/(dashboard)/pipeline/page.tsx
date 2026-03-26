'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Plus, Building2, User, Phone, GripVertical, ChevronRight } from 'lucide-react';
import { getPipelineBoard, updateLeadStage, Lead, PipelineStage } from '@/lib/lead-api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { StitchPageHeader } from '@/components/ui/StitchPageHeader';

export default function PipelinePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getPipelineBoard();
      if (res.success && res.data?.stages) {
        setStages(res.data.stages);
      }
    } catch (error) {
      toast({ title: '오류', description: '데이터를 불러오는데 실패했습니다.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    if (!draggedLead || draggedLead.stageId === targetStageId) {
      setDraggedLead(null);
      return;
    }

    try {
      await updateLeadStage(draggedLead.id, targetStageId);
      toast({ title: '성공', description: '리드 단계가 변경되었습니다.' });
      loadData();
    } catch (error) {
      toast({ title: '오류', description: '단계 변경에 실패했습니다.', variant: 'destructive' });
    } finally {
      setDraggedLead(null);
    }
  };

  const formatAmount = (amount?: number) => {
    if (!amount) return '';
    return `${(amount / 10000).toFixed(0)}만원`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StitchPageHeader
        label="PIPELINE"
        title="파이프라인"
        description="드래그 앤 드롭으로 리드 단계를 변경하세요"
        actions={
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => router.push('/leads')}>
              리스트
            </Button>
            <Button size="sm" onClick={() => router.push('/leads/new')}>
              <Plus className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">새 리드</span>
              <span className="sm:hidden">추가</span>
            </Button>
          </div>
        }
      />

      {/* 모바일: 단계별 아코디언 리스트 */}
      <div className="md:hidden space-y-3">
        {stages.map((stage) => (
          <MobilePipelineStage
            key={stage.id}
            stage={stage}
            onLeadClick={(id) => router.push(`/leads/${id}`)}
            formatAmount={formatAmount}
          />
        ))}
      </div>

      {/* 데스크톱: 칸반 보드 */}
      <div className="hidden md:block">
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4" style={{ minWidth: stages.length * 300 }}>
            {stages.map((stage) => (
              <div
                key={stage.id}
                className="w-[280px] flex-shrink-0"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                <div className="h-full bg-[#FAF2E9] rounded-xl p-4">
                  <div className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: stage.color || '#6B7280' }}
                        />
                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{stage.name}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-600 bg-[#F5EDE3] px-2 py-0.5 rounded-full">
                        {stage.leads?.length || 0}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 min-h-[400px]">
                    {stage.leads?.map((lead) => (
                      <div
                        key={lead.id}
                        className="bg-white rounded-xl p-3 space-y-2 cursor-grab active:cursor-grabbing hover:translate-y-[-2px] shadow-ambient transition-all duration-200"
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead)}
                        onClick={() => router.push(`/leads/${lead.id}`)}
                      >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <GripVertical className="w-4 h-4 text-slate-400" />
                              <span className="text-xs text-slate-500">{lead.leadNumber}</span>
                            </div>
                            {lead.expectedAmount && (
                              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                                {formatAmount(lead.expectedAmount)}
                              </span>
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 font-bold text-slate-900">
                              <Building2 className="w-4 h-4 text-slate-400" />
                              <span className="truncate">{lead.companyName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <User className="w-3 h-3" />
                              <span>{lead.contactName}</span>
                            </div>
                            {lead.contactPhone && (
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Phone className="w-3 h-3" />
                                <span>{lead.contactPhone}</span>
                              </div>
                            )}
                          </div>
                          {lead._count && lead._count.activities > 0 && (
                            <div className="text-xs text-slate-500">
                              활동 {lead._count.activities}건
                            </div>
                          )}
                      </div>
                    ))}
                    {(!stage.leads || stage.leads.length === 0) && (
                      <div className="text-center py-8 text-sm text-slate-500">
                        리드 없음
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}

// 모바일 파이프라인 단계 컴포넌트
function MobilePipelineStage({
  stage,
  onLeadClick,
  formatAmount,
}: {
  stage: PipelineStage;
  onLeadClick: (id: string) => void;
  formatAmount: (amount?: number) => string;
}) {
  const [expanded, setExpanded] = useState(true);
  const leadCount = stage.leads?.length || 0;

  return (
    <div className="bg-[#FAF2E9] rounded-xl">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 touch-manipulation"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: stage.color || '#6B7280' }}
          />
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{stage.name}</span>
          <span className="text-xs font-bold text-slate-600 bg-[#F5EDE3] px-2 py-0.5 rounded-full">{leadCount}</span>
        </div>
        <ChevronRight className={cn(
          'w-4 h-4 text-slate-400 transition-transform',
          expanded && 'rotate-90'
        )} />
      </button>

      {expanded && leadCount > 0 && (
        <div className="pt-0 pb-3 px-3 space-y-2">
          {stage.leads?.map((lead) => (
            <div
              key={lead.id}
              className="bg-white rounded-xl p-3 touch-manipulation active:bg-[#FFF8F1] transition-all cursor-pointer shadow-ambient"
              onClick={() => onLeadClick(lead.id)}
            >
                <div className="flex items-start justify-between mb-1">
                  <span className="text-xs font-mono text-slate-500">{lead.leadNumber}</span>
                  {lead.expectedAmount && (
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{formatAmount(lead.expectedAmount)}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{lead.companyName}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <User className="w-3 h-3 flex-shrink-0" />
                  <span>{lead.contactName}</span>
                  {lead.contactPhone && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span>{lead.contactPhone}</span>
                    </>
                  )}
                </div>
            </div>
          ))}
        </div>
      )}

      {expanded && leadCount === 0 && (
        <div className="pt-0 pb-4 px-3">
          <div className="text-center text-xs text-slate-500 py-3">리드 없음</div>
        </div>
      )}
    </div>
  );
}
