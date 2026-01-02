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
  const [originalName, setOriginalName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const isEdit = !!theme;
  const hasChanges = name !== originalName;

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

  function handleCancel() {
    setName(originalName);
    setIsEditing(false);
  }

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (open) {
      const initialName = theme?.name || '';
      setName(initialName);
      setOriginalName(initialName);
      setError(null);
      setLoading(false);
      setIsEditing(false);
    }
  }, [open, theme]);

  return (
    <Modal.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Modal.Content>
        <Modal.Header>{isEdit ? '테마 상세' : '새 테마'}</Modal.Header>

        <Modal.Body>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">테마 이름</label>
                {isEdit && !isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="p-1 text-gray-400 hover:text-pink-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                    </svg>
                  </button>
                )}
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 국내여행, 드라이브, 맛집투어"
                readOnly={isEdit && !isEditing}
                tabIndex={isEdit && !isEditing ? -1 : 0}
                className={`w-full rounded-lg px-4 py-3 text-gray-900 outline-none ${
                  isEdit && !isEditing
                    ? 'border border-transparent bg-gray-50 cursor-default pointer-events-none'
                    : 'border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500'
                }`}
                autoFocus={!isEdit}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              {isEdit ? (
                isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={loading}
                      className="flex items-center justify-center rounded-lg border border-red-300 px-4 py-3 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {loading ? <Spinner /> : '삭제'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={loading}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !name.trim() || !hasChanges}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-pink-500 px-4 py-3 font-semibold text-white hover:bg-pink-600 disabled:opacity-50"
                    >
                      {loading ? <Spinner /> : '저장'}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full rounded-lg bg-gray-100 px-4 py-3 text-gray-700 hover:bg-gray-200"
                  >
                    닫기
                  </button>
                )
              ) : (
                <>
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
                    {loading ? <Spinner /> : '만들기'}
                  </button>
                </>
              )}
            </div>
          </form>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
