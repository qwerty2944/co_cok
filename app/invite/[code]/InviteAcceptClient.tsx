'use client';

import Link from 'next/link';

interface Props {
  code: string;
  groupName: string;
}

export function InviteAcceptClient({ code, groupName }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="mb-4 text-6xl">💕</div>
        <h1 className="mb-2 text-xl font-bold text-gray-900">그룹 초대</h1>
        <p className="mb-2 text-gray-600">
          <span className="font-semibold text-pink-500">{groupName}</span> 그룹에 초대받으셨어요!
        </p>
        <p className="mb-6 text-sm text-gray-500">
          로그인하거나 회원가입하면 자동으로 그룹에 참여돼요.
        </p>

        <div className="space-y-3">
          <Link
            href={`/login?redirect=/invite/${code}`}
            className="block w-full rounded-lg bg-pink-500 px-4 py-3 font-semibold text-white transition hover:bg-pink-600"
          >
            로그인
          </Link>
          <Link
            href={`/signup?redirect=/invite/${code}`}
            className="block w-full rounded-lg border border-pink-500 px-4 py-3 font-semibold text-pink-500 transition hover:bg-pink-50"
          >
            회원가입
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          초대 코드는 5분간 유효해요
        </p>
      </div>
    </div>
  );
}
