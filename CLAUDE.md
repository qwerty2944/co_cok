# CLAUDE.md

## API 구조 규칙

### entities vs features 분리
- **entities**: 조회(GET) 함수만 배치
- **features**: 뮤테이션(POST, PATCH, DELETE) 함수만 배치

### 폴더 구조
```
src/
├── entities/           # 조회 전용
│   ├── auth/
│   │   ├── api.ts     # getUser
│   │   └── index.ts
│   ├── groups/
│   │   ├── api.ts     # validateInviteCode
│   │   └── index.ts
│   ├── mandal/
│   │   ├── api.ts     # getThemes, getCourseDetail
│   │   └── index.ts
│   └── photos/
│       ├── api.ts     # getPlacePhotos, getPlacePhotosCounts
│       └── index.ts
│
└── features/           # 뮤테이션 전용
    ├── auth/
    │   └── api/auth.ts    # signIn, signUp, signOut
    ├── groups/
    │   └── api/groups.ts  # createGroup, acceptInvite, leaveGroup
    └── mandal/
        ├── api/mandal.ts  # createTheme, updateTheme, deleteTheme, ...
        └── api/photos.ts  # deletePhoto, updatePhotoCaption
```

### import 규칙
```typescript
// 조회 함수는 entities에서
import { getUser } from '@/entities/auth';
import { getThemes, getCourseDetail } from '@/entities/mandal';

// 뮤테이션 함수는 features에서
import { signIn, signOut } from '@/features/auth';
import { createTheme, deleteTheme } from '@/features/mandal';
```

---

## 상태 관리 규칙

### Zustand 스토어 사용 기준
- **useState가 3개 이상인 컴포넌트**는 Zustand 스토어로 분리
- 스토어 파일 위치: `src/features/{feature}/stores/use{Name}Store.ts`
- 스토어는 해당 feature의 `index.ts`에서 export

### 스토어 패턴
```typescript
import { create } from 'zustand';

interface ExampleState {
  // 상태
  value: string;
  loading: boolean;
  error: string | null;
  isOpen: boolean;

  // 액션
  setValue: (value: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setIsOpen: (isOpen: boolean) => void;
  reset: () => void;
}

export const useExampleStore = create<ExampleState>((set) => ({
  value: '',
  loading: false,
  error: null,
  isOpen: false,

  setValue: (value) => set({ value }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setIsOpen: (isOpen) => set({ isOpen }),
  reset: () => set({
    value: '',
    loading: false,
    error: null,
    isOpen: false,
  }),
}));
```

### 기존 스토어 예시
- `useJoinCodeStore` - 초대코드 입력 모달 상태
- `useInviteModalStore` - 초대 모달 상태
- `usePlaceDetailStore` - 장소 상세 모달 상태
- `useCourseModalStore` - 코스 모달 상태
