'use client';

import { useToxicityV2Store } from '@/stores/toxicityV2Store';
import { FN_MAPPING, GL_MAPPING } from '@/lib/toxicity-v2/data/metadata';
import { TOXICITY_DATA } from '@/lib/toxicity-v2/data/toxicityData';
import { COMBO_DATA } from '@/lib/toxicity-v2/data/comboData';
import { VACCINE_DATA } from '@/lib/toxicity-v2/data/vaccineData';
import { SCREEN_DATA, CV_SCREEN_DATA } from '@/lib/toxicity-v2/data/screenData';
import { HF_INDV_DATA, HF_PROB_DATA, HF_TEMP_DATA } from '@/lib/toxicity-v2/data/healthFoodData';
import { MD_BIO_DATA } from '@/lib/toxicity-v2/data/medicalDeviceData';
import { COS_ALT_DATA, COS_STEM_DATA } from '@/lib/toxicity-v2/data/cosmeticsData';
import { CELL_TX_DATA } from '@/lib/toxicity-v2/data/cellTherapyData';
import { DOC_SEND_DATA, DOC_CTD_DATA, DOC_TRANS_DATA } from '@/lib/toxicity-v2/data/documentWorkData';
import type { TestMode, ToxicityV2Item, ComboItem, SimpleItem, DocumentItem, RouteType } from '@/types/toxicity-v2';

/** 모드별 데이터 배열 반환 */
function getDataForMode(mode: TestMode | null): (ToxicityV2Item | ComboItem | SimpleItem | DocumentItem)[] {
  switch (mode) {
    case 'drug_single': return TOXICITY_DATA;
    case 'drug_combo': return COMBO_DATA;
    case 'drug_vaccine': return VACCINE_DATA;
    case 'drug_screen_tox': return SCREEN_DATA;
    case 'drug_screen_cv': return CV_SCREEN_DATA;
    case 'drug_celltx': return CELL_TX_DATA;
    case 'hf_indv': return HF_INDV_DATA;
    case 'hf_prob': return HF_PROB_DATA;
    case 'hf_temp': return HF_TEMP_DATA;
    case 'md_bio': return MD_BIO_DATA;
    case 'cos_alt': return COS_ALT_DATA;
    case 'cos_stem': return COS_STEM_DATA;
    case 'doc_send': return DOC_SEND_DATA;
    case 'doc_ctd': return DOC_CTD_DATA;
    case 'doc_trans': return DOC_TRANS_DATA;
    default: return [];
  }
}

/** 항목의 정식명칭 조회 */
function getFormalName(itemId: number, mode: TestMode | null, item: ToxicityV2Item | ComboItem | SimpleItem | DocumentItem): string {
  if (mode === 'drug_single') {
    return FN_MAPPING[itemId] ?? item.name;
  }
  return (item as any).formalName ?? item.name;
}

/** 항목의 가이드라인 조회 */
function getGuideline(itemId: number, mode: TestMode | null, item: ToxicityV2Item | ComboItem | SimpleItem | DocumentItem): string[] {
  if (mode === 'drug_single') {
    return GL_MAPPING[itemId] ?? [];
  }
  return (item as any).guideline ?? [];
}

/** 항목의 소요기간(주) 조회 */
function getWeeks(item: ToxicityV2Item | ComboItem | SimpleItem | DocumentItem, mode: TestMode | null, route: RouteType): string {
  if (mode === 'drug_single') {
    const toxItem = item as ToxicityV2Item;
    const w = route === 'oral' ? toxItem.weeksOral : toxItem.weeksIv;
    return w != null ? String(w) : '-';
  }
  const w = (item as any).weeks;
  return w != null ? String(w) : '-';
}

export default function PreviewDetail() {
  const { selectedTests, mode, route } = useToxicityV2Store();
  const data = getDataForMode(mode);

  return (
    <div className="w-full max-w-[210mm] mx-auto bg-white border border-gray-200 shadow-sm p-8 print:border-none print:shadow-none">
      <h2 className="text-xl font-bold text-center mb-6">상 세 내 역</h2>

      {selectedTests.length === 0 ? (
        <p className="text-center text-gray-400 py-8">선택된 시험 항목이 없습니다</p>
      ) : (
        <div className="space-y-6">
          {selectedTests.map((test, idx) => {
            const item = data.find((d) => d.id === test.itemId);
            if (!item) return null;

            const formalName = getFormalName(test.itemId, mode, item);
            const description = 'description' in item ? (item as any).description : undefined;
            const guideline = getGuideline(test.itemId, mode, item);
            const weeks = getWeeks(item, mode, route);

            return (
              <div key={test.id} className="border border-gray-200 rounded-md p-4">
                {/* 번호 + 시험명 */}
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-sm font-bold text-gray-500">{idx + 1}.</span>
                  <span className="font-bold text-gray-900">{test.customName || test.name}</span>
                </div>

                {/* 정식명칭 */}
                <div className="mb-2">
                  <span className="text-xs text-gray-500 mr-2">정식명칭</span>
                  <span className="text-sm text-gray-800">{formalName}</span>
                </div>

                {/* 설명 */}
                {description && (
                  <div className="mb-2">
                    <span className="text-xs text-gray-500 block mb-1">설명</span>
                    <p className="text-sm text-gray-700 whitespace-pre-line pl-2 border-l-2 border-gray-200">
                      {description}
                    </p>
                  </div>
                )}

                {/* 가이드라인 */}
                {guideline.length > 0 && guideline.some((g) => g) && (
                  <div className="mb-2">
                    <span className="text-xs text-gray-500 block mb-1">가이드라인</span>
                    <div className="text-sm text-gray-700 pl-2 space-y-0.5">
                      {guideline[0] && <div>{guideline[0]}</div>}
                      {guideline[1] && <div>{guideline[1]}</div>}
                      {guideline[2] && <div>{guideline[2]}</div>}
                      {guideline[3] && <div className="text-gray-500 text-xs">{guideline[3]}</div>}
                    </div>
                  </div>
                )}

                {/* 동물종 / 기간 / 소요기간 */}
                <div className="flex gap-6 text-sm text-gray-600 mt-3 pt-2 border-t border-gray-100">
                  {'species' in item && (
                    <div>
                      <span className="text-xs text-gray-400 mr-1">동물종</span>
                      {(item as any).species || '-'}
                    </div>
                  )}
                  {'duration' in item && (
                    <div>
                      <span className="text-xs text-gray-400 mr-1">기간</span>
                      {(item as any).duration || '-'}
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-gray-400 mr-1">소요기간</span>
                    {weeks === '-' ? '-' : weeks.includes('주') || weeks.endsWith('~') ? weeks : `${weeks}주`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
