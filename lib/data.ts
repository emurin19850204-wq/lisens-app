/**
 * LISENS - データアクセス層
 * 
 * ダミーデータからUIに必要な形式のデータを取得するユーティリティ。
 * 将来はSupabase clientに差し替える。
 */

import type {
  User, UserRole, Organization, LearnerSummary, LearnerDetail,
  CurriculumProgress, SubjectProgress, EvaluationWithDetails,
  CertificationWithDetails, CertificationLevel, Evaluation,
  EvaluationItem, EvaluationItemName, TrackCode,
} from './types';
import {
  users, organizations, curricula, subjects, courseProgresses,
  evaluations, evaluationItems, certificationLevels, certifications,
} from './dummy-data';
import { LEVEL_LABELS, OSCE_TOTAL_SCORE } from './constants';

// ============================================
// ユーザー・組織の取得
// ============================================

export function getUserById(id: string): User | undefined {
  return users.find(u => u.id === id);
}

export function getOrganizationById(id: string): Organization | undefined {
  return organizations.find(o => o.id === id);
}

export function getLearners(): User[] {
  return users.filter(u => u.role === 'learner');
}

export function getLearnersForRole(currentUser: User): User[] {
  const allLearners = getLearners();
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

export function getLearnerSummary(userId: string): LearnerSummary | undefined {
  const user = getUserById(userId);
  if (!user) return undefined;
  const org = getOrganizationById(user.organizationId);
  if (!org) return undefined;

  const progresses = courseProgresses.filter(p => p.userId === userId);
  const totalSubjects = progresses.length;
  const completedSubjects = progresses.filter(p => p.status === 'completed').length;
  const overallProgress = totalSubjects > 0 ? Math.round((completedSubjects / totalSubjects) * 100) : 0;

  const userEvals = evaluations.filter(e => e.learnerId === userId);
  const lastEval = userEvals.sort((a, b) =>
    new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime()
  )[0];

  return {
    user, organization: org, overallProgress,
    lastEvaluationDate: lastEval?.evaluatedAt || null,
    currentLevelName: LEVEL_LABELS[user.currentLevel],
  };
}

export function getLearnerSummaries(currentUser: User): LearnerSummary[] {
  return getLearnersForRole(currentUser)
    .map(l => getLearnerSummary(l.id))
    .filter((s): s is LearnerSummary => s !== undefined);
}

// ============================================
// 受講者詳細（個人カルテ）
// ============================================

export function getLearnerDetail(userId: string): LearnerDetail | undefined {
  const user = getUserById(userId);
  if (!user) return undefined;
  const org = getOrganizationById(user.organizationId);
  if (!org) return undefined;
  const currentLevel = certificationLevels.find(l => l.code === user.currentLevel);
  if (!currentLevel) return undefined;

  return {
    user, organization: org,
    curriculumProgresses: getCurriculumProgresses(userId),
    evaluations: getEvaluationsWithDetails(userId),
    certifications: getCertificationsForLearner(userId),
    currentLevel,
  };
}

function getCurriculumProgresses(userId: string): CurriculumProgress[] {
  return curricula.map(cur => {
    const curSubjects = subjects.filter(s => s.curriculumId === cur.id);
    const subjectProgresses: SubjectProgress[] = curSubjects.map(sub => {
      const progress = courseProgresses.find(
        p => p.userId === userId && p.subjectId === sub.id
      ) || null;
      return { subject: sub, progress };
    });
    const total = subjectProgresses.length;
    const completed = subjectProgresses.filter(sp => sp.progress?.status === 'completed').length;
    const progressRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { curriculum: cur, subjects: subjectProgresses, progressRate };
  });
}

// ============================================
// 評価関連
// ============================================

export function getEvaluationsWithDetails(userId: string): EvaluationWithDetails[] {
  return evaluations
    .filter(e => e.learnerId === userId)
    .map(evaluation => {
      const evaluator = getUserById(evaluation.evaluatorId);
      if (!evaluator) return null;
      const items = evaluationItems.filter(ei => ei.evaluationId === evaluation.id);
      const totalScore = items.reduce((sum, item) => sum + item.score, 0);
      const scoreRate = Math.round((totalScore / OSCE_TOTAL_SCORE) * 100);
      return { evaluation, evaluator, items, totalScore, scoreRate };
    })
    .filter((e): e is EvaluationWithDetails => e !== null)
    .sort((a, b) =>
      new Date(b.evaluation.evaluatedAt).getTime() - new Date(a.evaluation.evaluatedAt).getTime()
    );
}

export function getAllEvaluations(): EvaluationWithDetails[] {
  return evaluations
    .map(evaluation => {
      const evaluator = getUserById(evaluation.evaluatorId);
      if (!evaluator) return null;
      const items = evaluationItems.filter(ei => ei.evaluationId === evaluation.id);
      const totalScore = items.reduce((sum, item) => sum + item.score, 0);
      const scoreRate = Math.round((totalScore / OSCE_TOTAL_SCORE) * 100);
      return { evaluation, evaluator, items, totalScore, scoreRate };
    })
    .filter((e): e is EvaluationWithDetails => e !== null)
    .sort((a, b) =>
      new Date(b.evaluation.evaluatedAt).getTime() - new Date(a.evaluation.evaluatedAt).getTime()
    );
}

// ============================================
// 認定関連
// ============================================

export function getCertificationsForLearner(learnerId: string): CertificationWithDetails[] {
  return certifications
    .filter(c => c.learnerId === learnerId)
    .map(cert => buildCertificationWithDetails(cert))
    .filter((c): c is CertificationWithDetails => c !== null)
    .sort((a, b) =>
      new Date(b.certification.appliedAt).getTime() - new Date(a.certification.appliedAt).getTime()
    );
}

export function getAllCertifications(): CertificationWithDetails[] {
  return certifications
    .map(cert => buildCertificationWithDetails(cert))
    .filter((c): c is CertificationWithDetails => c !== null)
    .sort((a, b) =>
      new Date(b.certification.appliedAt).getTime() - new Date(a.certification.appliedAt).getTime()
    );
}

export function getCertificationById(id: string): CertificationWithDetails | null {
  const cert = certifications.find(c => c.id === id);
  if (!cert) return null;
  return buildCertificationWithDetails(cert);
}

function buildCertificationWithDetails(cert: typeof certifications[0]): CertificationWithDetails | null {
  const level = certificationLevels.find(l => l.id === cert.levelId);
  const applicant = getUserById(cert.applicantId);
  const learner = getUserById(cert.learnerId);
  if (!level || !applicant || !learner) return null;
  const approver = cert.approverId ? getUserById(cert.approverId) || null : null;
  return { certification: cert, level, applicant, approver, learner };
}

export function getCertificationLevels(): CertificationLevel[] {
  return certificationLevels;
}

// ============================================
// 統計・ダッシュボード
// ============================================

export function getDashboardStats() {
  const allLearners = getLearners();
  const pendingCerts = certifications.filter(c => c.status === 'pending');
  const recentEvals = evaluations.filter(e => {
    const evalDate = new Date(e.evaluatedAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return evalDate >= thirtyDaysAgo;
  });

  return {
    totalLearners: allLearners.length,
    pendingCertifications: pendingCerts.length,
    recentEvaluations: recentEvals.length,
    totalCurricula: curricula.length,
  };
}

// ============================================
// データ変更操作（MVPインメモリ）
// ============================================

export function addEvaluation(
  learnerId: string,
  evaluatorId: string,
  track: TrackCode,
  overallComment: string,
  ngItemCodes: string[],
  items: { itemName: EvaluationItemName; score: number; comment: string }[],
  goodPoints: string[],
  improvementPoints: string[],
): Evaluation {
  const now = new Date().toISOString();
  const totalScore = items.reduce((sum, item) => sum + item.score, 0);
  const passed = totalScore >= 61 && ngItemCodes.length === 0;

  const newEval: Evaluation = {
    id: `eval-${Date.now()}`, learnerId, evaluatorId, track,
    status: 'submitted', totalScore, passed, ngItems: ngItemCodes,
    overallComment, goodPoints, improvementPoints,
    evaluatedAt: now, createdAt: now, updatedAt: now,
  };
  evaluations.push(newEval);

  items.forEach((item, index) => {
    const newItem: EvaluationItem = {
      id: `ei-new-${Date.now()}-${index}`, evaluationId: newEval.id,
      itemName: item.itemName, score: item.score,
      comment: item.comment || null, createdAt: now,
    };
    evaluationItems.push(newItem);
  });

  return newEval;
}

// ============================================
// 科目の取得
// ============================================

export function getAllSubjects() { return subjects; }

// ============================================
// 認定の変更操作
// ============================================

export function addCertification(
  learnerId: string,
  levelId: string,
  applicantId: string,
  reason: string,
  track: TrackCode | null,
): typeof certifications[0] {
  const now = new Date().toISOString();
  const newCert = {
    id: `cert-${Date.now()}`, learnerId, levelId, track,
    applicantId, approverId: null, status: 'pending' as const,
    reason, rejectionReason: null,
    appliedAt: now, decidedAt: null, createdAt: now, updatedAt: now,
  };
  certifications.push(newCert);
  return newCert;
}

// ============================================
// 受講者の管理操作（MVPインメモリ）
// ============================================

/** 全組織を取得 */
export function getAllOrganizations() {
  return organizations;
}

/** 店舗一覧を取得 */
export function getStores() {
  return organizations.filter(o => o.type === 'store');
}

/** 新しい受講者を追加 */
export function addLearner(data: {
  name: string;
  email: string;
  organizationId: string;
  tracks: TrackCode[];
  hireDate: string | null;
}): User {
  const now = new Date().toISOString();
  const newUser: User = {
    id: `user-${Date.now()}`,
    email: data.email,
    name: data.name,
    role: 'learner',
    organizationId: data.organizationId,
    currentLevel: 'lv0',
    tracks: data.tracks,
    hireDate: data.hireDate,
    createdAt: now,
    updatedAt: now,
  };
  users.push(newUser);
  return newUser;
}

/** 受講者情報を更新 */
export function updateLearner(id: string, data: {
  name: string;
  email: string;
  organizationId: string;
  tracks: TrackCode[];
  hireDate: string | null;
}): User | null {
  const user = users.find(u => u.id === id);
  if (!user || user.role !== 'learner') return null;
  user.name = data.name;
  user.email = data.email;
  user.organizationId = data.organizationId;
  user.tracks = data.tracks;
  user.hireDate = data.hireDate;
  user.updatedAt = new Date().toISOString();
  return user;
}

/** 受講者を削除 */
export function deleteLearner(id: string): boolean {
  const index = users.findIndex(u => u.id === id && u.role === 'learner');
  if (index === -1) return false;
  users.splice(index, 1);
  return true;
}

// ============================================
// スタッフ（管理者系ロール）管理操作
// ============================================

/** スタッフロール一覧 */
const STAFF_ROLES: UserRole[] = ['admin', 'education_manager', 'evaluator', 'store_manager'];

/** スタッフ一覧を取得 */
export function getStaffList(): User[] {
  return users.filter(u => STAFF_ROLES.includes(u.role));
}

/** 新しいスタッフを追加 */
export function addStaff(data: {
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  hireDate: string | null;
}): User {
  const now = new Date().toISOString();
  const newUser: User = {
    id: `user-${Date.now()}`,
    email: data.email,
    name: data.name,
    role: data.role,
    organizationId: data.organizationId,
    currentLevel: 'lv0',
    tracks: [],
    hireDate: data.hireDate,
    createdAt: now,
    updatedAt: now,
  };
  users.push(newUser);
  return newUser;
}

/** スタッフを削除 */
export function deleteStaff(id: string): boolean {
  const index = users.findIndex(u => u.id === id && STAFF_ROLES.includes(u.role));
  if (index === -1) return false;
  users.splice(index, 1);
  return true;
}

/** スタッフ情報を更新 */
export function updateStaff(id: string, data: {
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  hireDate: string | null;
}): User | null {
  const user = users.find(u => u.id === id && STAFF_ROLES.includes(u.role));
  if (!user) return null;
  user.name = data.name;
  user.email = data.email;
  user.role = data.role;
  user.organizationId = data.organizationId;
  user.hireDate = data.hireDate;
  user.updatedAt = new Date().toISOString();
  return user;
}

// ============================================
// カリキュラムマスタ管理操作
// ============================================

import type { Curriculum, Subject } from './types';

/** 全カリキュラム一覧を取得（ソート順） */
export function getAllCurricula(): Curriculum[] {
  return [...curricula].sort((a, b) => a.sortOrder - b.sortOrder);
}

/** カリキュラムIDでカリキュラムを取得 */
export function getCurriculumById(id: string): Curriculum | undefined {
  return curricula.find(c => c.id === id);
}

/** カリキュラムに紐づく科目一覧を取得（ソート順） */
export function getSubjectsByCurriculum(curriculumId: string): Subject[] {
  return subjects.filter(s => s.curriculumId === curriculumId).sort((a, b) => a.sortOrder - b.sortOrder);
}

/** カリキュラムを更新 */
export function updateCurriculum(id: string, data: {
  name: string;
  description: string | null;
  type: 'common' | 'track' | 'brushup';
  trackCode: TrackCode | null;
  totalHours: number;
  isActive: boolean;
}): Curriculum | null {
  const cur = curricula.find(c => c.id === id);
  if (!cur) return null;
  cur.name = data.name;
  cur.description = data.description;
  cur.type = data.type;
  cur.trackCode = data.trackCode;
  cur.totalHours = data.totalHours;
  cur.isActive = data.isActive;
  cur.updatedAt = new Date().toISOString();
  return cur;
}

/** 新しいカリキュラムを追加 */
export function addCurriculum(data: {
  name: string;
  description: string | null;
  type: 'common' | 'track' | 'brushup';
  trackCode: TrackCode | null;
  totalHours: number;
}): Curriculum {
  const now = new Date().toISOString();
  const maxOrder = curricula.reduce((max, c) => Math.max(max, c.sortOrder), 0);
  const newCur: Curriculum = {
    id: `cur-${Date.now()}`,
    name: data.name,
    description: data.description,
    type: data.type,
    trackCode: data.trackCode,
    totalHours: data.totalHours,
    sortOrder: maxOrder + 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  curricula.push(newCur);
  return newCur;
}

/** 科目を追加 */
export function addSubject(data: {
  curriculumId: string;
  name: string;
  description: string | null;
  hours: number;
}): Subject {
  const now = new Date().toISOString();
  const curSubjects = subjects.filter(s => s.curriculumId === data.curriculumId);
  const maxOrder = curSubjects.reduce((max, s) => Math.max(max, s.sortOrder), 0);
  const newSubject: Subject = {
    id: `sub-${Date.now()}`,
    curriculumId: data.curriculumId,
    name: data.name,
    description: data.description,
    hours: data.hours,
    sortOrder: maxOrder + 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  subjects.push(newSubject);
  return newSubject;
}

/** 科目を更新 */
export function updateSubject(id: string, data: {
  name: string;
  description: string | null;
  hours: number;
  isActive: boolean;
}): Subject | null {
  const sub = subjects.find(s => s.id === id);
  if (!sub) return null;
  sub.name = data.name;
  sub.description = data.description;
  sub.hours = data.hours;
  sub.isActive = data.isActive;
  sub.updatedAt = new Date().toISOString();
  return sub;
}

/** 科目を削除 */
export function deleteSubject(id: string): boolean {
  const index = subjects.findIndex(s => s.id === id);
  if (index === -1) return false;
  subjects.splice(index, 1);
  return true;
}

