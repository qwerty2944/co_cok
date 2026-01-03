'use server';

import { createClient } from '@/shared/api/supabase/server';
import { LIMITS } from '@/shared/config/supabase';
import { validateInviteCode } from '@/entities/groups';

// 6자리 초대 코드 생성 (혼동되는 문자 제외)
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 그룹 생성
export async function createGroup(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: '로그인이 필요합니다' };
  }

  const name = formData.get('name') as string;

  if (!name || name.trim().length === 0) {
    return { error: '그룹 이름을 입력해주세요' };
  }

  // 유저 프리미엄 상태 확인
  const { data: profile } = await supabase
    .from('users')
    .select('is_premium')
    .eq('id', user.id)
    .single();

  // 현재 그룹 개수 확인
  const { count: groupCount } = await supabase
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const maxGroups = profile?.is_premium ? LIMITS.PREMIUM.maxGroups : LIMITS.FREE.maxGroups;

  if ((groupCount || 0) >= maxGroups) {
    return { error: `무료 회원은 최대 ${LIMITS.FREE.maxGroups}개의 그룹만 만들 수 있어요` };
  }

  // 그룹 생성
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({ name: name.trim() })
    .select()
    .single();

  if (groupError) {
    return { error: groupError.message };
  }

  // 생성자를 owner로 추가
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({
      group_id: group.id,
      user_id: user.id,
      role: 'owner',
    });

  if (memberError) {
    return { error: memberError.message };
  }

  return { success: true, groupId: group.id };
}

// 5분 유효 초대 코드 생성
export async function generateGroupInvite(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: '로그인이 필요합니다' };
  }

  // 그룹 멤버인지 확인
  const { data: membership } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return { error: '그룹 멤버만 초대 코드를 생성할 수 있어요' };
  }

  // 코드 생성 (중복 시 재시도)
  let attempts = 0;
  while (attempts < 5) {
    const code = generateInviteCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5분 후

    const { data, error } = await supabase
      .from('group_invites')
      .insert({
        group_id: groupId,
        code,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (!error && data) {
      return {
        success: true,
        code: data.code,
        expiresAt: data.expires_at,
      };
    }

    attempts++;
  }

  return { error: '초대 코드 생성에 실패했어요. 다시 시도해주세요.' };
}

// 초대 수락 및 그룹 참가
export async function acceptInvite(code: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: '로그인이 필요합니다', requiresAuth: true };
  }

  // 초대 코드 검증
  const validation = await validateInviteCode(code);
  if ('error' in validation) {
    return validation;
  }

  // 이미 멤버인지 확인
  const { data: existingMembership } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', validation.group.id)
    .eq('user_id', user.id)
    .single();

  if (existingMembership) {
    return { error: '이미 이 그룹의 멤버예요', groupId: validation.group.id };
  }

  // 유저 그룹 제한 확인
  const { data: profile } = await supabase
    .from('users')
    .select('is_premium')
    .eq('id', user.id)
    .single();

  const { count: userGroupCount } = await supabase
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const maxGroups = profile?.is_premium ? LIMITS.PREMIUM.maxGroups : LIMITS.FREE.maxGroups;

  if ((userGroupCount || 0) >= maxGroups) {
    return { error: `무료 회원은 최대 ${LIMITS.FREE.maxGroups}개의 그룹에만 참여할 수 있어요` };
  }

  // 그룹 참가
  const { error: joinError } = await supabase
    .from('group_members')
    .insert({
      group_id: validation.group.id,
      user_id: user.id,
      role: 'member',
    });

  if (joinError) {
    return { error: joinError.message };
  }

  // 초대 사용 처리
  await supabase
    .from('group_invites')
    .update({
      used_by: user.id,
      used_at: new Date().toISOString(),
    })
    .eq('id', validation.inviteId);

  return { success: true, groupId: validation.group.id, groupName: validation.group.name };
}

// 그룹 탈퇴
export async function leaveGroup(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: '로그인이 필요합니다' };
  }

  // 멤버십 확인
  const { data: membership } = await supabase
    .from('group_members')
    .select('id, role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return { error: '이 그룹의 멤버가 아닙니다' };
  }

  // owner인 경우 다른 멤버가 있으면 탈퇴 불가
  if (membership.role === 'owner') {
    const { count: memberCount } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId);

    if ((memberCount || 0) > 1) {
      return { error: '그룹장은 다른 멤버가 있을 때 탈퇴할 수 없어요. 먼저 그룹장을 위임하거나 다른 멤버를 내보내주세요.' };
    }

    // 혼자면 그룹도 삭제
    const { error: deleteError } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (deleteError) {
      return { error: deleteError.message };
    }

    return { success: true, groupDeleted: true };
  }

  // 일반 멤버는 바로 탈퇴
  const { error: leaveError } = await supabase
    .from('group_members')
    .delete()
    .eq('id', membership.id);

  if (leaveError) {
    return { error: leaveError.message };
  }

  return { success: true };
}
