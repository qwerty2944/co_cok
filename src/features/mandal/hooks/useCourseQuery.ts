'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCourseDetail, saveCourseChanges, createCourse, deleteCourse } from '../api/mandal';
import { getPlacePhotosCounts } from '../api/photos';

// 코스 상세 조회 쿼리 키
export const courseKeys = {
  all: ['courses'] as const,
  detail: (courseId: string) => [...courseKeys.all, 'detail', courseId] as const,
  photosCounts: (placeIds: string[]) => [...courseKeys.all, 'photosCounts', placeIds.join(',')] as const,
};

// 코스 상세 조회
export function useCourseDetail(courseId: string | undefined) {
  return useQuery({
    queryKey: courseKeys.detail(courseId || ''),
    queryFn: async () => {
      if (!courseId) return null;
      const result = await getCourseDetail(courseId);
      if ('error' in result) throw new Error(result.error);
      return result.course;
    },
    enabled: !!courseId,
  });
}

// 장소별 사진 개수 조회
export function usePlacePhotosCounts(placeIds: string[]) {
  const existingPlaceIds = placeIds.filter((id) => !id.startsWith('new-'));

  return useQuery({
    queryKey: courseKeys.photosCounts(existingPlaceIds),
    queryFn: async () => {
      if (existingPlaceIds.length === 0) return {};
      const result = await getPlacePhotosCounts(existingPlaceIds);
      if ('error' in result) throw new Error(result.error);
      return result.counts || {};
    },
    enabled: existingPlaceIds.length > 0,
  });
}

// 코스 저장 뮤테이션
interface SaveCourseParams {
  courseId: string;
  title: string;
  places: Array<{
    id: string;
    name: string;
    memo: string | null;
    latitude: number | null;
    longitude: number | null;
    start_date?: string | null;
    end_date?: string | null;
    isNew?: boolean;
  }>;
  deletedPlaceIds: string[];
}

export function useSaveCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SaveCourseParams) => {
      const result = await saveCourseChanges(
        params.courseId,
        params.title,
        params.places,
        params.deletedPlaceIds
      );
      if ('error' in result && result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: (_, variables) => {
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(variables.courseId) });
    },
  });
}

// 코스 생성 뮤테이션
interface CreateCourseParams {
  themeId: string;
  title: string;
  position: number;
}

export function useCreateCourse() {
  return useMutation({
    mutationFn: async (params: CreateCourseParams) => {
      const result = await createCourse(params.themeId, params.title, params.position);
      if ('error' in result && result.error) throw new Error(result.error);
      return result;
    },
  });
}

// 코스 삭제 뮤테이션
export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const result = await deleteCourse(courseId);
      if ('error' in result && result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
    },
  });
}
