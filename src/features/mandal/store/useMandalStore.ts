'use client';

import { create } from 'zustand';

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

interface ThemeModalState {
  open: boolean;
  position: number;
  theme?: Theme;
}

interface CourseModalState {
  open: boolean;
  themeId: string;
  position: number;
  course?: Course;
}

interface MandalState {
  themeModal: ThemeModalState;
  courseModal: CourseModalState;

  openThemeModal: (position: number, theme?: Theme) => void;
  closeThemeModal: () => void;

  openCourseModal: (themeId: string, position: number, course?: Course) => void;
  closeCourseModal: () => void;
}

export const useMandalStore = create<MandalState>((set) => ({
  themeModal: { open: false, position: 0 },
  courseModal: { open: false, themeId: '', position: 0 },

  openThemeModal: (position, theme) =>
    set({ themeModal: { open: true, position, theme } }),

  closeThemeModal: () =>
    set({ themeModal: { open: false, position: 0 } }),

  openCourseModal: (themeId, position, course) =>
    set({ courseModal: { open: true, themeId, position, course } }),

  closeCourseModal: () =>
    set({ courseModal: { open: false, themeId: '', position: 0 } }),
}));
