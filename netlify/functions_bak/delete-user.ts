/**
 * LISENS - ユーザー削除 Netlify Function
 * 
 * usersテーブルとSupabase Auth の両方からユーザーを削除する。
 * 管理者のみ実行可能。
 * 
 * DELETE /api/delete-user
 * Body: { userId }
 * Headers: { Authorization: Bearer <supabase_access_token> }
 */
import { createClient } from '@supabase/supabase-js';

export default async (req: Request) => {
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'サーバー設定エラー' }), { status: 500, headers });
    }

    // 認証チェック
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: '認証が必要です' }), { status: 401, headers });
    }

    const accessToken = authHeader.replace('Bearer ', '');
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // リクエストユーザーの権限確認
    const { data: { user: requestingUser }, error: authError } = await adminClient.auth.getUser(accessToken);
    if (authError || !requestingUser) {
      return new Response(JSON.stringify({ error: '認証に失敗しました' }), { status: 401, headers });
    }

    const { data: requestingAppUser } = await adminClient
      .from('users')
      .select('id, role')
      .eq('auth_uid', requestingUser.id)
      .single();

    if (!requestingAppUser || requestingAppUser.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'この操作は管理者のみ実行できます' }), { status: 403, headers });
    }

    // リクエストボディ解析
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId は必須です' }), { status: 400, headers });
    }

    // 自分自身は削除不可
    if (userId === requestingAppUser.id) {
      return new Response(JSON.stringify({ error: '自分自身を削除することはできません' }), { status: 400, headers });
    }

    // 削除対象のユーザー情報を取得
    const { data: targetUser } = await adminClient
      .from('users')
      .select('id, name, auth_uid')
      .eq('id', userId)
      .single();

    if (!targetUser) {
      return new Response(JSON.stringify({ error: 'ユーザーが見つかりません' }), { status: 404, headers });
    }

    // usersテーブルから削除
    const { error: deleteError } = await adminClient.from('users').delete().eq('id', userId);
    if (deleteError) {
      console.error('ユーザー削除エラー:', deleteError);
      return new Response(JSON.stringify({ error: 'ユーザーの削除に失敗しました' }), { status: 500, headers });
    }

    // Supabase Auth からも削除（auth_uid がある場合）
    if (targetUser.auth_uid) {
      const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(targetUser.auth_uid);
      if (authDeleteError) {
        console.error('Auth ユーザー削除エラー:', authDeleteError);
        // usersテーブルは既に削除済み。Auth側の削除失敗はログのみ
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: `${targetUser.name}さんを削除しました` }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('予期せぬエラー:', error);
    return new Response(JSON.stringify({ error: 'サーバーエラーが発生しました' }), { status: 500, headers });
  }
};

export const config = {
  path: '/api/delete-user',
};
