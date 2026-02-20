import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AuthUser,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  getCurrentUser,
  refreshAccessToken,
  getAccessToken,
  clearTokens,
  LoginRequest,
  RegisterRequest,
} from '@/lib/auth-api';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  unreadNotifications: number;
  error: string | null;
  
  // Actions
  login: (credentials: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
  setUnreadNotifications: (count: number) => void;
  setUser: (user: AuthUser | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      unreadNotifications: 0,
      error: null,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        
        const response = await apiLogin(credentials);
        
        if (response.success && response.data) {
          set({
            user: response.data.user,
            isAuthenticated: true,
            isLoading: false,
            unreadNotifications: response.data.unreadNotifications,
            error: null,
          });
          return { success: true };
        }
        
        const errorMessage = response.error?.message || '로그인에 실패했습니다';
        set({ isLoading: false, error: errorMessage });
        return { success: false, error: errorMessage };
      },

      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null });
        
        const response = await apiRegister(data);
        
        if (response.success) {
          set({ isLoading: false, error: null });
          return { success: true };
        }
        
        const errorMessage = response.error?.message || '회원가입에 실패했습니다';
        set({ isLoading: false, error: errorMessage });
        return { success: false, error: errorMessage };
      },

      logout: async () => {
        set({ isLoading: true });
        await apiLogout();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          unreadNotifications: 0,
          error: null,
        });
      },

      checkAuth: async () => {
        const token = getAccessToken();
        
        if (!token) {
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }

        set({ isLoading: true });
        
        const response = await getCurrentUser();
        
        if (response.success && response.data) {
          set({
            user: response.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          // Try to refresh token
          const refreshed = await get().refreshToken();
          if (!refreshed) {
            clearTokens();
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        }
      },

      refreshToken: async () => {
        const response = await refreshAccessToken();
        
        if (response.success) {
          // Re-fetch user data with new token
          const userResponse = await getCurrentUser();
          if (userResponse.success && userResponse.data) {
            set({
              user: userResponse.data.user,
              isAuthenticated: true,
            });
            return true;
          }
        }
        
        return false;
      },

      clearError: () => set({ error: null }),

      setUnreadNotifications: (count: number) => set({ unreadNotifications: count }),

      setUser: (user: AuthUser | null) => set({ 
        user, 
        isAuthenticated: !!user,
        isLoading: false,
      }),
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null;
          // localStorage 우선, sessionStorage fallback (마이그레이션)
          const value = localStorage.getItem(name) || sessionStorage.getItem(name);
          if (value && sessionStorage.getItem(name)) {
            // sessionStorage → localStorage 마이그레이션
            localStorage.setItem(name, value);
            sessionStorage.removeItem(name);
          }
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          if (typeof window === 'undefined') return;
          localStorage.setItem(name, JSON.stringify(value));
          sessionStorage.removeItem(name);
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return;
          localStorage.removeItem(name);
          sessionStorage.removeItem(name);
        },
      },
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        unreadNotifications: state.unreadNotifications,
      } as unknown as AuthState),
    }
  )
);
