
-- Habits
CREATE TABLE public.habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  emoji text DEFAULT '✨',
  is_preset boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habits TO authenticated;
GRANT ALL ON public.habits TO service_role;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own habits" ON public.habits FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Habit completions (one per habit per day)
CREATE TABLE public.habit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (habit_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habit_logs TO authenticated;
GRANT ALL ON public.habit_logs TO service_role;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own habit logs" ON public.habit_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Focus / pomodoro sessions
CREATE TABLE public.focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  minutes int NOT NULL,
  completed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.focus_sessions TO authenticated;
GRANT ALL ON public.focus_sessions TO service_role;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own focus" ON public.focus_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Study groups
CREATE TABLE public.study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  join_code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_groups TO authenticated;
GRANT ALL ON public.study_groups TO service_role;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_contributed int NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO authenticated;
GRANT ALL ON public.group_members TO service_role;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Security-definer membership check to avoid recursion
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = _group_id AND user_id = _user_id);
$$;

CREATE POLICY "members can read groups" ON public.study_groups FOR SELECT
  USING (auth.uid() = owner_id OR public.is_group_member(id, auth.uid()));
CREATE POLICY "owner manages groups" ON public.study_groups FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "members read members" ON public.group_members FOR SELECT
  USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "self join leave" ON public.group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "self update" ON public.group_members FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "self delete" ON public.group_members FOR DELETE
  USING (auth.uid() = user_id);
