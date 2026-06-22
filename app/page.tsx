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
import { getDashboardStats, getAllCertifications, getLearnerSummaries } from '@/lib/data';
import { ROLE_LABELS, CERTIFICATION_STATUS_BADGE_CLASS } from '@/lib/constants';
import type { CertificationWithDetails, LearnerSummary } from '@/lib/types';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ totalLearners: 0, pendingCertifications: 0, recentEvaluations: 0, totalCurricula: 0 });
  const [pendingCerts, setPendingCerts] = useState<CertificationWithDetails[]>([]);
  const [summaries, setSummaries] = useState<LearnerSummary[]>([]);
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
      const [s, certs, sums] = await Promise.all([
        getDashboardStats(),
        getAllCertifications(),
        getLearnerSummaries(user),
      ]);
      setStats(s);
      setPendingCerts(certs.filter(c => c.certification.status === 'pending'));
      setSummaries(sums);
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

  // 進捗俯瞰の集計（研修管理者が全体を一目で把握するため）
  const ovTotal = summaries.length;
  const ovAvg = ovTotal > 0 ? Math.round(summaries.reduce((a, s) => a + s.overallProgress, 0) / ovTotal) : 0;
  const ovCompleted = summaries.filter(s => s.overallProgress === 100).length;
  const ovFollow = summaries.filter(s => s.overallProgress < 30).length;
  const storeRows = Object.values(
    summaries.reduce((acc, s) => {
      const key = s.organization.name;
      if (!acc[key]) acc[key] = { name: key, count: 0, sum: 0, follow: 0 };
      acc[key].count += 1;
      acc[key].sum += s.overallProgress;
      if (s.overallProgress < 30) acc[key].follow += 1;
      return acc;
    }, {} as Record<string, { name: string; count: number; sum: number; follow: number }>),
  )
    .map(r => ({ ...r, avg: Math.round(r.sum / r.count) }))
    .sort((a, b) => a.avg - b.avg);
  const laggards = [...summaries].sort((a, b) => a.overallProgress - b.overallProgress).slice(0, 6);

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

      {/* 研修進捗の俯瞰 */}
      {ovTotal > 0 && (
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="card animate-fadeInUp" style={{ marginBottom: 'var(--space-md)' }}>
            <div className="card-header">
              📊 研修進捗の俯瞰
              <span className="text-sm text-secondary" style={{ marginLeft: 'auto', fontWeight: 400 }}>
                全体平均 <strong>{ovAvg}%</strong> ・ 完了 <strong>{ovCompleted}</strong>名 ・ 要フォロー <strong style={{ color: 'var(--color-danger)' }}>{ovFollow}</strong>名（{ovTotal}名中）
              </span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-md)' }}>
            {/* 店舗別 */}
            <div className="card">
              <div className="card-header">🏢 店舗別の進捗（低い順）</div>
              <div style={{ padding: 0 }}>
                <div className="table-container">
                  <table>
                    <thead><tr><th>店舗</th><th>人数</th><th>平均進捗</th><th style={{ textAlign: 'center' }}>要フォロー</th></tr></thead>
                    <tbody>
                      {storeRows.map(r => (
                        <tr key={r.name}>
                          <td style={{ fontWeight: 600 }}>{r.name}</td>
                          <td className="text-sm text-secondary">{r.count}名</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                              <div className="progress-bar" style={{ width: '80px' }}><div className={`progress-bar-fill ${r.avg === 100 ? 'completed' : ''}`} style={{ width: `${r.avg}%` }} /></div>
                              <span className="text-sm">{r.avg}%</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>{r.follow > 0 ? <span className="badge badge-danger">{r.follow}</span> : <span className="text-secondary text-sm">—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {/* 要フォロー（滞留者） */}
            <div className="card">
              <div className="card-header">⚠️ 要フォロー（進捗が低い順）</div>
              <div style={{ padding: 0 }}>
                <div className="table-container">
                  <table>
                    <thead><tr><th>研修者</th><th>所属</th><th>進捗</th></tr></thead>
                    <tbody>
                      {laggards.map(s => (
                        <tr key={s.user.id}>
                          <td><Link href={`/learners/${s.user.id}`} style={{ fontWeight: 600 }}>{s.user.name}</Link></td>
                          <td className="text-sm text-secondary">{s.organization.name}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                              <div className="progress-bar" style={{ width: '70px' }}><div className={`progress-bar-fill ${s.overallProgress === 100 ? 'completed' : ''}`} style={{ width: `${s.overallProgress}%` }} /></div>
                              <span className="text-sm">{s.overallProgress}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
