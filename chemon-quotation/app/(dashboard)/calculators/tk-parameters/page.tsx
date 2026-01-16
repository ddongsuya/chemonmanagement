'use client';

import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Calculator, Download } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TimeConcentrationPoint, TKParameters, calculateAllTKParameters } from '@/lib/calculators/tk-parameters';
import * as XLSX from 'xlsx';

export default function TKParametersPage() {
  const [dataPoints, setDataPoints] = useState<{ id: string; time: string; concentration: string }[]>([
    { id: '1', time: '', concentration: '' },
    { id: '2', time: '', concentration: '' },
    { id: '3', time: '', concentration: '' },
  ]);
  const [dose, setDose] = useState<string>('');
  const [result, setResult] = useState<{ parameters: TKParameters; calculationSteps: string[] } | null>(null);

  const addDataPoint = () => {
    setDataPoints([...dataPoints, { id: String(Date.now()), time: '', concentration: '' }]);
  };

  const removeDataPoint = (id: string) => {
    if (dataPoints.length > 2) {
      setDataPoints(dataPoints.filter(p => p.id !== id));
    }
  };

  const updateDataPoint = (id: string, field: 'time' | 'concentration', value: string) => {
    setDataPoints(dataPoints.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleCalculate = () => {
    const validPoints: TimeConcentrationPoint[] = dataPoints
      .filter(p => p.time !== '' && p.concentration !== '')
      .map(p => ({
        time: parseFloat(p.time),
        concentration: parseFloat(p.concentration)
      }))
      .filter(p => !isNaN(p.time) && !isNaN(p.concentration));

    if (validPoints.length < 3) {
      alert('최소 3개 이상의 유효한 데이터 포인트가 필요합니다.');
      return;
    }

    const doseValue = dose ? parseFloat(dose) : undefined;
    const calcResult = calculateAllTKParameters(validPoints, doseValue);
    setResult(calcResult);
  };

  const handleExportExcel = () => {
    if (!result) return;

    const wb = XLSX.utils.book_new();
    
    // 파라미터 시트
    const paramData = [
      ['TK 파라미터 계산 결과'],
      [''],
      ['파라미터', '값', '단위'],
      ['Cmax', result.parameters.cmax.toFixed(4), '농도 단위'],
      ['Tmax', result.parameters.tmax.toFixed(2), 'hr'],
      ['AUC0-t', result.parameters.auc0t.toFixed(4), '농도×hr'],
      ['AUC0-∞', result.parameters.auc0inf?.toFixed(4) || 'N/A', '농도×hr'],
      ['t1/2', result.parameters.halfLife?.toFixed(2) || 'N/A', 'hr'],
      ['ke', result.parameters.ke?.toFixed(4) || 'N/A', 'hr⁻¹'],
      ['MRT', result.parameters.mrt?.toFixed(2) || 'N/A', 'hr'],
      ['CL', result.parameters.cl?.toFixed(4) || 'N/A', 'L/hr/kg'],
      ['Vd', result.parameters.vd?.toFixed(4) || 'N/A', 'L/kg'],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(paramData), '파라미터');

    // 원본 데이터 시트
    const rawData = [
      ['시간-농도 데이터'],
      [''],
      ['Time (hr)', 'Concentration'],
      ...dataPoints
        .filter(p => p.time !== '' && p.concentration !== '')
        .map(p => [parseFloat(p.time), parseFloat(p.concentration)])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rawData), '원본데이터');

    XLSX.writeFile(wb, `TK_파라미터_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">TK 파라미터 계산기</h1>
          <p className="text-gray-500 dark:text-slate-400">AUC, Cmax, Tmax, T1/2 등 독성동태 파라미터 계산</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">시간-농도 데이터 입력</CardTitle>
                <CardDescription>최소 3개 이상의 데이터 포인트 필요</CardDescription>
              </div>
              <Button size="sm" onClick={addDataPoint}>
                <Plus className="w-4 h-4 mr-1" /> 추가
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-2">
                  <div className="col-span-5">Time (hr)</div>
                  <div className="col-span-5">Concentration</div>
                  <div className="col-span-2"></div>
                </div>
                {dataPoints.map((point, idx) => (
                  <div key={point.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Input
                        type="number"
                        placeholder={`T${idx + 1}`}
                        value={point.time}
                        onChange={(e) => updateDataPoint(point.id, 'time', e.target.value)}
                        step="0.1"
                      />
                    </div>
                    <div className="col-span-5">
                      <Input
                        type="number"
                        placeholder={`C${idx + 1}`}
                        value={point.concentration}
                        onChange={(e) => updateDataPoint(point.id, 'concentration', e.target.value)}
                        step="0.001"
                      />
                    </div>
                    <div className="col-span-2">
                      {dataPoints.length > 2 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500"
                          onClick={() => removeDataPoint(point.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">추가 정보 (선택)</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label>투여 용량 (mg/kg) - CL, Vd 계산용</Label>
                <Input
                  type="number"
                  placeholder="예: 10"
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleCalculate} className="w-full" size="lg">
            <Calculator className="w-4 h-4 mr-2" />
            파라미터 계산
          </Button>
        </div>

        <div className="space-y-6">
          {result ? (
            <>
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">계산 결과</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Cmax</p>
                      <p className="text-xl font-bold text-primary">{result.parameters.cmax.toFixed(4)}</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Tmax</p>
                      <p className="text-xl font-bold text-primary">{result.parameters.tmax.toFixed(2)} hr</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-lg text-center">
                      <p className="text-xs text-gray-500">AUC0-t</p>
                      <p className="text-xl font-bold text-primary">{result.parameters.auc0t.toFixed(4)}</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-lg text-center">
                      <p className="text-xs text-gray-500">AUC0-∞</p>
                      <p className="text-xl font-bold text-primary">
                        {result.parameters.auc0inf?.toFixed(4) || 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-lg text-center">
                      <p className="text-xs text-gray-500">t1/2</p>
                      <p className="text-xl font-bold text-primary">
                        {result.parameters.halfLife?.toFixed(2) || 'N/A'} hr
                      </p>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-lg text-center">
                      <p className="text-xs text-gray-500">ke</p>
                      <p className="text-xl font-bold text-primary">
                        {result.parameters.ke?.toFixed(4) || 'N/A'} hr⁻¹
                      </p>
                    </div>
                    {result.parameters.cl && (
                      <>
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-lg text-center">
                          <p className="text-xs text-gray-500">CL</p>
                          <p className="text-xl font-bold text-primary">{result.parameters.cl.toFixed(4)}</p>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-lg text-center">
                          <p className="text-xs text-gray-500">Vd</p>
                          <p className="text-xl font-bold text-primary">{result.parameters.vd?.toFixed(4)}</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

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

              <Button onClick={handleExportExcel} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Excel로 다운로드
              </Button>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">TK 파라미터 설명</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>파라미터</TableHead>
                      <TableHead>설명</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Cmax</TableCell>
                      <TableCell>최대 혈중 농도</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Tmax</TableCell>
                      <TableCell>최대 농도 도달 시간</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">AUC0-t</TableCell>
                      <TableCell>농도-시간 곡선하 면적 (0~마지막 측정점)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">AUC0-∞</TableCell>
                      <TableCell>농도-시간 곡선하 면적 (0~무한대)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">t1/2</TableCell>
                      <TableCell>반감기</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">ke</TableCell>
                      <TableCell>소실 속도 상수</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">CL</TableCell>
                      <TableCell>청소율 (Clearance)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Vd</TableCell>
                      <TableCell>분포용적 (Volume of Distribution)</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
