'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Plus, Building2, User, Phone, GripVertical, ChevronRight } from 'lucide-react';
import { getPipelineBoard, updateLeadStage, Lead, PipelineStage } from '@/lib/lead-api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
      <div className="flex justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">파이프라인</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">드래그 앤 드롭으로 리드 단계를 변경하세요</p>
          <p className="text-sm text-muted-foreground sm:hidden">리드 단계별 현황</p>
        </div>
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
      </div>

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
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: stage.color || '#6B7280' }}
                        />
                        <CardTitle className="text-sm font-medium">{stage.name}</CardTitle>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {stage.leads?.length || 0}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 min-h-[400px]">
                    {stage.leads?.map((lead) => (
                      <Card
                        key={lead.id}
                        className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead)}
                        onClick={() => router.push(`/leads/${lead.id}`)}
                      >
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <GripVertical className="w-4 h-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{lead.leadNumber}</span>
                            </div>
                            {lead.expectedAmount && (
                              <Badge variant="outline" className="text-xs">
                                {formatAmount(lead.expectedAmount)}
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 font-medium">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span className="truncate">{lead.companyName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="w-3 h-3" />
                              <span>{lead.contactName}</span>
                            </div>
                            {lead.contactPhone && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                <span>{lead.contactPhone}</span>
                              </div>
                            )}
                          </div>
                          {lead._count && lead._count.activities > 0 && (
                            <div className="text-xs text-muted-foreground">
                              활동 {lead._count.activities}건
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    {(!stage.leads || stage.leads.length === 0) && (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        리드 없음
                      </div>
                    )}
                  </CardContent>
                </Card>
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
    <Card>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 touch-manipulation"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: stage.color || '#6B7280' }}
          />
          <span className="text-sm font-medium">{stage.name}</span>
          <Badge variant="secondary" className="text-xs">{leadCount}</Badge>
        </div>
        <ChevronRight className={cn(
          'w-4 h-4 text-muted-foreground transition-transform',
          expanded && 'rotate-90'
        )} />
      </button>

      {expanded && leadCount > 0 && (
        <CardContent className="pt-0 pb-3 px-3 space-y-2">
          {stage.leads?.map((lead) => (
            <Card
              key={lead.id}
              className="touch-manipulation active:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => onLeadClick(lead.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-xs font-mono text-muted-foreground">{lead.leadNumber}</span>
                  {lead.expectedAmount && (
                    <span className="text-xs font-semibold">{formatAmount(lead.expectedAmount)}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{lead.companyName}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <User className="w-3 h-3 flex-shrink-0" />
                  <span>{lead.contactName}</span>
                  {lead.contactPhone && (
                    <>
                      <span className="text-border">·</span>
                      <span>{lead.contactPhone}</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      )}

      {expanded && leadCount === 0 && (
        <CardContent className="pt-0 pb-4">
          <div className="text-center text-xs text-muted-foreground py-3">리드 없음</div>
        </CardContent>
      )}
    </Card>
  );
}
