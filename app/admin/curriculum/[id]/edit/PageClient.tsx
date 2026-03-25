/**
 * LISENS - カリキュラム編集画面 - クライアントコンポーネント（Supabase対応）
 */
'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  getCurriculumById, getSubjectsByCurriculum,
  updateCurriculum, addSubject, updateSubject, deleteSubject,
} from '@/lib/data';
import { TRACK_LABELS } from '@/lib/constants';
import type { TrackCode, Subject, Curriculum } from '@/lib/types';

const TYPE_OPTIONS = [
  { value: 'common', label: '共通コア' },
  { value: 'track', label: 'トラック専門' },
  { value: 'brushup', label: 'ブラッシュアップ' },
] as const;

const TRACK_OPTIONS: { value: TrackCode; label: string }[] = [
  { value: 'weight', label: TRACK_LABELS.weight },
  { value: 'pilates', label: TRACK_LABELS.pilates },
  { value: 'stretch', label: TRACK_LABELS.stretch },
];

export default function EditCurriculumClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user: currentUser } = useAuth();

  const [curriculum, setCurriculum] = useState<Curriculum | undefined>();
  const [currentSubjects, setCurrentSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'common' | 'track' | 'brushup'>('common');
  const [trackCode, setTrackCode] = useState<TrackCode | ''>('');
  const [totalHours, setTotalHours] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubDesc, setNewSubDesc] = useState('');
  const [newSubHours, setNewSubHours] = useState(2);
  const [editSubName, setEditSubName] = useState('');
  const [editSubDesc, setEditSubDesc] = useState('');
  const [editSubHours, setEditSubHours] = useState(2);
  const [editSubActive, setEditSubActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const cur = await getCurriculumById(id);
      setCurriculum(cur);
      if (cur) {
        setName(cur.name);
        setDescription(cur.description || '');
        setType(cur.type);
        setTrackCode(cur.trackCode || '');
        setTotalHours(cur.totalHours);
        setIsActive(cur.isActive);
        const subs = await getSubjectsByCurriculum(id);
        setCurrentSubjects(subs);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const refreshSubjects = async () => {
    const subs = await getSubjectsByCurriculum(id);
    setCurrentSubjects(subs);
  };

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'education_manager')) {
    return (<div className="page-container"><div className="empty-state"><div className="empty-state-icon">🔒</div><p>この操作を行う権限がありません</p></div></div>);
  }
  if (loading) return <div className="page-container"><div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}><p className="text-secondary">読み込み中...</p></div></div>;
  if (!curriculum) {
    return (<div className="page-container"><div className="empty-state"><div className="empty-state-icon">❌</div><p>カリキュラムが見つかりません</p><Link href="/admin/curriculum" className="btn btn-outline" style={{ marginTop: 'var(--space-md)' }}>← 一覧に戻る</Link></div></div>);
  }

  const handleSaveCurriculum = async () => {
    setIsSaving(true);
    await updateCurriculum(id, { name, description: description || null, type, trackCode: type === 'track' ? (trackCode as TrackCode) : null, totalHours, isActive });
    setIsSaving(false);
    alert('カリキュラム情報を保存しました');
  };

  const handleAddSubject = async () => {
    if (!newSubName.trim()) return;
    await addSubject({ curriculumId: id, name: newSubName.trim(), description: newSubDesc.trim() || null, hours: newSubHours });
    setNewSubName(''); setNewSubDesc(''); setNewSubHours(2); setShowAddForm(false);
    await refreshSubjects();
  };

  const startEditSubject = (sub: Subject) => {
    setEditingSubjectId(sub.id);
    setEditSubName(sub.name); setEditSubDesc(sub.description || ''); setEditSubHours(sub.hours); setEditSubActive(sub.isActive);
  };

  const handleSaveSubject = async (subId: string) => {
    await updateSubject(subId, { name: editSubName.trim(), description: editSubDesc.trim() || null, hours: editSubHours, isActive: editSubActive });
    setEditingSubjectId(null);
    await refreshSubjects();
  };

  const handleDeleteSubject = async (subId: string, subName: string) => {
    if (!confirm(`「${subName}」を削除しますか？\nこの操作は元に戻せません。`)) return;
    await deleteSubject(subId);
    await refreshSubjects();
  };

  const calculatedHours = currentSubjects.reduce((sum, s) => sum + s.hours, 0);

  return (
    <div className="page-container">
      <nav className="breadcrumb"><Link href="/">ホーム</Link><span className="breadcrumb-separator">/</span><Link href="/admin/curriculum">カリキュラムマスタ</Link><span className="breadcrumb-separator">/</span><span>{curriculum.name} を編集</span></nav>
      <h1 className="page-title">✏️ カリキュラム編集</h1>

      {/* 基本情報 */}
      <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
        <div className="card-header">📋 基本情報</div>
        <div className="card-body">
          <div className="form-group"><label className="form-label">カリキュラム名 <span style={{ color: 'var(--color-danger)' }}>*</span></label><input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">説明</label><textarea className="form-input" rows={2} value={description} onChange={e => setDescription(e.target.value)} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
            <div className="form-group"><label className="form-label">種別</label>
              <select className="form-select" value={type} onChange={e => setType(e.target.value as typeof type)}>{TYPE_OPTIONS.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}</select></div>
            {type === 'track' && (<div className="form-group"><label className="form-label">トラック</label>
              <select className="form-select" value={trackCode} onChange={e => setTrackCode(e.target.value as TrackCode)}><option value="">選択してください</option>{TRACK_OPTIONS.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}</select></div>)}
            <div className="form-group"><label className="form-label">合計時間（h）</label>
              <input type="number" className="form-input" value={totalHours} onChange={e => setTotalHours(Number(e.target.value))} min={0} step={0.5} style={{ maxWidth: '120px' }} />
              {calculatedHours !== totalHours && (<div className="text-sm" style={{ color: 'var(--color-warning)', marginTop: '4px' }}>⚠️ 科目合計 {calculatedHours}h と一致しません</div>)}</div>
          </div>
          <div className="form-group"><label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}><input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} /><span className="form-label" style={{ margin: 0 }}>有効</span></label></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button className="btn btn-primary" onClick={handleSaveCurriculum} disabled={isSaving}>{isSaving ? '保存中...' : '💾 基本情報を保存'}</button></div>
        </div>
      </div>

      {/* 科目一覧 */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📖 科目一覧（{currentSubjects.length}コマ / {calculatedHours}h）</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(true)}>➕ 科目を追加</button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container"><table><thead><tr><th style={{ width: '40px' }}>#</th><th>科目名</th><th>説明</th><th style={{ width: '70px' }}>時間</th><th style={{ width: '70px' }}>状態</th><th style={{ width: '140px' }}>操作</th></tr></thead>
            <tbody>
              {showAddForm && (
                <tr style={{ background: 'var(--color-primary-light, #eef2ff)' }}>
                  <td className="text-sm text-secondary">新</td>
                  <td><input type="text" className="form-input" placeholder="科目名" value={newSubName} onChange={e => setNewSubName(e.target.value)} style={{ fontSize: '0.85rem' }} /></td>
                  <td><input type="text" className="form-input" placeholder="説明（任意）" value={newSubDesc} onChange={e => setNewSubDesc(e.target.value)} style={{ fontSize: '0.85rem' }} /></td>
                  <td><input type="number" className="form-input" value={newSubHours} onChange={e => setNewSubHours(Number(e.target.value))} min={0.5} step={0.5} style={{ fontSize: '0.85rem', width: '60px' }} /></td>
                  <td>—</td>
                  <td><div style={{ display: 'flex', gap: '4px' }}><button className="btn btn-primary btn-sm" onClick={handleAddSubject} disabled={!newSubName.trim()}>追加</button><button className="btn btn-outline btn-sm" onClick={() => setShowAddForm(false)}>✕</button></div></td>
                </tr>
              )}
              {currentSubjects.map((sub, idx) => (
                editingSubjectId === sub.id ? (
                  <tr key={sub.id} style={{ background: 'var(--color-primary-light, #eef2ff)' }}>
                    <td className="text-sm text-secondary">{idx + 1}</td>
                    <td><input type="text" className="form-input" value={editSubName} onChange={e => setEditSubName(e.target.value)} style={{ fontSize: '0.85rem' }} /></td>
                    <td><input type="text" className="form-input" value={editSubDesc} onChange={e => setEditSubDesc(e.target.value)} style={{ fontSize: '0.85rem' }} /></td>
                    <td><input type="number" className="form-input" value={editSubHours} onChange={e => setEditSubHours(Number(e.target.value))} min={0.5} step={0.5} style={{ fontSize: '0.85rem', width: '60px' }} /></td>
                    <td><label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}><input type="checkbox" checked={editSubActive} onChange={e => setEditSubActive(e.target.checked)} /><span className="text-sm">{editSubActive ? '有効' : '無効'}</span></label></td>
                    <td><div style={{ display: 'flex', gap: '4px' }}><button className="btn btn-primary btn-sm" onClick={() => handleSaveSubject(sub.id)}>保存</button><button className="btn btn-outline btn-sm" onClick={() => setEditingSubjectId(null)}>✕</button></div></td>
                  </tr>
                ) : (
                  <tr key={sub.id} style={{ opacity: sub.isActive ? 1 : 0.5 }}>
                    <td className="text-sm text-secondary">{idx + 1}</td>
                    <td className="font-semibold">{sub.name}</td>
                    <td className="text-sm text-secondary">{sub.description || '—'}</td>
                    <td className="text-sm">{sub.hours}h</td>
                    <td>{sub.isActive ? <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>有効</span> : <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>無効</span>}</td>
                    <td><div style={{ display: 'flex', gap: '4px' }}><button className="btn btn-outline btn-sm" onClick={() => startEditSubject(sub)}>✏️</button><button className="btn btn-sm" style={{ color: 'var(--color-danger)', border: '1px solid var(--color-danger)', background: 'transparent', cursor: 'pointer' }} onClick={() => handleDeleteSubject(sub.id, sub.name)}>🗑</button></div></td>
                  </tr>
                )
              ))}
              {currentSubjects.length === 0 && !showAddForm && (<tr><td colSpan={6}><div className="empty-state" style={{ padding: 'var(--space-md)' }}><p className="text-sm text-secondary">科目が登録されていません</p></div></td></tr>)}
            </tbody>
          </table></div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Link href="/admin/curriculum" className="btn btn-outline">← カリキュラム一覧に戻る</Link></div>
    </div>
  );
}
