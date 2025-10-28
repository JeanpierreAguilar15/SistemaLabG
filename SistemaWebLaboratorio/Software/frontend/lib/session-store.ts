"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SessionState = {
  accessToken?: string;
  roles: string[];
  cedula?: string;
  setSession: (s: Partial<SessionState>) => void;
  clear: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      roles: [],
      setSession: (s) => set((x) => ({ ...x, ...s })),
      clear: () => set({ accessToken: undefined, roles: [], cedula: undefined }),
    }),
    { name: 'lab-session' }
  )
);
