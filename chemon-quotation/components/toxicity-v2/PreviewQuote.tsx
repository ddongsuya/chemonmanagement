'use client';

import { useToxicityV2Store } from '@/stores/toxicityV2Store';
import { formatKRW } from '@/lib/toxicity-v2/priceEngine';
import { TOXICITY_DATA } from '@/lib/toxicity-v2/data/toxicityData';
import { COMBO_DATA } from '@/lib/toxicity-v2/data/comboData';
import { VACCINE_DATA } from '@/lib/toxicity-v2/data/vaccineData';
import { SCREEN_DATA, CV_SCREEN_DATA } from '@/lib/toxicity-v2/data/screenData';
import { HF_INDV_DATA, HF_PROB_DATA, HF_TEMP_DATA } from '@/lib/toxicity-v2/data/healthFoodData';
import { MD_BIO_DATA } from '@/lib/toxicity-v2/data/medicalDeviceData';
import type { TestMode, SelectedTest, ToxicityV2Item, ComboItem, SimpleItem } from '@/types/toxicity-v2';

/** 모드별 데이터 배열 반환 */
function getDataForMode(mode: TestMode | null): (ToxicityV2Item | ComboItem | SimpleItem)[] {
  switch (mode) {
    case 'drug_single': return TOXICITY_DATA;
    case 'drug_combo': return COMBO_DATA;
    case 'drug_vaccine': return VACCINE_DATA;
    case 'drug_screen_tox': return SCREEN_DATA;
    case 'drug_screen_cv': return CV_SCREEN_DATA;
    case 'hf_indv': return HF_INDV_DATA;
    case 'hf_prob': return HF_PROB_DATA;
    case 'hf_temp': return HF_TEMP_DATA;
    case 'md_bio': return MD_BIO_DATA;
    default: return [];
  }
}

/** 시험 항목의 동물종/기간 조회 */
function lookupItemInfo(itemId: number, mode: TestMode | null): { species: string; duration: string } {
  const data = getDataForMode(mode);
  const item = data.find((d) => d.id === itemId);
  return {
    species: item?.species ?? '-',
    duration: item?.duration ?? '-',
  };
}

/** 복합제 종수 라벨 */
function comboLabel(comboType: 2 | 3 | 4): string {
  return `${comboType}종`;
}

export default function PreviewQuote() {
  const {
    selectedTests,
    subtotalTest,
    formulationCost,
    discountAmount,
    totalAmount,
    discountRate,
    discountReason,
    mode,
    comboType,
  } = useToxicityV2Store();

  return (
    <div className="w-full max-w-[210mm] mx-auto bg-white border border-gray-200 shadow-sm p-8 print:border-none print:shadow-none">
      {/* 헤더 */}
      <h2 className="text-xl font-bold text-center mb-1">견 적 서</h2>
      {mode === 'drug_combo' && (
        <p className="text-sm text-center text-gray-500 mb-4">
          복합제 {comboLabel(comboType)}
        </p>
      )}

      {/* 견적서 테이블 */}
      <table className="w-full border-collapse text-sm mt-4">
        <thead>
          <tr className="bg-gray-100 border-y border-gray-300">
            <th className="py-2 px-2 text-center w-12">번호</th>
            <th className="py-2 px-3 text-left">시험명</th>
            <th className="py-2 px-2 text-center w-24">동물종</th>
            <th className="py-2 px-2 text-center w-20">기간</th>
            <th className="py-2 px-3 text-right w-32">금액</th>
          </tr>
        </thead>
        <tbody>
          {selectedTests.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-8 text-center text-gray-400">
                선택된 시험 항목이 없습니다
              </td>
            </tr>
          ) : (
            selectedTests.map((test, idx) => {
              const info = lookupItemInfo(test.itemId, mode);
              return (
                <tr key={test.id} className="border-b border-gray-200">
                  <td className="py-2 px-2 text-center text-gray-600">{idx + 1}</td>
                  <td className="py-2 px-3">
                    {test.isOption && <span className="text-xs text-gray-400 mr-1">└</span>}
                    {test.name}
                  </td>
                  <td className="py-2 px-2 text-center text-gray-600">{info.species}</td>
                  <td className="py-2 px-2 text-center text-gray-600">{info.duration}</td>
                  <td className="py-2 px-3 text-right font-mono">
                    {test.price > 0 ? formatKRW(test.price) : '별도 협의'}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* 요약 */}
      {selectedTests.length > 0 && (
        <div className="mt-6 border-t border-gray-300 pt-4 space-y-2 text-sm">
          <SummaryRow label="시험비 소계" value={formatKRW(subtotalTest)} />
          {formulationCost > 0 && (
            <SummaryRow label="조제물분석비" value={formatKRW(formulationCost)} />
          )}
          {discountAmount > 0 && (
            <SummaryRow
              label={`할인금액 (${discountRate}%${discountReason ? ` — ${discountReason}` : ''})`}
              value={`-${formatKRW(discountAmount)}`}
              className="text-red-600"
            />
          )}
          <div className="border-t border-gray-300 pt-2 mt-2">
            <SummaryRow label="최종 합계" value={formatKRW(totalAmount)} bold />
          </div>
        </div>
      )}
    </div>
  );
}

/** 요약 행 */
function SummaryRow({
  label,
  value,
  bold,
  className,
}: {
  label: string;
  value: string;
  bold?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex justify-between ${className ?? ''}`}>
      <span className={bold ? 'font-bold' : 'text-gray-600'}>{label}</span>
      <span className={`font-mono ${bold ? 'font-bold text-lg' : ''}`}>{value}</span>
    </div>
  );
}
