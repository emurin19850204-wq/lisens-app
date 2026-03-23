/**
 * LISENS - レベル認定一覧画面
 * 
 * 全認定の一覧をステータスで絞り込んで表示する。
 * 承認権限を持つロールには承認/差し戻しリンクを表示する。
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getAllCertifications } from '@/lib/data';
import {
  CERTIFICATION_STATUS_LABELS,
  CERTIFICATION_STATUS_BADGE_CLASS,
  LEVEL_BADGE_CLASS,
  CAN_APPROVE_CERTIFICATION_ROLES,
} from '@/lib/constants';
import type { CertificationStatus } from '@/lib/types';

type FilterStatus = CertificationStatus | 'all';

export default function CertificationsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterStatus>('all');

  if (!user) return null;

  const allCerts = getAllCertifications();

  // ロールによるフィルタリング
  const roleScopedCerts = user.role === 'learner'
    ? allCerts.filter(c => c.certification.learnerId === user.id)
    : user.role === 'store_manager'
      ? allCerts.filter(c => c.learner.organizationId === user.organizationId)
      : allCerts;

  // ステータスフィルター
  const filteredCerts = filter === 'all'
    ? roleScopedCerts
    : roleScopedCerts.filter(c => c.certification.status === filter);

  const canApprove = CAN_APPROVE_CERTIFICATION_ROLES.includes(user.role);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🏆 レベル認定一覧</h1>
      </div>

      {/* フィルター */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
        {(['all', 'pending', 'certified', 'rejected'] as FilterStatus[]).map(status => (
          <button
            key={status}
            className={`btn ${filter === status ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? 'すべて' : CERTIFICATION_STATUS_LABELS[status]}
            <span style={{ marginLeft: '4px', opacity: 0.7 }}>
              ({status === 'all'
                ? roleScopedCerts.length
                : roleScopedCerts.filter(c => c.certification.status === status).length})
            </span>
          </button>
        ))}
      </div>

      {/* 認定一覧 */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>研修者</th>
                  <th>認定レベル</th>
                  <th>ステータス</th>
                  <th>申請者</th>
                  <th>申請日</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredCerts.map(c => (
                  <tr key={c.certification.id}>
                    <td>
                      <Link href={`/learners/${c.learner.id}`} style={{ fontWeight: 600 }}>
                        {c.learner.name}
                      </Link>
                    </td>
                    <td>
                      <span className={`badge ${LEVEL_BADGE_CLASS[c.level.code]}`}>
                        {c.level.name}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${CERTIFICATION_STATUS_BADGE_CLASS[c.certification.status]}`}>
                        {CERTIFICATION_STATUS_LABELS[c.certification.status]}
                      </span>
                    </td>
                    <td className="text-sm">{c.applicant.name}</td>
                    <td className="text-sm text-secondary">
                      {new Date(c.certification.appliedAt).toLocaleDateString('ja-JP')}
                    </td>
                    <td>
                      <Link href={`/certifications/${c.certification.id}`} className="btn btn-outline btn-sm">
                        {canApprove && c.certification.status === 'pending' ? '確認・承認' : '詳細'}
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredCerts.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <div className="empty-state-icon">🏆</div>
                        <p>該当する認定がありません</p>
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
