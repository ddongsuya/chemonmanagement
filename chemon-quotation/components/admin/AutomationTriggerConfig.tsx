'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Zap, Calendar, Plus, RefreshCw } from 'lucide-react';
import type { AutomationTriggerType, TriggerConfig } from './AutomationRuleForm';

// 트리거 타입 정보
const TRIGGER_TYPES: Array<{
  value: AutomationTriggerType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}> = [
  {
    value: 'STATUS_CHANGE',
    label: '상태 변경',
    description: '항목의 상태가 변경될 때 트리거됩니다',
    icon: <RefreshCw className="h-4 w-4" />,
    color: 'border-blue-300 text-blue-600 bg-blue-50',
  },
  {
    value: 'DATE_REACHED',
    label: '날짜 도달',
    description: '특정 날짜에 도달하면 트리거됩니다',
    icon: <Calendar className="h-4 w-4" />,
    color: 'border-orange-300 text-orange-600 bg-orange-50',
  },
  {
    value: 'ITEM_CREATED',
    label: '항목 생성',
    description: '새 항목이 생성될 때 트리거됩니다',
    icon: <Plus className="h-4 w-4" />,
    color: 'border-green-300 text-green-600 bg-green-50',
  },
  {
    value: 'ITEM_UPDATED',
    label: '항목 수정',
    description: '항목이 수정될 때 트리거됩니다',
    icon: <RefreshCw className="h-4 w-4" />,
    color: 'border-purple-300 text-purple-600 bg-purple-50',
  },
];

// 대상 모델 옵션
const MODEL_OPTIONS = [
  { value: 'Lead', label: '리드' },
  { value: 'Quotation', label: '견적서' },
  { value: 'Contract', label: '계약' },
  { value: 'Study', label: '시험' },
  { value: 'Customer', label: '고객' },
];

// 리드 상태 옵션
const LEAD_STATUS_OPTIONS = [
  { value: 'NEW', label: '신규' },
  { value: 'CONTACTED', label: '연락됨' },
  { value: 'QUALIFIED', label: '검증됨' },
  { value: 'PROPOSAL', label: '제안' },
  { value: 'NEGOTIATION', label: '협상' },
  { value: 'WON', label: '성공' },
  { value: 'LOST', label: '실패' },
];

// 견적서 상태 옵션
const QUOTATION_STATUS_OPTIONS = [
  { value: 'DRAFT', label: '초안' },
  { value: 'SENT', label: '발송됨' },
  { value: 'ACCEPTED', label: '수락됨' },
  { value: 'REJECTED', label: '거절됨' },
  { value: 'EXPIRED', label: '만료됨' },
];

// 계약 상태 옵션
const CONTRACT_STATUS_OPTIONS = [
  { value: 'DRAFT', label: '초안' },
  { value: 'PENDING', label: '대기중' },
  { value: 'ACTIVE', label: '진행중' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'CANCELLED', label: '취소됨' },
];

// 날짜 필드 옵션 (모델별)
const DATE_FIELD_OPTIONS: Record<string, Array<{ value: string; label: string }>> = {
  Lead: [
    { value: 'createdAt', label: '생성일' },
    { value: 'updatedAt', label: '수정일' },
  ],
  Quotation: [
    { value: 'validUntil', label: '유효기간' },
    { value: 'createdAt', label: '생성일' },
  ],
  Contract: [
    { value: 'startDate', label: '시작일' },
    { value: 'endDate', label: '종료일' },
    { value: 'createdAt', label: '생성일' },
  ],
  Study: [
    { value: 'expectedStartDate', label: '예정 시작일' },
    { value: 'expectedEndDate', label: '예정 종료일' },
    { value: 'actualStartDate', label: '실제 시작일' },
    { value: 'actualEndDate', label: '실제 종료일' },
  ],
  Customer: [
    { value: 'createdAt', label: '생성일' },
  ],
};

interface AutomationTriggerConfigProps {
  triggerType: AutomationTriggerType;
  triggerConfig: TriggerConfig;
  onChange: (triggerType: AutomationTriggerType, triggerConfig: TriggerConfig) => void;
}

/**
 * 자동화 트리거 설정 컴포넌트
 * Requirements: 2.1.2 - 트리거 유형 선택 (상태 변경, 날짜 도달, 항목 생성)
 */
export default function AutomationTriggerConfig({
  triggerType,
  triggerConfig,
  onChange,
}: AutomationTriggerConfigProps) {
  const selectedTrigger = TRIGGER_TYPES.find(t => t.value === triggerType);

  /**
   * 트리거 타입 변경 핸들러
   */
  const handleTriggerTypeChange = (newType: AutomationTriggerType) => {
    // 트리거 타입 변경 시 기본 설정으로 초기화
    const defaultConfig: TriggerConfig = { model: 'Lead' };
    
    if (newType === 'STATUS_CHANGE') {
      defaultConfig.field = 'status';
    } else if (newType === 'DATE_REACHED') {
      defaultConfig.field = 'createdAt';
      defaultConfig.daysBefore = 0;
    }
    
    onChange(newType, defaultConfig);
  };

  /**
   * 트리거 설정 변경 핸들러
   */
  const handleConfigChange = (field: keyof TriggerConfig, value: string | number | undefined) => {
    const newConfig = { ...triggerConfig, [field]: value };
    
    // 모델 변경 시 관련 필드 초기화
    if (field === 'model') {
      if (triggerType === 'STATUS_CHANGE') {
        delete newConfig.fromStatus;
        delete newConfig.toStatus;
      } else if (triggerType === 'DATE_REACHED') {
        const dateFields = DATE_FIELD_OPTIONS[value as string] || [];
        newConfig.field = dateFields[0]?.value || 'createdAt';
      }
    }
    
    onChange(triggerType, newConfig);
  };

  /**
   * 상태 옵션 가져오기
   */
  const getStatusOptions = () => {
    switch (triggerConfig.model) {
      case 'Lead':
        return LEAD_STATUS_OPTIONS;
      case 'Quotation':
        return QUOTATION_STATUS_OPTIONS;
      case 'Contract':
        return CONTRACT_STATUS_OPTIONS;
      default:
        return [];
    }
  };

  /**
   * 날짜 필드 옵션 가져오기
   */
  const getDateFieldOptions = () => {
    return DATE_FIELD_OPTIONS[triggerConfig.model || 'Lead'] || [];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="h-5 w-5" />
          트리거 설정
        </CardTitle>
        <CardDescription>
          자동화 규칙이 실행될 조건을 설정합니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 트리거 타입 선택 */}
        <div className="space-y-3">
          <Label>트리거 유형 *</Label>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {TRIGGER_TYPES.map((trigger) => (
              <button
                key={trigger.value}
                type="button"
                onClick={() => handleTriggerTypeChange(trigger.value)}
                className={`flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all hover:border-primary ${
                  triggerType === trigger.value
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={trigger.color}>
                    {trigger.icon}
                  </Badge>
                  <span className="font-medium">{trigger.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {trigger.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* 대상 모델 선택 */}
        <div className="space-y-2">
          <Label htmlFor="model">대상 모델 *</Label>
          <Select
            value={triggerConfig.model || 'Lead'}
            onValueChange={(value) => handleConfigChange('model', value)}
          >
            <SelectTrigger id="model">
              <SelectValue placeholder="모델 선택" />
            </SelectTrigger>
            <SelectContent>
              {MODEL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            트리거가 적용될 데이터 모델을 선택합니다
          </p>
        </div>

        {/* 상태 변경 트리거 설정 */}
        {triggerType === 'STATUS_CHANGE' && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fromStatus">이전 상태 (선택)</Label>
              <Select
                value={triggerConfig.fromStatus || ''}
                onValueChange={(value) => handleConfigChange('fromStatus', value || undefined)}
              >
                <SelectTrigger id="fromStatus">
                  <SelectValue placeholder="모든 상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">모든 상태</SelectItem>
                  {getStatusOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                특정 상태에서 변경될 때만 트리거
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="toStatus">변경 후 상태 (선택)</Label>
              <Select
                value={triggerConfig.toStatus || ''}
                onValueChange={(value) => handleConfigChange('toStatus', value || undefined)}
              >
                <SelectTrigger id="toStatus">
                  <SelectValue placeholder="모든 상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">모든 상태</SelectItem>
                  {getStatusOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                특정 상태로 변경될 때만 트리거
              </p>
            </div>
          </div>
        )}

        {/* 날짜 도달 트리거 설정 */}
        {triggerType === 'DATE_REACHED' && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateField">날짜 필드 *</Label>
              <Select
                value={triggerConfig.field || 'createdAt'}
                onValueChange={(value) => handleConfigChange('field', value)}
              >
                <SelectTrigger id="dateField">
                  <SelectValue placeholder="날짜 필드 선택" />
                </SelectTrigger>
                <SelectContent>
                  {getDateFieldOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                기준이 될 날짜 필드를 선택합니다
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="daysBefore">N일 전 알림</Label>
              <Input
                id="daysBefore"
                type="number"
                value={triggerConfig.daysBefore ?? 0}
                onChange={(e) => handleConfigChange('daysBefore', parseInt(e.target.value) || 0)}
                min={0}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                해당 날짜 N일 전에 트리거됩니다 (0 = 당일)
              </p>
            </div>
          </div>
        )}

        {/* 항목 생성/수정 트리거 안내 */}
        {(triggerType === 'ITEM_CREATED' || triggerType === 'ITEM_UPDATED') && (
          <div className="rounded-lg border border-dashed p-4 bg-muted/50">
            <p className="text-sm text-muted-foreground">
              {triggerType === 'ITEM_CREATED'
                ? '선택한 모델의 새 항목이 생성될 때마다 트리거됩니다.'
                : '선택한 모델의 항목이 수정될 때마다 트리거됩니다.'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              아래 조건 설정에서 추가 필터링 조건을 지정할 수 있습니다.
            </p>
          </div>
        )}

        {/* 현재 설정 요약 */}
        {selectedTrigger && (
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm font-medium mb-2">현재 설정 요약</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={selectedTrigger.color}>
                {selectedTrigger.label}
              </Badge>
              <Badge variant="secondary">
                {MODEL_OPTIONS.find(m => m.value === triggerConfig.model)?.label || triggerConfig.model}
              </Badge>
              {triggerType === 'STATUS_CHANGE' && triggerConfig.fromStatus && (
                <Badge variant="outline">
                  {getStatusOptions().find(s => s.value === triggerConfig.fromStatus)?.label} →
                </Badge>
              )}
              {triggerType === 'STATUS_CHANGE' && triggerConfig.toStatus && (
                <Badge variant="outline">
                  → {getStatusOptions().find(s => s.value === triggerConfig.toStatus)?.label}
                </Badge>
              )}
              {triggerType === 'DATE_REACHED' && (
                <>
                  <Badge variant="outline">
                    {getDateFieldOptions().find(f => f.value === triggerConfig.field)?.label}
                  </Badge>
                  <Badge variant="outline">
                    {triggerConfig.daysBefore || 0}일 전
                  </Badge>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
