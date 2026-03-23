/**
 * LISENS - アプリシェル
 * 
 * ログイン状態に応じてサイドバーの表示/非表示を制御する。
 * 未認証ユーザーはログイン画面にリダイレクトする。
 * 研修者ロールが管理画面にアクセスした場合はブロックする。
 */
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';
import Sidebar from './Sidebar';
import styles from './AppShell.module.css';

/** 研修者がアクセスできないパスのプレフィックス */
const ADMIN_PATHS = ['/admin'];

/** 研修者がアクセスできるパスのホワイトリスト */
const LEARNER_ALLOWED_PATHS = [
  '/login',
  '/learners/',  // 自身のカルテ（IDチェックはページ側で実施）
  '/certifications', // 認定一覧は閲覧可能
  '/evaluations', // 評価は閲覧のみ
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === '/login';

  // 未認証ユーザーをログイン画面にリダイレクト
  useEffect(() => {
    if (!isLoading && !user && !isLoginPage) {
      router.push('/login');
    }
  }, [user, isLoading, isLoginPage, router]);

  // ローディング中
  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}>読み込み中...</div>
      </div>
    );
  }

  // ログイン画面はサイドバーなし
  if (isLoginPage) {
    return <>{children}</>;
  }

  // 未認証はログイン画面にリダイレクト中
  if (!user) {
    return null;
  }

  // 研修者が管理画面にアクセスした場合はブロック
  if (user.role === 'learner') {
    const isAdminPath = ADMIN_PATHS.some(p => pathname.startsWith(p));
    // ホーム(/)はpage.tsxでリダイレクトされるので許可
    // /learners はページ側でID制限あり
    // 研修者一覧ページ（/learners 完全一致）はブロック
    const isLearnersListPage = pathname === '/learners' || pathname === '/learners/';
    // 他の研修者の新規登録ページもブロック
    const isNewLearnerPage = pathname === '/learners/new' || pathname === '/learners/new/';
    // 評価の新規作成もブロック
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
