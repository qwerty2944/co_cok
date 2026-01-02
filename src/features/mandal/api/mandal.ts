'use server';

import { createClient } from '@/shared/api/supabase/server';

// 테마 생성
export async function createTheme(groupId: string, name: string, position: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: '로그인이 필요합니다' };
  }

  const { data, error } = await supabase
    .from('themes')
    .insert({ group_id: groupId, name, position })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { success: true, theme: data };
}

// 테마 수정
export async function updateTheme(themeId: string, name: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('themes')
    .update({ name })
    .eq('id', themeId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// 테마 삭제
export async function deleteTheme(themeId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('themes')
    .delete()
    .eq('id', themeId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

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
        position,
        date
      )
    `)
    .eq('group_id', groupId)
    .order('position');

  if (error) {
    return { error: error.message };
  }

  return { success: true, themes: data };
}

// 코스 생성
export async function createCourse(themeId: string, title: string, position: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: '로그인이 필요합니다' };
  }

  // 테마에서 group_id 가져오기
  const { data: theme } = await supabase
    .from('themes')
    .select('group_id')
    .eq('id', themeId)
    .single();

  if (!theme) {
    return { error: '테마를 찾을 수 없습니다' };
  }

  const { data, error } = await supabase
    .from('date_courses')
    .insert({
      theme_id: themeId,
      group_id: theme.group_id,
      title,
      position,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { success: true, course: data };
}

// 코스 수정
export async function updateCourse(courseId: string, title: string, description?: string, date?: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('date_courses')
    .update({ title, description, date })
    .eq('id', courseId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// 코스 삭제
export async function deleteCourse(courseId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('date_courses')
    .delete()
    .eq('id', courseId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
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
        address,
        latitude,
        longitude,
        order_index,
        memo
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

// 장소 추가
export async function addPlace(courseId: string, name: string, address?: string, memo?: string) {
  const supabase = await createClient();

  // 현재 최대 order_index 조회
  const { data: maxOrder } = await supabase
    .from('course_places')
    .select('order_index')
    .eq('course_id', courseId)
    .order('order_index', { ascending: false })
    .limit(1)
    .single();

  const newOrderIndex = (maxOrder?.order_index ?? -1) + 1;

  const { data, error } = await supabase
    .from('course_places')
    .insert({
      course_id: courseId,
      name,
      address,
      memo,
      order_index: newOrderIndex,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { success: true, place: data };
}

// 장소 삭제
export async function deletePlace(placeId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('course_places')
    .delete()
    .eq('id', placeId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// 장소 순서 변경
export async function reorderPlaces(courseId: string, placeIds: string[]) {
  const supabase = await createClient();

  // 트랜잭션처럼 순서대로 업데이트
  for (let i = 0; i < placeIds.length; i++) {
    const { error } = await supabase
      .from('course_places')
      .update({ order_index: i })
      .eq('id', placeIds[i])
      .eq('course_id', courseId);

    if (error) {
      return { error: error.message };
    }
  }

  return { success: true };
}

// 코스 일괄 저장 (제목 + 장소 추가/삭제/순서)
interface PlaceData {
  id: string;
  name: string;
  address: string | null;
  memo: string | null;
  latitude: number | null;
  longitude: number | null;
  isNew?: boolean;
}

export async function saveCourseChanges(
  courseId: string,
  title: string,
  places: PlaceData[],
  deletedPlaceIds: string[]
) {
  const supabase = await createClient();

  // 1. 코스 제목 업데이트
  const { error: titleError } = await supabase
    .from('date_courses')
    .update({ title })
    .eq('id', courseId);

  if (titleError) {
    return { error: titleError.message };
  }

  // 2. 삭제된 장소 처리
  if (deletedPlaceIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('course_places')
      .delete()
      .in('id', deletedPlaceIds);

    if (deleteError) {
      return { error: deleteError.message };
    }
  }

  // 3. 새 장소 추가 및 기존 장소 순서 업데이트
  for (let i = 0; i < places.length; i++) {
    const place = places[i];

    if (place.isNew) {
      // 새 장소 추가
      const { error: insertError } = await supabase
        .from('course_places')
        .insert({
          course_id: courseId,
          name: place.name,
          address: place.address,
          memo: place.memo,
          latitude: place.latitude,
          longitude: place.longitude,
          order_index: i,
        });

      if (insertError) {
        return { error: insertError.message };
      }
    } else {
      // 기존 장소 업데이트 (이름, 메모, 순서)
      const { error: updateError } = await supabase
        .from('course_places')
        .update({
          name: place.name,
          memo: place.memo,
          order_index: i,
        })
        .eq('id', place.id);

      if (updateError) {
        return { error: updateError.message };
      }
    }
  }

  return { success: true };
}
