'use client';

import { useState, useEffect } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Modal } from '@/shared/ui/Modal';
import { createCourse, deleteCourse, getCourseDetail, saveCourseChanges } from '../api/mandal';
import { getPlacePhotosCounts } from '../api/photos';
import { PlaceList } from './PlaceList';
import { PlaceDetailModal } from './PlaceDetailModal';
import { PlaceAddModal } from './PlaceAddModal';

interface Course {
  id: string;
  title: string;
  position: number;
  date?: string | null;
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

interface LocalPlace {
  id: string;
  name: string;
  order_index: number;
  memo: string | null;
  latitude: number | null;
  longitude: number | null;
  isNew?: boolean;
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
          <Skeleton width={20} height={20} />
          <div className="flex-1">
            <Skeleton width="60%" height={14} />
            <Skeleton width="40%" height={12} style={{ marginTop: 4 }} />
          </div>
          <Skeleton width={16} height={16} />
        </div>
      ))}
    </div>
  );
}

export function CourseModal({ open, themeId, position, course, onClose, onSuccess, supabaseUrl }: CourseModalProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 로컬 상태
  const [localPlaces, setLocalPlaces] = useState<LocalPlace[]>([]);
  const [deletedPlaceIds, setDeletedPlaceIds] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // 원본 데이터 (변경 감지용)
  const [originalTitle, setOriginalTitle] = useState('');
  const [originalDate, setOriginalDate] = useState('');
  const [originalPlaces, setOriginalPlaces] = useState<LocalPlace[]>([]);

  // 장소 상세 모달 상태
  const [detailModal, setDetailModal] = useState<{ open: boolean; place: LocalPlace | null }>({
    open: false,
    place: null,
  });
  const [photosCounts, setPhotosCounts] = useState<Record<string, number>>({});

  // 장소 추가 모달 상태
  const [placeAddModalOpen, setPlaceAddModalOpen] = useState(false);

  const isEdit = !!course;

  // 초기 데이터 로드 (모달 열릴 때 한 번만)
  useEffect(() => {
    if (open && course) {
      loadInitialData();
    } else if (open && !course) {
      // 새 코스 생성
      setTitle('');
      setDate('');
      setLocalPlaces([]);
      setDeletedPlaceIds([]);
      setOriginalTitle('');
      setOriginalDate('');
      setOriginalPlaces([]);
      setHasChanges(false);
      setPhotosCounts({});
    }
  }, [open, course?.id]);

  async function loadInitialData() {
    if (!course) return;

    setInitialLoading(true);
    setError(null);

    const result = await getCourseDetail(course.id);
    setInitialLoading(false);

    if (result.success && result.course) {
      const places = result.course.places || [];
      setTitle(result.course.title);
      setDate(result.course.date || '');
      setLocalPlaces(places);
      setOriginalTitle(result.course.title);
      setOriginalDate(result.course.date || '');
      setOriginalPlaces(JSON.parse(JSON.stringify(places)));
      setDeletedPlaceIds([]);
      setHasChanges(false);

      // 사진 개수 로드
      loadPhotosCounts(places.map((p: LocalPlace) => p.id));
    }
  }

  async function loadPhotosCounts(placeIds: string[]) {
    const existingPlaceIds = placeIds.filter((id) => !id.startsWith('new-'));
    if (existingPlaceIds.length === 0) {
      setPhotosCounts({});
      return;
    }

    const result = await getPlacePhotosCounts(existingPlaceIds);
    if (result.success) {
      setPhotosCounts(result.counts || {});
    }
  }

  // 변경 감지
  useEffect(() => {
    if (!isEdit) return;

    const titleChanged = title !== originalTitle;
    const dateChanged = date !== originalDate;
    const placesChanged = JSON.stringify(localPlaces) !== JSON.stringify(originalPlaces);
    const hasDeleted = deletedPlaceIds.length > 0;

    setHasChanges(titleChanged || dateChanged || placesChanged || hasDeleted);
  }, [title, date, localPlaces, deletedPlaceIds, originalTitle, originalDate, originalPlaces, isEdit]);

  // 새 코스 생성
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || saving) return;

    setSaving(true);
    setError(null);

    const result = await createCourse(themeId, title.trim(), position, date || undefined);
    setSaving(false);

    if ('error' in result && result.error) {
      setError(result.error);
    } else {
      onSuccess();
    }
  }

  // 기존 코스 저장
  async function handleSave() {
    if (!course || saving || !hasChanges) return;

    setSaving(true);
    setError(null);

    const result = await saveCourseChanges(
      course.id,
      title.trim(),
      date || null,
      localPlaces.map((p) => ({
        id: p.id,
        name: p.name,
        memo: p.memo,
        latitude: p.latitude,
        longitude: p.longitude,
        isNew: p.isNew,
      })),
      deletedPlaceIds
    );

    setSaving(false);

    if ('error' in result && result.error) {
      setError(result.error);
    } else {
      onSuccess();
    }
  }

  async function handleDelete() {
    if (!course || saving || !confirm('이 코스를 삭제하시겠어요?')) return;

    setSaving(true);
    const result = await deleteCourse(course.id);
    setSaving(false);

    if ('error' in result && result.error) {
      setError(result.error);
    } else {
      onSuccess();
    }
  }

  // 로컬 장소 추가 (모달에서 받은 데이터로)
  function handleAddPlace(placeData: {
    name: string;
    memo: string | null;
    latitude: number | null;
    longitude: number | null;
  }) {
    const newPlace: LocalPlace = {
      id: `new-${Date.now()}`,
      name: placeData.name,
      order_index: localPlaces.length,
      memo: placeData.memo,
      latitude: placeData.latitude,
      longitude: placeData.longitude,
      isNew: true,
    };

    setLocalPlaces([...localPlaces, newPlace]);
  }

  // 로컬 장소 삭제
  function handleDeletePlace(placeId: string) {
    const place = localPlaces.find((p) => p.id === placeId);
    if (!place) return;

    // 새로 추가된 장소가 아니면 삭제 목록에 추가
    if (!place.isNew) {
      setDeletedPlaceIds([...deletedPlaceIds, placeId]);
    }

    setLocalPlaces(localPlaces.filter((p) => p.id !== placeId));
  }

  // 로컬 장소 순서 변경
  function handleReorder(placeIds: string[]) {
    const reordered = placeIds.map((id, index) => {
      const place = localPlaces.find((p) => p.id === id)!;
      return { ...place, order_index: index };
    });
    setLocalPlaces(reordered);
  }

  // 장소 상세 모달 열기
  function handleOpenDetail(place: LocalPlace) {
    setDetailModal({ open: true, place });
  }

  // 장소 정보 저장 (이름, 메모)
  function handleSavePlace(placeId: string, data: { name: string; memo: string | null }) {
    setLocalPlaces(localPlaces.map((p) =>
      p.id === placeId ? { ...p, name: data.name, memo: data.memo } : p
    ));
    // 상세 모달의 place도 업데이트
    if (detailModal.place?.id === placeId) {
      setDetailModal({
        ...detailModal,
        place: { ...detailModal.place, name: data.name, memo: data.memo },
      });
    }
  }

  // 사진 변경 시 개수 새로고침
  function handlePhotosChange() {
    const existingPlaceIds = localPlaces.filter((p) => !p.isNew).map((p) => p.id);
    loadPhotosCounts(existingPlaceIds);
  }

  // 모달 닫기 (변경사항 있으면 확인)
  function handleClose() {
    if (hasChanges && !confirm('저장하지 않은 변경사항이 있어요. 닫으시겠어요?')) {
      return;
    }
    onClose();
  }

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (open) {
      setError(null);
      setSaving(false);
      if (course) {
        setInitialLoading(true);
      }
    }
  }, [open, course]);

  return (
    <>
      <Modal.Root open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <Modal.Content className="max-w-md">
          <Modal.Header>{isEdit ? '코스 상세' : '새 코스'}</Modal.Header>

          <Modal.Body>
            <form onSubmit={isEdit ? (e) => { e.preventDefault(); handleSave(); } : handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  코스 이름
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 강릉 1박2일"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  autoFocus={!isEdit}
                  disabled={initialLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  날짜 <span className="text-gray-400 font-normal">(선택)</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  disabled={initialLoading}
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* 기존 코스면 장소 목록 표시 */}
              {isEdit && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">여행 코스</h4>

                  <div className="max-h-[240px] overflow-y-auto">
                    {initialLoading ? (
                      <PlaceSkeleton />
                    ) : (
                      <PlaceList
                        places={localPlaces}
                        onReorder={handleReorder}
                        onDelete={handleDeletePlace}
                        onOpenDetail={handleOpenDetail}
                        placePhotosCounts={photosCounts}
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setPlaceAddModalOpen(true)}
                    disabled={initialLoading}
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
                {isEdit && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={saving}
                    className="flex items-center justify-center rounded-lg border border-red-300 px-4 py-3 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {saving ? <Spinner /> : '삭제'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={saving}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {isEdit ? '닫기' : '취소'}
                </button>
                <button
                  type="submit"
                  disabled={saving || !title.trim() || (isEdit && !hasChanges)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-pink-500 px-4 py-3 font-semibold text-white hover:bg-pink-600 disabled:opacity-50"
                >
                  {saving ? <Spinner /> : isEdit ? '저장' : '만들기'}
                </button>
              </div>
            </form>
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>

      <PlaceDetailModal
        open={detailModal.open}
        place={detailModal.place}
        onClose={() => setDetailModal({ open: false, place: null })}
        onSave={handleSavePlace}
        onPhotosChange={handlePhotosChange}
        supabaseUrl={supabaseUrl}
      />

      <PlaceAddModal
        open={placeAddModalOpen}
        onClose={() => setPlaceAddModalOpen(false)}
        onAdd={handleAddPlace}
      />
    </>
  );
}
