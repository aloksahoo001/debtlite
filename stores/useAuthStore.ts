import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ExtendedUser } from "@/types/supabase";

type AuthState = {
  user: ExtendedUser | null;
  setUser: (user: ExtendedUser) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: "auth-store", // key in localStorage
      partialize: (state) => ({ user: state.user }), // only persist user
    }
  )
);