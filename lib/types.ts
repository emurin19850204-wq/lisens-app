/**
 * LISENS - 型定義
 * 
 * ELEMENT社内ライセンス制度に基づく型定義。
 * DBスキーマ設計に基づき、将来のSupabase移行を見据えた構造にしている。
 */

// ============================================
// ユーザー・組織 関連
// ============================================

/** ユーザーのロール定義 */
export type UserRole = 
  | 'admin'              // 本部管理者
  | 'education_manager'  // 教育責任者・QA担当
  | 'evaluator'          // 評価者（上位トレーナー）
  | 'store_manager'      // 店舗責任者
  | 'learner';           // トレーナー候補（受講者）

/** 組織の種別 */
export type OrganizationType = 'company' | 'department' | 'store';

/** 組織 */
export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** ユーザー */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  /** 現在の認定レベル */
  currentLevel: CertificationLevelCode;
  /** 受講トラック（受講者用） */
  tracks: TrackCode[];
  hireDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// トラック（専門コース）関連
// ============================================

/** トラックコード（ウェイト/ピラティス/ストレッチ） */
export type TrackCode = 'weight' | 'pilates' | 'stretch';

// ============================================
// カリキュラム・受講進捗 関連
// ============================================

/** カリキュラム */
export interface Curriculum {
  id: string;
  name: string;
  description: string | null;
  /** カリキュラム種別: 共通 or トラック専門 or ブラッシュアップ */
  type: 'common' | 'track' | 'brushup';
  /** トラック専門の場合のトラックコード */
  trackCode: TrackCode | null;
  /** 合計時間（h） */
  totalHours: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 科目（コマ） */
export interface Subject {
  id: string;
  curriculumId: string;
  name: string;
  description: string | null;
  /** 所要時間（h） */
  hours: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 受講進捗のステータス */
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

/** 受講進捗 */
export interface CourseProgress {
  id: string;
  userId: string;
  subjectId: string;
  status: ProgressStatus;
  startedAt: string | null;
  completedAt: string | null;
  /** 引継ぎメモ（担当者間の申し送り事項） */
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// 実技評価（OSCE）関連
// ============================================

/**
 * 実技評価のステータス
 * draft:      下書き（評価者が入力中）
 * submitted:  提出済み（確認待ち）
 * reviewed:   レビュー済み（上長等が確認）
 * finalized:  確定（最終決定）
 * returned:   差し戻し（再評価が必要）
 */
export type EvaluationStatus = 
  | 'draft' 
  | 'submitted' 
  | 'reviewed' 
  | 'finalized' 
  | 'returned';

/** 評価セクションコード */
export type EvaluationSectionCode = 'C' | 'E' | 'P' | 'T' | 'S' | 'EN';

/** 評価項目名（OSCE 16項目） */
export type EvaluationItemName = 
  | 'C1' | 'C2' | 'C3' | 'C4' | 'C5'  // カウンセリング
  | 'E1' | 'E2' | 'E3'                  // 評価（姿勢・ROM）
  | 'P1' | 'P2' | 'P3'                  // プログラム設計
  | 'T1' | 'T2' | 'T3'                  // トレーニング提供
  | 'S1' | 'S2'                          // クロージング
  | 'EN1' | 'EN2';                       // 環境整備

/** 評価項目のテンプレート */
export interface EvaluationTemplate {
  /** 項目コード（C1, E1, etc.） */
  name: EvaluationItemName;
  /** 日本語ラベル */
  label: string;
  /** 評価観点の説明 */
  description: string;
  /** セクション */
  section: EvaluationSectionCode;
  /** 最大スコア（通常5、EN項目は3） */
  maxScore: number;
}

/** 即NG項目 */
export interface NGItem {
  code: string;
  label: string;
  description: string;
  /** ストレッチトラック固有かどうか */
  stretchOnly: boolean;
}

/** OSCE実技評価 */
export interface Evaluation {
  id: string;
  learnerId: string;
  evaluatorId: string;
  /** 受験トラック */
  track: TrackCode;
  status: EvaluationStatus;
  /** 合計スコア */
  totalScore: number;
  /** 合格基準の達成（61点以上 & NG0件） */
  passed: boolean;
  /** 即NG判定の記録 */
  ngItems: string[];
  overallComment: string | null;
  /** 良かった点（フィードバック） */
  goodPoints: string[];
  /** 改善点（フィードバック） */
  improvementPoints: string[];
  evaluatedAt: string;
  createdAt: string;
  updatedAt: string;
}

/** 評価項目の詳細（実際の記録） */
export interface EvaluationItem {
  id: string;
  evaluationId: string;
  itemName: EvaluationItemName;
  /** スコア（C/E/P/T/S: 0/1/3/5、EN: 0/1/2/3） */
  score: number;
  comment: string | null;
  createdAt: string;
}

// ============================================
// レベル認定 関連
// ============================================

/** 認定レベルのコード */
export type CertificationLevelCode = 
  | 'lv0'   // 入社時（未認定）
  | 'lv1'   // 提供可能トレーナー
  | 'lv2'   // Standard Provider
  | 'lv3'   // Specialist
  | 'lv4'   // Instructor/Standardizer
  | 'lv5';  // Master/QA責任者

/** 認定レベルマスター */
export interface CertificationLevel {
  id: string;
  code: CertificationLevelCode;
  name: string;
  sortOrder: number;
  description: string | null;
  /** 認定条件の概要 */
  requirements: string | null;
}

/**
 * 認定のステータス
 * pending:   申請中（承認待ち）
 * certified: 承認済み（認定確定）
 * rejected:  差し戻し（再申請可能）
 */
export type CertificationStatus = 'pending' | 'certified' | 'rejected';

/** レベル認定 */
export interface Certification {
  id: string;
  learnerId: string;
  levelId: string;
  /** 認定対象トラック（Lv1はトラック別認定） */
  track: TrackCode | null;
  applicantId: string;
  approverId: string | null;
  status: CertificationStatus;
  reason: string | null;
  rejectionReason: string | null;
  appliedAt: string;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// 表示用の結合型（UIで使うリレーション解決済みの型）
// ============================================

/** 受講者一覧に表示するためのサマリー情報 */
export interface LearnerSummary {
  user: User;
  organization: Organization;
  /** 全カリキュラムの総合進捗率（0〜100） */
  overallProgress: number;
  /** 直近の評価日 */
  lastEvaluationDate: string | null;
  /** 現在のレベル名 */
  currentLevelName: string;
}

/** 受講者詳細（個人カルテ）に必要な全情報 */
export interface LearnerDetail {
  user: User;
  organization: Organization;
  /** カリキュラム別の進捗情報 */
  curriculumProgresses: CurriculumProgress[];
  /** 評価履歴（新しい順） */
  evaluations: EvaluationWithDetails[];
  /** 認定履歴 */
  certifications: CertificationWithDetails[];
  /** 現在のレベル */
  currentLevel: CertificationLevel;
}

/** カリキュラム別の進捗 */
export interface CurriculumProgress {
  curriculum: Curriculum;
  subjects: SubjectProgress[];
  /** カリキュラム内の進捗率（0〜100） */
  progressRate: number;
}

/** 科目ごとの進捗 */
export interface SubjectProgress {
  subject: Subject;
  progress: CourseProgress | null;
}

/** 評価＋関連情報 */
export interface EvaluationWithDetails {
  evaluation: Evaluation;
  evaluator: User;
  items: EvaluationItem[];
  /** 合計スコア */
  totalScore: number;
  /** 得点率（%） */
  scoreRate: number;
}

/** 認定＋関連情報 */
export interface CertificationWithDetails {
  certification: Certification;
  level: CertificationLevel;
  applicant: User;
  approver: User | null;
  learner: User;
}

// ============================================
// 認証関連
// ============================================

/** 認証コンテキストの型 */
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void | Promise<void>;
}
