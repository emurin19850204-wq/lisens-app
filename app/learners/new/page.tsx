/**
 * LISENS - 受講者新規登録画面
 *
 * 管理者・教育責任者が新しいトレーナー候補（受講者）を登録する。
 * 名前・メール・所属店舗・受講トラック・入社日を入力して登録する。
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { addLearner, getStores } from '@/lib/data';
import { TRACK_LABELS } from '@/lib/constants';
import type { TrackCode } from '@/lib/types';

/** 受講者を登録できるロール */
const CAN_MANAGE_LEARNER_ROLES = ['admin', 'education_manager'] as const;

export default function NewLearnerPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();

  // フォーム状態
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [tracks, setTracks] = useState<TrackCode[]>([]);
  const [hireDate, setHireDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 権限チェック
  if (!currentUser || !(CAN_MANAGE_LEARNER_ROLES as readonly string[]).includes(currentUser.role)) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <p>この操作を行う権限がありません</p>
        </div>
      </div>
    );
  }

  const stores = getStores();

  // トラック選択の切り替え
  const toggleTrack = (track: TrackCode) => {
    setTracks(prev =>
      prev.includes(track) ? prev.filter(t => t !== track) : [...prev, track]
    );
  };

  // バリデーション
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = '名前を入力してください';
    if (!email.trim()) newErrors.email = 'メールアドレスを入力してください';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'メールアドレスの形式が不正です';
    if (!organizationId) newErrors.organizationId = '所属店舗を選択してください';
    if (tracks.length === 0) newErrors.tracks = '少なくとも1つのトラックを選択してください';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 送信処理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    addLearner({
      name: name.trim(),
      email: email.trim(),
      organizationId,
      tracks,
      hireDate: hireDate || null,
    });
    router.push('/learners');
  };

  return (
    <div className="page-container">
      {/* パンくずリスト */}
      <nav className="breadcrumb">
        <Link href="/">ホーム</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href="/learners">研修者一覧</Link>
        <span className="breadcrumb-separator">/</span>
        <span>新規登録</span>
      </nav>

      <h1 className="page-title">👤 研修者 新規登録</h1>
      <p className="text-secondary" style={{ marginBottom: 'var(--space-lg)' }}>
        新しいトレーナー候補を登録します。登録後、共通コアの受講を開始できます。
      </p>

      <form onSubmit={handleSubmit}>
        {/* 基本情報 */}
        <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="card-header">📋 基本情報</div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">氏名 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="例: 山田 太郎"
              />
              {errors.name && <div className="text-sm" style={{ color: 'var(--color-danger)', marginTop: '4px' }}>{errors.name}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">メールアドレス <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="例: yamada@element.com"
              />
              {errors.email && <div className="text-sm" style={{ color: 'var(--color-danger)', marginTop: '4px' }}>{errors.email}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">入社日</label>
              <input
                type="date"
                className="form-input"
                value={hireDate}
                onChange={e => setHireDate(e.target.value)}
                style={{ maxWidth: '240px' }}
              />
            </div>
          </div>
        </div>

        {/* 所属 */}
        <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="card-header">🏢 所属店舗</div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">配属先店舗 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <select
                className="form-select"
                value={organizationId}
                onChange={e => setOrganizationId(e.target.value)}
              >
                <option value="">店舗を選択してください</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
              {errors.organizationId && <div className="text-sm" style={{ color: 'var(--color-danger)', marginTop: '4px' }}>{errors.organizationId}</div>}
            </div>
          </div>
        </div>

        {/* 受講トラック */}
        <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="card-header">🏋️ 受講トラック</div>
          <div className="card-body">
            <p className="text-sm text-secondary" style={{ marginBottom: 'var(--space-md)' }}>
              受講する専門コースを選択してください（複数選択可）。<br />
              ※ 共通コアは全トラック共通で自動的に受講対象になります。
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
              {(['weight', 'pilates', 'stretch'] as TrackCode[]).map(track => (
                <label key={track} style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                  cursor: 'pointer', padding: 'var(--space-sm) var(--space-md)',
                  borderRadius: 'var(--border-radius-sm)',
                  border: tracks.includes(track)
                    ? '2px solid var(--color-primary)'
                    : '2px solid var(--color-border)',
                  background: tracks.includes(track)
                    ? 'var(--color-primary-light, #eef2ff)'
                    : 'transparent',
                  transition: 'all 0.15s ease',
                }}>
                  <input
                    type="checkbox"
                    checked={tracks.includes(track)}
                    onChange={() => toggleTrack(track)}
                  />
                  <span className="font-semibold" style={{ fontSize: '1rem' }}>{TRACK_LABELS[track]}</span>
                </label>
              ))}
            </div>
            {errors.tracks && <div className="text-sm" style={{ color: 'var(--color-danger)', marginTop: 'var(--space-sm)' }}>{errors.tracks}</div>}
          </div>
        </div>

        {/* プレビュー */}
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="card-header">👁️ 登録プレビュー</div>
          <div className="card-body">
            <table>
              <tbody>
                <tr>
                  <td className="text-secondary" style={{ width: '140px' }}>氏名</td>
                  <td className="font-semibold">{name || '—'}</td>
                </tr>
                <tr>
                  <td className="text-secondary">メール</td>
                  <td>{email || '—'}</td>
                </tr>
                <tr>
                  <td className="text-secondary">入社日</td>
                  <td>{hireDate || '—'}</td>
                </tr>
                <tr>
                  <td className="text-secondary">所属店舗</td>
                  <td>{stores.find(s => s.id === organizationId)?.name || '—'}</td>
                </tr>
                <tr>
                  <td className="text-secondary">受講トラック</td>
                  <td>
                    {tracks.length > 0
                      ? tracks.map(t => TRACK_LABELS[t]).join(' / ')
                      : '—'}
                  </td>
                </tr>
                <tr>
                  <td className="text-secondary">初期レベル</td>
                  <td><span className="badge badge-muted">Lv0 未認定</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ボタン */}
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
          <Link href="/learners" className="btn btn-outline">
            キャンセル
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? '登録中...' : '👤 研修者を登録する'}
          </button>
        </div>
      </form>
    </div>
  );
}
