-- Clean up orphaned auth users and fix signup issues
-- Run this in Supabase SQL Editor

-- 1. Show existing auth users (check if any are orphaned)
SELECT id, email, raw_user_meta_data, created_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Show existing public profiles
SELECT * FROM public.users;

-- 3. Check the trigger is properly set
SELECT tgname, tgtype, tgrelid::regclass AS table_name
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- 4. Drop and recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (auth_id, username, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    CASE WHEN NEW.email = 'slchaves0000@gmail.com' THEN 'admin'::user_role ELSE 'user'::user_role END
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, just return
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 5. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Helper function to check if the current user is an admin without RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_id = auth.uid() AND role = 'admin'::public.user_role
  );
END;
$$;

-- 7. Drop and recreate all Admin RLS policies to use the helper function
DROP POLICY IF EXISTS "Admins full access users" ON public.users;
CREATE POLICY "Admins full access users" ON public.users
  FOR ALL USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admins full access modules" ON public.modules;
CREATE POLICY "Admins full access modules" ON public.modules
  FOR ALL USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admins full access lessons" ON public.lessons;
CREATE POLICY "Admins full access lessons" ON public.lessons
  FOR ALL USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admins full access quizzes" ON public.quizzes;
CREATE POLICY "Admins full access quizzes" ON public.quizzes
  FOR ALL USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admins full access questions" ON public.quiz_questions;
CREATE POLICY "Admins full access questions" ON public.quiz_questions
  FOR ALL USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admins full access shorts" ON public.shorts;
CREATE POLICY "Admins full access shorts" ON public.shorts
  FOR ALL USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admins full access progress" ON public.user_progress;
CREATE POLICY "Admins full access progress" ON public.user_progress
  FOR ALL USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admins full access badges" ON public.user_badges;
CREATE POLICY "Admins full access badges" ON public.user_badges
  FOR ALL USING ( public.is_admin() );
