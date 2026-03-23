/**
 * LISENS - OSCE実技評価入力画面
 * 
 * 評価者がトレーナー候補のOSCE実技を評価する。
 * 6セクション16項目を採点（5/3/1/0 or 3/2/1/0）し、即NG判定も記録する。
 */
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getUserById, addEvaluation } from '@/lib/data';
import {
  EVALUATION_TEMPLATES, CAN_EVALUATE_ROLES, NG_ITEMS,
  SECTION_LABELS, SECTION_ICONS, TRACK_LABELS,
  OSCE_TOTAL_SCORE, OSCE_PASS_SCORE,
  SCORE_GUIDE_5, SCORE_GUIDE_3,
} from '@/lib/constants';
import type { EvaluationItemName, EvaluationSectionCode, TrackCode } from '@/lib/types';

interface ItemInput {
  itemName: EvaluationItemName;
  score: number;
  comment: string;
}

export default function NewEvaluationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useAuth();

  const learnerId = searchParams.get('learner_id') || '';
  const learner = learnerId ? getUserById(learnerId) : undefined;

  // フォーム状態
  const [track, setTrack] = useState<TrackCode>('weight');
  const [overallComment, setOverallComment] = useState('');
  const [goodPoints, setGoodPoints] = useState(['', '', '']);
  const [improvementPoints, setImprovementPoints] = useState(['', '']);
  const [selectedNGs, setSelectedNGs] = useState<string[]>([]);
  const [items, setItems] = useState<ItemInput[]>(
    EVALUATION_TEMPLATES.map(t => ({
      itemName: t.name,
      score: 0,
      comment: '',
    }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 権限チェック
  if (!currentUser || !CAN_EVALUATE_ROLES.includes(currentUser.role)) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <p>この操作を行う権限がありません</p>
        </div>
      </div>
    );
  }

  if (!learner) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">❌</div>
          <p>研修者が指定されていません</p>
          <Link href="/learners" className="btn btn-outline" style={{ marginTop: 'var(--space-md)' }}>← 研修者一覧に戻る</Link>
        </div>
      </div>
    );
  }

  const totalScore = items.reduce((sum, item) => sum + item.score, 0);
  const scoreRate = Math.round((totalScore / OSCE_TOTAL_SCORE) * 100);
  const passed = totalScore >= OSCE_PASS_SCORE && selectedNGs.length === 0;

  const updateScore = (index: number, score: number) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, score } : item));
  };

  const updateComment = (index: number, comment: string) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, comment } : item));
  };

  const toggleNG = (code: string) => {
    setSelectedNGs(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    addEvaluation(
      learnerId, currentUser.id, track, overallComment, selectedNGs, items,
      goodPoints.filter(p => p.trim()),
      improvementPoints.filter(p => p.trim()),
    );
    router.push(`/learners/${learnerId}`);
  };

  // セクション別にグループ化
  const sections: EvaluationSectionCode[] = ['C', 'E', 'P', 'T', 'S', 'EN'];
  const applicableNGs = track === 'stretch'
    ? NG_ITEMS
    : NG_ITEMS.filter(ng => !ng.stretchOnly);

  return (
    <div className="page-container">
      <nav className="breadcrumb">
        <Link href="/">ホーム</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href="/learners">研修者一覧</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href={`/learners/${learnerId}`}>{learner.name}</Link>
        <span className="breadcrumb-separator">/</span>
        <span>OSCE評価</span>
      </nav>

      <h1 className="page-title">📝 Lv1 OSCE 実技評価</h1>
      <p className="text-secondary" style={{ marginBottom: 'var(--space-lg)' }}>
        対象: <strong>{learner.name}</strong> ｜ 合格基準: {OSCE_PASS_SCORE}/{OSCE_TOTAL_SCORE}点（70%）＋ 即NG 0件
      </p>

      <form onSubmit={handleSubmit}>
        {/* トラック選択 */}
        <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="card-header">受験トラック</div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              {(['weight', 'pilates', 'stretch'] as TrackCode[]).map(t => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', cursor: 'pointer' }}>
                  <input type="radio" name="track" value={t} checked={track === t} onChange={() => setTrack(t)} />
                  <span className="font-semibold">{TRACK_LABELS[t]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 即NG判定 */}
        <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="card-header">⛔ 即NG判定（1件でも該当→即不合格）</div>
          <div className="card-body">
            {applicableNGs.map(ng => (
              <label key={ng.code} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)', padding: 'var(--space-xs) 0', cursor: 'pointer' }}>
                <input type="checkbox" checked={selectedNGs.includes(ng.code)} onChange={() => toggleNG(ng.code)} style={{ marginTop: '3px' }} />
                <div>
                  <span className="font-semibold" style={{ color: selectedNGs.includes(ng.code) ? 'var(--color-danger)' : undefined }}>
                    {ng.code}: {ng.label}
                  </span>
                  <div className="text-sm text-secondary">{ng.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* セクション別評価 */}
        {sections.map(sec => {
          const secTemplates = EVALUATION_TEMPLATES.filter(t => t.section === sec);
          const scoreGuide = sec === 'EN' ? SCORE_GUIDE_3 : SCORE_GUIDE_5;
          return (
            <div key={sec} className="card" style={{ marginBottom: 'var(--space-md)' }}>
              <div className="card-header">{SECTION_ICONS[sec]} {SECTION_LABELS[sec]}</div>
              <div className="card-body">
                {secTemplates.map(tmpl => {
                  const idx = items.findIndex(i => i.itemName === tmpl.name);
                  const item = items[idx];
                  return (
                    <div key={tmpl.name} style={{ padding: 'var(--space-md)', background: idx % 2 === 0 ? 'var(--color-bg)' : 'transparent', borderRadius: 'var(--border-radius-sm)', marginBottom: 'var(--space-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                        <div>
                          <div className="font-semibold">{tmpl.name}: {tmpl.label}</div>
                          <div className="text-sm text-secondary">{tmpl.description}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                          {scoreGuide.map(g => (
                            <button key={g.score} type="button" onClick={() => updateScore(idx, g.score)}
                              title={`${g.label}: ${g.description}`}
                              style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                border: item.score === g.score ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                                background: item.score === g.score ? 'var(--color-primary)' : 'transparent',
                                color: item.score === g.score ? '#fff' : 'var(--color-text)',
                                cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit',
                              }}
                            >
                              {g.score}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input type="text" className="form-input" placeholder="コメント（任意）" value={item.comment} onChange={e => updateComment(idx, e.target.value)} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* スコアサマリー */}
        <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="card-header">📊 採点結果</div>
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: passed ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {totalScore} / {OSCE_TOTAL_SCORE}点 ({scoreRate}%)
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, marginTop: 'var(--space-sm)' }}>
              {passed ? '✅ 合格' : '❌ 不合格'}
              {selectedNGs.length > 0 && <span style={{ color: 'var(--color-danger)', marginLeft: 'var(--space-sm)' }}>⛔ NG {selectedNGs.length}件</span>}
            </div>
          </div>
        </div>

        {/* フィードバック */}
        <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="card-header">📝 フィードバック</div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">💬 総合コメント</label>
              <textarea className="form-textarea" value={overallComment} onChange={e => setOverallComment(e.target.value)} placeholder="総合的なフィードバック" rows={3} />
            </div>
            <div className="form-group">
              <label className="form-label">👍 良かった点（3点以上）</label>
              {goodPoints.map((p, i) => (
                <input key={i} type="text" className="form-input" style={{ marginBottom: 'var(--space-xs)' }}
                  value={p} onChange={e => { const np = [...goodPoints]; np[i] = e.target.value; setGoodPoints(np); }}
                  placeholder={`良かった点 ${i + 1}`} />
              ))}
            </div>
            <div className="form-group">
              <label className="form-label">🔧 改善点</label>
              {improvementPoints.map((p, i) => (
                <input key={i} type="text" className="form-input" style={{ marginBottom: 'var(--space-xs)' }}
                  value={p} onChange={e => { const np = [...improvementPoints]; np[i] = e.target.value; setImprovementPoints(np); }}
                  placeholder={`改善点 ${i + 1}`} />
              ))}
            </div>
          </div>
        </div>

        {/* ボタン */}
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
          <Link href={`/learners/${learnerId}`} className="btn btn-outline">キャンセル</Link>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? '保存中...' : '📝 評価を保存'}
          </button>
        </div>
      </form>
    </div>
  );
}
