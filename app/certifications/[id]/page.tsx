/**
 * LISENS - 認定詳細・承認画面 - サーバーコンポーネントラッパー
 */
import CertificationDetailClient from './PageClient';

/** 静的エクスポート用プレースホルダ（未知IDはNetlifyリライトでフォールバック） */
export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function CertificationDetailPage() {
  return <CertificationDetailClient />;
}
