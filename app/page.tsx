import Link from 'next/link';
import { createClient } from '@/shared/api/supabase/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100">
      <main className="text-center px-4">
        <h1 className="mb-4 text-5xl font-bold text-gray-900">
          CO_COK
        </h1>
        <p className="mb-8 text-xl text-gray-600">
          연인과 함께하는 데이트 코스 기록
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="rounded-full bg-pink-500 px-8 py-3 font-semibold text-white transition hover:bg-pink-600"
          >
            시작하기
          </Link>
          <Link
            href="/login"
            className="rounded-full border-2 border-pink-500 px-8 py-3 font-semibold text-pink-500 transition hover:bg-pink-50"
          >
            로그인
          </Link>
        </div>

        <div className="mt-16 grid max-w-2xl gap-8 text-left sm:grid-cols-3">
          <div className="rounded-xl bg-white/80 p-6 shadow-lg">
            <div className="mb-3 text-3xl">💑</div>
            <h3 className="mb-2 font-semibold text-gray-900">커플 그룹</h3>
            <p className="text-sm text-gray-600">
              연인과 함께 그룹을 만들고 데이트 코스를 공유하세요
            </p>
          </div>

          <div className="rounded-xl bg-white/80 p-6 shadow-lg">
            <div className="mb-3 text-3xl">📸</div>
            <h3 className="mb-2 font-semibold text-gray-900">사진 기록</h3>
            <p className="text-sm text-gray-600">
              특별한 순간들을 사진으로 남기고 추억을 간직하세요
            </p>
          </div>

          <div className="rounded-xl bg-white/80 p-6 shadow-lg">
            <div className="mb-3 text-3xl">🗺️</div>
            <h3 className="mb-2 font-semibold text-gray-900">코스 관리</h3>
            <p className="text-sm text-gray-600">
              다녀온 데이트 코스를 정리하고 다음 데이트를 계획하세요
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
