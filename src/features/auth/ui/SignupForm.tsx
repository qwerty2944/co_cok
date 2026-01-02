'use client';

import { useState } from 'react';
import { signUp } from '../api/auth';

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await signUp(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
          닉네임
        </label>
        <input
          id="nickname"
          name="nickname"
          type="text"
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="닉네임을 입력하세요"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="email@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="6자 이상 입력하세요"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-pink-500 px-4 py-3 font-semibold text-white transition hover:bg-pink-600 disabled:opacity-50"
      >
        {loading ? '가입 중...' : '회원가입'}
      </button>
    </form>
  );
}
