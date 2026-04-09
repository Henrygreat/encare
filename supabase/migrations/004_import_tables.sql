-- Import Jobs and Import Rows tables for safe staged data imports

CREATE TYPE import_status AS ENUM ('pending', 'validating', 'validated', 'importing', 'completed', 'failed', 'cancelled');
CREATE TYPE import_row_status AS ENUM ('pending', 'valid', 'invalid', 'imported', 'skipped', 'failed');
CREATE TYPE import_entity_type AS ENUM ('residents', 'staff', 'tasks', 'care_plans');

CREATE TABLE import_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    entity_type import_entity_type NOT NULL,
    status import_status NOT NULL DEFAULT 'pending',
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    total_rows INTEGER DEFAULT 0,
    valid_rows INTEGER DEFAULT 0,
    invalid_rows INTEGER DEFAULT 0,
    imported_rows INTEGER DEFAULT 0,
    skipped_rows INTEGER DEFAULT 0,
    failed_rows INTEGER DEFAULT 0,
    column_mapping JSONB DEFAULT '{}',
    options JSONB DEFAULT '{}',
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_import_jobs_org ON import_jobs(organisation_id);
CREATE INDEX idx_import_jobs_status ON import_jobs(status);
CREATE INDEX idx_import_jobs_created_by ON import_jobs(created_by);
CREATE INDEX idx_import_jobs_created_at ON import_jobs(created_at);

CREATE TABLE import_rows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_job_id UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    raw_data JSONB NOT NULL,
    mapped_data JSONB,
    status import_row_status NOT NULL DEFAULT 'pending',
    errors JSONB DEFAULT '[]',
    warnings JSONB DEFAULT '[]',
    created_entity_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_import_rows_job ON import_rows(import_job_id);
CREATE INDEX idx_import_rows_status ON import_rows(status);
CREATE INDEX idx_import_rows_row_number ON import_rows(import_job_id, row_number);

CREATE TRIGGER update_import_jobs_updated_at BEFORE UPDATE ON import_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_import_rows_updated_at BEFORE UPDATE ON import_rows FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view import jobs in their organisation" ON import_jobs
    FOR SELECT USING (organisation_id = get_user_org_id());

CREATE POLICY "Managers can create import jobs" ON import_jobs
    FOR INSERT WITH CHECK (organisation_id = get_user_org_id() AND is_manager_or_admin());

CREATE POLICY "Managers can update import jobs in their organisation" ON import_jobs
    FOR UPDATE USING (organisation_id = get_user_org_id() AND is_manager_or_admin());

CREATE POLICY "Users can view import rows for jobs in their organisation" ON import_rows
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM import_jobs
            WHERE import_jobs.id = import_rows.import_job_id
            AND import_jobs.organisation_id = get_user_org_id()
        )
    );

CREATE POLICY "Managers can create import rows" ON import_rows
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM import_jobs
            WHERE import_jobs.id = import_rows.import_job_id
            AND import_jobs.organisation_id = get_user_org_id()
            AND is_manager_or_admin()
        )
    );

CREATE POLICY "Managers can update import rows" ON import_rows
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM import_jobs
            WHERE import_jobs.id = import_rows.import_job_id
            AND import_jobs.organisation_id = get_user_org_id()
            AND is_manager_or_admin()
        )
    );
