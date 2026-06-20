-- Little Genius - Supabase Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new)

-- 1. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE content_status AS ENUM ('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE user_account_status AS ENUM ('active', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. USERS TABLE (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'user',
  rank TEXT NOT NULL DEFAULT 'Science Cadet',
  xp INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  modules_completed INTEGER NOT NULL DEFAULT 0,
  status user_account_status NOT NULL DEFAULT 'active',
  joined DATE NOT NULL DEFAULT CURRENT_DATE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. MODULES TABLE
CREATE TABLE IF NOT EXISTS public.modules (
  id BIGSERIAL PRIMARY KEY,
  tier INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🔬',
  description TEXT,
  thumbnail_url TEXT,
  locked BOOLEAN NOT NULL DEFAULT true,
  domains TEXT[] NOT NULL DEFAULT '{}',
  status content_status NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. LESSONS (each step within a module)
CREATE TABLE IF NOT EXISTS public.lessons (
  id BIGSERIAL PRIMARY KEY,
  module_id BIGINT NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  video_url TEXT,
  video_duration TEXT,
  knowledge_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(module_id, step_number)
);

-- 5. QUIZZES
CREATE TABLE IF NOT EXISTS public.quizzes (
  id BIGSERIAL PRIMARY KEY,
  module_id BIGINT NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  lesson_id BIGINT REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Quiz',
  passing_score INTEGER NOT NULL DEFAULT 80,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  time_limit INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS time_limit INTEGER NOT NULL DEFAULT 0;

-- 6. QUIZ QUESTIONS
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id BIGSERIAL PRIMARY KEY,
  quiz_id BIGINT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_index INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. SHORTS
CREATE TABLE IF NOT EXISTS public.shorts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  domain TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  duration TEXT NOT NULL DEFAULT '0:30',
  module_id BIGINT REFERENCES public.modules(id) ON DELETE SET NULL,
  star INTEGER NOT NULL DEFAULT 1,
  thumbnail_url TEXT,
  status content_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. USER PROGRESS (per-module progress for each kid)
CREATE TABLE IF NOT EXISTS public.user_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  module_id BIGINT NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  stars INTEGER NOT NULL DEFAULT 0 CHECK (stars >= 0 AND stars <= 3),
  steps_completed INTEGER[] NOT NULL DEFAULT '{}',
  quiz_scores JSONB DEFAULT '[]'::jsonb,
  completed BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- 8.5. BATTLES & SHORT WATCH TRACKING
CREATE TABLE IF NOT EXISTS public.battles (
  id BIGSERIAL PRIMARY KEY,
  module_id BIGINT NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  status content_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_shorts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  short_id BIGINT NOT NULL REFERENCES public.shorts(id) ON DELETE CASCADE,
  watched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, short_id)
);

CREATE INDEX IF NOT EXISTS idx_battles_module ON public.battles(module_id);
CREATE INDEX IF NOT EXISTS idx_user_shorts_user ON public.user_shorts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_shorts_short ON public.user_shorts(short_id);

-- 9. BADGES & USER BADGES
CREATE TABLE IF NOT EXISTS public.badges (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '🏆',
  criteria JSONB
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id BIGINT NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- 10. DAILY LOGS (streak tracking)
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  login_date DATE NOT NULL DEFAULT CURRENT_DATE,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, login_date)
);

-- 11. SEED DATA: RANKS
CREATE TABLE IF NOT EXISTS public.ranks (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  min_xp INTEGER NOT NULL DEFAULT 0,
  icon TEXT NOT NULL DEFAULT '🎖️'
);

INSERT INTO public.ranks (title, min_xp, icon) VALUES
  ('Science Cadet', 0, '🎖️'),
  ('Spark Explorer', 1000, '🎖️'),
  ('Atom Scout', 2500, '🎖️'),
  ('Bio Ranger', 5000, '🎖️'),
  ('Geo Pioneer', 8000, '🎖️'),
  ('Quantum Apprentice', 12000, '🎖️'),
  ('Stellar Knight', 18000, '⭐'),
  ('Nova Commander', 25000, '⭐'),
  ('Spark Admiral', 35000, '🌟'),
  ('Supreme Spark Commander', 50000, '🌟')
ON CONFLICT DO NOTHING;

-- 12. SEED DATA: BADGES
INSERT INTO public.badges (name, description, icon, criteria) VALUES
  ('First Steps', 'Complete your first module', '👣', '{"type": "modules_completed", "count": 1}'),
  ('Star Collector', 'Earn 3 stars on any module', '⭐', '{"type": "perfect_module", "count": 1}'),
  ('Quiz Whiz', 'Score 100% on any quiz', '🧠', '{"type": "perfect_quiz", "count": 1}'),
  ('Streak Master', 'Maintain a 7-day streak', '🔥', '{"type": "streak", "count": 7}'),
  ('Science Explorer', 'Complete 5 modules', '🔬', '{"type": "modules_completed", "count": 5}'),
  ('Knowledge Seeker', 'Watch 10 shorts', '📺', '{"type": "shorts_watched", "count": 10}')
ON CONFLICT DO NOTHING;

-- 13. INDEXES
CREATE INDEX IF NOT EXISTS idx_modules_tier ON public.modules(tier);
CREATE INDEX IF NOT EXISTS idx_modules_status ON public.modules(status);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_module ON public.quizzes(module_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_shorts_module ON public.shorts(module_id);
CREATE INDEX IF NOT EXISTS idx_shorts_status ON public.shorts(status);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_module ON public.user_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user ON public.daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON public.daily_logs(login_date);

-- 14. ROW LEVEL SECURITY
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_shorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- Everyone can read published modules, lessons, quizzes, shorts
DROP POLICY IF EXISTS "Published content is public" ON public.modules;
CREATE POLICY "Published content is public" ON public.modules
  FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "Lessons of published modules" ON public.lessons;
CREATE POLICY "Lessons of published modules" ON public.lessons
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.modules WHERE id = module_id AND status = 'published'));
DROP POLICY IF EXISTS "Quizzes of published modules" ON public.quizzes;
CREATE POLICY "Quizzes of published modules" ON public.quizzes
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.modules WHERE id = module_id AND status = 'published'));
DROP POLICY IF EXISTS "Questions of published quizzes" ON public.quiz_questions;
CREATE POLICY "Questions of published quizzes" ON public.quiz_questions
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.quizzes q JOIN public.modules m ON q.module_id = m.id WHERE q.id = quiz_id AND m.status = 'published'));
DROP POLICY IF EXISTS "Published shorts" ON public.shorts;
CREATE POLICY "Published shorts" ON public.shorts
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Published battles" ON public.battles;
CREATE POLICY "Published battles" ON public.battles
  FOR SELECT USING (status = 'published');

-- Users can read their own data
DROP POLICY IF EXISTS "Users read own data" ON public.users;
CREATE POLICY "Users read own data" ON public.users
  FOR SELECT USING (auth.uid() = auth_id);
DROP POLICY IF EXISTS "Public leaderboard users" ON public.users;
CREATE POLICY "Public leaderboard users" ON public.users
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users update own profile" ON public.users;
CREATE POLICY "Users update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);
DROP POLICY IF EXISTS "Users read own progress" ON public.user_progress;
CREATE POLICY "Users read own progress" ON public.user_progress
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND auth_id = auth.uid()));
DROP POLICY IF EXISTS "Users insert own progress" ON public.user_progress;
CREATE POLICY "Users insert own progress" ON public.user_progress
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND auth_id = auth.uid()));
DROP POLICY IF EXISTS "Users update own progress" ON public.user_progress;
CREATE POLICY "Users update own progress" ON public.user_progress
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND auth_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND auth_id = auth.uid()));
DROP POLICY IF EXISTS "Users delete own progress" ON public.user_progress;
CREATE POLICY "Users delete own progress" ON public.user_progress
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND auth_id = auth.uid()));
DROP POLICY IF EXISTS "Users read own badges" ON public.user_badges;
CREATE POLICY "Users read own badges" ON public.user_badges
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND auth_id = auth.uid()));
DROP POLICY IF EXISTS "Users read own daily_logs" ON public.daily_logs;
CREATE POLICY "Users read own daily_logs" ON public.daily_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND auth_id = auth.uid()));
DROP POLICY IF EXISTS "Users insert own daily_logs" ON public.daily_logs;
CREATE POLICY "Users insert own daily_logs" ON public.daily_logs
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND auth_id = auth.uid()));
DROP POLICY IF EXISTS "Users read own shorts" ON public.user_shorts;
CREATE POLICY "Users read own shorts" ON public.user_shorts
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND auth_id = auth.uid()));
DROP POLICY IF EXISTS "Users insert own shorts" ON public.user_shorts;
CREATE POLICY "Users insert own shorts" ON public.user_shorts
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND auth_id = auth.uid()));

-- Helper function to check if the current user is an admin without RLS recursion
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

-- Admins can do everything
DROP POLICY IF EXISTS "Admins full access users" ON public.users;
CREATE POLICY "Admins full access users" ON public.users
  FOR ALL USING (
    public.is_admin()
  );
DROP POLICY IF EXISTS "Admins full access modules" ON public.modules;
CREATE POLICY "Admins full access modules" ON public.modules
  FOR ALL USING (
    public.is_admin()
  );
DROP POLICY IF EXISTS "Admins full access lessons" ON public.lessons;
CREATE POLICY "Admins full access lessons" ON public.lessons
  FOR ALL USING (
    public.is_admin()
  );
DROP POLICY IF EXISTS "Admins full access quizzes" ON public.quizzes;
CREATE POLICY "Admins full access quizzes" ON public.quizzes
  FOR ALL USING (
    public.is_admin()
  );
DROP POLICY IF EXISTS "Admins full access questions" ON public.quiz_questions;
CREATE POLICY "Admins full access questions" ON public.quiz_questions
  FOR ALL USING (
    public.is_admin()
  );
DROP POLICY IF EXISTS "Admins full access shorts" ON public.shorts;
CREATE POLICY "Admins full access shorts" ON public.shorts
  FOR ALL USING (
    public.is_admin()
  );
DROP POLICY IF EXISTS "Admins full access progress" ON public.user_progress;
CREATE POLICY "Admins full access progress" ON public.user_progress
  FOR ALL USING (
    public.is_admin()
  );
DROP POLICY IF EXISTS "Admins full access badges" ON public.user_badges;
CREATE POLICY "Admins full access badges" ON public.user_badges
  FOR ALL USING (
    public.is_admin()
  );
DROP POLICY IF EXISTS "Admins full access daily_logs" ON public.daily_logs;
CREATE POLICY "Admins full access daily_logs" ON public.daily_logs
  FOR ALL USING (
    public.is_admin()
  );

-- 15. FUNCTIONS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, username, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    CASE WHEN NEW.email = 'slchaves0000@gmail.com' THEN 'admin' ELSE 'user' END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
