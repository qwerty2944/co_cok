'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { createTheme, updateTheme, deleteTheme } from '../api/mandal';

interface Theme {
  id: string;
  name: string;
  position: number;
}

interface ThemeModalProps {
  open: boolean;
  position: number;
  theme?: Theme;
  groupId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export function ThemeModal({ open, position, theme, groupId, onClose, onSuccess }: ThemeModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!theme;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || loading) return;

    setLoading(true);
    setError(null);

    const result = isEdit
      ? await updateTheme(theme!.id, name.trim())
      : await createTheme(groupId, name.trim(), position);

    setLoading(false);

    if ('error' in result && result.error) {
      setError(result.error);
    } else {
      onSuccess();
    }
  }

  async function handleDelete() {
    if (!theme || loading || !confirm('이 테마를 삭제하시겠어요? 테마 안의 모든 코스도 삭제됩니다.')) return;

    setLoading(true);
    const result = await deleteTheme(theme.id);
    setLoading(false);

    if ('error' in result && result.error) {
      setError(result.error);
    } else {
      onSuccess();
    }
  }

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (open) {
      setName(theme?.name || '');
      setError(null);
      setLoading(false);
    }
  }, [open, theme]);

  return (
    <Modal.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Modal.Content>
        <Modal.Header>{isEdit ? '테마 수정' : '새 테마'}</Modal.Header>

        <Modal.Body>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                테마 이름
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 국내여행, 드라이브, 맛집투어"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                autoFocus
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              {isEdit && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex items-center justify-center rounded-lg border border-red-300 px-4 py-3 text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {loading ? <Spinner /> : '삭제'}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-pink-500 px-4 py-3 font-semibold text-white hover:bg-pink-600 disabled:opacity-50"
              >
                {loading ? <Spinner /> : isEdit ? '수정' : '만들기'}
              </button>
            </div>
          </form>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
