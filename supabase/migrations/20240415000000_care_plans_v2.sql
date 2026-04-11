-- Care Plans v2 Migration
-- This migration creates a new versioned care plan system with structured sections

-- First, let's rename the old care_plans table to preserve existing data
ALTER TABLE IF EXISTS care_plans RENAME TO care_plans_legacy;
ALTER TABLE IF EXISTS care_plan_views RENAME TO care_plan_views_legacy;

-- Create new care_plans table with versioning support
CREATE TABLE care_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Care Plan',
    summary TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    version INTEGER NOT NULL DEFAULT 1,
    review_date DATE,
    next_review_date DATE,
    published_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create care_plan_sections table for structured content
CREATE TABLE care_plan_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    care_plan_id UUID NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
    section_key TEXT NOT NULL,
    section_label TEXT NOT NULL,
    content TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create care_plan_audit_logs for tracking changes
CREATE TABLE care_plan_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    care_plan_id UUID NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    details JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create new care_plan_views table for the v2 structure
CREATE TABLE care_plan_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    care_plan_id UUID NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_care_plans_organisation_id ON care_plans(organisation_id);
CREATE INDEX idx_care_plans_resident_id ON care_plans(resident_id);
CREATE INDEX idx_care_plans_resident_status ON care_plans(resident_id, status);
CREATE INDEX idx_care_plans_status ON care_plans(status);
CREATE INDEX idx_care_plans_created_at ON care_plans(created_at DESC);

CREATE INDEX idx_care_plan_sections_care_plan_id ON care_plan_sections(care_plan_id);
CREATE INDEX idx_care_plan_sections_sort_order ON care_plan_sections(care_plan_id, sort_order);

CREATE INDEX idx_care_plan_audit_logs_care_plan_id ON care_plan_audit_logs(care_plan_id);
CREATE INDEX idx_care_plan_audit_logs_created_at ON care_plan_audit_logs(created_at DESC);

CREATE INDEX idx_care_plan_views_care_plan_id ON care_plan_views(care_plan_id);
CREATE INDEX idx_care_plan_views_user_id ON care_plan_views(user_id);
CREATE UNIQUE INDEX idx_care_plan_views_unique ON care_plan_views(care_plan_id, user_id);

-- Enable RLS on new tables
ALTER TABLE care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_plan_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_plan_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_plan_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for care_plans
CREATE POLICY "Users can view care plans in their organisation"
    ON care_plans FOR SELECT
    USING (organisation_id = get_user_org_id());

CREATE POLICY "Managers can insert care plans"
    ON care_plans FOR INSERT
    WITH CHECK (organisation_id = get_user_org_id() AND is_manager_or_admin());

CREATE POLICY "Managers can update care plans"
    ON care_plans FOR UPDATE
    USING (organisation_id = get_user_org_id() AND is_manager_or_admin())
    WITH CHECK (organisation_id = get_user_org_id() AND is_manager_or_admin());

CREATE POLICY "Managers can delete care plans"
    ON care_plans FOR DELETE
    USING (organisation_id = get_user_org_id() AND is_manager_or_admin());

-- RLS Policies for care_plan_sections
CREATE POLICY "Users can view sections of care plans in their organisation"
    ON care_plan_sections FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM care_plans cp
            WHERE cp.id = care_plan_sections.care_plan_id
            AND cp.organisation_id = get_user_org_id()
        )
    );

CREATE POLICY "Managers can insert sections"
    ON care_plan_sections FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM care_plans cp
            WHERE cp.id = care_plan_sections.care_plan_id
            AND cp.organisation_id = get_user_org_id()
            AND is_manager_or_admin()
        )
    );

CREATE POLICY "Managers can update sections"
    ON care_plan_sections FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM care_plans cp
            WHERE cp.id = care_plan_sections.care_plan_id
            AND cp.organisation_id = get_user_org_id()
            AND is_manager_or_admin()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM care_plans cp
            WHERE cp.id = care_plan_sections.care_plan_id
            AND cp.organisation_id = get_user_org_id()
            AND is_manager_or_admin()
        )
    );

CREATE POLICY "Managers can delete sections"
    ON care_plan_sections FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM care_plans cp
            WHERE cp.id = care_plan_sections.care_plan_id
            AND cp.organisation_id = get_user_org_id()
            AND is_manager_or_admin()
        )
    );

-- RLS Policies for care_plan_audit_logs
CREATE POLICY "Users can view audit logs in their organisation"
    ON care_plan_audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM care_plans cp
            WHERE cp.id = care_plan_audit_logs.care_plan_id
            AND cp.organisation_id = get_user_org_id()
        )
    );

CREATE POLICY "System can insert audit logs"
    ON care_plan_audit_logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM care_plans cp
            WHERE cp.id = care_plan_audit_logs.care_plan_id
            AND cp.organisation_id = get_user_org_id()
        )
    );

-- RLS Policies for care_plan_views
CREATE POLICY "Users can view their own views"
    ON care_plan_views FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own views"
    ON care_plan_views FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM care_plans cp
            WHERE cp.id = care_plan_views.care_plan_id
            AND cp.organisation_id = get_user_org_id()
        )
    );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_care_plan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER care_plans_updated_at
    BEFORE UPDATE ON care_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_care_plan_updated_at();

CREATE TRIGGER care_plan_sections_updated_at
    BEFORE UPDATE ON care_plan_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_care_plan_updated_at();

-- Function to create default sections for a new care plan
CREATE OR REPLACE FUNCTION create_default_care_plan_sections(p_care_plan_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO care_plan_sections (care_plan_id, section_key, section_label, sort_order)
    VALUES
        (p_care_plan_id, 'dietary_requirements', 'Dietary Requirements', 1),
        (p_care_plan_id, 'mobility', 'Mobility', 2),
        (p_care_plan_id, 'communication', 'Communication', 3),
        (p_care_plan_id, 'medication_support', 'Medication Support', 4),
        (p_care_plan_id, 'personal_care', 'Personal Care', 5),
        (p_care_plan_id, 'behaviour_support', 'Behaviour Support', 6),
        (p_care_plan_id, 'risk_notes', 'Risk Notes', 7),
        (p_care_plan_id, 'care_instructions', 'Care Instructions', 8),
        (p_care_plan_id, 'escalation_guidance', 'Escalation Guidance', 9);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Migrate legacy care plans to new structure
-- This can be run manually if needed
-- CREATE OR REPLACE FUNCTION migrate_legacy_care_plans()
-- RETURNS INTEGER AS $$
-- DECLARE
--     legacy_plan RECORD;
--     new_plan_id UUID;
--     migrated_count INTEGER := 0;
-- BEGIN
--     FOR legacy_plan IN
--         SELECT cp.*, r.organisation_id
--         FROM care_plans_legacy cp
--         JOIN residents r ON r.id = cp.resident_id
--         WHERE cp.is_active = true
--     LOOP
--         -- Create new care plan
--         INSERT INTO care_plans (
--             organisation_id, resident_id, title, summary,
--             status, version, review_date, published_at,
--             created_at, updated_at
--         ) VALUES (
--             legacy_plan.organisation_id,
--             legacy_plan.resident_id,
--             legacy_plan.title,
--             legacy_plan.summary,
--             'active',
--             1,
--             legacy_plan.review_date::date,
--             legacy_plan.last_reviewed_at,
--             legacy_plan.created_at,
--             legacy_plan.updated_at
--         ) RETURNING id INTO new_plan_id;
--
--         -- Create default sections
--         PERFORM create_default_care_plan_sections(new_plan_id);
--
--         migrated_count := migrated_count + 1;
--     END LOOP;
--
--     RETURN migrated_count;
-- END;
-- $$ LANGUAGE plpgsql;
