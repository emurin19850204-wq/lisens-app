/**
 * LISENS - スタッフ（管理者）一覧画面 v2.0
 * プレミアムテーブルデザイン
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getStaffList, getOrganizationById } from '@/lib/data';
import { getSupabase } from '@/lib/supabase';
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
          <div className="skeleton" style={{ width: 220, height: 28, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 120, height: 16 }} />
        </div>
        <div className="skeleton" style={{ height: 400, borderRadius: 'var(--border-radius)' }} />
      </div>
    );
  }

  const handleDelete = async (id: string, name: string) => {
    if (id === user.id) { alert('自分自身を削除することはできません。'); return; }
    if (!confirm(`${name}さんを削除しますか？\nユーザーアカウントも同時に削除されます。\nこの操作は元に戻せません。`)) return;
    
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { alert('認証エラー。再ログインしてください。'); return; }

      const res = await fetch('/api/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ userId: id }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStaffList(prev => prev.filter(s => s.id !== id));
      } else {
        alert(data.error || '削除に失敗しました');
      }
    } catch {
      alert('削除中にエラーが発生しました');
    }
  };

  return (
    <div className="page-container">
      {/* ヘッダー */}
      <div className="page-header">
        <div>
          <h1 className="page-title">🛡️ スタッフ管理</h1>
          <p className="text-secondary text-sm" style={{ marginTop: 4 }}>
            {staffList.length}名のスタッフ
          </p>
        </div>
        <Link href="/admin/staff/new" className="btn btn-primary">
          ✉️ ユーザー招待
        </Link>
      </div>

      {/* スタッフテーブル */}
      <div className="card animate-fadeInUp">
        <div style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>氏名</th>
                  <th>メール</th>
                  <th>ロール</th>
                  <th>所属</th>
                  <th>レベル</th>
                  <th>入社日</th>
                  <th style={{ textAlign: 'right' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((s, idx) => (
                  <tr key={s.id} className="animate-fadeIn" style={{ animationDelay: `${idx * 0.03}s` }}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td className="text-sm text-secondary">{s.email}</td>
                    <td>
                      <span className="badge badge-primary">{ROLE_LABELS[s.role]}</span>
                    </td>
                    <td className="text-sm">{orgMap[s.organizationId]?.name || '—'}</td>
                    <td>
                      <span className={`badge ${LEVEL_BADGE_CLASS[s.currentLevel]}`}>
                        {LEVEL_LABELS[s.currentLevel]}
                      </span>
                    </td>
                    <td className="text-sm text-secondary">{s.hireDate || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Link href={`/admin/staff/${s.id}/edit`} className="btn btn-outline btn-sm">
                          ✏️ 編集
                        </Link>
                        {s.id !== user.id ? (
                          <button
                            className="btn btn-sm btn-ghost"
                            style={{ color: 'var(--color-danger)' }}
                            onClick={() => handleDelete(s.id, s.name)}
                            title="削除"
                          >
                            🗑
                          </button>
                        ) : (
                          <span className="badge badge-muted" style={{ fontSize: '0.65rem' }}>自分</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {staffList.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <div className="empty-state-icon">📭</div>
                        <p>スタッフが登録されていません</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
