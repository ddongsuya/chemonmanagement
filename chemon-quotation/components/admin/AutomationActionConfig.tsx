'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Play, Plus, Trash2, Bell, RefreshCw, FileText, GripVertical } from 'lucide-react';
import type { AutomationAction, AutomationActionType } from './AutomationRuleForm';

// 액션 타입 정보
const ACTION_TYPES: Array<{
  value: AutomationActionType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}> = [
  {
    value: 'SEND_NOTIFICATION',
    label: '알림 발송',
    description: '사용자에게 인앱 알림을 발송합니다',
    icon: <Bell className="h-4 w-4" />,
    color: 'border-blue-300 text-blue-600 bg-blue-50',
  },
  {
    value: 'UPDATE_STATUS',
    label: '상태 변경',
    description: '대상 항목의 상태를 자동으로 변경합니다',
    icon: <RefreshCw className="h-4 w-4" />,
    color: 'border-orange-300 text-orange-600 bg-orange-50',
  },
  {
    value: 'CREATE_ACTIVITY',
    label: '활동 생성',
    description: '활동 기록을 자동으로 생성합니다',
    icon: <FileText className="h-4 w-4" />,
    color: 'border-green-300 text-green-600 bg-green-50',
  },
];

// 알림 수신자 타입
const RECIPIENT_TYPES = [
  { value: 'owner', label: '담당자', description: '항목의 담당자에게 발송' },
  { value: 'role', label: '역할별', description: '특정 역할의 모든 사용자에게 발송' },
  { value: 'specific', label: '특정 사용자', description: '지정된 사용자에게 발송' },
];

// 역할 옵션
const ROLE_OPTIONS = [
  { value: 'ADMIN', label: '관리자' },
  { value: 'MANAGER', label: '매니저' },
  { value: 'SALES', label: '영업' },
  { value: 'USER', label: '일반 사용자' },
];

// 상태 변경 대상 필드
const STATUS_FIELDS = [
  { value: 'status', label: '상태' },
  { value: 'priority', label: '우선순위' },
];

// 상태 값 옵션
const STATUS_VALUES: Record<string, Array<{ value: string; label: string }>> = {
  status: [
    { value: 'NEW', label: '신규' },
    { value: 'CONTACTED', label: '연락됨' },
    { value: 'QUALIFIED', label: '검증됨' },
    { value: 'PROPOSAL', label: '제안' },
    { value: 'NEGOTIATION', label: '협상' },
    { value: 'WON', label: '성공' },
    { value: 'LOST', label: '실패' },
    { value: 'EXPIRED', label: '만료됨' },
    { value: 'ACTIVE', label: '활성' },
    { value: 'COMPLETED', label: '완료' },
    { value: 'CANCELLED', label: '취소됨' },
  ],
  priority: [
    { value: 'LOW', label: '낮음' },
    { value: 'MEDIUM', label: '보통' },
    { value: 'HIGH', label: '높음' },
    { value: 'URGENT', label: '긴급' },
  ],
};

interface AutomationActionConfigProps {
  actions: AutomationAction[];
  onChange: (actions: AutomationAction[]) => void;
}

/**
 * 자동화 액션 설정 컴포넌트
 * Requirements: 2.1.4 - 액션 설정 (알림 발송, 상태 변경, 담당자 배정)
 */
export default function AutomationActionConfig({
  actions,
  onChange,
}: AutomationActionConfigProps) {
  /**
   * 액션 추가
   */
  const handleAddAction = () => {
    onChange([
      ...actions,
      {
        actionType: 'SEND_NOTIFICATION',
        actionConfig: {
          recipientType: 'owner',
          title: '',
          message: '',
        },
        order: actions.length,
      },
    ]);
  };

  /**
   * 액션 삭제
   */
  const handleRemoveAction = (index: number) => {
    if (actions.length <= 1) {
      return; // 최소 1개 액션 필요
    }
    const newActions = actions.filter((_, i) => i !== index);
    // 순서 재정렬
    onChange(newActions.map((action, i) => ({ ...action, order: i })));
  };

  /**
   * 액션 타입 변경
   */
  const handleActionTypeChange = (index: number, actionType: AutomationActionType) => {
    const newActions = [...actions];
    
    // 액션 타입에 따른 기본 설정
    let defaultConfig: Record<string, unknown> = {};
    switch (actionType) {
      case 'SEND_NOTIFICATION':
        defaultConfig = {
          recipientType: 'owner',
          title: '',
          message: '',
        };
        break;
      case 'UPDATE_STATUS':
        defaultConfig = {
          field: 'status',
          value: '',
        };
        break;
      case 'CREATE_ACTIVITY':
        defaultConfig = {
          subject: '',
          content: '',
        };
        break;
    }
    
    newActions[index] = {
      ...newActions[index],
      actionType,
      actionConfig: defaultConfig,
    };
    
    onChange(newActions);
  };

  /**
   * 액션 설정 변경
   */
  const handleConfigChange = (
    index: number,
    field: string,
    value: string | number | string[]
  ) => {
    const newActions = [...actions];
    newActions[index] = {
      ...newActions[index],
      actionConfig: {
        ...newActions[index].actionConfig,
        [field]: value,
      },
    };
    onChange(newActions);
  };

  /**
   * 지연 시간 변경
   */
  const handleDelayChange = (index: number, delayMinutes: number | undefined) => {
    const newActions = [...actions];
    newActions[index] = {
      ...newActions[index],
      delayMinutes,
    };
    onChange(newActions);
  };

  /**
   * 액션 타입 정보 가져오기
   */
  const getActionTypeInfo = (actionType: AutomationActionType) => {
    return ACTION_TYPES.find(t => t.value === actionType);
  };

  /**
   * 알림 발송 설정 렌더링
   */
  const renderNotificationConfig = (action: AutomationAction, index: number) => {
    const config = action.actionConfig;
    
    return (
      <div className="space-y-4">
        {/* 수신자 타입 */}
        <div className="space-y-2">
          <Label>수신자 유형 *</Label>
          <Select
            value={config.recipientType as string || 'owner'}
            onValueChange={(value) => handleConfigChange(index, 'recipientType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="수신자 유형 선택" />
            </SelectTrigger>
            <SelectContent>
              {RECIPIENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex flex-col">
                    <span>{type.label}</span>
                    <span className="text-xs text-muted-foreground">{type.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 역할 선택 (역할별 수신자인 경우) */}
        {config.recipientType === 'role' && (
          <div className="space-y-2">
            <Label>대상 역할 *</Label>
            <Select
              value={config.recipientRole as string || ''}
              onValueChange={(value) => handleConfigChange(index, 'recipientRole', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="역할 선택" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 알림 제목 */}
        <div className="space-y-2">
          <Label>알림 제목 *</Label>
          <Input
            value={config.title as string || ''}
            onChange={(e) => handleConfigChange(index, 'title', e.target.value)}
            placeholder="예: 리드 상태 변경"
          />
        </div>

        {/* 알림 메시지 */}
        <div className="space-y-2">
          <Label>알림 메시지 *</Label>
          <Textarea
            value={config.message as string || ''}
            onChange={(e) => handleConfigChange(index, 'message', e.target.value)}
            placeholder="예: {{leadName}} 리드의 상태가 {{newStatus}}(으)로 변경되었습니다."
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            템플릿 변수 사용 가능: {'{{leadName}}'}, {'{{newStatus}}'}, {'{{oldStatus}}'} 등
          </p>
        </div>

        {/* 링크 (선택) */}
        <div className="space-y-2">
          <Label>링크 (선택)</Label>
          <Input
            value={config.link as string || ''}
            onChange={(e) => handleConfigChange(index, 'link', e.target.value)}
            placeholder="예: /leads/{{id}}"
          />
          <p className="text-xs text-muted-foreground">
            알림 클릭 시 이동할 경로
          </p>
        </div>
      </div>
    );
  };

  /**
   * 상태 변경 설정 렌더링
   */
  const renderUpdateStatusConfig = (action: AutomationAction, index: number) => {
    const config = action.actionConfig;
    const selectedField = config.field as string || 'status';
    
    return (
      <div className="space-y-4">
        {/* 변경할 필드 */}
        <div className="space-y-2">
          <Label>변경할 필드 *</Label>
          <Select
            value={selectedField}
            onValueChange={(value) => {
              handleConfigChange(index, 'field', value);
              handleConfigChange(index, 'value', ''); // 값 초기화
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="필드 선택" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FIELDS.map((field) => (
                <SelectItem key={field.value} value={field.value}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 변경할 값 */}
        <div className="space-y-2">
          <Label>변경할 값 *</Label>
          <Select
            value={config.value as string || ''}
            onValueChange={(value) => handleConfigChange(index, 'value', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="값 선택" />
            </SelectTrigger>
            <SelectContent>
              {(STATUS_VALUES[selectedField] || []).map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  /**
   * 활동 생성 설정 렌더링
   */
  const renderCreateActivityConfig = (action: AutomationAction, index: number) => {
    const config = action.actionConfig;
    
    return (
      <div className="space-y-4">
        {/* 활동 제목 */}
        <div className="space-y-2">
          <Label>활동 제목 *</Label>
          <Input
            value={config.subject as string || ''}
            onChange={(e) => handleConfigChange(index, 'subject', e.target.value)}
            placeholder="예: 자동 생성된 활동"
          />
          <p className="text-xs text-muted-foreground">
            템플릿 변수 사용 가능: {'{{leadName}}'}, {'{{status}}'} 등
          </p>
        </div>

        {/* 활동 내용 */}
        <div className="space-y-2">
          <Label>활동 내용 (선택)</Label>
          <Textarea
            value={config.content as string || ''}
            onChange={(e) => handleConfigChange(index, 'content', e.target.value)}
            placeholder="활동에 대한 상세 내용을 입력하세요"
            rows={3}
          />
        </div>
      </div>
    );
  };

  /**
   * 액션 설정 렌더링
   */
  const renderActionConfig = (action: AutomationAction, index: number) => {
    switch (action.actionType) {
      case 'SEND_NOTIFICATION':
        return renderNotificationConfig(action, index);
      case 'UPDATE_STATUS':
        return renderUpdateStatusConfig(action, index);
      case 'CREATE_ACTIVITY':
        return renderCreateActivityConfig(action, index);
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Play className="h-5 w-5" />
          액션 설정
        </CardTitle>
        <CardDescription>
          트리거 발동 시 실행할 액션을 설정합니다 (최소 1개 필요)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion type="multiple" defaultValue={actions.map((_, i) => `action-${i}`)} className="space-y-4">
          {actions.map((action, index) => {
            const actionInfo = getActionTypeInfo(action.actionType);
            
            return (
              <AccordionItem
                key={index}
                value={`action-${index}`}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 flex-1">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className={actionInfo?.color}>
                      {actionInfo?.icon}
                      <span className="ml-1">{actionInfo?.label}</span>
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      액션 {index + 1}
                    </span>
                    {action.delayMinutes && action.delayMinutes > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {action.delayMinutes}분 후 실행
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6">
                  <div className="space-y-6">
                    {/* 액션 타입 선택 */}
                    <div className="space-y-3">
                      <Label>액션 유형 *</Label>
                      <div className="grid gap-3 md:grid-cols-3">
                        {ACTION_TYPES.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => handleActionTypeChange(index, type.value)}
                            className={`flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all hover:border-primary ${
                              action.actionType === type.value
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'border-border'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={type.color}>
                                {type.icon}
                              </Badge>
                              <span className="font-medium text-sm">{type.label}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {type.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 액션별 설정 */}
                    {renderActionConfig(action, index)}

                    {/* 지연 실행 설정 */}
                    <div className="space-y-2 pt-4 border-t">
                      <Label>지연 실행 (선택)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={action.delayMinutes || ''}
                          onChange={(e) => handleDelayChange(index, parseInt(e.target.value) || undefined)}
                          placeholder="0"
                          min={0}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">분 후 실행</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        0 또는 비워두면 즉시 실행됩니다
                      </p>
                    </div>

                    {/* 삭제 버튼 */}
                    {actions.length > 1 && (
                      <div className="pt-4 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemoveAction(index)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          이 액션 삭제
                        </Button>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* 액션 추가 버튼 */}
        <Button type="button" variant="outline" onClick={handleAddAction}>
          <Plus className="h-4 w-4 mr-2" />
          액션 추가
        </Button>

        {/* 안내 */}
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            <strong>참고:</strong> 여러 액션이 설정된 경우 순서대로 실행됩니다.
            지연 시간을 설정하면 해당 시간 후에 액션이 실행됩니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
