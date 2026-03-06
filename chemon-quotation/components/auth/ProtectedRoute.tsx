'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'USER' | 'ADMIN';
}

/** 로딩 타임아웃 (ms) — 이 시간 이후에도 isLoading이면 강제로 로그인 페이지로 */
const AUTH_LOADING_TIMEOUT = 8000;

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const [timedOut, setTimedOut] = useState(false);

  // 로딩이 너무 오래 걸리면 타임아웃 처리
  useEffect(() => {
    if (!isLoading) {
      setTimedOut(false);
      return;
    }

    const timer = setTimeout(() => {
      setTimedOut(true);
    }, AUTH_LOADING_TIMEOUT);

    return () => clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    // 타임아웃 시 로그인 페이지로 이동
    if (timedOut && isLoading) {
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/login?returnUrl=${returnUrl}`);
      return;
    }

    if (!isLoading) {
      if (!isAuthenticated) {
        const returnUrl = encodeURIComponent(pathname);
        router.push(`/login?returnUrl=${returnUrl}`);
        return;
      }

      if (requiredRole && user?.role !== requiredRole) {
        router.push('/dashboard');
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, router, pathname, timedOut]);

  if (isLoading && !timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}

// Higher-order component version for easier use
export function withProtectedRoute<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredRole?: 'USER' | 'ADMIN'
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute requiredRole={requiredRole}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
}
