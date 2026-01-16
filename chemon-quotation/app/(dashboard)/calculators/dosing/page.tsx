'use client';

import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Calculator, Download } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { calculateDose, calculateGroupDosing, calculateMaxDoseByVolume } from '@/lib/calculators/dosing';
import * as XLSX from 'xlsx';

export default function DosingCalculatorPage() {
  const [mode, setMode] = useState<'single' | 'group' | 'volume'>('single');
  
  // 단일 계산
  const [bodyWeight, setBodyWeight] = useState<string>('');
  const [dosePerKg, setDosePerKg] = useState<string>('');
  const [concentration, setConcentration] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('');
  const [singleResult, setSingleResult] = useState<{ totalDose: number; volume: number; dailyDose?: number; calculationSteps: string[] } | null>(null);

  // 군별 계산
  const [animals, setAnimals] = useState<{ id: string; weight: string }[]>([
    { id: '1', weight: '' },
    { id: '2', weight: '' },
    { id: '3', weight: '' },
  ]);
  const [groupDosePerKg, setGroupDosePerKg] = useState<string>('');
  const [groupConcentration, setGroupConcentration] = useState<string>('');
  const [groupResult, setGroupResult] = useState<{ results: { id: string; weight: number; dose: number; volume: number }[]; summary: { totalDose: number; totalVolume: number; avgWeight: number } } | null>(null);

  // 투여액량 제한
  const [limitWeight, setLimitWeight] = useState<string>('');
  const [maxVolumePerKg, setMaxVolumePerKg] = useState<string>('10');
  const [limitConcentration, setLimitConcentration] = useState<string>('');
  const [limitResult, setLimitResult] = useState<{ maxDose: number; maxVolume: number; calculationSteps: string[] } | null>(null);

  const handleSingleCalculate = () => {
    if (!bodyWeight || !dosePerKg || !concentration) {
      alert('체중, 용량, 농도를 모두 입력해주세요.');
      return;
    }
    const result = calculateDose({
      bodyWeight: parseFloat(bodyWeight),
      dosePerKg: parseFloat(dosePerKg),
      concentration: parseFloat(concentration),
      frequency: frequency ? parseFloat(frequency) : undefined
    });
    setSingleResult(result);
  };

  const addAnimal = () => {
    setAnimals([...animals, { id: String(Date.now()), weight: '' }]);
  };

  const removeAnimal = (id: string) => {
    if (animals.length > 1) {
      setAnimals(animals.filter(a => a.id !== id));
    }
  };

  const handleGroupCalculate = () => {
    if (!groupDosePerKg || !groupConcentration) {
      alert('용량과 농도를 입력해주세요.');
      return;
    }
    const validAnimals = animals
      .filter(a => a.weight !== '')
      .map((a, idx) => ({ id: `동물 ${idx + 1}`, weight: parseFloat(a.weight) }));
    
    if (validAnimals.length === 0) {
      alert('최소 1마리 이상의 체중을 입력해주세요.');
      return;
    }

    const result = calculateGroupDosing(
      validAnimals,
      parseFloat(groupDosePerKg),
      parseFloat(groupConcentration)
    );
    setGroupResult(result);
  };

  const handleLimitCalculate = () => {
    if (!limitWeight || !maxVolumePerKg || !limitConcentration) {
      alert('모든 값을 입력해주세요.');
      return;
    }
    const result = calculateMaxDoseByVolume(
      parseFloat(limitWeight),
      parseFloat(maxVolumePerKg),
      parseFloat(limitConcentration)
    );
    setLimitResult(result);
  };

  const handleExportGroupExcel = () => {
    if (!groupResult) return;
    const wb = XLSX.utils.book_new();
    const data = [
      ['군별 투여량 계산 결과'],
      [''],
      ['용량', `${groupDosePerKg} mg/kg`],
      ['농도', `${groupConcentration} mg/mL`],
      [''],
      ['동물', '체중 (kg)', '투여량 (mg)', '투여액량 (mL)'],
      ...groupResult.results.map(r => [r.id, r.weight, r.dose.toFixed(2), r.volume.toFixed(3)]),
      [''],
      ['합계', groupResult.summary.avgWeight.toFixed(2) + ' (평균)', groupResult.summary.totalDose.toFixed(2), groupResult.summary.totalVolume.toFixed(3)]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), '투여량');
    XLSX.writeFile(wb, `투여량_계산_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/calculators">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">투여량 계산기</h1>
          <p className="text-gray-500 dark:text-slate-400">체중 기반 투여량, 투여액량, 농도 계산</p>
        </div>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as 'single' | 'group' | 'volume')}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="single">단일 계산</TabsTrigger>
          <TabsTrigger value="group">군별 계산</TabsTrigger>
          <TabsTrigger value="volume">투여액량 제한</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">투여량 계산</CardTitle>
                <CardDescription>체중 × 용량 = 총 투여량</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>체중 (kg)</Label>
                  <Input
                    type="number"
                    placeholder="예: 0.25"
                    value={bodyWeight}
                    onChange={(e) => setBodyWeight(e.target.value)}
                    step="0.01"
                  />
                </div>
                <div>
                  <Label>용량 (mg/kg)</Label>
                  <Input
                    type="number"
                    placeholder="예: 100"
                    value={dosePerKg}
                    onChange={(e) => setDosePerKg(e.target.value)}
                  />
                </div>
                <div>
                  <Label>투여액 농도 (mg/mL)</Label>
                  <Input
                    type="number"
                    placeholder="예: 10"
                    value={concentration}
                    onChange={(e) => setConcentration(e.target.value)}
                  />
                </div>
                <div>
                  <Label>투여 횟수/일 (선택)</Label>
                  <Input
                    type="number"
                    placeholder="예: 1"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                  />
                </div>
                <Button onClick={handleSingleCalculate} className="w-full">
                  <Calculator className="w-4 h-4 mr-2" />
                  계산하기
                </Button>
              </CardContent>
            </Card>

            {singleResult && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">계산 결과</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg text-center">
                      <p className="text-xs text-gray-500">총 투여량</p>
                      <p className="text-2xl font-bold text-primary">{singleResult.totalDose.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">mg</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg text-center border-2 border-primary">
                      <p className="text-xs text-gray-500">투여액량</p>
                      <p className="text-2xl font-bold text-primary">{singleResult.volume.toFixed(3)}</p>
                      <p className="text-xs text-gray-500">mL</p>
                    </div>
                    {singleResult.dailyDose && (
                      <div className="col-span-2 p-4 bg-white dark:bg-slate-800 rounded-lg text-center">
                        <p className="text-xs text-gray-500">일일 투여량</p>
                        <p className="text-xl font-bold">{singleResult.dailyDose.toFixed(2)} mg/day</p>
                      </div>
                    )}
                  </div>
                  <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                    {singleResult.calculationSteps.join('\n')}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="group">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">군별 투여량 계산</CardTitle>
                  <CardDescription>여러 동물의 투여량 일괄 계산</CardDescription>
                </div>
                <Button size="sm" onClick={addAnimal}>
                  <Plus className="w-4 h-4 mr-1" /> 추가
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>용량 (mg/kg)</Label>
                    <Input
                      type="number"
                      placeholder="예: 100"
                      value={groupDosePerKg}
                      onChange={(e) => setGroupDosePerKg(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>농도 (mg/mL)</Label>
                    <Input
                      type="number"
                      placeholder="예: 10"
                      value={groupConcentration}
                      onChange={(e) => setGroupConcentration(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  <Label>동물 체중 (kg)</Label>
                  {animals.map((animal, idx) => (
                    <div key={animal.id} className="flex gap-2">
                      <Input
                        type="number"
                        placeholder={`동물 ${idx + 1} 체중`}
                        value={animal.weight}
                        onChange={(e) => {
                          setAnimals(animals.map(a => a.id === animal.id ? { ...a, weight: e.target.value } : a));
                        }}
                        step="0.01"
                      />
                      {animals.length > 1 && (
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeAnimal(animal.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button onClick={handleGroupCalculate} className="w-full">
                  <Calculator className="w-4 h-4 mr-2" />
                  계산하기
                </Button>
              </CardContent>
            </Card>

            {groupResult && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">군별 계산 결과</CardTitle>
                  <Button size="sm" variant="outline" onClick={handleExportGroupExcel}>
                    <Download className="w-4 h-4 mr-1" /> Excel
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>동물</TableHead>
                        <TableHead className="text-right">체중 (kg)</TableHead>
                        <TableHead className="text-right">투여량 (mg)</TableHead>
                        <TableHead className="text-right">투여액량 (mL)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupResult.results.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.id}</TableCell>
                          <TableCell className="text-right">{r.weight.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{r.dose.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium text-primary">{r.volume.toFixed(3)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50 dark:bg-slate-800 font-medium">
                        <TableCell>합계/평균</TableCell>
                        <TableCell className="text-right">{groupResult.summary.avgWeight.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{groupResult.summary.totalDose.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-primary">{groupResult.summary.totalVolume.toFixed(3)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="volume">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">투여액량 제한 계산</CardTitle>
                <CardDescription>mL/kg 제한 시 최대 투여 가능 용량</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>체중 (kg)</Label>
                  <Input
                    type="number"
                    placeholder="예: 0.25"
                    value={limitWeight}
                    onChange={(e) => setLimitWeight(e.target.value)}
                    step="0.01"
                  />
                </div>
                <div>
                  <Label>최대 투여액량 (mL/kg)</Label>
                  <Input
                    type="number"
                    placeholder="예: 10"
                    value={maxVolumePerKg}
                    onChange={(e) => setMaxVolumePerKg(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">일반적으로 설치류 10 mL/kg, 비설치류 5 mL/kg</p>
                </div>
                <div>
                  <Label>투여액 농도 (mg/mL)</Label>
                  <Input
                    type="number"
                    placeholder="예: 10"
                    value={limitConcentration}
                    onChange={(e) => setLimitConcentration(e.target.value)}
                  />
                </div>
                <Button onClick={handleLimitCalculate} className="w-full">
                  <Calculator className="w-4 h-4 mr-2" />
                  계산하기
                </Button>
              </CardContent>
            </Card>

            {limitResult && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">최대 투여 가능량</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg text-center">
                      <p className="text-xs text-gray-500">최대 투여액량</p>
                      <p className="text-2xl font-bold">{limitResult.maxVolume.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">mL</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg text-center border-2 border-primary">
                      <p className="text-xs text-gray-500">최대 투여량</p>
                      <p className="text-2xl font-bold text-primary">{limitResult.maxDose.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">mg</p>
                    </div>
                  </div>
                  <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                    {limitResult.calculationSteps.join('\n')}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
