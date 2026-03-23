/**
 * LISENS - 研修者詳細画面（個人カルテ）- サーバーコンポーネントラッパー
 */
import { users } from '@/lib/dummy-data';
import LearnerDetailClient from './PageClient';

/** 静的エクスポート用: 全ユーザーIDのパスを事前生成 */
export function generateStaticParams() {
  return users.map(u => ({ id: u.id }));
}

export default function LearnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <LearnerDetailClient params={params} />;
}
