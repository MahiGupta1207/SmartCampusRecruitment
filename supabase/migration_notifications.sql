-- =====================================================================
-- SMART CAMPUS RECRUITMENT SYSTEM (CampusHire)
-- Notifications System Migration (Idempotent & Non-Destructive)
-- Reuses existing public.notifications table from schema.sql
-- =====================================================================

-- 1. Enhance public.notifications with type & deduplication event_key
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS event_key TEXT;

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
  ON public.notifications (user_id, is_read, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_unique_user_event
  ON public.notifications (user_id, event_key)
  WHERE event_key IS NOT NULL;

-- 2. Replace permissive FOR ALL policy with strict per-operation RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view and manage their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users delete own notifications or admins" ON public.notifications;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Users delete own notifications or admins"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- Prevent non-admins from altering notification content/ownership on UPDATE (only is_read allowed)
CREATE OR REPLACE FUNCTION public.prevent_notification_tampering()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    NEW.user_id := OLD.user_id;
    NEW.title := OLD.title;
    NEW.message := OLD.message;
    NEW.link := OLD.link;
    NEW.type := OLD.type;
    NEW.event_key := OLD.event_key;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.prevent_notification_tampering() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_prevent_notification_tampering ON public.notifications;
CREATE TRIGGER trg_prevent_notification_tampering
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.prevent_notification_tampering();

-- 3. Trusted helper to insert notifications safely without duplicates
CREATE OR REPLACE FUNCTION public.create_system_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_type TEXT DEFAULT 'info',
  p_event_key TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.notifications (user_id, title, message, link, type, event_key)
  VALUES (p_user_id, p_title, p_message, p_link, COALESCE(p_type, 'info'), p_event_key)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.create_system_notification(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;

-- 4. Trigger: Notify admins when a new student registers
CREATE OR REPLACE FUNCTION public.notify_on_student_registration()
RETURNS TRIGGER AS $$
DECLARE
  v_admin RECORD;
BEGIN
  IF NEW.role = 'student'::public.user_role THEN
    FOR v_admin IN SELECT id FROM public.profiles WHERE role = 'admin'::public.user_role LOOP
      PERFORM public.create_system_notification(
        v_admin.id,
        'New Student Registered',
        COALESCE(NEW.full_name, 'A student') || ' (' || NEW.email || ') registered on CampusHire.',
        '/admin/students',
        'info',
        'student_reg:' || NEW.id::TEXT
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.notify_on_student_registration() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_notify_on_student_registration ON public.profiles;
CREATE TRIGGER trg_notify_on_student_registration
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_student_registration();

-- 5. Trigger: Notify student & admins when a new application is submitted
CREATE OR REPLACE FUNCTION public.notify_on_application_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_student_name TEXT;
  v_job_title TEXT;
  v_company_name TEXT;
  v_admin RECORD;
BEGIN
  SELECT full_name INTO v_student_name FROM public.profiles WHERE id = NEW.student_id;
  SELECT j.title, c.name INTO v_job_title, v_company_name
  FROM public.jobs j
  JOIN public.companies c ON c.id = j.company_id
  WHERE j.id = NEW.job_id;

  PERFORM public.create_system_notification(
    NEW.student_id,
    'Application Submitted',
    'Your application for ' || COALESCE(v_job_title, 'a role') || ' at ' || COALESCE(v_company_name, 'the company') || ' has been submitted.',
    '/student/applications',
    'success',
    'app_submit:' || NEW.id::TEXT
  );

  FOR v_admin IN SELECT id FROM public.profiles WHERE role = 'admin'::public.user_role LOOP
    PERFORM public.create_system_notification(
      v_admin.id,
      'New Job Application',
      COALESCE(v_student_name, 'A student') || ' applied for ' || COALESCE(v_job_title, 'a drive') || ' (' || COALESCE(v_company_name, 'Company') || ').',
      '/admin/applications',
      'info',
      'admin_app:' || NEW.id::TEXT
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.notify_on_application_insert() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_notify_on_application_insert ON public.applications;
CREATE TRIGGER trg_notify_on_application_insert
  AFTER INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_application_insert();

-- 6. Trigger: Notify student & admins on application status / offer updates
CREATE OR REPLACE FUNCTION public.notify_on_application_update()
RETURNS TRIGGER AS $$
DECLARE
  v_student_name TEXT;
  v_job_title TEXT;
  v_company_name TEXT;
  v_admin RECORD;
BEGIN
  SELECT full_name INTO v_student_name FROM public.profiles WHERE id = NEW.student_id;
  SELECT j.title, c.name INTO v_job_title, v_company_name
  FROM public.jobs j
  JOIN public.companies c ON c.id = j.company_id
  WHERE j.id = NEW.job_id;

  -- Status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'Shortlisted'::public.application_status_enum THEN
      PERFORM public.create_system_notification(
        NEW.student_id,
        'Application Shortlisted',
        'Great news! You have been shortlisted for ' || COALESCE(v_job_title, 'the role') || ' at ' || COALESCE(v_company_name, 'the company') || '.',
        '/student/applications',
        'info',
        'app_status:' || NEW.id::TEXT || ':Shortlisted'
      );
    ELSIF NEW.status = 'Interview Scheduled'::public.application_status_enum THEN
      PERFORM public.create_system_notification(
        NEW.student_id,
        'Interview Scheduled',
        'An interview has been scheduled for ' || COALESCE(v_job_title, 'the role') || ' at ' || COALESCE(v_company_name, 'the company') || '.',
        '/student/applications',
        'warning',
        'app_status:' || NEW.id::TEXT || ':InterviewScheduled'
      );
    ELSIF NEW.status = 'Selected'::public.application_status_enum THEN
      PERFORM public.create_system_notification(
        NEW.student_id,
        'Congratulations! You Are Selected',
        'You have been selected for ' || COALESCE(v_job_title, 'the role') || ' at ' || COALESCE(v_company_name, 'the company') || '.',
        '/student/applications',
        'success',
        'app_status:' || NEW.id::TEXT || ':Selected'
      );
    ELSIF NEW.status = 'Rejected'::public.application_status_enum THEN
      PERFORM public.create_system_notification(
        NEW.student_id,
        'Application Status Update',
        'Your application for ' || COALESCE(v_job_title, 'the role') || ' at ' || COALESCE(v_company_name, 'the company') || ' was not shortlisted.',
        '/student/applications',
        'warning',
        'app_status:' || NEW.id::TEXT || ':Rejected'
      );
    END IF;
  END IF;

  -- Offer issuance / response notifications
  IF OLD.offer_status IS DISTINCT FROM NEW.offer_status AND NEW.offer_status IS NOT NULL THEN
    IF NEW.offer_status = 'Pending'::public.offer_status_enum THEN
      PERFORM public.create_system_notification(
        NEW.student_id,
        'Official Job Offer Issued!',
        COALESCE(v_company_name, 'Company') || ' has extended an offer for ' || COALESCE(v_job_title, 'your role') ||
        CASE WHEN NEW.offer_package_lpa IS NOT NULL THEN ' (₹' || NEW.offer_package_lpa::TEXT || ' LPA)' ELSE '' END ||
        '. Review and respond now.',
        '/student/applications',
        'success',
        'offer_issued:' || NEW.id::TEXT || ':' || COALESCE(NEW.offer_issued_at::TEXT, NOW()::TEXT)
      );
    ELSIF NEW.offer_status IN ('Accepted'::public.offer_status_enum, 'Declined'::public.offer_status_enum) THEN
      PERFORM public.create_system_notification(
        NEW.student_id,
        'Offer ' || NEW.offer_status::TEXT,
        'You have ' || LOWER(NEW.offer_status::TEXT) || ' the job offer from ' || COALESCE(v_company_name, 'the company') || ' for ' || COALESCE(v_job_title, 'the role') || '.',
        '/student/applications',
        CASE WHEN NEW.offer_status = 'Accepted'::public.offer_status_enum THEN 'success' ELSE 'info' END,
        'offer_resp_stud:' || NEW.id::TEXT || ':' || NEW.offer_status::TEXT
      );

      FOR v_admin IN SELECT id FROM public.profiles WHERE role = 'admin'::public.user_role LOOP
        PERFORM public.create_system_notification(
          v_admin.id,
          'Candidate ' || NEW.offer_status::TEXT || ' Offer',
          COALESCE(v_student_name, 'A student') || ' has ' || LOWER(NEW.offer_status::TEXT) || ' the offer from ' || COALESCE(v_company_name, 'Company') || ' (' || COALESCE(v_job_title, 'Role') || ').',
          '/admin/applications',
          CASE WHEN NEW.offer_status = 'Accepted'::public.offer_status_enum THEN 'success' ELSE 'warning' END,
          'offer_resp_admin:' || NEW.id::TEXT || ':' || NEW.offer_status::TEXT
        );
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.notify_on_application_update() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_notify_on_application_update ON public.applications;
CREATE TRIGGER trg_notify_on_application_update
  AFTER UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_application_update();

-- 7. Trigger: Notify students when a new active job drive is published
CREATE OR REPLACE FUNCTION public.notify_on_job_published()
RETURNS TRIGGER AS $$
DECLARE
  v_company_name TEXT;
  v_student RECORD;
BEGIN
  IF NEW.is_active = TRUE THEN
    SELECT name INTO v_company_name FROM public.companies WHERE id = NEW.company_id;
    FOR v_student IN SELECT id FROM public.profiles WHERE role = 'student'::public.user_role LOOP
      PERFORM public.create_system_notification(
        v_student.id,
        'New Placement Drive Published',
        COALESCE(v_company_name, 'A company') || ' is hiring for ' || NEW.title || '. Check eligibility and apply before the deadline.',
        '/student/jobs',
        'info',
        'job_pub:' || NEW.id::TEXT
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.notify_on_job_published() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_notify_on_job_published ON public.jobs;
CREATE TRIGGER trg_notify_on_job_published
  AFTER INSERT ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_job_published();

-- 8. Enable Supabase Realtime on public.notifications (if publication exists)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
  WHEN OTHERS THEN NULL;
END $$;
