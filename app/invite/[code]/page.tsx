import { redirect } from 'next/navigation';
import { createClient } from '@/shared/api/supabase/server';
import { validateInviteCode } from '@/entities/groups';
import { acceptInvite } from '@/features/groups';
import { InviteAcceptClient } from './InviteAcceptClient';

interface Props {
  params: Promise<{ code: string }>;
}

export default async function InvitePage({ params }: Props) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 초대 코드 검증
  const validation = await validateInviteCode(code);

  if ('error' in validation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mb-4 text-6xl">😢</div>
          <h1 className="mb-2 text-xl font-bold text-gray-900">초대 코드 오류</h1>
          <p className="mb-6 text-gray-600">{validation.error}</p>
          <a
            href="/dashboard"
            className="inline-block rounded-lg bg-pink-500 px-6 py-3 font-semibold text-white hover:bg-pink-600"
          >
            대시보드로 이동
          </a>
        </div>
      </div>
    );
  }

  // 로그인 상태면 자동 수락
  if (user) {
    const result = await acceptInvite(code);

    if ('success' in result && result.success && 'groupName' in result) {
      redirect(`/dashboard?joined=${encodeURIComponent(result.groupName!)}`);
    }

    // 에러 케이스 (이미 멤버 등)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mb-4 text-6xl">💕</div>
          <h1 className="mb-2 text-xl font-bold text-gray-900">{validation.group.name}</h1>
          <p className="mb-6 text-gray-600">
            {result.error || '그룹 참여 중 오류가 발생했어요'}
          </p>
          <a
            href="/dashboard"
            className="inline-block rounded-lg bg-pink-500 px-6 py-3 font-semibold text-white hover:bg-pink-600"
          >
            대시보드로 이동
          </a>
        </div>
      </div>
    );
  }

  // 비로그인 상태 - 로그인/가입 안내
  return <InviteAcceptClient code={code} groupName={validation.group.name} />;
}
