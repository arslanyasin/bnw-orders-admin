import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { AuthState, User, LoginCredentials } from '@/types';
import { authService } from '@/services/authService';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true });
          const response = await authService.login(credentials);
            console.log('login',response)
          const { user, accessToken, refreshToken } = response.data;
            console.log('user',user)

          // Store access token in cookie (15 minutes expiry - matching JWT)
          Cookies.set('admin_token', accessToken, {
            expires: 1/96, // 15 minutes (1 day / 96 = 15 minutes)
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
          });

          // Store refresh token in cookie (7 days expiry)
          Cookies.set('admin_refresh_token', refreshToken, {
            expires: 7,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
          });
            console.log('Cookies',Cookies)

          set({
            user,
            token: accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        Cookies.remove('admin_token');
        Cookies.remove('admin_refresh_token');
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      setToken: (token: string | null) => {
        if (token) {
          Cookies.set('admin_token', token, {
            expires: 1/96, // 15 minutes
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
          });
        } else {
          Cookies.remove('admin_token');
        }
        set({ token });
      },

      setRefreshToken: (refreshToken: string | null) => {
        if (refreshToken) {
          Cookies.set('admin_refresh_token', refreshToken, {
            expires: 7,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
          });
        } else {
          Cookies.remove('admin_refresh_token');
        }
        set({ refreshToken });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token, // Persist access token to localStorage as backup
        refreshToken: state.refreshToken, // Persist refresh token to localStorage as backup
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
