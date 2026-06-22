/**
 * LISENS - スタッフ編集画面 - サーバーコンポーネントラッパー
 */
import EditStaffClient from './PageClient';

/** 静的エクスポート用プレースホルダ（未知IDはNetlifyリライトでフォールバック） */
export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function EditStaffPage() {
  return <EditStaffClient />;
}
