'use server';

import { createClient } from '@/shared/api/supabase/server';

// 장소 사진 목록 조회
export async function getPlacePhotos(placeId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('place_photos')
    .select('*')
    .eq('place_id', placeId)
    .order('created_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { success: true, photos: data };
}

// 사진 삭제
export async function deletePhoto(photoId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: '로그인이 필요합니다' };
  }

  // 사진 정보 조회
  const { data: photo } = await supabase
    .from('place_photos')
    .select('storage_path, thumbnail_path')
    .eq('id', photoId)
    .single();

  if (!photo) {
    return { error: '사진을 찾을 수 없습니다' };
  }

  // Storage에서 파일 삭제
  const filesToDelete = [photo.storage_path];
  if (photo.thumbnail_path) {
    filesToDelete.push(photo.thumbnail_path);
  }

  await supabase.storage
    .from('place-photos')
    .remove(filesToDelete);

  // DB에서 삭제
  const { error } = await supabase
    .from('place_photos')
    .delete()
    .eq('id', photoId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// 장소별 사진 개수 조회
export async function getPlacePhotosCounts(placeIds: string[]) {
  if (placeIds.length === 0) return { success: true, counts: {} };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('place_photos')
    .select('place_id')
    .in('place_id', placeIds);

  if (error) {
    return { error: error.message };
  }

  // 개수 집계
  const counts: Record<string, number> = {};
  data.forEach((item) => {
    counts[item.place_id] = (counts[item.place_id] || 0) + 1;
  });

  return { success: true, counts };
}
