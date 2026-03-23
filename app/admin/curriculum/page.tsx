/**
 * LISENS - カリキュラムマスタ一覧画面
 *
 * カリキュラムと所属科目の一覧を管理する。
 * admin/education_managerのみアクセス可能。
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getAllCurricula, getSubjectsByCurriculum } from '@/lib/data';
import { TRACK_LABELS } from '@/lib/constants';

/** カリキュラム種別のラベル */
const TYPE_LABELS: Record<string, string> = {
  common: '共通',
  track: 'トラック専門',
  brushup: 'ブラッシュアップ',
};

const TYPE_COLORS: Record<string, string> = {
  common: 'badge-info',
  track: 'badge-success',
  brushup: 'badge-warning',
};

export default function CurriculumListPage() {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!user) return null;
  if (user.role !== 'admin' && user.role !== 'education_manager') {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <p>この画面にアクセスする権限がありません</p>
          <Link href="/" className="btn btn-outline" style={{ marginTop: 'var(--space-md)' }}>← ホームに戻る</Link>
        </div>
      </div>
    );
  }

  const allCurricula = getAllCurricula();

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        <div>
          <h1 className="page-title">📚 カリキュラムマスタ</h1>
          <span className="text-secondary text-sm">{allCurricula.length}件のカリキュラム</span>
        </div>
        <Link href="/admin/curriculum/new" className="btn btn-primary">
          ➕ カリキュラム追加
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {allCurricula.map(cur => {
          const curSubjects = getSubjectsByCurriculum(cur.id);
          const isExpanded = expandedId === cur.id;
          const totalSubjectHours = curSubjects.reduce((sum, s) => sum + s.hours, 0);

          return (
            <div key={cur.id} className="card" style={{ opacity: cur.isActive ? 1 : 0.6 }}>
              <div className="card-header" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                cursor: 'pointer', userSelect: 'none',
              }} onClick={() => setExpandedId(isExpanded ? null : cur.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.1rem' }}>{isExpanded ? '📂' : '📁'}</span>
                  <span className="font-semibold">{cur.name}</span>
                  <span className={`badge ${TYPE_COLORS[cur.type]}`} style={{ fontSize: '0.7rem' }}>
                    {TYPE_LABELS[cur.type]}
                  </span>
                  {cur.trackCode && (
                    <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>
                      {TRACK_LABELS[cur.trackCode]}
                    </span>
                  )}
                  {!cur.isActive && (
                    <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>無効</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                  <span className="text-sm text-secondary">{curSubjects.length}コマ / {totalSubjectHours}h</span>
                  <Link href={`/admin/curriculum/${cur.id}/edit`} className="btn btn-outline btn-sm" onClick={e => e.stopPropagation()}>
                    ✏️ 編集
                  </Link>
                </div>
              </div>

              {/* 展開時：科目一覧 */}
              {isExpanded && (
                <div className="card-body" style={{ padding: 0 }}>
                  {cur.description && (
                    <div style={{ padding: 'var(--space-sm) var(--space-md)', background: 'var(--color-bg-secondary, #f8f9fa)', borderBottom: '1px solid var(--color-border)' }}>
                      <span className="text-sm text-secondary">📝 {cur.description}</span>
                    </div>
                  )}
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}>#</th>
                          <th>科目名</th>
                          <th>説明</th>
                          <th style={{ width: '70px' }}>時間</th>
                          <th style={{ width: '70px' }}>状態</th>
                        </tr>
                      </thead>
                      <tbody>
                        {curSubjects.map((sub, idx) => (
                          <tr key={sub.id} style={{ opacity: sub.isActive ? 1 : 0.5 }}>
                            <td className="text-sm text-secondary">{idx + 1}</td>
                            <td className="font-semibold">{sub.name}</td>
                            <td className="text-sm text-secondary">{sub.description || '—'}</td>
                            <td className="text-sm">{sub.hours}h</td>
                            <td>
                              {sub.isActive
                                ? <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>有効</span>
                                : <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>無効</span>
                              }
                            </td>
                          </tr>
                        ))}
                        {curSubjects.length === 0 && (
                          <tr>
                            <td colSpan={5}>
                              <div className="empty-state" style={{ padding: 'var(--space-md)' }}>
                                <p className="text-sm text-secondary">科目が登録されていません</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
