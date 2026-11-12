CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('reviewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.screening_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('text', 'pdf')),
  mode text NOT NULL CHECK (mode IN ('input', 'document')),
  content_hash text NOT NULL CHECK (content_hash ~ '^[0-9a-f]{64}$'),
  excerpt text CHECK (char_length(excerpt) <= 500),
  categories text[] NOT NULL DEFAULT '{}',
  internal_reasons text[] NOT NULL DEFAULT '{}',
  verdict text NOT NULL CHECK (verdict IN ('review', 'block')),
  profile text NOT NULL CHECK (profile IN ('quote_only', 'document_sandbox')),
  manual_review boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending_review', 'approved', 'denied', 'redeemed', 'revoked', 'blocked')),
  justification text CHECK (char_length(justification) <= 1000),
  approval jsonb,
  decision jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  appealed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.screening_cases TO service_role;
ALTER TABLE public.screening_cases ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX screening_cases_one_live_per_content ON public.screening_cases (user_id, content_hash) WHERE status IN ('open', 'pending_review', 'approved');
CREATE INDEX screening_cases_queue ON public.screening_cases (appealed_at) WHERE status = 'pending_review';
CREATE INDEX screening_cases_user ON public.screening_cases (user_id, created_at DESC);

CREATE TABLE public.override_audit (
  seq bigserial PRIMARY KEY,
  ts bigint NOT NULL,
  type text NOT NULL,
  user_id text NOT NULL DEFAULT '',
  case_id text NOT NULL DEFAULT '',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  prev_hash text NOT NULL,
  hash text NOT NULL UNIQUE
);
GRANT ALL ON public.override_audit TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.override_audit_seq_seq TO service_role;
ALTER TABLE public.override_audit ENABLE ROW LEVEL SECURITY;
CREATE INDEX override_audit_user_type_ts ON public.override_audit (user_id, type, ts);
CREATE FUNCTION public.prevent_override_audit_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'override_audit is append-only';
END;
$$;
CREATE TRIGGER override_audit_no_update_delete BEFORE UPDATE OR DELETE ON public.override_audit FOR EACH ROW EXECUTE FUNCTION public.prevent_override_audit_mutation();
CREATE TRIGGER override_audit_no_truncate BEFORE TRUNCATE ON public.override_audit FOR EACH STATEMENT EXECUTE FUNCTION public.prevent_override_audit_mutation();

CREATE FUNCTION public.append_override_audit(p_type text, p_user_id text, p_case_id text, p_data jsonb)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_seq bigint;
  v_ts bigint;
  v_prev text;
  v_hash text;
  v_data jsonb := COALESCE(p_data, '{}'::jsonb);
BEGIN
  PERFORM pg_advisory_xact_lock(181991457);
  v_seq := nextval('public.override_audit_seq_seq');
  v_ts := floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint;
  SELECT hash INTO v_prev FROM public.override_audit ORDER BY seq DESC LIMIT 1;
  v_prev := COALESCE(v_prev, 'GENESIS');
  v_hash := encode(digest(concat_ws('|', v_prev, v_seq::text, v_ts::text, p_type, COALESCE(p_user_id, ''), COALESCE(p_case_id, ''), v_data::text), 'sha256'), 'hex');
  INSERT INTO public.override_audit(seq, ts, type, user_id, case_id, data, prev_hash, hash)
  VALUES (v_seq, v_ts, p_type, COALESCE(p_user_id, ''), COALESCE(p_case_id, ''), v_data, v_prev, v_hash);
  RETURN v_seq;
END;
$$;
REVOKE ALL ON FUNCTION public.append_override_audit(text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.append_override_audit(text, text, text, jsonb) TO service_role;

CREATE FUNCTION public.redeem_screening_case(p_case_id uuid, p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.screening_cases
  SET status = 'redeemed', updated_at = now()
  WHERE id = p_case_id AND user_id = p_user_id AND status = 'approved'
    AND COALESCE((approval->>'expiresAt')::bigint, 0) > floor(extract(epoch FROM now()) * 1000)::bigint;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count = 1;
END;
$$;
REVOKE ALL ON FUNCTION public.redeem_screening_case(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_screening_case(uuid, uuid) TO service_role;