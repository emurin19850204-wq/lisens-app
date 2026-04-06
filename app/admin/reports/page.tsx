/**
 * LISENS - レポート画面 v2.0
 * 
 * 個人別レポートと店舗別レポートを実データから生成・表示する。
 * Supabaseから研修者の進捗、評価、認定データを取得し、
 * テーブルとサマリーで可視化する。
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import {
  getLearnerSummaries, getAllOrganizations, getStores,
  getEvaluationsWithDetails, getCertificationsForLearner,
} from '@/lib/data';
import { LEVEL_LABELS, TRACK_LABELS } from '@/lib/constants';
import type { LearnerSummary, Organization, EvaluationWithDetails, CertificationWithDetails } from '@/lib/types';

/** 個人レポートのデータ型 */
interface IndividualReport {
  summary: LearnerSummary;
  evaluations: EvaluationWithDetails[];
  certifications: CertificationWithDetails[];
}

/** 店舗レポートのデータ型 */
interface StoreReport {
  store: Organization;
  learners: LearnerSummary[];
  avgProgress: number;
  levelDistribution: Record<string, number>;
  totalEvaluations: number;
  totalCertified: number;
}

type ReportMode = 'individual' | 'store';

export default function ReportsPage() {
  const { user } = useAuth();

  // 基盤データ
  const [allSummaries, setAllSummaries] = useState<LearnerSummary[]>([]);
  const [stores, setStores] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  // レポートモード切替
  const [mode, setMode] = useState<ReportMode>('individual');

  // 個人レポート状態
  const [selectedLearnerId, setSelectedLearnerId] = useState<string>('');
  const [individualReport, setIndividualReport] = useState<IndividualReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // 店舗レポート状態
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [storeReport, setStoreReport] = useState<StoreReport | null>(null);

  // 初期データ読み込み
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [summaries, storeList] = await Promise.all([
        getLearnerSummaries(user),
        getStores(),
      ]);
      setAllSummaries(summaries);
      setStores(storeList);
      setLoading(false);
    };
    load();
  }, [user]);

  // 個人レポート生成
  const generateIndividualReport = useCallback(async () => {
    if (!selectedLearnerId) return;
    setLoadingReport(true);
    setIndividualReport(null);

    const summary = allSummaries.find(s => s.user.id === selectedLearnerId);
    if (!summary) { setLoadingReport(false); return; }

    const [evaluations, certifications] = await Promise.all([
      getEvaluationsWithDetails(selectedLearnerId),
      getCertificationsForLearner(selectedLearnerId),
    ]);

    setIndividualReport({ summary, evaluations, certifications });
    setLoadingReport(false);
  }, [selectedLearnerId, allSummaries]);

  // 店舗レポート生成
  const generateStoreReport = useCallback(async () => {
    if (!selectedStoreId) return;
    setLoadingReport(true);
    setStoreReport(null);

    const store = stores.find(s => s.id === selectedStoreId);
    if (!store) { setLoadingReport(false); return; }

    // 該当店舗の研修者をフィルタ
    const storeLearners = allSummaries.filter(s => s.user.organizationId === selectedStoreId);

    // 平均進捗率
    const avgProgress = storeLearners.length > 0
      ? Math.round(storeLearners.reduce((sum, s) => sum + s.overallProgress, 0) / storeLearners.length)
      : 0;

    // レベル分布
    const levelDistribution: Record<string, number> = {};
    for (const s of storeLearners) {
      const label = LEVEL_LABELS[s.user.currentLevel];
      levelDistribution[label] = (levelDistribution[label] || 0) + 1;
    }

    // 認定数と評価数を集計
    let totalEvaluations = 0;
    let totalCertified = 0;
    for (const s of storeLearners) {
      const [evals, certs] = await Promise.all([
        getEvaluationsWithDetails(s.user.id),
        getCertificationsForLearner(s.user.id),
      ]);
      totalEvaluations += evals.length;
      totalCertified += certs.filter(c => c.certification.status === 'certified').length;
    }

    setStoreReport({ store, learners: storeLearners, avgProgress, levelDistribution, totalEvaluations, totalCertified });
    setLoadingReport(false);
  }, [selectedStoreId, allSummaries, stores]);

  if (!user) return null;
  if (user.role === 'learner') {
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
          <div className="skeleton" style={{ width: 300, height: 16 }} />
        </div>
        <div className="skeleton" style={{ height: 60, borderRadius: 'var(--border-radius)', marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 400, borderRadius: 'var(--border-radius)' }} />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* ヘッダー */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 レポート</h1>
          <p className="text-secondary text-sm" style={{ marginTop: 4 }}>
            個人別・店舗別の進捗状況と評価結果を確認できます
          </p>
        </div>
      </div>

      {/* モード切替タブ */}
      <div className="tabs" style={{ marginBottom: 'var(--space-xl)' }}>
        <button
          className={`tab ${mode === 'individual' ? 'active' : ''}`}
          onClick={() => { setMode('individual'); setStoreReport(null); }}
        >
          👤 個人別レポート
        </button>
        <button
          className={`tab ${mode === 'store' ? 'active' : ''}`}
          onClick={() => { setMode('store'); setIndividualReport(null); }}
        >
          🏢 店舗別レポート
        </button>
      </div>

      {/* ===== 個人別レポート ===== */}
      {mode === 'individual' && (
        <div className="animate-fadeIn">
          {/* 研修者選択 */}
          <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
            <div className="card-body">
              <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: 1, minWidth: 250, marginBottom: 0 }}>
                  <label className="form-label">対象研修者を選択</label>
                  <select
                    className="form-select"
                    value={selectedLearnerId}
                    onChange={(e) => setSelectedLearnerId(e.target.value)}
                  >
                    <option value="">-- 研修者を選択してください --</option>
                    {allSummaries.map(s => (
                      <option key={s.user.id} value={s.user.id}>
                        {s.user.name}（{s.organization.name}）- {s.currentLevelName}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={generateIndividualReport}
                  disabled={!selectedLearnerId || loadingReport}
                >
                  {loadingReport ? '生成中...' : '📄 レポートを生成'}
                </button>
              </div>
            </div>
          </div>

          {/* 個人レポート結果 */}
          {individualReport && <IndividualReportView report={individualReport} />}
        </div>
      )}

      {/* ===== 店舗別レポート ===== */}
      {mode === 'store' && (
        <div className="animate-fadeIn">
          {/* 店舗選択 */}
          <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
            <div className="card-body">
              <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: 1, minWidth: 250, marginBottom: 0 }}>
                  <label className="form-label">対象店舗を選択</label>
                  <select
                    className="form-select"
                    value={selectedStoreId}
                    onChange={(e) => setSelectedStoreId(e.target.value)}
                  >
                    <option value="">-- 店舗を選択してください --</option>
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={generateStoreReport}
                  disabled={!selectedStoreId || loadingReport}
                >
                  {loadingReport ? '生成中...' : '📄 レポートを生成'}
                </button>
              </div>
            </div>
          </div>

          {/* 店舗レポート結果 */}
          {storeReport && <StoreReportView report={storeReport} />}
        </div>
      )}
    </div>
  );
}

/* ====================================================================
 *  個人別レポートコンポーネント
 * ==================================================================== */
function IndividualReportView({ report }: { report: IndividualReport }) {
  const { summary, evaluations, certifications } = report;
  const certifiedCerts = certifications.filter(c => c.certification.status === 'certified');
  const passedEvals = evaluations.filter(e => e.evaluation.passed);

  return (
    <div className="animate-fadeInUp">
      {/* サマリーカード群 */}
      <div className="grid grid-auto" style={{ marginBottom: 'var(--space-xl)' }}>
        {/* プロフィール */}
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--color-primary-light)' }}>👤</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 2 }}>{summary.user.name}</div>
          <div className="text-sm text-secondary">{summary.organization.name}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className="badge badge-primary">{summary.currentLevelName}</span>
            {summary.user.tracks.map(t => (
              <span key={t} className="badge badge-muted">{TRACK_LABELS[t]}</span>
            ))}
          </div>
        </div>

        {/* 進捗率 */}
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--color-info-light)' }}>📈</div>
          <div className="stat-card-value">{summary.overallProgress}%</div>
          <div className="stat-card-label">カリキュラム進捗率</div>
          <div className="progress-bar" style={{ marginTop: 12 }}>
            <div
              className={`progress-bar-fill ${summary.overallProgress === 100 ? 'completed' : ''}`}
              style={{ width: `${summary.overallProgress}%` }}
            />
          </div>
        </div>

        {/* 評価回数 */}
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--color-success-light)' }}>📝</div>
          <div className="stat-card-value">{evaluations.length}</div>
          <div className="stat-card-label">評価受験回数</div>
          <div className="text-sm text-secondary" style={{ marginTop: 4 }}>
            合格: {passedEvals.length}回
          </div>
        </div>

        {/* 認定数 */}
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--color-warning-light)' }}>🏆</div>
          <div className="stat-card-value">{certifiedCerts.length}</div>
          <div className="stat-card-label">取得認定数</div>
        </div>
      </div>

      {/* 評価履歴テーブル */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card-header">
          <span style={{ fontSize: '1rem' }}>📝</span>
          OSCE評価履歴
          <span className="badge badge-muted" style={{ marginLeft: 'auto' }}>{evaluations.length}件</span>
        </div>
        <div style={{ padding: 0 }}>
          {evaluations.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>評価日</th>
                    <th>トラック</th>
                    <th>スコア</th>
                    <th>得点率</th>
                    <th>合否</th>
                    <th>評価者</th>
                    <th>NG項目</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map((e, idx) => (
                    <tr key={e.evaluation.id} className="animate-fadeIn" style={{ animationDelay: `${idx * 0.04}s` }}>
                      <td className="text-sm">
                        {new Date(e.evaluation.evaluatedAt).toLocaleDateString('ja-JP')}
                      </td>
                      <td>
                        <span className="badge badge-info">{TRACK_LABELS[e.evaluation.track]}</span>
                      </td>
                      <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {e.totalScore}点
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar" style={{ width: 60 }}>
                            <div
                              className={`progress-bar-fill ${e.scoreRate >= 61 ? 'completed' : ''}`}
                              style={{ width: `${e.scoreRate}%` }}
                            />
                          </div>
                          <span className="text-sm">{e.scoreRate}%</span>
                        </div>
                      </td>
                      <td>
                        {e.evaluation.passed
                          ? <span className="badge badge-success">合格</span>
                          : <span className="badge badge-danger">不合格</span>
                        }
                      </td>
                      <td className="text-sm text-secondary">{e.evaluator.name}</td>
                      <td className="text-sm">
                        {e.evaluation.ngItems.length > 0
                          ? <span className="badge badge-danger">{e.evaluation.ngItems.length}件</span>
                          : <span className="text-muted">なし</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
              <p className="text-muted">評価記録がありません</p>
            </div>
          )}
        </div>
      </div>

      {/* 認定履歴テーブル */}
      <div className="card">
        <div className="card-header">
          <span style={{ fontSize: '1rem' }}>🏆</span>
          認定履歴
          <span className="badge badge-muted" style={{ marginLeft: 'auto' }}>{certifications.length}件</span>
        </div>
        <div style={{ padding: 0 }}>
          {certifications.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>申請日</th>
                    <th>認定レベル</th>
                    <th>ステータス</th>
                    <th>申請者</th>
                    <th>決定日</th>
                  </tr>
                </thead>
                <tbody>
                  {certifications.map((c, idx) => (
                    <tr key={c.certification.id} className="animate-fadeIn" style={{ animationDelay: `${idx * 0.04}s` }}>
                      <td className="text-sm">
                        {new Date(c.certification.appliedAt).toLocaleDateString('ja-JP')}
                      </td>
                      <td><span className="badge badge-primary">{c.level.name}</span></td>
                      <td>
                        <span className={`badge ${
                          c.certification.status === 'certified' ? 'badge-success' :
                          c.certification.status === 'pending' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {c.certification.status === 'certified' ? '承認済み' :
                           c.certification.status === 'pending' ? '承認待ち' : '差し戻し'}
                        </span>
                      </td>
                      <td className="text-sm text-secondary">{c.applicant.name}</td>
                      <td className="text-sm text-secondary">
                        {c.certification.decidedAt
                          ? new Date(c.certification.decidedAt).toLocaleDateString('ja-JP')
                          : '—'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
              <p className="text-muted">認定記録がありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ====================================================================
 *  店舗別レポートコンポーネント
 * ==================================================================== */
function StoreReportView({ report }: { report: StoreReport }) {
  const { store, learners, avgProgress, levelDistribution, totalEvaluations, totalCertified } = report;

  return (
    <div className="animate-fadeInUp">
      {/* サマリーカード群 */}
      <div className="grid grid-auto" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--color-primary-light)' }}>🏢</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 2 }}>{store.name}</div>
          <div className="stat-card-label" style={{ marginTop: 4 }}>店舗名</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--color-info-light)' }}>👥</div>
          <div className="stat-card-value">{learners.length}</div>
          <div className="stat-card-label">研修者数</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--color-success-light)' }}>📈</div>
          <div className="stat-card-value">{avgProgress}%</div>
          <div className="stat-card-label">平均進捗率</div>
          <div className="progress-bar" style={{ marginTop: 12 }}>
            <div
              className={`progress-bar-fill ${avgProgress === 100 ? 'completed' : ''}`}
              style={{ width: `${avgProgress}%` }}
            />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--color-warning-light)' }}>🏆</div>
          <div className="stat-card-value">{totalCertified}</div>
          <div className="stat-card-label">取得認定数（合計）</div>
        </div>
      </div>

      {/* レベル分布 + 評価統計 */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginBottom: 'var(--space-xl)' }}>
        {/* レベル分布 */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontSize: '1rem' }}>📊</span>
            レベル分布
          </div>
          <div className="card-body">
            {Object.keys(levelDistribution).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(levelDistribution).map(([label, count]) => {
                  const pct = learners.length > 0 ? Math.round((count / learners.length) * 100) : 0;
                  return (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span className="text-sm" style={{ fontWeight: 600 }}>{label}</span>
                        <span className="text-sm text-secondary">{count}名（{pct}%）</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted text-sm">データがありません</p>
            )}
          </div>
        </div>

        {/* 評価統計 */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontSize: '1rem' }}>📝</span>
            評価統計
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--color-border-light)' }}>
                <span className="text-sm" style={{ fontWeight: 500 }}>総評価回数</span>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{totalEvaluations}回</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--color-border-light)' }}>
                <span className="text-sm" style={{ fontWeight: 500 }}>認定取得数</span>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{totalCertified}件</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                <span className="text-sm" style={{ fontWeight: 500 }}>1人あたり平均評価回数</span>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  {learners.length > 0 ? (totalEvaluations / learners.length).toFixed(1) : 0}回
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 研修者一覧テーブル */}
      <div className="card">
        <div className="card-header">
          <span style={{ fontSize: '1rem' }}>👥</span>
          所属研修者一覧
          <span className="badge badge-muted" style={{ marginLeft: 'auto' }}>{learners.length}名</span>
        </div>
        <div style={{ padding: 0 }}>
          {learners.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>氏名</th>
                    <th>レベル</th>
                    <th>トラック</th>
                    <th>進捗率</th>
                    <th>直近評価日</th>
                    <th style={{ textAlign: 'right' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {learners.map((s, idx) => (
                    <tr key={s.user.id} className="animate-fadeIn" style={{ animationDelay: `${idx * 0.04}s` }}>
                      <td style={{ fontWeight: 600 }}>{s.user.name}</td>
                      <td><span className="badge badge-primary">{s.currentLevelName}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {s.user.tracks.map(t => (
                            <span key={t} className="badge badge-muted">{TRACK_LABELS[t]}</span>
                          ))}
                          {s.user.tracks.length === 0 && <span className="text-muted text-sm">—</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar" style={{ width: 70 }}>
                            <div
                              className={`progress-bar-fill ${s.overallProgress === 100 ? 'completed' : ''}`}
                              style={{ width: `${s.overallProgress}%` }}
                            />
                          </div>
                          <span className="text-sm">{s.overallProgress}%</span>
                        </div>
                      </td>
                      <td className="text-sm text-secondary">
                        {s.lastEvaluationDate
                          ? new Date(s.lastEvaluationDate).toLocaleDateString('ja-JP')
                          : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link href={`/learners/${s.user.id}`} className="btn btn-outline btn-sm">
                          カルテ →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
              <div className="empty-state-icon">📭</div>
              <p>この店舗に所属する研修者がいません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
