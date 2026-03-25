-- ============================================
-- LISENS - セキュアRLSポリシー
-- 認証済みユーザーのみアクセス可能にする
-- Supabase SQL Editor で実行してください
-- ============================================

-- ============================================
-- Step 1: ヘルパー関数の作成
-- auth.uid() からユーザーのロールを取得する
-- ============================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.users WHERE auth_uid = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_my_user_id()
RETURNS text AS $$
  SELECT id FROM public.users WHERE auth_uid = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- スタッフロール判定（admin, education_manager, evaluator, store_manager）
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_uid = auth.uid()
    AND role IN ('admin', 'education_manager', 'evaluator', 'store_manager')
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 管理者ロール判定（admin, education_manager のみ）
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_uid = auth.uid()
    AND role IN ('admin', 'education_manager')
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================
-- Step 2: 既存ポリシーを全削除
-- ============================================

-- 03_fix_rls.sql で作成した全開放ポリシーを削除
DROP POLICY IF EXISTS "全ユーザー読み取り可能" ON organizations;
DROP POLICY IF EXISTS "全ユーザー読み取り可能" ON users;
DROP POLICY IF EXISTS "全ユーザー読み取り可能" ON curricula;
DROP POLICY IF EXISTS "全ユーザー読み取り可能" ON subjects;
DROP POLICY IF EXISTS "全ユーザー読み取り可能" ON course_progresses;
DROP POLICY IF EXISTS "全ユーザー読み取り可能" ON evaluations;
DROP POLICY IF EXISTS "全ユーザー読み取り可能" ON evaluation_items;
DROP POLICY IF EXISTS "全ユーザー読み取り可能" ON certification_levels;
DROP POLICY IF EXISTS "全ユーザー読み取り可能" ON certifications;

DROP POLICY IF EXISTS "全ユーザー書き込み可能" ON organizations;
DROP POLICY IF EXISTS "全ユーザー書き込み可能" ON users;
DROP POLICY IF EXISTS "全ユーザー書き込み可能" ON curricula;
DROP POLICY IF EXISTS "全ユーザー書き込み可能" ON subjects;
DROP POLICY IF EXISTS "全ユーザー書き込み可能" ON course_progresses;
DROP POLICY IF EXISTS "全ユーザー書き込み可能" ON evaluations;
DROP POLICY IF EXISTS "全ユーザー書き込み可能" ON evaluation_items;
DROP POLICY IF EXISTS "全ユーザー書き込み可能" ON certification_levels;
DROP POLICY IF EXISTS "全ユーザー書き込み可能" ON certifications;

-- 01_create_tables.sql で作成したポリシーも念のため削除
DROP POLICY IF EXISTS "認証済みユーザーは読み取り可能" ON organizations;
DROP POLICY IF EXISTS "認証済みユーザーは読み取り可能" ON users;
DROP POLICY IF EXISTS "認証済みユーザーは読み取り可能" ON curricula;
DROP POLICY IF EXISTS "認証済みユーザーは読み取り可能" ON subjects;
DROP POLICY IF EXISTS "認証済みユーザーは読み取り可能" ON course_progresses;
DROP POLICY IF EXISTS "認証済みユーザーは読み取り可能" ON evaluations;
DROP POLICY IF EXISTS "認証済みユーザーは読み取り可能" ON evaluation_items;
DROP POLICY IF EXISTS "認証済みユーザーは読み取り可能" ON certification_levels;
DROP POLICY IF EXISTS "認証済みユーザーは読み取り可能" ON certifications;

DROP POLICY IF EXISTS "認証済みユーザーは書き込み可能" ON organizations;
DROP POLICY IF EXISTS "認証済みユーザーは書き込み可能" ON users;
DROP POLICY IF EXISTS "認証済みユーザーは書き込み可能" ON curricula;
DROP POLICY IF EXISTS "認証済みユーザーは書き込み可能" ON subjects;
DROP POLICY IF EXISTS "認証済みユーザーは書き込み可能" ON course_progresses;
DROP POLICY IF EXISTS "認証済みユーザーは書き込み可能" ON evaluations;
DROP POLICY IF EXISTS "認証済みユーザーは書き込み可能" ON evaluation_items;
DROP POLICY IF EXISTS "認証済みユーザーは書き込み可能" ON certification_levels;
DROP POLICY IF EXISTS "認証済みユーザーは書き込み可能" ON certifications;


-- ============================================
-- Step 3: セキュアなRLSポリシーを作成
-- ============================================

-- ────────────────────────────────────────
-- organizations: ログイン済み全員が閲覧可。管理者のみ編集可
-- ────────────────────────────────────────
CREATE POLICY "認証済み: 組織閲覧"
  ON organizations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "管理者: 組織編集"
  ON organizations FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ────────────────────────────────────────
-- users: ログイン済み全員が閲覧可。管理者のみ追加・編集・削除可
-- （研修者は自分のデータと、同組織のスタッフを閲覧可能）
-- ────────────────────────────────────────
CREATE POLICY "認証済み: ユーザー閲覧"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "管理者: ユーザー追加"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "管理者: ユーザー更新"
  ON users FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "管理者: ユーザー削除"
  ON users FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ────────────────────────────────────────
-- curricula: ログイン済み全員が閲覧可。管理者のみ編集可
-- ────────────────────────────────────────
CREATE POLICY "認証済み: カリキュラム閲覧"
  ON curricula FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "管理者: カリキュラム編集"
  ON curricula FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ────────────────────────────────────────
-- subjects: ログイン済み全員が閲覧可。管理者のみ編集可
-- ────────────────────────────────────────
CREATE POLICY "認証済み: 科目閲覧"
  ON subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "管理者: 科目編集"
  ON subjects FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ────────────────────────────────────────
-- course_progresses: 
--   閲覧: スタッフは全員分、研修者は自分のみ
--   更新: スタッフは全員分、研修者は自分のみ
-- ────────────────────────────────────────
CREATE POLICY "認証済み: 進捗閲覧"
  ON course_progresses FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    OR user_id = public.get_my_user_id()
  );

CREATE POLICY "スタッフ: 進捗追加"
  ON course_progresses FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff() OR user_id = public.get_my_user_id());

CREATE POLICY "スタッフ: 進捗更新"
  ON course_progresses FOR UPDATE
  TO authenticated
  USING (public.is_staff() OR user_id = public.get_my_user_id())
  WITH CHECK (public.is_staff() OR user_id = public.get_my_user_id());

-- ────────────────────────────────────────
-- evaluations: 
--   閲覧: スタッフは全件、研修者は自分のみ
--   作成: スタッフのみ
-- ────────────────────────────────────────
CREATE POLICY "認証済み: 評価閲覧"
  ON evaluations FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    OR learner_id = public.get_my_user_id()
  );

CREATE POLICY "スタッフ: 評価作成"
  ON evaluations FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff());

CREATE POLICY "管理者: 評価更新"
  ON evaluations FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ────────────────────────────────────────
-- evaluation_items: evaluations と同じ制御
-- ────────────────────────────────────────
CREATE POLICY "認証済み: 評価項目閲覧"
  ON evaluation_items FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM evaluations e
      WHERE e.id = evaluation_items.evaluation_id
      AND e.learner_id = public.get_my_user_id()
    )
  );

CREATE POLICY "スタッフ: 評価項目作成"
  ON evaluation_items FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff());

-- ────────────────────────────────────────
-- certification_levels: ログイン済み全員が閲覧可
-- ────────────────────────────────────────
CREATE POLICY "認証済み: 認定レベル閲覧"
  ON certification_levels FOR SELECT
  TO authenticated
  USING (true);

-- ────────────────────────────────────────
-- certifications:
--   閲覧: スタッフは全件、研修者は自分のみ
--   作成: スタッフのみ
--   更新: 管理者のみ（承認・却下）
-- ────────────────────────────────────────
CREATE POLICY "認証済み: 認定閲覧"
  ON certifications FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    OR learner_id = public.get_my_user_id()
  );

CREATE POLICY "スタッフ: 認定申請作成"
  ON certifications FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff());

CREATE POLICY "管理者: 認定更新"
  ON certifications FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================
-- 確認用クエリ（実行結果でポリシー一覧が見える）
-- ============================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
