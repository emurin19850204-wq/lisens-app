/**
 * LISENS - スタッフ（管理者）新規登録画面
 *
 * 本部管理者が新しいスタッフを登録する。
 * ロール（教育責任者/評価者/店舗責任者/本部管理者）を選択して登録。
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { addStaff, getAllOrganizations } from '@/lib/data';
import { ROLE_LABELS } from '@/lib/constants';
import type { UserRole } from '@/lib/types';

/** 登録可能なスタッフロール */
const STAFF_ROLES: { value: UserRole; description: string }[] = [
  { value: 'admin', description: '全権限。スタッフ管理・認定承認・評価が可能' },
  { value: 'education_manager', description: '教育設計・QA管理・認定承認が可能' },
  { value: 'evaluator', description: 'OSCE実技評価・認定申請が可能' },
  { value: 'store_manager', description: '所属店舗の研修者管理・進捗確認が可能' },
];

export default function NewStaffPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [organizationId, setOrganizationId] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 権限チェック
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <p>この操作を行う権限がありません</p>
        </div>
      </div>
    );
  }

  const allOrgs = getAllOrganizations();

  // バリデーション
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !role) return;

    setIsSubmitting(true);
    addStaff({
      name: name.trim(),
      email: email.trim(),
      role,
      organizationId,
      hireDate: hireDate || null,
    });
    router.push('/admin/staff');
  };

  return (
    <div className="page-container">
      <nav className="breadcrumb">
        <Link href="/">ホーム</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href="/admin/staff">スタッフ管理</Link>
        <span className="breadcrumb-separator">/</span>
        <span>新規登録</span>
      </nav>

      <h1 className="page-title">🛡️ スタッフ 新規登録</h1>
      <p className="text-secondary" style={{ marginBottom: 'var(--space-lg)' }}>
        管理者・教育責任者・評価者・店舗責任者を新規登録します。
      </p>

      <form onSubmit={handleSubmit}>
        {/* 基本情報 */}
        <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="card-header">📋 基本情報</div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">氏名 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="例: 山本 正義" />
              {errors.name && <div className="text-sm" style={{ color: 'var(--color-danger)', marginTop: '4px' }}>{errors.name}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">メールアドレス <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="例: yamamoto@element.com" />
              {errors.email && <div className="text-sm" style={{ color: 'var(--color-danger)', marginTop: '4px' }}>{errors.email}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">入社日</label>
              <input type="date" className="form-input" value={hireDate} onChange={e => setHireDate(e.target.value)} style={{ maxWidth: '240px' }} />
            </div>
          </div>
        </div>

        {/* ロール */}
        <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="card-header">🛡️ ロール（権限レベル）</div>
          <div className="card-body">
            <p className="text-sm text-secondary" style={{ marginBottom: 'var(--space-md)' }}>
              登録するスタッフの権限レベルを選択してください。
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {STAFF_ROLES.map(r => (
                <label key={r.value} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)',
                  cursor: 'pointer', padding: 'var(--space-sm) var(--space-md)',
                  borderRadius: 'var(--border-radius-sm)',
                  border: role === r.value ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                  background: role === r.value ? 'var(--color-primary-light, #eef2ff)' : 'transparent',
                  transition: 'all 0.15s ease',
                }}>
                  <input type="radio" name="role" value={r.value} checked={role === r.value} onChange={() => setRole(r.value)} style={{ marginTop: '3px' }} />
                  <div>
                    <div className="font-semibold">{ROLE_LABELS[r.value]}</div>
                    <div className="text-sm text-secondary">{r.description}</div>
                  </div>
                </label>
              ))}
            </div>
            {errors.role && <div className="text-sm" style={{ color: 'var(--color-danger)', marginTop: 'var(--space-sm)' }}>{errors.role}</div>}
          </div>
        </div>

        {/* 所属 */}
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

        {/* プレビュー */}
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="card-header">👁️ 登録プレビュー</div>
          <div className="card-body">
            <table>
              <tbody>
                <tr><td className="text-secondary" style={{ width: '140px' }}>氏名</td><td className="font-semibold">{name || '—'}</td></tr>
                <tr><td className="text-secondary">メール</td><td>{email || '—'}</td></tr>
                <tr><td className="text-secondary">入社日</td><td>{hireDate || '—'}</td></tr>
                <tr><td className="text-secondary">ロール</td><td>{role ? <span className="badge badge-primary">{ROLE_LABELS[role]}</span> : '—'}</td></tr>
                <tr><td className="text-secondary">所属</td><td>{allOrgs.find(o => o.id === organizationId)?.name || '—'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ボタン */}
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
          <Link href="/admin/staff" className="btn btn-outline">キャンセル</Link>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? '登録中...' : '🛡️ スタッフを登録する'}
          </button>
        </div>
      </form>
    </div>
  );
}
