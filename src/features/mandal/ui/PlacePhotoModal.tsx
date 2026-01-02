'use client';

import { useState, useRef, useEffect } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { getPlacePhotos, deletePhoto } from '../api/photos';

interface PlacePhoto {
  id: string;
  storage_path: string;
  thumbnail_path: string | null;
  caption: string | null;
  created_at: string;
}

interface PlacePhotoModalProps {
  open: boolean;
  placeId: string;
  placeName: string;
  onClose: () => void;
  onPhotosChange: () => void;
  supabaseUrl: string;
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className || 'h-5 w-5'}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export function PlacePhotoModal({
  open,
  placeId,
  placeName,
  onClose,
  onPhotosChange,
  supabaseUrl,
}: PlacePhotoModalProps) {
  const [photos, setPhotos] = useState<PlacePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 사진 로드
  useEffect(() => {
    if (open && placeId) {
      loadPhotos();
    }
  }, [open, placeId]);

  async function loadPhotos() {
    setLoading(true);
    setError(null);
    const result = await getPlacePhotos(placeId);
    setLoading(false);

    if (result.success) {
      setPhotos(result.photos || []);
    } else {
      setError(result.error || '사진을 불러오는데 실패했어요');
    }
  }

  // 파일 선택
  function handleFileSelect() {
    fileInputRef.current?.click();
  }

  // 파일 업로드
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        // Edge Function으로 업로드
        const formData = new FormData();
        formData.append('file', file);
        formData.append('placeId', placeId);

        const response = await fetch(`${supabaseUrl}/functions/v1/upload-photo`, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || '업로드 실패');
        }
      }

      // 업로드 성공 후 새로고침
      await loadPhotos();
      onPhotosChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드에 실패했어요');
    } finally {
      setUploading(false);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  // 사진 삭제
  async function handleDelete(photoId: string) {
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

  return (
    <Modal.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Modal.Content className="max-w-lg">
        <Modal.Header>{placeName} 사진</Modal.Header>

        <Modal.Body>
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* 업로드 버튼 */}
          <div className="mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={handleFileSelect}
              disabled={uploading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-gray-500 hover:border-pink-300 hover:text-pink-500 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Spinner />
                  업로드 중...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  사진 추가
                </>
              )}
            </button>
          </div>

          {/* 사진 그리드 */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-8 w-8 text-pink-500" />
            </div>
          ) : photos.length === 0 ? (
            <p className="text-center text-gray-400 py-8">
              아직 사진이 없어요
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo) => (
                <div key={photo.id} className="group relative aspect-square">
                  <img
                    src={getImageUrl(photo)}
                    alt={photo.caption || ''}
                    className="h-full w-full rounded-lg object-cover"
                  />
                  <button
                    onClick={() => handleDelete(photo.id)}
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

          <button
            onClick={onClose}
            className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-700 hover:bg-gray-50"
          >
            닫기
          </button>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
