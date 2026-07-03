
-- 1) Lock down group_members.xp_contributed so clients cannot self-report XP
--    via direct PostgREST writes. The column keeps its default (0) and can
--    only be updated by trusted server-side code (service_role).
REVOKE INSERT (xp_contributed), UPDATE (xp_contributed) ON public.group_members FROM authenticated;
REVOKE INSERT (xp_contributed), UPDATE (xp_contributed) ON public.group_members FROM anon;

-- Tighten the join policy to make it explicit that new members start at 0 XP.
DROP POLICY IF EXISTS "self join leave" ON public.group_members;
CREATE POLICY "self join leave" ON public.group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id AND xp_contributed = 0);

-- 2) Track per-group last sync time so XP can be computed from real activity.
ALTER TABLE public.group_members
  ADD COLUMN IF NOT EXISTS last_xp_sync_at timestamptz NOT NULL DEFAULT now();

-- 3) Replace the vulnerable add_group_xp function with a server-only
--    verifiable XP sync scoped to a single group. Earned XP is derived from
--    completed focus minutes + habit logs since the caller's last sync for
--    THIS specific group. Capped per call. Only service_role can execute.
DROP FUNCTION IF EXISTS public.add_group_xp(int);

CREATE OR REPLACE FUNCTION public.sync_group_xp(_user_id uuid, _group_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_sync timestamptz;
  focus_minutes int;
  habit_count int;
  earned int;
  capped int;
BEGIN
  IF _user_id IS NULL OR _group_id IS NULL THEN
    RAISE EXCEPTION 'invalid arguments';
  END IF;

  SELECT last_xp_sync_at INTO last_sync
    FROM public.group_members
   WHERE user_id = _user_id AND group_id = _group_id;
  IF last_sync IS NULL THEN
    RAISE EXCEPTION 'not a member';
  END IF;

  SELECT COALESCE(SUM(minutes), 0) INTO focus_minutes
    FROM public.focus_sessions
   WHERE user_id = _user_id AND completed = true AND created_at > last_sync;

  SELECT COUNT(*) INTO habit_count
    FROM public.habit_logs
   WHERE user_id = _user_id AND created_at > last_sync;

  earned := focus_minutes + habit_count * 10;
  capped := GREATEST(0, LEAST(earned, 500));

  UPDATE public.group_members
     SET xp_contributed = xp_contributed + capped,
         last_xp_sync_at = now()
   WHERE user_id = _user_id AND group_id = _group_id;

  RETURN capped;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_group_xp(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_group_xp(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.sync_group_xp(uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.sync_group_xp(uuid, uuid) TO service_role;

-- 4) Restrict remaining SECURITY DEFINER functions in public schema so anon
--    and authenticated roles cannot call them directly through the API.
--    - handle_new_user() is a trigger and needs no user EXECUTE.
--    - is_group_member() is invoked by RLS policies and must stay callable
--      by authenticated for policy evaluation, but does not need anon access.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;

REVOKE ALL ON FUNCTION public.is_group_member(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_group_member(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated;
