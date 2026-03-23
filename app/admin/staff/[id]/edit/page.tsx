/**
 * LISENS - スタッフ編集画面 - サーバーコンポーネントラッパー
 */
import { users } from '@/lib/dummy-data';
import EditStaffClient from './PageClient';

/** 静的エクスポート用: 全ユーザーIDのパスを事前生成 */
export function generateStaticParams() {
  return users.map(u => ({ id: u.id }));
}

export default function EditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <EditStaffClient params={params} />;
}
