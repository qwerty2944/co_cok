import { redirect } from 'next/navigation';
import { getUser, signOut } from '@/features/auth';
import { createClient } from '@/shared/api/supabase/server';
import { GroupSection } from './GroupSection';
import { JoinCodeInput } from './JoinCodeInput';
import { ProfileMenu } from './ProfileMenu';

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: groups } = await supabase
    .from('group_members')
    .select(`
      group:groups (
        id,
        name,
        invite_code
      )
    `)
    .eq('user_id', user.id);

  const groupList = groups?.map((item: any) => ({
    id: item.group.id,
    name: item.group.name,
    invite_code: item.group.invite_code,
  })) || [];

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-gray-50">
      <header className="shrink-0 bg-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-pink-500">CO_COK</h1>
          <div className="relative flex items-center gap-4">
            <JoinCodeInput />
            <ProfileMenu
              user={{
                email: user.email || '',
                nickname: profile?.nickname || null,
                is_premium: profile?.is_premium || false,
              }}
              groups={groupList}
              onSignOut={signOut}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden px-4 py-6">
        <div className="mx-auto flex h-full max-w-7xl flex-col">
          <div className="mb-4 shrink-0">
            <h2 className="text-xl font-semibold text-gray-900">
              안녕하세요, {profile?.nickname || '사용자'}님!
            </h2>
            <p className="text-gray-600">
              {profile?.is_premium ? '프리미엄 회원' : '무료 회원'} ·
              사진 {profile?.photo_count || 0}장 저장됨
            </p>
          </div>

          <div className="grid min-h-0 flex-1 gap-6 md:grid-cols-2">
            <GroupSection groups={groupList} />

            <div className="flex flex-col rounded-xl bg-white p-6 shadow">
              <h3 className="mb-4 shrink-0 text-lg font-semibold">최근 데이트 코스</h3>
              <div className="flex flex-1 items-center justify-center text-gray-500">
                <p>아직 기록된 코스가 없어요</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
