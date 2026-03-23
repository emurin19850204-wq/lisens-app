/**
 * LISENS - カリキュラム新規追加画面
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { addCurriculum } from '@/lib/data';
import { TRACK_LABELS } from '@/lib/constants';
import type { TrackCode } from '@/lib/types';

const TYPE_OPTIONS = [
  { value: 'common', label: '共通コア' },
  { value: 'track', label: 'トラック専門' },
  { value: 'brushup', label: 'ブラッシュアップ' },
] as const;

const TRACK_OPTIONS: { value: TrackCode; label: string }[] = [
  { value: 'weight', label: TRACK_LABELS.weight },
  { value: 'pilates', label: TRACK_LABELS.pilates },
  { value: 'stretch', label: TRACK_LABELS.stretch },
];

export default function NewCurriculumPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'common' | 'track' | 'brushup'>('common');
  const [trackCode, setTrackCode] = useState<TrackCode | ''>('');
  const [totalHours, setTotalHours] = useState(16);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'education_manager')) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <p>この操作を行う権限がありません</p>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const newCur = addCurriculum({
      name: name.trim(),
      description: description.trim() || null,
      type,
      trackCode: type === 'track' ? (trackCode as TrackCode) : null,
      totalHours,
    });
    // 科目を追加するために編集画面へ遷移
    router.push(`/admin/curriculum/${newCur.id}/edit`);
  };

  return (
    <div className="page-container">
      <nav className="breadcrumb">
        <Link href="/">ホーム</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href="/admin/curriculum">カリキュラムマスタ</Link>
        <span className="breadcrumb-separator">/</span>
        <span>新規追加</span>
      </nav>

      <h1 className="page-title">📚 カリキュラム 新規追加</h1>
      <p className="text-secondary" style={{ marginBottom: 'var(--space-lg)' }}>
        新しいカリキュラムを追加します。追加後、科目を登録できます。
      </p>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="card-header">📋 基本情報</div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">カリキュラム名 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="例: 応用トレーニング" required />
            </div>
            <div className="form-group">
              <label className="form-label">説明</label>
              <textarea className="form-input" rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="カリキュラムの概要を入力" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">種別</label>
                <select className="form-select" value={type} onChange={e => setType(e.target.value as typeof type)}>
                  {TYPE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {type === 'track' && (
                <div className="form-group">
                  <label className="form-label">トラック</label>
                  <select className="form-select" value={trackCode} onChange={e => setTrackCode(e.target.value as TrackCode)} required>
                    <option value="">選択してください</option>
                    {TRACK_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">合計時間（h）</label>
                <input type="number" className="form-input" value={totalHours} onChange={e => setTotalHours(Number(e.target.value))} min={0} step={0.5} style={{ maxWidth: '120px' }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
          <Link href="/admin/curriculum" className="btn btn-outline">キャンセル</Link>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? '追加中...' : '📚 カリキュラムを追加して科目を登録する'}
          </button>
        </div>
      </form>
    </div>
  );
}
