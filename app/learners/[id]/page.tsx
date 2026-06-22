/**
 * LISENS - 研修者詳細画面（個人カルテ）- サーバーコンポーネントラッパー
 */
import LearnerDetailClient from './PageClient';

/**
 * 静的エクスポート用のプレースホルダ。
 * 実データのIDは事前に分からないため、ここでは1件だけシェルを生成し、
 * 未知のIDは netlify.toml のリライトでこのシェルにフォールバックさせる。
 * 実際のIDはクライアント側で window.location から取得する。
 */
export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function LearnerDetailPage() {
  return <LearnerDetailClient />;
}
