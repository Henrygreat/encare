-- EnCare Database Schema
-- Multi-tenant care logging platform

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================
-- ENUMS
-- ===========================================

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'senior_carer', 'carer');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'snoozed', 'escalated', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE log_type AS ENUM ('meal', 'drink', 'medication', 'toileting', 'mood', 'personal_care', 'activity', 'observation', 'incident', 'note');
CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE sync_status AS ENUM ('synced', 'pending', 'failed');

-- ===========================================
-- ORGANISATIONS (Multi-tenant root)
-- ===========================================

CREATE TABLE organisations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- USERS (Staff members)
-- ===========================================

CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'carer',
    avatar_url TEXT,
    phone VARCHAR(50),
    pin_hash VARCHAR(255), -- For quick PIN unlock
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_org ON users(organisation_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ===========================================
-- RESIDENTS
-- ===========================================

CREATE TABLE residents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    preferred_name VARCHAR(100),
    date_of_birth DATE,
    room_number VARCHAR(50),
    photo_url TEXT,
    admission_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    emergency_contact JSONB DEFAULT '{}',
    medical_info JSONB DEFAULT '{}',
    dietary_requirements TEXT,
    mobility_notes TEXT,
    communication_needs TEXT,
    risk_flags JSONB DEFAULT '[]', -- Array of risk flag objects
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_residents_org ON residents(organisation_id);
CREATE INDEX idx_residents_status ON residents(status);
CREATE INDEX idx_residents_room ON residents(room_number);

-- ===========================================
-- STAFF-RESIDENT ASSIGNMENTS
-- ===========================================

CREATE TABLE staff_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, resident_id, shift_date)
);

CREATE INDEX idx_assignments_user ON staff_assignments(user_id);
CREATE INDEX idx_assignments_resident ON staff_assignments(resident_id);
CREATE INDEX idx_assignments_date ON staff_assignments(shift_date);

-- ===========================================
-- CARE PLANS
-- ===========================================

CREATE TABLE care_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    key_needs JSONB DEFAULT '[]',
    key_risks JSONB DEFAULT '[]',
    goals JSONB DEFAULT '[]',
    interventions JSONB DEFAULT '[]',
    review_date DATE,
    last_reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_care_plans_resident ON care_plans(resident_id);
CREATE INDEX idx_care_plans_active ON care_plans(is_active);

-- ===========================================
-- TASKS
-- ===========================================

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(100), -- medication, personal_care, meal, etc.
    priority task_priority DEFAULT 'medium',
    status task_status DEFAULT 'pending',
    due_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES users(id),
    snoozed_until TIMESTAMPTZ,
    snooze_reason TEXT,
    escalated_at TIMESTAMPTZ,
    escalated_to UUID REFERENCES users(id),
    recurrence_rule JSONB, -- For recurring tasks
    parent_task_id UUID REFERENCES tasks(id), -- For recurring task instances
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_org ON tasks(organisation_id);
CREATE INDEX idx_tasks_resident ON tasks(resident_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due ON tasks(due_at);
CREATE INDEX idx_tasks_priority ON tasks(priority);

-- ===========================================
-- DAILY LOGS (Core care logging)
-- ===========================================

CREATE TABLE daily_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    logged_by UUID NOT NULL REFERENCES users(id),
    log_type log_type NOT NULL,
    log_data JSONB NOT NULL, -- Type-specific data
    notes TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    task_id UUID REFERENCES tasks(id), -- Link to task if from task completion
    sync_status sync_status DEFAULT 'synced',
    offline_id VARCHAR(100), -- Client-side ID for offline sync
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logs_org ON daily_logs(organisation_id);
CREATE INDEX idx_logs_resident ON daily_logs(resident_id);
CREATE INDEX idx_logs_user ON daily_logs(logged_by);
CREATE INDEX idx_logs_type ON daily_logs(log_type);
CREATE INDEX idx_logs_logged_at ON daily_logs(logged_at);
CREATE INDEX idx_logs_offline_id ON daily_logs(offline_id);

-- ===========================================
-- INCIDENTS
-- ===========================================

CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES users(id),
    incident_type VARCHAR(100) NOT NULL,
    severity incident_severity DEFAULT 'low',
    description TEXT NOT NULL,
    location VARCHAR(255),
    occurred_at TIMESTAMPTZ NOT NULL,
    witnesses JSONB DEFAULT '[]',
    immediate_action TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_notes TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id),
    manager_notified_at TIMESTAMPTZ,
    family_notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_incidents_org ON incidents(organisation_id);
CREATE INDEX idx_incidents_resident ON incidents(resident_id);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_occurred ON incidents(occurred_at);

-- ===========================================
-- ATTACHMENTS
-- ===========================================

CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    storage_path TEXT NOT NULL,
    thumbnail_path TEXT,
    entity_type VARCHAR(50) NOT NULL, -- daily_log, incident, care_plan, etc.
    entity_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attachments_entity ON attachments(entity_type, entity_id);

-- ===========================================
-- HANDOVER NOTES
-- ===========================================

CREATE TABLE handover_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    shift_date DATE NOT NULL,
    shift_type VARCHAR(50), -- morning, afternoon, night
    auto_summary JSONB DEFAULT '{}', -- Auto-generated from logs
    manual_notes TEXT,
    priority_items JSONB DEFAULT '[]',
    read_by JSONB DEFAULT '[]', -- Array of {user_id, read_at}
    finalized_at TIMESTAMPTZ,
    finalized_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_handover_org ON handover_notes(organisation_id);
CREATE INDEX idx_handover_date ON handover_notes(shift_date);

-- ===========================================
-- AUDIT LOG
-- ===========================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_org ON audit_logs(organisation_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ===========================================
-- CARE PLAN VIEWS (Track who viewed care plans)
-- ===========================================

CREATE TABLE care_plan_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    care_plan_id UUID NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(care_plan_id, user_id)
);

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_organisations_updated_at BEFORE UPDATE ON organisations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_residents_updated_at BEFORE UPDATE ON residents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_care_plans_updated_at BEFORE UPDATE ON care_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_daily_logs_updated_at BEFORE UPDATE ON daily_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_handover_notes_updated_at BEFORE UPDATE ON handover_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Get organisation_id from the record
    IF TG_OP = 'DELETE' THEN
        org_id := OLD.organisation_id;
    ELSE
        org_id := NEW.organisation_id;
    END IF;

    INSERT INTO audit_logs (
        organisation_id,
        user_id,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data
    ) VALUES (
        org_id,
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to care-critical tables
CREATE TRIGGER audit_daily_logs AFTER INSERT OR UPDATE OR DELETE ON daily_logs FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_incidents AFTER INSERT OR UPDATE OR DELETE ON incidents FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_tasks AFTER INSERT OR UPDATE OR DELETE ON tasks FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- ===========================================
-- VIEWS
-- ===========================================

-- View for resident timeline (combines logs, incidents, tasks)
CREATE OR REPLACE VIEW resident_timeline AS
SELECT
    id,
    resident_id,
    'log' as event_type,
    log_type::text as sub_type,
    log_data as data,
    notes,
    logged_by as user_id,
    logged_at as occurred_at,
    created_at
FROM daily_logs
UNION ALL
SELECT
    id,
    resident_id,
    'incident' as event_type,
    incident_type as sub_type,
    jsonb_build_object('severity', severity, 'description', description) as data,
    immediate_action as notes,
    reported_by as user_id,
    occurred_at,
    created_at
FROM incidents
UNION ALL
SELECT
    id,
    resident_id,
    'task' as event_type,
    task_type as sub_type,
    jsonb_build_object('title', title, 'status', status) as data,
    description as notes,
    COALESCE(completed_by, assigned_to) as user_id,
    COALESCE(completed_at, due_at) as occurred_at,
    created_at
FROM tasks
WHERE status = 'completed';

-- View for overdue tasks
CREATE OR REPLACE VIEW overdue_tasks AS
SELECT t.*, r.first_name, r.last_name, r.room_number, u.full_name as assigned_to_name
FROM tasks t
LEFT JOIN residents r ON t.resident_id = r.id
LEFT JOIN users u ON t.assigned_to = u.id
WHERE t.status IN ('pending', 'in_progress')
AND t.due_at < NOW();

-- View for today's tasks
CREATE OR REPLACE VIEW today_tasks AS
SELECT t.*, r.first_name, r.last_name, r.room_number, u.full_name as assigned_to_name
FROM tasks t
LEFT JOIN residents r ON t.resident_id = r.id
LEFT JOIN users u ON t.assigned_to = u.id
WHERE t.due_at::date = CURRENT_DATE
ORDER BY t.due_at, t.priority DESC;
