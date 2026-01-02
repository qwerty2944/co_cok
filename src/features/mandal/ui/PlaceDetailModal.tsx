'use client';

import { useRef, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import toast from 'react-hot-toast';
import 'swiper/css';
import 'swiper/css/pagination';
import { Modal } from '@/shared/ui/Modal';
import { createClient } from '@/shared/api/supabase/client';
import { usePlacePhotos, useDeletePhoto, useUpdatePhotoCaption } from '../hooks';
import { usePlaceDetailStore } from '../stores/usePlaceDetailStore';

interface PlacePhoto {
  id: string;
  storage_path: string;
  thumbnail_path: string | null;
  caption: string | null;
  created_at: string;
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

interface PlaceDetailModalProps {
  open: boolean;
  place: Place | null;
  onClose: () => void;
  onSave: (placeId: string, data: { name: string; memo: string | null; start_date: string | null; end_date: string | null }) => void;
  onPhotosChange: () => void;
  supabaseUrl: string;
}

interface PendingUpload {
  file: File;
  preview: string;
  caption: string;
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className || 'h-5 w-5'}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export function PlaceDetailModal({
  open,
  place,
  onClose,
  onSave,
  onPhotosChange,
  supabaseUrl,
}: PlaceDetailModalProps) {
  // Zustand store
  const store = usePlaceDetailStore();
  const {
    name, memo, startDate, endDate, isEditing,
    uploading, pendingUpload, error, currentPhotoIndex,
    editingCaption, captionInput,
    setName, setMemo, setStartDate, setEndDate, setIsEditing,
    setUploading, setError, setCurrentPhotoIndex,
    initialize, reset, cancelEdit,
    setPendingUpload, updatePendingCaption, clearPendingUpload,
    startEditCaption, setCaptionInput, cancelEditCaption, finishEditCaption,
    hasChanges: getHasChanges,
  } = store;

  // React Query hooks
  const placeId = place?.id;
  const isNewPlace = place?.isNew === true;
  const { data: photos = [], isLoading: loadingPhotos, refetch: refetchPhotos } = usePlacePhotos(placeId, open && !isNewPlace);
  const deletePhotoMutation = useDeletePhoto(placeId || '');
  const updateCaptionMutation = useUpdatePhotoCaption(placeId || '');

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const swiperRef = useRef<SwiperType | null>(null);

  const savingCaption = updateCaptionMutation.isPending;

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (open && place) {
      initialize(place);
    }
  }, [open, place?.id]);

  // 파일 선택
  function handleFileSelect() {
    fileInputRef.current?.click();
  }

  // 파일 선택 시 미리보기 설정
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setPendingUpload(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  // 업로드 취소
  function handleCancelUpload() {
    clearPendingUpload();
  }

  // 실제 업로드
  async function handleUpload() {
    if (!pendingUpload || !place) return;

    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('로그인이 필요합니다');
      }

      const formData = new FormData();
      formData.append('file', pendingUpload.file);
      formData.append('placeId', place.id);
      if (pendingUpload.caption.trim()) {
        formData.append('caption', pendingUpload.caption.trim());
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/upload-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '업로드 실패');
      }

      clearPendingUpload();
      await refetchPhotos();
      onPhotosChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드에 실패했어요');
    } finally {
      setUploading(false);
    }
  }

  // 사진 삭제
  async function handleDeletePhoto(photoId: string) {
    if (!confirm('이 사진을 삭제하시겠어요?')) return;

    try {
      await deletePhotoMutation.mutateAsync(photoId);
      // 인덱스 조정 (낙관적 업데이트로 photos가 이미 변경됨)
      const newLength = photos.length - 1;
      if (currentPhotoIndex >= newLength && newLength > 0) {
        setCurrentPhotoIndex(newLength - 1);
        swiperRef.current?.slideTo(newLength - 1);
      }
      onPhotosChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했어요');
    }
  }

  // 캡션 수정 시작
  function handleStartEditCaption() {
    const currentPhoto = photos[currentPhotoIndex];
    if (!currentPhoto) return;
    startEditCaption(currentPhoto.caption);
  }

  // 캡션 저장
  async function handleSaveCaption() {
    const currentPhoto = photos[currentPhotoIndex];
    if (!currentPhoto) return;

    try {
      await updateCaptionMutation.mutateAsync({ photoId: currentPhoto.id, caption: captionInput });
      finishEditCaption();
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했어요');
    }
  }

  // 캡션 수정 취소
  function handleCancelEditCaption() {
    cancelEditCaption();
  }

  // 썸네일 또는 원본 URL
  function getImageUrl(photo: PlacePhoto) {
    const path = photo.thumbnail_path || photo.storage_path;
    return `${supabaseUrl}/storage/v1/object/public/place-photos/${path}`;
  }

  // 저장
  function handleSave() {
    if (!place || !name.trim()) return;

    onSave(place.id, {
      name: name.trim(),
      memo: memo.trim() || null,
      start_date: startDate || null,
      end_date: endDate || null,
    });
    setIsEditing(false);
  }

  // 닫기
  function handleClose() {
    if (isEditing) {
      if (!confirm('수정 중인 내용이 있어요. 닫으시겠어요?')) {
        return;
      }
    }
    onClose();
  }

  const hasChanges = getHasChanges(place);

  if (!place) return null;

  return (
    <Modal.Root open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <Modal.Content className="max-w-md">
        <Modal.Header>장소 상세</Modal.Header>

        <Modal.Body>
          <div className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            {/* 장소 정보 */}
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">장소명</label>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="p-1 text-gray-400 hover:text-pink-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="relative h-[42px]">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    readOnly={!isEditing}
                    tabIndex={isEditing ? 0 : -1}
                    className={`absolute inset-0 w-full rounded-lg px-3 py-2 text-gray-900 outline-none ${
                      isEditing
                        ? 'border border-gray-300 bg-white cursor-text'
                        : 'border border-transparent bg-gray-50 cursor-default pointer-events-none'
                    }`}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">메모</label>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="p-1 text-gray-400 hover:text-pink-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="relative h-[68px]">
                  <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    readOnly={!isEditing}
                    tabIndex={isEditing ? 0 : -1}
                    placeholder={isEditing ? '메모 입력' : ''}
                    className={`absolute inset-0 w-full resize-none rounded-lg px-3 py-2 text-sm outline-none ${
                      isEditing
                        ? 'border border-gray-300 bg-white text-gray-900 cursor-text'
                        : 'border border-transparent bg-gray-50 text-gray-600 cursor-default pointer-events-none'
                    }`}
                  />
                  {!isEditing && !memo && (
                    <span className="pointer-events-none absolute left-3 top-2 text-sm text-gray-400">메모 없음</span>
                  )}
                </div>
              </div>

              {/* 날짜 입력 (새 장소가 아닐 때만) */}
              {!place.isNew && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">시작 날짜</label>
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="p-1 text-gray-400 hover:text-pink-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        const newStartDate = e.target.value;
                        if (endDate && newStartDate > endDate) {
                          toast.error('시작 날짜는 종료 날짜보다 앞이어야 해요');
                          return;
                        }
                        setStartDate(newStartDate);
                      }}
                      readOnly={!isEditing}
                      tabIndex={isEditing ? 0 : -1}
                      className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${
                        isEditing
                          ? 'border border-gray-300 bg-white text-gray-900 cursor-text'
                          : 'border border-transparent bg-gray-50 text-gray-600 cursor-default pointer-events-none'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">종료 날짜</label>
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="p-1 text-gray-400 hover:text-pink-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        const newEndDate = e.target.value;
                        if (startDate && newEndDate < startDate) {
                          toast.error('종료 날짜는 시작 날짜보다 뒤어야 해요');
                          return;
                        }
                        setEndDate(newEndDate);
                      }}
                      readOnly={!isEditing}
                      tabIndex={isEditing ? 0 : -1}
                      className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${
                        isEditing
                          ? 'border border-gray-300 bg-white text-gray-900 cursor-text'
                          : 'border border-transparent bg-gray-50 text-gray-600 cursor-default pointer-events-none'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 사진 섹션 (새 장소가 아닐 때만) */}
            {!place.isNew && (
              <div className="border-t pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">사진</h4>
                  {photos.length > 0 && (
                    <span className="text-sm text-gray-500">{currentPhotoIndex + 1} / {photos.length}</span>
                  )}
                </div>

                {/* 사진 캐러셀 - 고정 높이 */}
                <div className="h-[200px] mb-3">
                  {pendingUpload ? (
                    <div className="h-full space-y-2">
                      <div className="relative h-[120px] overflow-hidden rounded-lg bg-gray-100">
                        <img
                          src={pendingUpload.preview}
                          alt="미리보기"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <input
                        type="text"
                        value={pendingUpload.caption}
                        onChange={(e) => updatePendingCaption(e.target.value)}
                        placeholder="사진 설명 (선택)"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-pink-500 focus:outline-none"
                        disabled={uploading}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleCancelUpload}
                          disabled={uploading}
                          className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          취소
                        </button>
                        <button
                          onClick={handleUpload}
                          disabled={uploading}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-pink-500 px-2 py-1.5 text-sm text-white hover:bg-pink-600 disabled:opacity-50"
                        >
                          {uploading ? <Spinner className="h-4 w-4" /> : '업로드'}
                        </button>
                      </div>
                    </div>
                  ) : loadingPhotos ? (
                    <div className="flex h-full items-center justify-center">
                      <Spinner className="h-6 w-6 text-pink-500" />
                    </div>
                  ) : photos.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        onClick={handleFileSelect}
                        className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-6 py-4 text-sm text-gray-500 hover:border-pink-300 hover:text-pink-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        사진 추가
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col">
                      <div className="relative h-[160px] flex-shrink-0">
                        <Swiper
                          modules={[Pagination]}
                          pagination={{ clickable: true }}
                          onSwiper={(swiper) => { swiperRef.current = swiper; }}
                          onSlideChange={(swiper) => {
                            setCurrentPhotoIndex(swiper.activeIndex);
                            cancelEditCaption();
                          }}
                          className="h-full rounded-lg [&_.swiper-pagination-bullet-active]:!bg-pink-500"
                        >
                          {photos.map((photo) => (
                            <SwiperSlide key={photo.id}>
                              <div className="relative h-full bg-gray-100">
                                <img
                                  src={getImageUrl(photo)}
                                  alt={photo.caption || ''}
                                  className="h-full w-full object-contain"
                                />
                                <button
                                  onClick={() => handleDeletePhoto(photo.id)}
                                  className="absolute right-2 top-2 z-10 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </SwiperSlide>
                          ))}
                        </Swiper>
                        {/* 커스텀 네비게이션 버튼 */}
                        {photos.length > 1 && (
                          <>
                            <button
                              onClick={() => swiperRef.current?.slidePrev()}
                              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-gray-700">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                              </svg>
                            </button>
                            <button
                              onClick={() => swiperRef.current?.slideNext()}
                              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-gray-700">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                      {/* 캡션 영역 - 고정 높이 */}
                      <div className="mt-2 h-[32px] flex-shrink-0 overflow-hidden">
                        {editingCaption ? (
                          <div className="flex h-full items-center gap-1">
                            <input
                              type="text"
                              value={captionInput}
                              onChange={(e) => setCaptionInput(e.target.value)}
                              placeholder="사진 설명 입력"
                              className="h-full flex-1 rounded border border-gray-300 px-2 text-sm text-gray-900 focus:border-pink-500 focus:outline-none"
                              autoFocus
                              disabled={savingCaption}
                            />
                            <button
                              onClick={handleCancelEditCaption}
                              disabled={savingCaption}
                              className="flex h-full items-center rounded px-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            <button
                              onClick={handleSaveCaption}
                              disabled={savingCaption}
                              className="flex h-full items-center rounded px-1 text-pink-500 hover:text-pink-600 disabled:opacity-50"
                            >
                              {savingCaption ? (
                                <Spinner className="h-5 w-5" />
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              )}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleStartEditCaption}
                            className="flex h-full w-full items-center justify-center gap-1 text-sm text-gray-600 hover:text-pink-500"
                          >
                            <span className="truncate">{photos[currentPhotoIndex]?.caption || '설명 없음'}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 shrink-0">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>

                {/* 사진 추가 버튼 (사진이 있을 때) */}
                {!pendingUpload && !loadingPhotos && photos.length > 0 && (
                  <button
                    onClick={handleFileSelect}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-pink-300 hover:text-pink-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    사진 추가
                  </button>
                )}
              </div>
            )}

            {/* 버튼 */}
            <div className="flex gap-3 pt-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => cancelEdit(place)}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-700 hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!name.trim() || !hasChanges}
                    className="flex-1 rounded-lg bg-pink-500 px-4 py-3 font-semibold text-white hover:bg-pink-600 disabled:opacity-50"
                  >
                    저장
                  </button>
                </>
              ) : (
                <button
                  onClick={handleClose}
                  className="w-full rounded-lg bg-gray-100 px-4 py-3 text-gray-700 hover:bg-gray-200"
                >
                  닫기
                </button>
              )}
            </div>
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
