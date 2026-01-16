'use client';

import { useState, useMemo } from 'react';
import { ArrowLeft, Calculator, Download, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import * as XLSX from 'xlsx';

// 시험 정의 (고정)
interface StudyDefinition {
  id: string;
  name: string;
  groups: {
    name: string;
    animalCount: number;
    bodyWeight: number; // g
    doseDays: number;
    isVehicle: boolean;
  }[];
}

const STUDIES: StudyDefinition[] = [
  {
    id: 'acute',
    name: '급성경구독성시험',
    groups: [
      { name: '1단계', animalCount: 3, bodyWeight: 300, doseDays: 1, isVehicle: false },
      { name: '2단계', animalCount: 3, bodyWeight: 300, doseDays: 1, isVehicle: false },
      { name: '부형제', animalCount: 10, bodyWeight: 300, doseDays: 28, isVehicle: true },
    ],
  },
  {
    id: 'drf_4w',
    name: '랫드 4주 DRF 독성시험',
    groups: [
      { name: '부형제', animalCount: 10, bodyWeight: 300, doseDays: 28, isVehicle: true },
      { name: '저', animalCount: 10, bodyWeight: 300, doseDays: 28, isVehicle: false },
      { name: '중', animalCount: 10, bodyWeight: 300, doseDays: 28, isVehicle: false },
      { name: '고', animalCount: 10, bodyWeight: 300, doseDays: 28, isVehicle: false },
      { name: '최고', animalCount: 0, bodyWeight: 300, doseDays: 28, isVehicle: false },
    ],
  },
  {
    id: 'repeat_13w',
    name: '랫드 90일 반복 독성시험 + 4주 회복시험',
    groups: [
      { name: '부형제', animalCount: 30, bodyWeight: 450, doseDays: 90, isVehicle: true },
      { name: '저', animalCount: 20, bodyWeight: 450, doseDays: 90, isVehicle: false },
      { name: '중', animalCount: 20, bodyWeight: 450, doseDays: 90, isVehicle: false },
      { name: '고', animalCount: 30, bodyWeight: 450, doseDays: 90, isVehicle: false },
    ],
  },
];

// 용량 레벨 (공통 적용)
interface DoseLevels {
  acute: number; // 급성 (5000 mg/kg 고정)
  low: number;
  mid: number;
  high: number;
  max: number;
}

export default function TestMaterialCalculatorPage() {
  const [doseLevels, setDoseLevels] = useState<DoseLevels>({
    acute: 5000,
    low: 1250,
    mid: 2500,
    high: 5000,
    max: 0,
  });
  const [safetyMargin, setSafetyMargin] = useState(20);
  const [enabledStudies, setEnabledStudies] = useState<Record<string, boolean>>({
    acute: true,
    drf_4w: true,
    repeat_13w: true,
  });

  // 용량 레벨 매핑
  const getDoseLevel = (groupName: string): number => {
    switch (groupName) {
      case '1단계':
      case '2단계':
        return doseLevels.acute;
      case '저':
        return doseLevels.low;
      case '중':
        return doseLevels.mid;
      case '고':
        return doseLevels.high;
      case '최고':
        return doseLevels.max;
      case '부형제':
        return 0;
      default:
        return 0;
    }
  };

  // 계산 결과
  const results = useMemo(() => {
    const marginMultiplier = 1 + safetyMargin / 100;
    
    return STUDIES.filter(study => enabledStudies[study.id]).map(study => {
      const groupResults = study.groups.map(group => {
        const doseLevel = getDoseLevel(group.name);
        const bodyWeightKg = group.bodyWeight / 1000;
        const required = group.isVehicle || doseLevel === 0 || group.animalCount === 0
          ? 0
          : group.animalCount * bodyWeightKg * doseLevel * group.doseDays;
        const calculated = required * marginMultiplier;

        return {
          ...group,
          doseLevel,
          required,
          calculated,
        };
      });

      const totalRequired = groupResults.reduce((sum, g) => sum + g.required, 0);
      const totalCalculated = groupResults.reduce((sum, g) => sum + g.calculated, 0);

      return {
        ...study,
        groupResults,
        totalRequired,
        totalCalculated,
      };
    });
  }, [doseLevels, safetyMargin, enabledStudies]);

  // 전체 합계
  const grandTotal = useMemo(() => {
    return results.reduce((sum, study) => sum + study.totalCalculated, 0);
  }, [results]);

  // Excel 다운로드
  const handleExportExcel = () => {
    const data: (string | number)[][] = [
      ['시험별 시료량 산출'],
      [''],
      ['시험명', '용량군', '동물수(마리)', '체중(g)', '투여일(day)', '투여량(mg/kg/day)', '필요량(mg)', '산출량(mg)', '시험물질 총 필요량(mg)'],
    ];

    for (const study of results) {
      let isFirstRow = true;
      for (const group of study.groupResults) {
        data.push([
          isFirstRow ? study.name : '',
          group.name,
          group.animalCount,
          group.bodyWeight,
          group.doseDays,
          group.doseLevel,
          Math.round(group.required),
          Math.round(group.calculated),
          isFirstRow ? Math.round(study.totalCalculated) : '',
        ]);
        isFirstRow = false;
      }
    }

    data.push(['']);
    data.push(['', '', '', '', '', '', '', 'total', Math.round(grandTotal)]);
    data.push(['']);
    data.push(['*필요량: 투여에 사용되는 양']);
    data.push([`*산출량: 투여 시 소실되는 시험물질 양 고려, 필요량 x ${(1 + safetyMargin / 100).toFixed(1)}`]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), '시료량산출');
    XLSX.writeFile(wb, `시험물질_소요량_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/calculators">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">시험물질 소요량 계산기</h1>
          <p className="text-gray-500 dark:text-slate-400">용량만 입력하면 모든 시험의 필요량을 자동 계산</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 입력 패널 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                용량 설정
              </CardTitle>
              <CardDescription>모든 시험에 공통 적용됩니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500">급성독성 (mg/kg)</Label>
                <Input
                  type="number"
                  value={doseLevels.acute}
                  onChange={(e) => setDoseLevels({ ...doseLevels, acute: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <Separator />
              <div>
                <Label className="text-xs text-gray-500">저용량 (mg/kg/day)</Label>
                <Input
                  type="number"
                  value={doseLevels.low}
                  onChange={(e) => setDoseLevels({ ...doseLevels, low: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">중용량 (mg/kg/day)</Label>
                <Input
                  type="number"
                  value={doseLevels.mid}
                  onChange={(e) => setDoseLevels({ ...doseLevels, mid: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">고용량 (mg/kg/day)</Label>
                <Input
                  type="number"
                  value={doseLevels.high}
                  onChange={(e) => setDoseLevels({ ...doseLevels, high: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">최고용량 (mg/kg/day)</Label>
                <Input
                  type="number"
                  value={doseLevels.max}
                  onChange={(e) => setDoseLevels({ ...doseLevels, max: parseFloat(e.target.value) || 0 })}
                  placeholder="선택사항"
                />
              </div>
              <Separator />
              <div>
                <Label className="text-xs text-gray-500">여유율 (%)</Label>
                <Input
                  type="number"
                  value={safetyMargin}
                  onChange={(e) => setSafetyMargin(parseInt(e.target.value) || 20)}
                  min={0}
                  max={100}
                />
                <p className="text-xs text-gray-400 mt-1">소실량 고려 (기본 20%)</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">시험 선택</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {STUDIES.map(study => (
                <div key={study.id} className="flex items-center justify-between">
                  <Label className="text-sm">{study.name}</Label>
                  <Switch
                    checked={enabledStudies[study.id]}
                    onCheckedChange={(checked) => setEnabledStudies({ ...enabledStudies, [study.id]: checked })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 총계 */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">총 소요량</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">
                  {grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-gray-500">mg</p>
                <div className="flex justify-center gap-4 mt-2 text-xs text-gray-500">
                  <span>= {(grandTotal / 1000).toFixed(2)} g</span>
                  <span>= {(grandTotal / 1000000).toFixed(4)} kg</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleExportExcel} variant="outline" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Excel 다운로드
          </Button>
        </div>

        {/* 결과 테이블 */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">시험별 시료량 산출</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">시험명</TableHead>
                      <TableHead className="text-center">용량군</TableHead>
                      <TableHead className="text-center">동물수<br/>(마리)</TableHead>
                      <TableHead className="text-center">체중<br/>(g)</TableHead>
                      <TableHead className="text-center">투여일<br/>(day)</TableHead>
                      <TableHead className="text-center text-red-500">투여량<br/>(mg/kg/day)</TableHead>
                      <TableHead className="text-right">필요량<br/>(mg)</TableHead>
                      <TableHead className="text-right">산출량<br/>(mg)</TableHead>
                      <TableHead className="text-right bg-orange-50 dark:bg-orange-900/20">시험물질 총<br/>필요량(mg)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((study) => (
                      study.groupResults.map((group, groupIdx) => (
                        <TableRow 
                          key={`${study.id}-${group.name}`}
                          className={group.isVehicle ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}
                        >
                          {groupIdx === 0 && (
                            <TableCell rowSpan={study.groupResults.length} className="font-medium align-top border-r">
                              {study.name}
                            </TableCell>
                          )}
                          <TableCell className={`text-center ${group.isVehicle ? 'text-yellow-600 font-medium' : ''}`}>
                            {group.name}
                          </TableCell>
                          <TableCell className="text-center">{group.animalCount}</TableCell>
                          <TableCell className="text-center">{group.bodyWeight}</TableCell>
                          <TableCell className="text-center">{group.doseDays}</TableCell>
                          <TableCell className="text-center text-red-500 font-medium">
                            {group.isVehicle ? '0' : group.doseLevel.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {group.required > 0 ? group.required.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}
                          </TableCell>
                          <TableCell className="text-right">
                            {group.calculated > 0 ? group.calculated.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0.0'}
                          </TableCell>
                          {groupIdx === 0 && (
                            <TableCell 
                              rowSpan={study.groupResults.length} 
                              className="text-right font-bold align-top bg-orange-50 dark:bg-orange-900/20 border-l"
                            >
                              {study.totalCalculated.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    ))}
                    {/* 합계 행 */}
                    <TableRow className="bg-gray-100 dark:bg-slate-800 font-bold">
                      <TableCell colSpan={7}></TableCell>
                      <TableCell className="text-right">total</TableCell>
                      <TableCell className="text-right bg-orange-100 dark:bg-orange-900/30 text-primary">
                        {grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 text-xs text-gray-500 space-y-1">
                <p>*필요량: 투여에 사용되는 양</p>
                <p>*산출량: 투여 시 소실되는 시험물질 양 고려, 필요량 x {(1 + safetyMargin / 100).toFixed(1)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
