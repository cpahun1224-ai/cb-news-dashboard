// ============================================================
// Supabase 서버 클라이언트 (API Route용)
// ============================================================
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createServerClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceKey ||
      supabaseUrl.includes('PLACEHOLDER') || supabaseServiceKey.includes('PLACEHOLDER')) {
    throw new Error('DEMO_MODE'); // 데모 모드 신호
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

export const isSupabaseConfigured =
  !!supabaseUrl && !!supabaseServiceKey &&
  !supabaseUrl.includes('PLACEHOLDER') &&
  !supabaseServiceKey.includes('PLACEHOLDER');
