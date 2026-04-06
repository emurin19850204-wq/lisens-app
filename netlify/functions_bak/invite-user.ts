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
    const { email, name, role, organizationId, hireDate, tracks } = body;

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

    // メール重複チェック（usersテーブル）
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

    // Auth重複チェック（auth.usersテーブル）
    const { data: existingAuthUsers } = await adminClient.auth.admin.listUsers();
    const existingAuthUser = existingAuthUsers?.users?.find(u => u.email === email);
    if (existingAuthUser) {
      // 既にAuthに存在する場合は削除して再作成
      await adminClient.auth.admin.deleteUser(existingAuthUser.id);
    }

    // generateLinkでトークン付きリンクを生成（メール送信なし → レート制限なし）
    const siteUrl = process.env.SITE_URL || 'https://element-lisense.netlify.app';
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        data: { name, role },
        redirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (linkError) {
      console.error('招待リンク生成エラー:', linkError);
      return new Response(
        JSON.stringify({ error: `招待リンクの生成に失敗しました: ${linkError.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // 招待リンクを取得
    const inviteLink = linkData.properties?.action_link;
    if (!inviteLink) {
      return new Response(
        JSON.stringify({ error: '招待リンクの生成に失敗しました' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // メール送信を試行（失敗しても招待自体は成功とする）
    let emailSent = false;
    let emailError = '';
    const resendApiKey = process.env.RESEND_API_KEY;
    // 送信元メールアドレス（環境変数で上書き可能、デフォルトはResendテスト用）
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'ELEMENT LISENS <onboarding@resend.dev>';

    if (resendApiKey) {
      try {
        const emailHtml = `
          <h2>ELEMENT LISENS へようこそ</h2>
          <p>${name}さん、こんにちは。</p>
          <p>あなたはELEMENT LISENSに招待されました。</p>
          <p>以下のリンクをクリックして、パスワードを設定してください。</p>
          <p><a href="${inviteLink}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">パスワードを設定する</a></p>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;">このメールに心当たりがない場合は無視してください。</p>
        `;

        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [email],
            subject: '【ELEMENT LISENS】アカウント登録のお知らせ',
            html: emailHtml,
          }),
        });
        emailSent = resendResponse.ok;
        if (!resendResponse.ok) {
          const errorBody = await resendResponse.text();
          console.warn('メール送信スキップ:', errorBody);
          // ドメイン未認証エラーの場合は分かりやすいメッセージを設定
          if (errorBody.includes('verify a domain') || errorBody.includes('validation_error')) {
            emailError = 'Resendのドメイン未認証のためメール送信をスキップしました。招待リンクを直接共有してください。';
          } else {
            emailError = 'メール送信に失敗しました。招待リンクを直接共有してください。';
          }
        }
      } catch (emailErr) {
        console.warn('メール送信エラー（無視）:', emailErr);
        emailError = 'メール送信中にエラーが発生しました。招待リンクを直接共有してください。';
      }
    } else {
      emailError = 'メール設定がありません。招待リンクを直接共有してください。';
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
      tracks: Array.isArray(tracks) ? tracks : [],
      hire_date: hireDate || null,
      auth_uid: linkData.user?.id || null,
    });

    if (insertError) {
      console.error('ユーザー登録エラー:', insertError);
      return new Response(
        JSON.stringify({ error: `ユーザーの登録に失敗しました: ${insertError.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // 成功レスポンス（招待リンクを常に含む）
    return new Response(
      JSON.stringify({
        success: true,
        message: emailSent
          ? `✅ ${name}さんに招待メールを送信しました`
          : `✅ ${name}さんのアカウントを作成しました`,
        emailNote: emailError || null,
        userId,
        authUid: linkData.user?.id,
        inviteLink,
        emailSent,
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
