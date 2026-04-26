// ============================================================
// Supabase 클라이언트 (브라우저용) - 미연결 시 null 반환
// ============================================================
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supabase가 설정되어 있으면 클라이언트 생성, 아니면 null
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('PLACEHOLDER')
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const isSupabaseConnected = !!supabase;
