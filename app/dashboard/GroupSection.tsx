'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreateGroupModal, InviteModal } from '@/features/groups';

interface Group {
  id: string;
  name: string;
  invite_code: string;
}

interface GroupSectionProps {
  groups: Group[];
}

export function GroupSection({ groups: initialGroups }: GroupSectionProps) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inviteGroup, setInviteGroup] = useState<Group | null>(null);

  function handleGroupCreated() {
    router.refresh();
  }

  return (
    <>
      <div className="rounded-xl bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">내 그룹</h3>
          {initialGroups.length > 0 && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-sm text-pink-500 hover:text-pink-600"
            >
              + 새 그룹
            </button>
          )}
        </div>

        {initialGroups.length > 0 ? (
          <div className="space-y-3">
            {initialGroups.map((group) => (
              <div
                key={group.id}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 p-4 text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:from-pink-600 hover:to-rose-500"
              >
                <div className="absolute -right-4 -top-4 text-6xl opacity-20 transition-transform duration-300 group-hover:scale-110">💕</div>
                <div className="relative flex items-center justify-between">
                  <Link href={`/groups/${group.id}`} className="flex-1">
                    <p className="text-lg font-bold">{group.name}</p>
                    <p className="text-sm text-pink-100">함께하는 우리의 기록</p>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setInviteGroup(group);
                    }}
                    className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm transition hover:bg-white/30"
                  >
                    초대하기
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <p className="mb-4">아직 그룹이 없어요</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-lg bg-pink-500 px-4 py-2 text-white hover:bg-pink-600"
            >
              그룹 만들기
            </button>
          </div>
        )}
      </div>

      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleGroupCreated}
      />

      {inviteGroup && (
        <InviteModal
          groupId={inviteGroup.id}
          groupName={inviteGroup.name}
          isOpen={true}
          onClose={() => setInviteGroup(null)}
        />
      )}
    </>
  );
}
