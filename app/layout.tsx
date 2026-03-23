/**
 * LISENS - ルートレイアウト
 * 
 * アプリ全体の構造を定義する。
 * AuthProviderでラップし、認証状態を全画面で共有する。
 * ログイン画面以外ではサイドバーを表示する。
 */
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import AppShell from './components/AppShell';

export const metadata: Metadata = {
  title: 'LISENS - 社内ライセンス制度運用',
  description: '教育 × 品質保証 × 人事評価補助を統合する社内ライセンス制度運用アプリ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
