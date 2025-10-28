"use client";
import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export type ToastItem = {
  id: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  autoCloseMs?: number;
};

type ToastState = {
  items: ToastItem[];
  push: (t: Omit<ToastItem, 'id'>) => string;
  remove: (id: string) => void;
  clear: () => void;
};

export const useToastStore = create<ToastState>()((set, get) => ({
  items: [],
  push: (t) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ items: [...s.items, { id, ...t }] }));
    return id;
  },
  remove: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
  clear: () => set({ items: [] }),
}));

export function showToast(message: string, opts?: { title?: string; variant?: ToastVariant; autoCloseMs?: number }) {
  useToastStore.getState().push({ message, ...opts });
}

export function useToast() {
  const push = useToastStore((s) => s.push);
  return {
    show: (message: string, opts?: { title?: string; variant?: ToastVariant; autoCloseMs?: number }) =>
      push({ message, ...opts }),
  };
}

