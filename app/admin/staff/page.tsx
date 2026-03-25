/**
 * LISENS - スタッフ（管理者）一覧画面（Supabase対応）
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getStaffList, getOrganizationById, deleteStaff } from '@/lib/data';
import { ROLE_LABELS, LEVEL_LABELS, LEVEL_BADGE_CLASS } from '@/lib/constants';
import type { User, Organization } from '@/lib/types';

export default function StaffListPage() {
  const { user } = useAuth();
  const [staffList, setStaffList] = useState<User[]>([]);
  const [orgMap, setOrgMap] = useState<Record<string, Organization>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const staff = await getStaffList();
      setStaffList(staff);
      // 所属組織を一括取得
      const orgs: Record<string, Organization> = {};
      const uniqueOrgIds = [...new Set(staff.map(s => s.organizationId))];
      for (const orgId of uniqueOrgIds) {
        const org = await getOrganizationById(orgId);
        if (org) orgs[orgId] = org;
      }
      setOrgMap(orgs);
      setLoading(false);
    };
    load();
  }, [user]);

  if (!user) return null;
  if (user.role !== 'admin') {
    return (<div className="page-container"><div className="empty-state"><div className="empty-state-icon">🔒</div><p>この画面にアクセスする権限がありません</p><Link href="/" className="btn btn-outline" style={{ marginTop: 'var(--space-md)' }}>← ホームに戻る</Link></div></div>);
  }
  if (loading) return <div className="page-container"><div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}><p className="text-secondary">読み込み中...</p></div></div>;

  const handleDelete = async (id: string, name: string) => {
    if (id === user.id) { alert('自分自身を削除することはできません。'); return; }
    if (!confirm(`${name}さんをスタッフから削除しますか？\nこの操作は元に戻せません。`)) return;
    await deleteStaff(id);
    setStaffList(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        <div><h1 className="page-title">🛡️ スタッフ管理</h1><span className="text-secondary text-sm">{staffList.length}名</span></div>
        <Link href="/admin/staff/new" className="btn btn-primary">✉️ ユーザー招待</Link>
      </div>
      <div className="card"><div className="card-body" style={{ padding: 0 }}><div className="table-container"><table>
        <thead><tr><th>氏名</th><th>メール</th><th>ロール</th><th>所属</th><th>レベル</th><th>入社日</th><th>操作</th></tr></thead>
        <tbody>
          {staffList.map(s => (
            <tr key={s.id}>
              <td className="font-semibold">{s.name}</td>
              <td className="text-sm text-secondary">{s.email}</td>
              <td><span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>{ROLE_LABELS[s.role]}</span></td>
              <td className="text-sm">{orgMap[s.organizationId]?.name || '—'}</td>
              <td><span className={`badge ${LEVEL_BADGE_CLASS[s.currentLevel]}`} style={{ fontSize: '0.7rem' }}>{LEVEL_LABELS[s.currentLevel]}</span></td>
              <td className="text-sm text-secondary">{s.hireDate || '—'}</td>
              <td>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <Link href={`/admin/staff/${s.id}/edit`} className="btn btn-outline btn-sm">✏️ 編集</Link>
                  {s.id !== user.id ? (
                    <button className="btn btn-sm" style={{ color: 'var(--color-danger)', border: '1px solid var(--color-danger)', background: 'transparent', cursor: 'pointer' }} onClick={() => handleDelete(s.id, s.name)}>🗑</button>
                  ) : (<span className="text-sm text-secondary">（自分）</span>)}
                </div>
              </td>
            </tr>
          ))}
          {staffList.length === 0 && (<tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">📭</div><p>スタッフが登録されていません</p></div></td></tr>)}
        </tbody>
      </table></div></div></div>
    </div>
  );
}
