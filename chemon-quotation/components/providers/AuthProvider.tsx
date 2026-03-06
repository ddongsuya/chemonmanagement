'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check authentication status on mount
    checkAuth();
  }, [checkAuth]);

  // Prevent hydration mismatch — show minimal loading until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-muted border-t-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
