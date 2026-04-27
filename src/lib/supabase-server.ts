// ============================================================
// Supabase 서버 클라이언트 (API Route용)
// ============================================================
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createServerClient(): SupabaseClient {
  // URL이 없거나 플레이스홀더면 데모 모드
  if (!supabaseUrl || supabaseUrl.includes('PLACEHOLDER')) {
    throw new Error('DEMO_MODE');
  }
  // 서비스 롤 키 우선, 없으면 anon 키로 폴백
  const key =
    supabaseServiceKey && !supabaseServiceKey.includes('PLACEHOLDER')
      ? supabaseServiceKey
      : supabaseAnonKey;
  if (!key) {
    throw new Error('DEMO_MODE');
  }
  return createClient(supabaseUrl, key, {
    auth: { persistSession: false },
  });
}

export const isSupabaseConfigured =
  !!supabaseUrl &&
  !supabaseUrl.includes('PLACEHOLDER') &&
  !!(
    (supabaseServiceKey && !supabaseServiceKey.includes('PLACEHOLDER')) ||
    supabaseAnonKey
  );
