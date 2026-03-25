/**
 * LISENS - 認定申請画面（Supabase対応）
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getUserById, getLearners, getCertificationLevels, getEvaluationsWithDetails, addCertification } from '@/lib/data';
import { CAN_APPLY_CERTIFICATION_ROLES, LEVEL_BADGE_CLASS, LEVEL_LABELS, LEVEL_ORDER, TRACK_LABELS, TRACK_BADGE_CLASS, OSCE_TOTAL_SCORE } from '@/lib/constants';
import type { TrackCode, User, CertificationLevel, EvaluationWithDetails } from '@/lib/types';

export default function NewCertificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useAuth();
  const initialLearnerId = searchParams.get('learner_id') || '';

  const [learnerId, setLearnerId] = useState(initialLearnerId);
  const [levelId, setLevelId] = useState('');
  const [certTrack, setCertTrack] = useState<TrackCode | ''>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allLearners, setAllLearners] = useState<User[]>([]);
  const [allLevels, setAllLevels] = useState<CertificationLevel[]>([]);
  const [selectedLearner, setSelectedLearner] = useState<User | undefined>();
  const [recentEvals, setRecentEvals] = useState<EvaluationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [learners, levels] = await Promise.all([getLearners(), getCertificationLevels()]);
      setAllLearners(learners);
      setAllLevels(levels);
      if (initialLearnerId) {
        const learner = await getUserById(initialLearnerId);
        setSelectedLearner(learner);
        if (learner) {
          const idx = LEVEL_ORDER.indexOf(learner.currentLevel);
          if (idx >= 0 && idx < LEVEL_ORDER.length - 1) {
            const nl = levels.find(l => l.code === LEVEL_ORDER[idx + 1]);
            if (nl) setLevelId(nl.id);
          }
          const evals = await getEvaluationsWithDetails(learner.id);
          setRecentEvals(evals.slice(0, 3));
        }
      }
      setLoading(false);
    };
    load();
  }, [initialLearnerId]);

  if (!currentUser || !CAN_APPLY_CERTIFICATION_ROLES.includes(currentUser.role)) {
    return (<div className="page-container"><div className="empty-state"><div className="empty-state-icon">🔒</div><p>この操作を行う権限がありません</p></div></div>);
  }
  if (loading) return <div className="page-container"><div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}><p className="text-secondary">読み込み中...</p></div></div>;

  const currentLevelIndex = selectedLearner ? LEVEL_ORDER.indexOf(selectedLearner.currentLevel) : -1;
  const nextLevelCode = currentLevelIndex >= 0 && currentLevelIndex < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[currentLevelIndex + 1] : null;
  const nextLevel = nextLevelCode ? allLevels.find(l => l.code === nextLevelCode) : null;

  const handleLearnerChange = async (newLearnerId: string) => {
    setLearnerId(newLearnerId);
    const learner = await getUserById(newLearnerId);
    setSelectedLearner(learner);
    if (learner) {
      const idx = LEVEL_ORDER.indexOf(learner.currentLevel);
      if (idx >= 0 && idx < LEVEL_ORDER.length - 1) {
        const nl = allLevels.find(l => l.code === LEVEL_ORDER[idx + 1]);
        if (nl) setLevelId(nl.id);
      }
      const evals = await getEvaluationsWithDetails(learner.id);
      setRecentEvals(evals.slice(0, 3));
    } else {
      setRecentEvals([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!learnerId || !levelId || !reason.trim()) return;
    setIsSubmitting(true);
    await addCertification(learnerId, levelId, currentUser.id, reason, certTrack || null);
    router.push('/certifications');
  };

  return (
    <div className="page-container">
      <nav className="breadcrumb"><Link href="/">ホーム</Link><span className="breadcrumb-separator">/</span><Link href="/certifications">認定一覧</Link><span className="breadcrumb-separator">/</span><span>認定申請</span></nav>
      <h1 className="page-title">🏆 認定申請</h1>
      <p className="text-secondary" style={{ marginBottom: 'var(--space-lg)' }}>研修者のレベルアップ認定を申請します。</p>
      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 'var(--space-md)' }}><div className="card-header">対象研修者</div><div className="card-body">
          <select className="form-select" value={learnerId} onChange={e => handleLearnerChange(e.target.value)} required>
            <option value="">研修者を選択してください</option>
            {allLearners.map(l => (<option key={l.id} value={l.id}>{l.name}（現在: {LEVEL_LABELS[l.currentLevel]}）</option>))}
          </select>
          {selectedLearner && (
            <div style={{ marginTop: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <div><div className="text-sm text-secondary">現在のレベル</div><span className={`badge ${LEVEL_BADGE_CLASS[selectedLearner.currentLevel]}`} style={{ fontSize: '0.85rem', padding: '4px 12px' }}>{LEVEL_LABELS[selectedLearner.currentLevel]}</span></div>
              {nextLevel && (<><div style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)' }}>→</div><div><div className="text-sm text-secondary">次のレベル（推奨）</div><span className={`badge ${LEVEL_BADGE_CLASS[nextLevel.code]}`} style={{ fontSize: '0.85rem', padding: '4px 12px' }}>{nextLevel.name}</span></div></>)}
            </div>
          )}
        </div></div>
        <div className="card" style={{ marginBottom: 'var(--space-md)' }}><div className="card-header">申請レベル</div><div className="card-body">
          <select className="form-select" value={levelId} onChange={e => setLevelId(e.target.value)} required>
            <option value="">レベルを選択してください</option>
            {allLevels.map(level => (<option key={level.id} value={level.id}>{level.name} — {level.description}</option>))}
          </select>
        </div></div>
        <div className="card" style={{ marginBottom: 'var(--space-md)' }}><div className="card-header">📄 申請理由</div><div className="card-body">
          <textarea className="form-textarea" value={reason} onChange={e => setReason(e.target.value)} placeholder="認定を推薦する理由を具体的に記入してください" rows={5} required />
        </div></div>
        {recentEvals.length > 0 && (
          <div className="card" style={{ marginBottom: 'var(--space-lg)' }}><div className="card-header">📝 参考：直近のOSCE評価（最新3件）</div><div className="card-body" style={{ padding: 0 }}><table>
            <thead><tr><th>評価日</th><th>トラック</th><th>評価者</th><th>スコア</th><th>結果</th></tr></thead>
            <tbody>{recentEvals.map(ev => (
              <tr key={ev.evaluation.id}>
                <td className="text-sm">{new Date(ev.evaluation.evaluatedAt).toLocaleDateString('ja-JP')}</td>
                <td><span className={`badge ${TRACK_BADGE_CLASS[ev.evaluation.track]}`}>{TRACK_LABELS[ev.evaluation.track]}</span></td>
                <td className="text-sm">{ev.evaluator.name}</td>
                <td><span className="font-semibold">{ev.totalScore}</span><span className="text-secondary text-sm">/{OSCE_TOTAL_SCORE}</span></td>
                <td><span style={{ fontWeight: 600, color: ev.evaluation.passed ? 'var(--color-success)' : 'var(--color-danger)' }}>{ev.evaluation.passed ? '✅合格' : '❌不合格'}</span></td>
              </tr>
            ))}</tbody>
          </table></div></div>
        )}
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
          <Link href={learnerId ? `/learners/${learnerId}` : '/certifications'} className="btn btn-outline">キャンセル</Link>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting || !learnerId || !levelId || !reason.trim()}>{isSubmitting ? '申請中...' : '🏆 認定を申請する'}</button>
        </div>
      </form>
    </div>
  );
}
