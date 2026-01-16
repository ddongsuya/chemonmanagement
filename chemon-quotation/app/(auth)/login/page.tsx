'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const redirectTo = returnUrl ? decodeURIComponent(returnUrl) : '/dashboard';
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, returnUrl]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const validateForm = (): boolean => {
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
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    const result = await login({
      email: formData.email,
      password: formData.password,
    });
    
    setSubmitting(false);
    
    if (result.success) {
      const redirectTo = returnUrl ? decodeURIComponent(returnUrl) : '/dashboard';
      router.push(redirectTo);
    } else {
      setFormError(result.error || '로그인에 실패했습니다');
    }
  };

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    setFormData({ ...formData, [field]: value });
    setFormError(null);
  };

  const displayError = formError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">로그인</h2>
        <p className="text-sm text-gray-500 mt-1">계정에 로그인하세요</p>
      </div>

      {displayError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

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
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            disabled={submitting}
            autoComplete="current-password"
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
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            로그인 중...
          </>
        ) : (
          '로그인'
        )}
      </Button>

      <p className="text-sm text-center text-gray-500">
        계정이 없으신가요?{' '}
        <Link href="/register" className="text-primary hover:underline">
          회원가입
        </Link>
      </p>
    </form>
  );
}
