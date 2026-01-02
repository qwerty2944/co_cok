'use client';

import { useState, useRef, useEffect } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { createClient } from '@/shared/api/supabase/client';
import { getPlacePhotos, deletePhoto } from '../api/photos';

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
  address: string | null;
  memo: string | null;
  latitude: number | null;
  longitude: number | null;
  isNew?: boolean;
}

interface PlaceDetailModalProps {
  open: boolean;
  place: Place | null;
  onClose: () => void;
  onSave: (placeId: string, data: { name: string; memo: string | null }) => void;
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
  // 편집 상태
  const [name, setName] = useState('');
  const [memo, setMemo] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // 사진 상태
  const [photos, setPhotos] = useState<PlacePhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 업로드 대기 상태
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);

  // 선택된 사진 (말풍선 표시용)
  const [selectedPhoto, setSelectedPhoto] = useState<PlacePhoto | null>(null);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (open && place) {
      setName(place.name);
      setMemo(place.memo || '');
      setIsEditing(false);
      setError(null);
      setPendingUpload(null);
      setSelectedPhoto(null);

      if (!place.isNew) {
        loadPhotos();
      } else {
        setPhotos([]);
      }
    }
  }, [open, place?.id]);

  async function loadPhotos() {
    if (!place || place.isNew) return;

    setLoadingPhotos(true);
    const result = await getPlacePhotos(place.id);
    setLoadingPhotos(false);

    if (result.success) {
      setPhotos(result.photos || []);
    }
  }

  // 파일 선택
  function handleFileSelect() {
    fileInputRef.current?.click();
  }

  // 파일 선택 시 미리보기 설정
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const preview = URL.createObjectURL(file);
    setPendingUpload({ file, preview, caption: '' });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  // 업로드 취소
  function handleCancelUpload() {
    if (pendingUpload) {
      URL.revokeObjectURL(pendingUpload.preview);
      setPendingUpload(null);
    }
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

      URL.revokeObjectURL(pendingUpload.preview);
      setPendingUpload(null);
      await loadPhotos();
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

    const result = await deletePhoto(photoId);
    if (result.success) {
      setPhotos(photos.filter((p) => p.id !== photoId));
      onPhotosChange();
    } else {
      setError(result.error || '삭제에 실패했어요');
    }
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

  const hasChanges = place && (name !== place.name || memo !== (place.memo || ''));

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
                <label className="mb-1 block text-sm font-medium text-gray-700">장소명</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-pink-500 focus:outline-none"
                  />
                ) : (
                  <p className="rounded-lg bg-gray-50 px-3 py-2 text-gray-900">{place.name}</p>
                )}
              </div>

              {place.address && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">주소</label>
                  <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">{place.address}</p>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">메모</label>
                {isEditing ? (
                  <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    rows={2}
                    placeholder="메모 입력"
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-pink-500 focus:outline-none"
                  />
                ) : (
                  <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                    {place.memo || '메모 없음'}
                  </p>
                )}
              </div>
            </div>

            {/* 사진 섹션 (새 장소가 아닐 때만) */}
            {!place.isNew && (
              <div className="border-t pt-4">
                <h4 className="mb-3 font-medium text-gray-900">사진</h4>

                {/* 업로드 미리보기 */}
                {pendingUpload ? (
                  <div className="mb-4 space-y-3">
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={pendingUpload.preview}
                        alt="미리보기"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <input
                      type="text"
                      value={pendingUpload.caption}
                      onChange={(e) => setPendingUpload({ ...pendingUpload, caption: e.target.value })}
                      placeholder="사진 설명 (선택)"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-pink-500 focus:outline-none"
                      disabled={uploading}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancelUpload}
                        disabled={uploading}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-pink-500 px-3 py-2 text-sm text-white hover:bg-pink-600 disabled:opacity-50"
                      >
                        {uploading ? <Spinner /> : '업로드'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      onClick={handleFileSelect}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-4 text-sm text-gray-500 hover:border-pink-300 hover:text-pink-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      사진 추가
                    </button>
                  </div>
                )}

                {/* 사진 그리드 */}
                {loadingPhotos ? (
                  <div className="flex justify-center py-4">
                    <Spinner className="h-6 w-6 text-pink-500" />
                  </div>
                ) : photos.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-4">아직 사진이 없어요</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((photo) => (
                      <div key={photo.id} className="group relative aspect-square">
                        <button
                          onClick={() => setSelectedPhoto(selectedPhoto?.id === photo.id ? null : photo)}
                          className="h-full w-full"
                        >
                          <img
                            src={getImageUrl(photo)}
                            alt={photo.caption || ''}
                            className="h-full w-full rounded-lg object-cover"
                          />
                          {photo.caption && (
                            <div className="absolute bottom-1 left-1 rounded-full bg-black/50 p-1">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-3 h-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                              </svg>
                            </div>
                          )}
                        </button>
                        {selectedPhoto?.id === photo.id && (
                          <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 transform">
                            <div className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-white shadow-lg max-w-[200px]">
                              {photo.caption || '설명 없음'}
                              <div className="absolute left-1/2 top-full -translate-x-1/2 transform border-4 border-transparent border-t-gray-900" />
                            </div>
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }}
                          className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 버튼 */}
            <div className="flex gap-3 pt-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setName(place.name);
                      setMemo(place.memo || '');
                      setIsEditing(false);
                    }}
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
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 rounded-lg border border-pink-300 px-4 py-3 text-pink-600 hover:bg-pink-50"
                  >
                    수정
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex-1 rounded-lg bg-gray-100 px-4 py-3 text-gray-700 hover:bg-gray-200"
                  >
                    닫기
                  </button>
                </>
              )}
            </div>
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
