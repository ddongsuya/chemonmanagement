'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Loader2, Zap } from 'lucide-react';
import { getAccessToken } from '@/lib/auth-api';
import AutomationTriggerConfig from './AutomationTriggerConfig';
import AutomationConditionBuilder from './AutomationConditionBuilder';
import AutomationActionConfig from './AutomationActionConfig';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 트리거 타입
export type AutomationTriggerType = 'STATUS_CHANGE' | 'DATE_REACHED' | 'ITEM_CREATED' | 'ITEM_UPDATED';

// 액션 타입
export type AutomationActionType = 'SEND_NOTIFICATION' | 'UPDATE_STATUS' | 'CREATE_ACTIVITY';

// 조건 인터페이스
export interface AutomationCondition {
  field: string;
  operator: string;
  value: string | number | boolean;
}

// 액션 인터페이스
export interface AutomationAction {
  actionType: AutomationActionType;
  actionConfig: Record<string, unknown>;
  order?: number;
  delayMinutes?: number;
}

// 트리거 설정 인터페이스
export interface TriggerConfig {
  model?: string;
  field?: string;
  fromStatus?: string;
  toStatus?: string;
  daysBefore?: number;
}

// 폼 데이터 인터페이스
export interface AutomationRuleFormData {
  name: string;
  description: string;
  triggerType: AutomationTriggerType;
  triggerConfig: TriggerConfig;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  status: 'ACTIVE' | 'INACTIVE';
  priority: number;
}

// 기존 규칙 인터페이스
interface ExistingRule {
  id: string;
  name: string;
  description: string | null;
  triggerType: AutomationTriggerType;
  triggerConfig: TriggerConfig;
  conditions: AutomationCondition[] | null;
  status: 'ACTIVE' | 'INACTIVE';
  priority: number;
  actions?: Array<{
    id: string;
    actionType: AutomationActionType;
    actionConfig: Record<string, unknown>;
    order: number;
    delayMinutes: number | null;
  }>;
}

interface AutomationRuleFormProps {
  ruleId?: string; // 수정 모드일 때 규칙 ID
}

/**
 * 자동화 규칙 생성/수정 폼 컴포넌트
 * Requirements: 2.1.1 - 규칙 이름, 설명, 활성화 상태 설정
 * Requirements: 2.1.2 - 트리거 유형 선택 (상태 변경, 날짜 도달, 항목 생성)
 * Requirements: 2.1.3 - 조건 설정 (예: 견적 금액 > 1억)
 * Requirements: 2.1.4 - 액션 설정 (알림 발송, 상태 변경, 담당자 배정)
 */
export default function AutomationRuleForm({ ruleId }: AutomationRuleFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditMode = !!ruleId;

  // 폼 상태
  const [formData, setFormData] = useState<AutomationRuleFormData>({
    name: '',
    description: '',
    triggerType: 'STATUS_CHANGE',
    triggerConfig: { model: 'Lead' },
    conditions: [],
    actions: [
      {
        actionType: 'SEND_NOTIFICATION',
        actionConfig: {
          recipientType: 'owner',
          title: '',
          message: '',
        },
      },
    ],
    status: 'ACTIVE',
    priority: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);

  // 수정 모드일 때 기존 규칙 데이터 로드
  useEffect(() => {
    if (isEditMode && ruleId) {
      fetchRule(ruleId);
    }
  }, [isEditMode, ruleId]);

  /**
   * 기존 규칙 데이터 조회
   */
  const fetchRule = async (id: string) => {
    try {
      setIsFetching(true);
      const accessToken = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/automation/rules/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('규칙을 불러오는데 실패했습니다');
      }

      const rule: ExistingRule = await response.json();
      
      setFormData({
        name: rule.name,
        description: rule.description || '',
        triggerType: rule.triggerType,
        triggerConfig: rule.triggerConfig || { model: 'Lead' },
        conditions: rule.conditions || [],
        actions: rule.actions?.map(a => ({
          actionType: a.actionType,
          actionConfig: a.actionConfig,
          order: a.order,
          delayMinutes: a.delayMinutes || undefined,
        })) || [],
        status: rule.status,
        priority: rule.priority,
      });
    } catch (error) {
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '규칙을 불러오는데 실패했습니다',
        variant: 'destructive',
      });
      router.push('/admin/automation');
    } finally {
      setIsFetching(false);
    }
  };

  /**
   * 폼 제출 핸들러
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!formData.name.trim()) {
      toast({
        title: '입력 오류',
        description: '규칙 이름을 입력해주세요',
        variant: 'destructive',
      });
      return;
    }

    if (formData.actions.length === 0) {
      toast({
        title: '입력 오류',
        description: '최소 하나의 액션을 설정해주세요',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const accessToken = getAccessToken();
      
      const url = isEditMode
        ? `${API_BASE_URL}/api/automation/rules/${ruleId}`
        : `${API_BASE_URL}/api/automation/rules`;
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          triggerType: formData.triggerType,
          triggerConfig: formData.triggerConfig,
          conditions: formData.conditions.length > 0 ? formData.conditions : undefined,
          actions: formData.actions,
          status: formData.status,
          priority: formData.priority,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || '저장에 실패했습니다');
      }

      toast({
        title: isEditMode ? '수정 완료' : '생성 완료',
        description: `"${formData.name}" 규칙이 ${isEditMode ? '수정' : '생성'}되었습니다`,
      });

      router.push('/admin/automation');
    } catch (error) {
      toast({
        title: '저장 실패',
        description: error instanceof Error ? error.message : '저장에 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 기본 정보 변경 핸들러
   */
  const handleBasicInfoChange = (field: keyof AutomationRuleFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * 트리거 설정 변경 핸들러
   */
  const handleTriggerChange = (triggerType: AutomationTriggerType, triggerConfig: TriggerConfig) => {
    setFormData(prev => ({ ...prev, triggerType, triggerConfig }));
  };

  /**
   * 조건 변경 핸들러
   */
  const handleConditionsChange = (conditions: AutomationCondition[]) => {
    setFormData(prev => ({ ...prev, conditions }));
  };

  /**
   * 액션 변경 핸들러
   */
  const handleActionsChange = (actions: AutomationAction[]) => {
    setFormData(prev => ({ ...prev, actions }));
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 헤더 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => router.push('/admin/automation')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="p-2 rounded-lg bg-purple-100">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle>{isEditMode ? '규칙 수정' : '새 규칙 생성'}</CardTitle>
                <CardDescription>
                  자동화 규칙의 트리거, 조건, 액션을 설정합니다
                </CardDescription>
              </div>
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  저장
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">기본 정보</CardTitle>
          <CardDescription>
            규칙의 이름, 설명, 활성화 상태를 설정합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">규칙 이름 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleBasicInfoChange('name', e.target.value)}
                placeholder="예: 리드 상태 변경 알림"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">우선순위</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) => handleBasicInfoChange('priority', parseInt(e.target.value) || 0)}
                placeholder="0"
                min={0}
              />
              <p className="text-xs text-muted-foreground">
                높은 숫자가 먼저 실행됩니다
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleBasicInfoChange('description', e.target.value)}
              placeholder="규칙에 대한 설명을 입력하세요"
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="status">활성화 상태</Label>
              <p className="text-sm text-muted-foreground">
                규칙을 활성화하면 트리거 조건 충족 시 자동으로 실행됩니다
              </p>
            </div>
            <Switch
              id="status"
              checked={formData.status === 'ACTIVE'}
              onCheckedChange={(checked) => 
                handleBasicInfoChange('status', checked ? 'ACTIVE' : 'INACTIVE')
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 트리거 설정 */}
      <AutomationTriggerConfig
        triggerType={formData.triggerType}
        triggerConfig={formData.triggerConfig}
        onChange={handleTriggerChange}
      />

      {/* 조건 설정 */}
      <AutomationConditionBuilder
        conditions={formData.conditions}
        targetModel={formData.triggerConfig.model || 'Lead'}
        onChange={handleConditionsChange}
      />

      {/* 액션 설정 */}
      <AutomationActionConfig
        actions={formData.actions}
        onChange={handleActionsChange}
      />

      {/* 하단 저장 버튼 */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/automation')}
        >
          취소
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isEditMode ? '수정' : '생성'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
