ALTER TYPE leg_type ADD VALUE IF NOT EXISTS 'OTHER';

ALTER TABLE estimates
    ADD COLUMN IF NOT EXISTS voyage_no VARCHAR(50),
    ADD COLUMN IF NOT EXISTS margin_sea_days NUMERIC(8,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS margin_port_idle_days NUMERIC(8,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS hire_day NUMERIC(18,2),
    ADD COLUMN IF NOT EXISTS hire_add_comm_pct NUMERIC(6,3);

ALTER TABLE estimate_cargo_lines
    ADD COLUMN IF NOT EXISTS quantity_unit VARCHAR(20) NOT NULL DEFAULT 'MT';

ALTER TABLE estimate_cargo_freight_terms
    ADD COLUMN IF NOT EXISTS freight_type CHAR(1) NOT NULL DEFAULT 'F',
    ADD COLUMN IF NOT EXISTS freight_lumpsum NUMERIC(18,2),
    ADD COLUMN IF NOT EXISTS liner_cost_amount NUMERIC(18,2),
    ADD CONSTRAINT estimate_cargo_freight_terms_freight_type_check
        CHECK (freight_type IN ('F','L'));

CREATE TABLE estimate_misc_operation_expense_items (
    id BIGSERIAL PRIMARY KEY,
    estimate_id BIGINT NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    item_description VARCHAR(200) NOT NULL,
    item_type VARCHAR(50),
    item_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    cp_side cp_side,
    sort_order SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_est_misc_operation_expense_estimate
    ON estimate_misc_operation_expense_items (estimate_id, sort_order);

CREATE TABLE estimate_misc_voyage_revenue_items (
    id BIGSERIAL PRIMARY KEY,
    estimate_id BIGINT NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    item_description VARCHAR(200) NOT NULL,
    item_type VARCHAR(50),
    item_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    cp_side cp_side,
    sort_order SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_est_misc_voyage_revenue_estimate
    ON estimate_misc_voyage_revenue_items (estimate_id, sort_order);

CREATE TABLE estimate_calculation_history (
    id BIGSERIAL PRIMARY KEY,
    estimate_id BIGINT NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    tool_type VARCHAR(30) NOT NULL,
    title VARCHAR(150),
    input_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    output_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    applied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (tool_type IN ('ANALYZER','FREIGHT','LOADABLE','BUNKER'))
);

CREATE INDEX idx_est_calculation_history_estimate
    ON estimate_calculation_history (estimate_id, tool_type, created_at);

INSERT INTO expense_categories (code, name, flow) VALUES
    ('DEM_DES', 'Despatch', 'EXPENSE'),
    ('LINER_TERMS', 'Liner Terms', 'EXPENSE'),
    ('ROUTING_SERVICE', 'Routing Service', 'EXPENSE'),
    ('OTHER_INCOME', 'Other Income', 'INCOME')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    flow = EXCLUDED.flow;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
    estimate_misc_operation_expense_items,
    estimate_misc_voyage_revenue_items,
    estimate_calculation_history
TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE
    estimate_misc_operation_expense_items_id_seq,
    estimate_misc_voyage_revenue_items_id_seq,
    estimate_calculation_history_id_seq
TO authenticated;

ALTER TABLE estimate_misc_operation_expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_misc_voyage_revenue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_calculation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY authenticated_full_access
    ON estimate_misc_operation_expense_items
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY authenticated_full_access
    ON estimate_misc_voyage_revenue_items
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY authenticated_full_access
    ON estimate_calculation_history
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);
