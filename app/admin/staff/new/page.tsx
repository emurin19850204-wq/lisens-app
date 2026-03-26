/**
 * LISENS - スタッフ新規登録画面（招待メール方式）
 * 
 * 管理者がフォームに入力 → Netlify Function経由で
 * Supabase Auth招待メール送信 + usersテーブル登録を同時実行。
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getAllOrganizations } from '@/lib/data';
import { getSupabase } from '@/lib/supabase';
import { ROLE_LABELS } from '@/lib/constants';
import type { UserRole, Organization } from '@/lib/types';

/** 登録可能なロール一覧（研修者も含む） */
const ALL_ROLES: { value: UserRole; description: string }[] = [
  { value: 'admin', description: '全権限。スタッフ管理・認定承認・評価が可能' },
  { value: 'education_manager', description: '教育設計・QA管理・認定承認が可能' },
  { value: 'evaluator', description: 'OSCE実技評価・認定申請が可能' },
  { value: 'store_manager', description: '所属店舗の研修者管理・進捗確認が可能' },
  { value: 'learner', description: '研修受講者。マイカルテで進捗確認が可能' },
];

export default function NewStaffPage() {
  const { user: currentUser } = useAuth();
  const [allOrgs, setAllOrgs] = useState<Organization[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [organizationId, setOrganizationId] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ success: boolean; message: string; inviteLink?: string; emailNote?: string } | null>(null);

  useEffect(() => { getAllOrganizations().then(setAllOrgs); }, []);

  if (!currentUser || !['admin', 'education_manager'].includes(currentUser.role)) {
    return (<div className="page-container"><div className="empty-state"><div className="empty-state-icon">🔒</div><p>この操作を行う権限がありません</p></div></div>);
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = '名前を入力してください';
    if (!email.trim()) newErrors.email = 'メールアドレスを入力してください';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'メールアドレスの形式が不正です';
    if (!role) newErrors.role = 'ロールを選択してください';
    if (!organizationId) newErrors.organizationId = '所属を選択してください';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !role) return;
    setIsSubmitting(true);
    setResult(null);

    try {
      // Supabase Authのアクセストークンを取得
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setResult({ success: false, message: '認証セッションが無効です。再ログインしてください。' });
        setIsSubmitting(false);
        return;
      }

      // Netlify Functionを呼び出し
      const response = await fetch('/api/invite-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          role,
          organizationId,
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
        setRole('');
        setOrganizationId('');
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
      <nav className="breadcrumb"><Link href="/">ホーム</Link><span className="breadcrumb-separator">/</span><Link href="/admin/staff">スタッフ管理</Link><span className="breadcrumb-separator">/</span><span>新規招待</span></nav>
      <h1 className="page-title">✉️ ユーザー招待</h1>
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
                    <input type="text" readOnly value={result.inviteLink} className="form-input" style={{ flex: 1, fontSize: '0.75rem', margin: 0 }} onClick={e => (e.target as HTMLInputElement).select()} />
                    <button type="button" className="btn btn-primary" style={{ whiteSpace: 'nowrap', padding: '6px 16px', fontSize: '0.8rem' }} onClick={() => { navigator.clipboard.writeText(result.inviteLink!); alert('クリップボードにコピーしました！'); }}>📋 コピー</button>
                  </div>
                </div>
              )}
              {result.success && (
                <div className="text-sm" style={{ marginTop: 'var(--space-sm)', color: 'var(--color-success)' }}>
                  続けて別のユーザーを招待するか、<Link href="/admin/staff" style={{ textDecoration: 'underline' }}>スタッフ一覧に戻る</Link>ことができます。
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 'var(--space-md)' }}><div className="card-header">📋 基本情報</div><div className="card-body">
          <div className="form-group"><label className="form-label">氏名 <span style={{ color: 'var(--color-danger)' }}>*</span></label><input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="例: 山本 正義" />{errors.name && <div className="text-sm" style={{ color: 'var(--color-danger)', marginTop: '4px' }}>{errors.name}</div>}</div>
          <div className="form-group"><label className="form-label">メールアドレス <span style={{ color: 'var(--color-danger)' }}>*</span></label><input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="例: yamamoto@element.com" />{errors.email && <div className="text-sm" style={{ color: 'var(--color-danger)', marginTop: '4px' }}>{errors.email}</div>}</div>
          <div className="form-group"><label className="form-label">入社日</label><input type="date" className="form-input" value={hireDate} onChange={e => setHireDate(e.target.value)} style={{ maxWidth: '240px' }} /></div>
        </div></div>

        <div className="card" style={{ marginBottom: 'var(--space-md)' }}><div className="card-header">🛡️ ロール（権限レベル）</div><div className="card-body">
          <p className="text-sm text-secondary" style={{ marginBottom: 'var(--space-md)' }}>招待するユーザーの権限レベルを選択してください。</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {ALL_ROLES.map(r => (
              <label key={r.value} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)', cursor: 'pointer', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--border-radius-sm)', border: role === r.value ? '2px solid var(--color-primary)' : '2px solid var(--color-border)', background: role === r.value ? 'var(--color-primary-light, #eef2ff)' : 'transparent', transition: 'all 0.15s ease' }}>
                <input type="radio" name="role" value={r.value} checked={role === r.value} onChange={() => setRole(r.value)} style={{ marginTop: '3px' }} />
                <div><div className="font-semibold">{ROLE_LABELS[r.value]}</div><div className="text-sm text-secondary">{r.description}</div></div>
              </label>
            ))}
          </div>
          {errors.role && <div className="text-sm" style={{ color: 'var(--color-danger)', marginTop: 'var(--space-sm)' }}>{errors.role}</div>}
        </div></div>

        <div className="card" style={{ marginBottom: 'var(--space-md)' }}><div className="card-header">🏢 所属</div><div className="card-body"><div className="form-group">
          <label className="form-label">所属組織 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
          <select className="form-select" value={organizationId} onChange={e => setOrganizationId(e.target.value)}>
            <option value="">選択してください</option>
            {allOrgs.map(org => (<option key={org.id} value={org.id}>{org.name}（{org.type === 'company' ? '会社' : org.type === 'department' ? '部門' : '店舗'}）</option>))}
          </select>
          {errors.organizationId && <div className="text-sm" style={{ color: 'var(--color-danger)', marginTop: '4px' }}>{errors.organizationId}</div>}
        </div></div></div>

        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}><div className="card-header">👁️ 招待プレビュー</div><div className="card-body"><table><tbody>
          <tr><td className="text-secondary" style={{ width: '140px' }}>氏名</td><td className="font-semibold">{name || '—'}</td></tr>
          <tr><td className="text-secondary">メール</td><td>{email || '—'}</td></tr>
          <tr><td className="text-secondary">入社日</td><td>{hireDate || '—'}</td></tr>
          <tr><td className="text-secondary">ロール</td><td>{role ? <span className="badge badge-primary">{ROLE_LABELS[role]}</span> : '—'}</td></tr>
          <tr><td className="text-secondary">所属</td><td>{allOrgs.find(o => o.id === organizationId)?.name || '—'}</td></tr>
        </tbody></table></div></div>

        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
          <Link href="/admin/staff" className="btn btn-outline">キャンセル</Link>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? '送信中...' : '✉️ 招待メールを送信する'}
          </button>
        </div>
      </form>
    </div>
  );
}
