-- ===========================================
-- BILLING TABLES FOR STRIPE INTEGRATION
-- ===========================================

-- ===========================================
-- SUBSCRIPTION STATUS ENUM
-- ===========================================

CREATE TYPE subscription_status AS ENUM (
    'incomplete',
    'incomplete_expired',
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'paused'
);

-- ===========================================
-- BILLING CUSTOMERS (Stripe Customers)
-- ===========================================

CREATE TABLE billing_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'stripe',
    customer_id TEXT NOT NULL UNIQUE,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_billing_customers_org ON billing_customers(organisation_id);
CREATE INDEX idx_billing_customers_customer_id ON billing_customers(customer_id);

-- ===========================================
-- SUBSCRIPTIONS
-- ===========================================

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'stripe',
    customer_id TEXT NOT NULL,
    subscription_id TEXT NOT NULL UNIQUE,
    price_id TEXT,
    status subscription_status NOT NULL DEFAULT 'incomplete',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    trial_ends_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    raw JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_org ON subscriptions(organisation_id);
CREATE INDEX idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_subscription_id ON subscriptions(subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ===========================================
-- PLANS (Optional - for displaying plans)
-- ===========================================

CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    stripe_price_id TEXT NOT NULL UNIQUE,
    price_amount INTEGER NOT NULL, -- in cents
    currency TEXT NOT NULL DEFAULT 'gbp',
    interval TEXT NOT NULL DEFAULT 'month', -- month, year
    features JSONB NOT NULL DEFAULT '[]',
    active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plans_active ON plans(active);
CREATE INDEX idx_plans_sort ON plans(sort_order);

-- ===========================================
-- TRIGGERS
-- ===========================================

-- Add updated_at trigger for billing_customers
CREATE TRIGGER update_billing_customers_updated_at
    BEFORE UPDATE ON billing_customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Add updated_at trigger for subscriptions
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- BILLING CUSTOMERS POLICIES
-- ===========================================

-- Admins can view billing customer for their organisation
CREATE POLICY "Admins can view billing customer"
    ON billing_customers FOR SELECT
    USING (
        organisation_id = get_user_org_id()
        AND get_user_role() = 'admin'
    );

-- Service role bypass for webhook operations (no policy needed - service role bypasses RLS)

-- ===========================================
-- SUBSCRIPTIONS POLICIES
-- ===========================================

-- Admins can view subscriptions for their organisation
CREATE POLICY "Admins can view subscriptions"
    ON subscriptions FOR SELECT
    USING (
        organisation_id = get_user_org_id()
        AND get_user_role() = 'admin'
    );

-- All authenticated users can check if org has active subscription (for gating)
CREATE POLICY "Users can check subscription status"
    ON subscriptions FOR SELECT
    USING (
        organisation_id = get_user_org_id()
    );

-- ===========================================
-- PLANS POLICIES
-- ===========================================

-- Anyone authenticated can view active plans
CREATE POLICY "Authenticated users can view active plans"
    ON plans FOR SELECT
    USING (active = true);

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Check if organisation has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(org_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM subscriptions
        WHERE organisation_id = org_id
        AND status IN ('active', 'trialing')
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user's organisation has active subscription
CREATE OR REPLACE FUNCTION org_has_active_subscription()
RETURNS BOOLEAN AS $$
    SELECT has_active_subscription(get_user_org_id());
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current subscription status for organisation
CREATE OR REPLACE FUNCTION get_org_subscription_status(org_id UUID)
RETURNS subscription_status AS $$
    SELECT status FROM subscriptions
    WHERE organisation_id = org_id
    ORDER BY created_at DESC
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ===========================================
-- SEED DEFAULT PLANS (Optional - can also be done via Stripe)
-- ===========================================

-- INSERT INTO plans (code, name, description, stripe_price_id, price_amount, currency, interval, features, sort_order) VALUES
-- ('starter', 'Starter', 'Perfect for small care homes', 'price_starter_monthly', 4900, 'gbp', 'month', '["Up to 20 residents", "5 staff accounts", "Basic reporting", "Email support"]', 1),
-- ('growth', 'Growth', 'For growing care organisations', 'price_growth_monthly', 9900, 'gbp', 'month', '["Up to 50 residents", "15 staff accounts", "Advanced reporting", "Priority support", "Care plan templates"]', 2),
-- ('pro', 'Professional', 'For large care providers', 'price_pro_monthly', 19900, 'gbp', 'month', '["Unlimited residents", "Unlimited staff", "Custom reporting", "24/7 phone support", "API access", "Dedicated account manager"]', 3);
