-- ============================================
-- LISENS - セキュリティ堅牢化SQL
-- ※ 本番(project: jofeqcksoiounnxobezj)には migration
--   "lisens_security_hardening" として適用済み。
--   再現/別環境用に冪等な形で記録しておく。
-- ============================================

-- --------------------------------------------
-- 1. promotions テーブルをスタッフ限定に制限
--    （昇給/昇格レビュー用とみられる機微データ。元は public 全開放だった）
-- --------------------------------------------
DROP POLICY IF EXISTS promotions_select_all ON public.promotions;
DROP POLICY IF EXISTS promotions_insert_all ON public.promotions;
DROP POLICY IF EXISTS promotions_update_all ON public.promotions;
DROP POLICY IF EXISTS promotions_delete_all ON public.promotions;
DROP POLICY IF EXISTS rls_promotions_select ON public.promotions;
DROP POLICY IF EXISTS rls_promotions_insert ON public.promotions;
DROP POLICY IF EXISTS rls_promotions_update ON public.promotions;
DROP POLICY IF EXISTS rls_promotions_delete ON public.promotions;

CREATE POLICY "rls_promotions_select" ON public.promotions
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "rls_promotions_insert" ON public.promotions
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "rls_promotions_update" ON public.promotions
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "rls_promotions_delete" ON public.promotions
  FOR DELETE TO authenticated USING (public.is_admin());

-- --------------------------------------------
-- 2. update_updated_at の search_path を固定
-- --------------------------------------------
ALTER FUNCTION public.update_updated_at() SET search_path = public, pg_temp;

-- --------------------------------------------
-- 3. ヘルパー関数を anon から呼べないようにする
--    重要: authenticated への EXECUTE は必ず維持すること。
--    これらは RLS ポリシー内でログインユーザーのクエリとして評価されるため、
--    authenticated を剥奪すると全テーブルのRLSが壊れる。
--    （Advisorの "authenticated ... SECURITY DEFINER" WARN は設計上の許容事項）
-- --------------------------------------------
DO $$
DECLARE fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.get_my_role()','public.get_my_user_id()','public.get_my_org_id()',
    'public.is_staff()','public.is_admin()','public.is_evaluator_or_above()'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', fn);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn);
  END LOOP;
END $$;

-- --------------------------------------------
-- 4. 漏洩パスワード保護（SQL不可・ダッシュボード設定）
--    Authentication > Policies の "Leaked password protection" をON（HaveIBeenPwned照合）
-- --------------------------------------------
