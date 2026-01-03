'use client';

import { useRouter } from 'next/navigation';
import { acceptInvite, useJoinCodeStore } from '@/features/groups';
import { Modal } from '@/shared/ui/Modal';

export function JoinCodeInput() {
  const router = useRouter();
  const { code, loading, error, isOpen, setCode, setLoading, setError, setIsOpen, reset } = useJoinCodeStore();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    const result = await acceptInvite(code.trim().toUpperCase());

    if ('error' in result && result.error) {
      setError(result.error);
      setLoading(false);
    } else if ('success' in result && result.success) {
      reset();
      router.refresh();
    }
  }

  function handleClose() {
    reset();
  }

  return (
    <Modal.Root open={isOpen} onOpenChange={setIsOpen}>
      <Modal.Trigger className="rounded-lg bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600">
        초대코드 입력
      </Modal.Trigger>

      <Modal.Content>
        <Modal.Header>그룹 참가하기</Modal.Header>

        <Modal.Body>
          <p className="mb-4 text-sm text-gray-600">
            파트너에게 받은 6자리 초대코드를 입력하세요.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="ABC123"
                maxLength={6}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-center font-mono text-2xl tracking-[0.5em] uppercase focus:border-pink-500 focus:outline-none"
                autoFocus
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Modal.Close className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-50">
                취소
              </Modal.Close>
              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="flex-1 rounded-lg bg-pink-500 px-4 py-3 font-semibold text-white transition hover:bg-pink-600 disabled:opacity-50"
              >
                {loading ? '참가 중...' : '참가하기'}
              </button>
            </div>
          </form>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
