'use server';

import { createClient } from '@/shared/api/supabase/server';

// 초대 코드 유효성 검증
export async function validateInviteCode(code: string) {
  const supabase = await createClient();

  const { data: invite, error } = await supabase
    .from('group_invites')
    .select(`
      id,
      group_id,
      expires_at,
      used_by,
      group:groups (
        id,
        name,
        max_members
      )
    `)
    .eq('code', code.toUpperCase())
    .single();

  if (error || !invite) {
    return { error: '유효하지 않은 초대 코드예요' };
  }

  if (new Date(invite.expires_at) < new Date()) {
    return { error: '초대 코드가 만료되었어요' };
  }

  if (invite.used_by) {
    return { error: '이미 사용된 초대 코드예요' };
  }

  // 현재 멤버 수 확인
  const { count: memberCount } = await supabase
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', invite.group_id);

  const group = invite.group as unknown as { id: string; name: string; max_members: number };

  if ((memberCount || 0) >= group.max_members) {
    return { error: '그룹이 가득 찼어요' };
  }

  return {
    success: true,
    inviteId: invite.id,
    group: {
      id: group.id,
      name: group.name,
    },
  };
}
