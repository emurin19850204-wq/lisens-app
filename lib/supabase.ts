/**
 * LISENS - Supabaseクライアント
 * 
 * ブラウザ側で使用するSupabaseクライアントを初期化する。
 * 環境変数から接続情報を取得する。
 * ビルド時（SSG）には環境変数がないため、nullを返す。
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Supabaseクライアント（ブラウザ用、ビルド時はnull） */
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

/**
 * Supabaseクライアントを取得（null安全）
 * クライアント側で使用する際にnullチェック済みのインスタンスを返す
 */
export function getSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabaseクライアントが初期化されていません。環境変数を確認してください。'
    );
  }
  return supabase;
}
