import { create } from 'zustand';

interface JoinCodeState {
  code: string;
  loading: boolean;
  error: string | null;
  isOpen: boolean;

  setCode: (code: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setIsOpen: (isOpen: boolean) => void;
  reset: () => void;
}

export const useJoinCodeStore = create<JoinCodeState>((set) => ({
  code: '',
  loading: false,
  error: null,
  isOpen: false,

  setCode: (code) => set({ code }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setIsOpen: (isOpen) => set({ isOpen }),
  reset: () => set({
    code: '',
    loading: false,
    error: null,
    isOpen: false,
  }),
}));
