'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/shared/ui/Modal';
import { leaveGroup } from '@/features/groups';

interface Group {
  id: string;
  name: string;
}

interface ProfileMenuProps {
  user: {
    email: string;
    nickname: string | null;
    is_premium: boolean;
  };
  groups: Group[];
  onSignOut: () => void;
}

export function ProfileMenu({ user, groups, onSignOut }: ProfileMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showGroupManage, setShowGroupManage] = useState(false);
  const [leaving, setLeaving] = useState<string | null>(null);

  async function handleLeaveGroup(groupId: string, groupName: string) {
    if (!confirm(`"${groupName}" 그룹을 떠나시겠어요?`)) return;

    setLeaving(groupId);
    const result = await leaveGroup(groupId);
    setLeaving(null);

    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || '그룹 탈퇴에 실패했습니다');
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-pink-600 hover:bg-pink-200 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-12 z-50 w-64 rounded-xl bg-white p-4 shadow-lg border border-gray-100">
            <div className="mb-4 pb-4 border-b">
              <p className="font-medium text-gray-900">{user.nickname || '사용자'}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${
                user.is_premium ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {user.is_premium ? '프리미엄' : '무료 회원'}
              </span>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => {
                  setOpen(false);
                  setShowGroupManage(true);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-gray-700 hover:bg-gray-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                그룹 관리
              </button>

              <button
                onClick={() => {
                  setOpen(false);
                  onSignOut();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                로그아웃
              </button>
            </div>
          </div>
        </>
      )}

      <Modal.Root open={showGroupManage} onOpenChange={setShowGroupManage}>
        <Modal.Content className="max-w-sm">
          <Modal.Header>그룹 관리</Modal.Header>
          <Modal.Body>
            {groups.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                가입한 그룹이 없어요
              </p>
            ) : (
              <div className="space-y-2">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                  >
                    <span className="font-medium text-gray-900">{group.name}</span>
                    <button
                      onClick={() => handleLeaveGroup(group.id, group.name)}
                      disabled={leaving === group.id}
                      className="rounded-lg px-3 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {leaving === group.id ? '처리 중...' : '탈퇴'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowGroupManage(false)}
              className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-700 hover:bg-gray-50"
            >
              닫기
            </button>
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>
    </>
  );
}
