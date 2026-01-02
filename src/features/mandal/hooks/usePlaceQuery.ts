'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlacePhotos, deletePhoto, updatePhotoCaption } from '../api/photos';

// 장소 사진 쿼리 키
export const placeKeys = {
  all: ['places'] as const,
  photos: (placeId: string) => [...placeKeys.all, 'photos', placeId] as const,
};

// 장소 사진 조회
export function usePlacePhotos(placeId: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: placeKeys.photos(placeId || ''),
    queryFn: async () => {
      if (!placeId) return [];
      const result = await getPlacePhotos(placeId);
      if ('error' in result) throw new Error(result.error);
      return result.photos || [];
    },
    enabled: !!placeId && enabled,
  });
}

// 사진 삭제 뮤테이션
export function useDeletePhoto(placeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photoId: string) => {
      const result = await deletePhoto(photoId);
      if ('error' in result && result.error) throw new Error(result.error);
      return photoId;
    },
    onMutate: async (photoId) => {
      // 이전 데이터 스냅샷
      await queryClient.cancelQueries({ queryKey: placeKeys.photos(placeId) });
      const previousPhotos = queryClient.getQueryData(placeKeys.photos(placeId));

      // 낙관적 업데이트
      queryClient.setQueryData(placeKeys.photos(placeId), (old: any[] | undefined) =>
        old?.filter((photo) => photo.id !== photoId) || []
      );

      return { previousPhotos };
    },
    onError: (_, __, context) => {
      // 에러 시 롤백
      if (context?.previousPhotos) {
        queryClient.setQueryData(placeKeys.photos(placeId), context.previousPhotos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: placeKeys.photos(placeId) });
    },
  });
}

// 사진 캡션 수정 뮤테이션
export function useUpdatePhotoCaption(placeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoId, caption }: { photoId: string; caption: string }) => {
      const result = await updatePhotoCaption(photoId, caption);
      if ('error' in result && result.error) throw new Error(result.error);
      return { photoId, caption };
    },
    onMutate: async ({ photoId, caption }) => {
      await queryClient.cancelQueries({ queryKey: placeKeys.photos(placeId) });
      const previousPhotos = queryClient.getQueryData(placeKeys.photos(placeId));

      // 낙관적 업데이트
      queryClient.setQueryData(placeKeys.photos(placeId), (old: any[] | undefined) =>
        old?.map((photo) =>
          photo.id === photoId ? { ...photo, caption: caption.trim() || null } : photo
        ) || []
      );

      return { previousPhotos };
    },
    onError: (_, __, context) => {
      if (context?.previousPhotos) {
        queryClient.setQueryData(placeKeys.photos(placeId), context.previousPhotos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: placeKeys.photos(placeId) });
    },
  });
}
