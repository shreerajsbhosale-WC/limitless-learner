CREATE OR REPLACE FUNCTION public.redeem_screening_case(p_case_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.screening_cases
  SET status = 'redeemed', updated_at = now()
  WHERE id = p_case_id
    AND user_id = p_user_id
    AND status = 'approved'
    AND COALESCE((approval->>'expiresAt')::bigint, 0) > floor(extract(epoch FROM now()) * 1000)::bigint;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count = 1 THEN
    PERFORM public.append_override_audit('override_redeemed', p_user_id::text, p_case_id::text, '{}'::jsonb);
  END IF;
  RETURN v_count = 1;
END;
$$;
REVOKE ALL ON FUNCTION public.redeem_screening_case(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_screening_case(uuid, uuid) TO service_role;