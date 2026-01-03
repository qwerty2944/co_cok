'use server';

import { createClient } from '@/shared/api/supabase/server';

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

// 사진 캡션 수정
export async function updatePhotoCaption(photoId: string, caption: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: '로그인이 필요합니다' };
  }

  const { error } = await supabase
    .from('place_photos')
    .update({ caption: caption.trim() || null })
    .eq('id', photoId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
