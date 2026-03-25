'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Eye, EyeOff, BarChart3 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'error' | 'waking'>('checking');

  // API 서버 연결 상태 확인
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    let cancelled = false;
    let retryCount = 0;
    const maxRetries = 3;

    const checkHealth = async () => {
      while (retryCount < maxRetries && !cancelled) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);
          const res = await fetch(`${apiUrl}/health`, { method: 'GET', signal: controller.signal });
          clearTimeout(timeoutId);
          if (!cancelled) setApiStatus(res.ok ? 'ok' : 'error');
          return;
        } catch {
          retryCount++;
          if (!cancelled) setApiStatus(retryCount < maxRetries ? 'waking' : 'error');
          if (retryCount < maxRetries && !cancelled) await new Promise(r => setTimeout(r, 5000));
        }
      }
    };
    checkHealth();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = returnUrl ? decodeURIComponent(returnUrl) : '/dashboard';
      router.push(redirectTo);
    }
  }, [isAuthenticated, router, returnUrl]);

  useEffect(() => { clearError(); }, [clearError]);

  const validateForm = (): boolean => {
    if (!formData.email) { setFormError('이메일을 입력해주세요'); return false; }
    if (!formData.email.includes('@')) { setFormError('유효한 이메일 형식이 아닙니다'); return false; }
    if (!formData.password) { setFormError('비밀번호를 입력해주세요'); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validateForm()) return;
    setSubmitting(true);
    const result = await login({ email: formData.email, password: formData.password });
    setSubmitting(false);
    if (result.success) {
      const redirectParam = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : '';
      router.push(`/welcome${redirectParam}`);
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
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* 좌측 비주얼 패널 */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-orange-600 to-orange-500 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-xl">
              <BarChart3 className="w-7 h-7 text-orange-600" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white">Chemon</h1>
          </div>
          <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
            Welcome to<br />Chemon Management
          </h2>
          <p className="text-white/80 text-lg max-w-md mx-auto font-light leading-relaxed">
            비임상 CRO 영업관리 및 견적 시스템으로<br />효율적인 업무 환경을 경험하세요.
          </p>
        </div>
      </div>

      {/* 우측 폼 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          {/* 모바일 로고 */}
          <div className="flex md:hidden items-center gap-2 mb-12 justify-center">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black tracking-tighter">Chemon</h1>
          </div>

          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-2">로그인</h2>
            <p className="text-muted-foreground text-sm">계정에 로그인하여 시작하세요.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {displayError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{displayError}</AlertDescription>
              </Alert>
            )}

            {apiStatus === 'waking' && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  서버가 시작 중입니다. 잠시만 기다려주세요... (최대 1분)
                </AlertDescription>
              </Alert>
            )}

            {apiStatus === 'checking' && (
              <Alert className="border-blue-200 bg-blue-50">
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                <AlertDescription className="text-blue-700">
                  서버 연결 확인 중...
                </AlertDescription>
              </Alert>
            )}

            {apiStatus === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.
                </AlertDescription>
              </Alert>
            )}

            {/* 이메일 */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                이메일
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="example@chemon.co.kr"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={submitting}
                autoComplete="email"
                autoFocus
                className="h-12 rounded-xl bg-slate-50 border-slate-200/60 focus:bg-white transition-colors"
              />
            </div>

            {/* 비밀번호 */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                비밀번호
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  disabled={submitting}
                  autoComplete="current-password"
                  className="h-12 rounded-xl bg-slate-50 border-slate-200/60 focus:bg-white transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* 로그인 버튼 */}
            <Button
              type="submit"
              className="w-full h-12 rounded-full text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
              disabled={submitting || apiStatus === 'checking' || apiStatus === 'waking'}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />로그인 중...</>
              ) : apiStatus === 'checking' || apiStatus === 'waking' ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />서버 연결 대기 중...</>
              ) : (
                '로그인'
              )}
            </Button>

            <p className="text-sm text-center text-muted-foreground pt-4">
              계정이 없으신가요?{' '}
              <Link href="/register" className="text-primary font-semibold hover:underline underline-offset-4">
                회원가입
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
