'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, RefreshCw } from 'lucide-react';
import { getTestItems, getQcSettings, updateQcSettings, toggleTestItemActive } from '@/lib/clinical-pathology-api';
import type { ClinicalTestItem, ClinicalQcSetting, ClinicalTestCategory } from '@/types/clinical-pathology';
import { CATEGORY_LABELS } from '@/types/clinical-pathology';
import { useToast } from '@/hooks/use-toast';

export default function ClinicalPathologySettingsPage() {
  const { toast } = useToast();
  const [testItems, setTestItems] = useState<ClinicalTestItem[]>([]);
  const [qcSettings, setQcSettings] = useState<ClinicalQcSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsRes, settings] = await Promise.all([
        getTestItems({ isActive: undefined }),
        getQcSettings(),
      ]);
      setTestItems(itemsRes.items);
      setQcSettings(settings);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({ title: '오류', description: '데이터를 불러오는데 실패했습니다.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await toggleTestItemActive(id);
      toast({ title: '성공', description: '검사항목 상태가 변경되었습니다.' });
      loadData();
    } catch (error: any) {
      toast({ title: '오류', description: error.response?.data?.error || '상태 변경에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleQcSettingChange = (category: ClinicalTestCategory, field: 'thresholdCount' | 'qcFee', value: number) => {
    setQcSettings(prev => prev.map(s => 
      s.category === category ? { ...s, [field]: value } : s
    ));
  };

  const handleSaveQcSettings = async () => {
    try {
      setSaving(true);
      await updateQcSettings(qcSettings.map(s => ({
        category: s.category,
        thresholdCount: s.thresholdCount,
        qcFee: s.qcFee,
      })));
      toast({ title: '성공', description: 'QC 설정이 저장되었습니다.' });
    } catch (error: any) {
      toast({ title: '오류', description: error.response?.data?.error || '저장에 실패했습니다.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">임상병리검사 설정</h1>
        <p className="text-muted-foreground">검사항목 및 QC 비용 설정 관리</p>
      </div>

      <Tabs defaultValue="test-items">
        <TabsList>
          <TabsTrigger value="test-items">검사항목 관리</TabsTrigger>
          <TabsTrigger value="qc-settings">QC 비용 설정</TabsTrigger>
        </TabsList>

        <TabsContent value="test-items" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>검사항목 목록</CardTitle>
              <CardDescription>
                검사항목의 활성화/비활성화 상태를 관리합니다. 비활성화된 항목은 견적서 작성 시 표시되지 않습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>코드</TableHead>
                    <TableHead>검사명</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead className="text-right">단가</TableHead>
                    <TableHead>패키지</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.code}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.nameKr}</p>
                          <p className="text-xs text-muted-foreground">{item.nameEn}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {CATEGORY_LABELS[item.category]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell>
                        {item.isPackage ? (
                          <Badge variant="secondary">패키지</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.isActive ? 'default' : 'secondary'}>
                          {item.isActive ? '활성' : '비활성'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(item.id)}
                        >
                          {item.isActive ? '비활성화' : '활성화'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qc-settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>QC 비용 설정</CardTitle>
              <CardDescription>
                카테고리별 QC 비용을 설정합니다. 검체 수가 기준 미만일 경우 QC 비용이 추가됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>카테고리</TableHead>
                    <TableHead>기준 검체 수</TableHead>
                    <TableHead>QC 비용</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qcSettings.map((setting) => (
                    <TableRow key={setting.id}>
                      <TableCell className="font-medium">
                        {CATEGORY_LABELS[setting.category]}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={setting.thresholdCount}
                            onChange={(e) => handleQcSettingChange(setting.category, 'thresholdCount', parseInt(e.target.value) || 0)}
                            className="w-24"
                          />
                          <span className="text-muted-foreground">개 미만</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={setting.qcFee}
                            onChange={(e) => handleQcSettingChange(setting.category, 'qcFee', parseInt(e.target.value) || 0)}
                            className="w-32"
                          />
                          <span className="text-muted-foreground">원</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={loadData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  초기화
                </Button>
                <Button onClick={handleSaveQcSettings} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? '저장 중...' : '저장'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
