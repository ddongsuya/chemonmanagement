'use client';

import { useState, useCallback } from 'react';
import { ArrowLeft, Plus, Trash2, Download, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { 
  SPECIES_DATA, 
  ROUTE_LABELS, 
  SpeciesNoaelInput, 
  MRSDCalculationResult,
  RouteType 
} from '@/types/calculator';
import { calculateMRSDForward, calculateMRSDReverse, convertToExcelData } from '@/lib/calculators/mrsd';
import * as XLSX from 'xlsx';

// nanoid 대신 간단한 ID 생성 함수
const generateId = () => Math.random().toString(36).substring(2, 15);

export default function MRSDCalculatorPage() {
  // 계산 방향
  const [direction, setDirection] = useState<'forward' | 'reverse'>('forward');
  
  // 공통 입력
  const [humanWeight, setHumanWeight] = useState<number>(60);
  const [safetyFactor, setSafetyFactor] = useState<number>(10);
  
  // 정방향 입력
  const [speciesInputs, setSpeciesInputs] = useState<SpeciesNoaelInput[]>([
    { id: generateId(), speciesKey: 'rat', noael: null, route: 'oral', bioavailability: 100 },
  ]);
  
  // PAD 입력
  const [padEnabled, setPadEnabled] = useState(false);
  const [padValue, setPadValue] = useState<number | null>(null);
  const [padBasis, setPadBasis] = useState<'animal' | 'invitro' | 'pk' | 'literature'>('animal');
  
  // 역방향 입력
  const [targetDose, setTargetDose] = useState<number | null>(null);
  const [targetDoseUnit, setTargetDoseUnit] = useState<'kg' | 'person'>('kg');
  const [reverseSpecies, setReverseSpecies] = useState<string>('rat');
  
  // 결과
  const [result, setResult] = useState<MRSDCalculationResult | null>(null);
  const [reverseResult, setReverseResult] = useState<{
    requiredNoael: number;
    hed: number;
    calculationSteps: string[];
    species: string;
    targetMRSD: number;
  } | null>(null);
  
  // 동물종 추가
  const addSpeciesInput = useCallback(() => {
    setSpeciesInputs(prev => [
      ...prev,
      { id: generateId(), speciesKey: 'dog', noael: null, route: 'oral', bioavailability: 100 },
    ]);
  }, []);
  
  // 동물종 제거
  const removeSpeciesInput = useCallback((id: string) => {
    setSpeciesInputs(prev => prev.filter(input => input.id !== id));
  }, []);
  
  // 동물종 입력 업데이트
  const updateSpeciesInput = useCallback((id: string, field: keyof SpeciesNoaelInput, value: any) => {
    setSpeciesInputs(prev => prev.map(input => 
      input.id === id ? { ...input, [field]: value } : input
    ));
  }, []);
  
  // 계산 실행
  const handleCalculate = useCallback(() => {
    if (direction === 'forward') {
      const validInputs = speciesInputs.filter(input => input.noael && input.noael > 0);
      if (validInputs.length === 0) {
        alert('최소 하나의 동물종에 NOAEL 값을 입력해주세요.');
        return;
      }
      
      const calcResult = calculateMRSDForward(
        speciesInputs,
        humanWeight,
        safetyFactor,
        padEnabled ? (padValue ?? undefined) : undefined,
        padEnabled ? padBasis : undefined
      );
      setResult(calcResult);
      setReverseResult(null);
    } else {
      if (!targetDose) {
        alert('목표 용량을 입력해주세요.');
        return;
      }
      
      const mrsd = targetDoseUnit === 'person' ? targetDose / humanWeight : targetDose;
      const calcResult = calculateMRSDReverse(mrsd, reverseSpecies, safetyFactor, humanWeight);
      
      setReverseResult({
        ...calcResult,
        species: reverseSpecies,
        targetMRSD: mrsd,
      });
      setResult(null);
    }
  }, [direction, speciesInputs, humanWeight, safetyFactor, padEnabled, padValue, padBasis, targetDose, targetDoseUnit, reverseSpecies]);
  
  // Excel 다운로드
  const handleExportExcel = useCallback(() => {
    if (!result) {
      alert('먼저 계산을 수행해주세요.');
      return;
    }
    
    const { summarySheet, comparisonSheet, referenceSheet } = convertToExcelData(result);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summarySheet), '요약');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(comparisonSheet), '다종비교');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(referenceSheet), 'Km참조표');
    
    const filename = `MRSD_계산결과_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
  }, [result]);

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/calculators">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">MRSD 계산기</h1>
          <p className="text-gray-500 dark:text-slate-400">FDA Guidance for Industry 기반 Maximum Recommended Starting Dose 계산</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 입력 패널 */}
        <div className="space-y-6">
          {/* 계산 방향 선택 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">계산 방향</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={direction} onValueChange={(v) => setDirection(v as 'forward' | 'reverse')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="forward">동물 NOAEL → 사람 MRSD</TabsTrigger>
                  <TabsTrigger value="reverse">목표 용량 → 필요 NOAEL</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* 정방향 입력 */}
          {direction === 'forward' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">동물종별 NOAEL 입력</CardTitle>
                  <CardDescription>다종 비교 지원</CardDescription>
                </div>
                <Button size="sm" onClick={addSpeciesInput}>
                  <Plus className="w-4 h-4 mr-1" /> 동물종 추가
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {speciesInputs.map((input) => (
                    <div key={input.id} className="flex gap-2 items-start p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">동물종</Label>
                          <Select
                            value={input.speciesKey}
                            onValueChange={(v) => updateSpeciesInput(input.id, 'speciesKey', v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(SPECIES_DATA)
                                .filter(([key]) => key !== 'human')
                                .map(([key, data]) => (
                                  <SelectItem key={key} value={key}>{data.name}</SelectItem>
                                ))
                              }
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">NOAEL (mg/kg/day)</Label>
                          <Input
                            type="number"
                            placeholder="예: 100"
                            value={input.noael ?? ''}
                            onChange={(e) => updateSpeciesInput(input.id, 'noael', e.target.value ? parseFloat(e.target.value) : null)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">투여경로</Label>
                          <Select
                            value={input.route}
                            onValueChange={(v) => updateSpeciesInput(input.id, 'route', v as RouteType)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(ROUTE_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">생체이용률 (%)</Label>
                          <Input
                            type="number"
                            value={input.bioavailability}
                            min={0}
                            max={100}
                            onChange={(e) => updateSpeciesInput(input.id, 'bioavailability', parseFloat(e.target.value) || 100)}
                          />
                        </div>
                      </div>
                      {speciesInputs.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeSpeciesInput(input.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* 역방향 입력 */}
          {direction === 'reverse' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">목표 용량 입력</CardTitle>
                <CardDescription>필요한 동물 NOAEL을 역산합니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>목표 용량</Label>
                    <Input
                      type="number"
                      placeholder="예: 1"
                      value={targetDose ?? ''}
                      onChange={(e) => setTargetDose(e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </div>
                  <div>
                    <Label>단위</Label>
                    <Select value={targetDoseUnit} onValueChange={(v) => setTargetDoseUnit(v as 'kg' | 'person')}>
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
                  <Label>확인할 동물종</Label>
                  <Select value={reverseSpecies} onValueChange={setReverseSpecies}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SPECIES_DATA)
                        .filter(([key]) => key !== 'human')
                        .map(([key, data]) => (
                          <SelectItem key={key} value={key}>{data.name}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* 공통 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">공통 설정</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-1">
                    사람 체중 (kg)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>FDA 기준 60kg</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    type="number"
                    value={humanWeight}
                    onChange={(e) => setHumanWeight(parseFloat(e.target.value) || 60)}
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-1">
                    안전계수 (SF)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>일반적으로 10 사용</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    type="number"
                    value={safetyFactor}
                    onChange={(e) => setSafetyFactor(parseFloat(e.target.value) || 10)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* PAD 비교 (정방향만) */}
          {direction === 'forward' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">PAD 비교</CardTitle>
                  <CardDescription>약리활성용량(PAD)과 비교</CardDescription>
                </div>
                <Switch checked={padEnabled} onCheckedChange={setPadEnabled} />
              </CardHeader>
              {padEnabled && (
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>PAD (mg/kg)</Label>
                      <Input
                        type="number"
                        placeholder="예: 0.5"
                        value={padValue ?? ''}
                        onChange={(e) => setPadValue(e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label>PAD 산출 근거</Label>
                      <Select value={padBasis} onValueChange={(v) => setPadBasis(v as typeof padBasis)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="animal">동물 약효용량 환산</SelectItem>
                          <SelectItem value="invitro">In vitro EC50 기반</SelectItem>
                          <SelectItem value="pk">PK 모델링</SelectItem>
                          <SelectItem value="literature">문헌 기반</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )}
          
          {/* 계산 버튼 */}
          <Button onClick={handleCalculate} className="w-full" size="lg">
            계산하기
          </Button>
        </div>
        
        {/* 결과 패널 */}
        <div className="space-y-6">
          {/* 정방향 결과 */}
          {result && (
            <>
              {/* 요약 */}
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    계산 결과
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.mostConservative && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">가장 보수적인 동물종</p>
                        <p className="text-lg font-bold text-green-600">{result.mostConservative.species.name}</p>
                      </div>
                      <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg border-2 border-primary">
                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">권장 MRSD</p>
                        <p className="text-xl font-bold text-primary">{result.mostConservative.mrsd.toFixed(4)}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">mg/kg/day</p>
                      </div>
                      <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg border-2 border-primary">
                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">총 용량 ({humanWeight}kg)</p>
                        <p className="text-xl font-bold text-primary">{result.mostConservative.mrsdTotal.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">mg/person/day</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* 다종 비교 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">다종 비교 결과</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>동물종</TableHead>
                        <TableHead>NOAEL</TableHead>
                        <TableHead>투여경로</TableHead>
                        <TableHead>HED</TableHead>
                        <TableHead>MRSD</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.results.map((r, idx) => (
                        <TableRow key={idx} className={idx === 0 ? 'bg-green-50 dark:bg-green-900/20' : ''}>
                          <TableCell className="font-medium">
                            {r.species.name}
                            {idx === 0 && <Badge className="ml-2" variant="secondary">가장 보수적</Badge>}
                          </TableCell>
                          <TableCell>{r.noael} mg/kg</TableCell>
                          <TableCell>{ROUTE_LABELS[r.route]}</TableCell>
                          <TableCell>{r.hed.toFixed(4)} mg/kg</TableCell>
                          <TableCell className={idx === 0 ? 'text-green-600 font-bold' : ''}>
                            {r.mrsd.toFixed(4)} mg/kg
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              
              {/* PAD 비교 결과 */}
              {result.padComparison && (
                <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      PAD vs MRSD 비교
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center gap-8 mb-4">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 dark:text-slate-400">NOAEL 기반 MRSD</p>
                        <p className="text-2xl font-bold text-primary">{result.padComparison.mrsd.toFixed(4)}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">mg/kg</p>
                      </div>
                      <span className="text-2xl text-gray-400">vs</span>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 dark:text-slate-400">PAD</p>
                        <p className="text-2xl font-bold text-yellow-600">{result.padComparison.padValue.toFixed(4)}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">mg/kg</p>
                      </div>
                    </div>
                    <p className="text-sm p-3 bg-white dark:bg-slate-800 rounded-lg">
                      {result.padComparison.ratio >= 1 ? (
                        <span className="text-green-600">✓ {result.padComparison.recommendation}</span>
                      ) : (
                        <span className="text-yellow-700 dark:text-yellow-500">⚠ {result.padComparison.recommendation}</span>
                      )}
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {/* 계산 과정 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">계산 과정</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                    {result.calculationSteps.join('\n')}
                  </pre>
                </CardContent>
              </Card>
              
              {/* Excel 다운로드 */}
              <Button onClick={handleExportExcel} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Excel로 다운로드
              </Button>
            </>
          )}
          
          {/* 역방향 결과 */}
          {reverseResult && (
            <>
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    역산 결과
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">목표 MRSD</p>
                      <p className="text-lg font-bold">{reverseResult.targetMRSD.toFixed(4)}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">mg/kg/day</p>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">필요 HED</p>
                      <p className="text-lg font-bold">{reverseResult.hed.toFixed(4)}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">mg/kg (SF={safetyFactor})</p>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg border-2 border-primary">
                      <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">{SPECIES_DATA[reverseResult.species].name} 필요 NOAEL</p>
                      <p className="text-xl font-bold text-primary">{reverseResult.requiredNoael.toFixed(2)}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">mg/kg/day 이상</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">역산 과정</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                    {reverseResult.calculationSteps.join('\n')}
                  </pre>
                </CardContent>
              </Card>
            </>
          )}
          
          {/* Km 참조표 */}
          {!result && !reverseResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">종간 변환계수 (Km) 참조표</CardTitle>
                <CardDescription>FDA Guidance for Industry 기준</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>동물종</TableHead>
                      <TableHead className="text-right">체중 (kg)</TableHead>
                      <TableHead className="text-right">Km</TableHead>
                      <TableHead className="text-right">변환계수</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.values(SPECIES_DATA).map((species) => (
                      <TableRow 
                        key={species.key}
                        className={species.key === 'human' ? 'bg-primary/10 font-medium' : ''}
                      >
                        <TableCell>{species.name}</TableCell>
                        <TableCell className="text-right">{species.weight}</TableCell>
                        <TableCell className="text-right">{species.km}</TableCell>
                        <TableCell className="text-right">{species.factor.toFixed(3)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-4">
                  * 변환계수 = 동물 Km ÷ 사람 Km (37)<br />
                  * HED = 동물 NOAEL × 변환계수
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
