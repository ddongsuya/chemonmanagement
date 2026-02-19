'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToxicityV2Store } from '@/stores/toxicityV2Store';
import { TEST_RELATIONS } from '@/lib/toxicity-v2/data/relations';
import { TOXICITY_DATA } from '@/lib/toxicity-v2/data/toxicityData';
import { OV_OVERLAY, OE_OVERLAY } from '@/lib/toxicity-v2/data/overlays';
import { getItemPrice, formatKRW } from '@/lib/toxicity-v2/priceEngine';
import type { TestRelationNode, TkOptionTree, SelectedTest } from '@/types/toxicity-v2';

/**
 * 본시험의 duration 문자열에서 주(week) 수를 파싱한다.
 * "13주" → 13, "26주" → 26, "4주" → 4, "39주" → 39
 * 파싱 불가 시 0 반환
 */
function parseDurationWeeks(duration: string): number {
  const match = duration.match(/(\d+)주/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * TK 옵션 트리가 3단계(채혈횟수 포함)인지 판별한다.
 * 본시험 duration이 13주 이상이면 3단계.
 */
function needsThirdLevel(duration: string): boolean {
  return parseDurationWeeks(duration) >= 13;
}

/**
 * TK 옵션 트리에서 특정 조합의 시험 항목 ID를 조회한다.
 */
function resolveTkItemId(
  tkOptions: TkOptionTree,
  method: string,
  points: string,
  count?: string,
): number | null {
  const methodNode = tkOptions[method];
  if (!methodNode) return null;
  const pointsNode = methodNode[points];
  if (pointsNode == null) return null;
  if (typeof pointsNode === 'number') return pointsNode;
  if (count && typeof pointsNode === 'object') {
    return pointsNode[count] ?? null;
  }
  return null;
}

/** 개별 본시험에 대한 관계 옵션 패널 */
function RelationOptions({
  relation,
  mainTest,
}: {
  relation: TestRelationNode;
  mainTest: SelectedTest;
}) {
  const route = useToxicityV2Store((s) => s.route);
  const standard = useToxicityV2Store((s) => s.standard);
  const selectedTests = useToxicityV2Store((s) => s.selectedTests);
  const addTest = useToxicityV2Store((s) => s.addTest);

  // TK 옵션 선택 단계 로컬 상태
  const [tkMethod, setTkMethod] = useState<string | null>(null);
  const [tkPoints, setTkPoints] = useState<string | null>(null);
  const [tkCount, setTkCount] = useState<string | null>(null);

  const mainItem = TOXICITY_DATA.find((d) => d.id === relation.mainTestId);
  const threeLevel = mainItem ? needsThirdLevel(mainItem.duration) : false;

  // 이미 추가된 옵션 항목 ID 집합
  const addedOptionIds = new Set(
    selectedTests
      .filter((t) => t.parentId === mainTest.id && t.isOption)
      .map((t) => t.itemId),
  );

  /** 옵션 항목을 스토어에 추가 */
  const acceptOption = (itemId: number) => {
    const item = TOXICITY_DATA.find((d) => d.id === itemId);
    if (!item) return;
    const price = getItemPrice(item, route, standard, OV_OVERLAY, OE_OVERLAY) ?? 0;
    const newTest: SelectedTest = {
      id: crypto.randomUUID(),
      itemId: item.id,
      name: item.name,
      category: item.category,
      price,
      isOption: true,
      parentId: mainTest.id,
    };
    addTest(newTest);
  };

  /** TK 옵션 트리에서 선택 완료 시 추가 */
  const acceptTkOption = (method: string, points: string, count?: string) => {
    if (!relation.tkOptions) return;
    const itemId = resolveTkItemId(relation.tkOptions, method, points, count);
    if (itemId == null || addedOptionIds.has(itemId)) return;
    const item = TOXICITY_DATA.find((d) => d.id === itemId);
    if (!item) return;
    const price = getItemPrice(item, route, standard, OV_OVERLAY, OE_OVERLAY) ?? 0;
    const newTest: SelectedTest = {
      id: crypto.randomUUID(),
      itemId: item.id,
      name: item.name,
      category: item.category,
      price,
      isOption: true,
      parentId: mainTest.id,
      tkConfig: { method, points, count },
    };
    addTest(newTest);
    // 선택 후 로컬 상태 리셋
    setTkMethod(null);
    setTkPoints(null);
    setTkCount(null);
  };

  /** tkList 항목 추가 */
  const acceptTkListItem = (itemId: number) => {
    if (addedOptionIds.has(itemId)) return;
    acceptOption(itemId);
  };

  /** tkSimple 항목 추가 */
  const acceptTkSimple = () => {
    if (!relation.tkSimple || addedOptionIds.has(relation.tkSimple)) return;
    acceptOption(relation.tkSimple);
  };

  return (
    <Card className="p-4 space-y-3 border-dashed">
      <p className="text-sm font-medium text-muted-foreground">
        📋 {mainItem?.name ?? `시험 #${relation.mainTestId}`} 옵션
      </p>

      {/* 회복시험 옵션 (Req 7.1, 7.2) */}
      {relation.recoveryTestId != null && !addedOptionIds.has(relation.recoveryTestId) && (
        <RecoveryOption
          recoveryTestId={relation.recoveryTestId}
          route={route}
          standard={standard}
          onAccept={() => acceptOption(relation.recoveryTestId!)}
        />
      )}

      {/* TK 옵션 트리 (Req 8.1~8.5) */}
      {relation.tkOptions && (
        <TkOptionTreeUI
          tkOptions={relation.tkOptions}
          threeLevel={threeLevel}
          addedOptionIds={addedOptionIds}
          tkMethod={tkMethod}
          tkPoints={tkPoints}
          tkCount={tkCount}
          onSelectMethod={setTkMethod}
          onSelectPoints={setTkPoints}
          onSelectCount={setTkCount}
          onAccept={acceptTkOption}
          route={route}
          standard={standard}
        />
      )}

      {/* tkList: 단순 TK 항목 목록 */}
      {relation.tkList && relation.tkList.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">TK 옵션</p>
          {relation.tkList.map((tkId) => {
            const tkItem = TOXICITY_DATA.find((d) => d.id === tkId);
            if (!tkItem || addedOptionIds.has(tkId)) return null;
            const price = getItemPrice(tkItem, route, standard, OV_OVERLAY, OE_OVERLAY);
            return (
              <div key={tkId} className="flex items-center justify-between gap-2 rounded-md bg-muted/50 p-2">
                <div className="min-w-0">
                  <p className="text-sm truncate">{tkItem.name}</p>
                  <p className="text-xs text-muted-foreground">{price != null ? formatKRW(price) : '별도 협의'}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => acceptTkListItem(tkId)}>
                  추가
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* tkSimple: 단일 TK 항목 */}
      {relation.tkSimple != null && !addedOptionIds.has(relation.tkSimple) && (() => {
        const tkItem = TOXICITY_DATA.find((d) => d.id === relation.tkSimple);
        if (!tkItem) return null;
        const price = getItemPrice(tkItem, route, standard, OV_OVERLAY, OE_OVERLAY);
        return (
          <div className="flex items-center justify-between gap-2 rounded-md bg-muted/50 p-2">
            <div className="min-w-0">
              <p className="text-sm truncate">{tkItem.name}</p>
              <p className="text-xs text-muted-foreground">{price != null ? formatKRW(price) : '별도 협의'}</p>
            </div>
            <Button size="sm" variant="outline" onClick={acceptTkSimple}>
              추가
            </Button>
          </div>
        );
      })()}
    </Card>
  );
}

/** 회복시험 옵션 UI */
function RecoveryOption({
  recoveryTestId,
  route,
  standard,
  onAccept,
}: {
  recoveryTestId: number;
  route: 'oral' | 'iv';
  standard: 'KGLP' | 'KGLP_OECD';
  onAccept: () => void;
}) {
  const item = TOXICITY_DATA.find((d) => d.id === recoveryTestId);
  if (!item) return null;
  const price = getItemPrice(item, route, standard, OV_OVERLAY, OE_OVERLAY);

  return (
    <div className="flex items-center justify-between gap-2 rounded-md bg-blue-50 dark:bg-blue-950/30 p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">🔄 {item.name}</p>
        <p className="text-xs text-muted-foreground">
          {price != null ? formatKRW(price) : '별도 협의'}
        </p>
      </div>
      <Button size="sm" onClick={onAccept}>
        회복시험 추가
      </Button>
    </div>
  );
}

/** TK 옵션 트리 UI (Req 8.1~8.5) */
function TkOptionTreeUI({
  tkOptions,
  threeLevel,
  addedOptionIds,
  tkMethod,
  tkPoints,
  tkCount,
  onSelectMethod,
  onSelectPoints,
  onSelectCount,
  onAccept,
  route,
  standard,
}: {
  tkOptions: TkOptionTree;
  threeLevel: boolean;
  addedOptionIds: Set<number>;
  tkMethod: string | null;
  tkPoints: string | null;
  tkCount: string | null;
  onSelectMethod: (m: string | null) => void;
  onSelectPoints: (p: string | null) => void;
  onSelectCount: (c: string | null) => void;
  onAccept: (method: string, points: string, count?: string) => void;
  route: 'oral' | 'iv';
  standard: 'KGLP' | 'KGLP_OECD';
}) {
  const methods = Object.keys(tkOptions);

  // 현재 선택된 method의 포인트 옵션
  const pointOptions = tkMethod ? Object.keys(tkOptions[tkMethod] ?? {}) : [];

  // 3단계: 현재 선택된 method+points의 count 옵션
  let countOptions: string[] = [];
  if (threeLevel && tkMethod && tkPoints) {
    const node = tkOptions[tkMethod]?.[tkPoints];
    if (node && typeof node === 'object' && typeof node !== 'number') {
      countOptions = Object.keys(node as Record<string, number>);
    }
  }

  // 미리보기: 현재 선택 조합의 항목 ID와 가격
  const previewItemId = useMemo(() => {
    if (!tkMethod || !tkPoints) return null;
    if (threeLevel && !tkCount) return null;
    return resolveTkItemId(tkOptions, tkMethod, tkPoints, tkCount ?? undefined);
  }, [tkOptions, tkMethod, tkPoints, tkCount, threeLevel]);

  const previewItem = previewItemId ? TOXICITY_DATA.find((d) => d.id === previewItemId) : null;
  const previewPrice = previewItem
    ? getItemPrice(previewItem, route, standard, OV_OVERLAY, OE_OVERLAY)
    : null;
  const alreadyAdded = previewItemId ? addedOptionIds.has(previewItemId) : false;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium">🧬 TK 옵션</p>

      {/* Level 1: 채혈방식 */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">채혈방식</p>
        <div className="flex gap-2">
          {methods.map((m) => (
            <Button
              key={m}
              size="sm"
              variant={tkMethod === m ? 'default' : 'outline'}
              className="min-h-[44px]"
              onClick={() => {
                onSelectMethod(m);
                onSelectPoints(null);
                onSelectCount(null);
              }}
            >
              {m}
            </Button>
          ))}
        </div>
      </div>

      {/* Level 2: 포인트수 */}
      {tkMethod && pointOptions.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">포인트수</p>
          <div className="flex gap-2">
            {pointOptions.map((p) => (
              <Button
                key={p}
                size="sm"
                variant={tkPoints === p ? 'default' : 'outline'}
                className="min-h-[44px]"
                onClick={() => {
                  onSelectPoints(p);
                  onSelectCount(null);
                }}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Level 3: 채혈횟수 (13주 이상만) */}
      {threeLevel && tkPoints && countOptions.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">채혈횟수</p>
          <div className="flex gap-2">
            {countOptions.map((c) => (
              <Button
                key={c}
                size="sm"
                variant={tkCount === c ? 'default' : 'outline'}
                className="min-h-[44px]"
                onClick={() => onSelectCount(c)}
              >
                {c}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 선택 완료 시 미리보기 + 추가 버튼 */}
      {previewItem && !alreadyAdded && (
        <div className="flex items-center justify-between gap-2 rounded-md bg-green-50 dark:bg-green-950/30 p-2 mt-2">
          <div className="min-w-0">
            <p className="text-sm truncate">{previewItem.name}</p>
            <p className="text-xs text-muted-foreground">
              {previewPrice != null ? formatKRW(previewPrice) : '별도 협의'}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => onAccept(tkMethod!, tkPoints!, tkCount ?? undefined)}
          >
            TK 추가
          </Button>
        </div>
      )}

      {alreadyAdded && previewItem && (
        <p className="text-xs text-green-600 dark:text-green-400">✓ 이미 추가됨</p>
      )}
    </div>
  );
}

/**
 * TestRelationPanel
 *
 * 본시험 선택 시 회복시험/TK 옵션을 제안하는 패널.
 * drug_single 모드에서만 표시된다.
 *
 * Requirements: 7.1, 7.2, 8.1, 8.2, 8.3, 8.4, 8.5
 */
export default function TestRelationPanel() {
  const mode = useToxicityV2Store((s) => s.mode);
  const selectedTests = useToxicityV2Store((s) => s.selectedTests);

  // drug_single 모드에서만 표시
  if (mode !== 'drug_single') return null;

  // 선택된 본시험 중 TEST_RELATIONS에 정의된 항목 찾기
  const mainTests = selectedTests.filter((t) => !t.isOption);
  const relationsForSelected = mainTests
    .map((t) => ({
      test: t,
      relation: TEST_RELATIONS.find((r) => r.mainTestId === t.itemId),
    }))
    .filter(
      (entry): entry is { test: SelectedTest; relation: TestRelationNode } =>
        entry.relation != null,
    );

  if (relationsForSelected.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">
        시험 옵션
      </h3>
      {relationsForSelected.map(({ test, relation }) => (
        <RelationOptions
          key={test.id}
          relation={relation}
          mainTest={test}
        />
      ))}
    </div>
  );
}
