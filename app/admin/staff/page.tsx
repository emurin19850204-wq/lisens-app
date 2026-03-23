/**
 * LISENS - スタッフ（管理者）一覧画面
 *
 * 管理者・教育責任者・評価者・店舗責任者の一覧を表示する。
 * 本部管理者のみが新規登録・削除可能。
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getStaffList, getOrganizationById, deleteStaff } from '@/lib/data';
import { ROLE_LABELS, LEVEL_LABELS, LEVEL_BADGE_CLASS } from '@/lib/constants';

export default function StaffListPage() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  if (!user) return null;

  // 本部管理者のみアクセス可能
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

  const staffList = getStaffList();

  const handleDelete = (id: string, name: string) => {
    if (id === user.id) {
      alert('自分自身を削除することはできません。');
      return;
    }
    if (!confirm(`${name}さんをスタッフから削除しますか？\nこの操作は元に戻せません。`)) return;
    deleteStaff(id);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="page-container" key={refreshKey}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        <div>
          <h1 className="page-title">🛡️ スタッフ管理</h1>
          <span className="text-secondary text-sm">{staffList.length}名</span>
        </div>
        <Link href="/admin/staff/new" className="btn btn-primary">
          ➕ スタッフ登録
        </Link>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
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
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map(s => {
                  const org = getOrganizationById(s.organizationId);
                  return (
                    <tr key={s.id}>
                      <td className="font-semibold">{s.name}</td>
                      <td className="text-sm text-secondary">{s.email}</td>
                      <td>
                        <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                          {ROLE_LABELS[s.role]}
                        </span>
                      </td>
                      <td className="text-sm">{org?.name || '—'}</td>
                      <td>
                        <span className={`badge ${LEVEL_BADGE_CLASS[s.currentLevel]}`} style={{ fontSize: '0.7rem' }}>
                          {LEVEL_LABELS[s.currentLevel]}
                        </span>
                      </td>
                      <td className="text-sm text-secondary">{s.hireDate || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <Link href={`/admin/staff/${s.id}/edit`} className="btn btn-outline btn-sm">
                            ✏️ 編集
                          </Link>
                          {s.id !== user.id ? (
                            <button
                              className="btn btn-sm"
                              style={{ color: 'var(--color-danger)', border: '1px solid var(--color-danger)', background: 'transparent', cursor: 'pointer' }}
                              onClick={() => handleDelete(s.id, s.name)}
                            >
                              🗑
                            </button>
                          ) : (
                            <span className="text-sm text-secondary">（自分）</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
