/**
 * LISENS - スタッフ編集画面 - クライアントコンポーネント（Supabase対応）
 */
'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getUserById, updateStaff, getAllOrganizations } from '@/lib/data';
import { ROLE_LABELS } from '@/lib/constants';
import type { UserRole, User, Organization } from '@/lib/types';

const STAFF_ROLES: { value: UserRole; description: string }[] = [
  { value: 'admin', description: '全権限。スタッフ管理・認定承認・評価が可能' },
  { value: 'education_manager', description: '教育設計・QA管理・認定承認が可能' },
  { value: 'evaluator', description: 'OSCE実技評価・認定申請が可能' },
  { value: 'store_manager', description: '所属店舗の研修者管理・進捗確認が可能' },
];

export default function EditStaffClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const [staffUser, setStaffUser] = useState<User | undefined>();
  const [allOrgs, setAllOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [organizationId, setOrganizationId] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      const [user, orgs] = await Promise.all([getUserById(id), getAllOrganizations()]);
      setStaffUser(user);
      setAllOrgs(orgs);
      if (user) {
        setName(user.name);
        setEmail(user.email);
        setRole(user.role);
        setOrganizationId(user.organizationId);
        setHireDate(user.hireDate || '');
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (!currentUser || currentUser.role !== 'admin') {
    return (<div className="page-container"><div className="empty-state"><div className="empty-state-icon">🔒</div><p>この操作を行う権限がありません</p></div></div>);
  }
  if (loading) return <div className="page-container"><div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}><p className="text-secondary">読み込み中...</p></div></div>;
  if (!staffUser || staffUser.role === 'learner') {
    return (<div className="page-container"><div className="empty-state"><div className="empty-state-icon">❌</div><p>スタッフが見つかりません</p><Link href="/admin/staff" className="btn btn-outline" style={{ marginTop: 'var(--space-md)' }}>← スタッフ一覧に戻る</Link></div></div>);
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
    await updateStaff(id, { name: name.trim(), email: email.trim(), role, organizationId, hireDate: hireDate || null });
    router.push('/admin/staff');
  };

  return (
    <div className="page-container">
      <nav className="breadcrumb"><Link href="/">ホーム</Link><span className="breadcrumb-separator">/</span><Link href="/admin/staff">スタッフ管理</Link><span className="breadcrumb-separator">/</span><span>{staffUser.name} を編集</span></nav>
      <h1 className="page-title">✏️ スタッフ編集</h1>
      <p className="text-secondary" style={{ marginBottom: 'var(--space-lg)' }}><strong>{staffUser.name}</strong> さんの情報を編集します。</p>
      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 'var(--space-md)' }}><div className="card-header">📋 基本情報</div><div className="card-body">
          <div className="form-group"><label className="form-label">氏名 <span style={{ color: 'var(--color-danger)' }}>*</span></label><input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="例: 山本 正義" />{errors.name && <div className="text-sm" style={{ color: 'var(--color-danger)', marginTop: '4px' }}>{errors.name}</div>}</div>
          <div className="form-group"><label className="form-label">メールアドレス <span style={{ color: 'var(--color-danger)' }}>*</span></label><input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="例: yamamoto@element.com" />{errors.email && <div className="text-sm" style={{ color: 'var(--color-danger)', marginTop: '4px' }}>{errors.email}</div>}</div>
          <div className="form-group"><label className="form-label">入社日</label><input type="date" className="form-input" value={hireDate} onChange={e => setHireDate(e.target.value)} style={{ maxWidth: '240px' }} /></div>
        </div></div>
        <div className="card" style={{ marginBottom: 'var(--space-md)' }}><div className="card-header">🛡️ ロール（権限レベル）</div><div className="card-body">
          {id === currentUser.id && (
            <div style={{ padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--border-radius-sm)', background: 'var(--color-warning-bg, #fff8e1)', border: '1px solid var(--color-warning)', marginBottom: 'var(--space-md)' }}><span className="text-sm">⚠️ 自分自身のロールを変更すると、ログアウトが必要になる場合があります。</span></div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {STAFF_ROLES.map(r => (
              <label key={r.value} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)', cursor: 'pointer', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--border-radius-sm)', border: role === r.value ? '2px solid var(--color-primary)' : '2px solid var(--color-border)', background: role === r.value ? 'var(--color-primary-light, #eef2ff)' : 'transparent', transition: 'all 0.15s ease' }}>
                <input type="radio" name="role" value={r.value} checked={role === r.value} onChange={() => setRole(r.value)} style={{ marginTop: '3px' }} />
                <div><div className="font-semibold">{ROLE_LABELS[r.value]}</div><div className="text-sm text-secondary">{r.description}</div></div>
              </label>
            ))}
          </div>
          {errors.role && <div className="text-sm" style={{ color: 'var(--color-danger)', marginTop: 'var(--space-sm)' }}>{errors.role}</div>}
        </div></div>
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}><div className="card-header">🏢 所属</div><div className="card-body"><div className="form-group">
          <label className="form-label">所属組織 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
          <select className="form-select" value={organizationId} onChange={e => setOrganizationId(e.target.value)}>
            <option value="">選択してください</option>
            {allOrgs.map(org => (<option key={org.id} value={org.id}>{org.name}（{org.type === 'company' ? '会社' : org.type === 'department' ? '部門' : '店舗'}）</option>))}
          </select>
          {errors.organizationId && <div className="text-sm" style={{ color: 'var(--color-danger)', marginTop: '4px' }}>{errors.organizationId}</div>}
        </div></div></div>
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
          <Link href="/admin/staff" className="btn btn-outline">キャンセル</Link>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? '保存中...' : '✏️ 変更を保存する'}</button>
        </div>
      </form>
    </div>
  );
}
