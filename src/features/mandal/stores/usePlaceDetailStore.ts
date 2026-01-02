import { create } from 'zustand';

interface PendingUpload {
  file: File;
  preview: string;
  caption: string;
}

interface Place {
  id: string;
  name: string;
  memo: string | null;
  latitude: number | null;
  longitude: number | null;
  start_date?: string | null;
  end_date?: string | null;
  isNew?: boolean;
}

interface PlaceDetailState {
  // 장소 정보 편집
  name: string;
  memo: string;
  startDate: string;
  endDate: string;
  isEditing: boolean;

  // 업로드 상태
  uploading: boolean;
  pendingUpload: PendingUpload | null;
  error: string | null;

  // 캐러셀 상태
  currentPhotoIndex: number;

  // 캡션 수정 상태
  editingCaption: boolean;
  captionInput: string;

  // Actions
  setName: (name: string) => void;
  setMemo: (memo: string) => void;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setIsEditing: (isEditing: boolean) => void;
  setUploading: (uploading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentPhotoIndex: (index: number) => void;

  // 초기화
  initialize: (place: Place) => void;
  reset: () => void;
  cancelEdit: (place: Place) => void;

  // 업로드 관리
  setPendingUpload: (file: File) => void;
  updatePendingCaption: (caption: string) => void;
  clearPendingUpload: () => void;

  // 캡션 수정
  startEditCaption: (currentCaption: string | null) => void;
  setCaptionInput: (caption: string) => void;
  cancelEditCaption: () => void;
  finishEditCaption: () => void;

  // 변경 감지
  hasChanges: (place: Place | null) => boolean;
}

export const usePlaceDetailStore = create<PlaceDetailState>((set, get) => ({
  // 초기 상태
  name: '',
  memo: '',
  startDate: '',
  endDate: '',
  isEditing: false,
  uploading: false,
  pendingUpload: null,
  error: null,
  currentPhotoIndex: 0,
  editingCaption: false,
  captionInput: '',

  // 기본 setters
  setName: (name) => set({ name }),
  setMemo: (memo) => set({ memo }),
  setStartDate: (startDate) => set({ startDate }),
  setEndDate: (endDate) => set({ endDate }),
  setIsEditing: (isEditing) => set({ isEditing }),
  setUploading: (uploading) => set({ uploading }),
  setError: (error) => set({ error }),
  setCurrentPhotoIndex: (currentPhotoIndex) => set({ currentPhotoIndex }),

  // 초기화
  initialize: (place) => set({
    name: place.name,
    memo: place.memo || '',
    startDate: place.start_date || '',
    endDate: place.end_date || '',
    isEditing: false,
    error: null,
    pendingUpload: null,
    currentPhotoIndex: 0,
    editingCaption: false,
    captionInput: '',
  }),

  reset: () => set({
    name: '',
    memo: '',
    startDate: '',
    endDate: '',
    isEditing: false,
    uploading: false,
    pendingUpload: null,
    error: null,
    currentPhotoIndex: 0,
    editingCaption: false,
    captionInput: '',
  }),

  cancelEdit: (place) => set({
    name: place.name,
    memo: place.memo || '',
    startDate: place.start_date || '',
    endDate: place.end_date || '',
    isEditing: false,
  }),

  // 업로드 관리
  setPendingUpload: (file) => set({
    pendingUpload: {
      file,
      preview: URL.createObjectURL(file),
      caption: '',
    },
  }),

  updatePendingCaption: (caption) => set((state) => ({
    pendingUpload: state.pendingUpload
      ? { ...state.pendingUpload, caption }
      : null,
  })),

  clearPendingUpload: () => {
    const { pendingUpload } = get();
    if (pendingUpload) {
      URL.revokeObjectURL(pendingUpload.preview);
    }
    set({ pendingUpload: null });
  },

  // 캡션 수정
  startEditCaption: (currentCaption) => set({
    captionInput: currentCaption || '',
    editingCaption: true,
  }),

  setCaptionInput: (captionInput) => set({ captionInput }),

  cancelEditCaption: () => set({
    editingCaption: false,
    captionInput: '',
  }),

  finishEditCaption: () => set({
    editingCaption: false,
  }),

  // 변경 감지
  hasChanges: (place) => {
    if (!place) return false;
    const state = get();
    return (
      state.name !== place.name ||
      state.memo !== (place.memo || '') ||
      state.startDate !== (place.start_date || '') ||
      state.endDate !== (place.end_date || '')
    );
  },
}));
