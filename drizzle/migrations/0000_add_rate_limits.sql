CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 0,
  UNIQUE (user_id, bucket)
);

GRANT SELECT ON public.rate_limits TO authenticated;
GRANT ALL ON public.rate_limits TO service_role;

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own rate limits" ON public.rate_limits;
CREATE POLICY "Users can view their own rate limits"
  ON public.rate_limits FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.consume_rate_limit(_bucket text, _max integer, _window_seconds integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _now timestamptz := now();
  _row public.rate_limits%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limits (user_id, bucket, window_start, count)
  VALUES (_uid, _bucket, _now, 0)
  ON CONFLICT (user_id, bucket) DO NOTHING;

  SELECT * INTO _row FROM public.rate_limits
  WHERE user_id = _uid AND bucket = _bucket
  FOR UPDATE;

  IF _row.window_start < _now - make_interval(secs => _window_seconds) THEN
    UPDATE public.rate_limits SET window_start = _now, count = 1 WHERE id = _row.id;
    RETURN true;
  END IF;

  IF _row.count >= _max THEN
    RETURN false;
  END IF;

  UPDATE public.rate_limits SET count = count + 1 WHERE id = _row.id;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) TO authenticated;