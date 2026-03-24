/**
 * LISENS - ダミーデータ（ELEMENT社内ライセンス制度）
 * 
 * 組織: ELEMENT + 本部 + 3店舗
 * ユーザー: 7名（各ロール + トレーナー候補3名）
 * カリキュラム: 共通コア + ウェイト + ピラティス + ストレッチ + ブラッシュアップ
 * 評価: OSCE形式（86点満点）
 * 認定: Lv0〜Lv5
 */

import type {
  Organization, User, Curriculum, Subject, CourseProgress,
  Evaluation, EvaluationItem, CertificationLevel, Certification,
} from './types';

// ============================================
// 組織データ
// ============================================
export const organizations: Organization[] = [
  { id: 'org-company', name: 'ELEMENT', type: 'company', parentId: null, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'org-hq', name: '本部', type: 'department', parentId: 'org-company', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'org-shibuya', name: '渋谷店', type: 'store', parentId: 'org-company', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'org-shinjuku', name: '新宿店', type: 'store', parentId: 'org-company', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'org-ikebukuro', name: '池袋店', type: 'store', parentId: 'org-company', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

// ============================================
// ユーザーデータ（パスワード: password123）
// ============================================
export const users: User[] = [
  { id: 'user-admin', email: 'admin@element.com', name: '管理太郎', role: 'admin', organizationId: 'org-hq', currentLevel: 'lv5', tracks: [], hireDate: '2020-04-01', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'user-edu', email: 'edu@element.com', name: '教育花子', role: 'education_manager', organizationId: 'org-hq', currentLevel: 'lv5', tracks: [], hireDate: '2021-04-01', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'user-eval', email: 'eval@element.com', name: '鈴木一郎', role: 'evaluator', organizationId: 'org-hq', currentLevel: 'lv4', tracks: ['weight', 'pilates'], hireDate: '2021-10-01', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'user-store', email: 'store@element.com', name: '佐藤次郎', role: 'store_manager', organizationId: 'org-shibuya', currentLevel: 'lv3', tracks: ['weight'], hireDate: '2022-04-01', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'user-learner1', email: 'learner1@element.com', name: '山田太郎', role: 'learner', organizationId: 'org-shibuya', currentLevel: 'lv0', tracks: ['weight', 'pilates', 'stretch'], hireDate: '2024-04-01', createdAt: '2024-04-01T00:00:00Z', updatedAt: '2024-04-01T00:00:00Z' },
  { id: 'user-learner2', email: 'learner2@element.com', name: '田中美咲', role: 'learner', organizationId: 'org-shinjuku', currentLevel: 'lv1', tracks: ['weight', 'pilates'], hireDate: '2024-02-01', createdAt: '2024-02-01T00:00:00Z', updatedAt: '2024-02-01T00:00:00Z' },
  { id: 'user-learner3', email: 'learner3@element.com', name: '高橋健太', role: 'learner', organizationId: 'org-ikebukuro', currentLevel: 'lv0', tracks: ['weight', 'stretch'], hireDate: '2024-07-01', createdAt: '2024-07-01T00:00:00Z', updatedAt: '2024-07-01T00:00:00Z' },
];

// ============================================
// カリキュラムデータ
// ============================================
export const curricula: Curriculum[] = [
  { id: 'cur-common', name: '共通コア', description: 'カウンセリング→評価→提案の基礎（全トラック共通）', type: 'common', trackCode: null, totalHours: 16, sortOrder: 1, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cur-weight', name: 'ウェイト専門', description: 'ELEMENT ウェイトトレーニング哲学を体現し、3段階構成で安全に指導', type: 'track', trackCode: 'weight', totalHours: 24, sortOrder: 2, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cur-pilates', name: 'ピラティス専門', description: '基本エクササイズを安全に見て直し、初心者向けフローを設計・実施', type: 'track', trackCode: 'pilates', totalHours: 24, sortOrder: 3, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cur-stretch', name: 'ストレッチ専門', description: '基本ストレッチを安全に実施し、プログラムを設計', type: 'track', trackCode: 'stretch', totalHours: 24, sortOrder: 4, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'cur-brushup', name: 'ブラッシュアップ研修', description: 'Lv1取得後2〜6ヶ月、応用評価・50分セッション設計・継続支援', type: 'brushup', trackCode: null, totalHours: 16, sortOrder: 5, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

// ============================================
// 科目データ（コマ）
// ============================================
const ts = '2024-01-01T00:00:00Z';
export const subjects: Subject[] = [
  // 共通コア 8コマ/16h
  { id: 'sub-co1', curriculumId: 'cur-common', name: 'セッションの型（全体構造）', description: '初回カウンセリング→評価→提案→実施→振り返りの流れ理解', hours: 1, sortOrder: 1, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-co2', curriculumId: 'cur-common', name: '安全管理・禁忌スクリーニング', description: '中止判断、リスク管理、医療連携の基本', hours: 1, sortOrder: 2, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-co3', curriculumId: 'cur-common', name: 'カウンセリングの基本', description: '目的整理、ライフスタイル確認、合意形成', hours: 3, sortOrder: 3, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-co4', curriculumId: 'cur-common', name: '根拠づけ評価の基本', description: '主訴→客観的情報→評価→仮説→方針、姿勢評価・ROM', hours: 4, sortOrder: 4, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-co5', curriculumId: 'cur-common', name: 'プログラム設計の基本', description: '目標→狙い→手段の論理、当日構成', hours: 2, sortOrder: 5, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-co6', curriculumId: 'cur-common', name: 'キューイング・修正の基本', description: '短い説明、観察→修正→再実施のサイクル', hours: 2, sortOrder: 6, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-co7', curriculumId: 'cur-common', name: 'クロージング・次回提案', description: '要点まとめ、宿題設定、継続提案', hours: 1, sortOrder: 7, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-co8', curriculumId: 'cur-common', name: '栄養サポート Lv1', description: 'PFCバランス、基礎的な食事アドバイス', hours: 2, sortOrder: 8, isActive: true, createdAt: ts, updatedAt: ts },
  // ウェイト専門 12コマ/24h
  { id: 'sub-w1', curriculumId: 'cur-weight', name: 'ウェイトトレーニング概論', description: '6つの目的、神経適応、安全優先の3原則', hours: 2, sortOrder: 1, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-w2', curriculumId: 'cur-weight', name: '基本種目① 下半身', description: '5種目の安全指導・フォーム観察・修正', hours: 2, sortOrder: 2, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-w3', curriculumId: 'cur-weight', name: '基本種目② 胸', description: '4種目の安全指導', hours: 2, sortOrder: 3, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-w4', curriculumId: 'cur-weight', name: '基本種目③ 背中', description: '4種目の安全指導', hours: 2, sortOrder: 4, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-w5', curriculumId: 'cur-weight', name: '基本種目④ 肩・腕', description: '5種目の安全指導', hours: 2, sortOrder: 5, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-w6', curriculumId: 'cur-weight', name: '基本種目⑤ 自重・体幹', description: '7種目の安全指導', hours: 2, sortOrder: 6, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-w7', curriculumId: 'cur-weight', name: 'パーソナルストレッチ', description: '対象筋の選択、安全な補助', hours: 2, sortOrder: 7, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-w8', curriculumId: 'cur-weight', name: 'プログラム設計①（基礎）', description: '3段階構成でのフロー設計', hours: 2, sortOrder: 8, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-w9', curriculumId: 'cur-weight', name: 'プログラム設計②（応用）', description: '目的別フロー設計', hours: 2, sortOrder: 9, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-w10', curriculumId: 'cur-weight', name: 'OSCE反復①', description: '30分セッション模擬', hours: 2, sortOrder: 10, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-w11', curriculumId: 'cur-weight', name: 'OSCE反復②', description: 'FB反映・修正演習', hours: 2, sortOrder: 11, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-w12', curriculumId: 'cur-weight', name: '最終模擬認定', description: '本番形式・最終確認', hours: 2, sortOrder: 12, isActive: true, createdAt: ts, updatedAt: ts },
  // ピラティス専門 12コマ/24h
  { id: 'sub-p1', curriculumId: 'cur-pilates', name: 'ピラティス概論', description: 'ELEMENTピラティスの概念・不良姿勢・呼吸法', hours: 2, sortOrder: 1, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-p2', curriculumId: 'cur-pilates', name: 'マット基礎種目', description: '正しいセットアップ、骨盤・体幹のエラー観察', hours: 1.5, sortOrder: 2, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-p3', curriculumId: 'cur-pilates', name: 'リフォーマー基礎 コア', description: '正しいセットアップ、骨盤・体幹のエラー観察', hours: 2, sortOrder: 3, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-p4', curriculumId: 'cur-pilates', name: 'リフォーマー基礎 上肢', description: '肩・肩甲帯の代償動作観察', hours: 1.5, sortOrder: 4, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-p5', curriculumId: 'cur-pilates', name: 'リフォーマー基礎 下肢', description: '足部・膝・股関節の代償動作観察', hours: 2, sortOrder: 5, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-p6', curriculumId: 'cur-pilates', name: 'チェア基礎（統合）', description: '上肢・コア・下肢の統合実践', hours: 2, sortOrder: 6, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-p7', curriculumId: 'cur-pilates', name: 'キューイング・修正の基本', description: '声かけの型、修正の型、安全管理', hours: 2, sortOrder: 7, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-p8', curriculumId: 'cur-pilates', name: 'プログラム設計①（基礎）', description: 'フェーズ①動作成立優先の保守的選択', hours: 2, sortOrder: 8, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-p9', curriculumId: 'cur-pilates', name: 'プログラム設計②（応用）', description: 'フェーズ②目的別設計', hours: 2, sortOrder: 9, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-p10', curriculumId: 'cur-pilates', name: 'OSCE反復①', description: '30分セッション模擬×2回', hours: 2.5, sortOrder: 10, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-p11', curriculumId: 'cur-pilates', name: 'OSCE反復②', description: 'FB反映、修正演習', hours: 2.5, sortOrder: 11, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-p12', curriculumId: 'cur-pilates', name: '最終模擬認定', description: '本番形式、最終確認', hours: 2, sortOrder: 12, isActive: true, createdAt: ts, updatedAt: ts },
  // ストレッチ専門 12コマ/24h
  { id: 'sub-s1', curriculumId: 'cur-stretch', name: 'ストレッチ概論', description: 'ストレッチ分類・効果・禁忌の理解', hours: 2, sortOrder: 1, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-s2', curriculumId: 'cur-stretch', name: '評価法・ROM測定', description: 'ROM測定・姿勢評価', hours: 2, sortOrder: 2, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-s3', curriculumId: 'cur-stretch', name: '頸部・肩甲帯ストレッチ', description: '頸部・肩甲帯の基本ストレッチを安全に実施', hours: 2, sortOrder: 3, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-s4', curriculumId: 'cur-stretch', name: '胸郭・脊柱ストレッチ', description: '胸郭・脊柱の基本ストレッチを安全に実施', hours: 2, sortOrder: 4, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-s5', curriculumId: 'cur-stretch', name: '股関節・骨盤帯ストレッチ', description: '股関節・骨盤の基本ストレッチを安全に実施', hours: 2, sortOrder: 5, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-s6', curriculumId: 'cur-stretch', name: '下肢ストレッチ', description: '下肢基本ストレッチを安全に実施', hours: 2, sortOrder: 6, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-s7', curriculumId: 'cur-stretch', name: '呼吸・神経系アプローチ', description: '呼吸と副交感神経のリラクゼーションを組み込める', hours: 2, sortOrder: 7, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-s8', curriculumId: 'cur-stretch', name: '組織リリーステクニック基礎', description: '組織リリーステクニックの基礎を安全に実施', hours: 2, sortOrder: 8, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-s9', curriculumId: 'cur-stretch', name: 'プログラム設計', description: 'クライアント情報をもとにプログラムを設計', hours: 2, sortOrder: 9, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-s10', curriculumId: 'cur-stretch', name: 'クライアント評価・カウンセリング実践', description: 'ゲスト顧客特有のニーズを引き出し評価プロセスを実施', hours: 2, sortOrder: 10, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-s11', curriculumId: 'cur-stretch', name: 'OSCE模擬試験', description: 'OSCE形式での通し評価に対応', hours: 2, sortOrder: 11, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-s12', curriculumId: 'cur-stretch', name: '総合復習', description: 'OSCE本番に向けた仕上げ', hours: 2, sortOrder: 12, isActive: true, createdAt: ts, updatedAt: ts },
  // ブラッシュアップ研修 8コマ/16h
  { id: 'sub-b1', curriculumId: 'cur-brushup', name: 'セッションの流れ確認', description: '成功・失敗事例・継続課題を整理し改善優先順位を明確に', hours: 2, sortOrder: 1, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-b2', curriculumId: 'cur-brushup', name: '応用評価①', description: 'ミクロな視点での評価と複雑な代償動作の観察', hours: 2, sortOrder: 2, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-b3', curriculumId: 'cur-brushup', name: 'トレーニング種目増加①', description: '50分セッションに必要な再評価ポイントの設計', hours: 2, sortOrder: 3, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-b4', curriculumId: 'cur-brushup', name: 'トレーニング種目増加②', description: '50分セッションの種目バリエーション', hours: 2, sortOrder: 4, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-b5', curriculumId: 'cur-brushup', name: '栄養学応用・栄養サポート Lv2', description: 'ダイエット・ボディメイクの食事記録に基づく提案', hours: 3, sortOrder: 5, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-b6', curriculumId: 'cur-brushup', name: 'コーチング理論・モチベーション管理', description: '継続率向上の会話設計、3ヶ月担当者制での目標再設定', hours: 2, sortOrder: 6, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-b7', curriculumId: 'cur-brushup', name: 'Lv2統合演習①', description: '50分セッション模擬を通じて評価から提案まで一連で実施', hours: 1.5, sortOrder: 7, isActive: true, createdAt: ts, updatedAt: ts },
  { id: 'sub-b8', curriculumId: 'cur-brushup', name: 'Lv2統合演習②', description: 'フィードバックを反映し本番想定で安定して再現', hours: 1.5, sortOrder: 8, isActive: true, createdAt: ts, updatedAt: ts },
];

// ============================================
// 受講進捗データ
// ============================================
export const courseProgresses: CourseProgress[] = [
  // 山田太郎: 共通コア 50%完了、ウェイト専門 開始中
  { id: 'prog-1', userId: 'user-learner1', subjectId: 'sub-co1', status: 'completed', startedAt: '2024-04-08T00:00:00Z', completedAt: '2024-04-08T00:00:00Z', memo: '初回から理解力が高い。座学は問題なし。', createdAt: ts, updatedAt: ts },
  { id: 'prog-2', userId: 'user-learner1', subjectId: 'sub-co2', status: 'completed', startedAt: '2024-04-08T00:00:00Z', completedAt: '2024-04-08T00:00:00Z', memo: '禁忌スクリーニングの手順を正確に実施できた。', createdAt: ts, updatedAt: ts },
  { id: 'prog-3', userId: 'user-learner1', subjectId: 'sub-co3', status: 'completed', startedAt: '2024-04-09T00:00:00Z', completedAt: '2024-04-09T00:00:00Z', memo: 'ラポール形成がやや硬い。練習を重ねれば改善可能。', createdAt: ts, updatedAt: ts },
  { id: 'prog-4', userId: 'user-learner1', subjectId: 'sub-co4', status: 'completed', startedAt: '2024-04-10T00:00:00Z', completedAt: '2024-04-10T00:00:00Z', memo: null, createdAt: ts, updatedAt: ts },
  { id: 'prog-5', userId: 'user-learner1', subjectId: 'sub-co5', status: 'in_progress', startedAt: '2024-04-11T00:00:00Z', completedAt: null, memo: '3段階構成の理解にもう少し時間が必要。次回フォローアップ予定。', createdAt: ts, updatedAt: ts },
  { id: 'prog-6', userId: 'user-learner1', subjectId: 'sub-co6', status: 'not_started', startedAt: null, completedAt: null, memo: null, createdAt: ts, updatedAt: ts },
  { id: 'prog-7', userId: 'user-learner1', subjectId: 'sub-co7', status: 'not_started', startedAt: null, completedAt: null, memo: null, createdAt: ts, updatedAt: ts },
  { id: 'prog-8', userId: 'user-learner1', subjectId: 'sub-co8', status: 'not_started', startedAt: null, completedAt: null, memo: null, createdAt: ts, updatedAt: ts },
  { id: 'prog-9', userId: 'user-learner1', subjectId: 'sub-w1', status: 'completed', startedAt: '2024-04-15T00:00:00Z', completedAt: '2024-04-15T00:00:00Z', memo: '基礎理論の理解は良好。', createdAt: ts, updatedAt: ts },
  { id: 'prog-10', userId: 'user-learner1', subjectId: 'sub-w2', status: 'in_progress', startedAt: '2024-04-16T00:00:00Z', completedAt: null, memo: 'スクワットのフォーム指導に苦戦中。膝の向きの指導を重点的に。', createdAt: ts, updatedAt: ts },
  // 田中美咲: 共通コア完了、ウェイト完了、ピラティス進行中、ブラッシュアップ開始
  { id: 'prog-20', userId: 'user-learner2', subjectId: 'sub-co1', status: 'completed', startedAt: '2024-02-05T00:00:00Z', completedAt: '2024-02-05T00:00:00Z', memo: null, createdAt: ts, updatedAt: ts },
  { id: 'prog-21', userId: 'user-learner2', subjectId: 'sub-co2', status: 'completed', startedAt: '2024-02-05T00:00:00Z', completedAt: '2024-02-05T00:00:00Z', memo: null, createdAt: ts, updatedAt: ts },
  { id: 'prog-22', userId: 'user-learner2', subjectId: 'sub-co3', status: 'completed', startedAt: '2024-02-06T00:00:00Z', completedAt: '2024-02-06T00:00:00Z', memo: null, createdAt: ts, updatedAt: ts },
  { id: 'prog-23', userId: 'user-learner2', subjectId: 'sub-co4', status: 'completed', startedAt: '2024-02-07T00:00:00Z', completedAt: '2024-02-07T00:00:00Z', memo: null, createdAt: ts, updatedAt: ts },
  { id: 'prog-24', userId: 'user-learner2', subjectId: 'sub-co5', status: 'completed', startedAt: '2024-02-08T00:00:00Z', completedAt: '2024-02-08T00:00:00Z', memo: null, createdAt: ts, updatedAt: ts },
  { id: 'prog-25', userId: 'user-learner2', subjectId: 'sub-co6', status: 'completed', startedAt: '2024-02-08T00:00:00Z', completedAt: '2024-02-08T00:00:00Z', memo: null, createdAt: ts, updatedAt: ts },
  { id: 'prog-26', userId: 'user-learner2', subjectId: 'sub-co7', status: 'completed', startedAt: '2024-02-09T00:00:00Z', completedAt: '2024-02-09T00:00:00Z', memo: null, createdAt: ts, updatedAt: ts },
  { id: 'prog-27', userId: 'user-learner2', subjectId: 'sub-co8', status: 'completed', startedAt: '2024-02-09T00:00:00Z', completedAt: '2024-02-09T00:00:00Z', memo: null, createdAt: ts, updatedAt: ts },
  { id: 'prog-28', userId: 'user-learner2', subjectId: 'sub-p1', status: 'completed', startedAt: '2024-04-01T00:00:00Z', completedAt: '2024-04-01T00:00:00Z', memo: null, createdAt: ts, updatedAt: ts },
  { id: 'prog-29', userId: 'user-learner2', subjectId: 'sub-p2', status: 'completed', startedAt: '2024-04-02T00:00:00Z', completedAt: '2024-04-02T00:00:00Z', memo: 'マット基礎は安定。リフォーマーへの移行準備OK。', createdAt: ts, updatedAt: ts },
  { id: 'prog-30', userId: 'user-learner2', subjectId: 'sub-p3', status: 'in_progress', startedAt: '2024-04-03T00:00:00Z', completedAt: null, memo: 'コアエクササイズの骨盤ニュートラル維持に課題あり。引き続き確認が必要。', createdAt: ts, updatedAt: ts },
  // 高橋健太: 共通コア 25%完了
  { id: 'prog-40', userId: 'user-learner3', subjectId: 'sub-co1', status: 'completed', startedAt: '2024-07-08T00:00:00Z', completedAt: '2024-07-08T00:00:00Z', memo: null, createdAt: ts, updatedAt: ts },
  { id: 'prog-41', userId: 'user-learner3', subjectId: 'sub-co2', status: 'completed', startedAt: '2024-07-08T00:00:00Z', completedAt: '2024-07-08T00:00:00Z', memo: null, createdAt: ts, updatedAt: ts },
  { id: 'prog-42', userId: 'user-learner3', subjectId: 'sub-co3', status: 'in_progress', startedAt: '2024-07-09T00:00:00Z', completedAt: null, memo: '実技練習の量を増やす必要あり。ロールプレイを追加する。', createdAt: ts, updatedAt: ts },
];

// ============================================
// OSCE評価データ
// ============================================
export const evaluations: Evaluation[] = [
  {
    id: 'eval-1', learnerId: 'user-learner2', evaluatorId: 'user-eval', track: 'weight',
    status: 'finalized', totalScore: 68, passed: true, ngItems: [],
    overallComment: '全セクション安定して高水準。特にカウンセリングとリスクスクリーニングが優秀。',
    goodPoints: ['カウンセリングの導入が自然で安心感がある', '禁忌スクリーニングを漏れなく実施', 'プログラム設計の根拠説明が的確'],
    improvementPoints: ['負荷調整のタイミングをもう少し早く', '環境整備の事前チェックをルーティン化'],
    evaluatedAt: '2024-03-15T10:00:00Z', createdAt: '2024-03-15T10:00:00Z', updatedAt: '2024-03-15T10:00:00Z',
  },
  {
    id: 'eval-2', learnerId: 'user-learner1', evaluatorId: 'user-eval', track: 'weight',
    status: 'finalized', totalScore: 45, passed: false, ngItems: [],
    overallComment: '基礎的な理解はあるが、カウンセリングの深掘りと修正サイクルに課題。追加練習を推奨。',
    goodPoints: ['安全意識は高い', 'リスクスクリーニングは確実に実施'],
    improvementPoints: ['目標設定の具体性が不足', '修正サイクルが回せていない', 'クロージングが唐突'],
    evaluatedAt: '2024-05-20T10:00:00Z', createdAt: '2024-05-20T10:00:00Z', updatedAt: '2024-05-20T10:00:00Z',
  },
  {
    id: 'eval-3', learnerId: 'user-learner3', evaluatorId: 'user-eval', track: 'weight',
    status: 'submitted', totalScore: 38, passed: false, ngItems: ['NG2'],
    overallComment: 'フォーム観察の精度を上げる必要あり。フォーム崩壊を見逃す場面が1回あり即NG。',
    goodPoints: ['明るい声かけで雰囲気が良い'],
    improvementPoints: ['フォーム観察の視点を増やす', '禁忌確認の深掘りが必要', '即NG: フォーム崩壊見逃し'],
    evaluatedAt: '2024-08-20T10:00:00Z', createdAt: '2024-08-20T10:00:00Z', updatedAt: '2024-08-20T10:00:00Z',
  },
];

// ============================================
// OSCE評価項目詳細
// ============================================
export const evaluationItems: EvaluationItem[] = [
  // eval-1: 田中美咲・ウェイトOSCE（合格: 68点）
  { id: 'ei-1', evaluationId: 'eval-1', itemName: 'C1', score: 5, comment: '自然な導入で安心感', createdAt: ts },
  { id: 'ei-2', evaluationId: 'eval-1', itemName: 'C2', score: 5, comment: 'SMART基準に沿った明確な目標設定', createdAt: ts },
  { id: 'ei-3', evaluationId: 'eval-1', itemName: 'C3', score: 5, comment: '漏れなし', createdAt: ts },
  { id: 'ei-4', evaluationId: 'eval-1', itemName: 'C4', score: 5, comment: '丁寧な説明', createdAt: ts },
  { id: 'ei-5', evaluationId: 'eval-1', itemName: 'C5', score: 3, comment: '期待値調整がやや不足', createdAt: ts },
  { id: 'ei-6', evaluationId: 'eval-1', itemName: 'E1', score: 5, comment: '2方向から的確に観察', createdAt: ts },
  { id: 'ei-7', evaluationId: 'eval-1', itemName: 'E2', score: 3, comment: 'ROMテストは実施したが記録が曖昧', createdAt: ts },
  { id: 'ei-8', evaluationId: 'eval-1', itemName: 'E3', score: 5, comment: '評価結果を的確にプログラムに反映', createdAt: ts },
  { id: 'ei-9', evaluationId: 'eval-1', itemName: 'P1', score: 5, comment: '論理的な接続', createdAt: ts },
  { id: 'ei-10', evaluationId: 'eval-1', itemName: 'P2', score: 3, comment: 'RPE設定の根拠説明がやや弱い', createdAt: ts },
  { id: 'ei-11', evaluationId: 'eval-1', itemName: 'P3', score: 3, comment: '代替案の提示あるが具体性不足', createdAt: ts },
  { id: 'ei-12', evaluationId: 'eval-1', itemName: 'T1', score: 5, comment: '安全確認完璧', createdAt: ts },
  { id: 'ei-13', evaluationId: 'eval-1', itemName: 'T2', score: 3, comment: '修正サイクルは回せているが速度改善余地', createdAt: ts },
  { id: 'ei-14', evaluationId: 'eval-1', itemName: 'T3', score: 3, comment: '負荷調整のタイミングがやや遅い', createdAt: ts },
  { id: 'ei-15', evaluationId: 'eval-1', itemName: 'S1', score: 3, comment: '要点はまとめたが問いかけが少ない', createdAt: ts },
  { id: 'ei-16', evaluationId: 'eval-1', itemName: 'S2', score: 3, comment: 'ホームプログラム提示あり', createdAt: ts },
  { id: 'ei-17', evaluationId: 'eval-1', itemName: 'EN1', score: 2, comment: '器具配置OK、室温未確認', createdAt: ts },
  { id: 'ei-18', evaluationId: 'eval-1', itemName: 'EN2', score: 2, comment: '清潔感あり、消毒タイミング改善', createdAt: ts },
  // eval-2: 山田太郎・ウェイトOSCE（不合格: 45点）
  { id: 'ei-19', evaluationId: 'eval-2', itemName: 'C1', score: 3, comment: '緊張が伝わる', createdAt: ts },
  { id: 'ei-20', evaluationId: 'eval-2', itemName: 'C2', score: 1, comment: '目標が曖昧', createdAt: ts },
  { id: 'ei-21', evaluationId: 'eval-2', itemName: 'C3', score: 5, comment: 'スクリーニング確実', createdAt: ts },
  { id: 'ei-22', evaluationId: 'eval-2', itemName: 'C4', score: 3, comment: '説明はしたが同意確認不十分', createdAt: ts },
  { id: 'ei-23', evaluationId: 'eval-2', itemName: 'C5', score: 1, comment: '期待値調整なし', createdAt: ts },
  { id: 'ei-24', evaluationId: 'eval-2', itemName: 'E1', score: 3, comment: '片方向のみ', createdAt: ts },
  { id: 'ei-25', evaluationId: 'eval-2', itemName: 'E2', score: 3, comment: '最低限のROM確認', createdAt: ts },
  { id: 'ei-26', evaluationId: 'eval-2', itemName: 'E3', score: 1, comment: '評価結果のプログラム反映が不明確', createdAt: ts },
  { id: 'ei-27', evaluationId: 'eval-2', itemName: 'P1', score: 3, comment: '目標との接続はあるが根拠薄い', createdAt: ts },
  { id: 'ei-28', evaluationId: 'eval-2', itemName: 'P2', score: 1, comment: '強度設定の根拠なし', createdAt: ts },
  { id: 'ei-29', evaluationId: 'eval-2', itemName: 'P3', score: 1, comment: '代替案なし', createdAt: ts },
  { id: 'ei-30', evaluationId: 'eval-2', itemName: 'T1', score: 3, comment: 'セットアップは実施', createdAt: ts },
  { id: 'ei-31', evaluationId: 'eval-2', itemName: 'T2', score: 1, comment: '修正サイクル未実施', createdAt: ts },
  { id: 'ei-32', evaluationId: 'eval-2', itemName: 'T3', score: 3, comment: '負荷調整は試みた', createdAt: ts },
  { id: 'ei-33', evaluationId: 'eval-2', itemName: 'S1', score: 3, comment: '簡潔なまとめ', createdAt: ts },
  { id: 'ei-34', evaluationId: 'eval-2', itemName: 'S2', score: 1, comment: 'ホームプログラムなし', createdAt: ts },
  { id: 'ei-35', evaluationId: 'eval-2', itemName: 'EN1', score: 3, comment: '環境整備良好', createdAt: ts },
  { id: 'ei-36', evaluationId: 'eval-2', itemName: 'EN2', score: 2, comment: '清潔感あり', createdAt: ts },
  // eval-3: 高橋健太・ウェイトOSCE（不合格: 38点+NG1件）
  { id: 'ei-37', evaluationId: 'eval-3', itemName: 'C1', score: 3, comment: '明るい挨拶', createdAt: ts },
  { id: 'ei-38', evaluationId: 'eval-3', itemName: 'C2', score: 1, comment: '目標不明確', createdAt: ts },
  { id: 'ei-39', evaluationId: 'eval-3', itemName: 'C3', score: 3, comment: '基本的な確認は実施', createdAt: ts },
  { id: 'ei-40', evaluationId: 'eval-3', itemName: 'C4', score: 1, comment: '同意確認省略気味', createdAt: ts },
  { id: 'ei-41', evaluationId: 'eval-3', itemName: 'C5', score: 0, comment: '実施なし', createdAt: ts },
  { id: 'ei-42', evaluationId: 'eval-3', itemName: 'E1', score: 1, comment: '姿勢観察が表面的', createdAt: ts },
  { id: 'ei-43', evaluationId: 'eval-3', itemName: 'E2', score: 1, comment: 'ROMテスト不十分', createdAt: ts },
  { id: 'ei-44', evaluationId: 'eval-3', itemName: 'E3', score: 1, comment: '評価結果の反映なし', createdAt: ts },
  { id: 'ei-45', evaluationId: 'eval-3', itemName: 'P1', score: 3, comment: '目標との接続あり', createdAt: ts },
  { id: 'ei-46', evaluationId: 'eval-3', itemName: 'P2', score: 1, comment: '根拠なし', createdAt: ts },
  { id: 'ei-47', evaluationId: 'eval-3', itemName: 'P3', score: 1, comment: '代替案なし', createdAt: ts },
  { id: 'ei-48', evaluationId: 'eval-3', itemName: 'T1', score: 3, comment: 'デモ実施', createdAt: ts },
  { id: 'ei-49', evaluationId: 'eval-3', itemName: 'T2', score: 3, comment: '修正を試みた', createdAt: ts },
  { id: 'ei-50', evaluationId: 'eval-3', itemName: 'T3', score: 3, comment: '調整は試みた', createdAt: ts },
  { id: 'ei-51', evaluationId: 'eval-3', itemName: 'S1', score: 3, comment: '簡単にまとめた', createdAt: ts },
  { id: 'ei-52', evaluationId: 'eval-3', itemName: 'S2', score: 3, comment: '次回提案あり', createdAt: ts },
  { id: 'ei-53', evaluationId: 'eval-3', itemName: 'EN1', score: 3, comment: '問題なし', createdAt: ts },
  { id: 'ei-54', evaluationId: 'eval-3', itemName: 'EN2', score: 3, comment: '問題なし', createdAt: ts },
];

// ============================================
// 認定レベルマスター
// ============================================
export const certificationLevels: CertificationLevel[] = [
  { id: 'level-lv0', code: 'lv0', name: '未認定', sortOrder: 0, description: '入社時（研修開始前）', requirements: null },
  { id: 'level-lv1', code: 'lv1', name: 'Lv1 提供可能', sortOrder: 1, description: '安全なセッション運用が可能', requirements: '初期研修修了＋OSCE 61点以上（70%）＋即NG 0件' },
  { id: 'level-lv2', code: 'lv2', name: 'Lv2 Standard', sortOrder: 2, description: '評価サイクル実践、3ヶ月顧客担当者制', requirements: 'Lv1保持6ヶ月、QA75点以上、継続率70%以上、ブラッシュアップ研修修了' },
  { id: 'level-lv3', code: 'lv3', name: 'Lv3 Specialist', sortOrder: 3, description: '専門領域深化、成果創出', requirements: 'Lv2保持1年以上、QA80点以上、指名率20%以上' },
  { id: 'level-lv4', code: 'lv4', name: 'Lv4 Instructor', sortOrder: 4, description: '研修・QA実施が可能', requirements: 'Lv3保持2年以上、QA85点以上、模擬OJT、面接' },
  { id: 'level-lv5', code: 'lv5', name: 'Lv5 Master', sortOrder: 5, description: '全店QA設計・本部レベルの責任者', requirements: 'Lv4保持3年以上、QA90点以上、プレゼン、共有審査' },
];

// ============================================
// 認定データ
// ============================================
export const certifications: Certification[] = [
  {
    id: 'cert-1', learnerId: 'user-learner2', levelId: 'level-lv1', track: 'weight',
    applicantId: 'user-eval', approverId: 'user-edu', status: 'certified',
    reason: '共通コア全科目修了。ウェイトOSCE 68点（79%）で合格。即NG 0件。安全意識が高く提供可能と判断。',
    rejectionReason: null,
    appliedAt: '2024-03-20T10:00:00Z', decidedAt: '2024-03-21T10:00:00Z', createdAt: '2024-03-20T10:00:00Z', updatedAt: '2024-03-21T10:00:00Z',
  },
  {
    id: 'cert-2', learnerId: 'user-learner1', levelId: 'level-lv1', track: 'weight',
    applicantId: 'user-eval', approverId: null, status: 'pending',
    reason: '共通コア受講中だが、ウェイト基礎種目の理解度が高い。OSCE再試験に向けて申請。',
    rejectionReason: null,
    appliedAt: '2024-06-01T10:00:00Z', decidedAt: null, createdAt: '2024-06-01T10:00:00Z', updatedAt: '2024-06-01T10:00:00Z',
  },
  {
    id: 'cert-3', learnerId: 'user-learner2', levelId: 'level-lv2', track: null,
    applicantId: 'user-edu', approverId: null, status: 'pending',
    reason: 'Lv1取得後6ヶ月経過。QA評価78点。継続率75%。ブラッシュアップ研修受講中。',
    rejectionReason: null,
    appliedAt: '2024-09-01T10:00:00Z', decidedAt: null, createdAt: '2024-09-01T10:00:00Z', updatedAt: '2024-09-01T10:00:00Z',
  },
];
