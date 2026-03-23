/**
 * LISENS - カリキュラム編集画面 - サーバーコンポーネントラッパー
 */
import { curricula } from '@/lib/dummy-data';
import EditCurriculumClient from './PageClient';

/** 静的エクスポート用: 全カリキュラムIDのパスを事前生成 */
export function generateStaticParams() {
  return curricula.map(c => ({ id: c.id }));
}

export default function EditCurriculumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <EditCurriculumClient params={params} />;
}
