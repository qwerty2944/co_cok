'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMandalStore } from '../store/useMandalStore';
import { ThemeModal } from './ThemeModal';
import { CourseModal } from './CourseModal';

interface Course {
  id: string;
  title: string;
  position: number;
  date: string | null;
}

interface Theme {
  id: string;
  name: string;
  position: number;
  icon: string | null;
  courses: Course[];
}

interface MandalGridProps {
  groupId: string;
  groupName: string;
  themes: Theme[];
  supabaseUrl: string;
}

const THEME_POSITIONS: Record<number, { row: number; col: number }> = {
  1: { row: 1, col: 1 },
  2: { row: 1, col: 4 },
  3: { row: 1, col: 7 },
  4: { row: 4, col: 7 },
  5: { row: 7, col: 7 },
  6: { row: 7, col: 4 },
  7: { row: 7, col: 1 },
  8: { row: 4, col: 1 },
};

const COURSE_OFFSETS = [
  { row: -1, col: -1 },
  { row: -1, col: 0 },
  { row: -1, col: 1 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
];

export function MandalGrid({ groupId, groupName, themes, supabaseUrl }: MandalGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { themeModal, courseModal, openThemeModal, closeThemeModal, openCourseModal, closeCourseModal } = useMandalStore();

  const themeMap = new Map<number, Theme>();
  themes.forEach((t) => themeMap.set(t.position, t));

  // URL에서 코스 ID 읽어서 모달 열기
  useEffect(() => {
    const courseId = searchParams.get('course');
    if (courseId && !courseModal.open) {
      // 코스 ID로 테마와 코스 찾기
      for (const theme of themes) {
        const course = theme.courses.find((c) => c.id === courseId);
        if (course) {
          openCourseModal(theme.id, course.position, course);
          break;
        }
      }
    } else if (!courseId && courseModal.open) {
      closeCourseModal();
    }
  }, [searchParams]);

  // 코스 모달 열기 (URL 업데이트 포함)
  function handleOpenCourseModal(themeId: string, position: number, course?: Course) {
    if (course) {
      router.push(`?course=${course.id}`, { scroll: false });
    }
    openCourseModal(themeId, position, course);
  }

  // 코스 모달 닫기 (URL 업데이트 포함)
  function handleCloseCourseModal() {
    router.push('?', { scroll: false });
    closeCourseModal();
  }

  function renderCell(row: number, col: number) {
    if (row === 4 && col === 4) {
      return (
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-pink-500 to-rose-400 text-white font-bold text-sm rounded-lg shadow-lg">
          {groupName}
        </div>
      );
    }

    for (let themePos = 1; themePos <= 8; themePos++) {
      const pos = THEME_POSITIONS[themePos];
      if (pos.row === row && pos.col === col) {
        const theme = themeMap.get(themePos);
        return (
          <button
            onClick={() => openThemeModal(themePos, theme)}
            className={`flex h-full w-full items-center justify-center rounded-lg text-xs font-medium transition-all ${
              theme
                ? 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200 border-2 border-dashed border-gray-300'
            }`}
          >
            {theme ? theme.name : '+'}
          </button>
        );
      }

      const theme = themeMap.get(themePos);
      if (theme) {
        for (let coursePos = 0; coursePos < 8; coursePos++) {
          const offset = COURSE_OFFSETS[coursePos];
          if (pos.row + offset.row === row && pos.col + offset.col === col) {
            const course = theme.courses.find((c) => c.position === coursePos + 1);
            return (
              <button
                onClick={() => handleOpenCourseModal(theme.id, coursePos + 1, course)}
                className={`flex h-full w-full items-center justify-center rounded-lg text-xs transition-all ${
                  course
                    ? 'bg-white text-gray-700 hover:bg-pink-50 shadow-sm border border-pink-100'
                    : 'bg-gray-50 text-gray-300 hover:bg-gray-100'
                }`}
              >
                {course ? course.title : ''}
              </button>
            );
          }
        }
      }
    }

    return <div className="bg-gray-50 rounded-lg" />;
  }

  function handleSuccess() {
    closeThemeModal();
    handleCloseCourseModal();
    router.refresh();
  }

  return (
    <>
      <div className="aspect-square h-full max-h-full w-auto max-w-full">
        <div className="grid grid-cols-9 grid-rows-9 gap-1 h-full">
          {Array.from({ length: 81 }).map((_, i) => {
            const row = Math.floor(i / 9);
            const col = i % 9;
            return (
              <div key={i} className="aspect-square">
                {renderCell(row, col)}
              </div>
            );
          })}
        </div>
      </div>

      <ThemeModal
        open={themeModal.open}
        position={themeModal.position}
        theme={themeModal.theme}
        groupId={groupId}
        onClose={closeThemeModal}
        onSuccess={handleSuccess}
      />

      <CourseModal
        open={courseModal.open}
        themeId={courseModal.themeId}
        position={courseModal.position}
        course={courseModal.course}
        onClose={handleCloseCourseModal}
        onSuccess={handleSuccess}
        supabaseUrl={supabaseUrl}
      />
    </>
  );
}
