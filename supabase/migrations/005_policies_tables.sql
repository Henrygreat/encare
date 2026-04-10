-- Policies feature tables for company policy management and acknowledgements

CREATE TYPE policy_status AS ENUM ('draft', 'published', 'archived');

-- Main policies table
CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    file_url TEXT,
    file_name TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    status policy_status NOT NULL DEFAULT 'draft',
    requires_acknowledgement BOOLEAN NOT NULL DEFAULT true,
    published_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_policies_org ON policies(organisation_id);
CREATE INDEX idx_policies_status ON policies(status);
CREATE INDEX idx_policies_created_by ON policies(created_by);
CREATE INDEX idx_policies_published_at ON policies(published_at);

-- Policy assignments table (which staff members should read which policies)
CREATE TABLE policy_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    due_at TIMESTAMPTZ,
    is_required BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(policy_id, user_id)
);

CREATE INDEX idx_policy_assignments_policy ON policy_assignments(policy_id);
CREATE INDEX idx_policy_assignments_user ON policy_assignments(user_id);
CREATE INDEX idx_policy_assignments_due ON policy_assignments(due_at);

-- Policy acknowledgements table (tracking who has read what)
CREATE TABLE policy_acknowledgements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES policy_assignments(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledgement_text TEXT,
    version_read INTEGER NOT NULL,
    UNIQUE(policy_id, user_id, version_read)
);

CREATE INDEX idx_policy_acks_policy ON policy_acknowledgements(policy_id);
CREATE INDEX idx_policy_acks_user ON policy_acknowledgements(user_id);
CREATE INDEX idx_policy_acks_assignment ON policy_acknowledgements(assignment_id);

-- Update triggers
CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON policies FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_acknowledgements ENABLE ROW LEVEL SECURITY;

-- Policies RLS
CREATE POLICY "Users can view published policies in their organisation" ON policies
    FOR SELECT USING (
        organisation_id = get_user_org_id()
        AND (status = 'published' OR is_manager_or_admin())
    );

CREATE POLICY "Managers can create policies" ON policies
    FOR INSERT WITH CHECK (
        organisation_id = get_user_org_id()
        AND is_manager_or_admin()
    );

CREATE POLICY "Managers can update policies in their organisation" ON policies
    FOR UPDATE USING (
        organisation_id = get_user_org_id()
        AND is_manager_or_admin()
    );

CREATE POLICY "Managers can delete policies in their organisation" ON policies
    FOR DELETE USING (
        organisation_id = get_user_org_id()
        AND is_manager_or_admin()
    );

-- Policy assignments RLS
CREATE POLICY "Users can view their own policy assignments" ON policy_assignments
    FOR SELECT USING (
        user_id = auth.uid() OR is_manager_or_admin()
    );

CREATE POLICY "Managers can create policy assignments" ON policy_assignments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM policies
            WHERE policies.id = policy_assignments.policy_id
            AND policies.organisation_id = get_user_org_id()
            AND is_manager_or_admin()
        )
    );

CREATE POLICY "Managers can update policy assignments" ON policy_assignments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM policies
            WHERE policies.id = policy_assignments.policy_id
            AND policies.organisation_id = get_user_org_id()
            AND is_manager_or_admin()
        )
    );

CREATE POLICY "Managers can delete policy assignments" ON policy_assignments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM policies
            WHERE policies.id = policy_assignments.policy_id
            AND policies.organisation_id = get_user_org_id()
            AND is_manager_or_admin()
        )
    );

-- Policy acknowledgements RLS
CREATE POLICY "Users can view acknowledgements for policies in their org" ON policy_acknowledgements
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM policies
            WHERE policies.id = policy_acknowledgements.policy_id
            AND policies.organisation_id = get_user_org_id()
            AND is_manager_or_admin()
        )
    );

CREATE POLICY "Users can create their own acknowledgements" ON policy_acknowledgements
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM policy_assignments
            WHERE policy_assignments.policy_id = policy_acknowledgements.policy_id
            AND policy_assignments.user_id = auth.uid()
        )
    );
