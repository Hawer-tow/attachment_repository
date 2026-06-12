import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

export interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  roleName: string; // ✅ backend provides role.name directly
}

type LoginResponse = {
  data?: {
    token?: string;
    user?: {
      id: number;
      name: string;
      email: string;
      role_id: number;
      role?: string; // ✅ backend sends role.name here
    };
  };
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/login', { email, password });

          // ✅ backend wraps everything in "data"
          const { token, user } = response.data.data;

          // ✅ use role string directly from backend
          const mappedUser: User = {
            id: user.id,
            name: user.name,
            email: user.email,
            role_id: user.role_id,
            roleName: user.role ?? 'receptionist', // fallback if missing
          };

          localStorage.setItem('token', token);
          localStorage.setItem('auth_token', token);
          localStorage.setItem('user', JSON.stringify(mappedUser));

          set({ user: mappedUser, token, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
      },

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'staysync-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AuthState> | undefined;
        const token = persisted?.token ?? null;
        const user = persisted?.user ?? null;

        return {
          ...currentState,
          ...persisted,
          token,
          user,
          isAuthenticated: Boolean(token && user),
          isLoading: false,
        };
      },
    }
  )
);
