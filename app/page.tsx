/**
 * LISENS - ホーム画面（ダッシュボード）
 * 
 * ロール別に表示内容を変える。
 * - 管理系ロール: 統計カード + 承認待ちの認定
 * - 受講者: 自分のカルテに自動リダイレクト
 */
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getDashboardStats, getAllCertifications } from '@/lib/data';
import { ROLE_LABELS, CERTIFICATION_STATUS_BADGE_CLASS } from '@/lib/constants';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  // 受講者は自分のカルテに自動リダイレクト
  useEffect(() => {
    if (user && user.role === 'learner') {
      router.replace(`/learners/${user.id}`);
    }
  }, [user, router]);

  if (!user) return null;

  // 受講者はリダイレクト中
  if (user.role === 'learner') {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
          <p className="text-secondary">マイカルテに移動中...</p>
        </div>
      </div>
    );
  }

  // 管理系ロール向けダッシュボード
  const stats = getDashboardStats();
  const pendingCerts = getAllCertifications().filter(c => c.certification.status === 'pending');

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">ダッシュボード</h1>
        <span className="text-secondary">
          ようこそ、{user.name}さん（{ROLE_LABELS[user.role]}）
        </span>
      </div>

      {/* 統計カード */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <StatCard icon="👥" label="研修者数" value={stats.totalLearners} linkTo="/learners" />
        <StatCard icon="⏳" label="承認待ち認定" value={stats.pendingCertifications} linkTo="/certifications" highlight={stats.pendingCertifications > 0} />
        <StatCard icon="📝" label="直近の評価" value={stats.recentEvaluations} />
        <StatCard icon="📚" label="カリキュラム数" value={stats.totalCurricula} />
      </div>

      {/* 承認待ちの認定一覧 */}
      {pendingCerts.length > 0 && (
        <div className="card">
          <div className="card-header">⏳ 承認待ちの認定申請</div>
          <div className="card-body">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>研修者</th>
                    <th>申請レベル</th>
                    <th>申請者</th>
                    <th>申請日</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCerts.map(c => (
                    <tr key={c.certification.id}>
                      <td>{c.learner.name}</td>
                      <td><span className={`badge ${CERTIFICATION_STATUS_BADGE_CLASS[c.certification.status]}`}>{c.level.name}</span></td>
                      <td>{c.applicant.name}</td>
                      <td>{new Date(c.certification.appliedAt).toLocaleDateString('ja-JP')}</td>
                      <td>
                        <Link href={`/certifications/${c.certification.id}`} className="btn btn-outline btn-sm">
                          詳細
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** 統計カード */
function StatCard({ icon, label, value, linkTo, highlight }: {
  icon: string;
  label: string;
  value: number;
  linkTo?: string;
  highlight?: boolean;
}) {
  const content = (
    <div className="card" style={{
      padding: 'var(--space-lg)',
      borderLeft: highlight ? '4px solid var(--color-warning)' : undefined,
      cursor: linkTo ? 'pointer' : undefined,
      transition: 'all var(--transition-fast)',
    }}>
      <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-xs)' }}>{icon}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: '700', color: highlight ? 'var(--color-warning)' : 'var(--color-text)' }}>
        {value}
      </div>
      <div className="text-secondary text-sm">{label}</div>
    </div>
  );

  if (linkTo) {
    return <Link href={linkTo} style={{ textDecoration: 'none' }}>{content}</Link>;
  }
  return content;
}
