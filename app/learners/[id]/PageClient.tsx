/**
 * LISENS - 研修者詳細画面（個人カルテ）- クライアントコンポーネント
 */
'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getLearnerDetail } from '@/lib/data';
import {
  ROLE_LABELS,
  LEVEL_LABELS,
  LEVEL_BADGE_CLASS,
  PROGRESS_STATUS_LABELS,
  PROGRESS_STATUS_BADGE_CLASS,
  EVALUATION_STATUS_LABELS,
  EVALUATION_STATUS_BADGE_CLASS,
  CERTIFICATION_STATUS_LABELS,
  CERTIFICATION_STATUS_BADGE_CLASS,
  CAN_EVALUATE_ROLES,
  CAN_APPLY_CERTIFICATION_ROLES,
  TRACK_LABELS,
  TRACK_BADGE_CLASS,
  SECTION_LABELS,
  SECTION_ICONS,
  SECTION_MAX_SCORES,
  OSCE_TOTAL_SCORE,
  OSCE_PASS_SCORE,
  EVALUATION_TEMPLATES,
} from '@/lib/constants';
import type { EvaluationSectionCode } from '@/lib/types';

type TabKey = 'progress' | 'evaluations' | 'certifications';

export default function LearnerDetailClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('progress');

  if (!currentUser) return null;

  // 研修者は自分のカルテのみ閲覧可能
  if (currentUser.role === 'learner' && currentUser.id !== id) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <p>他の研修者のカルテは閲覧できません</p>
          <Link href={`/learners/${currentUser.id}`} className="btn btn-outline" style={{ marginTop: 'var(--space-md)' }}>
            ← マイカルテに戻る
          </Link>
        </div>
      </div>
    );
  }

  const detail = getLearnerDetail(id);

  if (!detail) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">❌</div>
          <p>研修者が見つかりません</p>
          <Link href={currentUser.role === 'learner' ? '/' : '/learners'} className="btn btn-outline" style={{ marginTop: 'var(--space-md)' }}>
            ← {currentUser.role === 'learner' ? 'ホームに戻る' : '研修者一覧に戻る'}
          </Link>
        </div>
      </div>
    );
  }

  const { user: learner, organization, currentLevel, curriculumProgresses, evaluations, certifications } = detail;
  const canEvaluate = CAN_EVALUATE_ROLES.includes(currentUser.role);
  const canApplyCert = CAN_APPLY_CERTIFICATION_ROLES.includes(currentUser.role);

  return (
    <div className="page-container">
      {/* パンくずリスト */}
      <nav className="breadcrumb">
        <Link href="/">ホーム</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href="/learners">研修者一覧</Link>
        <span className="breadcrumb-separator">/</span>
        <span>{learner.name}</span>
      </nav>

      {/* ヘッダー */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: 'var(--space-xs)' }}>
                {learner.name}
              </h1>
              <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                <span className="text-secondary">📍 {organization.name}</span>
                <span className="text-secondary">🏷️ {ROLE_LABELS[learner.role]}</span>
                {learner.hireDate && <span className="text-secondary">📅 入社: {learner.hireDate}</span>}
              </div>
              <div style={{ marginTop: 'var(--space-sm)', display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
                <span className={`badge ${LEVEL_BADGE_CLASS[learner.currentLevel]}`} style={{ fontSize: '0.85rem', padding: '4px 12px' }}>
                  🏆 {currentLevel.name}
                </span>
                {learner.tracks.length > 0 && learner.tracks.map(t => (
                  <span key={t} className={`badge ${TRACK_BADGE_CLASS[t]}`} style={{ fontSize: '0.8rem' }}>
                    {TRACK_LABELS[t]}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
              {currentUser.role !== 'learner' && (
                <Link href="/learners" className="btn btn-outline">
                  ← 一覧に戻る
                </Link>
              )}
              {canEvaluate && (
                <Link href={`/evaluations/new?learner_id=${learner.id}`} className="btn btn-primary">
                  📝 OSCE評価
                </Link>
              )}
              {canApplyCert && (
                <Link href={`/certifications/new?learner_id=${learner.id}`} className="btn btn-outline">
                  🏆 認定申請
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* タブ */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'progress' ? 'active' : ''}`} onClick={() => setActiveTab('progress')}>
          📚 受講進捗
        </button>
        <button className={`tab ${activeTab === 'evaluations' ? 'active' : ''}`} onClick={() => setActiveTab('evaluations')}>
          📝 OSCE評価 ({evaluations.length})
        </button>
        <button className={`tab ${activeTab === 'certifications' ? 'active' : ''}`} onClick={() => setActiveTab('certifications')}>
          🏆 認定 ({certifications.length})
        </button>
      </div>

      {/* 進捗タブ */}
      {activeTab === 'progress' && (
        <div>
          {curriculumProgresses.map(cp => (
            <div key={cp.curriculum.id} className="card" style={{ marginBottom: 'var(--space-md)' }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span>{cp.curriculum.name}</span>
                  <span className="text-sm text-secondary" style={{ marginLeft: 'var(--space-sm)' }}>({cp.curriculum.totalHours}h)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <div className="progress-bar" style={{ width: '120px' }}>
                    <div className={`progress-bar-fill ${cp.progressRate === 100 ? 'completed' : ''}`} style={{ width: `${cp.progressRate}%` }} />
                  </div>
                  <span className="text-sm font-semibold">{cp.progressRate}%</span>
                </div>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <table>
                  <thead>
                    <tr><th>コマ</th><th>時間</th><th>ステータス</th><th>開始日</th><th>完了日</th></tr>
                  </thead>
                  <tbody>
                    {cp.subjects.map(sp => (
                      <tr key={sp.subject.id}>
                        <td>
                          <span style={{ marginRight: 'var(--space-sm)' }}>
                            {sp.progress?.status === 'completed' ? '☑' : '☐'}
                          </span>
                          {sp.subject.name}
                        </td>
                        <td className="text-sm text-secondary">{sp.subject.hours}h</td>
                        <td>
                          <span className={`badge ${PROGRESS_STATUS_BADGE_CLASS[sp.progress?.status || 'not_started']}`}>
                            {PROGRESS_STATUS_LABELS[sp.progress?.status || 'not_started']}
                          </span>
                        </td>
                        <td className="text-sm text-secondary">
                          {sp.progress?.startedAt ? new Date(sp.progress.startedAt).toLocaleDateString('ja-JP') : '—'}
                        </td>
                        <td className="text-sm text-secondary">
                          {sp.progress?.completedAt ? new Date(sp.progress.completedAt).toLocaleDateString('ja-JP') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OSCE評価タブ */}
      {activeTab === 'evaluations' && (
        <div>
          {evaluations.length === 0 ? (
            <div className="card"><div className="card-body"><div className="empty-state"><div className="empty-state-icon">📝</div><p>OSCE評価履歴がありません</p></div></div></div>
          ) : (
            evaluations.map(ev => {
              const sectionScores: Record<string, { score: number; max: number }> = {};
              (['C', 'E', 'P', 'T', 'S', 'EN'] as EvaluationSectionCode[]).forEach(sec => {
                const secItems = ev.items.filter(i => {
                  const tmpl = EVALUATION_TEMPLATES.find(t => t.name === i.itemName);
                  return tmpl?.section === sec;
                });
                sectionScores[sec] = {
                  score: secItems.reduce((s, i) => s + i.score, 0),
                  max: SECTION_MAX_SCORES[sec],
                };
              });

              return (
                <div key={ev.evaluation.id} className="card" style={{ marginBottom: 'var(--space-md)' }}>
                  <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      <span>{new Date(ev.evaluation.evaluatedAt).toLocaleDateString('ja-JP')}</span>
                      <span className={`badge ${TRACK_BADGE_CLASS[ev.evaluation.track]}`}>
                        {TRACK_LABELS[ev.evaluation.track]}
                      </span>
                    </div>
                    <div className="flex gap-sm items-center">
                      <span className={`badge ${EVALUATION_STATUS_BADGE_CLASS[ev.evaluation.status]}`}>
                        {EVALUATION_STATUS_LABELS[ev.evaluation.status]}
                      </span>
                      <span className="text-sm" style={{ fontWeight: 700, color: ev.evaluation.passed ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {ev.evaluation.passed ? '✅ 合格' : '❌ 不合格'}
                      </span>
                      <span className="text-sm font-semibold">{ev.totalScore}/{OSCE_TOTAL_SCORE}点 ({ev.scoreRate}%)</span>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="text-sm text-secondary" style={{ marginBottom: 'var(--space-sm)' }}>
                      評価者: {ev.evaluator.name}
                    </div>

                    {ev.evaluation.ngItems.length > 0 && (
                      <div style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-sm)', background: 'var(--color-danger-light, #ffeaea)', borderRadius: 'var(--border-radius-sm)', borderLeft: '3px solid var(--color-danger)' }}>
                        <div className="text-sm font-semibold" style={{ color: 'var(--color-danger)' }}>⛔ 即NG判定</div>
                        <div className="text-sm">{ev.evaluation.ngItems.join(', ')}</div>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                      {(['C', 'E', 'P', 'T', 'S', 'EN'] as EvaluationSectionCode[]).map(sec => (
                        <div key={sec} style={{ padding: 'var(--space-sm)', background: 'var(--color-bg)', borderRadius: 'var(--border-radius-sm)', textAlign: 'center' }}>
                          <div className="text-sm">{SECTION_ICONS[sec]} {SECTION_LABELS[sec]}</div>
                          <div className="font-semibold">{sectionScores[sec].score}/{sectionScores[sec].max}</div>
                        </div>
                      ))}
                    </div>

                    {ev.evaluation.overallComment && (
                      <div style={{ padding: 'var(--space-sm)', background: 'var(--color-bg)', borderRadius: 'var(--border-radius-sm)', borderLeft: '3px solid var(--color-primary)' }}>
                        <div className="text-sm font-semibold" style={{ marginBottom: '2px' }}>💬 総合コメント</div>
                        <div className="text-sm">{ev.evaluation.overallComment}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 認定タブ */}
      {activeTab === 'certifications' && (
        <div>
          {certifications.length === 0 ? (
            <div className="card"><div className="card-body"><div className="empty-state"><div className="empty-state-icon">🏆</div><p>認定履歴がありません</p></div></div></div>
          ) : (
            certifications.map(c => (
              <div key={c.certification.id} className="card" style={{ marginBottom: 'var(--space-md)' }}>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                      <span className={`badge ${LEVEL_BADGE_CLASS[c.level.code]}`} style={{ fontSize: '0.85rem', padding: '4px 12px' }}>
                        {c.level.name}
                      </span>
                      {c.certification.track && (
                        <span className={`badge ${TRACK_BADGE_CLASS[c.certification.track]}`}>
                          {TRACK_LABELS[c.certification.track]}
                        </span>
                      )}
                      <span className={`badge ${CERTIFICATION_STATUS_BADGE_CLASS[c.certification.status]}`}>
                        {CERTIFICATION_STATUS_LABELS[c.certification.status]}
                      </span>
                    </div>
                    <div className="text-sm text-secondary">
                      申請日: {new Date(c.certification.appliedAt).toLocaleDateString('ja-JP')}
                      {c.certification.decidedAt && (
                        <> | 決定日: {new Date(c.certification.decidedAt).toLocaleDateString('ja-JP')}</>
                      )}
                    </div>
                  </div>
                  <div className="text-sm" style={{ marginTop: 'var(--space-sm)' }}>
                    <span className="text-secondary">申請者: </span>{c.applicant.name}
                    {c.approver && <><span className="text-secondary"> | 承認者: </span>{c.approver.name}</>}
                  </div>
                  {c.certification.reason && (
                    <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-sm)', background: 'var(--color-bg)', borderRadius: 'var(--border-radius-sm)' }}>
                      <div className="text-sm">{c.certification.reason}</div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {/* ページ下部の「一覧に戻る」ボタン */}
      {currentUser.role !== 'learner' && (
        <div style={{ marginTop: 'var(--space-lg)', display: 'flex', justifyContent: 'center' }}>
          <Link href="/learners" className="btn btn-outline">
            ← 研修者一覧に戻る
          </Link>
        </div>
      )}
    </div>
  );
}
