'use server';

import { createClient } from '@/shared/api/supabase/server';

// 그룹의 테마 목록 조회
export async function getThemes(groupId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('themes')
    .select(`
      *,
      courses:date_courses (
        id,
        title,
        position
      )
    `)
    .eq('group_id', groupId)
    .order('position');

  if (error) {
    return { error: error.message };
  }

  return { success: true, themes: data };
}

// 코스 상세 조회 (장소 + 사진)
export async function getCourseDetail(courseId: string) {
  const supabase = await createClient();

  const { data: course, error: courseError } = await supabase
    .from('date_courses')
    .select(`
      *,
      places:course_places (
        id,
        name,
        latitude,
        longitude,
        order_index,
        memo,
        start_date,
        end_date
      ),
      photos (
        id,
        storage_path,
        caption
      )
    `)
    .eq('id', courseId)
    .single();

  if (courseError) {
    return { error: courseError.message };
  }

  // 장소를 order_index로 정렬
  if (course.places) {
    course.places.sort((a: any, b: any) => a.order_index - b.order_index);
  }

  return { success: true, course };
}
