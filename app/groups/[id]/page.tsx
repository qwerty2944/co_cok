import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/shared/api/supabase/server';
import { getUser } from '@/features/auth';
import { MandalGrid } from '@/features/mandal';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GroupPage({ params }: Props) {
  const { id } = await params;
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();

  // 그룹 정보 조회
  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .single();

  if (!group) {
    redirect('/dashboard');
  }

  // 멤버인지 확인
  const { data: membership } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', id)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    redirect('/dashboard');
  }

  // 테마와 코스 조회
  const { data: themes } = await supabase
    .from('themes')
    .select(`
      *,
      courses:date_courses (
        id,
        title,
        position,
        date
      )
    `)
    .eq('group_id', id)
    .order('position');

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
            ← 대시보드
          </Link>
          <h1 className="text-xl font-bold text-pink-500">{group.name}</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <MandalGrid groupId={id} groupName={group.name} themes={themes || []} />
      </main>
    </div>
  );
}
