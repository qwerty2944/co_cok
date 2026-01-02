export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
};

// 무료/유료 사용자 제한
export const LIMITS = {
  FREE: {
    maxGroups: 1,
    maxGroupMembers: 2,
    maxPhotos: 50,
  },
  PREMIUM: {
    maxGroups: Infinity,
    maxGroupMembers: Infinity,
    maxPhotos: 1000,
  },
} as const;
