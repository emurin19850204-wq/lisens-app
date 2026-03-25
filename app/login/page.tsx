/**
 * LISENS - ログイン画面（Supabase Auth版）
 * 
 * メールアドレス＋パスワードでSupabase Authにログインする。
 * テスト用アカウント一覧は削除済み。
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import styles from './login.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const success = await login(email, password);
      if (success) {
        router.push('/');
      } else {
        setError('メールアドレスまたはパスワードが正しくありません。アカウントが登録されていない可能性があります。');
      }
    } catch {
      setError('ログイン中にエラーが発生しました。');
    }
    setIsSubmitting(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        {/* ヘッダー */}
        <div className={styles.header}>
          <div className={styles.logo}>📋 LISENS</div>
          <p className={styles.subtitle}>社内ライセンス制度運用</p>
        </div>

        {/* ログインフォーム */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">メールアドレス</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@element.com"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">パスワード</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="パスワード"
              required
            />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={isSubmitting}>
            {isSubmitting ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}
