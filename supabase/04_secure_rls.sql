-- ============================================
-- LISENS - セキュアRLSポリシー（完全版）
-- ロール別アクセス制御を実現する
-- Supabase SQL Editor で実行してください
--
-- ※ このSQLは冪等（何度実行しても同じ結果になる）
-- ============================================

-- ============================================
-- Step 1: ヘルパー関数の作成
-- auth.uid() からアプリユーザー情報を取得する
-- SECURITY DEFINER: RLSを迂回してusersテーブルを参照
-- ============================================

-- 自分のアプリ内ロールを取得
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.users WHERE auth_uid = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 自分のアプリ内ユーザーIDを取得
CREATE OR REPLACE FUNCTION public.get_my_user_id()
RETURNS text AS $$
  SELECT id FROM public.users WHERE auth_uid = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 自分の所属組織IDを取得
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS text AS $$
  SELECT organization_id FROM public.users WHERE auth_uid = auth.uid()
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

-- 評価者以上の判定（admin, education_manager, evaluator）
CREATE OR REPLACE FUNCTION public.is_evaluator_or_above()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_uid = auth.uid()
    AND role IN ('admin', 'education_manager', 'evaluator')
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================
-- Step 2: 既存ポリシーを全削除
-- 03_fix_rls.sql / 01_create_tables.sql のポリシーを含む
-- ============================================

-- 全テーブルの既知のポリシーを安全に削除
DO $$
DECLARE
  _table text;
  _policy text;
BEGIN
  FOR _table, _policy IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN (
      'organizations', 'users', 'curricula', 'subjects',
      'course_progresses', 'evaluations', 'evaluation_items',
      'certification_levels', 'certifications'
    )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', _policy, _table);
  END LOOP;
END
$$;


-- ============================================
-- Step 3: セキュアなRLSポリシーを作成
-- ============================================

-- ────────────────────────────────────────
-- organizations（組織）
--   閲覧: 認証済み全員（組織名表示に必要）
--   変更: 管理者のみ（admin, education_manager）
-- ────────────────────────────────────────
CREATE POLICY "rls_organizations_select"
  ON organizations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "rls_organizations_insert"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "rls_organizations_update"
  ON organizations FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "rls_organizations_delete"
  ON organizations FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ────────────────────────────────────────
-- users（ユーザー）
--   閲覧: 認証済み全員
--     ※ スタッフは全員分見える
--     ※ 研修者は自分 + 同組織のスタッフを閲覧可能
--     → 現状は画面側で制御しており、DB側は全閲覧許可
--       （将来的に行レベルで絞る場合はここを変更）
--   追加: Netlify Function (service_role) で実行するため
--        anon/authenticated は招待フロー経由のみ
--        service_role はRLSをバイパスするので影響なし
--   更新: 管理者のみ（スタッフ編集）
--        ※ 自分のauth_uid紐付けは linkAuthUid() で行う
--           → 自分の行のauth_uid更新を許可
--   削除: 管理者のみ
-- ────────────────────────────────────────
CREATE POLICY "rls_users_select"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "rls_users_insert"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "rls_users_update"
  ON users FOR UPDATE
  TO authenticated
  USING (
    -- 管理者は全ユーザー更新可能
    public.is_admin()
    -- 自分自身のauth_uid紐付けも許可
    OR id = public.get_my_user_id()
  )
  WITH CHECK (
    public.is_admin()
    OR id = public.get_my_user_id()
  );

CREATE POLICY "rls_users_delete"
  ON users FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ────────────────────────────────────────
-- curricula（カリキュラム）
--   閲覧: 認証済み全員（研修者も自分のカリキュラム確認に必要）
--   変更: 管理者のみ
-- ────────────────────────────────────────
CREATE POLICY "rls_curricula_select"
  ON curricula FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "rls_curricula_insert"
  ON curricula FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "rls_curricula_update"
  ON curricula FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "rls_curricula_delete"
  ON curricula FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ────────────────────────────────────────
-- subjects（科目）
--   閲覧: 認証済み全員
--   変更: 管理者のみ
-- ────────────────────────────────────────
CREATE POLICY "rls_subjects_select"
  ON subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "rls_subjects_insert"
  ON subjects FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "rls_subjects_update"
  ON subjects FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "rls_subjects_delete"
  ON subjects FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ────────────────────────────────────────
-- course_progresses（受講進捗）
--   閲覧:
--     スタッフ: 全員分（ただし store_manager は同組織のみ）
--     研修者: 自分のみ
--   追加・更新:
--     スタッフ: 全員分を操作可能
--     研修者: 自分の進捗のみ（将来的にセルフ更新を許可する場合）
--   削除: 管理者のみ
-- ────────────────────────────────────────
CREATE POLICY "rls_course_progresses_select"
  ON course_progresses FOR SELECT
  TO authenticated
  USING (
    -- スタッフは全員分閲覧可能
    public.is_staff()
    -- 研修者は自分の進捗のみ
    OR user_id = public.get_my_user_id()
  );

CREATE POLICY "rls_course_progresses_insert"
  ON course_progresses FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_staff()
    OR user_id = public.get_my_user_id()
  );

CREATE POLICY "rls_course_progresses_update"
  ON course_progresses FOR UPDATE
  TO authenticated
  USING (
    public.is_staff()
    OR user_id = public.get_my_user_id()
  )
  WITH CHECK (
    public.is_staff()
    OR user_id = public.get_my_user_id()
  );

CREATE POLICY "rls_course_progresses_delete"
  ON course_progresses FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ────────────────────────────────────────
-- evaluations（OSCE評価）
--   閲覧:
--     スタッフ: 全件
--     研修者: 自分が対象の評価のみ
--   作成: 評価者以上（evaluator, admin, education_manager）
--   更新: 管理者のみ（ステータス変更等）
--   削除: 管理者のみ
-- ────────────────────────────────────────
CREATE POLICY "rls_evaluations_select"
  ON evaluations FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    OR learner_id = public.get_my_user_id()
  );

CREATE POLICY "rls_evaluations_insert"
  ON evaluations FOR INSERT
  TO authenticated
  WITH CHECK (public.is_evaluator_or_above());

CREATE POLICY "rls_evaluations_update"
  ON evaluations FOR UPDATE
  TO authenticated
  USING (
    -- 評価者自身が作成した評価は編集可能
    evaluator_id = public.get_my_user_id()
    -- 管理者は全件編集可能
    OR public.is_admin()
  )
  WITH CHECK (
    evaluator_id = public.get_my_user_id()
    OR public.is_admin()
  );

CREATE POLICY "rls_evaluations_delete"
  ON evaluations FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ────────────────────────────────────────
-- evaluation_items（評価項目）
--   閲覧: evaluations と連動（親の評価を見られるなら項目も見える）
--   作成: 評価者以上
--   更新: 自分が作成した評価の項目 or 管理者
--   削除: 管理者のみ
-- ────────────────────────────────────────
CREATE POLICY "rls_evaluation_items_select"
  ON evaluation_items FOR SELECT
  TO authenticated
  USING (
    -- スタッフは全件閲覧可能
    public.is_staff()
    -- 研修者は自分の評価項目のみ
    OR EXISTS (
      SELECT 1 FROM evaluations e
      WHERE e.id = evaluation_items.evaluation_id
      AND e.learner_id = public.get_my_user_id()
    )
  );

CREATE POLICY "rls_evaluation_items_insert"
  ON evaluation_items FOR INSERT
  TO authenticated
  WITH CHECK (public.is_evaluator_or_above());

CREATE POLICY "rls_evaluation_items_update"
  ON evaluation_items FOR UPDATE
  TO authenticated
  USING (
    -- 自分が評価者の項目は更新可能
    EXISTS (
      SELECT 1 FROM evaluations e
      WHERE e.id = evaluation_items.evaluation_id
      AND e.evaluator_id = public.get_my_user_id()
    )
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM evaluations e
      WHERE e.id = evaluation_items.evaluation_id
      AND e.evaluator_id = public.get_my_user_id()
    )
    OR public.is_admin()
  );

CREATE POLICY "rls_evaluation_items_delete"
  ON evaluation_items FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ────────────────────────────────────────
-- certification_levels（認定レベルマスタ）
--   閲覧: 認証済み全員（マスタデータ）
--   変更: 管理者のみ
-- ────────────────────────────────────────
CREATE POLICY "rls_certification_levels_select"
  ON certification_levels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "rls_certification_levels_insert"
  ON certification_levels FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "rls_certification_levels_update"
  ON certification_levels FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ────────────────────────────────────────
-- certifications（認定）
--   閲覧:
--     スタッフ: 全件
--     研修者: 自分の認定のみ
--   作成: スタッフのみ（認定申請）
--   更新: 管理者のみ（承認・却下）
--   削除: 管理者のみ
-- ────────────────────────────────────────
CREATE POLICY "rls_certifications_select"
  ON certifications FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    OR learner_id = public.get_my_user_id()
  );

CREATE POLICY "rls_certifications_insert"
  ON certifications FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff());

CREATE POLICY "rls_certifications_update"
  ON certifications FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "rls_certifications_delete"
  ON certifications FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ============================================
-- Step 4: ヘルパー関数のSECURITY設定を確認
-- search_pathを固定してインジェクションを防ぐ
-- ============================================
ALTER FUNCTION public.get_my_role() SET search_path = public;
ALTER FUNCTION public.get_my_user_id() SET search_path = public;
ALTER FUNCTION public.get_my_org_id() SET search_path = public;
ALTER FUNCTION public.is_staff() SET search_path = public;
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.is_evaluator_or_above() SET search_path = public;


-- ============================================
-- Step 5: 確認用クエリ
-- 全ポリシーの一覧を表示
-- ============================================
SELECT
  tablename AS "テーブル",
  policyname AS "ポリシー名",
  permissive AS "許可型",
  roles AS "対象ロール",
  cmd AS "操作"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
