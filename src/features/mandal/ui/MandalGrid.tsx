'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
}

// 테마 위치 매핑 (3x3 영역의 중앙)
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

// 각 테마의 코스 위치 (테마 중심 기준 8방향)
const COURSE_OFFSETS = [
  { row: -1, col: -1 }, // 좌상
  { row: -1, col: 0 },  // 상
  { row: -1, col: 1 },  // 우상
  { row: 0, col: -1 },  // 좌
  { row: 0, col: 1 },   // 우
  { row: 1, col: -1 },  // 좌하
  { row: 1, col: 0 },   // 하
  { row: 1, col: 1 },   // 우하
];

export function MandalGrid({ groupId, groupName, themes }: MandalGridProps) {
  const router = useRouter();
  const [themeModal, setThemeModal] = useState<{ open: boolean; position: number; theme?: Theme }>({
    open: false,
    position: 0,
  });
  const [courseModal, setCourseModal] = useState<{ open: boolean; themeId: string; position: number; course?: Course }>({
    open: false,
    themeId: '',
    position: 0,
  });

  // 테마를 position으로 매핑
  const themeMap = new Map<number, Theme>();
  themes.forEach((t) => themeMap.set(t.position, t));

  // 셀 렌더링
  function renderCell(row: number, col: number) {
    // 중앙 (팀 이름)
    if (row === 4 && col === 4) {
      return (
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-pink-500 to-rose-400 text-white font-bold text-sm rounded-lg shadow-lg">
          {groupName}
        </div>
      );
    }

    // 테마 위치인지 확인
    for (let themePos = 1; themePos <= 8; themePos++) {
      const pos = THEME_POSITIONS[themePos];
      if (pos.row === row && pos.col === col) {
        const theme = themeMap.get(themePos);
        return (
          <button
            onClick={() => setThemeModal({ open: true, position: themePos, theme })}
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

      // 코스 위치인지 확인
      const theme = themeMap.get(themePos);
      if (theme) {
        for (let coursePos = 0; coursePos < 8; coursePos++) {
          const offset = COURSE_OFFSETS[coursePos];
          if (pos.row + offset.row === row && pos.col + offset.col === col) {
            const course = theme.courses.find((c) => c.position === coursePos + 1);
            return (
              <button
                onClick={() => setCourseModal({ open: true, themeId: theme.id, position: coursePos + 1, course })}
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

    // 빈 셀 (테마가 없는 영역)
    return <div className="bg-gray-50 rounded-lg" />;
  }

  return (
    <>
      <div className="aspect-square w-full max-w-2xl mx-auto">
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
        onClose={() => setThemeModal({ open: false, position: 0 })}
        onSuccess={() => {
          setThemeModal({ open: false, position: 0 });
          router.refresh();
        }}
      />

      <CourseModal
        open={courseModal.open}
        themeId={courseModal.themeId}
        position={courseModal.position}
        course={courseModal.course}
        onClose={() => setCourseModal({ open: false, themeId: '', position: 0 })}
        onSuccess={() => {
          setCourseModal({ open: false, themeId: '', position: 0 });
          router.refresh();
        }}
      />
    </>
  );
}
