'use client';

import { useState } from 'react';
import { useEfficacyQuotationStore } from '@/stores/efficacyQuotationStore';
import { STEP_TYPE_CONFIG, type ScheduleStepType } from '@/types/efficacy-v2';
import { StitchCard } from '@/components/ui/StitchCard';

function InteractiveTimeline() {
  const { scheduleSteps, updateScheduleStep, addScheduleStep, removeScheduleStep } = useEfficacyQuotationStore();
  const [editIdx, setEditIdx] = useState<number | null>(null);

  const totalDays = scheduleSteps.reduce((s, st) => {
    if (st.durationUnit === 'week') return s + st.duration * 7;
    if (st.durationUnit === 'day') return s + st.duration;
    return s + 1;
  }, 0);

  return (
    <div className="relative">
      {/* Horizontal scrollable timeline */}
      <div className="flex items-end gap-1.5 overflow-x-auto pb-12 pt-14 px-2" style={{ minHeight: '140px' }}>
        {scheduleSteps.map((st, i) => {
          const days = st.durationUnit === 'week' ? st.duration * 7 : st.durationUnit === 'day' ? st.duration : 1;
          const pct = Math.max((days / totalDays) * 100, 10);
          const color = STEP_TYPE_CONFIG[st.type]?.color ?? '#64748b';

          return (
            <div key={st.id} className="flex flex-col items-center group relative" style={{ flex: `${pct} 0 0%`, minWidth: '120px' }}>
              {/* Duration label */}
              <div className="absolute -top-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                {st.duration}{st.durationUnit === 'week' ? '주' : st.durationUnit === 'day' ? '일' : 'h'}
              </div>
              {/* Block */}
              <div
                className="w-full relative cursor-pointer"
                style={{ height: '56px' }}
                onClick={() => setEditIdx(editIdx === i ? null : i)}
              >
                <div
                  className="absolute inset-0 rounded-lg flex items-center justify-center text-white font-semibold px-3 transition-colors hover:brightness-110 shadow-sm"
                  style={{ background: color, fontSize: '13px' }}
                >
                  <span className="truncate">{st.label}</span>
                </div>
                {i < scheduleSteps.length - 1 && (
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                    <svg width="14" height="14" viewBox="0 0 16 16"><path d="M4 2l8 6-8 6z" fill={STEP_TYPE_CONFIG[scheduleSteps[i + 1]?.type]?.color ?? '#94a3b8'} /></svg>
                  </div>
                )}
              </div>

              {/* Edit popup */}
              {editIdx === i && (
                <div className="absolute top-[72px] left-1/2 -translate-x-1/2 z-40 bg-white border border-border rounded-lg shadow-sm p-4 w-80" onClick={e => e.stopPropagation()}>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground mb-1 block">단계명</label>
                      <input
                        value={st.label}
                        onChange={e => updateScheduleStep(i, { label: e.target.value })}
                        className="w-full px-3 py-1.5 border border-border rounded text-sm bg-white focus:ring-1 focus:ring-ring outline-none"
                        placeholder="단계명"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] font-medium text-muted-foreground mb-1 block">기간</label>
                        <input
                          type="number"
                          value={st.duration}
                          onChange={e => updateScheduleStep(i, { duration: Number(e.target.value) || 1 })}
                          className="w-full px-3 py-1.5 border border-border rounded text-sm focus:ring-1 focus:ring-ring outline-none"
                          min="1"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-medium text-muted-foreground mb-1 block">단위</label>
                        <select
                          value={st.durationUnit}
                          onChange={e => updateScheduleStep(i, { durationUnit: e.target.value as 'week' | 'day' | 'hour' })}
                          className="w-full px-3 py-1.5 border border-border rounded text-sm focus:ring-1 focus:ring-ring outline-none"
                        >
                          <option value="week">주</option>
                          <option value="day">일</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground mb-1 block">유형</label>
                      <select
                        value={st.type}
                        onChange={e => updateScheduleStep(i, { type: e.target.value as ScheduleStepType })}
                        className="w-full px-3 py-1.5 border border-border rounded text-sm focus:ring-1 focus:ring-ring outline-none"
                      >
                        {Object.entries(STEP_TYPE_CONFIG).map(([k, v]) => (
                          <option key={k} value={k}>{v.icon} {v.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => { addScheduleStep(i); setEditIdx(null); }}
                        className="flex-1 px-3 py-2 border border-blue-200 text-blue-600 rounded text-xs font-medium hover:bg-blue-50 transition-colors"
                      >+ 앞에 추가</button>
                      <button
                        onClick={() => { removeScheduleStep(i); setEditIdx(null); }}
                        className="flex-1 px-3 py-2 border border-red-200 text-red-600 rounded text-xs font-medium hover:bg-red-50 transition-colors"
                        disabled={scheduleSteps.length <= 1}
                      >삭제</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button onClick={() => addScheduleStep()} className="text-sm text-blue-600 hover:text-blue-800 font-semibold mt-1">+ 단계 추가</button>
      <div className="flex justify-between text-[11px] text-gray-400 mt-1">
        <span>시작</span>
        <span>총 {Math.ceil(totalDays / 7)}주 ({totalDays}일)</span>
      </div>
    </div>
  );
}

export default function StudyDesigner() {
  const {
    selectedModel, designInfo, updateDesignInfo,
    evalItems, updateEvalItem, addEvalItem, removeEvalItem,
    groups, addGroup, removeGroup, updateGroup,
  } = useEfficacyQuotationStore();

  if (!selectedModel) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-5 min-h-0">
      {/* ===== LEFT: Schedule Timeline (wider) ===== */}
      <div className="lg:w-[58%] lg:min-w-0 flex-shrink-0">
        <StitchCard variant="surface-container" padding="md" className="h-full">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">스케줄 디자인 — 각 블록을 클릭하여 편집</h3>
          <InteractiveTimeline />
        </StitchCard>
      </div>

      {/* ===== RIGHT: Info forms (scrollable) ===== */}
      <div className="lg:w-[42%] lg:min-w-0 flex-1 space-y-4 lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto lg:pr-1">
        {/* Animal Info */}
        <StitchCard variant="surface-container" padding="sm">
          <h3 className="text-xs font-semibold text-gray-800 mb-2">동물 정보</h3>
          <div className="grid grid-cols-2 gap-2">
            {([
              ['동물종', 'species', 'text'],
              ['주령', 'ageWeeks', 'number'],
              ['군당 마리수', 'animalsPerGroup', 'number'],
              ['성별', 'sex', 'text'],
            ] as const).map(([label, key, type]) => (
              <div key={key}>
                <label className="text-[9px] text-gray-500">{label}</label>
                <input
                  type={type}
                  value={designInfo[key]}
                  onChange={e => updateDesignInfo({
                    [key]: type === 'number' ? Number(e.target.value) || 0 : e.target.value,
                  })}
                  className="w-full px-2 py-1.5 border rounded text-xs bg-white"
                />
              </div>
            ))}
          </div>
        </StitchCard>

        {/* Test Conditions */}
        <StitchCard variant="surface-container" padding="sm">
          <h3 className="text-xs font-semibold text-gray-800 mb-2">시험 조건</h3>
          {([
            ['유발방법', 'inductionMethod'],
            ['양성대조물질', 'positiveControl'],
            ['투여경로', 'route'],
          ] as const).map(([label, key]) => (
            <div key={key} className="mb-2">
              <label className="text-[9px] text-gray-500">{label}</label>
              <input
                value={designInfo[key]}
                onChange={e => updateDesignInfo({ [key]: e.target.value })}
                className="w-full px-2 py-1.5 border rounded text-xs bg-white"
              />
            </div>
          ))}
        </StitchCard>

        {/* Eval Items */}
        <StitchCard variant="surface-container" padding="sm">
          <h3 className="text-xs font-semibold text-gray-800 mb-2">평가항목</h3>
          <div className="space-y-1 max-h-44 overflow-y-auto">
            {evalItems.map(e => (
              <div key={e.id} className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={e.isEnabled}
                  onChange={() => updateEvalItem(e.id, { isEnabled: !e.isEnabled })}
                  className="rounded w-3.5 h-3.5 accent-blue-600"
                />
                <input
                  value={e.name}
                  onChange={ev => updateEvalItem(e.id, { name: ev.target.value })}
                  className="flex-1 px-2 py-1 border rounded text-[11px] bg-white"
                />
                <button onClick={() => removeEvalItem(e.id)} className="text-red-400 text-xs hover:text-red-600">×</button>
              </div>
            ))}
          </div>
          <button onClick={addEvalItem} className="text-[11px] text-blue-600 mt-1.5 font-medium">+ 추가</button>
        </StitchCard>

        {/* Groups */}
        <StitchCard variant="surface-container" padding="sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-800">군 구성 ({groups.length}군, 총 {groups.reduce((s, g) => s + g.animalCount, 0)}마리)</h3>
            <button onClick={addGroup} className="text-[11px] text-blue-600 hover:text-blue-800 font-medium">+ 군 추가</button>
          </div>
          <div className="space-y-1.5">
            {groups.map(g => (
              <div key={g.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
                <span className="text-[10px] font-bold text-gray-500 w-6 shrink-0">G{g.groupNumber}</span>
                <input
                  value={g.label}
                  onChange={e => updateGroup(g.id, { label: e.target.value })}
                  className="flex-1 px-2 py-1 border rounded text-[11px] min-w-0"
                />
                <input
                  type="number"
                  value={g.animalCount}
                  onChange={e => updateGroup(g.id, { animalCount: Number(e.target.value) || 1 })}
                  className="w-14 px-1.5 py-1 border rounded text-[11px] text-center"
                  min="1"
                />
                <button onClick={() => removeGroup(g.id)} className="text-red-400 text-xs hover:text-red-600 shrink-0">×</button>
              </div>
            ))}
          </div>
        </StitchCard>
      </div>
    </div>
  );
}
