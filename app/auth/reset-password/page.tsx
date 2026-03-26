/**
 * LISENS - パスワードリセット申請ページ
 * 
 * メールアドレスを入力してリセットメールを送信する。
 * メール内のリンクから /auth/callback に遷移 → パスワード再設定。
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const supabase = getSupabase();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://element-lisense.netlify.app/auth/callback',
      });

      if (resetError) {
        setError(`送信に失敗しました: ${resetError.message}`);
      } else {
        setSent(true);
      }
    } catch {
      setError('エラーが発生しました。');
    }

    setIsSubmitting(false);
  };

  // 送信完了画面
  if (sent) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', background: 'var(--color-bg, #0f172a)',
      }}>
        <div style={{
          background: 'var(--color-surface, #1e293b)', borderRadius: '12px',
          padding: '2rem', maxWidth: '440px', width: '100%', textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📧</div>
          <h1 style={{ fontSize: '1.25rem', color: 'var(--color-text, #e2e8f0)', margin: '0.5rem 0 1rem' }}>
            メールを送信しました
          </h1>
          <p style={{ color: 'var(--color-text-secondary, #94a3b8)', fontSize: '0.875rem', lineHeight: '1.6' }}>
            <strong>{email}</strong> にパスワードリセットのリンクを送信しました。
            メールを確認してリンクをクリックしてください。
          </p>
          <p style={{ color: 'var(--color-text-secondary, #94a3b8)', fontSize: '0.8rem', marginTop: '1rem' }}>
            ※ メールが届かない場合は、迷惑メールフォルダをご確認ください。
          </p>
          <Link href="/login" style={{
            display: 'inline-block', marginTop: '1.5rem', padding: '0.5rem 1.5rem',
            background: 'var(--color-primary, #6366f1)', color: 'white',
            borderRadius: '8px', textDecoration: 'none', fontSize: '0.875rem',
          }}>
            ログイン画面に戻る
          </Link>
        </div>
      </div>
    );
  }

  // 入力画面
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
          <div style={{ fontSize: '2rem' }}>🔑</div>
          <h1 style={{ fontSize: '1.25rem', color: 'var(--color-text, #e2e8f0)', margin: '0.5rem 0' }}>
            パスワードをリセット
          </h1>
          <p style={{ color: 'var(--color-text-secondary, #94a3b8)', fontSize: '0.875rem' }}>
            登録済みのメールアドレスを入力してください
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text, #e2e8f0)', fontSize: '0.875rem' }}>
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@element.com"
              required
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
            {isSubmitting ? '送信中...' : '📧 リセットメールを送信'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link href="/login" style={{ color: 'var(--color-text-secondary, #94a3b8)', fontSize: '0.875rem', textDecoration: 'underline' }}>
            ログイン画面に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
