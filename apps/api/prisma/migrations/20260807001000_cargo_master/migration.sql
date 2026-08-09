CREATE TABLE IF NOT EXISTS cargoes (
    id                  BIGSERIAL PRIMARY KEY,
    code                VARCHAR(30) UNIQUE,
    cargo_name          VARCHAR(150) NOT NULL UNIQUE,
    default_unit        VARCHAR(20) NOT NULL DEFAULT 'MT',
    stowage_factor      NUMERIC(10,4),
    stowage_factor_unit VARCHAR(30) NOT NULL DEFAULT 'CBM/MT',
    description         TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cargoes_active_name ON cargoes (is_active, cargo_name);

ALTER TABLE estimate_cargo_lines
    ADD COLUMN IF NOT EXISTS cargo_id BIGINT REFERENCES cargoes(id);

CREATE INDEX IF NOT EXISTS idx_est_cargo_lines_cargo ON estimate_cargo_lines (cargo_id);

ALTER TABLE actual_voyage_cargo_lines
    ADD COLUMN IF NOT EXISTS cargo_id BIGINT REFERENCES cargoes(id);

CREATE INDEX IF NOT EXISTS idx_act_cargo_lines_cargo ON actual_voyage_cargo_lines (cargo_id);

INSERT INTO cargoes (code, cargo_name, default_unit, stowage_factor, stowage_factor_unit) VALUES
    ('GENERAL', 'general', 'MT', NULL, 'CBM/MT'),
    ('STEEL', 'steel', 'MT', NULL, 'CBM/MT'),
    ('STEEL_COIL', 'steel coil', 'MT', NULL, 'CBM/MT'),
    ('BAGGED_CEMENT', 'bagged cement', 'MT', NULL, 'CBM/MT'),
    ('COAL', 'coal', 'MT', NULL, 'CBM/MT'),
    ('GRAIN', 'grain', 'MT', NULL, 'CBM/MT')
ON CONFLICT (cargo_name) DO UPDATE
SET code = EXCLUDED.code,
    default_unit = EXCLUDED.default_unit,
    stowage_factor_unit = EXCLUDED.stowage_factor_unit,
    updated_at = now();

GRANT SELECT, INSERT, UPDATE, DELETE ON cargoes TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE cargoes_id_seq TO authenticated;

ALTER TABLE cargoes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'cargoes'
          AND policyname = 'cargoes_authenticated_full_access'
    ) THEN
        CREATE POLICY cargoes_authenticated_full_access
            ON cargoes
            FOR ALL
            TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;
