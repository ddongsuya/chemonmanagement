'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToxicityV2Store } from '@/stores/toxicityV2Store';
import type { TestMode, ToxicityV2Item, ComboItem, SimpleItem } from '@/types/toxicity-v2';
import { CATS_MAPPING, CC_MAPPING } from '@/lib/toxicity-v2/data/metadata';
import { OPT_IDS } from '@/lib/toxicity-v2/data/relations';
import { OV_OVERLAY, OE_OVERLAY } from '@/lib/toxicity-v2/data/overlays';
import { TOXICITY_DATA } from '@/lib/toxicity-v2/data/toxicityData';
import { COMBO_DATA } from '@/lib/toxicity-v2/data/comboData';
import { VACCINE_DATA } from '@/lib/toxicity-v2/data/vaccineData';
import { SCREEN_DATA, CV_SCREEN_DATA } from '@/lib/toxicity-v2/data/screenData';
import { HF_INDV_DATA, HF_PROB_DATA, HF_TEMP_DATA } from '@/lib/toxicity-v2/data/healthFoodData';
import { MD_BIO_DATA } from '@/lib/toxicity-v2/data/medicalDeviceData';
import { getItemPrice, getComboPrice } from '@/lib/toxicity-v2/priceEngine';
import { cn } from '@/lib/utils';
import TestItemCard from './TestItemCard';
import PriceOptionBar from './PriceOptionBar';

/** 모드별 데이터 배열 반환 */
function getDataForMode(mode: TestMode): (ToxicityV2Item | ComboItem | SimpleItem)[] {
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
  }
}

/** 항목의 현재 가격 계산 */
function calcPrice(
  item: ToxicityV2Item | ComboItem | SimpleItem,
  mode: TestMode,
  route: 'oral' | 'iv',
  standard: 'KGLP' | 'KGLP_OECD',
  comboType: 2 | 3 | 4,
): number | null {
  if (mode === 'drug_single') {
    return getItemPrice(item as ToxicityV2Item, route, standard, OV_OVERLAY, OE_OVERLAY);
  }
  if (mode === 'drug_combo') {
    return getComboPrice(item as ComboItem, comboType);
  }
  return (item as SimpleItem).price ?? null;
}

export default function V2TestSelector() {
  const mode = useToxicityV2Store((s) => s.mode);
  const route = useToxicityV2Store((s) => s.route);
  const standard = useToxicityV2Store((s) => s.standard);
  const comboType = useToxicityV2Store((s) => s.comboType);
  const selectedTests = useToxicityV2Store((s) => s.selectedTests);
  const toggleTest = useToxicityV2Store((s) => s.toggleTest);

  const [selectedCat, setSelectedCat] = useState('전체');
  const [search, setSearch] = useState('');

  // 모드가 없으면 렌더링하지 않음
  if (!mode) return null;

  const allItems = getDataForMode(mode);
  const categories = CATS_MAPPING[mode] ?? ['전체'];

  // 필터링: OPT_IDS 숨김 (drug_single만) → 카테고리 → 검색
  const filteredItems = allItems.filter((item) => {
    // Req 7.4: drug_single 모드에서 OPT_IDS 항목 숨김
    if (mode === 'drug_single' && OPT_IDS.has(item.id)) return false;
    // 카테고리 필터
    if (selectedCat !== '전체' && item.category !== selectedCat) return false;
    // 검색 필터 (대소문자 무시)
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // 선택 상태 확인용 Set
  const selectedItemIds = new Set(selectedTests.map((t) => t.itemId));

  return (
    <div className="space-y-4">
      {/* 투여경로/시험기준/종수 옵션 바 */}
      <PriceOptionBar />

      {/* 카테고리 필터 탭 (Req 9.1, 19.3: 가로 스크롤) */}
      <div className="overflow-x-auto -mx-1 px-1 pb-1">
        <div className="flex gap-2 min-w-max">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={cn(
                'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors min-h-[44px] min-w-[44px]',
                selectedCat === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 검색 입력 (Req 9.3) */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="시험명 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 시험 항목 카드 그리드 (Req 19.2: 모바일 단일 컬럼, 데스크톱 2열) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredItems.map((item) => {
          const price = calcPrice(item, mode, route, standard, comboType);
          const color = CC_MAPPING[item.category];
          return (
            <TestItemCard
              key={item.id}
              name={item.name}
              category={item.category}
              species={item.species}
              duration={item.duration}
              price={price}
              isSelected={selectedItemIds.has(item.id)}
              categoryColor={color}
              onClick={() => toggleTest(item.id, allItems as ToxicityV2Item[])}
            />
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          검색 결과가 없습니다.
        </p>
      )}
    </div>
  );
}
