'use client';

import { useMemo } from 'react';
import { STUDY_MODELS, STUDY_CATEGORIES } from '@/lib/efficacy-v2/study-models';
import { STEP_TYPE_CONFIG } from '@/types/efficacy-v2';
import type { StudyModelTemplate } from '@/types/efficacy-v2';
import { useEfficacyQuotationStore } from '@/stores/efficacyQuotationStore';

function MiniTimeline({ durations }: { durations: string[] }) {
  const steps = durations.map(d => {
    const m = d.match(/^(\d+)-(week|day|hour)$/);
    return { dur: m ? parseInt(m[1]) : 1, unit: m?.[2] ?? 'week' };
  });
  const totalDays = steps.reduce((s, st) => s + (st.unit === 'week' ? st.dur * 7 : st.unit === 'day' ? st.dur : 1), 0);
  const types: (keyof typeof STEP_TYPE_CONFIG)[] = ['acclimation', 'induction', 'administration', 'analysis'];

  return (
    <div className="flex items-end gap-0 overflow-x-auto pb-1 pt-3">
      {steps.map((st, i) => {
        const days = st.unit === 'week' ? st.dur * 7 : st.unit === 'day' ? st.dur : 1;
        const pct = Math.max((days / totalDays) * 100, 6);
        const type = types[i] ?? 'custom';
        const color = STEP_TYPE_CONFIG[type]?.color ?? '#64748b';
        return (
          <div key={i} className="flex flex-col items-center" style={{ flex: `${pct} 0 0%`, minWidth: '40px' }}>
            <div className="w-full rounded flex items-center justify-center text-white px-1" style={{ background: color, height: '22px', fontSize: '8px' }}>
              <span className="truncate">{st.dur}{st.unit === 'week' ? '주' : st.unit === 'day' ? '일' : 'h'}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ModelSelector() {
  const { selectedModel, selectedCategory, setCategory, selectModel } = useEfficacyQuotationStore();

  const filtered = useMemo(() => {
    if (!selectedCategory) return STUDY_MODELS;
    return STUDY_MODELS.filter(m => m.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="space-y-4">
      <select
        value={selectedCategory}
        onChange={e => setCategory(e.target.value)}
        className="px-3 py-2 border border-border rounded-lg text-xs bg-white w-64 focus:ring-1 focus:ring-ring outline-none"
      >
        <option value="">전체 카테고리 ({STUDY_MODELS.length})</option>
        {STUDY_CATEGORIES.map(c => (
          <option key={c.code} value={c.name}>{c.code}. {c.name}</option>
        ))}
      </select>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map(m => (
          <ModelCard
            key={m.id}
            model={m}
            isSelected={selectedModel?.id === m.id}
            onSelect={() => selectModel(m)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-sm text-muted-foreground">해당 카테고리에 모델이 없습니다.</div>
      )}
    </div>
  );
}

function ModelCard({ model, isSelected, onSelect }: { model: StudyModelTemplate; isSelected: boolean; onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-200' : 'border-border bg-white hover:border-blue-300'
      }`}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-foreground truncate">{model.title}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {model.speciesRaw.split('(')[0].trim()} | {model.ageWeeks ?? '?'}주령 | {model.durationWeeks ?? '?'}주
          </div>
        </div>
        <span className="px-1.5 py-0.5 border border-border text-muted-foreground text-[9px] rounded shrink-0 ml-2">
          {model.categoryCode}
        </span>
      </div>
      <MiniTimeline durations={model.scheduleDurations} />
    </div>
  );
}
