'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

// 부서 옵션
const DEPARTMENT_OPTIONS = [
  { value: 'BD1', label: '사업개발 1센터' },
  { value: 'BD2', label: '사업개발 2센터' },
  { value: 'SUPPORT', label: '사업지원팀' },
] as const;

// 직급 옵션 (Position enum)
const POSITION_OPTIONS = [
  { value: 'STAFF', label: '사원' },
  { value: 'SENIOR', label: '주임' },
  { value: 'ASSISTANT', label: '대리' },
  { value: 'MANAGER', label: '과장' },
  { value: 'DEPUTY', label: '차장' },
  { value: 'GENERAL', label: '부장' },
  { value: 'DIRECTOR', label: '이사' },
  { value: 'CEO', label: '대표이사' },
  { value: 'CHAIRMAN', label: '회장' },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    department: '',
    position: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setFormError('이름을 입력해주세요');
      return false;
    }
    if (!formData.email) {
      setFormError('이메일을 입력해주세요');
      return false;
    }
    if (!formData.email.includes('@')) {
      setFormError('유효한 이메일 형식이 아닙니다');
      return false;
    }
    if (!formData.password) {
      setFormError('비밀번호를 입력해주세요');
      return false;
    }
    if (formData.password.length < 8) {
      setFormError('비밀번호는 8자 이상이어야 합니다');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError('비밀번호가 일치하지 않습니다');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    const result = await register({
      email: formData.email,
      password: formData.password,
      name: formData.name.trim(),
      phone: formData.phone.trim() || undefined,
      department: (formData.department || undefined) as 'BD1' | 'BD2' | 'SUPPORT' | undefined,
      position: (formData.position || undefined) as 'STAFF' | 'SENIOR' | 'ASSISTANT' | 'MANAGER' | 'DEPUTY' | 'GENERAL' | 'DIRECTOR' | 'CEO' | 'CHAIRMAN' | undefined,
    });
    
    setSubmitting(false);
    
    if (result.success) {
      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } else {
      setFormError(result.error || '회원가입에 실패했습니다');
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    setFormError(null);
  };

  const displayError = formError || error;

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary">CHEMON</h1>
            <p className="text-gray-500 mt-1">견적관리시스템</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">회원가입 완료!</h2>
              <p className="text-sm text-gray-500">
                회원가입이 완료되었습니다. 로그인 페이지로 이동합니다...
              </p>
              <Link href="/login">
                <Button variant="outline" className="mt-4">
                  로그인 페이지로 이동
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">CHEMON</h1>
          <p className="text-gray-500 mt-1">견적관리시스템</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">회원가입</h2>
        <p className="text-sm text-gray-500 mt-1">새 계정을 만드세요</p>
      </div>

      {displayError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">이름</Label>
        <Input
          id="name"
          type="text"
          placeholder="홍길동"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          disabled={submitting}
          autoComplete="name"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">연락처 (선택)</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="010-0000-0000"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          disabled={submitting}
          autoComplete="tel"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="department">부서</Label>
          <Select
            value={formData.department}
            onValueChange={(value) => handleInputChange('department', value)}
            disabled={submitting}
          >
            <SelectTrigger id="department">
              <SelectValue placeholder="부서 선택" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="position">직급</Label>
          <Select
            value={formData.position}
            onValueChange={(value) => handleInputChange('position', value)}
            disabled={submitting}
          >
            <SelectTrigger id="position">
              <SelectValue placeholder="직급 선택" />
            </SelectTrigger>
            <SelectContent>
              {POSITION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          type="email"
          placeholder="example@chemon.co.kr"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          disabled={submitting}
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="8자 이상 입력"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            disabled={submitting}
            autoComplete="new-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500">비밀번호는 8자 이상이어야 합니다</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">비밀번호 확인</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="비밀번호 재입력"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            disabled={submitting}
            autoComplete="new-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            가입 중...
          </>
        ) : (
          '회원가입'
        )}
      </Button>

      <p className="text-sm text-center text-gray-500">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-primary hover:underline">
          로그인
        </Link>
      </p>
    </form>
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">
          © 2025 CHEMON. All rights reserved.
        </p>
      </div>
    </div>
  );
}
