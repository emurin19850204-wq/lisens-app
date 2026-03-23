/**
 * LISENS - サイドバーコンポーネント
 * 
 * ロールに応じたナビゲーション項目を表示する。
 * 受講者は「マイカルテ」で自分の個人ページにアクセスできる。
 * 現在のパスに応じてアクティブ状態を表示する。
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ROLE_LABELS, ROLE_NAV_ACCESS } from '@/lib/constants';
import styles from './Sidebar.module.css';

/** 静的ナビゲーション項目の定義 */
const STATIC_NAV_ITEMS: Record<string, { label: string; path: string; icon: string }> = {
  home: { label: 'ホーム', path: '/', icon: '🏠' },
  learners: { label: '研修者一覧', path: '/learners', icon: '👥' },
  certifications: { label: '認定一覧', path: '/certifications', icon: '🏆' },
  curriculum: { label: 'カリキュラム', path: '/admin/curriculum', icon: '📚' },
  staff: { label: 'スタッフ管理', path: '/admin/staff', icon: '🛡️' },
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  // ロールに応じて表示するナビ項目を取得
  const accessibleNavKeys = ROLE_NAV_ACCESS[user.role] || [];

  // 動的ナビ項目（受講者用「マイカルテ」はユーザーIDに依存する）
  const getNavItem = (key: string) => {
    if (key === 'my_chart') {
      return { label: 'マイカルテ', path: `/learners/${user.id}`, icon: '📋' };
    }
    return STATIC_NAV_ITEMS[key];
  };

  return (
    <aside className={styles.sidebar}>
      {/* ロゴ・アプリ名 */}
      <div className={styles.logo}>
        <Link href="/" className={styles.logoLink}>
          <span className={styles.logoIcon}>📋</span>
          <span className={styles.logoText}>LISENS</span>
        </Link>
      </div>

      {/* ナビゲーション */}
      <nav className={styles.nav}>
        {accessibleNavKeys.map(key => {
          const item = getNavItem(key);
          if (!item) return null;

          // パスの一致判定
          const isActive = key === 'home'
            ? pathname === item.path
            : key === 'my_chart'
              ? pathname.startsWith(`/learners/${user.id}`)
              : pathname.startsWith(item.path);

          return (
            <Link
              key={key}
              href={item.path}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ユーザー情報・ログアウト */}
      <div className={styles.userSection}>
        <div className={styles.userInfo}>
          <div className={styles.userName}>{user.name}</div>
          <div className={styles.userRole}>{ROLE_LABELS[user.role]}</div>
        </div>
        <button onClick={logout} className={styles.logoutBtn}>
          🚪 ログアウト
        </button>
      </div>
    </aside>
  );
}
