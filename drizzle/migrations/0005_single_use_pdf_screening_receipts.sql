CREATE TABLE public.screening_pdf_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pdf_hash text NOT NULL CHECK (pdf_hash ~ '^[0-9a-f]{64}$'),
  source_hash text NOT NULL CHECK (source_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.screening_pdf_receipts TO service_role;
ALTER TABLE public.screening_pdf_receipts ENABLE ROW LEVEL SECURITY;
CREATE INDEX screening_pdf_receipts_expiry ON public.screening_pdf_receipts (expires_at) WHERE consumed_at IS NULL;

CREATE FUNCTION public.consume_screening_pdf_receipt(p_id uuid, p_user_id uuid, p_pdf_hash text, p_source_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.screening_pdf_receipts
  SET consumed_at = now()
  WHERE id = p_id AND user_id = p_user_id AND pdf_hash = p_pdf_hash AND source_hash = p_source_hash
    AND consumed_at IS NULL AND expires_at > now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count = 1;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_screening_pdf_receipt(uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_screening_pdf_receipt(uuid, uuid, text, text) TO service_role;