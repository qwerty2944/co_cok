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
