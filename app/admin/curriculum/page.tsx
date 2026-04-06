/**
 * LISENS - カリキュラムマスタ一覧画面 v2.0
 * アコーディオンアニメーション付きプレミアムデザイン
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getAllCurricula, getSubjectsByCurriculum } from '@/lib/data';
import { TRACK_LABELS } from '@/lib/constants';
import type { Curriculum, Subject } from '@/lib/types';

const TYPE_LABELS: Record<string, string> = { common: '共通', track: 'トラック専門', brushup: 'ブラッシュアップ' };
const TYPE_COLORS: Record<string, string> = { common: 'badge-info', track: 'badge-success', brushup: 'badge-warning' };

export default function CurriculumListPage() {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [allCurricula, setAllCurricula] = useState<Curriculum[]>([]);
  const [subjectsMap, setSubjectsMap] = useState<Record<string, Subject[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getAllCurricula().then(c => { setAllCurricula(c); setLoading(false); });
  }, [user]);

  // 展開時に科目を取得
  const handleToggle = async (curId: string) => {
    if (expandedId === curId) { setExpandedId(null); return; }
    if (!subjectsMap[curId]) {
      const subs = await getSubjectsByCurriculum(curId);
      setSubjectsMap(prev => ({ ...prev, [curId]: subs }));
    }
    setExpandedId(curId);
  };

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

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="skeleton" style={{ width: 250, height: 28, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 160, height: 16 }} />
        </div>
        {[1,2,3].map(i => (
          <div key={i} className="skeleton" style={{ height: 70, borderRadius: 'var(--border-radius)', marginBottom: 12 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* ヘッダー */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📚 カリキュラムマスタ</h1>
          <p className="text-secondary text-sm" style={{ marginTop: 4 }}>
            {allCurricula.length}件のカリキュラム
          </p>
        </div>
        <Link href="/admin/curriculum/new" className="btn btn-primary">
          ➕ カリキュラム追加
        </Link>
      </div>

      {/* カリキュラムリスト */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {allCurricula.map((cur, idx) => {
          const isExpanded = expandedId === cur.id;
          const curSubjects = subjectsMap[cur.id] || [];
          const totalSubjectHours = curSubjects.reduce((sum, s) => sum + s.hours, 0);
          return (
            <div
              key={cur.id}
              className="card animate-fadeInUp"
              style={{
                opacity: cur.isActive ? 1 : 0.6,
                animationDelay: `${idx * 0.05}s`,
              }}
            >
              {/* ヘッダー（クリックで展開） */}
              <div
                className="card-header"
                style={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  justifyContent: 'space-between',
                  padding: '14px var(--space-lg)',
                  background: isExpanded ? 'var(--color-primary-lighter)' : undefined,
                  transition: 'background var(--transition-base)',
                }}
                onClick={() => handleToggle(cur.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '1.1rem',
                    transition: 'transform var(--transition-base)',
                    transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                    display: 'inline-block',
                  }}>
                    📂
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{cur.name}</span>
                  <span className={`badge ${TYPE_COLORS[cur.type]}`}>{TYPE_LABELS[cur.type]}</span>
                  {cur.trackCode && (
                    <span className="badge badge-muted">{TRACK_LABELS[cur.trackCode]}</span>
                  )}
                  {!cur.isActive && <span className="badge badge-danger">無効</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexShrink: 0 }}>
                  <span className="text-sm text-secondary" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                    {isExpanded ? `${curSubjects.length}コマ / ${totalSubjectHours}h` : `${cur.totalHours}h`}
                  </span>
                  <Link
                    href={`/admin/curriculum/${cur.id}/edit`}
                    className="btn btn-outline btn-sm"
                    onClick={e => e.stopPropagation()}
                  >
                    ✏️ 編集
                  </Link>
                </div>
              </div>

              {/* 展開コンテンツ */}
              {isExpanded && (
                <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
                  {cur.description && (
                    <div style={{
                      padding: '10px var(--space-lg)',
                      background: 'var(--color-bg)',
                      borderBottom: '1px solid var(--color-border-light)',
                      fontSize: '0.85rem',
                      color: 'var(--color-text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      📝 {cur.description}
                    </div>
                  )}
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: 45 }}>#</th>
                          <th>科目名</th>
                          <th>説明</th>
                          <th style={{ width: 70 }}>時間</th>
                          <th style={{ width: 70 }}>状態</th>
                        </tr>
                      </thead>
                      <tbody>
                        {curSubjects.map((sub, sidx) => (
                          <tr
                            key={sub.id}
                            style={{ opacity: sub.isActive ? 1 : 0.5 }}
                            className="animate-fadeIn"
                          >
                            <td className="text-sm text-muted">{sidx + 1}</td>
                            <td style={{ fontWeight: 600 }}>{sub.name}</td>
                            <td className="text-sm text-secondary">{sub.description || '—'}</td>
                            <td className="text-sm" style={{ fontFamily: 'var(--font-mono)' }}>{sub.hours}h</td>
                            <td>
                              {sub.isActive
                                ? <span className="badge badge-success">有効</span>
                                : <span className="badge badge-danger">無効</span>
                              }
                            </td>
                          </tr>
                        ))}
                        {curSubjects.length === 0 && (
                          <tr>
                            <td colSpan={5}>
                              <div className="empty-state" style={{ padding: 'var(--space-lg)' }}>
                                <p className="text-sm text-muted">科目が登録されていません</p>
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
