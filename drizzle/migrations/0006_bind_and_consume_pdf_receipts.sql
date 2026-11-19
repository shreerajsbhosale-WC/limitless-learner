ALTER TABLE public.screening_pdf_receipts ADD COLUMN extracted_text_hash text CHECK (extracted_text_hash IS NULL OR extracted_text_hash ~ '^[0-9a-f]{64}$');

CREATE OR REPLACE FUNCTION public.consume_screening_pdf_receipt(p_id uuid, p_user_id uuid, p_pdf_hash text, p_source_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.screening_pdf_receipts
  SET consumed_at = now(), extracted_text_hash = p_source_hash
  WHERE id = p_id AND user_id = p_user_id AND pdf_hash = p_pdf_hash
    AND (extracted_text_hash IS NULL OR extracted_text_hash = p_source_hash)
    AND consumed_at IS NULL AND expires_at > now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count = 1;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_screening_pdf_receipt(uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_screening_pdf_receipt(uuid, uuid, text, text) TO service_role;