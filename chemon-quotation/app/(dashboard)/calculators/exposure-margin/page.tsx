'use client';

import { useState } from 'react';
import { ArrowLeft, Calculator, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SPECIES_DATA } from '@/types/calculator';
import { calculateSafetyMargin, compareMultiSpeciesMargin, calculateMaxHumanDose } from '@/lib/calculators/exposure-margin';
import * as XLSX from 'xlsx';

export default function ExposureMarginPage() {
  const [mode, setMode] = useState<'single' | 'multi' | 'reverse'>('single');
  
  // 단일 계산
  const [animalNoael, setAnimalNoael] = useState<string>('');
  const [animalSpecies, setAnimalSpecies] = useState<string>('rat');
  const [humanDose, setHumanDose] = useState<string>('');
  const [humanDoseUnit, setHumanDoseUnit] = useState<'kg' | 'person'>('kg');
  const [humanWeight, setHumanWeight] = useState<string>('60');
  const [animalAUC, setAnimalAUC] = useState<string>('');
  const [humanAUC, setHumanAUC] = useState<string>('');
  const [singleResult, setSingleResult] = useState<any>(null);

  // 다종 비교
  const [multiInputs, setMultiInputs] = useState<{ species: string; noael: string; auc: string }[]>([
    { species: 'rat', noael: '', auc: '' },
    { species: 'dog', noael: '', auc: '' },
  ]);
  const [multiHumanDose, setMultiHumanDose] = useState<string>('');
  const [multiHumanDoseUnit, setMultiHumanDoseUnit] = useState<'kg' | 'person'>('kg');
  const [multiHumanAUC, setMultiHumanAUC] = useState<string>('');
  const [multiResult, setMultiResult] = useState<any>(null);

  // 역산
  const [reverseNoael, setReverseNoael] = useState<string>('');
  const [reverseSpecies, setReverseSpecies] = useState<string>('rat');
  const [targetMargin, setTargetMargin] = useState<string>('10');
  const [reverseResult, setReverseResult] = useState<any>(null);

  const handleSingleCalculate = () => {
    if (!animalNoael || !humanDose) {
      alert('NOAEL과 사람 용량을 입력해주세요.');
      return;
    }

    const result = calculateSafetyMargin({
      animalNoael: parseFloat(animalNoael),
      animalSpecies,
      humanDose: parseFloat(humanDose),
      humanDoseUnit,
      humanWeight: humanWeight ? parseFloat(humanWeight) : undefined,
      animalAUC: animalAUC ? parseFloat(animalAUC) : undefined,
      humanAUC: humanAUC ? parseFloat(humanAUC) : undefined,
    });
    setSingleResult(result);
  };

  const handleMultiCalculate = () => {
    if (!multiHumanDose) {
      alert('사람 용량을 입력해주세요.');
      return;
    }

    const validInputs = multiInputs
      .filter(i => i.noael)
      .map(i => ({
        species: i.species,
        noael: parseFloat(i.noael),
        auc: i.auc ? parseFloat(i.auc) : undefined,
      }));

    if (validInputs.length === 0) {
      alert('최소 1개 이상의 NOAEL을 입력해주세요.');
      return;
    }

    const result = compareMultiSpeciesMargin(
      validInputs,
      parseFloat(multiHumanDose),
      multiHumanDoseUnit,
      humanWeight ? parseFloat(humanWeight) : undefined,
      multiHumanAUC ? parseFloat(multiHumanAUC) : undefined
    );
    setMultiResult(result);
  };

  const handleReverseCalculate = () => {
    if (!reverseNoael || !targetMargin) {
      alert('NOAEL과 목표 마진을 입력해주세요.');
      return;
    }

    const result = calculateMaxHumanDose(
      parseFloat(reverseNoael),
      reverseSpecies,
      parseFloat(targetMargin),
      humanWeight ? parseFloat(humanWeight) : undefined
    );
    setReverseResult(result);
  };

  const addMultiInput = () => {
    setMultiInputs([...multiInputs, { species: 'monkey', noael: '', auc: '' }]);
  };

  const handleExportExcel = () => {
    if (!singleResult && !multiResult) return;

    const wb = XLSX.utils.book_new();
    
    if (singleResult) {
      const data = [
        ['노출량 마진 계산 결과'],
        [''],
        ['동물 NOAEL', `${animalNoael} mg/kg/day`],
        ['동물종', SPECIES_DATA[animalSpecies]?.name || animalSpecies],
        ['사람 용량', `${humanDose} mg/${humanDoseUnit}/day`],
        [''],
        ['Safety Margin (용량 기반)', `${singleResult.safetyMargin.toFixed(2)}배`],
        ['HED 기반 마진', `${singleResult.hedBasedMargin.toFixed(2)}배`],
        singleResult.aucBasedMargin ? ['AUC 기반 마진', `${singleResult.aucBasedMargin.toFixed(2)}배`] : [],
        [''],
        ['평가', singleResult.recommendation],
      ].filter(row => row.length > 0);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), '결과');
    }

    if (multiResult) {
      const data = [
        ['다종 노출량 마진 비교'],
        [''],
        ['동물종', 'NOAEL (mg/kg)', 'HED (mg/kg)', '마진 (배)'],
        ...multiResult.results.map((r: any) => [r.species, r.noael, r.hed.toFixed(4), r.margin.toFixed(2)]),
        [''],
        ['가장 보수적', multiResult.mostConservative],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), '다종비교');
    }

    XLSX.writeFile(wb, `노출량마진_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/calculators">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">노출량 마진 계산기</h1>
          <p className="text-gray-500 dark:text-slate-400">Safety Margin, Exposure Margin, NOAEL 대비 임상용량 비교</p>
        </div>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="single">단일 계산</TabsTrigger>
          <TabsTrigger value="multi">다종 비교</TabsTrigger>
          <TabsTrigger value="reverse">최대 용량 역산</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">노출량 마진 계산</CardTitle>
                <CardDescription>NOAEL 대비 사람 용량 비교</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>동물 NOAEL (mg/kg/day)</Label>
                    <Input
                      type="number"
                      placeholder="예: 100"
                      value={animalNoael}
                      onChange={(e) => setAnimalNoael(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>동물종</Label>
                    <Select value={animalSpecies} onValueChange={setAnimalSpecies}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SPECIES_DATA)
                          .filter(([key]) => key !== 'human')
                          .map(([key, data]) => (
                            <SelectItem key={key} value={key}>{data.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>사람 용량</Label>
                    <Input
                      type="number"
                      placeholder="예: 1"
                      value={humanDose}
                      onChange={(e) => setHumanDose(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>단위</Label>
                    <Select value={humanDoseUnit} onValueChange={(v) => setHumanDoseUnit(v as 'kg' | 'person')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">mg/kg/day</SelectItem>
                        <SelectItem value="person">mg/person/day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>사람 체중 (kg)</Label>
                  <Input
                    type="number"
                    value={humanWeight}
                    onChange={(e) => setHumanWeight(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>동물 AUC (선택)</Label>
                    <Input
                      type="number"
                      placeholder="AUC 값"
                      value={animalAUC}
                      onChange={(e) => setAnimalAUC(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>사람 AUC (선택)</Label>
                    <Input
                      type="number"
                      placeholder="AUC 값"
                      value={humanAUC}
                      onChange={(e) => setHumanAUC(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleSingleCalculate} className="w-full">
                  <Calculator className="w-4 h-4 mr-2" />
                  계산하기
                </Button>
              </CardContent>
            </Card>

            {singleResult && (
              <Card className={`border-2 ${singleResult.hedBasedMargin >= 10 ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : singleResult.hedBasedMargin >= 3 ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {singleResult.hedBasedMargin >= 10 ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    )}
                    계산 결과
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Safety Margin (용량)</p>
                      <p className="text-2xl font-bold">{singleResult.safetyMargin.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">배</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg text-center border-2 border-primary">
                      <p className="text-xs text-gray-500">HED 기반 마진</p>
                      <p className="text-2xl font-bold text-primary">{singleResult.hedBasedMargin.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">배</p>
                    </div>
                    {singleResult.aucBasedMargin && (
                      <div className="col-span-2 p-4 bg-white dark:bg-slate-800 rounded-lg text-center">
                        <p className="text-xs text-gray-500">AUC 기반 마진</p>
                        <p className="text-xl font-bold">{singleResult.aucBasedMargin.toFixed(2)}배</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg mb-4">
                    <p className="text-sm">{singleResult.recommendation}</p>
                  </div>
                  <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                    {singleResult.calculationSteps.join('\n')}
                  </pre>
                  <Button onClick={handleExportExcel} variant="outline" className="w-full mt-4">
                    <Download className="w-4 h-4 mr-2" />
                    Excel로 다운로드
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="multi">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">다종 노출량 마진 비교</CardTitle>
                  <CardDescription>여러 동물종의 마진 비교</CardDescription>
                </div>
                <Button size="sm" onClick={addMultiInput}>추가</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {multiInputs.map((input, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <div>
                      <Label className="text-xs">동물종</Label>
                      <Select
                        value={input.species}
                        onValueChange={(v) => {
                          const newInputs = [...multiInputs];
                          newInputs[idx].species = v;
                          setMultiInputs(newInputs);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(SPECIES_DATA)
                            .filter(([key]) => key !== 'human')
                            .map(([key, data]) => (
                              <SelectItem key={key} value={key}>{data.name}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">NOAEL (mg/kg)</Label>
                      <Input
                        type="number"
                        placeholder="NOAEL"
                        value={input.noael}
                        onChange={(e) => {
                          const newInputs = [...multiInputs];
                          newInputs[idx].noael = e.target.value;
                          setMultiInputs(newInputs);
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">AUC (선택)</Label>
                      <Input
                        type="number"
                        placeholder="AUC"
                        value={input.auc}
                        onChange={(e) => {
                          const newInputs = [...multiInputs];
                          newInputs[idx].auc = e.target.value;
                          setMultiInputs(newInputs);
                        }}
                      />
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>사람 용량</Label>
                    <Input
                      type="number"
                      placeholder="예: 1"
                      value={multiHumanDose}
                      onChange={(e) => setMultiHumanDose(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>단위</Label>
                    <Select value={multiHumanDoseUnit} onValueChange={(v) => setMultiHumanDoseUnit(v as 'kg' | 'person')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">mg/kg/day</SelectItem>
                        <SelectItem value="person">mg/person/day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleMultiCalculate} className="w-full">
                  <Calculator className="w-4 h-4 mr-2" />
                  비교하기
                </Button>
              </CardContent>
            </Card>

            {multiResult && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">다종 비교 결과</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>동물종</TableHead>
                        <TableHead className="text-right">NOAEL</TableHead>
                        <TableHead className="text-right">HED</TableHead>
                        <TableHead className="text-right">마진</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {multiResult.results.map((r: any, idx: number) => (
                        <TableRow key={idx} className={r.species === multiResult.mostConservative ? 'bg-green-50 dark:bg-green-900/20' : ''}>
                          <TableCell>
                            {r.species}
                            {r.species === multiResult.mostConservative && (
                              <Badge className="ml-2" variant="secondary">가장 보수적</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{r.noael} mg/kg</TableCell>
                          <TableCell className="text-right">{r.hed.toFixed(4)} mg/kg</TableCell>
                          <TableCell className={`text-right font-bold ${r.margin >= 10 ? 'text-green-600' : r.margin >= 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {r.margin.toFixed(2)}배
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap mt-4">
                    {multiResult.calculationSteps.join('\n')}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reverse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">최대 사람 용량 역산</CardTitle>
                <CardDescription>목표 마진 달성을 위한 최대 용량</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>동물 NOAEL (mg/kg/day)</Label>
                    <Input
                      type="number"
                      placeholder="예: 100"
                      value={reverseNoael}
                      onChange={(e) => setReverseNoael(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>동물종</Label>
                    <Select value={reverseSpecies} onValueChange={setReverseSpecies}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SPECIES_DATA)
                          .filter(([key]) => key !== 'human')
                          .map(([key, data]) => (
                            <SelectItem key={key} value={key}>{data.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>목표 마진 (배)</Label>
                  <Input
                    type="number"
                    placeholder="예: 10"
                    value={targetMargin}
                    onChange={(e) => setTargetMargin(e.target.value)}
                  />
                </div>
                <div>
                  <Label>사람 체중 (kg)</Label>
                  <Input
                    type="number"
                    value={humanWeight}
                    onChange={(e) => setHumanWeight(e.target.value)}
                  />
                </div>
                <Button onClick={handleReverseCalculate} className="w-full">
                  <Calculator className="w-4 h-4 mr-2" />
                  역산하기
                </Button>
              </CardContent>
            </Card>

            {reverseResult && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">최대 사람 용량</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg text-center border-2 border-primary">
                      <p className="text-xs text-gray-500">최대 용량 (mg/kg)</p>
                      <p className="text-2xl font-bold text-primary">{reverseResult.maxDosePerKg.toFixed(4)}</p>
                      <p className="text-xs text-gray-500">mg/kg/day</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg text-center border-2 border-primary">
                      <p className="text-xs text-gray-500">최대 용량 (mg/person)</p>
                      <p className="text-2xl font-bold text-primary">{reverseResult.maxDosePerPerson.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">mg/person/day</p>
                    </div>
                  </div>
                  <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                    {reverseResult.calculationSteps.join('\n')}
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
