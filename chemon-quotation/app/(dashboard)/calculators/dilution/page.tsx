'use client';

import { useState } from 'react';
import { ArrowLeft, Calculator, Info } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateDilution, calculateSerialDilution, calculateStockSolution, convertConcentrationUnit } from '@/lib/calculators/dilution';

export default function DilutionCalculatorPage() {
  const [mode, setMode] = useState<'c1v1' | 'serial' | 'stock' | 'unit'>('c1v1');
  
  // C1V1 = C2V2
  const [c1, setC1] = useState<string>('');
  const [v1, setV1] = useState<string>('');
  const [c2, setC2] = useState<string>('');
  const [v2, setV2] = useState<string>('');
  const [solveFor, setSolveFor] = useState<'v1' | 'v2'>('v1');
  const [dilutionResult, setDilutionResult] = useState<{ c1: number; v1: number; c2: number; v2: number; diluentVolume: number; dilutionFactor: number; calculationSteps: string[] } | null>(null);

  // 연속 희석
  const [stockConc, setStockConc] = useState<string>('');
  const [targetConcs, setTargetConcs] = useState<string>('');
  const [finalVol, setFinalVol] = useState<string>('');
  const [serialResult, setSerialResult] = useState<{ steps: { step: number; concentration: number; stockVolume: number; diluentVolume: number }[]; calculationSteps: string[] } | null>(null);

  // Stock Solution
  const [substanceWeight, setSubstanceWeight] = useState<string>('');
  const [targetStockConc, setTargetStockConc] = useState<string>('');
  const [purity, setPurity] = useState<string>('100');
  const [stockResult, setStockResult] = useState<{ volume: number; actualWeight: number; calculationSteps: string[] } | null>(null);

  // 단위 변환
  const [unitValue, setUnitValue] = useState<string>('');
  const [fromUnit, setFromUnit] = useState<string>('mg/mL');
  const [toUnit, setToUnit] = useState<string>('μg/mL');
  const [molecularWeight, setMolecularWeight] = useState<string>('');
  const [unitResult, setUnitResult] = useState<{ convertedValue: number; calculationSteps: string[] } | null>(null);

  const handleDilutionCalculate = () => {
    if (!c1 || !c2) {
      alert('C1과 C2를 입력해주세요.');
      return;
    }
    
    const input = {
      c1: parseFloat(c1),
      c2: parseFloat(c2),
      v1: solveFor === 'v2' && v1 ? parseFloat(v1) : undefined,
      v2: solveFor === 'v1' && v2 ? parseFloat(v2) : undefined,
    };

    if (solveFor === 'v1' && !v2) {
      alert('V2를 입력해주세요.');
      return;
    }
    if (solveFor === 'v2' && !v1) {
      alert('V1을 입력해주세요.');
      return;
    }

    const result = calculateDilution(input);
    setDilutionResult(result);
  };

  const handleSerialCalculate = () => {
    if (!stockConc || !targetConcs || !finalVol) {
      alert('모든 값을 입력해주세요.');
      return;
    }
    
    const targets = targetConcs.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    if (targets.length === 0) {
      alert('유효한 목표 농도를 입력해주세요.');
      return;
    }

    const result = calculateSerialDilution(parseFloat(stockConc), targets, parseFloat(finalVol));
    setSerialResult(result);
  };

  const handleStockCalculate = () => {
    if (!substanceWeight || !targetStockConc) {
      alert('물질 무게와 목표 농도를 입력해주세요.');
      return;
    }

    const result = calculateStockSolution(
      parseFloat(substanceWeight),
      parseFloat(targetStockConc),
      purity ? parseFloat(purity) : undefined
    );
    setStockResult(result);
  };

  const handleUnitConvert = () => {
    if (!unitValue) {
      alert('값을 입력해주세요.');
      return;
    }

    const needsMW = (fromUnit.includes('M') || toUnit.includes('M')) && 
                    !(fromUnit.includes('M') && toUnit.includes('M')) &&
                    !(fromUnit.includes('mg') && toUnit.includes('mg'));
    
    if (needsMW && !molecularWeight) {
      alert('몰 농도 변환에는 분자량이 필요합니다.');
      return;
    }

    try {
      const result = convertConcentrationUnit(
        parseFloat(unitValue),
        fromUnit as any,
        toUnit as any,
        molecularWeight ? parseFloat(molecularWeight) : undefined
      );
      setUnitResult(result);
    } catch (e: any) {
      alert(e.message);
    }
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">희석 계산기</h1>
          <p className="text-gray-500 dark:text-slate-400">C1V1 = C2V2, 연속 희석, Stock solution 계산</p>
        </div>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="c1v1">C1V1 = C2V2</TabsTrigger>
          <TabsTrigger value="serial">연속 희석</TabsTrigger>
          <TabsTrigger value="stock">Stock Solution</TabsTrigger>
          <TabsTrigger value="unit">단위 변환</TabsTrigger>
        </TabsList>

        <TabsContent value="c1v1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">C1V1 = C2V2 계산</CardTitle>
                <CardDescription>희석 공식을 이용한 계산</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>계산할 값</Label>
                  <Select value={solveFor} onValueChange={(v) => setSolveFor(v as 'v1' | 'v2')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="v1">V1 (Stock 부피) 계산</SelectItem>
                      <SelectItem value="v2">V2 (최종 부피) 계산</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>C1 (초기 농도)</Label>
                    <Input
                      type="number"
                      placeholder="예: 10"
                      value={c1}
                      onChange={(e) => setC1(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>V1 (초기 부피, mL)</Label>
                    <Input
                      type="number"
                      placeholder={solveFor === 'v1' ? '계산됨' : '입력'}
                      value={v1}
                      onChange={(e) => setV1(e.target.value)}
                      disabled={solveFor === 'v1'}
                    />
                  </div>
                  <div>
                    <Label>C2 (최종 농도)</Label>
                    <Input
                      type="number"
                      placeholder="예: 1"
                      value={c2}
                      onChange={(e) => setC2(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>V2 (최종 부피, mL)</Label>
                    <Input
                      type="number"
                      placeholder={solveFor === 'v2' ? '계산됨' : '입력'}
                      value={v2}
                      onChange={(e) => setV2(e.target.value)}
                      disabled={solveFor === 'v2'}
                    />
                  </div>
                </div>
                <Button onClick={handleDilutionCalculate} className="w-full">
                  <Calculator className="w-4 h-4 mr-2" />
                  계산하기
                </Button>
              </CardContent>
            </Card>

            {dilutionResult && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">계산 결과</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Stock 부피 (V1)</p>
                      <p className="text-2xl font-bold text-primary">{dilutionResult.v1.toFixed(4)}</p>
                      <p className="text-xs text-gray-500">mL</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg text-center">
                      <p className="text-xs text-gray-500">희석액 부피</p>
                      <p className="text-2xl font-bold">{dilutionResult.diluentVolume.toFixed(4)}</p>
                      <p className="text-xs text-gray-500">mL</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg text-center">
                      <p className="text-xs text-gray-500">최종 부피 (V2)</p>
                      <p className="text-2xl font-bold">{dilutionResult.v2.toFixed(4)}</p>
                      <p className="text-xs text-gray-500">mL</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg text-center">
                      <p className="text-xs text-gray-500">희석 배수</p>
                      <p className="text-2xl font-bold">{dilutionResult.dilutionFactor.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">배</p>
                    </div>
                  </div>
                  <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                    {dilutionResult.calculationSteps.join('\n')}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="serial">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">연속 희석 계산</CardTitle>
                <CardDescription>여러 농도의 희석액 제조</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Stock 농도</Label>
                  <Input
                    type="number"
                    placeholder="예: 1000"
                    value={stockConc}
                    onChange={(e) => setStockConc(e.target.value)}
                  />
                </div>
                <div>
                  <Label>목표 농도 (쉼표로 구분)</Label>
                  <Input
                    placeholder="예: 100, 50, 25, 10, 5"
                    value={targetConcs}
                    onChange={(e) => setTargetConcs(e.target.value)}
                  />
                </div>
                <div>
                  <Label>각 희석액 최종 부피 (mL)</Label>
                  <Input
                    type="number"
                    placeholder="예: 10"
                    value={finalVol}
                    onChange={(e) => setFinalVol(e.target.value)}
                  />
                </div>
                <Button onClick={handleSerialCalculate} className="w-full">
                  <Calculator className="w-4 h-4 mr-2" />
                  계산하기
                </Button>
              </CardContent>
            </Card>

            {serialResult && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">연속 희석 결과</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Step</TableHead>
                        <TableHead className="text-right">농도</TableHead>
                        <TableHead className="text-right">Stock (mL)</TableHead>
                        <TableHead className="text-right">희석액 (mL)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serialResult.steps.map((step) => (
                        <TableRow key={step.step}>
                          <TableCell>{step.step}</TableCell>
                          <TableCell className="text-right">{step.concentration}</TableCell>
                          <TableCell className="text-right font-medium text-primary">{step.stockVolume.toFixed(4)}</TableCell>
                          <TableCell className="text-right">{step.diluentVolume.toFixed(4)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="stock">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Stock Solution 제조</CardTitle>
                <CardDescription>물질 무게로부터 필요 용매 부피 계산</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>물질 무게 (mg)</Label>
                  <Input
                    type="number"
                    placeholder="예: 100"
                    value={substanceWeight}
                    onChange={(e) => setSubstanceWeight(e.target.value)}
                  />
                </div>
                <div>
                  <Label>목표 농도 (mg/mL)</Label>
                  <Input
                    type="number"
                    placeholder="예: 10"
                    value={targetStockConc}
                    onChange={(e) => setTargetStockConc(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-1">
                    순도 (%)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>순도가 100% 미만이면 보정됩니다</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={purity}
                    onChange={(e) => setPurity(e.target.value)}
                    max={100}
                  />
                </div>
                <Button onClick={handleStockCalculate} className="w-full">
                  <Calculator className="w-4 h-4 mr-2" />
                  계산하기
                </Button>
              </CardContent>
            </Card>

            {stockResult && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">Stock Solution 제조법</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-lg text-center mb-4">
                    <p className="text-xs text-gray-500">필요 용매 부피</p>
                    <p className="text-3xl font-bold text-primary">{stockResult.volume.toFixed(4)}</p>
                    <p className="text-xs text-gray-500">mL</p>
                  </div>
                  <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                    {stockResult.calculationSteps.join('\n')}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="unit">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">농도 단위 변환</CardTitle>
                <CardDescription>질량 농도 ↔ 몰 농도 변환</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>값</Label>
                  <Input
                    type="number"
                    placeholder="예: 1"
                    value={unitValue}
                    onChange={(e) => setUnitValue(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>변환 전 단위</Label>
                    <Select value={fromUnit} onValueChange={setFromUnit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mg/mL">mg/mL</SelectItem>
                        <SelectItem value="μg/mL">μg/mL</SelectItem>
                        <SelectItem value="ng/mL">ng/mL</SelectItem>
                        <SelectItem value="M">M (mol/L)</SelectItem>
                        <SelectItem value="mM">mM</SelectItem>
                        <SelectItem value="μM">μM</SelectItem>
                        <SelectItem value="nM">nM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>변환 후 단위</Label>
                    <Select value={toUnit} onValueChange={setToUnit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mg/mL">mg/mL</SelectItem>
                        <SelectItem value="μg/mL">μg/mL</SelectItem>
                        <SelectItem value="ng/mL">ng/mL</SelectItem>
                        <SelectItem value="M">M (mol/L)</SelectItem>
                        <SelectItem value="mM">mM</SelectItem>
                        <SelectItem value="μM">μM</SelectItem>
                        <SelectItem value="nM">nM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>분자량 (g/mol) - 몰 농도 변환 시 필요</Label>
                  <Input
                    type="number"
                    placeholder="예: 500"
                    value={molecularWeight}
                    onChange={(e) => setMolecularWeight(e.target.value)}
                  />
                </div>
                <Button onClick={handleUnitConvert} className="w-full">
                  <Calculator className="w-4 h-4 mr-2" />
                  변환하기
                </Button>
              </CardContent>
            </Card>

            {unitResult && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">변환 결과</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-lg text-center mb-4">
                    <p className="text-xs text-gray-500">{toUnit}</p>
                    <p className="text-3xl font-bold text-primary">{unitResult.convertedValue.toFixed(6)}</p>
                  </div>
                  <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                    {unitResult.calculationSteps.join('\n')}
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
