import Link from 'next/link';
import { SignupForm } from '@/features/auth';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">CO_COK</h1>
            <p className="mt-2 text-gray-600">함께 특별한 순간을 기록하세요</p>
          </div>

          <SignupForm />

          <div className="mt-6 text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="font-semibold text-pink-500 hover:text-pink-600">
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
