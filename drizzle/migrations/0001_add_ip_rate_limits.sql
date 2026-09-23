CREATE TABLE IF NOT EXISTS public.ip_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  bucket text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 0,
  UNIQUE (ip_hash, bucket)
);

GRANT ALL ON public.ip_rate_limits TO service_role;

ALTER TABLE public.ip_rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies on purpose: only the service role (server-side) may touch this.

CREATE OR REPLACE FUNCTION public.consume_ip_rate_limit(
  _ip_hash text,
  _bucket text,
  _max integer,
  _window_seconds integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.ip_rate_limits%ROWTYPE;
BEGIN
  INSERT INTO public.ip_rate_limits (ip_hash, bucket, window_start, count)
  VALUES (_ip_hash, _bucket, now(), 0)
  ON CONFLICT (ip_hash, bucket) DO NOTHING;

  SELECT * INTO _row FROM public.ip_rate_limits
  WHERE ip_hash = _ip_hash AND bucket = _bucket FOR UPDATE;

  IF _row.window_start < now() - make_interval(secs => _window_seconds) THEN
    UPDATE public.ip_rate_limits
      SET window_start = now(), count = 1
      WHERE id = _row.id;
    RETURN true;
  END IF;

  IF _row.count >= _max THEN
    RETURN false;
  END IF;

  UPDATE public.ip_rate_limits SET count = _row.count + 1 WHERE id = _row.id;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ip_rate_limit(text, text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_ip_rate_limit(text, text, integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public.consume_ip_rate_limit(text, text, integer, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ip_rate_limit(text, text, integer, integer) TO service_role;