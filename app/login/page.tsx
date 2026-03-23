/**
 * LISENS - ログイン画面
 * 
 * メールアドレスを入力してログインする。
 * MVPではパスワード検証なし（ダミー認証）。
 * ログインアカウントの一覧も表示して、テスト用に簡単に切り替えられるようにする。
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { users } from '@/lib/dummy-data';
import { ROLE_LABELS } from '@/lib/constants';
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

    const success = await login(email, password);
    if (success) {
      router.push('/');
    } else {
      setError('メールアドレスが正しくありません');
    }
    setIsSubmitting(false);
  };

  // テスト用：アカウントをクリックして即ログイン
  const handleQuickLogin = async (userEmail: string) => {
    setEmail(userEmail);
    const success = await login(userEmail, 'password123');
    if (success) {
      router.push('/');
    }
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
              placeholder="admin@example.com"
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
            />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={isSubmitting}>
            {isSubmitting ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        {/* テスト用アカウント一覧 */}
        <div className={styles.testAccounts}>
          <p className={styles.testAccountsTitle}>🧪 テスト用アカウント（クリックでログイン）</p>
          <div className={styles.accountList}>
            {users.map(u => (
              <button
                key={u.id}
                className={styles.accountItem}
                onClick={() => handleQuickLogin(u.email)}
              >
                <span className={styles.accountName}>{u.name}</span>
                <span className={styles.accountRole}>{ROLE_LABELS[u.role]}</span>
                <span className={styles.accountEmail}>{u.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
