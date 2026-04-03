-- ===========================================
-- ROW LEVEL SECURITY POLICIES
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE handover_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_plan_views ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Get current user's organisation_id
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
    SELECT organisation_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
    SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user is manager or admin
CREATE OR REPLACE FUNCTION is_manager_or_admin()
RETURNS BOOLEAN AS $$
    SELECT role IN ('admin', 'manager') FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ===========================================
-- ORGANISATIONS POLICIES
-- ===========================================

CREATE POLICY "Users can view their own organisation"
    ON organisations FOR SELECT
    USING (id = get_user_org_id());

CREATE POLICY "Only admins can update organisation"
    ON organisations FOR UPDATE
    USING (id = get_user_org_id() AND get_user_role() = 'admin');

-- ===========================================
-- USERS POLICIES
-- ===========================================

CREATE POLICY "Users can view colleagues in same organisation"
    ON users FOR SELECT
    USING (organisation_id = get_user_org_id());

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Managers can update staff in their organisation"
    ON users FOR UPDATE
    USING (
        organisation_id = get_user_org_id()
        AND is_manager_or_admin()
    );

CREATE POLICY "Admins can insert new users"
    ON users FOR INSERT
    WITH CHECK (
        organisation_id = get_user_org_id()
        AND get_user_role() = 'admin'
    );

-- ===========================================
-- RESIDENTS POLICIES
-- ===========================================

CREATE POLICY "Staff can view residents in their organisation"
    ON residents FOR SELECT
    USING (organisation_id = get_user_org_id());

CREATE POLICY "Managers can insert residents"
    ON residents FOR INSERT
    WITH CHECK (
        organisation_id = get_user_org_id()
        AND is_manager_or_admin()
    );

CREATE POLICY "Managers can update residents"
    ON residents FOR UPDATE
    USING (
        organisation_id = get_user_org_id()
        AND is_manager_or_admin()
    );

CREATE POLICY "Admins can delete residents"
    ON residents FOR DELETE
    USING (
        organisation_id = get_user_org_id()
        AND get_user_role() = 'admin'
    );

-- ===========================================
-- STAFF ASSIGNMENTS POLICIES
-- ===========================================

CREATE POLICY "Staff can view assignments in their organisation"
    ON staff_assignments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = staff_assignments.user_id
            AND users.organisation_id = get_user_org_id()
        )
    );

CREATE POLICY "Managers can manage assignments"
    ON staff_assignments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = staff_assignments.user_id
            AND users.organisation_id = get_user_org_id()
        )
        AND is_manager_or_admin()
    );

-- ===========================================
-- CARE PLANS POLICIES
-- ===========================================

CREATE POLICY "Staff can view care plans in their organisation"
    ON care_plans FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM residents
            WHERE residents.id = care_plans.resident_id
            AND residents.organisation_id = get_user_org_id()
        )
    );

CREATE POLICY "Senior staff can insert care plans"
    ON care_plans FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM residents
            WHERE residents.id = care_plans.resident_id
            AND residents.organisation_id = get_user_org_id()
        )
        AND get_user_role() IN ('admin', 'manager', 'senior_carer')
    );

CREATE POLICY "Senior staff can update care plans"
    ON care_plans FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM residents
            WHERE residents.id = care_plans.resident_id
            AND residents.organisation_id = get_user_org_id()
        )
        AND get_user_role() IN ('admin', 'manager', 'senior_carer')
    );

-- ===========================================
-- TASKS POLICIES
-- ===========================================

CREATE POLICY "Staff can view tasks in their organisation"
    ON tasks FOR SELECT
    USING (organisation_id = get_user_org_id());

CREATE POLICY "Staff can create tasks"
    ON tasks FOR INSERT
    WITH CHECK (organisation_id = get_user_org_id());

CREATE POLICY "Staff can update tasks assigned to them"
    ON tasks FOR UPDATE
    USING (
        organisation_id = get_user_org_id()
        AND (
            assigned_to = auth.uid()
            OR created_by = auth.uid()
            OR is_manager_or_admin()
        )
    );

CREATE POLICY "Managers can delete tasks"
    ON tasks FOR DELETE
    USING (
        organisation_id = get_user_org_id()
        AND is_manager_or_admin()
    );

-- ===========================================
-- DAILY LOGS POLICIES
-- ===========================================

CREATE POLICY "Staff can view logs in their organisation"
    ON daily_logs FOR SELECT
    USING (organisation_id = get_user_org_id());

CREATE POLICY "Staff can create logs"
    ON daily_logs FOR INSERT
    WITH CHECK (
        organisation_id = get_user_org_id()
        AND logged_by = auth.uid()
    );

CREATE POLICY "Staff can update their own logs"
    ON daily_logs FOR UPDATE
    USING (
        organisation_id = get_user_org_id()
        AND (logged_by = auth.uid() OR is_manager_or_admin())
    );

-- Logs should generally not be deleted, only by admins
CREATE POLICY "Admins can delete logs"
    ON daily_logs FOR DELETE
    USING (
        organisation_id = get_user_org_id()
        AND get_user_role() = 'admin'
    );

-- ===========================================
-- INCIDENTS POLICIES
-- ===========================================

CREATE POLICY "Staff can view incidents in their organisation"
    ON incidents FOR SELECT
    USING (organisation_id = get_user_org_id());

CREATE POLICY "Staff can report incidents"
    ON incidents FOR INSERT
    WITH CHECK (
        organisation_id = get_user_org_id()
        AND reported_by = auth.uid()
    );

CREATE POLICY "Senior staff can update incidents"
    ON incidents FOR UPDATE
    USING (
        organisation_id = get_user_org_id()
        AND (
            reported_by = auth.uid()
            OR get_user_role() IN ('admin', 'manager', 'senior_carer')
        )
    );

-- ===========================================
-- ATTACHMENTS POLICIES
-- ===========================================

CREATE POLICY "Staff can view attachments in their organisation"
    ON attachments FOR SELECT
    USING (organisation_id = get_user_org_id());

CREATE POLICY "Staff can upload attachments"
    ON attachments FOR INSERT
    WITH CHECK (
        organisation_id = get_user_org_id()
        AND uploaded_by = auth.uid()
    );

CREATE POLICY "Managers can delete attachments"
    ON attachments FOR DELETE
    USING (
        organisation_id = get_user_org_id()
        AND is_manager_or_admin()
    );

-- ===========================================
-- HANDOVER NOTES POLICIES
-- ===========================================

CREATE POLICY "Staff can view handover notes in their organisation"
    ON handover_notes FOR SELECT
    USING (organisation_id = get_user_org_id());

CREATE POLICY "Senior staff can create handover notes"
    ON handover_notes FOR INSERT
    WITH CHECK (
        organisation_id = get_user_org_id()
        AND get_user_role() IN ('admin', 'manager', 'senior_carer')
    );

CREATE POLICY "Senior staff can update handover notes"
    ON handover_notes FOR UPDATE
    USING (
        organisation_id = get_user_org_id()
        AND get_user_role() IN ('admin', 'manager', 'senior_carer')
    );

-- ===========================================
-- AUDIT LOGS POLICIES
-- ===========================================

CREATE POLICY "Managers can view audit logs"
    ON audit_logs FOR SELECT
    USING (
        organisation_id = get_user_org_id()
        AND is_manager_or_admin()
    );

-- Audit logs are insert-only by system
CREATE POLICY "System can insert audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (organisation_id = get_user_org_id());

-- ===========================================
-- CARE PLAN VIEWS POLICIES
-- ===========================================

CREATE POLICY "Staff can view care plan views"
    ON care_plan_views FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM care_plans cp
            JOIN residents r ON cp.resident_id = r.id
            WHERE cp.id = care_plan_views.care_plan_id
            AND r.organisation_id = get_user_org_id()
        )
    );

CREATE POLICY "Staff can record their own care plan views"
    ON care_plan_views FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff can update their own care plan views"
    ON care_plan_views FOR UPDATE
    USING (user_id = auth.uid());

-- ===========================================
-- STORAGE POLICIES (for Supabase Storage)
-- ===========================================

-- Create storage bucket for attachments (run in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', false);

-- Storage policies would be configured in Supabase dashboard
