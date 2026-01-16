'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRightLeft, Calculator } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SPECIES_DATA } from '@/types/calculator';
import { 
  convertDoseByKm, 
  convertDoseByBSA, 
  convertMgKgToMgM2, 
  convertMgM2ToMgKg 
} from '@/lib/calculators/dose-conversion';

export default function DoseConversionPage() {
  const [mode, setMode] = useState<'species' | 'unit'>('species');
  
  // 종간 변환
  const [sourceSpecies, setSourceSpecies] = useState('rat');
  const [targetSpecies, setTargetSpecies] = useState('human');
  const [sourceDose, setSourceDose] = useState<number | null>(null);
  const [conversionMethod, setConversionMethod] = useState<'km' | 'bsa'>('km');
  const [speciesResult, setSpeciesResult] = useState<{ convertedDose: number; calculationSteps: string[] } | null>(null);
  
  // 단위 변환
  const [unitSpecies, setUnitSpecies] = useState('human');
  const [unitDirection, setUnitDirection] = useState<'kgToM2' | 'm2ToKg'>('kgToM2');
  const [unitDose, setUnitDose] = useState<number | null>(null);
  const [unitResult, setUnitResult] = useState<{ result: number; calculationSteps: string[] } | null>(null);

  const handleSpeciesConversion = () => {
    if (!sourceDose) {
      alert('용량을 입력해주세요.');
      return;
    }
    
    const result = conversionMethod === 'km'
      ? convertDoseByKm(sourceDose, sourceSpecies, targetSpecies)
      : convertDoseByBSA(sourceDose, sourceSpecies, targetSpecies);
    
    setSpeciesResult(result);
  };

  const handleUnitConversion = () => {
    if (!unitDose) {
      alert('용량을 입력해주세요.');
      return;
    }
    
    if (unitDirection === 'kgToM2') {
      const result = convertMgKgToMgM2(unitDose, unitSpecies);
      setUnitResult({
        result: result.doseMgM2,
        calculationSteps: result.calculationSteps
      });
    } else {
      const result = convertMgM2ToMgKg(unitDose, unitSpecies);
      setUnitResult({
        result: result.doseMgKg,
        calculationSteps: result.calculationSteps
      });
    }
  };

  const swapSpecies = () => {
    const temp = sourceSpecies;
    setSourceSpecies(targetSpecies);
    setTargetSpecies(temp);
    setSpeciesResult(null);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">용량 환산 계산기</h1>
          <p className="text-gray-500 dark:text-slate-400">동물 ↔ 사람 용량 환산, 단위 변환</p>
        </div>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as 'species' | 'unit')}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="species">종간 용량 환산</TabsTrigger>
          <TabsTrigger value="unit">단위 변환 (mg/kg ↔ mg/m²)</TabsTrigger>
        </TabsList>

        <TabsContent value="species">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">종간 용량 환산</CardTitle>
                <CardDescription>FDA Km 또는 BSA 기반 환산</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>환산 방법</Label>
                  <Select value={conversionMethod} onValueChange={(v) => setConversionMethod(v as 'km' | 'bsa')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="km">Km 기반 (FDA 권장)</SelectItem>
                      <SelectItem value="bsa">BSA 기반</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label>원본 동물종</Label>
                    <Select value={sourceSpecies} onValueChange={setSourceSpecies}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SPECIES_DATA).map(([key, data]) => (
                          <SelectItem key={key} value={key}>{data.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" size="icon" onClick={swapSpecies}>
                    <ArrowRightLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex-1">
                    <Label>대상 동물종</Label>
                    <Select value={targetSpecies} onValueChange={setTargetSpecies}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SPECIES_DATA).map(([key, data]) => (
                          <SelectItem key={key} value={key}>{data.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>원본 용량 (mg/kg)</Label>
                  <Input
                    type="number"
                    placeholder="예: 100"
                    value={sourceDose ?? ''}
                    onChange={(e) => setSourceDose(e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </div>

                <Button onClick={handleSpeciesConversion} className="w-full">
                  <Calculator className="w-4 h-4 mr-2" />
                  환산하기
                </Button>
              </CardContent>
            </Card>

            {speciesResult && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">환산 결과</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg mb-4">
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                      {SPECIES_DATA[targetSpecies]?.name} 등가 용량
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      {speciesResult.convertedDose.toFixed(4)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">mg/kg</p>
                  </div>
                  <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                    {speciesResult.calculationSteps.join('\n')}
                  </pre>
                </CardContent>
              </Card>
            )}

            {!speciesResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Km 참조표</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>동물종</TableHead>
                        <TableHead className="text-right">Km</TableHead>
                        <TableHead className="text-right">BSA (m²)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.values(SPECIES_DATA).map((species) => (
                        <TableRow key={species.key}>
                          <TableCell>{species.name}</TableCell>
                          <TableCell className="text-right">{species.km}</TableCell>
                          <TableCell className="text-right">{species.bsa}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="unit">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">단위 변환</CardTitle>
                <CardDescription>mg/kg ↔ mg/m² 변환</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>변환 방향</Label>
                  <Select value={unitDirection} onValueChange={(v) => setUnitDirection(v as 'kgToM2' | 'm2ToKg')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kgToM2">mg/kg → mg/m²</SelectItem>
                      <SelectItem value="m2ToKg">mg/m² → mg/kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>동물종</Label>
                  <Select value={unitSpecies} onValueChange={setUnitSpecies}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SPECIES_DATA).map(([key, data]) => (
                        <SelectItem key={key} value={key}>{data.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>용량 ({unitDirection === 'kgToM2' ? 'mg/kg' : 'mg/m²'})</Label>
                  <Input
                    type="number"
                    placeholder="예: 100"
                    value={unitDose ?? ''}
                    onChange={(e) => setUnitDose(e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </div>

                <Button onClick={handleUnitConversion} className="w-full">
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
                  <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg mb-4">
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                      변환된 용량
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      {unitResult.result.toFixed(4)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {unitDirection === 'kgToM2' ? 'mg/m²' : 'mg/kg'}
                    </p>
                  </div>
                  <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                    {unitResult.calculationSteps.join('\n')}
                  </pre>
                </CardContent>
              </Card>
            )}

            {!unitResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">단위 변환 공식</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <p className="font-mono text-sm">mg/m² = mg/kg × Km</p>
                    <p className="text-xs text-gray-500 mt-1">Km = 체중^0.33 × 상수</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <p className="font-mono text-sm">mg/kg = mg/m² ÷ Km</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    * Km 값은 FDA Guidance for Industry (2005) 기준
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
