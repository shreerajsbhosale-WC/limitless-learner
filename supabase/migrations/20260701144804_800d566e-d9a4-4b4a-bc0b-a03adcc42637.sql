DROP POLICY IF EXISTS "self update" ON public.group_members;
REVOKE UPDATE ON public.group_members FROM authenticated;

CREATE OR REPLACE FUNCTION public.add_group_xp(_delta int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  capped int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF _delta IS NULL OR _delta <= 0 THEN
    RETURN;
  END IF;
  capped := LEAST(_delta, 500);
  UPDATE public.group_members
     SET xp_contributed = xp_contributed + capped
   WHERE user_id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.add_group_xp(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_group_xp(int) TO authenticated;