/**
 * LISENS - 定数定義
 * 
 * ELEMENT社内ライセンス制度に基づく定数を一元管理する。
 * ラベルやマッピングを変更する際はここだけ修正すればよい。
 */

import type { 
  UserRole, 
  ProgressStatus, 
  EvaluationStatus, 
  CertificationStatus, 
  CertificationLevelCode,
  EvaluationTemplate,
  EvaluationSectionCode,
  NGItem,
  TrackCode,
} from './types';

// ============================================
// ロール関連
// ============================================

/** ロール名の日本語ラベル */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: '本部管理者',
  education_manager: '教育責任者',
  evaluator: '評価者',
  store_manager: '店舗責任者',
  learner: 'トレーナー候補',
};

/** 各ロールがアクセスできるナビゲーション項目 */
export const ROLE_NAV_ACCESS: Record<UserRole, string[]> = {
  admin: ['home', 'learners', 'certifications', 'curriculum', 'staff'],
  education_manager: ['home', 'learners', 'certifications', 'curriculum'],
  evaluator: ['home', 'learners', 'certifications'],
  store_manager: ['home', 'learners', 'certifications'],
  learner: ['home', 'my_chart', 'certifications'],
};

/** 評価入力が可能なロール */
export const CAN_EVALUATE_ROLES: UserRole[] = ['admin', 'education_manager', 'evaluator'];

/** 認定を承認できるロール */
export const CAN_APPROVE_CERTIFICATION_ROLES: UserRole[] = ['admin', 'education_manager'];

/** 認定を申請できるロール */
export const CAN_APPLY_CERTIFICATION_ROLES: UserRole[] = ['admin', 'education_manager', 'evaluator'];

// ============================================
// トラック関連
// ============================================

/** トラック名の日本語ラベル */
export const TRACK_LABELS: Record<TrackCode, string> = {
  weight: 'ウェイト',
  pilates: 'ピラティス',
  stretch: 'ストレッチ',
};

/** トラックの略称 */
export const TRACK_SHORT_LABELS: Record<TrackCode, string> = {
  weight: 'W',
  pilates: 'P',
  stretch: 'S',
};

/** トラックのバッジクラス */
export const TRACK_BADGE_CLASS: Record<TrackCode, string> = {
  weight: 'badge-info',
  pilates: 'badge-primary',
  stretch: 'badge-success',
};

// ============================================
// 進捗ステータス
// ============================================

export const PROGRESS_STATUS_LABELS: Record<ProgressStatus, string> = {
  not_started: '未着手',
  in_progress: '受講中',
  completed: '完了',
};

export const PROGRESS_STATUS_BADGE_CLASS: Record<ProgressStatus, string> = {
  not_started: 'badge-muted',
  in_progress: 'badge-info',
  completed: 'badge-success',
};

// ============================================
// 評価ステータス
// ============================================

export const EVALUATION_STATUS_LABELS: Record<EvaluationStatus, string> = {
  draft: '下書き',
  submitted: '提出済み',
  reviewed: 'レビュー済み',
  finalized: '確定',
  returned: '差し戻し',
};

export const EVALUATION_STATUS_BADGE_CLASS: Record<EvaluationStatus, string> = {
  draft: 'badge-muted',
  submitted: 'badge-info',
  reviewed: 'badge-primary',
  finalized: 'badge-success',
  returned: 'badge-danger',
};

// ============================================
// 認定ステータス
// ============================================

export const CERTIFICATION_STATUS_LABELS: Record<CertificationStatus, string> = {
  pending: '申請中',
  certified: '承認済み',
  rejected: '差し戻し',
};

export const CERTIFICATION_STATUS_BADGE_CLASS: Record<CertificationStatus, string> = {
  pending: 'badge-warning',
  certified: 'badge-success',
  rejected: 'badge-danger',
};

// ============================================
// 認定レベル
// ============================================

export const LEVEL_LABELS: Record<CertificationLevelCode, string> = {
  lv0: '未認定',
  lv1: 'Lv1 提供可能',
  lv2: 'Lv2 Standard',
  lv3: 'Lv3 Specialist',
  lv4: 'Lv4 Instructor',
  lv5: 'Lv5 Master',
};

export const LEVEL_BADGE_CLASS: Record<CertificationLevelCode, string> = {
  lv0: 'badge-muted',
  lv1: 'badge-success',
  lv2: 'badge-info',
  lv3: 'badge-primary',
  lv4: 'badge-warning',
  lv5: 'badge-danger',
};

/** レベルの順序（次のレベルの判定に使用） */
export const LEVEL_ORDER: CertificationLevelCode[] = [
  'lv0',
  'lv1',
  'lv2',
  'lv3',
  'lv4',
  'lv5',
];

// ============================================
// OSCE評価セクション
// ============================================

/** セクションのラベル */
export const SECTION_LABELS: Record<EvaluationSectionCode, string> = {
  C: 'カウンセリング',
  E: '評価（姿勢・ROM）',
  P: 'プログラム設計',
  T: 'トレーニング提供',
  S: 'クロージング',
  EN: '環境整備・クリーンネス',
};

/** セクションのアイコン */
export const SECTION_ICONS: Record<EvaluationSectionCode, string> = {
  C: '🗣️',
  E: '🔍',
  P: '🧩',
  T: '💪',
  S: '🤝',
  EN: '🧹',
};

/** セクションの配点サマリー */
export const SECTION_MAX_SCORES: Record<EvaluationSectionCode, number> = {
  C: 25,  // 5点×5項目
  E: 15,  // 5点×3項目
  P: 15,  // 5点×3項目
  T: 15,  // 5点×3項目
  S: 10,  // 5点×2項目
  EN: 6,  // 3点×2項目
};

// ============================================
// OSCE評価テンプレート（16項目）
// ============================================

export const EVALUATION_TEMPLATES: EvaluationTemplate[] = [
  // C: カウンセリング（25点）
  { name: 'C1', label: 'ラポール形成・導入', description: '第一印象・アイスブレイク・緊張緩和・安心感の醸成', section: 'C', maxScore: 5 },
  { name: 'C2', label: '目標設定', description: 'SMART基準に沿った目標の具体化、顧客との合意形成', section: 'C', maxScore: 5 },
  { name: 'C3', label: 'リスクスクリーニング', description: '禁忌確認・通院/服薬/既往症/痛みの有無の確認', section: 'C', maxScore: 5 },
  { name: 'C4', label: 'インフォームドコンセント', description: '本日の流れ説明・高負荷種目実施の事前同意取得', section: 'C', maxScore: 5 },
  { name: 'C5', label: 'アウトカム合意・期待値調整', description: '本日の到達点の合意・長期目標との接続・不安の確認', section: 'C', maxScore: 5 },
  // E: 評価（15点）
  { name: 'E1', label: '静的姿勢観察', description: '矢状面・前額面2方向からの観察・アライメント逸脱の言語化', section: 'E', maxScore: 5 },
  { name: 'E2', label: 'ROMテスト', description: '2種目以上の動作テスト実施・可動域制限/代償動作の観察', section: 'E', maxScore: 5 },
  { name: 'E3', label: '評価FBとプログラム方針への反映', description: '評価結果をプログラム設計に接続・根拠/仮説/方針の説明', section: 'E', maxScore: 5 },
  // P: プログラム設計（15点）
  { name: 'P1', label: '目標・手段の連動性', description: '目標→狙い→手段の3段階の論理的接続', section: 'P', maxScore: 5 },
  { name: 'P2', label: '強度・量の根拠づけ', description: 'RPE/セット数/Rep数の設定根拠説明', section: 'P', maxScore: 5 },
  { name: 'P3', label: '代替案・修正オプション', description: '種目の代替案提示・想定リスクへの対応策', section: 'P', maxScore: 5 },
  // T: トレーニング提供（15点）
  { name: 'T1', label: 'セットアップ・安全確認', description: '器具のセッティング・ポジショニング説明・デモ実施', section: 'T', maxScore: 5 },
  { name: 'T2', label: '修正サイクル', description: 'エラー発見・短い修正キュー・再実施確認', section: 'T', maxScore: 5 },
  { name: 'T3', label: '負荷調整・プログレッション', description: 'RPE/顧客反応に基づく負荷の調整・成功体験の設計', section: 'T', maxScore: 5 },
  // S: クロージング（10点）
  { name: 'S1', label: 'セッションサマリー・FB', description: '本日の要点まとめ・変化確認・気づき引き出し', section: 'S', maxScore: 5 },
  { name: 'S2', label: 'ホームプログラム・次回提案', description: '宿題の具体的提示（運動/生活/栄養）・次回予告', section: 'S', maxScore: 5 },
  // EN: 環境整備（6点）
  { name: 'EN1', label: 'セッション環境', description: '器具配置・安全確認・室温適正・清潔度の確保', section: 'EN', maxScore: 3 },
  { name: 'EN2', label: '身だしなみ・衛生管理', description: '清潔感・専門的外観・手指衛生・器具の消毒', section: 'EN', maxScore: 3 },
];

// ============================================
// 即NG項目
// ============================================

export const NG_ITEMS: NGItem[] = [
  // 共通NG（NG1-NG7）
  { code: 'NG1', label: '禁忌スクリーニングを省略', description: 'カウンセリング時に禁忌・リスク確認を実施しないまま運動を開始', stretchOnly: false },
  { code: 'NG2', label: 'フォームを無視して継続', description: '明らかなフォーム崩壊・危険な姿勢を放置したまま継続', stretchOnly: false },
  { code: 'NG3', label: '同意なしに高リスク種目を実施', description: '説明・同意取得なしに高負荷種目・手技補助を実施', stretchOnly: false },
  { code: 'NG4', label: '体調不良を無視', description: '顧客の痛み・めまい・疲労のサインを見落とし継続', stretchOnly: false },
  { code: 'NG5', label: '医療的診断に相当する発言', description: '医療行為に相当する診断・断言を行う', stretchOnly: false },
  { code: 'NG6', label: '器具・環境の安全確認を省略', description: '使用器具の点検・環境の安全確認を怠り危険な状態でセッション', stretchOnly: false },
  { code: 'NG7', label: '緊急時対応の準備を怠った', description: 'AED・緊急連絡先・緊急事態への備えがない', stretchOnly: false },
  // ストレッチ固有NG（SNG1-SNG5）
  { code: 'SNG1', label: '禁忌疾患に対してストレッチを強行', description: '禁忌疾患・症状に対してストレッチを実施', stretchOnly: true },
  { code: 'SNG2', label: '同意なしに手を当てる', description: 'インフォームドコンセント省略で手技を実施', stretchOnly: true },
  { code: 'SNG3', label: '過伸張を実施', description: '可動域終端を超えた強制伸張を実施', stretchOnly: true },
  { code: 'SNG4', label: 'ミドルシニアへの配慮不足', description: 'ミドルシニア特有リスクへの配慮なしに強いストレッチ実施', stretchOnly: true },
  { code: 'SNG5', label: '無秩序な施術提供', description: 'ストレッチ理論を無視した無秩序な施術提供', stretchOnly: true },
];

// ============================================
// 採点ガイド
// ============================================

/** 5点項目の採点基準 */
export const SCORE_GUIDE_5: { score: number; label: string; description: string }[] = [
  { score: 5, label: '完全達成', description: '評価観点をすべて満たし、顧客に合わせた柔軟な対応ができている' },
  { score: 3, label: 'おおむね達成', description: '主要な要素は実施されているが、一部不足・改善の余地あり' },
  { score: 1, label: '部分的達成', description: '実施はしたが、重要な要素が欠けているか質が不十分' },
  { score: 0, label: '未実施・重大な問題', description: '実施されていない、または安全上の問題あり' },
];

/** 3点項目（EN）の採点基準 */
export const SCORE_GUIDE_3: { score: number; label: string; description: string }[] = [
  { score: 3, label: '完全達成', description: '評価観点をすべて満たしている' },
  { score: 2, label: 'おおむね達成', description: '主要な要素は実施・一部不足あり' },
  { score: 1, label: '部分的達成', description: '実施したが不十分・改善が必要' },
  { score: 0, label: '未実施・重大な問題', description: '実施されていない、または重大な不備あり' },
];

/** OSCE合格基準 */
export const OSCE_TOTAL_SCORE = 86;
export const OSCE_PASS_SCORE = 61;
export const OSCE_PASS_RATE = 70;
