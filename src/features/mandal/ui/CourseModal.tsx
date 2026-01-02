'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { createCourse, updateCourse, deleteCourse, getCourseDetail, addPlace, deletePlace, reorderPlaces } from '../api/mandal';
import { PlaceList } from './PlaceList';

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
}

interface Place {
  id: string;
  name: string;
  address: string | null;
  order_index: number;
  memo: string | null;
}

interface CourseDetail {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  places: Place[];
  photos: any[];
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export function CourseModal({ open, themeId, position, course, onClose, onSuccess }: CourseModalProps) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const [newPlaceName, setNewPlaceName] = useState('');
  const [addingPlace, setAddingPlace] = useState(false);

  const isEdit = !!course;

  // 코스 상세 로드
  useEffect(() => {
    if (open && course) {
      loadDetail();
    } else {
      setDetail(null);
    }
  }, [open, course]);

  async function loadDetail() {
    if (!course) return;
    const result = await getCourseDetail(course.id);
    if (result.success && result.course) {
      setDetail(result.course);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || loading) return;

    setLoading(true);
    setError(null);

    const result = isEdit
      ? await updateCourse(course!.id, title.trim())
      : await createCourse(themeId, title.trim(), position);

    setLoading(false);

    if ('error' in result && result.error) {
      setError(result.error);
    } else {
      onSuccess();
    }
  }

  async function handleDelete() {
    if (!course || loading || !confirm('이 코스를 삭제하시겠어요?')) return;

    setLoading(true);
    const result = await deleteCourse(course.id);
    setLoading(false);

    if ('error' in result && result.error) {
      setError(result.error);
    } else {
      onSuccess();
    }
  }

  async function handleAddPlace() {
    if (!newPlaceName.trim() || !course || addingPlace) return;

    setAddingPlace(true);
    const result = await addPlace(course.id, newPlaceName.trim());
    setAddingPlace(false);

    if (result.success) {
      setNewPlaceName('');
      loadDetail();
    }
  }

  async function handleDeletePlace(placeId: string) {
    const result = await deletePlace(placeId);
    if (result.success) {
      loadDetail();
    }
  }

  async function handleReorder(placeIds: string[]) {
    if (!course) return;
    await reorderPlaces(course.id, placeIds);
    loadDetail();
  }

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (open) {
      setTitle(course?.title || '');
      setError(null);
      setNewPlaceName('');
      setLoading(false);
      setAddingPlace(false);
    }
  }, [open, course]);

  return (
    <Modal.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Modal.Content className="max-w-md">
        <Modal.Header>{isEdit ? '코스 상세' : '새 코스'}</Modal.Header>

        <Modal.Body>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* 기존 코스면 장소 목록 표시 */}
            {isEdit && detail && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">여행 코스</h4>

                <PlaceList
                  places={detail.places}
                  onReorder={handleReorder}
                  onDelete={handleDeletePlace}
                />

                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={newPlaceName}
                    onChange={(e) => setNewPlaceName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPlace())}
                    placeholder="장소 추가"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-pink-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddPlace}
                    disabled={!newPlaceName.trim() || addingPlace}
                    className="flex items-center justify-center rounded-lg bg-pink-500 px-3 py-2 text-sm text-white hover:bg-pink-600 disabled:opacity-50"
                  >
                    {addingPlace ? <Spinner /> : '추가'}
                  </button>
                </div>
              </div>
            )}

            {/* 갤러리 (사진 있을 때만) */}
            {isEdit && detail && detail.photos.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">갤러리</h4>
                <div className="grid grid-cols-3 gap-2">
                  {detail.photos.map((photo: any) => (
                    <div key={photo.id} className="aspect-square rounded-lg bg-gray-100" />
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {isEdit && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex items-center justify-center rounded-lg border border-red-300 px-4 py-3 text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {loading ? <Spinner /> : '삭제'}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {isEdit ? '닫기' : '취소'}
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-pink-500 px-4 py-3 font-semibold text-white hover:bg-pink-600 disabled:opacity-50"
              >
                {loading ? <Spinner /> : isEdit ? '수정' : '만들기'}
              </button>
            </div>
          </form>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
