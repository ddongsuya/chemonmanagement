'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Loader2 } from 'lucide-react';
import { getAccessToken } from '@/lib/auth-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface UserCodeSettingProps {
  currentCode: string;
  currentSeq: number;
  onSave: (code: string) => void;
  isLoading?: boolean;
}

interface ValidationResult {
  isValid: boolean;
  isDuplicate: boolean;
  normalizedCode: string;
  error?: string;
}

interface UserCodeSettingState {
  inputCode: string;
  isChecking: boolean;
  isDuplicate: boolean;
  errorMessage?: string;
  isAvailable: boolean;
}

/**
 * 견적서 코드 검증 API 호출
 * POST /api/user-code/validate
 */
async function validateUserCode(userCode: string): Promise<ValidationResult> {
  const accessToken = getAccessToken();
  
  const response = await fetch(`${API_BASE_URL}/api/user-code/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ userCode }),
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error?.message || '검증에 실패했습니다');
  }
  
  return data.data;
}

export default function UserCodeSetting({
  currentCode,
  currentSeq,
  onSave,
  isLoading: externalLoading = false,
}: UserCodeSettingProps) {
  const { toast } = useToast();
  
  // State management following the design interface
  const [state, setState] = useState<UserCodeSettingState>({
    inputCode: currentCode,
    isChecking: false,
    isDuplicate: false,
    errorMessage: undefined,
    isAvailable: false,
  });
  
  // Ref for debounce timeout
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 실시간 중복 검사 함수
   * Requirements 4.4: 사용자가 User_Code 입력 필드에 값을 입력하면 실시간으로 중복 여부를 확인
   */
  const checkDuplicate = useCallback(async (code: string) => {
    // 2글자가 아니면 검사하지 않음
    if (code.length !== 2) {
      setState(prev => ({
        ...prev,
        isChecking: false,
        isDuplicate: false,
        isAvailable: false,
        errorMessage: code.length > 0 ? '2글자 영문을 입력해주세요' : undefined,
      }));
      return;
    }

    setState(prev => ({ ...prev, isChecking: true, errorMessage: undefined }));

    try {
      const result = await validateUserCode(code);
      
      setState(prev => ({
        ...prev,
        isChecking: false,
        isDuplicate: result.isDuplicate,
        isAvailable: result.isValid,
        errorMessage: result.error,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isChecking: false,
        isDuplicate: false,
        isAvailable: false,
        errorMessage: error instanceof Error ? error.message : '검증 중 오류가 발생했습니다',
      }));
    }
  }, []);

  /**
   * 입력값 변경 핸들러 with debounce
   * 실시간 중복 검사를 위해 300ms 디바운스 적용
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
    if (value.length <= 2) {
      setState(prev => ({
        ...prev,
        inputCode: value,
        isDuplicate: false,
        isAvailable: false,
        errorMessage: undefined,
      }));

      // 기존 타이머 취소
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // 새 타이머 설정 (300ms 디바운스)
      debounceTimeoutRef.current = setTimeout(() => {
        checkDuplicate(value);
      }, 300);
    }
  };

  /**
   * 저장 핸들러
   */
  const handleSave = async () => {
    if (state.inputCode.length !== 2) {
      setState(prev => ({
        ...prev,
        errorMessage: '2글자 영문을 입력해주세요',
      }));
      return;
    }

    if (state.isDuplicate) {
      setState(prev => ({
        ...prev,
        errorMessage: '이미 사용 중인 견적서 코드입니다',
      }));
      return;
    }

    // 저장 전 최종 검증
    if (!state.isAvailable && state.inputCode !== currentCode) {
      await checkDuplicate(state.inputCode);
      return;
    }

    onSave(state.inputCode);
    toast({
      title: '저장 완료',
      description: `견적서 코드가 "${state.inputCode}"로 설정되었습니다.`,
    });
  };

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Update state when currentCode prop changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      inputCode: currentCode,
      isDuplicate: false,
      isAvailable: false,
      errorMessage: undefined,
    }));
  }, [currentCode]);

  const now = new Date();
  const previewYear = now.getFullYear().toString().slice(-2);
  const previewMonth = (now.getMonth() + 1).toString().padStart(2, '0');
  const previewSeq = currentSeq.toString().padStart(4, '0');

  // 피드백 아이콘 및 메시지 렌더링
  const renderFeedback = () => {
    if (state.inputCode.length !== 2) {
      return null;
    }

    if (state.isChecking) {
      return (
        <div className="flex items-center gap-1 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">확인 중...</span>
        </div>
      );
    }

    if (state.isDuplicate) {
      return (
        <div className="flex items-center gap-1 text-red-500">
          <X className="h-4 w-4" />
          <span className="text-sm">이미 사용 중인 코드입니다</span>
        </div>
      );
    }

    if (state.isAvailable) {
      if (state.inputCode === currentCode) {
        return (
          <div className="flex items-center gap-1 text-blue-500">
            <Check className="h-4 w-4" />
            <span className="text-sm">현재 사용 중인 코드</span>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-1 text-green-500">
          <Check className="h-4 w-4" />
          <span className="text-sm">사용 가능</span>
        </div>
      );
    }

    return null;
  };

  const isButtonDisabled = 
    externalLoading || 
    state.isChecking || 
    state.isDuplicate || 
    state.inputCode.length !== 2 ||
    (!state.isAvailable && state.inputCode !== currentCode);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="userCode">견적서 코드</Label>
        <p className="text-xs text-gray-500 mt-1">
          견적번호에 사용될 2글자 영문 코드입니다. (예: DL, PK, KS)
        </p>
      </div>

      <div className="flex gap-2 items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              id="userCode"
              type="text"
              value={state.inputCode}
              onChange={handleChange}
              maxLength={2}
              placeholder="예: DL"
              className={`w-24 text-center text-lg font-mono uppercase ${
                state.isDuplicate 
                  ? 'border-red-500 focus-visible:ring-red-500' 
                  : state.isAvailable 
                    ? 'border-green-500 focus-visible:ring-green-500' 
                    : ''
              }`}
              disabled={externalLoading}
            />
            {renderFeedback()}
          </div>
          {state.errorMessage && (
            <p className="text-sm text-red-500">{state.errorMessage}</p>
          )}
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isButtonDisabled}
        >
          {externalLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              저장 중...
            </>
          ) : (
            '저장'
          )}
        </Button>
      </div>

      {state.inputCode.length === 2 && (
        <Card className="bg-gray-50">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500 mb-2">견적번호 미리보기</p>
            <p className="font-mono text-xl">
              {previewYear}-
              <span className="text-primary font-bold">{state.inputCode}</span>-
              {previewMonth}-{previewSeq}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              연도-사용자코드-월-일련번호
            </p>
          </CardContent>
        </Card>
      )}

      <div className="text-sm text-gray-500 pt-2 border-t">
        <p>
          발행한 견적서:{' '}
          <span className="font-medium">{currentSeq - 1}건</span>
        </p>
        <p className="text-xs mt-1">
          다음 견적번호: {previewYear}-{state.inputCode || 'XX'}-{previewMonth}-{previewSeq}
        </p>
      </div>
    </div>
  );
}
