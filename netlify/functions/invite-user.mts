/**
 * LISENS - ユーザー招待 Netlify Function
 * 
 * 管理者がユーザーを招待するためのサーバーレス関数。
 * Supabase Admin APIを使用して招待メールを送信し、
 * usersテーブルにレコードを作成する。
 * 
 * POST /api/invite-user
 * Body: { email, name, role, organizationId, hireDate? }
 * Headers: { Authorization: Bearer <supabase_access_token> }
 */
import { createClient } from '@supabase/supabase-js';

// Netlify Function v2 形式
export default async (req: Request) => {
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 環境変数チェック
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'サーバー設定エラー: 環境変数が不足しています' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // 認証トークンの検証（リクエストした人がadmin/education_managerか確認）
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: '認証が必要です' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const accessToken = authHeader.replace('Bearer ', '');

    // リクエストユーザーの認証・権限確認
    const userClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: { user: requestingUser }, error: authError } = await userClient.auth.getUser(accessToken);

    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: '認証に失敗しました' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // リクエストユーザーのロールを確認
    const { data: requestingAppUser } = await userClient
      .from('users')
      .select('role')
      .eq('auth_uid', requestingUser.id)
      .single();

    if (!requestingAppUser || !['admin', 'education_manager'].includes(requestingAppUser.role)) {
      return new Response(
        JSON.stringify({ error: 'この操作を行う権限がありません' }),
        { status: 403, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // リクエストボディの解析
    const body = await req.json();
    const { email, name, role, organizationId, hireDate } = body;

    // バリデーション
    if (!email || !name || !role || !organizationId) {
      return new Response(
        JSON.stringify({ error: '必須項目が不足しています（email, name, role, organizationId）' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const validRoles = ['admin', 'education_manager', 'evaluator', 'store_manager', 'learner'];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: '無効なロールです' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // 管理者用Supabaseクライアント（service_role）
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // メール重複チェック
    const { data: existingUser } = await adminClient
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'このメールアドレスは既に登録されています' }),
        { status: 409, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Supabase Auth に招待メールを送信（パスワード設定ページにリダイレクト）
    const siteUrl = process.env.SITE_URL || 'https://element-lisense.netlify.app';
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { name, role },
      redirectTo: `${siteUrl}/auth/callback`,
    });

    if (inviteError) {
      console.error('招待メール送信エラー:', inviteError);
      return new Response(
        JSON.stringify({ error: `招待メールの送信に失敗しました: ${inviteError.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // usersテーブルにレコードを作成（auth_uidを紐付け）
    const userId = `user-${Date.now()}`;
    const { error: insertError } = await adminClient.from('users').insert({
      id: userId,
      email,
      name,
      role,
      organization_id: organizationId,
      current_level: role === 'learner' ? 'lv1' : 'lv5',
      tracks: '{}',
      hire_date: hireDate || null,
      auth_uid: inviteData.user?.id || null,
    });

    if (insertError) {
      console.error('ユーザー登録エラー:', insertError);
      return new Response(
        JSON.stringify({ error: `ユーザーの登録に失敗しました: ${insertError.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // 成功レスポンス
    return new Response(
      JSON.stringify({
        success: true,
        message: `${name}さんに招待メールを送信しました`,
        userId,
        authUid: inviteData.user?.id,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('予期せぬエラー:', error);
    return new Response(
      JSON.stringify({ error: 'サーバーで予期せぬエラーが発生しました' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
};

// Netlify Function v2 のルーティング設定
export const config = {
  path: '/api/invite-user',
};
