/**
 * LISENS - 認定詳細・承認画面（Supabase対応）
 */
'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getCertificationById, getEvaluationsWithDetails, approveCertification, rejectCertification } from '@/lib/data';
import {
  CERTIFICATION_STATUS_LABELS, CERTIFICATION_STATUS_BADGE_CLASS,
  LEVEL_BADGE_CLASS, CAN_APPROVE_CERTIFICATION_ROLES,
  TRACK_LABELS, TRACK_BADGE_CLASS, OSCE_TOTAL_SCORE,
} from '@/lib/constants';
import type { CertificationWithDetails, EvaluationWithDetails } from '@/lib/types';

export default function CertificationDetailClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [certDetail, setCertDetail] = useState<CertificationWithDetails | null>(null);
  const [evalDetails, setEvalDetails] = useState<EvaluationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const cert = await getCertificationById(id);
      setCertDetail(cert);
      if (cert) {
        const evals = await getEvaluationsWithDetails(cert.learner.id);
        setEvalDetails(evals);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (!currentUser) return null;
  if (loading) return <div className="page-container"><div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}><p className="text-secondary">読み込み中...</p></div></div>;
  if (!certDetail) {
    return (<div className="page-container"><div className="empty-state"><div className="empty-state-icon">❌</div><p>認定が見つかりません</p><Link href="/certifications" className="btn btn-outline" style={{ marginTop: 'var(--space-md)' }}>← 認定一覧に戻る</Link></div></div>);
  }

  const { certification: cert, level, applicant, approver, learner } = certDetail;
  const canApprove = CAN_APPROVE_CERTIFICATION_ROLES.includes(currentUser.role);
  const isPending = cert.status === 'pending';

  const handleApprove = async () => {
    if (!confirm('この認定申請を承認しますか？')) return;
    await approveCertification(cert.id, currentUser.id);
    router.push('/certifications');
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    await rejectCertification(cert.id, currentUser.id, rejectionReason.trim());
    router.push('/certifications');
  };

  return (
    <div className="page-container">
      <nav className="breadcrumb"><Link href="/">ホーム</Link><span className="breadcrumb-separator">/</span><Link href="/certifications">認定一覧</Link><span className="breadcrumb-separator">/</span><span>認定詳細</span></nav>
      <h1 className="page-title">🏆 認定詳細</h1>
      <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
        <div className="card-header">📋 認定情報</div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
            <div><div className="text-sm text-secondary">研修者</div><div className="font-semibold"><Link href={`/learners/${learner.id}`}>{learner.name}</Link></div></div>
            <div><div className="text-sm text-secondary">認定レベル</div><div><span className={`badge ${LEVEL_BADGE_CLASS[level.code]}`}>{level.name}</span></div></div>
            {cert.track && (<div><div className="text-sm text-secondary">トラック</div><div><span className={`badge ${TRACK_BADGE_CLASS[cert.track]}`}>{TRACK_LABELS[cert.track]}</span></div></div>)}
            <div><div className="text-sm text-secondary">ステータス</div><div><span className={`badge ${CERTIFICATION_STATUS_BADGE_CLASS[cert.status]}`}>{CERTIFICATION_STATUS_LABELS[cert.status]}</span></div></div>
            <div><div className="text-sm text-secondary">申請日</div><div className="text-sm">{new Date(cert.appliedAt).toLocaleDateString('ja-JP')}</div></div>
            {cert.decidedAt && (<div><div className="text-sm text-secondary">決定日</div><div className="text-sm">{new Date(cert.decidedAt).toLocaleDateString('ja-JP')}</div></div>)}
            <div><div className="text-sm text-secondary">申請者</div><div className="text-sm">{applicant.name}</div></div>
            {approver && (<div><div className="text-sm text-secondary">承認者</div><div className="text-sm">{approver.name}</div></div>)}
          </div>
          {cert.reason && (<div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-sm)', background: 'var(--color-bg)', borderRadius: 'var(--border-radius-sm)', borderLeft: '3px solid var(--color-primary)' }}><div className="text-sm font-semibold" style={{ marginBottom: '2px' }}>📝 申請理由</div><div className="text-sm">{cert.reason}</div></div>)}
          {cert.rejectionReason && (<div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-sm)', background: 'var(--color-danger-light, #ffeaea)', borderRadius: 'var(--border-radius-sm)', borderLeft: '3px solid var(--color-danger)' }}><div className="text-sm font-semibold" style={{ color: 'var(--color-danger)', marginBottom: '2px' }}>⛔ 差し戻し理由</div><div className="text-sm">{cert.rejectionReason}</div></div>)}
        </div>
      </div>
      <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
        <div className="card-header">📝 OSCE評価履歴（参考）</div>
        <div className="card-body" style={{ padding: 0 }}>
          {evalDetails.length === 0 ? (<div className="empty-state" style={{ padding: 'var(--space-md)' }}><p className="text-sm text-secondary">OSCE評価履歴がありません</p></div>) : (
            <table><thead><tr><th>日時</th><th>トラック</th><th>スコア</th><th>結果</th><th>評価者</th></tr></thead>
              <tbody>{evalDetails.map(ev => (
                <tr key={ev.evaluation.id}>
                  <td className="text-sm">{new Date(ev.evaluation.evaluatedAt).toLocaleDateString('ja-JP')}</td>
                  <td><span className={`badge ${TRACK_BADGE_CLASS[ev.evaluation.track]}`} style={{ fontSize: '0.7rem' }}>{TRACK_LABELS[ev.evaluation.track]}</span></td>
                  <td className="text-sm font-semibold">{ev.totalScore}/{OSCE_TOTAL_SCORE}</td>
                  <td><span className="text-sm" style={{ fontWeight: 700, color: ev.evaluation.passed ? 'var(--color-success)' : 'var(--color-danger)' }}>{ev.evaluation.passed ? '✅ 合格' : '❌ 不合格'}</span></td>
                  <td className="text-sm text-secondary">{ev.evaluator.name}</td>
                </tr>
              ))}</tbody></table>
          )}
        </div>
      </div>
      {canApprove && isPending && (
        <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="card-header">🛡️ 承認アクション</div>
          <div className="card-body">
            {!showRejectForm ? (
              <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={handleApprove} style={{ minWidth: '160px' }}>✅ 承認する</button>
                <button className="btn" style={{ minWidth: '160px', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', background: 'transparent', cursor: 'pointer' }} onClick={() => setShowRejectForm(true)}>⛔ 差し戻す</button>
              </div>
            ) : (
              <div>
                <div className="form-group"><label className="form-label">差し戻し理由 <span style={{ color: 'var(--color-danger)' }}>*</span></label><textarea className="form-input" rows={3} value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="差し戻しの理由を具体的に記載してください" /></div>
                <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
                  <button className="btn btn-outline" onClick={() => setShowRejectForm(false)}>キャンセル</button>
                  <button className="btn" style={{ color: 'white', background: 'var(--color-danger)', border: 'none', cursor: 'pointer' }} onClick={handleReject} disabled={!rejectionReason.trim()}>⛔ 差し戻しを確定</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Link href="/certifications" className="btn btn-outline">← 認定一覧に戻る</Link></div>
    </div>
  );
}
