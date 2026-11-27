-- =====================================================================
-- SMART CAMPUS RECRUITMENT SYSTEM (CampusHire)
-- Application & Offer Management Migration (Idempotent & Non-Destructive)
-- Reuses public.applications to avoid duplicate tables.
-- Run AFTER schema.sql and migration_audit_fixes.sql.
-- =====================================================================

-- 1. Offer status enum
DO $$ BEGIN
  CREATE TYPE public.offer_status_enum AS ENUM ('Pending', 'Accepted', 'Declined');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add offer columns to public.applications
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS offer_status public.offer_status_enum,
  ADD COLUMN IF NOT EXISTS offer_package_lpa NUMERIC(5,2) CHECK (offer_package_lpa IS NULL OR offer_package_lpa >= 0),
  ADD COLUMN IF NOT EXISTS offer_date DATE,
  ADD COLUMN IF NOT EXISTS offer_details TEXT,
  ADD COLUMN IF NOT EXISTS offer_issued_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS offer_responded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_applications_offer_status
  ON public.applications(offer_status)
  WHERE offer_status IS NOT NULL;

-- 3. Update tampering-prevention triggers to allow ONLY the validated
--    SECURITY DEFINER RPC public.respond_to_offer() to record student
--    offer acceptance/decline and update student placement status.
CREATE OR REPLACE FUNCTION public.prevent_student_placement_tampering()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT public.is_admin()
     AND COALESCE(current_setting('app.trusted_offer_response', true), '') <> 'true' THEN
    NEW.is_placed := OLD.is_placed;
    NEW.current_company := OLD.current_company;
    NEW.package_lpa := OLD.package_lpa;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.prevent_student_placement_tampering() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.prevent_student_application_tampering()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT public.is_admin()
     AND COALESCE(current_setting('app.trusted_offer_response', true), '') <> 'true' THEN
    RAISE EXCEPTION 'Only administrators can modify application records';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.prevent_student_application_tampering() FROM PUBLIC;

-- 4. Validate admin offer updates on public.applications
CREATE OR REPLACE FUNCTION public.validate_application_offer_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.offer_status IS NOT NULL AND NEW.status <> 'Selected'::public.application_status_enum THEN
    RAISE EXCEPTION 'An offer can only be issued or active when application status is Selected';
  END IF;

  IF NEW.offer_package_lpa IS NOT NULL AND NEW.offer_package_lpa < 0 THEN
    RAISE EXCEPTION 'Offer package cannot be negative';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.validate_application_offer_update() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_validate_application_offer_update ON public.applications;
CREATE TRIGGER trg_validate_application_offer_update
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.validate_application_offer_update();

-- 5. Secure RPC for students to Accept or Decline a Pending Offer
CREATE OR REPLACE FUNCTION public.respond_to_offer(
  p_application_id UUID,
  p_decision TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_app RECORD;
  v_company_name TEXT;
  v_final_package NUMERIC(5,2);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.is_student() THEN
    RAISE EXCEPTION 'Only student accounts can respond to job offers';
  END IF;

  IF p_decision NOT IN ('Accepted', 'Declined') THEN
    RAISE EXCEPTION 'Invalid offer decision. Must be Accepted or Declined.';
  END IF;

  SELECT
    a.id,
    a.student_id,
    a.job_id,
    a.status,
    a.offer_status,
    a.offer_package_lpa,
    j.title AS job_title,
    j.salary_max_lpa,
    j.salary_min_lpa,
    c.name AS company_name
  INTO v_app
  FROM public.applications a
  JOIN public.jobs j ON j.id = a.job_id
  JOIN public.companies c ON c.id = j.company_id
  WHERE a.id = p_application_id
  FOR UPDATE OF a;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  IF v_app.student_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'You can only respond to your own job offers';
  END IF;

  IF v_app.status <> 'Selected'::public.application_status_enum THEN
    RAISE EXCEPTION 'Cannot respond to an offer for a non-selected application';
  END IF;

  IF v_app.offer_status IS DISTINCT FROM 'Pending'::public.offer_status_enum THEN
    RAISE EXCEPTION 'This offer is no longer pending (current status: %)', COALESCE(v_app.offer_status::TEXT, 'Not Issued');
  END IF;

  -- Mark trusted transaction context for triggers
  PERFORM set_config('app.trusted_offer_response', 'true', true);

  UPDATE public.applications
  SET
    offer_status = p_decision::public.offer_status_enum,
    offer_responded_at = NOW(),
    updated_at = NOW()
  WHERE id = p_application_id;

  INSERT INTO public.application_status_history (
    application_id,
    status,
    notes,
    updated_by
  ) VALUES (
    p_application_id,
    'Selected'::public.application_status_enum,
    CASE
      WHEN p_decision = 'Accepted' THEN 'Student accepted the official job offer.'
      ELSE 'Student declined the official job offer.'
    END,
    auth.uid()
  );

  IF p_decision = 'Accepted' THEN
    v_company_name := COALESCE(v_app.company_name, v_app.job_title);
    v_final_package := COALESCE(v_app.offer_package_lpa, v_app.salary_max_lpa, v_app.salary_min_lpa);

    UPDATE public.student_profiles
    SET
      is_placed = TRUE,
      current_company = v_company_name,
      package_lpa = v_final_package,
      updated_at = NOW()
    WHERE id = auth.uid();
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'application_id', p_application_id,
    'offer_status', p_decision
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.respond_to_offer(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.respond_to_offer(UUID, TEXT) TO authenticated;
