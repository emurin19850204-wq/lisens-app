-- ============================================
-- LISENS - RLSポリシー修正SQL
-- anon（匿名）ユーザーにも読み書きを許可
-- Supabase SQL Editor で実行してください
-- ============================================

-- 既存の「認証済みユーザーは読み取り可能」ポリシーを削除
DROP POLICY IF EXISTS "認証済みユーザーは読み取り可能" ON organizations;
DROP POLICY IF EXISTS "認証済みユーザーは読み取り可能" ON users;
DROP POLICY IF EXISTS "認証済みユーザーは読み取り可能" ON curricula;
DROP POLICY IF EXISTS "認証済みユーザーは読み取り可能" ON subjects;
DROP POLICY IF EXISTS "認証済みユーザーは読み取り可能" ON course_progresses;
DROP POLICY IF EXISTS "認証済みユーザーは読み取り可能" ON evaluations;
DROP POLICY IF EXISTS "認証済みユーザーは読み取り可能" ON evaluation_items;
DROP POLICY IF EXISTS "認証済みユーザーは読み取り可能" ON certification_levels;
DROP POLICY IF EXISTS "認証済みユーザーは読み取り可能" ON certifications;

-- 既存の「認証済みユーザーは書き込み可能」ポリシーを削除
DROP POLICY IF EXISTS "認証済みユーザーは書き込み可能" ON organizations;
DROP POLICY IF EXISTS "認証済みユーザーは書き込み可能" ON users;
DROP POLICY IF EXISTS "認証済みユーザーは書き込み可能" ON curricula;
DROP POLICY IF EXISTS "認証済みユーザーは書き込み可能" ON subjects;
DROP POLICY IF EXISTS "認証済みユーザーは書き込み可能" ON course_progresses;
DROP POLICY IF EXISTS "認証済みユーザーは書き込み可能" ON evaluations;
DROP POLICY IF EXISTS "認証済みユーザーは書き込み可能" ON evaluation_items;
DROP POLICY IF EXISTS "認証済みユーザーは書き込み可能" ON certification_levels;
DROP POLICY IF EXISTS "認証済みユーザーは書き込み可能" ON certifications;

-- 全ユーザー（anon + authenticated）に読み取り許可
CREATE POLICY "全ユーザー読み取り可能" ON organizations FOR SELECT USING (true);
CREATE POLICY "全ユーザー読み取り可能" ON users FOR SELECT USING (true);
CREATE POLICY "全ユーザー読み取り可能" ON curricula FOR SELECT USING (true);
CREATE POLICY "全ユーザー読み取り可能" ON subjects FOR SELECT USING (true);
CREATE POLICY "全ユーザー読み取り可能" ON course_progresses FOR SELECT USING (true);
CREATE POLICY "全ユーザー読み取り可能" ON evaluations FOR SELECT USING (true);
CREATE POLICY "全ユーザー読み取り可能" ON evaluation_items FOR SELECT USING (true);
CREATE POLICY "全ユーザー読み取り可能" ON certification_levels FOR SELECT USING (true);
CREATE POLICY "全ユーザー読み取り可能" ON certifications FOR SELECT USING (true);

-- 全ユーザー（anon + authenticated）に書き込み許可
CREATE POLICY "全ユーザー書き込み可能" ON organizations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全ユーザー書き込み可能" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全ユーザー書き込み可能" ON curricula FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全ユーザー書き込み可能" ON subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全ユーザー書き込み可能" ON course_progresses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全ユーザー書き込み可能" ON evaluations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全ユーザー書き込み可能" ON evaluation_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全ユーザー書き込み可能" ON certification_levels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全ユーザー書き込み可能" ON certifications FOR ALL USING (true) WITH CHECK (true);
