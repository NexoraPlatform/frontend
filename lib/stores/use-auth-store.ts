import { create } from 'zustand';

export type AuthStoreUser = Record<string, unknown> | null;

type AuthStoreState = {
  user: AuthStoreUser;
  setUser: (user: AuthStoreUser) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
