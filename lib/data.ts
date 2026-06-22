/**
 * LISENS - データアクセス層（Supabase版）
 * 
 * Supabaseからデータを取得し、アプリの型に変換するユーティリティ。
 * 全関数が非同期（async）に変更されている。
 */

import { getSupabase } from './supabase';

// 各関数内でgetSupabase()を呼び出すショートカット
const sb = () => getSupabase();
import type {
  User, UserRole, Organization, LearnerSummary, LearnerDetail,
  CurriculumProgress, SubjectProgress, EvaluationWithDetails,
  CertificationWithDetails, CertificationLevel, Evaluation,
  EvaluationItem, EvaluationItemName, TrackCode,
  ProgressStatus, CourseProgress, Curriculum, Subject,
  CertificationLevelCode,
} from './types';
import { LEVEL_LABELS, OSCE_TOTAL_SCORE } from './constants';

// ============================================
// DB行 → アプリ型 の変換ヘルパー
// ============================================

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as UserRole,
    organizationId: row.organization_id,
    currentLevel: row.current_level as CertificationLevelCode,
    tracks: (row.tracks || []) as TrackCode[],
    hireDate: row.hire_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOrganization(row: any): Organization {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    parentId: row.parent_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCurriculum(row: any): Curriculum {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    type: row.type,
    trackCode: row.track_code as TrackCode | null,
    totalHours: Number(row.total_hours),
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSubject(row: any): Subject {
  return {
    id: row.id,
    curriculumId: row.curriculum_id,
    name: row.name,
    description: row.description,
    hours: Number(row.hours),
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCourseProgress(row: any): CourseProgress {
  return {
    id: row.id,
    userId: row.user_id,
    subjectId: row.subject_id,
    status: row.status as ProgressStatus,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    memo: row.memo,
    updatedBy: row.updated_by ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEvaluation(row: any): Evaluation {
  return {
    id: row.id,
    learnerId: row.learner_id,
    evaluatorId: row.evaluator_id,
    track: row.track as TrackCode,
    status: row.status,
    totalScore: row.total_score,
    passed: row.passed,
    ngItems: row.ng_items || [],
    overallComment: row.overall_comment,
    goodPoints: row.good_points || [],
    improvementPoints: row.improvement_points || [],
    evaluatedAt: row.evaluated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEvaluationItem(row: any): EvaluationItem {
  return {
    id: row.id,
    evaluationId: row.evaluation_id,
    itemName: row.item_name as EvaluationItemName,
    score: row.score,
    comment: row.comment,
    createdAt: row.created_at,
  };
}

function mapCertificationLevel(row: any): CertificationLevel {
  return {
    id: row.id,
    code: row.code as CertificationLevelCode,
    name: row.name,
    sortOrder: row.sort_order,
    description: row.description,
    requirements: row.requirements,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ============================================
// ユーザー・組織の取得
// ============================================

/**
 * 受講者のトラックに該当するカリキュラムか判定する。
 * 共通・ブラッシュアップは全員対象。トラック専門は本人のトラックに含まれる場合のみ。
 */
function isRelevantCurriculum(
  cur: { type: string; track_code: string | null },
  tracks: string[],
): boolean {
  if (cur.type === 'common' || cur.type === 'brushup') return true;
  if (cur.type === 'track') return !!cur.track_code && tracks.includes(cur.track_code);
  return false;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const { data } = await sb().from('users').select('*').eq('id', id).single();
  return data ? mapUser(data) : undefined;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const { data } = await sb().from('users').select('*').eq('email', email).single();
  return data ? mapUser(data) : undefined;
}

export async function getUserByAuthUid(authUid: string): Promise<User | undefined> {
  const { data } = await sb().from('users').select('*').eq('auth_uid', authUid).single();
  return data ? mapUser(data) : undefined;
}

export async function getOrganizationById(id: string): Promise<Organization | undefined> {
  const { data } = await sb().from('organizations').select('*').eq('id', id).single();
  return data ? mapOrganization(data) : undefined;
}

export async function getLearners(): Promise<User[]> {
  const { data } = await sb().from('users').select('*').eq('role', 'learner');
  return (data || []).map(mapUser);
}

export async function getLearnersForRole(currentUser: User): Promise<User[]> {
  const allLearners = await getLearners();
  switch (currentUser.role) {
    case 'admin':
    case 'education_manager':
    case 'evaluator':
      return allLearners;
    case 'store_manager':
      return allLearners.filter(l => l.organizationId === currentUser.organizationId);
    case 'learner':
      return allLearners.filter(l => l.id === currentUser.id);
    default:
      return [];
  }
}

// ============================================
// 受講者サマリー
// ============================================

export async function getLearnerSummary(userId: string): Promise<LearnerSummary | undefined> {
  const user = await getUserById(userId);
  if (!user) return undefined;
  const org = await getOrganizationById(user.organizationId);
  if (!org) return undefined;

  // 受講者のトラックに該当するカリキュラムの科目だけを分母にする
  const [{ data: curricula }, { data: allSubjects }, { data: progresses }] = await Promise.all([
    sb().from('curricula').select('id, type, track_code'),
    sb().from('subjects').select('id, curriculum_id'),
    sb().from('course_progresses').select('subject_id, status').eq('user_id', userId),
  ]);
  const relevantCurIds = new Set(
    (curricula || []).filter(c => isRelevantCurriculum(c, user.tracks)).map(c => c.id),
  );
  const relevantSubjectIds = new Set(
    (allSubjects || []).filter(s => relevantCurIds.has(s.curriculum_id)).map(s => s.id),
  );
  const total = relevantSubjectIds.size;
  const completed = (progresses || []).filter(
    p => p.status === 'completed' && relevantSubjectIds.has(p.subject_id),
  ).length;
  const overallProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const { data: evals } = await sb()
    .from('evaluations').select('evaluated_at').eq('learner_id', userId)
    .order('evaluated_at', { ascending: false }).limit(1);
  const lastEval = evals?.[0];

  return {
    user, organization: org, overallProgress,
    lastEvaluationDate: lastEval?.evaluated_at || null,
    currentLevelName: LEVEL_LABELS[user.currentLevel],
  };
}

/**
 * 研修者サマリー一覧を一括取得する（N+1回避・販売物レベルの速度）。
 * 学習者ごとに個別クエリを投げず、必要なテーブルをまとめて取得しメモリ上で集計する。
 */
export async function getLearnerSummaries(currentUser: User): Promise<LearnerSummary[]> {
  const learners = await getLearnersForRole(currentUser);
  if (learners.length === 0) return [];

  const learnerIds = learners.map(l => l.id);
  const orgIds = [...new Set(learners.map(l => l.organizationId))];

  const [orgsRes, curRes, subRes, progRes, evalRes] = await Promise.all([
    sb().from('organizations').select('*').in('id', orgIds),
    sb().from('curricula').select('id, type, track_code'),
    sb().from('subjects').select('id, curriculum_id'),
    sb().from('course_progresses').select('user_id, subject_id, status').in('user_id', learnerIds),
    sb().from('evaluations').select('learner_id, evaluated_at').in('learner_id', learnerIds),
  ]);

  const orgMap = new Map((orgsRes.data || []).map(o => [o.id, mapOrganization(o)]));
  const curRows = curRes.data || [];
  const subRows = subRes.data || [];

  // 学習者別の進捗をまとめる
  const progByUser = new Map<string, { subject_id: string; status: string }[]>();
  for (const pr of progRes.data || []) {
    const arr = progByUser.get(pr.user_id) || [];
    arr.push(pr);
    progByUser.set(pr.user_id, arr);
  }
  // 学習者別の最新評価日
  const lastEvalByUser = new Map<string, string>();
  for (const e of evalRes.data || []) {
    if (!e.evaluated_at) continue;
    const cur = lastEvalByUser.get(e.learner_id);
    if (!cur || e.evaluated_at > cur) lastEvalByUser.set(e.learner_id, e.evaluated_at);
  }

  return learners.map(l => {
    const relevantCurIds = new Set(curRows.filter(c => isRelevantCurriculum(c, l.tracks)).map(c => c.id));
    const relevantSubjectIds = new Set(
      subRows.filter(su => relevantCurIds.has(su.curriculum_id)).map(su => su.id),
    );
    const total = relevantSubjectIds.size;
    const myProg = progByUser.get(l.id) || [];
    const completed = myProg.filter(
      pr => pr.status === 'completed' && relevantSubjectIds.has(pr.subject_id),
    ).length;
    const overallProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
    const organization = orgMap.get(l.organizationId) || {
      id: l.organizationId, name: '—', type: 'store' as const,
      parentId: null, createdAt: '', updatedAt: '',
    };
    return {
      user: l,
      organization,
      overallProgress,
      lastEvaluationDate: lastEvalByUser.get(l.id) || null,
      currentLevelName: LEVEL_LABELS[l.currentLevel],
    };
  });
}

// ============================================
// 受講者詳細（個人カルテ）
// ============================================

export async function getLearnerDetail(userId: string): Promise<LearnerDetail | undefined> {
  const user = await getUserById(userId);
  if (!user) return undefined;
  const org = await getOrganizationById(user.organizationId);
  if (!org) return undefined;

  const { data: levelData } = await sb()
    .from('certification_levels').select('*').eq('code', user.currentLevel).single();
  if (!levelData) return undefined;
  const currentLevel = mapCertificationLevel(levelData);

  const [curriculumProgresses, evaluations, certifications] = await Promise.all([
    getCurriculumProgresses(userId, user.tracks),
    getEvaluationsWithDetails(userId),
    getCertificationsForLearner(userId),
  ]);

  // 引継ぎ: 進捗を最後に更新した担当者名を解決する
  const updaterNames: Record<string, string> = {};
  const updaterIds = [
    ...new Set(
      curriculumProgresses
        .flatMap(cp => cp.subjects)
        .map(sp => sp.progress?.updatedBy)
        .filter((v): v is string => !!v),
    ),
  ];
  if (updaterIds.length > 0) {
    const { data: us } = await sb().from('users').select('id, name').in('id', updaterIds);
    for (const u of us || []) updaterNames[u.id] = u.name;
  }

  return { user, organization: org, curriculumProgresses, evaluations, certifications, currentLevel, updaterNames };
}

async function getCurriculumProgresses(userId: string, tracks: string[]): Promise<CurriculumProgress[]> {
  const { data: curricula } = await sb().from('curricula').select('*').order('sort_order');
  const { data: allSubjects } = await sb().from('subjects').select('*').order('sort_order');
  const { data: allProgresses } = await sb()
    .from('course_progresses').select('*').eq('user_id', userId);

  return (curricula || [])
    .filter(cur => isRelevantCurriculum(cur, tracks))
    .map(cur => {
    const curSubjects = (allSubjects || []).filter(s => s.curriculum_id === cur.id);
    const subjectProgresses: SubjectProgress[] = curSubjects.map(sub => {
      const progress = (allProgresses || []).find(p => p.subject_id === sub.id);
      return { subject: mapSubject(sub), progress: progress ? mapCourseProgress(progress) : null };
    });
    const total = subjectProgresses.length;
    const completed = subjectProgresses.filter(sp => sp.progress?.status === 'completed').length;
    const progressRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { curriculum: mapCurriculum(cur), subjects: subjectProgresses, progressRate };
  });
}

// ============================================
// 評価関連
// ============================================

export async function getEvaluationsWithDetails(userId: string): Promise<EvaluationWithDetails[]> {
  const { data: evals } = await sb()
    .from('evaluations').select('*').eq('learner_id', userId)
    .order('evaluated_at', { ascending: false });

  if (!evals || evals.length === 0) return [];

  const results: EvaluationWithDetails[] = [];
  for (const evalRow of evals) {
    const evaluator = await getUserById(evalRow.evaluator_id);
    if (!evaluator) continue;
    const { data: itemRows } = await sb()
      .from('evaluation_items').select('*').eq('evaluation_id', evalRow.id);
    const items = (itemRows || []).map(mapEvaluationItem);
    const totalScore = items.reduce((sum, item) => sum + item.score, 0);
    const scoreRate = Math.round((totalScore / OSCE_TOTAL_SCORE) * 100);
    results.push({ evaluation: mapEvaluation(evalRow), evaluator, items, totalScore, scoreRate });
  }
  return results;
}

export async function getAllEvaluations(): Promise<EvaluationWithDetails[]> {
  const { data: evals } = await sb()
    .from('evaluations').select('*').order('evaluated_at', { ascending: false });

  if (!evals || evals.length === 0) return [];

  const results: EvaluationWithDetails[] = [];
  for (const evalRow of evals) {
    const evaluator = await getUserById(evalRow.evaluator_id);
    if (!evaluator) continue;
    const { data: itemRows } = await sb()
      .from('evaluation_items').select('*').eq('evaluation_id', evalRow.id);
    const items = (itemRows || []).map(mapEvaluationItem);
    const totalScore = items.reduce((sum, item) => sum + item.score, 0);
    const scoreRate = Math.round((totalScore / OSCE_TOTAL_SCORE) * 100);
    results.push({ evaluation: mapEvaluation(evalRow), evaluator, items, totalScore, scoreRate });
  }
  return results;
}

// ============================================
// 認定関連
// ============================================

export async function getCertificationsForLearner(learnerId: string): Promise<CertificationWithDetails[]> {
  const { data: certs } = await sb()
    .from('certifications').select('*').eq('learner_id', learnerId)
    .order('applied_at', { ascending: false });
  if (!certs) return [];
  const results = await Promise.all(certs.map(buildCertificationWithDetails));
  return results.filter((c): c is CertificationWithDetails => c !== null);
}

export async function getAllCertifications(): Promise<CertificationWithDetails[]> {
  const { data: certs } = await sb()
    .from('certifications').select('*').order('applied_at', { ascending: false });
  if (!certs) return [];
  const results = await Promise.all(certs.map(buildCertificationWithDetails));
  return results.filter((c): c is CertificationWithDetails => c !== null);
}

export async function getCertificationById(id: string): Promise<CertificationWithDetails | null> {
  const { data: cert } = await sb().from('certifications').select('*').eq('id', id).single();
  if (!cert) return null;
  return buildCertificationWithDetails(cert);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildCertificationWithDetails(cert: any): Promise<CertificationWithDetails | null> {
  const { data: levelData } = await sb()
    .from('certification_levels').select('*').eq('id', cert.level_id).single();
  const applicant = await getUserById(cert.applicant_id);
  const learner = await getUserById(cert.learner_id);
  if (!levelData || !applicant || !learner) return null;
  const approver = cert.approver_id ? (await getUserById(cert.approver_id)) || null : null;
  const level = mapCertificationLevel(levelData);
  return {
    certification: {
      id: cert.id, learnerId: cert.learner_id, levelId: cert.level_id,
      track: cert.track as TrackCode | null, applicantId: cert.applicant_id,
      approverId: cert.approver_id, status: cert.status,
      reason: cert.reason, rejectionReason: cert.rejection_reason,
      appliedAt: cert.applied_at, decidedAt: cert.decided_at,
      createdAt: cert.created_at, updatedAt: cert.updated_at,
    },
    level, applicant, approver, learner,
  };
}

export async function getCertificationLevels(): Promise<CertificationLevel[]> {
  const { data } = await sb().from('certification_levels').select('*').order('sort_order');
  return (data || []).map(mapCertificationLevel);
}

// ============================================
// 統計・ダッシュボード
// ============================================

export async function getDashboardStats() {
  const { count: totalLearners } = await sb()
    .from('users').select('*', { count: 'exact', head: true }).eq('role', 'learner');
  const { count: pendingCertifications } = await sb()
    .from('certifications').select('*', { count: 'exact', head: true }).eq('status', 'pending');

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { count: recentEvaluations } = await sb()
    .from('evaluations').select('*', { count: 'exact', head: true })
    .gte('evaluated_at', thirtyDaysAgo.toISOString());

  const { count: totalCurricula } = await sb()
    .from('curricula').select('*', { count: 'exact', head: true });

  return {
    totalLearners: totalLearners || 0,
    pendingCertifications: pendingCertifications || 0,
    recentEvaluations: recentEvaluations || 0,
    totalCurricula: totalCurricula || 0,
  };
}

// ============================================
// データ変更操作
// ============================================

export async function addEvaluation(
  learnerId: string,
  evaluatorId: string,
  track: TrackCode,
  overallComment: string,
  ngItemCodes: string[],
  items: { itemName: EvaluationItemName; score: number; comment: string }[],
  goodPoints: string[],
  improvementPoints: string[],
): Promise<Evaluation> {
  const totalScore = items.reduce((sum, item) => sum + item.score, 0);
  const passed = totalScore >= 61 && ngItemCodes.length === 0;

  const { data: newEval, error } = await sb().from('evaluations').insert({
    learner_id: learnerId, evaluator_id: evaluatorId, track,
    status: 'submitted', total_score: totalScore, passed, ng_items: ngItemCodes,
    overall_comment: overallComment || null, good_points: goodPoints,
    improvement_points: improvementPoints,
  }).select().single();

  if (error || !newEval) throw new Error('評価の保存に失敗しました');

  // 評価項目を一括挿入
  const itemRows = items.map(item => ({
    evaluation_id: newEval.id,
    item_name: item.itemName,
    score: item.score,
    comment: item.comment || null,
  }));
  await sb().from('evaluation_items').insert(itemRows);

  return mapEvaluation(newEval);
}

// ============================================
// 科目の取得
// ============================================

export async function getAllSubjects(): Promise<Subject[]> {
  const { data } = await sb().from('subjects').select('*').order('sort_order');
  return (data || []).map(mapSubject);
}

// ============================================
// 受講進捗の更新操作
// ============================================

export async function updateProgressStatus(
  userId: string, subjectId: string, status: ProgressStatus, actingUserId: string,
): Promise<CourseProgress> {
  const now = new Date().toISOString();
  // 既存チェック
  const { data: existing } = await sb()
    .from('course_progresses').select('*')
    .eq('user_id', userId).eq('subject_id', subjectId).single();

  if (existing) {
    const updates: Record<string, unknown> = { status, updated_at: now, updated_by: actingUserId };
    if (status === 'in_progress' && !existing.started_at) updates.started_at = now;
    if (status === 'completed') {
      updates.completed_at = now;
      if (!existing.started_at) updates.started_at = now;
    }
    if (status === 'not_started') {
      updates.started_at = null;
      updates.completed_at = null;
    }
    const { data } = await sb().from('course_progresses')
      .update(updates).eq('id', existing.id).select().single();
    return mapCourseProgress(data);
  }

  // 新規作成
  const { data } = await sb().from('course_progresses').insert({
    user_id: userId, subject_id: subjectId, status,
    started_at: status !== 'not_started' ? now : null,
    completed_at: status === 'completed' ? now : null,
    updated_by: actingUserId,
  }).select().single();
  return mapCourseProgress(data);
}

/**
 * カリキュラム単位などで複数科目の進捗ステータスを一括更新する。
 * 既存の開始日は保持し、updated_by に担当者を記録する（引継ぎ追跡）。
 */
export async function bulkUpdateProgressStatus(
  userId: string, subjectIds: string[], status: ProgressStatus, actingUserId: string,
): Promise<void> {
  if (subjectIds.length === 0) return;
  const now = new Date().toISOString();
  const { data: existing } = await sb()
    .from('course_progresses').select('subject_id, started_at')
    .eq('user_id', userId).in('subject_id', subjectIds);
  const startedMap = new Map<string, string | null>(
    (existing || []).map(r => [r.subject_id as string, r.started_at as string | null]),
  );
  const rows = subjectIds.map(sid => {
    const prevStarted = startedMap.get(sid) ?? null;
    return {
      user_id: userId,
      subject_id: sid,
      status,
      started_at: status === 'not_started' ? null : (prevStarted ?? now),
      completed_at: status === 'completed' ? now : null,
      updated_by: actingUserId,
      updated_at: now,
    };
  });
  await sb().from('course_progresses').upsert(rows, { onConflict: 'user_id,subject_id' });
}

export async function updateProgressMemo(
  userId: string, subjectId: string, memo: string, actingUserId: string,
): Promise<CourseProgress> {
  const now = new Date().toISOString();
  const { data: existing } = await sb()
    .from('course_progresses').select('*')
    .eq('user_id', userId).eq('subject_id', subjectId).single();

  if (existing) {
    const { data } = await sb().from('course_progresses')
      .update({ memo: memo || null, updated_at: now, updated_by: actingUserId }).eq('id', existing.id).select().single();
    return mapCourseProgress(data);
  }

  const { data } = await sb().from('course_progresses').insert({
    user_id: userId, subject_id: subjectId, status: 'not_started', memo: memo || null,
    updated_by: actingUserId,
  }).select().single();
  return mapCourseProgress(data);
}

export async function updateProgressDates(
  userId: string, subjectId: string,
  startedAt: string | null, completedAt: string | null, actingUserId: string,
): Promise<CourseProgress> {
  const now = new Date().toISOString();
  const { data: existing } = await sb()
    .from('course_progresses').select('*')
    .eq('user_id', userId).eq('subject_id', subjectId).single();

  if (existing) {
    const { data } = await sb().from('course_progresses')
      .update({ started_at: startedAt, completed_at: completedAt, updated_at: now, updated_by: actingUserId })
      .eq('id', existing.id).select().single();
    return mapCourseProgress(data);
  }

  const status = completedAt ? 'completed' : startedAt ? 'in_progress' : 'not_started';
  const { data } = await sb().from('course_progresses').insert({
    user_id: userId, subject_id: subjectId, status,
    started_at: startedAt, completed_at: completedAt,
    updated_by: actingUserId,
  }).select().single();
  return mapCourseProgress(data);
}

export async function updateSubjectHours(subjectId: string, hours: number): Promise<boolean> {
  const { error } = await sb().from('subjects').update({ hours }).eq('id', subjectId);
  return !error;
}

// ============================================
// 認定の変更操作
// ============================================

export async function addCertification(
  learnerId: string, levelId: string, applicantId: string,
  reason: string, track: TrackCode | null,
) {
  const { data, error } = await sb().from('certifications').insert({
    learner_id: learnerId, level_id: levelId, track,
    applicant_id: applicantId, status: 'pending', reason,
  }).select().single();
  if (error) throw new Error('認定申請に失敗しました');
  return data;
}

/** 認定を承認 */
export async function approveCertification(certId: string, approverId: string) {
  const now = new Date().toISOString();
  // 認定を更新
  const { data: cert } = await sb().from('certifications')
    .update({ status: 'certified', approver_id: approverId, decided_at: now })
    .eq('id', certId).select().single();
  if (!cert) return;

  // 研修者のレベルを更新
  const { data: level } = await sb()
    .from('certification_levels').select('code').eq('id', cert.level_id).single();
  if (level) {
    await sb().from('users')
      .update({ current_level: level.code }).eq('id', cert.learner_id);
  }
}

/** 認定を差し戻し */
export async function rejectCertification(certId: string, approverId: string, rejectionReason: string) {
  const now = new Date().toISOString();
  await sb().from('certifications').update({
    status: 'rejected', approver_id: approverId,
    rejection_reason: rejectionReason, decided_at: now,
  }).eq('id', certId);
}

// ============================================
// 受講者の管理操作
// ============================================

export async function getAllOrganizations(): Promise<Organization[]> {
  const { data } = await sb().from('organizations').select('*');
  return (data || []).map(mapOrganization);
}

export async function getStores(): Promise<Organization[]> {
  const { data } = await sb().from('organizations').select('*').eq('type', 'store');
  return (data || []).map(mapOrganization);
}

export async function addLearner(data: {
  name: string; email: string; organizationId: string;
  tracks: TrackCode[]; hireDate: string | null;
}): Promise<User> {
  const { data: newUser, error } = await sb().from('users').insert({
    email: data.email, name: data.name, role: 'learner',
    organization_id: data.organizationId, current_level: 'lv0',
    tracks: data.tracks, hire_date: data.hireDate,
  }).select().single();
  if (error || !newUser) throw new Error('受講者の登録に失敗しました');
  return mapUser(newUser);
}

export async function updateLearner(id: string, data: {
  name: string; email: string; organizationId: string;
  tracks: TrackCode[]; hireDate: string | null;
}): Promise<User | null> {
  const { data: updated, error } = await sb().from('users').update({
    name: data.name, email: data.email,
    organization_id: data.organizationId,
    tracks: data.tracks, hire_date: data.hireDate,
  }).eq('id', id).select().single();
  if (error || !updated) return null;
  return mapUser(updated);
}

export async function deleteLearner(id: string): Promise<boolean> {
  const { error } = await sb().from('users').delete().eq('id', id).eq('role', 'learner');
  return !error;
}

// ============================================
// スタッフ管理操作
// ============================================

const STAFF_ROLES: UserRole[] = ['admin', 'education_manager', 'evaluator', 'store_manager'];

export async function getStaffList(): Promise<User[]> {
  const { data } = await sb().from('users').select('*').in('role', STAFF_ROLES);
  return (data || []).map(mapUser);
}

export async function addStaff(data: {
  name: string; email: string; role: UserRole;
  organizationId: string; hireDate: string | null;
}): Promise<User> {
  const { data: newUser, error } = await sb().from('users').insert({
    email: data.email, name: data.name, role: data.role,
    organization_id: data.organizationId, current_level: 'lv0',
    tracks: [], hire_date: data.hireDate,
  }).select().single();
  if (error || !newUser) throw new Error('スタッフの登録に失敗しました');
  return mapUser(newUser);
}

export async function deleteStaff(id: string): Promise<boolean> {
  const { error } = await sb().from('users').delete().eq('id', id);
  return !error;
}

export async function updateStaff(id: string, data: {
  name: string; email: string; role: UserRole;
  organizationId: string; hireDate: string | null;
}): Promise<User | null> {
  const { data: updated, error } = await sb().from('users').update({
    name: data.name, email: data.email, role: data.role,
    organization_id: data.organizationId, hire_date: data.hireDate,
  }).eq('id', id).select().single();
  if (error || !updated) return null;
  return mapUser(updated);
}

// ============================================
// カリキュラムマスタ管理操作
// ============================================

export async function getAllCurricula(): Promise<Curriculum[]> {
  const { data } = await sb().from('curricula').select('*').order('sort_order');
  return (data || []).map(mapCurriculum);
}

export async function getCurriculumById(id: string): Promise<Curriculum | undefined> {
  const { data } = await sb().from('curricula').select('*').eq('id', id).single();
  return data ? mapCurriculum(data) : undefined;
}

export async function getSubjectsByCurriculum(curriculumId: string): Promise<Subject[]> {
  const { data } = await sb().from('subjects').select('*')
    .eq('curriculum_id', curriculumId).order('sort_order');
  return (data || []).map(mapSubject);
}

export async function updateCurriculum(id: string, data: {
  name: string; description: string | null;
  type: 'common' | 'track' | 'brushup';
  trackCode: TrackCode | null; totalHours: number; isActive: boolean;
}): Promise<Curriculum | null> {
  const { data: updated, error } = await sb().from('curricula').update({
    name: data.name, description: data.description, type: data.type,
    track_code: data.trackCode, total_hours: data.totalHours, is_active: data.isActive,
  }).eq('id', id).select().single();
  if (error || !updated) return null;
  return mapCurriculum(updated);
}

export async function addCurriculum(data: {
  name: string; description: string | null;
  type: 'common' | 'track' | 'brushup';
  trackCode: TrackCode | null; totalHours: number;
}): Promise<Curriculum> {
  // 最大sort_orderを取得
  const { data: maxRow } = await sb().from('curricula')
    .select('sort_order').order('sort_order', { ascending: false }).limit(1).single();
  const maxOrder = maxRow?.sort_order || 0;

  const { data: newCur, error } = await sb().from('curricula').insert({
    name: data.name, description: data.description, type: data.type,
    track_code: data.trackCode, total_hours: data.totalHours,
    sort_order: maxOrder + 1, is_active: true,
  }).select().single();
  if (error || !newCur) throw new Error('カリキュラムの追加に失敗しました');
  return mapCurriculum(newCur);
}

export async function addSubject(data: {
  curriculumId: string; name: string;
  description: string | null; hours: number;
}): Promise<Subject> {
  const { data: maxRow } = await sb().from('subjects')
    .select('sort_order').eq('curriculum_id', data.curriculumId)
    .order('sort_order', { ascending: false }).limit(1).single();
  const maxOrder = maxRow?.sort_order || 0;

  const { data: newSub, error } = await sb().from('subjects').insert({
    curriculum_id: data.curriculumId, name: data.name,
    description: data.description, hours: data.hours,
    sort_order: maxOrder + 1, is_active: true,
  }).select().single();
  if (error || !newSub) throw new Error('科目の追加に失敗しました');
  return mapSubject(newSub);
}

export async function updateSubject(id: string, data: {
  name: string; description: string | null;
  hours: number; isActive: boolean;
}): Promise<Subject | null> {
  const { data: updated, error } = await sb().from('subjects').update({
    name: data.name, description: data.description,
    hours: data.hours, is_active: data.isActive,
  }).eq('id', id).select().single();
  if (error || !updated) return null;
  return mapSubject(updated);
}

export async function deleteSubject(id: string): Promise<boolean> {
  const { error } = await sb().from('subjects').delete().eq('id', id);
  return !error;
}

// ============================================
// 認証関連
// ============================================

/** Supabase Auth の UID をアプリの users テーブルに紐付ける */
export async function linkAuthUid(userId: string, authUid: string): Promise<boolean> {
  const { error } = await sb().from('users')
    .update({ auth_uid: authUid })
    .eq('id', userId);
  return !error;
}
