'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getUserSettings,
  updateUserSettings,
  UpdateUserSettingsDTO,
} from '@/lib/package-api';

const DEFAULT_SETTINGS = {
  defaultValidityDays: 30,
  defaultDiscountRate: 0,
  autoAnalysisCalculation: true,
  validationInvivoCost: 10000000,
  validationInvitroCost: 10000000,
  analysisUnitCost: 1000000,
  emailNotification: true,
  browserNotification: false,
  notifyOnExpiry: true,
  expiryReminderDays: 7,
  currencyUnit: 'KRW',
  dateFormat: 'YYYY.MM.DD',
  showVatNotice: true,
};

export default function SystemSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // API에서 사용자 설정 조회
  const { data: settingsResponse, isLoading } = useQuery({
    queryKey: ['userSettings'],
    queryFn: getUserSettings,
  });

  // 설정 데이터 로드
  useEffect(() => {
    if (settingsResponse?.data) {
      const data = settingsResponse.data;
      setSettings({
        defaultValidityDays: data.defaultValidityDays ?? DEFAULT_SETTINGS.defaultValidityDays,
        defaultDiscountRate: data.defaultDiscountRate ?? DEFAULT_SETTINGS.defaultDiscountRate,
        autoAnalysisCalculation: data.autoAnalysisCalculation ?? DEFAULT_SETTINGS.autoAnalysisCalculation,
        validationInvivoCost: data.validationInvivoCost ?? DEFAULT_SETTINGS.validationInvivoCost,
        validationInvitroCost: data.validationInvitroCost ?? DEFAULT_SETTINGS.validationInvitroCost,
        analysisUnitCost: data.analysisUnitCost ?? DEFAULT_SETTINGS.analysisUnitCost,
        emailNotification: data.emailNotification ?? DEFAULT_SETTINGS.emailNotification,
        browserNotification: data.browserNotification ?? DEFAULT_SETTINGS.browserNotification,
        notifyOnExpiry: data.notifyOnExpiry ?? DEFAULT_SETTINGS.notifyOnExpiry,
        expiryReminderDays: data.expiryReminderDays ?? DEFAULT_SETTINGS.expiryReminderDays,
        currencyUnit: data.currencyUnit ?? DEFAULT_SETTINGS.currencyUnit,
        dateFormat: data.dateFormat ?? DEFAULT_SETTINGS.dateFormat,
        showVatNotice: data.showVatNotice ?? DEFAULT_SETTINGS.showVatNotice,
      });
    }
  }, [settingsResponse]);

  // 설정 저장 mutation
  const saveMutation = useMutation({
    mutationFn: (data: UpdateUserSettingsDTO) => updateUserSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
      toast({
        title: '저장 완료',
        description: '시스템 설정이 업데이트되었습니다.',
      });
    },
    onError: () => {
      toast({
        title: '오류',
        description: '설정 저장에 실패했습니다.',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>설정을 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>견적 설정</CardTitle>
          <CardDescription>견적서 생성 관련 기본 설정</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 견적번호는 <span className="font-semibold">프로필 설정</span>에서 개인 코드로 관리됩니다.
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              형식: 연도-사용자코드-월-일련번호 (예: 25-DL-12-0001)
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>기본 유효기간 (일)</Label>
              <Select
                value={settings.defaultValidityDays.toString()}
                onValueChange={(v) => setSettings({ ...settings, defaultValidityDays: parseInt(v) })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15일</SelectItem>
                  <SelectItem value="30">30일</SelectItem>
                  <SelectItem value="60">60일</SelectItem>
                  <SelectItem value="90">90일</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>기본 할인율 (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={settings.defaultDiscountRate}
                onChange={(e) => setSettings({ ...settings, defaultDiscountRate: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>조제물분석 자동계산</CardTitle>
          <CardDescription>조제물분석 비용 계산에 사용되는 단가</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>자동 계산 사용</Label>
              <p className="text-sm text-gray-500">시험 선택 시 조제물분석 비용 자동 계산</p>
            </div>
            <Switch
              checked={settings.autoAnalysisCalculation}
              onCheckedChange={(v) => setSettings({ ...settings, autoAnalysisCalculation: v })}
            />
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Validation (in vivo)</Label>
              <Input
                type="number"
                value={settings.validationInvivoCost}
                onChange={(e) => setSettings({ ...settings, validationInvivoCost: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-gray-500">원</p>
            </div>
            <div className="space-y-2">
              <Label>Validation (in vitro)</Label>
              <Input
                type="number"
                value={settings.validationInvitroCost}
                onChange={(e) => setSettings({ ...settings, validationInvitroCost: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-gray-500">원</p>
            </div>
            <div className="space-y-2">
              <Label>함량분석 (1회)</Label>
              <Input
                type="number"
                value={settings.analysisUnitCost}
                onChange={(e) => setSettings({ ...settings, analysisUnitCost: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-gray-500">원</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>알림 설정</CardTitle>
          <CardDescription>알림 수신 방법 및 조건</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>이메일 알림</Label>
              <p className="text-sm text-gray-500">중요 이벤트 발생 시 이메일로 알림</p>
            </div>
            <Switch
              checked={settings.emailNotification}
              onCheckedChange={(v) => setSettings({ ...settings, emailNotification: v })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>브라우저 알림</Label>
              <p className="text-sm text-gray-500">브라우저 푸시 알림 사용</p>
            </div>
            <Switch
              checked={settings.browserNotification}
              onCheckedChange={(v) => setSettings({ ...settings, browserNotification: v })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>유효기간 만료 알림</Label>
              <p className="text-sm text-gray-500">견적서 유효기간 만료 전 알림</p>
            </div>
            <Switch
              checked={settings.notifyOnExpiry}
              onCheckedChange={(v) => setSettings({ ...settings, notifyOnExpiry: v })}
            />
          </div>
          {settings.notifyOnExpiry && (
            <div className="ml-4 space-y-2">
              <Label>만료 며칠 전 알림</Label>
              <Select
                value={settings.expiryReminderDays.toString()}
                onValueChange={(v) => setSettings({ ...settings, expiryReminderDays: parseInt(v) })}
              >
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3일 전</SelectItem>
                  <SelectItem value="7">7일 전</SelectItem>
                  <SelectItem value="14">14일 전</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>표시 설정</CardTitle>
          <CardDescription>화면 및 출력물 표시 형식</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>날짜 형식</Label>
              <Select
                value={settings.dateFormat}
                onValueChange={(v) => setSettings({ ...settings, dateFormat: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="YYYY.MM.DD">2025.12.05</SelectItem>
                  <SelectItem value="YYYY-MM-DD">2025-12-05</SelectItem>
                  <SelectItem value="YYYY년 MM월 DD일">2025년 12월 05일</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>통화 단위</Label>
              <Select
                value={settings.currencyUnit}
                onValueChange={(v) => setSettings({ ...settings, currencyUnit: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="KRW">원 (₩)</SelectItem>
                  <SelectItem value="USD">달러 ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>부가세 별도 표시</Label>
              <p className="text-sm text-gray-500">견적서에 &quot;부가세 별도&quot; 문구 표시</p>
            </div>
            <Switch
              checked={settings.showVatNotice}
              onCheckedChange={(v) => setSettings({ ...settings, showVatNotice: v })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          설정 저장
        </Button>
      </div>
    </div>
  );
}
