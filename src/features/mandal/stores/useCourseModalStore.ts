import { create } from 'zustand';

interface LocalPlace {
  id: string;
  name: string;
  order_index: number;
  memo: string | null;
  latitude: number | null;
  longitude: number | null;
  start_date?: string | null;
  end_date?: string | null;
  isNew?: boolean;
}

interface CourseModalState {
  // 편집 상태
  title: string;
  localPlaces: LocalPlace[];
  deletedPlaceIds: string[];
  isInitialized: boolean;
  isEditing: boolean;

  // 원본 데이터 (변경 감지용)
  originalTitle: string;
  originalPlaces: LocalPlace[];

  // 모달 상태
  detailModalOpen: boolean;
  detailModalPlace: LocalPlace | null;
  placeAddModalOpen: boolean;

  // 에러
  error: string | null;

  // Actions
  setTitle: (title: string) => void;
  setLocalPlaces: (places: LocalPlace[]) => void;
  setError: (error: string | null) => void;
  setIsEditing: (isEditing: boolean) => void;
  cancelEdit: () => void;

  // 초기화
  initializeForEdit: (title: string, places: LocalPlace[]) => void;
  initializeForCreate: () => void;
  reset: () => void;

  // 장소 관리
  addPlace: (place: Omit<LocalPlace, 'id' | 'order_index' | 'isNew'>) => void;
  deletePlace: (placeId: string) => void;
  reorderPlaces: (placeIds: string[]) => void;
  updatePlace: (placeId: string, data: Partial<LocalPlace>) => void;

  // 상세 모달
  openDetailModal: (place: LocalPlace) => void;
  closeDetailModal: () => void;
  updateDetailModalPlace: (data: Partial<LocalPlace>) => void;

  // 장소 추가 모달
  openPlaceAddModal: () => void;
  closePlaceAddModal: () => void;

  // 변경 감지
  hasChanges: () => boolean;
}

export const useCourseModalStore = create<CourseModalState>((set, get) => ({
  // 초기 상태
  title: '',
  localPlaces: [],
  deletedPlaceIds: [],
  isInitialized: false,
  isEditing: false,
  originalTitle: '',
  originalPlaces: [],
  detailModalOpen: false,
  detailModalPlace: null,
  placeAddModalOpen: false,
  error: null,

  // 기본 setters
  setTitle: (title) => set({ title }),
  setLocalPlaces: (localPlaces) => set({ localPlaces }),
  setError: (error) => set({ error }),
  setIsEditing: (isEditing) => set({ isEditing }),
  cancelEdit: () => set((state) => ({
    title: state.originalTitle,
    localPlaces: JSON.parse(JSON.stringify(state.originalPlaces)),
    deletedPlaceIds: [],
    isEditing: false,
  })),

  // 편집 모드 초기화
  initializeForEdit: (title, places) => set({
    title,
    localPlaces: places,
    originalTitle: title,
    originalPlaces: JSON.parse(JSON.stringify(places)),
    deletedPlaceIds: [],
    isInitialized: true,
    isEditing: false,
    error: null,
  }),

  // 생성 모드 초기화
  initializeForCreate: () => set({
    title: '',
    localPlaces: [],
    deletedPlaceIds: [],
    originalTitle: '',
    originalPlaces: [],
    isInitialized: true,
    isEditing: false,
    error: null,
  }),

  // 리셋
  reset: () => set({
    title: '',
    localPlaces: [],
    deletedPlaceIds: [],
    isInitialized: false,
    isEditing: false,
    originalTitle: '',
    originalPlaces: [],
    detailModalOpen: false,
    detailModalPlace: null,
    placeAddModalOpen: false,
    error: null,
  }),

  // 장소 추가
  addPlace: (placeData) => set((state) => ({
    localPlaces: [
      ...state.localPlaces,
      {
        id: `new-${Date.now()}`,
        name: placeData.name,
        order_index: state.localPlaces.length,
        memo: placeData.memo,
        latitude: placeData.latitude,
        longitude: placeData.longitude,
        isNew: true,
      },
    ],
  })),

  // 장소 삭제
  deletePlace: (placeId) => set((state) => {
    const place = state.localPlaces.find((p) => p.id === placeId);
    if (!place) return state;

    return {
      localPlaces: state.localPlaces.filter((p) => p.id !== placeId),
      deletedPlaceIds: place.isNew
        ? state.deletedPlaceIds
        : [...state.deletedPlaceIds, placeId],
    };
  }),

  // 장소 순서 변경
  reorderPlaces: (placeIds) => set((state) => ({
    localPlaces: placeIds.map((id, index) => {
      const place = state.localPlaces.find((p) => p.id === id)!;
      return { ...place, order_index: index };
    }),
  })),

  // 장소 업데이트
  updatePlace: (placeId, data) => set((state) => ({
    localPlaces: state.localPlaces.map((p) =>
      p.id === placeId ? { ...p, ...data } : p
    ),
  })),

  // 상세 모달 열기
  openDetailModal: (place) => set({
    detailModalOpen: true,
    detailModalPlace: place,
  }),

  // 상세 모달 닫기
  closeDetailModal: () => set({
    detailModalOpen: false,
    detailModalPlace: null,
  }),

  // 상세 모달 장소 업데이트
  updateDetailModalPlace: (data) => set((state) => ({
    detailModalPlace: state.detailModalPlace
      ? { ...state.detailModalPlace, ...data }
      : null,
  })),

  // 장소 추가 모달
  openPlaceAddModal: () => set({ placeAddModalOpen: true }),
  closePlaceAddModal: () => set({ placeAddModalOpen: false }),

  // 변경 감지
  hasChanges: () => {
    const state = get();
    const titleChanged = state.title !== state.originalTitle;
    const placesChanged = JSON.stringify(state.localPlaces) !== JSON.stringify(state.originalPlaces);
    const hasDeleted = state.deletedPlaceIds.length > 0;
    return titleChanged || placesChanged || hasDeleted;
  },
}));
