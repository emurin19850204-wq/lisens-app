/**
 * LISENS - アプリシェル
 * 
 * ログイン状態に応じてサイドバーの表示/非表示を制御する。
 * 未認証ユーザーはログイン画面にリダイレクトする。
 * 研修者ロールが管理画面にアクセスした場合はブロックする。
 * 
 * 注意: 静的エクスポート(output: "export")では、SSR時にpathnameが
 * 正しく取得できない場合があるため、クライアントマウント後に判定する。
 */
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';
import Sidebar from './Sidebar';
import styles from './AppShell.module.css';

/** 研修者がアクセスできないパスのプレフィックス */
const ADMIN_PATHS = ['/admin'];

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  // クライアント側でマウントされたかを追跡（ハイドレーション対策）
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ログインページかどうか（末尾スラッシュも考慮）
  const isLoginPage = pathname === '/login' || pathname === '/login/';
  // 認証コールバックページ（招待リンクからのパスワード設定）
  const isAuthCallback = pathname === '/auth/callback' || pathname === '/auth/callback/';

  // 未認証ユーザーをログイン画面にリダイレクト（ログイン画面と認証コールバックは除外）
  useEffect(() => {
    if (mounted && !isLoading && !user && !isLoginPage && !isAuthCallback) {
      router.push('/login/');
    }
  }, [user, isLoading, isLoginPage, isAuthCallback, router, mounted]);

  // マウント前またはローディング中はローディング表示
  if (!mounted || isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}>読み込み中...</div>
      </div>
    );
  }

  // ログイン画面・認証コールバックはサイドバーなし
  if (isLoginPage || isAuthCallback) {
    return <>{children}</>;
  }

  // 未認証はログイン画面にリダイレクト中（何も表示しない）
  if (!user) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}>ログイン画面に移動中...</div>
      </div>
    );
  }

  // 研修者が管理画面にアクセスした場合はブロック
  if (user.role === 'learner') {
    const isAdminPath = ADMIN_PATHS.some(p => pathname.startsWith(p));
    const isLearnersListPage = pathname === '/learners' || pathname === '/learners/';
    const isNewLearnerPage = pathname === '/learners/new' || pathname === '/learners/new/';
    const isNewEvalPage = pathname === '/evaluations/new' || pathname === '/evaluations/new/';

    if (isAdminPath || isLearnersListPage || isNewLearnerPage || isNewEvalPage) {
      return (
        <div className={styles.appShell}>
          <Sidebar />
          <main className={styles.mainContent}>
            <div className="page-container">
              <div className="empty-state" style={{ marginTop: 'var(--space-2xl)' }}>
                <div className="empty-state-icon">🔒</div>
                <h2 style={{ marginBottom: 'var(--space-sm)' }}>アクセス制限</h2>
                <p>この画面にアクセスする権限がありません。</p>
                <p className="text-sm text-secondary" style={{ marginTop: 'var(--space-xs)' }}>
                  研修者アカウントでは管理機能をご利用いただけません。
                </p>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 'var(--space-md)' }}
                  onClick={() => router.push(`/learners/${user.id}`)}
                >
                  📋 マイカルテに戻る
                </button>
              </div>
            </div>
          </main>
        </div>
      );
    }
  }

  // 認証済み：サイドバー付きレイアウト
  return (
    <div className={styles.appShell}>
      <Sidebar />
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
