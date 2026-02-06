'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, Plus, Trash2, AlertCircle } from 'lucide-react';
import type { AutomationCondition } from './AutomationRuleForm';

// 연산자 옵션
const OPERATORS = [
  { value: 'eq', label: '같음 (=)', description: '값이 정확히 일치' },
  { value: 'ne', label: '같지 않음 (≠)', description: '값이 일치하지 않음' },
  { value: 'gt', label: '초과 (>)', description: '값보다 큼' },
  { value: 'gte', label: '이상 (≥)', description: '값보다 크거나 같음' },
  { value: 'lt', label: '미만 (<)', description: '값보다 작음' },
  { value: 'lte', label: '이하 (≤)', description: '값보다 작거나 같음' },
  { value: 'contains', label: '포함', description: '텍스트에 값이 포함됨' },
  { value: 'in', label: '목록에 포함', description: '값이 목록에 포함됨' },
];

// 모델별 필드 옵션
const MODEL_FIELDS: Record<string, Array<{ value: string; label: string; type: 'string' | 'number' | 'boolean' | 'date' }>> = {
  Lead: [
    { value: 'status', label: '상태', type: 'string' },
    { value: 'source', label: '유입 경로', type: 'string' },
    { value: 'priority', label: '우선순위', type: 'string' },
    { value: 'estimatedValue', label: '예상 금액', type: 'number' },
    { value: 'probability', label: '성공 확률', type: 'number' },
    { value: 'companyName', label: '회사명', type: 'string' },
    { value: 'contactName', label: '담당자명', type: 'string' },
  ],
  Quotation: [
    { value: 'status', label: '상태', type: 'string' },
    { value: 'totalAmount', label: '총 금액', type: 'number' },
    { value: 'discountRate', label: '할인율', type: 'number' },
    { value: 'quotationType', label: '견적 유형', type: 'string' },
  ],
  Contract: [
    { value: 'status', label: '상태', type: 'string' },
    { value: 'totalAmount', label: '계약 금액', type: 'number' },
    { value: 'contractType', label: '계약 유형', type: 'string' },
  ],
  Study: [
    { value: 'status', label: '상태', type: 'string' },
    { value: 'studyType', label: '시험 유형', type: 'string' },
    { value: 'priority', label: '우선순위', type: 'string' },
  ],
  Customer: [
    { value: 'type', label: '고객 유형', type: 'string' },
    { value: 'status', label: '상태', type: 'string' },
    { value: 'companyName', label: '회사명', type: 'string' },
  ],
};

// 상태 값 옵션 (필드별)
const STATUS_VALUES: Record<string, Array<{ value: string; label: string }>> = {
  'Lead.status': [
    { value: 'NEW', label: '신규' },
    { value: 'CONTACTED', label: '연락됨' },
    { value: 'QUALIFIED', label: '검증됨' },
    { value: 'PROPOSAL', label: '제안' },
    { value: 'NEGOTIATION', label: '협상' },
    { value: 'WON', label: '성공' },
    { value: 'LOST', label: '실패' },
  ],
  'Quotation.status': [
    { value: 'DRAFT', label: '초안' },
    { value: 'SENT', label: '발송됨' },
    { value: 'ACCEPTED', label: '수락됨' },
    { value: 'REJECTED', label: '거절됨' },
    { value: 'EXPIRED', label: '만료됨' },
  ],
  'Contract.status': [
    { value: 'DRAFT', label: '초안' },
    { value: 'PENDING', label: '대기중' },
    { value: 'ACTIVE', label: '진행중' },
    { value: 'COMPLETED', label: '완료' },
    { value: 'CANCELLED', label: '취소됨' },
  ],
  'Study.status': [
    { value: 'PLANNED', label: '계획됨' },
    { value: 'IN_PROGRESS', label: '진행중' },
    { value: 'COMPLETED', label: '완료' },
    { value: 'CANCELLED', label: '취소됨' },
  ],
  'Lead.priority': [
    { value: 'LOW', label: '낮음' },
    { value: 'MEDIUM', label: '보통' },
    { value: 'HIGH', label: '높음' },
    { value: 'URGENT', label: '긴급' },
  ],
  'Lead.source': [
    { value: 'WEBSITE', label: '웹사이트' },
    { value: 'REFERRAL', label: '소개' },
    { value: 'COLD_CALL', label: '콜드콜' },
    { value: 'EXHIBITION', label: '전시회' },
    { value: 'OTHER', label: '기타' },
  ],
};

interface AutomationConditionBuilderProps {
  conditions: AutomationCondition[];
  targetModel: string;
  onChange: (conditions: AutomationCondition[]) => void;
}

/**
 * 자동화 조건 빌더 컴포넌트
 * Requirements: 2.1.3 - 조건 설정 (예: 견적 금액 > 1억)
 */
export default function AutomationConditionBuilder({
  conditions,
  targetModel,
  onChange,
}: AutomationConditionBuilderProps) {
  const fields = MODEL_FIELDS[targetModel] || [];

  /**
   * 조건 추가
   */
  const handleAddCondition = () => {
    const defaultField = fields[0]?.value || 'status';
    onChange([
      ...conditions,
      {
        field: defaultField,
        operator: 'eq',
        value: '',
      },
    ]);
  };

  /**
   * 조건 삭제
   */
  const handleRemoveCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  /**
   * 조건 변경
   */
  const handleConditionChange = (
    index: number,
    field: keyof AutomationCondition,
    value: string | number | boolean
  ) => {
    const newConditions = [...conditions];
    newConditions[index] = {
      ...newConditions[index],
      [field]: value,
    };
    
    // 필드 변경 시 값 초기화
    if (field === 'field') {
      newConditions[index].value = '';
    }
    
    onChange(newConditions);
  };

  /**
   * 필드 타입 가져오기
   */
  const getFieldType = (fieldName: string): 'string' | 'number' | 'boolean' | 'date' => {
    const field = fields.find(f => f.value === fieldName);
    return field?.type || 'string';
  };

  /**
   * 값 옵션 가져오기 (상태 필드 등)
   */
  const getValueOptions = (fieldName: string): Array<{ value: string; label: string }> | null => {
    const key = `${targetModel}.${fieldName}`;
    return STATUS_VALUES[key] || null;
  };

  /**
   * 연산자 필터링 (필드 타입에 따라)
   */
  const getAvailableOperators = (fieldName: string) => {
    const fieldType = getFieldType(fieldName);
    
    if (fieldType === 'number') {
      return OPERATORS;
    }
    
    if (fieldType === 'string') {
      return OPERATORS.filter(op => ['eq', 'ne', 'contains', 'in'].includes(op.value));
    }
    
    return OPERATORS.filter(op => ['eq', 'ne'].includes(op.value));
  };

  /**
   * 값 입력 렌더링
   */
  const renderValueInput = (condition: AutomationCondition, index: number) => {
    const valueOptions = getValueOptions(condition.field);
    const fieldType = getFieldType(condition.field);

    // 선택 옵션이 있는 경우
    if (valueOptions) {
      return (
        <Select
          value={String(condition.value)}
          onValueChange={(value) => handleConditionChange(index, 'value', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="값 선택" />
          </SelectTrigger>
          <SelectContent>
            {valueOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // 숫자 필드
    if (fieldType === 'number') {
      return (
        <Input
          type="number"
          value={condition.value as number}
          onChange={(e) => handleConditionChange(index, 'value', parseFloat(e.target.value) || 0)}
          placeholder="숫자 입력"
        />
      );
    }

    // 기본 텍스트 입력
    return (
      <Input
        type="text"
        value={String(condition.value)}
        onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
        placeholder="값 입력"
      />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Filter className="h-5 w-5" />
          조건 설정
        </CardTitle>
        <CardDescription>
          트리거 발동 시 추가로 확인할 조건을 설정합니다 (선택사항)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {conditions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed rounded-lg">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-4">
              조건이 설정되지 않았습니다.
              <br />
              조건 없이 트리거 발동 시 항상 실행됩니다.
            </p>
            <Button type="button" variant="outline" onClick={handleAddCondition}>
              <Plus className="h-4 w-4 mr-2" />
              조건 추가
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {conditions.map((condition, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30"
                >
                  <div className="flex-1 grid gap-3 md:grid-cols-3">
                    {/* 필드 선택 */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">필드</Label>
                      <Select
                        value={condition.field}
                        onValueChange={(value) => handleConditionChange(index, 'field', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="필드 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {fields.map((field) => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 연산자 선택 */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">연산자</Label>
                      <Select
                        value={condition.operator}
                        onValueChange={(value) => handleConditionChange(index, 'operator', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="연산자 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableOperators(condition.field).map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 값 입력 */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">값</Label>
                      {renderValueInput(condition, index)}
                    </div>
                  </div>

                  {/* 삭제 버튼 */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveCondition(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* 조건 추가 버튼 */}
            <Button type="button" variant="outline" onClick={handleAddCondition}>
              <Plus className="h-4 w-4 mr-2" />
              조건 추가
            </Button>

            {/* 조건 설명 */}
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                <strong>참고:</strong> 여러 조건이 설정된 경우 모든 조건이 충족되어야 (AND) 규칙이 실행됩니다.
              </p>
            </div>
          </>
        )}

        {/* 예시 */}
        <div className="rounded-lg border border-dashed p-4">
          <p className="text-sm font-medium mb-2">조건 예시</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• 견적 금액 &gt; 100,000,000 (1억 이상)</li>
            <li>• 리드 상태 = WON (성공)</li>
            <li>• 우선순위 = HIGH 또는 URGENT</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
