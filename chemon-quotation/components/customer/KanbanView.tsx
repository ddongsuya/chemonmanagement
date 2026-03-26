'use client';

/**
 * KanbanView - @dnd-kit 기반 칸반 보드
 */

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import type { UnifiedEntity } from '@/types/unified-customer';
import { CUSTOMER_GRADE_STAGE_MAP } from '@/types/unified-customer';
import type { CustomerGrade } from '@/types/customer';
import { useDroppable } from '@dnd-kit/core';

interface KanbanViewProps {
  entities: UnifiedEntity[];
  onStageChange?: (entityId: string, newStage: string) => Promise<void>;
  onClick?: (entity: UnifiedEntity) => void;
}

const KANBAN_STAGES: { key: CustomerGrade; label: string; color: string }[] = [
  { key: 'LEAD', label: '리드', color: '#6B7280' },
  { key: 'PROSPECT', label: '잠재고객', color: '#3B82F6' },
  { key: 'CUSTOMER', label: '고객', color: '#10B981' },
  { key: 'VIP', label: 'VIP', color: '#8B5CF6' },
  { key: 'INACTIVE', label: '비활성', color: '#EF4444' },
];

function KanbanCard({ entity, onClick }: { entity: UnifiedEntity; onClick?: (e: UnifiedEntity) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entity.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'bg-white rounded-xl p-4 cursor-grab active:cursor-grabbing shadow-ambient hover:translate-y-[-2px] transition-all duration-200',
        isDragging && 'opacity-50 shadow-ambient'
      )}
      onClick={() => onClick?.(entity)}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold text-slate-900 truncate">{entity.companyName}</span>
        {entity.healthScore != null && (
          <span className={cn(
            'text-xs font-bold rounded-full px-1.5',
            entity.healthScore >= 70 ? 'text-green-600' : entity.healthScore >= 40 ? 'text-yellow-600' : 'text-red-600'
          )}>
            {entity.healthScore}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500 truncate">{entity.contactName}</p>
      {entity.tags && entity.tags.length > 0 && (
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {entity.tags.slice(0, 2).map(t => (
            <span key={t} className="rounded-full bg-[#F5EDE3] px-2 py-0.5 text-[10px] font-bold text-slate-600">{t}</span>
          ))}
          {entity.tags.length > 2 && <span className="text-[10px] text-slate-400">+{entity.tags.length - 2}</span>}
        </div>
      )}
    </div>
  );
}

function KanbanColumn({ stage, entities, onClick }: {
  stage: { key: string; label: string; color: string };
  entities: UnifiedEntity[];
  onClick?: (e: UnifiedEntity) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col bg-[#FAF2E9] rounded-xl min-w-[260px] w-[260px] flex-shrink-0',
        isOver && 'ring-2 ring-primary/50'
      )}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{stage.label}</span>
        </div>
        <span className="rounded-full bg-[#F5EDE3] px-2 py-0.5 text-xs font-bold text-slate-600">{entities.length}</span>
      </div>
      <div className="flex flex-col gap-2 p-2 overflow-y-auto max-h-[calc(100vh-300px)]">
        <SortableContext items={entities.map(e => e.id)} strategy={verticalListSortingStrategy}>
          {entities.map(entity => (
            <KanbanCard key={entity.id} entity={entity} onClick={onClick} />
          ))}
        </SortableContext>
        {entities.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-4">항목 없음</p>
        )}
      </div>
    </div>
  );
}

export function KanbanView({ entities, onStageChange, onClick }: KanbanViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Group entities by grade/stage
  const grouped = KANBAN_STAGES.reduce<Record<string, UnifiedEntity[]>>((acc, stage) => {
    acc[stage.key] = entities.filter(e => {
      if (e.entityType === 'LEAD') return stage.key === 'LEAD';
      return (e.grade || 'CUSTOMER') === stage.key;
    });
    return acc;
  }, {});

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const entityId = active.id as string;
    const targetStage = over.id as string;

    // Check if dropped on a column
    if (KANBAN_STAGES.some(s => s.key === targetStage)) {
      const entity = entities.find(e => e.id === entityId);
      if (!entity) return;
      const currentStage = entity.entityType === 'LEAD' ? 'LEAD' : (entity.grade || 'CUSTOMER');
      if (currentStage !== targetStage) {
        onStageChange?.(entityId, targetStage);
      }
    }
  }, [entities, onStageChange]);

  const activeEntity = activeId ? entities.find(e => e.id === activeId) : null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {KANBAN_STAGES.map(stage => (
          <KanbanColumn key={stage.key} stage={stage} entities={grouped[stage.key] || []} onClick={onClick} />
        ))}
      </div>
      <DragOverlay>
        {activeEntity && (
          <div className="bg-white rounded-xl p-4 shadow-ambient w-[240px]">
            <span className="text-sm font-bold text-slate-900">{activeEntity.companyName}</span>
            <p className="text-xs text-slate-500">{activeEntity.contactName}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
