'use server';

import { createClient } from '@/shared/api/supabase/server';
import { redirect } from 'next/navigation';

// Supabase 에러 메시지 한글 변환
function translateAuthError(message: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않아요',
    'Email not confirmed': '이메일 인증이 필요해요. 메일함을 확인해주세요',
    'User already registered': '이미 가입된 이메일이에요',
    'Password should be at least 6 characters': '비밀번호는 6자 이상이어야 해요',
    'Unable to validate email address: invalid format': '올바른 이메일 형식이 아니에요',
    'Email rate limit exceeded': '너무 많은 요청이 있었어요. 잠시 후 다시 시도해주세요',
    'For security purposes, you can only request this once every 60 seconds': '보안을 위해 60초에 한 번만 요청할 수 있어요',
  };

  return errorMap[message] || '로그인에 실패했어요. 다시 시도해주세요';
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const nickname = formData.get('nickname') as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nickname,
      },
    },
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  // users 테이블에 프로필 생성
  if (data.user) {
    const { error: profileError } = await supabase.from('users').insert({
      id: data.user.id,
      email,
      nickname,
    });

    if (profileError) {
      return { error: profileError.message };
    }
  }

  redirect('/dashboard');
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  redirect('/dashboard');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
