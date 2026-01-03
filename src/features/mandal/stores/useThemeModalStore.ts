import { create } from 'zustand';

interface ThemeModalState {
  name: string;
  originalName: string;
  loading: boolean;
  error: string | null;
  isEditing: boolean;

  setName: (name: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setIsEditing: (isEditing: boolean) => void;
  initialize: (name: string) => void;
  cancelEdit: () => void;
  reset: () => void;
  hasChanges: () => boolean;
}

export const useThemeModalStore = create<ThemeModalState>((set, get) => ({
  name: '',
  originalName: '',
  loading: false,
  error: null,
  isEditing: false,

  setName: (name) => set({ name }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setIsEditing: (isEditing) => set({ isEditing }),
  initialize: (name) => set({
    name,
    originalName: name,
    loading: false,
    error: null,
    isEditing: false,
  }),
  cancelEdit: () => set((state) => ({
    name: state.originalName,
    isEditing: false,
  })),
  reset: () => set({
    name: '',
    originalName: '',
    loading: false,
    error: null,
    isEditing: false,
  }),
  hasChanges: () => {
    const state = get();
    return state.name !== state.originalName;
  },
}));
