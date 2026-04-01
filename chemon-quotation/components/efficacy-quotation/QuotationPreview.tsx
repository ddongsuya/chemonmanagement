'use client';

import { useState, useCallback } from 'react';
import { useEfficacyQuotationStore } from '@/stores/efficacyQuotationStore';
import { calculateTotalWeeks } from '@/lib/efficacy-v2/cost-engine';
import { STEP_TYPE_CONFIG } from '@/types/efficacy-v2';
import { StitchCard } from '@/components/ui/StitchCard';
import { createQuotation } from '@/lib/data-api';
import { Loader2, Check } from 'lucide-react';

const fmt = (n: number) => (n ?? 0).toLocaleString('ko-KR');

function CompactTimeline() {
  const { scheduleSteps } = useEfficacyQuotationStore();
  const totalDays = scheduleSteps.reduce((s, st) => {
    if (st.durationUnit === 'week') return s + st.duration * 7;
    if (st.durationUnit === 'day') return s + st.duration;
    return s + 1;
  }, 0);

  return (
    <div className="flex items-end gap-0 overflow-x-auto pb-1 pt-3">
      {scheduleSteps.map((st, i) => {
        const days = st.durationUnit === 'week' ? st.duration * 7 : st.durationUnit === 'day' ? st.duration : 1;
        const pct = Math.max((days / totalDays) * 100, 6);
        const color = STEP_TYPE_CONFIG[st.type]?.color ?? '#64748b';
        return (
          <div key={st.id} className="flex flex-col items-center" style={{ flex: `${pct} 0 0%`, minWidth: '50px' }}>
            <div className="w-full rounded-md flex items-center justify-center text-white px-1" style={{ background: color, height: '28px', fontSize: '9px' }}>
              <span className="truncate">{st.label}</span>
            </div>
            <div className="text-[8px] text-gray-400 mt-0.5">{st.duration}{st.durationUnit === 'week' ? '주' : st.durationUnit === 'day' ? '일' : 'h'}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function QuotationPreview() {
  const {
    selectedModel, client, updateClient,
    discount, margin, setDiscount, setMargin,
    costItems, totalCost, withProfit, discounted, vatIncluded,
    groups, evalItems, designInfo, scheduleSteps,
  } = useEfficacyQuotationStore();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const totalAnimals = groups.reduce((s, g) => s + g.animalCount, 0);
  const totalWeeks = calculateTotalWeeks(scheduleSteps);

  const handleSave = useCallback(async () => {
    if (!selectedModel) return;
    setSaving(true);
    try {
      await createQuotation({
        quotationType: 'EFFICACY',
        customerName: client.org || '미지정',
        projectName: selectedModel.title,
        modelId: selectedModel.id,
        modelCategory: selectedModel.category,
        indication: selectedModel.inductionMethod,
        items: costItems as unknown[],
        totalAmount: vatIncluded,
        subtotal: totalCost,
        discountRate: discount,
        discountAmount: withProfit - discounted,
        vat: Math.round(discounted * 0.1),
        notes: `${client.name} | ${client.phone}`,
        status: 'DRAFT',
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('저장 실패. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  }, [selectedModel, client, costItems, vatIncluded, totalCost, discount, withProfit, discounted]);

  if (!selectedModel) return null;

  return (
    <div className="space-y-5">
      {/* Client Info + Quotation Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StitchCard variant="surface-container" padding="sm">
          <h3 className="text-xs font-semibold mb-2">의뢰 정보</h3>
          <div className="grid grid-cols-2 gap-2">
            {([
              ['의뢰기관', 'org'],
              ['의뢰자', 'name'],
              ['연락처', 'phone'],
              ['이메일', 'email'],
            ] as const).map(([label, key]) => (
              <div key={key}>
                <label className="text-[9px] text-gray-500">{label}</label>
                <input
                  value={client[key]}
                  onChange={e => updateClient({ [key]: e.target.value })}
                  className="w-full px-2 py-1 border rounded text-xs bg-white"
                />
              </div>
            ))}
          </div>
        </StitchCard>

        <StitchCard variant="surface-container" padding="sm">
          <h3 className="text-xs font-semibold mb-2">견적 조건</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[9px] text-gray-500">영업이익률: {(margin * 100).toFixed(0)}%</label>
              <input type="range" min="0" max="0.3" step="0.05" value={margin} onChange={e => setMargin(+e.target.value)} className="w-full accent-blue-500" />
            </div>
            <div>
              <label className="text-[9px] text-gray-500">할인율: {(discount * 100).toFixed(0)}%</label>
              <input type="range" min="0" max="0.4" step="0.05" value={discount} onChange={e => setDiscount(+e.target.value)} className="w-full accent-green-500" />
            </div>
          </div>
        </StitchCard>
      </div>

      {/* Formal Quotation Document */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 space-y-5">
        <div className="text-center border-b pb-3">
          <div className="text-xl font-bold tracking-widest text-gray-800">견 적 서</div>
          <div className="text-[10px] text-gray-400">코아스템켐온㈜ 비임상CRO사업부</div>
        </div>

        <div className="grid grid-cols-2 gap-6 text-xs">
          <div className="space-y-0.5">
            {[
              ['견적번호', `26-04-P-${String(Math.floor(Math.random() * 9000 + 1000))}`],
              ['발행날짜', new Date().toISOString().split('T')[0]],
              ['시험기준', 'non-GLP'],
            ].map(([l, v]) => (
              <div key={l} className="flex"><span className="text-gray-500 w-14">{l}</span><span className="font-medium">{v}</span></div>
            ))}
          </div>
          <div className="space-y-0.5">
            {[
              ['의뢰기관', client.org || '-'],
              ['의뢰자', client.name || '-'],
              ['연락처', client.phone || '-'],
            ].map(([l, v]) => (
              <div key={l} className="flex"><span className="text-gray-500 w-14">{l}</span><span>{v}</span></div>
            ))}
          </div>
        </div>

        {/* Study Summary */}
        <div className="bg-gray-50 rounded-lg p-3 text-[11px] space-y-1">
          <div className="font-semibold text-gray-800">{selectedModel.title}</div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-gray-600">
            <div>시험계: {designInfo.species} ({designInfo.sex}, {designInfo.ageWeeks}주령)</div>
            <div>유발방법: {designInfo.inductionMethod || 'N/A'}</div>
            <div>동물 수: {totalAnimals}마리 ({designInfo.animalsPerGroup}×{groups.length}군)</div>
            <div>양성대조: {designInfo.positiveControl || 'N/A'}</div>
            <div>시험기간: {totalWeeks}주</div>
            <div>평가: {evalItems.filter(e => e.isEnabled).map(e => e.name).join(', ')}</div>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <div className="text-[10px] font-semibold text-gray-700 mb-1">Study Design</div>
          <div className="border border-gray-200 rounded-lg p-2">
            <CompactTimeline />
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-[10px] text-blue-500">견적가</div>
              <div className="text-lg font-bold text-blue-800" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(withProfit)}원</div>
            </div>
            <div>
              <div className="text-[10px] text-green-600">할인가 ({(discount * 100).toFixed(0)}%)</div>
              <div className="text-lg font-bold text-green-700" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(discounted)}원</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500">VAT 포함</div>
              <div className="text-lg font-bold text-gray-800" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(vatIncluded)}원</div>
            </div>
          </div>
        </div>

        {/* Cost Detail Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-2 py-1 text-left text-gray-500">카테고리</th>
                <th className="px-2 py-1 text-left text-gray-500">항목</th>
                <th className="px-2 py-1 text-right text-gray-500">소계</th>
              </tr>
            </thead>
            <tbody>
              {costItems.map((it, i) => (
                <tr key={it.id} className={i % 2 ? 'bg-gray-50/30' : ''}>
                  <td className="px-2 py-1 text-gray-500">{it.category}</td>
                  <td className="px-2 py-1">{it.name}</td>
                  <td className="px-2 py-1 text-right font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Notes */}
        <div className="bg-gray-50 rounded-lg p-3 text-[10px] text-gray-500 space-y-0.5">
          <div className="font-semibold text-gray-700 mb-1">유의사항</div>
          <div>• 모든 금액은 VAT 별도입니다.</div>
          <div>• 본 견적서는 견적일로부터 60일간 유효합니다.</div>
          <div>• 시험개시는 관련서류 및 시험물질 접수 후 진행됩니다.</div>
          <div>• 시험물질은 멸균상태를 유지해서 제공해야 합니다.</div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
          } disabled:opacity-60`}
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin inline mr-2" />}
          {saved && <Check className="w-4 h-4 inline mr-2" />}
          {saved ? '저장 완료' : saving ? '저장 중...' : '견적서 저장'}
        </button>
      </div>
    </div>
  );
}
