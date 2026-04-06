/**
 * LISENS - ホーム画面（ダッシュボード）v2.0
 * 
 * リッチな統計カード、アニメーション付きカウンター、
 * モダンなテーブルデザインのプレミアムダッシュボード。
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getDashboardStats, getAllCertifications } from '@/lib/data';
import { ROLE_LABELS, CERTIFICATION_STATUS_BADGE_CLASS } from '@/lib/constants';
import type { CertificationWithDetails } from '@/lib/types';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ totalLearners: 0, pendingCertifications: 0, recentEvaluations: 0, totalCurricula: 0 });
  const [pendingCerts, setPendingCerts] = useState<CertificationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // 受講者は自分のカルテに自動リダイレクト
  useEffect(() => {
    if (user && user.role === 'learner') {
      router.replace(`/learners/${user.id}`);
    }
  }, [user, router]);

  // データ取得
  useEffect(() => {
    if (!user || user.role === 'learner') return;
    const load = async () => {
      const [s, certs] = await Promise.all([getDashboardStats(), getAllCertifications()]);
      setStats(s);
      setPendingCerts(certs.filter(c => c.certification.status === 'pending'));
      setLoading(false);
    };
    load();
  }, [user]);

  if (!user) return null;
  if (user.role === 'learner') {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p className="text-secondary">マイカルテに移動中...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container">
        {/* スケルトンローダー */}
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="skeleton" style={{ width: 200, height: 28, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 300, height: 16 }} />
        </div>
        <div className="grid grid-auto" style={{ marginBottom: 'var(--space-xl)' }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton" style={{ height: 130, borderRadius: 'var(--border-radius)' }} />
          ))}
        </div>
        <div className="skeleton" style={{ height: 300, borderRadius: 'var(--border-radius)' }} />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* ヘッダー */}
      <div className="page-header" style={{ marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 className="page-title">ダッシュボード</h1>
          <p className="text-secondary text-sm" style={{ marginTop: 4 }}>
            ようこそ、{user.name}さん（{ROLE_LABELS[user.role]}）
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <Link href="/learners" className="btn btn-outline" style={{ fontSize: '0.8rem' }}>
            👥 研修者一覧
          </Link>
          <Link href="/certifications" className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
            🏆 認定管理
          </Link>
        </div>
      </div>

      {/* 統計カードグリッド */}
      <div className="grid grid-auto" style={{ marginBottom: 'var(--space-xl)' }}>
        <StatCard
          icon="👥" label="研修者数" value={stats.totalLearners}
          linkTo="/learners" color="var(--color-primary-light)"
          delay={0}
        />
        <StatCard
          icon="⏳" label="承認待ち認定" value={stats.pendingCertifications}
          linkTo="/certifications" highlight={stats.pendingCertifications > 0}
          color="var(--color-warning-light)"
          delay={1}
        />
        <StatCard
          icon="📝" label="直近の評価" value={stats.recentEvaluations}
          color="var(--color-info-light)"
          delay={2}
        />
        <StatCard
          icon="📚" label="カリキュラム数" value={stats.totalCurricula}
          color="var(--color-success-light)"
          delay={3}
        />
      </div>

      {/* 承認待ちの認定一覧 */}
      {pendingCerts.length > 0 && (
        <div className="card animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <div className="card-header">
            <span style={{ fontSize: '1.1rem' }}>⏳</span>
            承認待ちの認定申請
            <span className="badge badge-warning" style={{ marginLeft: 'auto' }}>
              {pendingCerts.length}件
            </span>
          </div>
          <div style={{ padding: 0 }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>研修者</th>
                    <th>申請レベル</th>
                    <th>申請者</th>
                    <th>申請日</th>
                    <th style={{ textAlign: 'right' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCerts.map((c, idx) => (
                    <tr key={c.certification.id} className="animate-fadeIn" style={{ animationDelay: `${0.3 + idx * 0.05}s` }}>
                      <td style={{ fontWeight: 600 }}>{c.learner.name}</td>
                      <td>
                        <span className={`badge ${CERTIFICATION_STATUS_BADGE_CLASS[c.certification.status]}`}>
                          {c.level.name}
                        </span>
                      </td>
                      <td className="text-secondary">{c.applicant.name}</td>
                      <td className="text-secondary text-sm">
                        {new Date(c.certification.appliedAt).toLocaleDateString('ja-JP')}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link href={`/certifications/${c.certification.id}`} className="btn btn-outline btn-sm">
                          詳細を見る →
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

      {/* 承認待ちがない場合 */}
      {pendingCerts.length === 0 && (
        <div className="card animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <div className="card-body">
            <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
              <div className="empty-state-icon">✅</div>
              <p style={{ fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                すべて処理済みです
              </p>
              <p className="text-sm text-muted">現在、承認待ちの認定申請はありません。</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** 統計カード */
function StatCard({ icon, label, value, linkTo, highlight, color, delay }: {
  icon: string; label: string; value: number; linkTo?: string; highlight?: boolean; color?: string; delay?: number;
}) {
  const content = (
    <div
      className={`stat-card ${highlight ? 'stat-card-highlight' : ''} animate-fadeInUp`}
      style={{ animationDelay: `${(delay || 0) * 0.08}s` }}
    >
      {/* アイコン */}
      <div className="stat-card-icon" style={{ background: color || 'var(--color-primary-light)' }}>
        {icon}
      </div>
      {/* 数値 */}
      <div className="stat-card-value">{value}</div>
      {/* ラベル */}
      <div className="stat-card-label">{label}</div>
      {/* リンクインジケーター */}
      {linkTo && (
        <div style={{
          position: 'absolute', bottom: 12, right: 14,
          fontSize: '0.7rem', color: 'var(--color-text-muted)',
          opacity: 0, transition: 'opacity var(--transition-base)'
        }} className="stat-link-hint">
          詳細 →
        </div>
      )}
    </div>
  );
  if (linkTo) return <Link href={linkTo} style={{ textDecoration: 'none' }}>{content}</Link>;
  return content;
}
