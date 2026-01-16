'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_SETTINGS = {
  default_validity_days: 30,
  default_discount_rate: 0,
  auto_analysis_calculation: true,
  validation_invivo_cost: 10000000,
  validation_invitro_cost: 10000000,
  analysis_unit_cost: 1000000,
  email_notification: true,
  browser_notification: false,
  notify_on_expiry: true,
  expiry_reminder_days: 7,
  currency_unit: 'KRW',
  date_format: 'YYYY.MM.DD',
  show_vat_notice: true,
};

export default function SystemSettings() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // localStorage에서 로드
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('system_settings');
    if (saved) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      } catch (e) {
        console.error('Failed to parse system settings:', e);
      }
    }
  }, []);

  // 저장
  const handleSave = async () => {
    setSaving(true);
    localStorage.setItem('system_settings', JSON.stringify(settings));
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    toast({
      title: '저장 완료',
      description: '시스템 설정이 업데이트되었습니다.',
    });
  };

  // 초기화
  const handleReset = () => {
    if (confirm('모든 설정을 기본값으로 초기화하시겠습니까?')) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.removeItem('system_settings');
      toast({
        title: '초기화 완료',
        description: '모든 설정이 기본값으로 초기화되었습니다.',
      });
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 견적 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>견적 설정</CardTitle>
          <CardDescription>견적서 생성 관련 기본 설정</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 견적번호 안내 */}
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
                value={settings.default_validity_days.toString()}
                onValueChange={(v) =>
                  setSettings({
                    ...settings,
                    default_validity_days: parseInt(v),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
                value={settings.default_discount_rate}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    default_discount_rate: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 조제물분석 자동계산 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>조제물분석 자동계산</CardTitle>
          <CardDescription>
            조제물분석 비용 계산에 사용되는 단가
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>자동 계산 사용</Label>
              <p className="text-sm text-gray-500">
                시험 선택 시 조제물분석 비용 자동 계산
              </p>
            </div>
            <Switch
              checked={settings.auto_analysis_calculation}
              onCheckedChange={(v) =>
                setSettings({ ...settings, auto_analysis_calculation: v })
              }
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Validation (in vivo)</Label>
              <Input
                type="number"
                value={settings.validation_invivo_cost}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    validation_invivo_cost: parseInt(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-gray-500">원</p>
            </div>

            <div className="space-y-2">
              <Label>Validation (in vitro)</Label>
              <Input
                type="number"
                value={settings.validation_invitro_cost}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    validation_invitro_cost: parseInt(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-gray-500">원</p>
            </div>

            <div className="space-y-2">
              <Label>함량분석 (1회)</Label>
              <Input
                type="number"
                value={settings.analysis_unit_cost}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    analysis_unit_cost: parseInt(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-gray-500">원</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 알림 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>알림 설정</CardTitle>
          <CardDescription>알림 수신 방법 및 조건</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>이메일 알림</Label>
              <p className="text-sm text-gray-500">
                중요 이벤트 발생 시 이메일로 알림
              </p>
            </div>
            <Switch
              checked={settings.email_notification}
              onCheckedChange={(v) =>
                setSettings({ ...settings, email_notification: v })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>브라우저 알림</Label>
              <p className="text-sm text-gray-500">브라우저 푸시 알림 사용</p>
            </div>
            <Switch
              checked={settings.browser_notification}
              onCheckedChange={(v) =>
                setSettings({ ...settings, browser_notification: v })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>유효기간 만료 알림</Label>
              <p className="text-sm text-gray-500">
                견적서 유효기간 만료 전 알림
              </p>
            </div>
            <Switch
              checked={settings.notify_on_expiry}
              onCheckedChange={(v) =>
                setSettings({ ...settings, notify_on_expiry: v })
              }
            />
          </div>

          {settings.notify_on_expiry && (
            <div className="ml-4 space-y-2">
              <Label>만료 며칠 전 알림</Label>
              <Select
                value={settings.expiry_reminder_days.toString()}
                onValueChange={(v) =>
                  setSettings({
                    ...settings,
                    expiry_reminder_days: parseInt(v),
                  })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
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

      {/* 표시 설정 */}
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
                value={settings.date_format}
                onValueChange={(v) =>
                  setSettings({ ...settings, date_format: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YYYY.MM.DD">2025.12.05</SelectItem>
                  <SelectItem value="YYYY-MM-DD">2025-12-05</SelectItem>
                  <SelectItem value="YYYY년 MM월 DD일">
                    2025년 12월 05일
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>통화 단위</Label>
              <Select
                value={settings.currency_unit}
                onValueChange={(v) =>
                  setSettings({ ...settings, currency_unit: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
              <p className="text-sm text-gray-500">
                견적서에 &quot;부가세 별도&quot; 문구 표시
              </p>
            </div>
            <Switch
              checked={settings.show_vat_notice}
              onCheckedChange={(v) =>
                setSettings({ ...settings, show_vat_notice: v })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 버튼 */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          기본값으로 초기화
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          설정 저장
        </Button>
      </div>
    </div>
  );
}
