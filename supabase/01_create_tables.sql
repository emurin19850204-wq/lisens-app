-- ============================================
-- LISENS - Supabase テーブル作成SQL
-- Supabase SQL Editor で実行してください
-- ============================================

-- 1. 組織テーブル
CREATE TABLE organizations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('company', 'department', 'store')),
  parent_id TEXT REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ユーザーテーブル
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  auth_uid UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'education_manager', 'evaluator', 'store_manager', 'learner')),
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  current_level TEXT NOT NULL DEFAULT 'lv0' CHECK (current_level IN ('lv0', 'lv1', 'lv2', 'lv3', 'lv4', 'lv5')),
  tracks TEXT[] DEFAULT '{}',
  hire_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. カリキュラムテーブル
CREATE TABLE curricula (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('common', 'track', 'brushup')),
  track_code TEXT CHECK (track_code IN ('weight', 'pilates', 'stretch', NULL)),
  total_hours NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 科目テーブル
CREATE TABLE subjects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  curriculum_id TEXT NOT NULL REFERENCES curricula(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  hours NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 受講進捗テーブル
CREATE TABLE course_progresses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, subject_id)
);

-- 6. OSCE評価テーブル
CREATE TABLE evaluations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  learner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  evaluator_id TEXT NOT NULL REFERENCES users(id),
  track TEXT NOT NULL CHECK (track IN ('weight', 'pilates', 'stretch')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed', 'finalized', 'returned')),
  total_score INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  ng_items TEXT[] DEFAULT '{}',
  overall_comment TEXT,
  good_points TEXT[] DEFAULT '{}',
  improvement_points TEXT[] DEFAULT '{}',
  evaluated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 評価項目テーブル
CREATE TABLE evaluation_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  evaluation_id TEXT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 認定レベルマスタ
CREATE TABLE certification_levels (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  requirements TEXT
);

-- 9. 認定テーブル
CREATE TABLE certifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  learner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level_id TEXT NOT NULL REFERENCES certification_levels(id),
  track TEXT CHECK (track IN ('weight', 'pilates', 'stretch', NULL)),
  applicant_id TEXT NOT NULL REFERENCES users(id),
  approver_id TEXT REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'certified', 'rejected')),
  reason TEXT,
  rejection_reason TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security (RLS) の有効化
-- 社内利用: 認証済みユーザーは全データ読み書き可能
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE curricula ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは全テーブルの読み取り可能
CREATE POLICY "認証済みユーザーは読み取り可能" ON organizations FOR SELECT TO authenticated USING (true);
CREATE POLICY "認証済みユーザーは読み取り可能" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "認証済みユーザーは読み取り可能" ON curricula FOR SELECT TO authenticated USING (true);
CREATE POLICY "認証済みユーザーは読み取り可能" ON subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "認証済みユーザーは読み取り可能" ON course_progresses FOR SELECT TO authenticated USING (true);
CREATE POLICY "認証済みユーザーは読み取り可能" ON evaluations FOR SELECT TO authenticated USING (true);
CREATE POLICY "認証済みユーザーは読み取り可能" ON evaluation_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "認証済みユーザーは読み取り可能" ON certification_levels FOR SELECT TO authenticated USING (true);
CREATE POLICY "認証済みユーザーは読み取り可能" ON certifications FOR SELECT TO authenticated USING (true);

-- 認証済みユーザーは全テーブルの書き込み可能（社内利用のため）
CREATE POLICY "認証済みユーザーは書き込み可能" ON organizations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "認証済みユーザーは書き込み可能" ON users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "認証済みユーザーは書き込み可能" ON curricula FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "認証済みユーザーは書き込み可能" ON subjects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "認証済みユーザーは書き込み可能" ON course_progresses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "認証済みユーザーは書き込み可能" ON evaluations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "認証済みユーザーは書き込み可能" ON evaluation_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "認証済みユーザーは書き込み可能" ON certification_levels FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "認証済みユーザーは書き込み可能" ON certifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- updated_at を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_curricula_updated_at BEFORE UPDATE ON curricula FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_course_progresses_updated_at BEFORE UPDATE ON course_progresses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_certifications_updated_at BEFORE UPDATE ON certifications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
