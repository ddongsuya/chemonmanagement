'use client';

import { useState, useMemo } from 'react';
import { ArrowLeft, Download, Search, Beaker } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  SAMPLE_REQUIREMENT_TESTS,
  calcTotalRequirement,
  getTestsByTeam,
  type SampleRequirementTest,
  type TeamName,
} from '@/lib/sample-requirements';

const TEAMS: TeamName[] = ['독성시험팀', '유전독성팀', '대체시험센터', '의료기기평가센터'];

const fmt = (n: number) => n.toLocaleString('ko-KR', { maximumFractionDigits: 1 });

export default function TestMaterialCalculatorPage() {
  const [selectedTeam, setSelectedTeam] = useState<TeamName | '전체'>('전체');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [marginRate, setMarginRate] = useState(20);
  // Override params per test
  const [overrides, setOverrides] = useState<Record<string, { doseGroups?: number[] }>>({});

  const filtered = useMemo(() => {
    let tests = selectedTeam === '전체'
      ? SAMPLE_REQUIREMENT_TESTS
      : getTestsByTeam(selectedTeam);
    if (search) {
      const kw = search.toLowerCase();
      tests = tests.filter(t =>
        t.name.toLowerCase().includes(kw) ||
        t.category.toLowerCase().includes(kw) ||
        t.species.toLowerCase().includes(kw)
      );
    }
    return tests;
  }, [selectedTeam, search]);

  const categories = useMemo(() => {
    const cats: Record<string, SampleRequirementTest[]> = {};
    for (const t of filtered) {
      const key = t.category;
      if (!cats[key]) cats[key] = [];
      cats[key].push(t);
    }
    return Object.entries(cats);
  }, [filtered]);

  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    const ids = new Set(filtered.map(t => t.id));
    setSelectedIds(ids);
  };

  // Calculate results for selected tests
  const results = useMemo(() => {
    const margin = 1 + marginRate / 100;
    return [...selectedIds].map(id => {
      const test = SAMPLE_REQUIREMENT_TESTS.find(t => t.id === id);
      if (!test) return null;

      if (test.calcType === 'formula') {
        const ov = overrides[id];
        const calc = calcTotalRequirement(test, ov);
        return {
          test,
          perGroup: calc.perGroup,
          total_mg: calc.total_mg,
          total_g: calc.total_g,
          withMargin_g: calc.total_g * margin,
        };
      }
      if (test.calcType === 'fixed' && test.fixedAmount_g != null) {
        return {
          test,
          perGroup: [],
          total_mg: test.fixedAmount_g * 1000,
          total_g: test.fixedAmount_g,
          withMargin_g: test.fixedAmount_g * margin,
        };
      }
      // Other types: show fixed info
      return {
        test,
        perGroup: [],
        total_mg: 0,
        total_g: 0,
        withMargin_g: 0,
      };
    }).filter(Boolean) as {
      test: SampleRequirementTest;
      perGroup: { dose: number; amount_mg: number; animals: number }[];
      total_mg: number;
      total_g: number;
      withMargin_g: number;
    }[];
  }, [selectedIds, marginRate, overrides]);

  const grandTotal_g = results.reduce((s, r) => s + r.withMargin_g, 0);

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex items-center gap-4 mb-5">
        <Link href="/calculators">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Beaker className="w-5 h-5" /> 시험물질 소요량 계산기
          </h1>
          <p className="text-xs text-muted-foreground">82개 시험 항목 DB 기반 — 시험 선택 후 필요량 자동 산출</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* LEFT: Test selection */}
        <div className="lg:w-[45%] space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedTeam('전체')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${selectedTeam === '전체' ? 'bg-foreground text-background' : 'border border-border text-muted-foreground hover:border-foreground'}`}
            >전체 ({SAMPLE_REQUIREMENT_TESTS.length})</button>
            {TEAMS.map(team => (
              <button
                key={team}
                onClick={() => setSelectedTeam(team)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${selectedTeam === team ? 'bg-foreground text-background' : 'border border-border text-muted-foreground hover:border-foreground'}`}
              >{team} ({getTestsByTeam(team).length})</button>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="시험명, 카테고리, 동물종 검색..."
                className="w-full pl-8 pr-3 py-1.5 border border-border rounded text-xs bg-white focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
            <button onClick={selectAll} className="px-3 py-1.5 border border-border rounded text-xs text-muted-foreground hover:text-foreground">전체선택</button>
            <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 border border-border rounded text-xs text-muted-foreground hover:text-foreground">초기화</button>
          </div>

          {/* Test list by category */}
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto space-y-3 pr-1">
            {categories.map(([cat, tests]) => (
              <div key={cat}>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{cat} ({tests.length})</div>
                <div className="space-y-1">
                  {tests.map(t => (
                    <div
                      key={t.id}
                      onClick={() => toggle(t.id)}
                      className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                        selectedIds.has(t.id) ? 'border-blue-400 bg-blue-50/50' : 'border-border bg-white hover:border-blue-200'
                      }`}
                    >
                      <input type="checkbox" checked={selectedIds.has(t.id)} readOnly className="w-3.5 h-3.5 accent-blue-600 pointer-events-none" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground truncate">{t.name}</div>
                        <div className="text-[10px] text-muted-foreground">{t.species} | {t.calcType === 'formula' ? '공식 계산' : t.calcType === 'fixed' ? '고정량' : t.calcType}</div>
                      </div>
                      {t.calcType === 'fixed' && t.fixedAmount_g != null && (
                        <span className="text-[10px] text-muted-foreground shrink-0">{t.fixedAmount_g}g</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Results */}
        <div className="lg:w-[55%] space-y-4">
          {/* Margin setting + total */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">여유율</Label>
              <Input
                type="number"
                value={marginRate}
                onChange={e => setMarginRate(parseInt(e.target.value) || 0)}
                className="w-16 h-8 text-xs text-center"
                min={0} max={100}
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
            <div className="flex-1" />
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground">총 소요량 (여유분 포함)</div>
              <div className="text-xl font-semibold text-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {fmt(grandTotal_g)} g
                {grandTotal_g >= 1000 && <span className="text-xs text-muted-foreground ml-1">({fmt(grandTotal_g / 1000)} kg)</span>}
              </div>
            </div>
          </div>

          {/* Selected tests results */}
          {results.length === 0 ? (
            <div className="text-center py-20 text-sm text-muted-foreground">
              왼쪽에서 시험을 선택하면 필요량이 자동 계산됩니다
            </div>
          ) : (
            <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {results.map(r => (
                <div key={r.test.id} className="border border-border rounded-lg bg-white p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-xs font-semibold text-foreground">{r.test.name}</div>
                      <div className="text-[10px] text-muted-foreground">{r.test.species} | {r.test.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(r.withMargin_g)} g</div>
                      <div className="text-[10px] text-muted-foreground">순수 {fmt(r.total_g)} g</div>
                    </div>
                  </div>

                  {r.perGroup.length > 0 && (
                    <div className="border-t border-border pt-2 mt-2">
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="text-muted-foreground">
                            <th className="text-left py-0.5">용량 (mg/kg)</th>
                            <th className="text-right py-0.5">동물수</th>
                            <th className="text-right py-0.5">필요량 (mg)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.perGroup.map((g, i) => (
                            <tr key={i}>
                              <td className="py-0.5 font-medium">{g.dose.toLocaleString()}</td>
                              <td className="text-right py-0.5">{g.animals}</td>
                              <td className="text-right py-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(g.amount_mg)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {r.test.note && (
                    <div className="text-[10px] text-muted-foreground mt-1 pt-1 border-t border-border">{r.test.note}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Summary bar */}
          {results.length > 0 && (
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">{results.length}개 시험 선택</span>
              <div className="text-sm font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                합계: {fmt(grandTotal_g)} g
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
