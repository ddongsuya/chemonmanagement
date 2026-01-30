'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'USER' | 'ADMIN';
}

// 개발 환경에서는 인증 건너뛰기
const isDevelopment = process.env.NODE_ENV === 'development';

// 개발용 더미 유저
const devUser = {
  id: 'dev-user',
  email: 'dev@chemon.co.kr',
  name: '개발자',
  role: 'ADMIN' as const,
  department: 'SUPPORT',
  position: 'MANAGER',
};

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user, setUser } = useAuthStore();

  useEffect(() => {
    // 개발 환경에서는 자동 로그인
    if (isDevelopment && !isAuthenticated && !isLoading) {
      setUser(devUser);
      return;
    }

    if (!isLoading && !isDevelopment) {
      if (!isAuthenticated) {
        // Store the intended destination for redirect after login
        const returnUrl = encodeURIComponent(pathname);
        router.push(`/login?returnUrl=${returnUrl}`);
        return;
      }

      // Check role if required
      if (requiredRole && user?.role !== requiredRole) {
        // User doesn't have required role - redirect to dashboard
        router.push('/dashboard');
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, router, pathname, setUser]);

  // 개발 환경에서는 바로 렌더링
  if (isDevelopment) {
    return <>{children}</>;
  }

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Don't render if role check fails
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
