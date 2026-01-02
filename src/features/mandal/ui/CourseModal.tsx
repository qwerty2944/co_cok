'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Modal } from '@/shared/ui/Modal';
import { useCourseDetail, usePlacePhotosCounts, useSaveCourse, useCreateCourse, useDeleteCourse } from '../hooks';
import { useCourseModalStore } from '../stores/useCourseModalStore';
import { PlaceList } from './PlaceList';
import { PlaceDetailModal } from './PlaceDetailModal';
import { PlaceAddModal } from './PlaceAddModal';

interface Course {
  id: string;
  title: string;
  position: number;
}

interface CourseModalProps {
  open: boolean;
  themeId: string;
  position: number;
  course?: Course;
  onClose: () => void;
  onSuccess: () => void;
  supabaseUrl: string;
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function PlaceSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-2">
          <div className="flex flex-col gap-0.5">
            <Skeleton width={16} height={16} borderRadius={4} />
            <Skeleton width={16} height={16} borderRadius={4} />
          </div>
          <div className="flex-1 min-w-0">
            <Skeleton width="70%" height={14} />
            <Skeleton width="40%" height={12} style={{ marginTop: 4 }} />
          </div>
          <Skeleton width={16} height={16} borderRadius={4} />
        </div>
      ))}
    </div>
  );
}

export function CourseModal({ open, themeId, position, course, onClose, onSuccess, supabaseUrl }: CourseModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // React Query hooks
  const { data: courseData, isLoading: isLoadingCourse, isFetching } = useCourseDetail(course?.id);
  const saveMutation = useSaveCourse();
  const createMutation = useCreateCourse();
  const deleteMutation = useDeleteCourse();

  // Zustand store
  const store = useCourseModalStore();
  const {
    title, localPlaces, deletedPlaceIds, isInitialized, isEditing, error,
    detailModalOpen, detailModalPlace, placeAddModalOpen,
    setTitle, setError, setIsEditing, cancelEdit,
    initializeForEdit, initializeForCreate, reset,
    addPlace, deletePlace, reorderPlaces, updatePlace,
    openDetailModal, closeDetailModal, updateDetailModalPlace,
    openPlaceAddModal, closePlaceAddModal,
    hasChanges: getHasChanges,
  } = store;

  const isEdit = !!course;
  const saving = saveMutation.isPending || createMutation.isPending || deleteMutation.isPending;

  // 장소 ID 목록 (사진 개수 조회용)
  const placeIds = useMemo(() => localPlaces.map((p) => p.id), [localPlaces]);
  const { data: photosCounts = {} } = usePlacePhotosCounts(placeIds);

  // 첫 로딩인지 확인 (캐시된 데이터가 있으면 스켈레톤 안 보여줌)
  const showSkeleton = isEdit && isLoadingCourse && !courseData;

  // 서버 데이터로 로컬 상태 초기화
  useEffect(() => {
    if (open && course && courseData && !isInitialized) {
      initializeForEdit(courseData.title, courseData.places || []);
    } else if (open && !course && !isInitialized) {
      initializeForCreate();
    }
  }, [open, course?.id, courseData, isInitialized]);

  // 모달 닫힐 때 초기화
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open]);

  // URL에서 장소 ID 읽어서 모달 열기
  useEffect(() => {
    const placeId = searchParams.get('place');
    const courseId = searchParams.get('course');

    if (placeId && courseId && open && !detailModalOpen && localPlaces.length > 0) {
      const place = localPlaces.find((p) => p.id === placeId);
      if (place) {
        openDetailModal(place);
      }
    } else if (!placeId && detailModalOpen) {
      closeDetailModal();
    }
  }, [searchParams, open, localPlaces]);

  // 변경 감지
  const hasChanges = isEdit ? getHasChanges() : false;

  // 새 코스 생성
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || saving) return;

    setError(null);
    try {
      await createMutation.mutateAsync({ themeId, title: title.trim(), position });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '생성에 실패했어요');
    }
  }

  // 기존 코스 저장
  async function handleSave() {
    if (!course || saving || !hasChanges) return;

    setError(null);
    try {
      await saveMutation.mutateAsync({
        courseId: course.id,
        title: title.trim(),
        places: localPlaces.map((p) => ({
          id: p.id,
          name: p.name,
          memo: p.memo,
          latitude: p.latitude,
          longitude: p.longitude,
          start_date: p.start_date,
          end_date: p.end_date,
          isNew: p.isNew,
        })),
        deletedPlaceIds,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했어요');
    }
  }

  async function handleDelete() {
    if (!course || saving || !confirm('이 코스를 삭제하시겠어요?')) return;

    setError(null);
    try {
      await deleteMutation.mutateAsync(course.id);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했어요');
    }
  }

  // 로컬 장소 추가
  function handleAddPlace(placeData: {
    name: string;
    memo: string | null;
    latitude: number | null;
    longitude: number | null;
  }) {
    addPlace(placeData);
  }

  // 장소 상세 모달 열기
  function handleOpenDetail(place: typeof localPlaces[0]) {
    if (course && !place.isNew) {
      router.push(`?course=${course.id}&place=${place.id}`, { scroll: false });
    }
    openDetailModal(place);
  }

  // 장소 상세 모달 닫기
  function handleCloseDetail() {
    if (course) {
      router.push(`?course=${course.id}`, { scroll: false });
    }
    closeDetailModal();
  }

  // 장소 정보 저장
  function handleSavePlace(placeId: string, data: { name: string; memo: string | null; start_date: string | null; end_date: string | null }) {
    updatePlace(placeId, { name: data.name, memo: data.memo, start_date: data.start_date, end_date: data.end_date });
    if (detailModalPlace?.id === placeId) {
      updateDetailModalPlace({ name: data.name, memo: data.memo, start_date: data.start_date, end_date: data.end_date });
    }
  }

  // 모달 닫기
  function handleClose() {
    if (isEditing && hasChanges && !confirm('저장하지 않은 변경사항이 있어요. 닫으시겠어요?')) {
      return;
    }
    onClose();
  }

  return (
    <>
      <Modal.Root open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <Modal.Content className="max-w-md">
          <Modal.Header>
            {isEdit ? '코스 상세' : '새 코스'}
            {isFetching && !isLoadingCourse && (
              <span className="ml-2 inline-block">
                <Spinner />
              </span>
            )}
          </Modal.Header>

          <Modal.Body>
            <form onSubmit={isEdit ? (e) => { e.preventDefault(); handleSave(); } : handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  코스 이름
                </label>
                {showSkeleton ? (
                  <Skeleton height={46} borderRadius={8} />
                ) : (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="예: 강릉 1박2일"
                    readOnly={isEdit && !isEditing}
                    tabIndex={isEdit && !isEditing ? -1 : 0}
                    className={`w-full rounded-lg px-4 py-3 text-gray-900 outline-none ${
                      isEdit && !isEditing
                        ? 'border border-transparent bg-gray-50 cursor-default pointer-events-none'
                        : 'border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500'
                    }`}
                    autoFocus={!isEdit}
                  />
                )}
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {isEdit && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">여행 코스</h4>

                  <div className="h-[180px] overflow-y-auto">
                    {showSkeleton ? (
                      <PlaceSkeleton />
                    ) : localPlaces.length === 0 ? (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-sm text-gray-400">아직 장소가 없어요</p>
                      </div>
                    ) : (
                      <PlaceList
                        places={localPlaces}
                        onReorder={reorderPlaces}
                        onDelete={deletePlace}
                        onOpenDetail={handleOpenDetail}
                        placePhotosCounts={photosCounts}
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={openPlaceAddModal}
                    disabled={showSkeleton}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-3 py-3 text-sm text-gray-500 hover:border-pink-300 hover:text-pink-500 disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    장소 추가
                  </button>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {isEdit ? (
                  isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={saving}
                        className="flex items-center justify-center rounded-lg border border-red-300 px-4 py-3 text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {saving ? <Spinner /> : '삭제'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={saving}
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        disabled={saving || !title.trim() || !hasChanges}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-pink-500 px-4 py-3 font-semibold text-white hover:bg-pink-600 disabled:opacity-50"
                      >
                        {saving ? <Spinner /> : '저장'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="flex-1 rounded-lg border border-pink-300 px-4 py-3 text-pink-600 hover:bg-pink-50"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 rounded-lg bg-gray-100 px-4 py-3 text-gray-700 hover:bg-gray-200"
                      >
                        닫기
                      </button>
                    </>
                  )
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={saving}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={saving || !title.trim()}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-pink-500 px-4 py-3 font-semibold text-white hover:bg-pink-600 disabled:opacity-50"
                    >
                      {saving ? <Spinner /> : '만들기'}
                    </button>
                  </>
                )}
              </div>
            </form>
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>

      <PlaceDetailModal
        open={detailModalOpen}
        place={detailModalPlace}
        onClose={handleCloseDetail}
        onSave={handleSavePlace}
        onPhotosChange={() => {}}
        supabaseUrl={supabaseUrl}
      />

      <PlaceAddModal
        open={placeAddModalOpen}
        onClose={closePlaceAddModal}
        onAdd={handleAddPlace}
      />
    </>
  );
}
