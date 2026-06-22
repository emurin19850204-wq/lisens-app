/**
 * LISENS - 動的ルートID取得フック
 *
 * 静的エクスポート(output: "export")では、generateStaticParamsで
 * 事前生成したパスしかHTMLが存在しない。実データのIDは事前に分からないため、
 * NetlifyのリライトでフォールバックのシェルHTMLを返し、
 * 実際のIDはブラウザのURLから取得する。
 *
 * use(params) はビルド時の値（プレースホルダ）が焼き込まれてしまうため使わない。
 * window.location から取得することで、リライト経由でも正しいIDを得られる。
 */
'use client';

import { useState } from 'react';

/**
 * 現在のURLパスから指定インデックスのセグメントをデコードして返す。
 * 例: /learners/abc123/ → segmentIndex=1 → "abc123"
 *     /admin/staff/abc/edit/ → segmentIndex=2 → "abc"
 */
export function useRouteId(segmentIndex: number): string {
  return useState(() => {
    if (typeof window === 'undefined') return '';
    const segments = window.location.pathname.split('/').filter(Boolean);
    return decodeURIComponent(segments[segmentIndex] ?? '');
  })[0];
}
