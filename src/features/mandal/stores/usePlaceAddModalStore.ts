import { create } from 'zustand';

interface SearchResult {
  name: string;
  address: string;
  category: string;
  mapx: string;
  mapy: string;
}

interface PlaceAddModalState {
  mode: 'search' | 'manual';
  query: string;
  searching: boolean;
  results: SearchResult[];
  error: string | null;
  selectedPlace: SearchResult | null;
  manualName: string;
  memo: string;

  setMode: (mode: 'search' | 'manual') => void;
  setQuery: (query: string) => void;
  setSearching: (searching: boolean) => void;
  setResults: (results: SearchResult[]) => void;
  setError: (error: string | null) => void;
  setSelectedPlace: (place: SearchResult | null) => void;
  setManualName: (name: string) => void;
  setMemo: (memo: string) => void;
  reset: () => void;
}

export const usePlaceAddModalStore = create<PlaceAddModalState>((set) => ({
  mode: 'search',
  query: '',
  searching: false,
  results: [],
  error: null,
  selectedPlace: null,
  manualName: '',
  memo: '',

  setMode: (mode) => set({ mode }),
  setQuery: (query) => set({ query }),
  setSearching: (searching) => set({ searching }),
  setResults: (results) => set({ results }),
  setError: (error) => set({ error }),
  setSelectedPlace: (selectedPlace) => set({ selectedPlace }),
  setManualName: (manualName) => set({ manualName }),
  setMemo: (memo) => set({ memo }),
  reset: () => set({
    mode: 'search',
    query: '',
    searching: false,
    results: [],
    error: null,
    selectedPlace: null,
    manualName: '',
    memo: '',
  }),
}));
