'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { StitchBadge } from '@/components/ui/StitchBadge';
import { StitchPageHeader } from '@/components/ui/StitchPageHeader';
import { StitchCard } from '@/components/ui/StitchCard';
import {
  StitchTable,
  StitchTableHeader,
  StitchTableBody,
  StitchTableRow,
  StitchTableHead,
  StitchTableCell,
} from '@/components/ui/StitchTable';
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
      <StitchPageHeader
        title="임상병리검사 설정"
        label="SETTINGS"
        description="검사항목 및 QC 비용 설정 관리"
      />

      <Tabs defaultValue="test-items">
        <TabsList>
          <TabsTrigger value="test-items">검사항목 관리</TabsTrigger>
          <TabsTrigger value="qc-settings">QC 비용 설정</TabsTrigger>
        </TabsList>

        <TabsContent value="test-items" className="mt-4">
          <StitchCard variant="surface-low" padding="lg">
            <div className="mb-2">
              <h3 className="text-xl font-bold">검사항목 목록</h3>
              <p className="text-sm text-slate-500 mt-1">
                검사항목의 활성화/비활성화 상태를 관리합니다. 비활성화된 항목은 견적서 작성 시 표시되지 않습니다.
              </p>
            </div>
            <div className="mt-6">
              <StitchTable>
                <StitchTableHeader>
                  <StitchTableRow>
                    <StitchTableHead>코드</StitchTableHead>
                    <StitchTableHead>검사명</StitchTableHead>
                    <StitchTableHead>카테고리</StitchTableHead>
                    <StitchTableHead className="text-right">단가</StitchTableHead>
                    <StitchTableHead>패키지</StitchTableHead>
                    <StitchTableHead>상태</StitchTableHead>
                    <StitchTableHead className="w-[100px]"></StitchTableHead>
                  </StitchTableRow>
                </StitchTableHeader>
                <StitchTableBody>
                  {testItems.map((item) => (
                    <StitchTableRow key={item.id}>
                      <StitchTableCell className="font-mono text-primary">{item.code}</StitchTableCell>
                      <StitchTableCell>
                        <div>
                          <p className="font-bold text-slate-900">{item.nameKr}</p>
                          <p className="text-xs text-slate-500">{item.nameEn}</p>
                        </div>
                      </StitchTableCell>
                      <StitchTableCell>
                        <StitchBadge variant="neutral">
                          {CATEGORY_LABELS[item.category]}
                        </StitchBadge>
                      </StitchTableCell>
                      <StitchTableCell className="text-right font-bold text-slate-900">{formatCurrency(item.unitPrice)}</StitchTableCell>
                      <StitchTableCell>
                        {item.isPackage ? (
                          <StitchBadge variant="primary">패키지</StitchBadge>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </StitchTableCell>
                      <StitchTableCell>
                        <StitchBadge variant={item.isActive ? 'success' : 'neutral'}>
                          {item.isActive ? '활성' : '비활성'}
                        </StitchBadge>
                      </StitchTableCell>
                      <StitchTableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(item.id)}
                        >
                          {item.isActive ? '비활성화' : '활성화'}
                        </Button>
                      </StitchTableCell>
                    </StitchTableRow>
                  ))}
                </StitchTableBody>
              </StitchTable>
            </div>
          </StitchCard>
        </TabsContent>

        <TabsContent value="qc-settings" className="mt-4">
          <StitchCard variant="surface-low" padding="lg">
            <div className="mb-2">
              <h3 className="text-xl font-bold">QC 비용 설정</h3>
              <p className="text-sm text-slate-500 mt-1">
                카테고리별 QC 비용을 설정합니다. 검체 수가 기준 미만일 경우 QC 비용이 추가됩니다.
              </p>
            </div>
            <div className="space-y-6 mt-6">
              <StitchTable>
                <StitchTableHeader>
                  <StitchTableRow>
                    <StitchTableHead>카테고리</StitchTableHead>
                    <StitchTableHead>기준 검체 수</StitchTableHead>
                    <StitchTableHead>QC 비용</StitchTableHead>
                  </StitchTableRow>
                </StitchTableHeader>
                <StitchTableBody>
                  {qcSettings.map((setting) => (
                    <StitchTableRow key={setting.id}>
                      <StitchTableCell className="font-bold text-slate-900">
                        {CATEGORY_LABELS[setting.category]}
                      </StitchTableCell>
                      <StitchTableCell>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={setting.thresholdCount}
                            onChange={(e) => handleQcSettingChange(setting.category, 'thresholdCount', parseInt(e.target.value) || 0)}
                            className="w-24 bg-white border-none rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                          />
                          <span className="text-slate-500">개 미만</span>
                        </div>
                      </StitchTableCell>
                      <StitchTableCell>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={setting.qcFee}
                            onChange={(e) => handleQcSettingChange(setting.category, 'qcFee', parseInt(e.target.value) || 0)}
                            className="w-32 bg-white border-none rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                          />
                          <span className="text-slate-500">원</span>
                        </div>
                      </StitchTableCell>
                    </StitchTableRow>
                  ))}
                </StitchTableBody>
              </StitchTable>

              <div className="flex justify-end gap-2">
                <Button variant="outline" className="rounded-xl font-bold" onClick={loadData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  초기화
                </Button>
                <Button className="bg-gradient-to-r from-primary to-orange-400 rounded-xl font-bold" onClick={handleSaveQcSettings} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? '저장 중...' : '저장'}
                </Button>
              </div>
            </div>
          </StitchCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
