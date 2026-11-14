CREATE FUNCTION public.file_screening_appeal(p_case_id uuid, p_user_id uuid, p_justification text, p_auto_approval jsonb DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_case public.screening_cases%ROWTYPE;
  v_strikes integer;
  v_pending integer;
  v_appeals integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('screening-appeal:' || p_user_id::text, 719328));
  SELECT * INTO v_case FROM public.screening_cases WHERE id = p_case_id AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status', 'not_found'); END IF;
  IF v_case.status <> 'open' THEN RETURN jsonb_build_object('status', 'invalid_state', 'caseStatus', v_case.status); END IF;
  IF char_length(btrim(COALESCE(p_justification, ''))) < 15 THEN RETURN jsonb_build_object('status', 'justification_too_short', 'min', 15); END IF;
  IF char_length(btrim(COALESCE(p_justification, ''))) > 1000 THEN RETURN jsonb_build_object('status', 'justification_too_long', 'max', 1000); END IF;

  SELECT count(*) INTO v_strikes FROM public.override_audit
    WHERE user_id = p_user_id::text AND type = 'strike' AND ts >= floor(extract(epoch FROM now() - interval '24 hours') * 1000)::bigint;
  IF v_strikes >= 5 THEN RETURN jsonb_build_object('status', 'locked'); END IF;
  SELECT count(*) INTO v_appeals FROM public.override_audit
    WHERE user_id = p_user_id::text AND type = 'appeal_filed' AND ts >= floor(extract(epoch FROM now() - interval '24 hours') * 1000)::bigint;
  IF v_appeals >= 5 THEN RETURN jsonb_build_object('status', 'rate_limited'); END IF;
  SELECT count(*) INTO v_pending FROM public.screening_cases WHERE user_id = p_user_id AND status = 'pending_review';
  IF v_pending >= 3 THEN RETURN jsonb_build_object('status', 'too_many_pending'); END IF;

  UPDATE public.screening_cases SET justification = btrim(p_justification), appealed_at = now(), updated_at = now()
    WHERE id = p_case_id;
  PERFORM public.append_override_audit('appeal_filed', p_user_id::text, p_case_id::text, '{}'::jsonb);

  IF p_auto_approval IS NOT NULL AND NOT v_case.manual_review AND v_strikes = 0 THEN
    UPDATE public.screening_cases SET status = 'approved', approval = p_auto_approval, updated_at = now() WHERE id = p_case_id;
    PERFORM public.append_override_audit('case_approved', p_user_id::text, p_case_id::text, jsonb_build_object('by', 'auto', 'note', 'auto-approved: low-risk signals only'));
    RETURN jsonb_build_object('status', 'approved', 'caseId', p_case_id);
  END IF;

  UPDATE public.screening_cases SET status = 'pending_review', updated_at = now() WHERE id = p_case_id;
  PERFORM public.append_override_audit('sent_to_review', p_user_id::text, p_case_id::text, '{}'::jsonb);
  RETURN jsonb_build_object('status', 'pending_review', 'caseId', p_case_id);
END;
$$;
REVOKE ALL ON FUNCTION public.file_screening_appeal(uuid, uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.file_screening_appeal(uuid, uuid, text, jsonb) TO service_role;

CREATE FUNCTION public.decide_screening_case(p_case_id uuid, p_reviewer_id uuid, p_decision text, p_note text, p_approval jsonb DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_case public.screening_cases%ROWTYPE;
BEGIN
  IF p_decision NOT IN ('approve', 'deny') THEN RETURN jsonb_build_object('status', 'invalid_decision'); END IF;
  SELECT * INTO v_case FROM public.screening_cases WHERE id = p_case_id FOR UPDATE;
  IF NOT FOUND OR v_case.status <> 'pending_review' THEN RETURN jsonb_build_object('status', 'invalid_state'); END IF;
  IF v_case.user_id = p_reviewer_id THEN RETURN jsonb_build_object('status', 'conflict_of_interest'); END IF;
  IF p_decision = 'approve' THEN
    IF p_approval IS NULL THEN RETURN jsonb_build_object('status', 'invalid_approval'); END IF;
    UPDATE public.screening_cases SET status = 'approved', approval = p_approval, decision = jsonb_build_object('by', p_reviewer_id, 'note', left(COALESCE(p_note, ''), 500), 'at', floor(extract(epoch FROM now()) * 1000)::bigint), updated_at = now() WHERE id = p_case_id;
    PERFORM public.append_override_audit('case_approved', v_case.user_id::text, p_case_id::text, jsonb_build_object('by', p_reviewer_id, 'note', left(COALESCE(p_note, ''), 500)));
    RETURN jsonb_build_object('status', 'approved');
  END IF;
  UPDATE public.screening_cases SET status = 'denied', decision = jsonb_build_object('by', p_reviewer_id, 'note', left(COALESCE(p_note, ''), 500), 'at', floor(extract(epoch FROM now()) * 1000)::bigint), updated_at = now() WHERE id = p_case_id;
  PERFORM public.append_override_audit('case_denied', v_case.user_id::text, p_case_id::text, jsonb_build_object('by', p_reviewer_id, 'note', left(COALESCE(p_note, ''), 500)));
  RETURN jsonb_build_object('status', 'denied');
END;
$$;
REVOKE ALL ON FUNCTION public.decide_screening_case(uuid, uuid, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decide_screening_case(uuid, uuid, text, text, jsonb) TO service_role;

CREATE FUNCTION public.verify_override_audit()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_row record;
  v_prev text := 'GENESIS';
  v_expected text;
  v_count bigint := 0;
BEGIN
  FOR v_row IN SELECT seq, ts, type, user_id, case_id, data, prev_hash, hash FROM public.override_audit ORDER BY seq LOOP
    v_expected := encode(digest(concat_ws('|', v_prev, v_row.seq::text, v_row.ts::text, v_row.type, v_row.user_id, v_row.case_id, v_row.data::text), 'sha256'), 'hex');
    IF v_row.prev_hash <> v_prev OR v_row.hash <> v_expected THEN
      RETURN jsonb_build_object('ok', false, 'brokenAt', v_row.seq, 'entries', v_count);
    END IF;
    v_prev := v_row.hash;
    v_count := v_count + 1;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'entries', v_count);
END;
$$;
REVOKE ALL ON FUNCTION public.verify_override_audit() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_override_audit() TO service_role;