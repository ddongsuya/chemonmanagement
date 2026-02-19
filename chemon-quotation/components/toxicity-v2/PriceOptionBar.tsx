'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToxicityV2Store } from '@/stores/toxicityV2Store';
import type { RouteType, StandardType } from '@/types/toxicity-v2';

/**
 * PriceOptionBar — 투여경로/시험기준/복합제 종수 옵션 바
 *
 * - 의약품(drug_single) 모드: 투여 경로(경구/정맥) + 시험 기준(KGLP/KGLP+OECD)
 * - 복합제(drug_combo) 모드: 종수 선택(2종/3종/4종)
 * - 기타 모드: 표시 없음
 */
export default function PriceOptionBar() {
  const mode = useToxicityV2Store((s) => s.mode);
  const route = useToxicityV2Store((s) => s.route);
  const standard = useToxicityV2Store((s) => s.standard);
  const comboType = useToxicityV2Store((s) => s.comboType);
  const setRoute = useToxicityV2Store((s) => s.setRoute);
  const setStandard = useToxicityV2Store((s) => s.setStandard);
  const setComboType = useToxicityV2Store((s) => s.setComboType);

  if (mode === 'drug_single') {
    return (
      <div className="flex flex-wrap items-center gap-4">
        {/* 투여 경로 선택 (Req 3.1) */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium whitespace-nowrap">투여 경로</span>
          <div className="flex rounded-md border">
            <Button
              variant={route === 'oral' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-r-none"
              onClick={() => setRoute('oral' as RouteType)}
            >
              경구
            </Button>
            <Button
              variant={route === 'iv' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-l-none"
              onClick={() => setRoute('iv' as RouteType)}
            >
              정맥
            </Button>
          </div>
        </div>

        {/* 시험 기준 선택 (Req 4.1) */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium whitespace-nowrap">시험 기준</span>
          <Select
            value={standard}
            onValueChange={(v) => setStandard(v as StandardType)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="KGLP">KGLP</SelectItem>
              <SelectItem value="KGLP_OECD">KGLP+OECD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  if (mode === 'drug_combo') {
    return (
      <div className="flex items-center gap-4">
        {/* 복합제 종수 선택 (Req 5.1) */}
        <span className="text-sm font-medium whitespace-nowrap">복합제 종수</span>
        <div className="flex rounded-md border">
          {([2, 3, 4] as const).map((n, i) => (
            <Button
              key={n}
              variant={comboType === n ? 'default' : 'ghost'}
              size="sm"
              className={
                i === 0
                  ? 'rounded-r-none'
                  : i === 2
                    ? 'rounded-l-none'
                    : 'rounded-none'
              }
              onClick={() => setComboType(n)}
            >
              {n}종
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // 기타 모드: 표시 없음
  return null;
}
