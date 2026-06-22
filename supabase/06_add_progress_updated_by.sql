-- ============================================
-- LISENS - course_progresses に updated_by を追加
-- 進捗/引継ぎメモを最後に更新した担当者を記録（担当者間の引継ぎ追跡用）
-- ※ 本番(project: jofeqcksoiounnxobezj)に migration
--   "add_course_progresses_updated_by" として適用済み
-- ============================================
ALTER TABLE public.course_progresses
  ADD COLUMN IF NOT EXISTS updated_by TEXT REFERENCES public.users(id);

COMMENT ON COLUMN public.course_progresses.updated_by IS '進捗を最後に更新した担当者のユーザーID（引継ぎ追跡用）';
