import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

// ============================================================
// AUTH STORE
// ============================================================
interface AuthState {
  user: any | null;
  tenant: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  loadProfile: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const data = await api.auth.login({ email, password }) as any;
          set({ user: data.user, tenant: data.tenant, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (formData) => {
        set({ isLoading: true });
        try {
          const data = await api.auth.register(formData) as any;
          set({ user: data.user, tenant: data.tenant, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      loadProfile: async () => {
        try {
          const data = await api.auth.getProfile() as any;
          set({ user: data.user, tenant: data.tenant, isAuthenticated: true });
        } catch {
          set({ user: null, tenant: null, isAuthenticated: false });
        }
      },

      logout: async () => {
        try {
          await api.auth.logout();
        } catch {
          // ignorar — limpiar estado local de todas formas
        }
        set({ user: null, tenant: null, isAuthenticated: false });
      },

      updateProfile: async (data) => {
        const updated = await api.auth.updateProfile(data) as any;
        set((state) => ({ user: { ...state.user, ...updated } }));
      },
    }),
    {
      name: 'av-auth',
      partialize: (state) => ({ user: state.user, tenant: state.tenant, isAuthenticated: state.isAuthenticated }),
    },
  ),
);

// ============================================================
// CONTRACTS STORE
// ============================================================
interface ContractsState {
  contracts: any[];
  total: number;
  isLoading: boolean;
  currentFilter: any;
  loadContracts: (filters?: any) => Promise<void>;
  setFilter: (filter: any) => void;
}

export const useContractsStore = create<ContractsState>()((set, get) => ({
  contracts: [],
  total: 0,
  isLoading: false,
  currentFilter: {},

  loadContracts: async (filters = {}) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams(filters).toString();
      const data = await api.contracts.list(params) as any;
      set({ contracts: data.contracts || [], total: data.total || 0 });
    } finally {
      set({ isLoading: false });
    }
  },

  setFilter: (filter) => set({ currentFilter: filter }),
}));

// ============================================================
// ALERTS STORE
// ============================================================
interface AlertsState {
  unreadCount: number;
  alerts: any[];
  loadUnreadCount: () => Promise<void>;
  decrementUnread: () => void;
  resetUnread: () => void;
}

export const useAlertsStore = create<AlertsState>()((set) => ({
  unreadCount: 0,
  alerts: [],

  loadUnreadCount: async () => {
    try {
      const count = await api.alerts.unreadCount() as any;
      set({ unreadCount: typeof count === 'number' ? count : 0 });
    } catch {
      // ignore
    }
  },

  decrementUnread: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
  resetUnread: () => set({ unreadCount: 0 }),
}));
