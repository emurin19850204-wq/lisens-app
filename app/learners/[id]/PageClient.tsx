/**
 * LISENS - 研修者詳細画面（個人カルテ）- クライアントコンポーネント
 * 
 * 受講進捗の編集・引継ぎメモ機能を含む。
 */
'use client';

import { useState, useCallback, use } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getLearnerDetail, updateProgressStatus, updateProgressMemo, updateProgressDates, updateSubjectHours } from '@/lib/data';
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
import type { EvaluationSectionCode, ProgressStatus } from '@/lib/types';

type TabKey = 'progress' | 'evaluations' | 'certifications';

/** 進捗編集が可能なロール */
const CAN_EDIT_PROGRESS_ROLES = ['admin', 'education_manager', 'evaluator', 'store_manager'];

export default function LearnerDetailClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('progress');
  // 進捗編集モード
  const [isEditingProgress, setIsEditingProgress] = useState(false);
  // メモ展開中の科目ID
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  // メモ編集中の内容 { subjectId: memoText }
  const [editingMemos, setEditingMemos] = useState<Record<string, string>>({});
  // 表示更新用のカウンター
  const [refreshKey, setRefreshKey] = useState(0);

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
  const canEditProgress = CAN_EDIT_PROGRESS_ROLES.includes(currentUser.role);

  // メモの展開/折りたたみ
  const toggleSubjectExpand = (subjectId: string) => {
    setExpandedSubjects(prev => {
      const next = new Set(prev);
      if (next.has(subjectId)) {
        next.delete(subjectId);
      } else {
        next.add(subjectId);
      }
      return next;
    });
  };

  // ステータス変更
  const handleStatusChange = (subjectId: string, newStatus: ProgressStatus) => {
    updateProgressStatus(learner.id, subjectId, newStatus);
    setRefreshKey(k => k + 1);
  };

  // 日付変更（開始日・完了日）
  const handleDateChange = (subjectId: string, field: 'startedAt' | 'completedAt', value: string) => {
    const detail2 = getLearnerDetail(id);
    if (!detail2) return;
    const allCp = detail2.curriculumProgresses;
    let sp: typeof allCp[0]['subjects'][0] | undefined;
    for (const cp2 of allCp) {
      sp = cp2.subjects.find(s => s.subject.id === subjectId);
      if (sp) break;
    }
    const currentStarted = sp?.progress?.startedAt || null;
    const currentCompleted = sp?.progress?.completedAt || null;
    const newDate = value ? new Date(value + 'T00:00:00Z').toISOString() : null;
    if (field === 'startedAt') {
      updateProgressDates(learner.id, subjectId, newDate, currentCompleted);
    } else {
      updateProgressDates(learner.id, subjectId, currentStarted, newDate);
    }
    setRefreshKey(k => k + 1);
  };

  // 科目時間変更
  const handleHoursChange = (subjectId: string, hours: number) => {
    if (hours > 0) {
      updateSubjectHours(subjectId, hours);
      setRefreshKey(k => k + 1);
    }
  };

  // メモ保存
  const handleMemoSave = (subjectId: string) => {
    const memo = editingMemos[subjectId] ?? '';
    updateProgressMemo(learner.id, subjectId, memo);
    setEditingMemos(prev => {
      const next = { ...prev };
      delete next[subjectId];
      return next;
    });
    setRefreshKey(k => k + 1);
  };

  // メモ編集開始
  const startEditMemo = (subjectId: string, currentMemo: string | null) => {
    setEditingMemos(prev => ({ ...prev, [subjectId]: currentMemo || '' }));
  };

  // メモ編集中かどうか
  const isEditingMemo = (subjectId: string) => subjectId in editingMemos;

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
        <div key={refreshKey}>
          {/* 編集モード切替ボタン */}
          {canEditProgress && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-md)', gap: 'var(--space-sm)' }}>
              <button
                className={`btn ${isEditingProgress ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setIsEditingProgress(!isEditingProgress)}
              >
                {isEditingProgress ? '✅ 編集を終了' : '✏️ 進捗を編集'}
              </button>
            </div>
          )}

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
                    <tr>
                      <th>コマ</th>
                      <th>時間</th>
                      <th>ステータス</th>
                      <th>開始日</th>
                      <th>完了日</th>
                      <th style={{ width: '40px', textAlign: 'center' }}>📝</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cp.subjects.map(sp => {
                      const subjectId = sp.subject.id;
                      const isExpanded = expandedSubjects.has(subjectId);
                      const currentMemo = sp.progress?.memo || null;
                      const hasMemo = !!currentMemo;

                      return (
                        <>
                          <tr key={subjectId} style={{ cursor: 'pointer' }} onClick={() => toggleSubjectExpand(subjectId)}>
                            <td>
                              <span style={{ marginRight: 'var(--space-sm)' }}>
                                {sp.progress?.status === 'completed' ? '☑' : '☐'}
                              </span>
                              {sp.subject.name}
                            </td>
                            <td className="text-sm text-secondary">
                              {isEditingProgress && canEditProgress ? (
                                <input
                                  type="number"
                                  className="form-input"
                                  style={{ padding: '2px 6px', fontSize: '0.8rem', width: '60px', textAlign: 'center' }}
                                  value={sp.subject.hours}
                                  min={0.5}
                                  step={0.5}
                                  onClick={e => e.stopPropagation()}
                                  onChange={e => handleHoursChange(subjectId, parseFloat(e.target.value))}
                                />
                              ) : (
                                <>{sp.subject.hours}h</>
                              )}
                            </td>
                            <td>
                              {isEditingProgress && canEditProgress ? (
                                <select
                                  className="form-input"
                                  style={{ padding: '2px 6px', fontSize: '0.8rem', width: 'auto', minWidth: '80px' }}
                                  value={sp.progress?.status || 'not_started'}
                                  onClick={e => e.stopPropagation()}
                                  onChange={e => handleStatusChange(subjectId, e.target.value as ProgressStatus)}
                                >
                                  <option value="not_started">未着手</option>
                                  <option value="in_progress">受講中</option>
                                  <option value="completed">完了</option>
                                </select>
                              ) : (
                                <span className={`badge ${PROGRESS_STATUS_BADGE_CLASS[sp.progress?.status || 'not_started']}`}>
                                  {PROGRESS_STATUS_LABELS[sp.progress?.status || 'not_started']}
                                </span>
                              )}
                            </td>
                            <td className="text-sm text-secondary">
                              {isEditingProgress && canEditProgress ? (
                                <input
                                  type="date"
                                  className="form-input"
                                  style={{ padding: '2px 4px', fontSize: '0.75rem', width: 'auto', minWidth: '120px' }}
                                  value={sp.progress?.startedAt ? sp.progress.startedAt.slice(0, 10) : ''}
                                  onClick={e => e.stopPropagation()}
                                  onChange={e => handleDateChange(subjectId, 'startedAt', e.target.value)}
                                />
                              ) : (
                                <>{sp.progress?.startedAt ? new Date(sp.progress.startedAt).toLocaleDateString('ja-JP') : '—'}</>
                              )}
                            </td>
                            <td className="text-sm text-secondary">
                              {isEditingProgress && canEditProgress ? (
                                <input
                                  type="date"
                                  className="form-input"
                                  style={{ padding: '2px 4px', fontSize: '0.75rem', width: 'auto', minWidth: '120px' }}
                                  value={sp.progress?.completedAt ? sp.progress.completedAt.slice(0, 10) : ''}
                                  onClick={e => e.stopPropagation()}
                                  onChange={e => handleDateChange(subjectId, 'completedAt', e.target.value)}
                                />
                              ) : (
                                <>{sp.progress?.completedAt ? new Date(sp.progress.completedAt).toLocaleDateString('ja-JP') : '—'}</>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ opacity: hasMemo ? 1 : 0.3, fontSize: '0.9rem' }}>
                                {hasMemo ? '📝' : '○'}
                              </span>
                              <span style={{ fontSize: '0.7rem', marginLeft: '2px' }}>
                                {isExpanded ? '▲' : '▼'}
                              </span>
                            </td>
                          </tr>
                          {/* メモ展開エリア */}
                          {isExpanded && (
                            <tr key={`${subjectId}-memo`}>
                              <td colSpan={6} style={{ padding: 0, border: 'none' }}>
                                <div style={{
                                  padding: 'var(--space-sm) var(--space-md)',
                                  background: 'var(--color-bg)',
                                  borderTop: '1px dashed var(--color-border)',
                                  borderBottom: '1px dashed var(--color-border)',
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                                    <span className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>📋 引継ぎメモ</span>
                                    {sp.subject.description && (
                                      <span className="text-sm text-secondary">| 科目概要: {sp.subject.description}</span>
                                    )}
                                  </div>

                                  {canEditProgress && isEditingMemo(subjectId) ? (
                                    /* メモ編集モード */
                                    <div>
                                      <textarea
                                        className="form-input"
                                        style={{ width: '100%', minHeight: '80px', fontSize: '0.85rem', resize: 'vertical' }}
                                        value={editingMemos[subjectId] || ''}
                                        onChange={e => setEditingMemos(prev => ({ ...prev, [subjectId]: e.target.value }))}
                                        placeholder="引継ぎ事項、指導上の注意点、受講者の特記事項などを記入..."
                                      />
                                      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-xs)', justifyContent: 'flex-end' }}>
                                        <button
                                          className="btn btn-outline btn-sm"
                                          onClick={() => setEditingMemos(prev => { const n = { ...prev }; delete n[subjectId]; return n; })}
                                        >
                                          キャンセル
                                        </button>
                                        <button
                                          className="btn btn-primary btn-sm"
                                          onClick={() => handleMemoSave(subjectId)}
                                        >
                                          💾 保存
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    /* メモ閲覧モード */
                                    <div>
                                      {currentMemo ? (
                                        <div style={{
                                          padding: 'var(--space-sm)',
                                          background: 'var(--color-surface)',
                                          borderRadius: 'var(--border-radius-sm)',
                                          borderLeft: '3px solid var(--color-primary)',
                                          fontSize: '0.85rem',
                                          lineHeight: '1.6',
                                          whiteSpace: 'pre-wrap',
                                        }}>
                                          {currentMemo}
                                        </div>
                                      ) : (
                                        <div className="text-sm text-secondary" style={{ fontStyle: 'italic', padding: 'var(--space-xs) 0' }}>
                                          メモはありません
                                        </div>
                                      )}
                                      {canEditProgress && (
                                        <button
                                          className="btn btn-outline btn-sm"
                                          style={{ marginTop: 'var(--space-xs)' }}
                                          onClick={() => startEditMemo(subjectId, currentMemo)}
                                        >
                                          ✏️ {currentMemo ? 'メモを編集' : 'メモを追加'}
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
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