/**
 * LISENS - 受講者招待画面
 * 
 * 管理者が受講者をメール招待するページ。
 * 招待メールからパスワード設定→ログインの流れ。
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getAllOrganizations, getStores } from '@/lib/data';
import { getSupabase } from '@/lib/supabase';
import { TRACK_LABELS, TRACK_BADGE_CLASS } from '@/lib/constants';
import type { TrackCode, Organization } from '@/lib/types';

/** 選択可能なトラック */
const ALL_TRACKS: { value: TrackCode; description: string }[] = [
  { value: 'weight', description: 'ウェイトトレーニングの指導技術' },
  { value: 'pilates', description: 'ピラティスの指導技術' },
  { value: 'stretch', description: 'ストレッチの指導技術' },
];

export default function InviteLearnerPage() {
  const { user: currentUser } = useAuth();
  const [allOrgs, setAllOrgs] = useState<Organization[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [tracks, setTracks] = useState<TrackCode[]>([]);
  const [hireDate, setHireDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ success: boolean; message: string; inviteLink?: string; emailNote?: string } | null>(null);

  useEffect(() => {
    // 店舗一覧を取得（受講者は通常店舗に所属）
    getAllOrganizations().then(setAllOrgs);
  }, []);

  if (!currentUser || !['admin', 'education_manager'].includes(currentUser.role)) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <p>この操作を行う権限がありません</p>
        </div>
      </div>
    );
  }

  // トラック選択のトグル
  const toggleTrack = (track: TrackCode) => {
    setTracks(prev =>
      prev.includes(track)
        ? prev.filter(t => t !== track)
        : [...prev, track]
    );
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = '名前を入力してください';
    if (!email.trim()) newErrors.email = 'メールアドレスを入力してください';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'メールアドレスの形式が不正です';
    if (!organizationId) newErrors.organizationId = '所属店舗を選択してください';
    if (tracks.length === 0) newErrors.tracks = 'トラックを1つ以上選択してください';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setResult(null);

    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setResult({ success: false, message: '認証セッションが無効です。再ログインしてください。' });
        setIsSubmitting(false);
        return;
      }

      // Netlify Function を呼び出し（role: 'learner' で送信）
      const response = await fetch('/api/invite-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          role: 'learner',
          organizationId,
          tracks,
          hireDate: hireDate || null,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: data.message,
          inviteLink: data.inviteLink,
          emailNote: data.emailNote || null,
        });
        // フォームをリセット
        setName('');
        setEmail('');
        setOrganizationId('');
        setTracks([]);
        setHireDate('');
      } else {
        setResult({ success: false, message: data.error || '招待の送信に失敗しました' });
      }
    } catch (err) {
      console.error('招待エラー:', err);
      setResult({ success: false, message: 'ネットワークエラーが発生しました' });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="page-container">
      <nav className="breadcrumb">
        <Link href="/">ホーム</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href="/learners">研修者一覧</Link>
        <span className="breadcrumb-separator">/</span>
        <span>メール招待</span>
      </nav>
      <h1 className="page-title">✉️ 研修者をメール招待</h1>
      <p className="text-secondary" style={{ marginBottom: 'var(--space-lg)' }}>
        アカウントを作成し、招待リンクを発行します。リンクからパスワードを設定してログインできます。
      </p>

      {/* 結果表示 */}
      {result && (
        <div className="card" style={{
          marginBottom: 'var(--space-md)',
          borderColor: result.success ? 'var(--color-success)' : 'var(--color-danger)',
          background: result.success ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)',
        }}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)' }}>
            <span style={{ fontSize: '1.5rem' }}>{result.success ? '✅' : '❌'}</span>
            <div style={{ flex: 1 }}>
              <div className="font-semibold">{result.success ? '招待完了' : 'エラー'}</div>
              <div className="text-sm text-secondary">{result.message}</div>
              {/* メール送信できなかった場合の注意書き */}
              {result.success && result.emailNote && (
                <div className="text-sm" style={{ marginTop: 'var(--space-xs)', padding: '6px 10px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '6px', color: 'var(--color-warning, #f59e0b)' }}>
                  ⚠️ {result.emailNote}
                </div>
              )}
              {/* 招待リンク表示（常に目立たせる） */}
              {result.success && result.inviteLink && (
                <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-sm) var(--space-md)', background: 'var(--color-bg, #0f172a)', borderRadius: '8px', border: '2px solid var(--color-primary, #6366f1)' }}>
                  <div className="text-sm font-semibold" style={{ marginBottom: '6px' }}>🔗 招待リンク — このリンクを招待者に共有してください:</div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      readOnly
                      value={result.inviteLink}
                      className="form-input"
                      style={{ flex: 1, fontSize: '0.75rem', margin: 0 }}
                      onClick={e => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ whiteSpace: 'nowrap', padding: '6px 16px', fontSize: '0.8rem' }}
                      onClick={() => { navigator.clipboard.writeText(result.inviteLink!); alert('クリップボードにコピーしました！'); }}
                    >
                      📋 コピー
                    </button>
                  </div>
                </div>
              )}
              {result.success && (
                <div className="text-sm" style={{ marginTop: 'var(--space-sm)', color: 'var(--color-success)' }}>
                  続けて別の研修者を招待するか、<Link href="/learners" style={{ textDecoration: 'underline' }}>研修者一覧に戻る</Link>ことができます。
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* 基本情報 */}
        <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="card-header">📋 基本情報</div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">氏名 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="例: 佐藤 太郎" />
              {errors.name && <div className="text-sm" style={{ color: 'var(--color-danger)', marginTop: '4px' }}>{errors.name}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">メールアドレス <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="例: sato@element.com" />
              {errors.email && <div className="text-sm" style={{ color: 'var(--color-danger)', marginTop: '4px' }}>{errors.email}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">入社日</label>
              <input type="date" className="form-input" value={hireDate} onChange={e => setHireDate(e.target.value)} style={{ maxWidth: '240px' }} />
            </div>
          </div>
        </div>

        {/* 所属店舗 */}
        <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="card-header">🏢 所属</div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">所属組織 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <select className="form-select" value={organizationId} onChange={e => setOrganizationId(e.target.value)}>
                <option value="">選択してください</option>
                {allOrgs.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.name}（{org.type === 'company' ? '会社' : org.type === 'department' ? '部門' : '店舗'}）
                  </option>
                ))}
              </select>
              {errors.organizationId && <div className="text-sm" style={{ color: 'var(--color-danger)', marginTop: '4px' }}>{errors.organizationId}</div>}
            </div>
          </div>
        </div>

        {/* トラック選択 */}
        <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="card-header">🎯 受講トラック</div>
          <div className="card-body">
            <p className="text-sm text-secondary" style={{ marginBottom: 'var(--space-md)' }}>
              受講する専門トラックを選択してください（複数選択可）。
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {ALL_TRACKS.map(t => (
                <label key={t.value} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)',
                  cursor: 'pointer', padding: 'var(--space-sm) var(--space-md)',
                  borderRadius: 'var(--border-radius-sm)',
                  border: tracks.includes(t.value) ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                  background: tracks.includes(t.value) ? 'var(--color-primary-light, #eef2ff)' : 'transparent',
                  transition: 'all 0.15s ease',
                }}>
                  <input
                    type="checkbox"
                    checked={tracks.includes(t.value)}
                    onChange={() => toggleTrack(t.value)}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <div className="font-semibold">
                      <span className={`badge ${TRACK_BADGE_CLASS[t.value]}`} style={{ marginRight: 'var(--space-xs)' }}>
                        {TRACK_LABELS[t.value]}
                      </span>
                    </div>
                    <div className="text-sm text-secondary">{t.description}</div>
                  </div>
                </label>
              ))}
            </div>
            {errors.tracks && <div className="text-sm" style={{ color: 'var(--color-danger)', marginTop: 'var(--space-sm)' }}>{errors.tracks}</div>}
          </div>
        </div>

        {/* プレビュー */}
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="card-header">👁️ 招待プレビュー</div>
          <div className="card-body">
            <table><tbody>
              <tr><td className="text-secondary" style={{ width: '140px' }}>氏名</td><td className="font-semibold">{name || '—'}</td></tr>
              <tr><td className="text-secondary">メール</td><td>{email || '—'}</td></tr>
              <tr><td className="text-secondary">入社日</td><td>{hireDate || '—'}</td></tr>
              <tr><td className="text-secondary">ロール</td><td><span className="badge badge-info">トレーナー候補</span></td></tr>
              <tr><td className="text-secondary">所属</td><td>{allOrgs.find(o => o.id === organizationId)?.name || '—'}</td></tr>
              <tr>
                <td className="text-secondary">トラック</td>
                <td>
                  {tracks.length > 0 ? (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {tracks.map(t => (
                        <span key={t} className={`badge ${TRACK_BADGE_CLASS[t]}`}>{TRACK_LABELS[t]}</span>
                      ))}
                    </div>
                  ) : '—'}
                </td>
              </tr>
            </tbody></table>
          </div>
        </div>

        {/* 送信ボタン */}
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
          <Link href="/learners" className="btn btn-outline">キャンセル</Link>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? '送信中...' : '✉️ 招待メールを送信する'}
          </button>
        </div>
      </form>
    </div>
  );
}
