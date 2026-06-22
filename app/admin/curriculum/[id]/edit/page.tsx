/**
 * LISENS - カリキュラム編集画面 - サーバーコンポーネントラッパー
 */
import EditCurriculumClient from './PageClient';

/** 静的エクスポート用プレースホルダ（未知IDはNetlifyリライトでフォールバック） */
export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function EditCurriculumPage() {
  return <EditCurriculumClient />;
}
