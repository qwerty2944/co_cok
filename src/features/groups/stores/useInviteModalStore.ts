import { create } from 'zustand';

interface InviteModalState {
  code: string | null;
  expiresAt: Date | null;
  timeLeft: number;
  loading: boolean;
  error: string | null;
  copied: boolean;

  setCode: (code: string | null) => void;
  setExpiresAt: (expiresAt: Date | null) => void;
  setTimeLeft: (timeLeft: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCopied: (copied: boolean) => void;
  reset: () => void;
}

export const useInviteModalStore = create<InviteModalState>((set) => ({
  code: null,
  expiresAt: null,
  timeLeft: 0,
  loading: false,
  error: null,
  copied: false,

  setCode: (code) => set({ code }),
  setExpiresAt: (expiresAt) => set({ expiresAt }),
  setTimeLeft: (timeLeft) => set({ timeLeft }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setCopied: (copied) => set({ copied }),
  reset: () => set({
    code: null,
    expiresAt: null,
    timeLeft: 0,
    loading: false,
    error: null,
    copied: false,
  }),
}));
