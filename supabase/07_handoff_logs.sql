-- ============================================
-- LISENS - 引継ぎログ（学習者ごとの日報形式の引継ぎ）
-- 日付・担当者・完了項目・次回項目を1行ずつ追記していくテーブル
-- ※ 本番(project: jofeqcksoiounnxobezj)に migration "create_handoff_logs" として適用済み
-- ============================================
CREATE TABLE IF NOT EXISTS public.handoff_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  learner_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  handler TEXT NOT NULL,
  completed_items TEXT,
  next_items TEXT,
  created_by TEXT REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_handoff_logs_learner
  ON public.handoff_logs(learner_id, log_date DESC, created_at DESC);
ALTER TABLE public.handoff_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rls_handoff_logs_select" ON public.handoff_logs;
DROP POLICY IF EXISTS "rls_handoff_logs_insert" ON public.handoff_logs;
DROP POLICY IF EXISTS "rls_handoff_logs_update" ON public.handoff_logs;
DROP POLICY IF EXISTS "rls_handoff_logs_delete" ON public.handoff_logs;
CREATE POLICY "rls_handoff_logs_select" ON public.handoff_logs
  FOR SELECT TO authenticated USING (public.is_staff() OR learner_id = public.get_my_user_id());
CREATE POLICY "rls_handoff_logs_insert" ON public.handoff_logs
  FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "rls_handoff_logs_update" ON public.handoff_logs
  FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY "rls_handoff_logs_delete" ON public.handoff_logs
  FOR DELETE TO authenticated USING (public.is_admin());
DROP TRIGGER IF EXISTS update_handoff_logs_updated_at ON public.handoff_logs;
CREATE TRIGGER update_handoff_logs_updated_at BEFORE UPDATE ON public.handoff_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
