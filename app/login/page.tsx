import Link from 'next/link';
import { LoginForm } from '@/features/auth';

export default function LoginPage() {
  return (
    <div className="flex h-[100dvh] items-center justify-center overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">CO_COK</h1>
            <p className="mt-2 text-gray-600">데이트 코스를 함께 기록해요</p>
          </div>

          <LoginForm />

          <div className="mt-6 text-center text-sm text-gray-600">
            계정이 없으신가요?{' '}
            <Link href="/signup" className="font-semibold text-pink-500 hover:text-pink-600">
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
