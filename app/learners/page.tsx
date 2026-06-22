/**
 * LISENS - 研修者一覧画面（Supabase対応）
 */
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getLearnerSummaries, deleteLearner } from '@/lib/data';
import {
  LEVEL_LABELS, LEVEL_BADGE_CLASS,
  TRACK_LABELS, TRACK_BADGE_CLASS,
} from '@/lib/constants';
import type { LearnerSummary, TrackCode } from '@/lib/types';

const CAN_MANAGE_ROLES = ['admin', 'education_manager'];

export default function LearnersPage() {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<LearnerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<'progress_asc' | 'progress_desc' | 'name'>('progress_asc');
  const [filterStore, setFilterStore] = useState('');
  const [filterTrack, setFilterTrack] = useState('');

  useEffect(() => {
    if (!user) return;
    getLearnerSummaries(user).then(s => { setSummaries(s); setLoading(false); });
  }, [user]);

  // 店舗の選択肢（フックは早期returnより前に常に同じ順序で呼ぶ）
  const storeOptions = useMemo(
    () => [...new Set(summaries.map(s => s.organization.name))].sort((a, b) => a.localeCompare(b, 'ja')),
    [summaries],
  );

  // 検索 → 絞り込み（店舗/トラック）→ 並び替え
  const filteredSummaries = useMemo(() => {
    let list = summaries;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(s =>
        s.user.name.toLowerCase().includes(q) ||
        s.organization.name.toLowerCase().includes(q) ||
        s.user.tracks.some(t => TRACK_LABELS[t].toLowerCase().includes(q)) ||
        LEVEL_LABELS[s.user.currentLevel].toLowerCase().includes(q) ||
        s.user.email.toLowerCase().includes(q)
      );
    }
    if (filterStore) list = list.filter(s => s.organization.name === filterStore);
    if (filterTrack) list = list.filter(s => s.user.tracks.includes(filterTrack as TrackCode));
    return [...list].sort((a, b) => {
      if (sortKey === 'name') return a.user.name.localeCompare(b.user.name, 'ja');
      if (sortKey === 'progress_desc') return b.overallProgress - a.overallProgress;
      return a.overallProgress - b.overallProgress; // progress_asc（低い順=要フォロー優先）
    });
  }, [summaries, searchQuery, filterStore, filterTrack, sortKey]);

  if (!user) return null;
  const canManage = CAN_MANAGE_ROLES.includes(user.role);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${name}さんを研修者一覧から削除しますか？\nこの操作は元に戻せません。`)) return;
    await deleteLearner(id);
    setSummaries(prev => prev.filter(s => s.user.id !== id));
  };

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="skeleton" style={{ width: 200, height: 28, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 100, height: 16 }} />
        </div>
        <div className="skeleton" style={{ height: 60, borderRadius: 'var(--border-radius)', marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 400, borderRadius: 'var(--border-radius)' }} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">👥 研修者一覧</h1>
          <p className="text-secondary text-sm" style={{ marginTop: 4 }}>{summaries.length}名の研修者</p>
        </div>
        {canManage && (
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <Link href="/learners/invite" className="btn btn-outline">✉️ メール招待</Link>
            <Link href="/learners/new" className="btn btn-primary">➕ 新規登録</Link>
          </div>
        )}
      </div>

      {/* 検索バー */}
      <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
        <div className="card-body" style={{ padding: 'var(--space-sm) var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span style={{ fontSize: '1.1rem' }}>🔍</span>
            <input type="text" className="form-input" placeholder="氏名、所属、トラック、レベルで検索..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex: 1, margin: 0, border: 'none', boxShadow: 'none', background: 'transparent', padding: 'var(--space-xs) 0' }} />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--color-text-secondary)' }}>✕</button>
            )}
          </div>
          {/* 並び替え・絞り込み（滞留者の特定用） */}
          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="form-input" style={{ width: 'auto', fontSize: '0.85rem', padding: '4px 8px' }} value={sortKey} onChange={e => setSortKey(e.target.value as typeof sortKey)}>
              <option value="progress_asc">並び順: 進捗率（低い順）</option>
              <option value="progress_desc">並び順: 進捗率（高い順）</option>
              <option value="name">並び順: 氏名</option>
            </select>
            <select className="form-input" style={{ width: 'auto', fontSize: '0.85rem', padding: '4px 8px' }} value={filterStore} onChange={e => setFilterStore(e.target.value)}>
              <option value="">全店舗</option>
              {storeOptions.map(name => (<option key={name} value={name}>{name}</option>))}
            </select>
            <select className="form-input" style={{ width: 'auto', fontSize: '0.85rem', padding: '4px 8px' }} value={filterTrack} onChange={e => setFilterTrack(e.target.value)}>
              <option value="">全トラック</option>
              {Object.entries(TRACK_LABELS).map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
            </select>
            {(filterStore || filterTrack || sortKey !== 'progress_asc') && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setFilterStore(''); setFilterTrack(''); setSortKey('progress_asc'); }}>条件クリア</button>
            )}
            <span className="text-sm text-secondary" style={{ marginLeft: 'auto' }}>{filteredSummaries.length}名表示</span>
          </div>
        </div>
      </div>

      {/* テーブル */}
      <div className="card animate-fadeInUp">
        <div style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>氏名</th><th>所属</th><th>レベル</th><th>トラック</th><th>進捗率</th><th>直近評価日</th><th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredSummaries.map((s, idx) => (
                  <tr key={s.user.id} className="animate-fadeIn" style={{ animationDelay: `${idx * 0.03}s` }}>
                    <td>
                      <Link href={`/learners/${s.user.id}`} style={{ fontWeight: 600 }}>{s.user.name}</Link>
                      {s.overallProgress < 30 && (
                        <span className="badge badge-danger" style={{ marginLeft: '6px', fontSize: '0.65rem', padding: '1px 6px' }} title="進捗率が低く、フォローが必要です">要フォロー</span>
                      )}
                    </td>
                    <td>{s.organization.name}</td>
                    <td><span className={`badge ${LEVEL_BADGE_CLASS[s.user.currentLevel]}`}>{s.currentLevelName}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {s.user.tracks.map(t => (
                          <span key={t} className={`badge ${TRACK_BADGE_CLASS[t]}`} style={{ fontSize: '0.7rem', padding: '1px 6px' }}>{TRACK_LABELS[t]}</span>
                        ))}
                        {s.user.tracks.length === 0 && <span className="text-secondary text-sm">—</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <div className="progress-bar" style={{ width: '80px' }}>
                          <div className={`progress-bar-fill ${s.overallProgress === 100 ? 'completed' : ''}`} style={{ width: `${s.overallProgress}%` }} />
                        </div>
                        <span className="text-sm">{s.overallProgress}%</span>
                      </div>
                    </td>
                    <td className="text-sm text-secondary">{s.lastEvaluationDate ? new Date(s.lastEvaluationDate).toLocaleDateString('ja-JP') : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <Link href={`/learners/${s.user.id}`} className="btn btn-outline btn-sm">カルテ</Link>
                        {canManage && (
                          <button className="btn btn-sm btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(s.user.id, s.user.name)} title="削除">🗑</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSummaries.length === 0 && summaries.length > 0 && (
                  <tr><td colSpan={7}><div className="empty-state" style={{ padding: 'var(--space-lg)' }}><div className="empty-state-icon">🔍</div><p>「{searchQuery}」に一致する研修者が見つかりません</p><button className="btn btn-outline" style={{ marginTop: 'var(--space-sm)' }} onClick={() => setSearchQuery('')}>検索をクリア</button></div></td></tr>
                )}
                {summaries.length === 0 && (
                  <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">📭</div><p>表示できる研修者がいません</p>{canManage && (<Link href="/learners/new" className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>➕ 最初の研修者を登録する</Link>)}</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
