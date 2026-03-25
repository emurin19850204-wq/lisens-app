/**
 * LISENS - Supabaseクライアント
 * 
 * ブラウザ側で使用するSupabaseクライアントを初期化する。
 * 環境変数から接続情報を取得する。
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabaseの環境変数が設定されていません。.env.local に NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。'
  );
}

/** Supabaseクライアント（ブラウザ用） */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
