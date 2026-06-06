import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface UIState {
  sidebarOpen: boolean;
  theme: Theme;
  activeModal: string | null;
  modalData: unknown;
  toggleSidebar: () => void;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  openModal: (name: string, data?: unknown) => void;
  closeModal: () => void;
}

function readInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return 'light';
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  theme: readInitialTheme(),
  activeModal: null,
  modalData: null,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  setTheme: (t) => {
    localStorage.setItem('theme', t);
    set({ theme: t });
  },

  toggleTheme: () => {
    const next: Theme = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', next);
    set({ theme: next });
  },

  openModal: (name, data = null) => set({ activeModal: name, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
}));