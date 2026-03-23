/**
 * LISENS - 認定詳細・承認画面 - サーバーコンポーネントラッパー
 */
import { certifications } from '@/lib/dummy-data';
import CertificationDetailClient from './PageClient';

/** 静的エクスポート用: 全認定IDのパスを事前生成 */
export function generateStaticParams() {
  return certifications.map(c => ({ id: c.id }));
}

export default function CertificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <CertificationDetailClient params={params} />;
}
