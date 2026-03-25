/**
 * LISENS - 認証コールバックページ
 * 
 * 招待メールのリンクからリダイレクトされるページ。
 * パスワードの設定を行い、ログインを完了する。
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // URLハッシュからトークンを処理
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = getSupabase();
        
        // URLハッシュにアクセストークンがある場合、セッションを設定
        const hash = window.location.hash;
        if (hash) {
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const type = params.get('type');

          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('セッション設定エラー:', error);
              setError('招待リンクが無効または期限切れです。管理者に再招待を依頼してください。');
              setIsProcessing(false);
              return;
            }

            if (data.user) {
              setUserEmail(data.user.email || '');
              
              // 招待の場合はパスワード設定画面を表示
              if (type === 'invite' || type === 'recovery') {
                setSessionReady(true);
                setIsProcessing(false);
                return;
              }
            }
          }
        }

        // ハッシュがない or 通常のコールバックの場合
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // 既にセッションがある場合はホームにリダイレクト
          router.push('/');
        } else {
          setError('招待リンクが無効です。管理者に再招待を依頼してください。');
        }
      } catch (e) {
        console.error('コールバック処理エラー:', e);
        setError('エラーが発生しました。');
      }
      setIsProcessing(false);
    };

    handleCallback();
  }, [router]);

  // パスワード設定処理
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('パスワードは6文字以上で設定してください。');
      return;
    }
    if (password !== confirmPassword) {
      setError('パスワードが一致しません。');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabase();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(`パスワード設定に失敗しました: ${updateError.message}`);
        setIsSubmitting(false);
        return;
      }

      // パスワード設定成功 → ホームにリダイレクト
      router.push('/');
    } catch (e) {
      console.error('パスワード設定エラー:', e);
      setError('エラーが発生しました。');
      setIsSubmitting(false);
    }
  };

  // 処理中の画面
  if (isProcessing) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', background: 'var(--color-bg, #0f172a)',
      }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text, #e2e8f0)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>認証を処理中です...</p>
        </div>
      </div>
    );
  }

  // エラー画面
  if (error && !sessionReady) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', background: 'var(--color-bg, #0f172a)',
      }}>
        <div style={{
          background: 'var(--color-surface, #1e293b)', borderRadius: '12px',
          padding: '2rem', maxWidth: '400px', width: '100%', textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
          <p style={{ color: 'var(--color-danger, #ef4444)', marginBottom: '1rem' }}>{error}</p>
          <a href="/login" style={{
            display: 'inline-block', padding: '0.5rem 1.5rem',
            background: 'var(--color-primary, #6366f1)', color: 'white',
            borderRadius: '8px', textDecoration: 'none',
          }}>ログインページへ</a>
        </div>
      </div>
    );
  }

  // パスワード設定画面
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', background: 'var(--color-bg, #0f172a)',
    }}>
      <div style={{
        background: 'var(--color-surface, #1e293b)', borderRadius: '12px',
        padding: '2rem', maxWidth: '440px', width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2rem' }}>🔐</div>
          <h1 style={{ fontSize: '1.25rem', color: 'var(--color-text, #e2e8f0)', margin: '0.5rem 0' }}>
            パスワードを設定してください
          </h1>
          {userEmail && (
            <p style={{ color: 'var(--color-text-secondary, #94a3b8)', fontSize: '0.875rem' }}>
              {userEmail}
            </p>
          )}
        </div>

        <form onSubmit={handleSetPassword}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text, #e2e8f0)', fontSize: '0.875rem' }}>
              新しいパスワード（6文字以上）
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              required
              minLength={6}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px',
                border: '1px solid var(--color-border, #334155)',
                background: 'var(--color-bg, #0f172a)', color: 'var(--color-text, #e2e8f0)',
                fontSize: '1rem', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text, #e2e8f0)', fontSize: '0.875rem' }}>
              パスワード確認
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="もう一度入力"
              required
              minLength={6}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px',
                border: '1px solid var(--color-border, #334155)',
                background: 'var(--color-bg, #0f172a)', color: 'var(--color-text, #e2e8f0)',
                fontSize: '1rem', boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '0.75rem', borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger, #ef4444)',
              fontSize: '0.875rem', marginBottom: '1rem',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%', padding: '0.75rem', borderRadius: '8px',
              background: 'var(--color-primary, #6366f1)', color: 'white',
              fontSize: '1rem', fontWeight: '600', border: 'none', cursor: 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? '設定中...' : '🔐 パスワードを設定してログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}
