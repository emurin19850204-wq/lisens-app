/**
 * LISENS - 認定申請画面
 * 
 * 評価者・教育責任者が受講者のレベルアップ認定を申請する画面。
 * 対象受講者・申請レベル・理由を入力して申請する。
 * 
 * URLパラメータ: ?learner_id=xxx で対象受講者を指定可能。
 */
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  getUserById,
  getLearners,
  getCertificationLevels,
  getEvaluationsWithDetails,
  addCertification,
} from '@/lib/data';
import {
  CAN_APPLY_CERTIFICATION_ROLES,
  LEVEL_BADGE_CLASS,
  LEVEL_LABELS,
  LEVEL_ORDER,
  TRACK_LABELS,
  TRACK_BADGE_CLASS,
  OSCE_TOTAL_SCORE,
} from '@/lib/constants';
import type { TrackCode } from '@/lib/types';

export default function NewCertificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useAuth();

  // URLから受講者IDを取得（個人カルテからのリンク対応）
  const initialLearnerId = searchParams.get('learner_id') || '';

  // フォーム状態
  const [learnerId, setLearnerId] = useState(initialLearnerId);
  const [levelId, setLevelId] = useState('');
  const [certTrack, setCertTrack] = useState<TrackCode | ''>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 権限チェック
  if (!currentUser || !CAN_APPLY_CERTIFICATION_ROLES.includes(currentUser.role)) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <p>この操作を行う権限がありません</p>
        </div>
      </div>
    );
  }

  const allLearners = getLearners();
  const allLevels = getCertificationLevels();
  const selectedLearner = learnerId ? getUserById(learnerId) : undefined;

  // 選択中の受講者の「次のレベル」を推奨表示するために使用
  const currentLevelIndex = selectedLearner
    ? LEVEL_ORDER.indexOf(selectedLearner.currentLevel)
    : -1;
  const nextLevelCode = currentLevelIndex >= 0 && currentLevelIndex < LEVEL_ORDER.length - 1
    ? LEVEL_ORDER[currentLevelIndex + 1]
    : null;
  const nextLevel = nextLevelCode
    ? allLevels.find(l => l.code === nextLevelCode)
    : null;

  // 受講者を選択したとき、自動で次のレベルを設定
  const handleLearnerChange = (newLearnerId: string) => {
    setLearnerId(newLearnerId);
    const learner = getUserById(newLearnerId);
    if (learner) {
      const idx = LEVEL_ORDER.indexOf(learner.currentLevel);
      if (idx >= 0 && idx < LEVEL_ORDER.length - 1) {
        const nl = allLevels.find(l => l.code === LEVEL_ORDER[idx + 1]);
        if (nl) setLevelId(nl.id);
      }
    }
  };

  // 受講者の直近評価を表示（参考情報）
  const recentEvals = learnerId ? getEvaluationsWithDetails(learnerId).slice(0, 3) : [];

  // 送信処理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!learnerId || !levelId || !reason.trim()) return;

    setIsSubmitting(true);
    addCertification(learnerId, levelId, currentUser.id, reason, certTrack || null);

    // 認定一覧に遷移
    router.push('/certifications');
  };

  // 初期ロードで受講者が指定されている場合、次のレベルを自動設定
  if (initialLearnerId && !levelId && selectedLearner) {
    const idx = LEVEL_ORDER.indexOf(selectedLearner.currentLevel);
    if (idx >= 0 && idx < LEVEL_ORDER.length - 1) {
      const nl = allLevels.find(l => l.code === LEVEL_ORDER[idx + 1]);
      if (nl) {
        // stateを初期化（useEffectの代わりにここで行う）
        setTimeout(() => setLevelId(nl.id), 0);
      }
    }
  }

  return (
    <div className="page-container">
      {/* パンくずリスト */}
      <nav className="breadcrumb">
        <Link href="/">ホーム</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href="/certifications">認定一覧</Link>
        <span className="breadcrumb-separator">/</span>
        <span>認定申請</span>
      </nav>

      <h1 className="page-title">🏆 認定申請</h1>
      <p className="text-secondary" style={{ marginBottom: 'var(--space-lg)' }}>
        研修者のレベルアップ認定を申請します。
      </p>

      <form onSubmit={handleSubmit}>
        {/* 受講者の選択 */}
        <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="card-header">対象研修者</div>
          <div className="card-body">
            <select
              className="form-select"
              value={learnerId}
              onChange={e => handleLearnerChange(e.target.value)}
              required
            >
              <option value="">研修者を選択してください</option>
              {allLearners.map(l => (
                <option key={l.id} value={l.id}>
                  {l.name}（現在: {LEVEL_LABELS[l.currentLevel]}）
                </option>
              ))}
            </select>

            {/* 選択中の受講者の現在のレベル表示 */}
            {selectedLearner && (
              <div style={{ marginTop: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <div>
                  <div className="text-sm text-secondary">現在のレベル</div>
                  <span className={`badge ${LEVEL_BADGE_CLASS[selectedLearner.currentLevel]}`} style={{ fontSize: '0.85rem', padding: '4px 12px' }}>
                    {LEVEL_LABELS[selectedLearner.currentLevel]}
                  </span>
                </div>
                {nextLevel && (
                  <>
                    <div style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)' }}>→</div>
                    <div>
                      <div className="text-sm text-secondary">次のレベル（推奨）</div>
                      <span className={`badge ${LEVEL_BADGE_CLASS[nextLevel.code]}`} style={{ fontSize: '0.85rem', padding: '4px 12px' }}>
                        {nextLevel.name}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 認定レベルの選択 */}
        <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="card-header">申請レベル</div>
          <div className="card-body">
            <select
              className="form-select"
              value={levelId}
              onChange={e => setLevelId(e.target.value)}
              required
            >
              <option value="">レベルを選択してください</option>
              {allLevels.map(level => (
                <option key={level.id} value={level.id}>
                  {level.name} — {level.description}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 申請理由 */}
        <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="card-header">📄 申請理由</div>
          <div className="card-body">
            <textarea
              className="form-textarea"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="認定を推薦する理由を具体的に記入してください（評価結果、受講進捗、現場での実績など）"
              rows={5}
              required
            />
          </div>
        </div>

        {/* 参考：直近の評価 */}
        {recentEvals.length > 0 && (
          <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="card-header">📝 参考：直近のOSCE評価（最新3件）</div>
            <div className="card-body" style={{ padding: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>評価日</th>
                    <th>トラック</th>
                    <th>評価者</th>
                    <th>スコア</th>
                    <th>結果</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvals.map(ev => (
                    <tr key={ev.evaluation.id}>
                      <td className="text-sm">{new Date(ev.evaluation.evaluatedAt).toLocaleDateString('ja-JP')}</td>
                      <td><span className={`badge ${TRACK_BADGE_CLASS[ev.evaluation.track]}`}>{TRACK_LABELS[ev.evaluation.track]}</span></td>
                      <td className="text-sm">{ev.evaluator.name}</td>
                      <td>
                        <span className="font-semibold">{ev.totalScore}</span>
                        <span className="text-secondary text-sm">/{OSCE_TOTAL_SCORE}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: ev.evaluation.passed ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {ev.evaluation.passed ? '✅合格' : '❌不合格'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ボタン */}
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
          <Link
            href={learnerId ? `/learners/${learnerId}` : '/certifications'}
            className="btn btn-outline"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !learnerId || !levelId || !reason.trim()}
          >
            {isSubmitting ? '申請中...' : '🏆 認定を申請する'}
          </button>
        </div>
      </form>
    </div>
  );
}
