'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface UserCodeSettingProps {
  currentCode: string;
  currentSeq: number;
  onSave: (code: string) => void;
}

export default function UserCodeSetting({
  currentCode,
  currentSeq,
  onSave,
}: UserCodeSettingProps) {
  const { toast } = useToast();
  const [code, setCode] = useState(currentCode);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
    if (value.length <= 2) {
      setCode(value);
      setError('');
    }
  };

  const handleSave = () => {
    if (code.length !== 2) {
      setError('2글자 영문을 입력해주세요');
      return;
    }
    onSave(code);
    toast({
      title: '저장 완료',
      description: `견적서 코드가 "${code}"로 설정되었습니다.`,
    });
  };

  const now = new Date();
  const previewYear = now.getFullYear().toString().slice(-2);
  const previewMonth = (now.getMonth() + 1).toString().padStart(2, '0');
  const previewSeq = currentSeq.toString().padStart(4, '0');

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="userCode">견적서 코드</Label>
        <p className="text-xs text-gray-500 mt-1">
          견적번호에 사용될 2글자 영문 코드입니다. (예: DL, PK, KS)
        </p>
      </div>

      <div className="flex gap-2 items-start">
        <div>
          <Input
            id="userCode"
            type="text"
            value={code}
            onChange={handleChange}
            maxLength={2}
            placeholder="예: DL"
            className="w-24 text-center text-lg font-mono uppercase"
          />
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
        <Button onClick={handleSave}>저장</Button>
      </div>

      {/* 미리보기 */}
      {code.length === 2 && (
        <Card className="bg-gray-50">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500 mb-2">견적번호 미리보기</p>
            <p className="font-mono text-xl">
              {previewYear}-
              <span className="text-primary font-bold">{code}</span>-
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
          다음 견적번호: {previewYear}-{code || 'XX'}-{previewMonth}-{previewSeq}
        </p>
      </div>
    </div>
  );
}
