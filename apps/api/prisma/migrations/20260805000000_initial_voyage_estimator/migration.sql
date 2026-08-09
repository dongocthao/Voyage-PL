CREATE TABLE departments (
    id    SMALLSERIAL PRIMARY KEY,
    code  VARCHAR(30) UNIQUE NOT NULL,
    name  VARCHAR(100) NOT NULL
);
CREATE TABLE users (
    id             BIGSERIAL PRIMARY KEY,
    username       VARCHAR(50) UNIQUE NOT NULL,
    full_name      VARCHAR(150) NOT NULL,
    email          VARCHAR(150),
    job_title      VARCHAR(100),
    department_id  SMALLINT REFERENCES departments(id),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE countries (
    id        SMALLSERIAL PRIMARY KEY,
    iso_code  CHAR(2) UNIQUE NOT NULL,
    name      VARCHAR(100) NOT NULL
);
CREATE TABLE port_types (
    id    SMALLSERIAL PRIMARY KEY,
    code  VARCHAR(30) UNIQUE NOT NULL,
    name  VARCHAR(100) NOT NULL
);
CREATE TYPE port_status_type AS ENUM ('ACTIVE','INACTIVE','RESTRICTED');
CREATE TABLE ports (
    id              BIGSERIAL PRIMARY KEY,
    port_name       VARCHAR(150) NOT NULL,
    country_id      SMALLINT REFERENCES countries(id),
    unlocode        CHAR(5),
    utc_offset_min  SMALLINT,
    latitude        NUMERIC(9,6),
    longitude       NUMERIC(9,6),
    is_canal        BOOLEAN NOT NULL DEFAULT false,
    port_type_id    SMALLINT REFERENCES port_types(id),
    port_status     port_status_type NOT NULL DEFAULT 'ACTIVE',
    remark          TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ports_name ON ports (port_name);
CREATE UNIQUE INDEX uq_ports_unlocode ON ports (unlocode) WHERE unlocode IS NOT NULL;
CREATE TABLE fuel_types (
    id          SMALLSERIAL PRIMARY KEY,
    code        VARCHAR(10) UNIQUE NOT NULL,
    description VARCHAR(100)
);
CREATE TYPE ownership_type AS ENUM ('OWNED','CHARTERED','MANAGED');
CREATE TABLE vessel_kinds (
    id    SMALLSERIAL PRIMARY KEY,
    code  VARCHAR(30) UNIQUE NOT NULL,
    name  VARCHAR(100) NOT NULL
);
CREATE TABLE vessel_types (
    id    SMALLSERIAL PRIMARY KEY,
    code  VARCHAR(20) UNIQUE NOT NULL,
    name  VARCHAR(100) NOT NULL
);
CREATE TABLE vessels (
    id             BIGSERIAL PRIMARY KEY,
    mv_name        VARCHAR(150) NOT NULL,
    imo_no         VARCHAR(10),
    call_sign      VARCHAR(20),
    vessel_code    VARCHAR(30),
    hull_no        VARCHAR(30),
    ownership      ownership_type NOT NULL DEFAULT 'OWNED',
    owner_company_id BIGINT,
    vessel_kind_id SMALLINT REFERENCES vessel_kinds(id),
    vessel_type_id SMALLINT REFERENCES vessel_types(id),
    flag           VARCHAR(50),
    class          VARCHAR(50),
    built_year     SMALLINT,
    dwt            NUMERIC(10,2),
    dwcc           NUMERIC(10,2),
    draft_m        NUMERIC(6,2),
    loa_m          NUMERIC(6,2),
    beam_m         NUMERIC(6,2),
    depth_m        NUMERIC(6,2),
    grt            NUMERIC(10,2),
    nrt            NUMERIC(10,2),
    scnt           NUMERIC(10,2),
    pc_ums_nt      NUMERIC(10,2),
    tpc            NUMERIC(8,3),
    grain_cbm      NUMERIC(12,2),
    bale_cbm       NUMERIC(12,2),
    constant_mt    NUMERIC(10,2),
    ice_class      VARCHAR(20),
    wap            VARCHAR(20),
    ho_ha_type     VARCHAR(30),
    ho_ha_gear     VARCHAR(30),
    tank_top_strength_upper  NUMERIC(10,2),
    tank_top_strength_tween  NUMERIC(10,2),
    hatch_cover_strength     NUMERIC(10,2),
    remark         TEXT,
    is_active      BOOLEAN NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by     BIGINT REFERENCES users(id)
);
CREATE INDEX idx_vessels_name ON vessels (mv_name);
CREATE TABLE vessel_gears (
    id           BIGSERIAL PRIMARY KEY,
    vessel_id    BIGINT NOT NULL REFERENCES vessels(id) ON DELETE CASCADE,
    gear_type    VARCHAR(30) NOT NULL,
    position     VARCHAR(30),
    capacity_mt  NUMERIC(8,2),
    qty_ea       SMALLINT
);
CREATE TABLE vessel_bunker_profiles (
    id              BIGSERIAL PRIMARY KEY,
    vessel_id       BIGINT NOT NULL REFERENCES vessels(id) ON DELETE CASCADE,
    profile_name    VARCHAR(100) NOT NULL,
    effective_from  DATE NOT NULL,
    effective_to    DATE,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    remark          TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      BIGINT REFERENCES users(id),
    CHECK (effective_to IS NULL OR effective_to >= effective_from)
);
CREATE INDEX idx_bunker_profiles_vessel ON vessel_bunker_profiles (vessel_id, effective_from);
CREATE TYPE perf_mode AS ENUM ('FULL','ECO','CUSTOM1','CUSTOM2','CUSTOM3');
CREATE TABLE vessel_performance_modes (
    id               BIGSERIAL PRIMARY KEY,
    profile_id       BIGINT NOT NULL REFERENCES vessel_bunker_profiles(id) ON DELETE CASCADE,
    mode             perf_mode NOT NULL,
    speed_ballast_kn NUMERIC(5,2) NOT NULL,
    speed_laden_kn   NUMERIC(5,2) NOT NULL,
    UNIQUE (profile_id, mode)
);
CREATE TYPE fuel_role      AS ENUM ('MAIN','SUB');
CREATE TYPE fuel_condition AS ENUM ('NORMAL','ECA');
CREATE TYPE vessel_activity AS ENUM ('BALLAST','LADEN','IDLE','WORK','SEA');
CREATE TABLE vessel_bunker_consumption (
    id                  BIGSERIAL PRIMARY KEY,
    vessel_mode_id      BIGINT NOT NULL REFERENCES vessel_performance_modes(id) ON DELETE CASCADE,
    fuel_role           fuel_role NOT NULL,
    condition           fuel_condition NOT NULL,
    fuel_type_id        SMALLINT NOT NULL REFERENCES fuel_types(id),
    activity            vessel_activity NOT NULL,
    consumption_mt_day  NUMERIC(8,3) NOT NULL,
    UNIQUE (vessel_mode_id, fuel_role, condition, activity)
);
CREATE TYPE estimate_type   AS ENUM ('VOYAGE','CARGO_RELET','TIME_CHARTER');
CREATE TYPE estimate_status AS ENUM ('DRAFT','CONFIRMED','FIXED','LOST','CANCELLED');
CREATE TABLE estimate_files (
    id           BIGSERIAL PRIMARY KEY,
    file_name    VARCHAR(150) NOT NULL,
    description  TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by   BIGINT REFERENCES users(id),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by   BIGINT REFERENCES users(id)
);
CREATE TABLE estimates (
    id               BIGSERIAL PRIMARY KEY,
    estimate_file_id BIGINT NOT NULL REFERENCES estimate_files(id) ON DELETE CASCADE,
    estimate_type    estimate_type NOT NULL,
    sheet_name       VARCHAR(100) NOT NULL,
    sheet_order      SMALLINT NOT NULL DEFAULT 1,
    status           estimate_status NOT NULL DEFAULT 'DRAFT',
    currency         CHAR(3) NOT NULL DEFAULT 'USD',
    routing_suez     BOOLEAN NOT NULL DEFAULT false,
    routing_panama   BOOLEAN NOT NULL DEFAULT false,
    routing_kiel     BOOLEAN NOT NULL DEFAULT false,
    margin_days      NUMERIC(6,2) NOT NULL DEFAULT 0,
    operator_user_id     BIGINT REFERENCES users(id),
    operation_dept_id    SMALLINT REFERENCES departments(id),
    remark           TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by       BIGINT REFERENCES users(id),
    UNIQUE (estimate_file_id, sheet_order)
);
CREATE INDEX idx_estimates_file ON estimates (estimate_file_id);
CREATE INDEX idx_estimates_type ON estimates (estimate_type);
CREATE TABLE estimate_vessels (
    id                BIGSERIAL PRIMARY KEY,
    estimate_id       BIGINT NOT NULL UNIQUE REFERENCES estimates(id) ON DELETE CASCADE,
    vessel_id         BIGINT REFERENCES vessels(id),
    bunker_profile_id BIGINT REFERENCES vessel_bunker_profiles(id),
    mode              perf_mode NOT NULL DEFAULT 'FULL',
    mv_name           VARCHAR(150) NOT NULL,
    dwt               NUMERIC(10,2),
    draft_m           NUMERIC(6,2),
    tpc               NUMERIC(8,3),
    built_year        SMALLINT,
    vessel_kind_id    SMALLINT REFERENCES vessel_kinds(id),
    vessel_type_id    SMALLINT REFERENCES vessel_types(id),
    speed_ballast_kn  NUMERIC(5,2) NOT NULL,
    speed_laden_kn    NUMERIC(5,2) NOT NULL
);
CREATE TABLE estimate_vessel_bunker (
    id                  BIGSERIAL PRIMARY KEY,
    estimate_vessel_id  BIGINT NOT NULL REFERENCES estimate_vessels(id) ON DELETE CASCADE,
    fuel_role           fuel_role NOT NULL,
    condition           fuel_condition NOT NULL,
    fuel_type_id        SMALLINT NOT NULL REFERENCES fuel_types(id),
    activity            vessel_activity NOT NULL,
    consumption_mt_day  NUMERIC(8,3) NOT NULL,
    UNIQUE (estimate_vessel_id, fuel_role, condition, activity)
);
CREATE TABLE estimate_voyage_durations (
    id                 BIGSERIAL PRIMARY KEY,
    estimate_id        BIGINT NOT NULL UNIQUE REFERENCES estimates(id) ON DELETE CASCADE,
    voyage_total_days  NUMERIC(8,2),
    laden_days         NUMERIC(8,2),
    ballast_days       NUMERIC(8,2),
    eca_days           NUMERIC(8,2),
    load_days          NUMERIC(8,2),
    discharge_days     NUMERIC(8,2),
    idle_days          NUMERIC(8,2),
    margin_days        NUMERIC(8,2),
    calculated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TYPE cp_side AS ENUM ('HEAD','SUB');
CREATE TABLE cp_terms (
    id         SMALLSERIAL PRIMARY KEY,
    code       VARCHAR(15) UNIQUE NOT NULL,
    term       VARCHAR(50) NOT NULL,
    paragraph  TEXT
);
CREATE TABLE estimate_cargo_lines (
    id                   BIGSERIAL PRIMARY KEY,
    estimate_id          BIGINT NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    line_no              SMALLINT NOT NULL,
    account_company_id   BIGINT,
    cargo_name           VARCHAR(150),
    loading_port_id      BIGINT REFERENCES ports(id),
    discharging_port_id  BIGINT REFERENCES ports(id),
    quantity_mt          NUMERIC(12,2),
    remark               TEXT,
    UNIQUE (estimate_id, line_no)
);
CREATE INDEX idx_cargo_lines_estimate ON estimate_cargo_lines (estimate_id);
CREATE TABLE estimate_cargo_freight_terms (
    id               BIGSERIAL PRIMARY KEY,
    cargo_line_id    BIGINT NOT NULL REFERENCES estimate_cargo_lines(id) ON DELETE CASCADE,
    cp_side          cp_side NOT NULL DEFAULT 'HEAD',
    freight_rate     NUMERIC(12,3),
    freight_term_id  SMALLINT REFERENCES cp_terms(id),
    add_comm_pct     NUMERIC(6,3),
    brokerage_pct    NUMERIC(6,3),
    freight_tax_pct  NUMERIC(6,3),
    liner_terms_id   SMALLINT REFERENCES cp_terms(id),
    net_freight      NUMERIC(18,2),
    total_freight    NUMERIC(18,2),
    is_freight_fixed BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (cargo_line_id, cp_side)
);
CREATE TYPE leg_type AS ENUM
    ('BALLAST','LOADING','DISCHARGE','CANAL','BUNKER','DELIVERY','REDELIVERY');
CREATE TABLE laytime_terms (
    id           SMALLSERIAL PRIMARY KEY,
    code         VARCHAR(15) UNIQUE NOT NULL,
    term         VARCHAR(60) NOT NULL,
    description  VARCHAR(150),
    factor       NUMERIC(6,4) NOT NULL DEFAULT 1.0000
);
CREATE TABLE estimate_port_legs (
    id              BIGSERIAL PRIMARY KEY,
    estimate_id     BIGINT NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    leg_no          SMALLINT NOT NULL,
    leg_type        leg_type NOT NULL,
    port_id         BIGINT REFERENCES ports(id),
    distance_nm     NUMERIC(10,2),
    eca_nm          NUMERIC(10,2),
    wf_pct          NUMERIC(6,3),
    speed_kn        NUMERIC(5,2),
    sea_days        NUMERIC(8,2),
    port_idle_days  NUMERIC(8,2),
    port_charge     NUMERIC(18,2),
    arrival_at      TIMESTAMPTZ,
    departure_at    TIMESTAMPTZ,
    remark          TEXT,
    UNIQUE (estimate_id, leg_no)
);
CREATE INDEX idx_port_legs_estimate ON estimate_port_legs (estimate_id);
CREATE TABLE estimate_port_leg_cp_terms (
    id               BIGSERIAL PRIMARY KEY,
    leg_id           BIGINT NOT NULL REFERENCES estimate_port_legs(id) ON DELETE CASCADE,
    cp_side          cp_side NOT NULL,
    ld_rate          NUMERIC(12,2),
    laytime_term_id  SMALLINT REFERENCES laytime_terms(id),
    demurrage        NUMERIC(18,2),
    despatch         NUMERIC(18,2),
    UNIQUE (leg_id, cp_side)
);
CREATE TABLE estimate_charter_terms (
    id                   BIGSERIAL PRIMARY KEY,
    estimate_id          BIGINT NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    cp_side              cp_side NOT NULL,
    account_company_id    BIGINT,
    delivery_port_id      BIGINT REFERENCES ports(id),
    redelivery_port_id    BIGINT REFERENCES ports(id),
    duration_days          NUMERIC(8,2),
    daily_hire              NUMERIC(18,2),
    gross_hire               NUMERIC(18,2),
    add_comm_pct              NUMERIC(6,3),
    brokerage_pct              NUMERIC(6,3),
    use_multi_duration          BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (estimate_id, cp_side)
);
CREATE TABLE estimate_charter_duration_periods (
    id                BIGSERIAL PRIMARY KEY,
    charter_term_id   BIGINT NOT NULL REFERENCES estimate_charter_terms(id) ON DELETE CASCADE,
    period_no         SMALLINT NOT NULL,
    duration_days     NUMERIC(8,2) NOT NULL,
    daily_hire        NUMERIC(18,2) NOT NULL,
    UNIQUE (charter_term_id, period_no)
);
CREATE TABLE estimate_bunker_opening_rob (
    id             BIGSERIAL PRIMARY KEY,
    estimate_id    BIGINT NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    fuel_type_id   SMALLINT NOT NULL REFERENCES fuel_types(id),
    start_rob_mt   NUMERIC(12,3) NOT NULL DEFAULT 0,
    UNIQUE (estimate_id, fuel_type_id)
);
CREATE TABLE estimate_leg_bunker_rob (
    id                          BIGSERIAL PRIMARY KEY,
    leg_id                      BIGINT NOT NULL REFERENCES estimate_port_legs(id) ON DELETE CASCADE,
    fuel_type_id                SMALLINT NOT NULL REFERENCES fuel_types(id),
    arrival_supply_qty          NUMERIC(12,3) NOT NULL DEFAULT 0,
    arrival_supply_unit_price   NUMERIC(12,2),
    departure_supply_qty        NUMERIC(12,3) NOT NULL DEFAULT 0,
    departure_supply_unit_price NUMERIC(12,2),
    arrival_rob_mt              NUMERIC(12,3),
    departure_rob_mt            NUMERIC(12,3),
    consumption_sea_mt          NUMERIC(12,3) NOT NULL DEFAULT 0,
    consumption_port_mt         NUMERIC(12,3) NOT NULL DEFAULT 0,
    UNIQUE (leg_id, fuel_type_id)
);
CREATE TABLE estimate_bunker_summary (
    id             BIGSERIAL PRIMARY KEY,
    estimate_id    BIGINT NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    fuel_type_id   SMALLINT NOT NULL REFERENCES fuel_types(id),
    price_per_mt   NUMERIC(12,2),
    consumption_mt NUMERIC(12,3),
    expense        NUMERIC(18,2),
    UNIQUE (estimate_id, fuel_type_id)
);
CREATE TABLE expense_categories (
    id    SMALLSERIAL PRIMARY KEY,
    code  VARCHAR(30) UNIQUE NOT NULL,
    name  VARCHAR(100) NOT NULL,
    flow  VARCHAR(10) NOT NULL DEFAULT 'EXPENSE' CHECK (flow IN ('INCOME','EXPENSE'))
);
CREATE TABLE estimate_expense_items (
    id           BIGSERIAL PRIMARY KEY,
    estimate_id  BIGINT NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    category_id  SMALLINT NOT NULL REFERENCES expense_categories(id),
    cp_side      cp_side,
    amount       NUMERIC(18,2) NOT NULL,
    remark       TEXT,
    UNIQUE (estimate_id, category_id, cp_side)
);
CREATE TYPE result_side AS ENUM ('TOTAL','HEAD','SUB','DIFF');
CREATE TABLE estimate_results (
    id                   BIGSERIAL PRIMARY KEY,
    estimate_id          BIGINT NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    side                 result_side NOT NULL DEFAULT 'TOTAL',
    total_duration_days  NUMERIC(8,2),
    total_distance_nm    NUMERIC(10,2),
    revenue              NUMERIC(18,2),
    op_expense           NUMERIC(18,2),
    op_profit            NUMERIC(18,2),
    total_hire           NUMERIC(18,2),
    total_freight        NUMERIC(18,2),
    profit_usd           NUMERIC(18,2),
    profit_rate_pct      NUMERIC(6,3),
    tce_usd_day          NUMERIC(18,2),
    daily_revenue        NUMERIC(18,2),
    daily_expense        NUMERIC(18,2),
    daily_profit         NUMERIC(18,2),
    calculated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (estimate_id, side)
);
CREATE INDEX idx_estimate_results_profit ON estimate_results (profit_usd);
CREATE INDEX idx_estimate_results_tce    ON estimate_results (tce_usd_day);
CREATE TABLE actual_voyages (
    id            BIGSERIAL PRIMARY KEY,
    estimate_id   BIGINT REFERENCES estimates(id),
    vessel_id     BIGINT NOT NULL REFERENCES vessels(id),
    voyage_code   VARCHAR(50) NOT NULL,
    voyage_type   estimate_type NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'ONGOING'
                  CHECK (status IN ('ONGOING','COMPLETED','CANCELLED')),
    currency      CHAR(3) NOT NULL DEFAULT 'USD',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by    BIGINT REFERENCES users(id)
);
CREATE UNIQUE INDEX uq_actual_voyages_code ON actual_voyages (vessel_id, voyage_code);
CREATE TYPE actual_leg_status AS ENUM ('LADEN','BALLAST');
CREATE TABLE actual_voyage_legs (
    id               BIGSERIAL PRIMARY KEY,
    actual_voyage_id BIGINT NOT NULL REFERENCES actual_voyages(id) ON DELETE CASCADE,
    leg_no           SMALLINT NOT NULL,
    from_port_id     BIGINT REFERENCES ports(id),
    to_port_id       BIGINT REFERENCES ports(id),
    leg_status       actual_leg_status NOT NULL,
    remark           TEXT,
    UNIQUE (actual_voyage_id, leg_no)
);
CREATE TABLE actual_voyage_port_calls (
    id                BIGSERIAL PRIMARY KEY,
    actual_voyage_id  BIGINT NOT NULL REFERENCES actual_voyages(id) ON DELETE CASCADE,
    call_no           SMALLINT NOT NULL,
    port_id           BIGINT REFERENCES ports(id),
    call_purpose      VARCHAR(20) NOT NULL,
    remark            TEXT,
    UNIQUE (actual_voyage_id, call_no)
);
CREATE TYPE voyage_event_type AS ENUM (
    'START_OF_SEA_PASSAGE','STOP_SEA_PASSAGE','RESUME_SEA_PASSAGE','END_OF_SEA_PASSAGE',
    'ANCHOR','ANCHOR_AWEIGH','ALL_FAST',
    'CARGO_OPS_COMMENCE','CARGO_OPS_COMPLETE','UNMOOR'
);
CREATE TABLE actual_voyage_events (
    id                BIGSERIAL PRIMARY KEY,
    actual_voyage_id  BIGINT NOT NULL REFERENCES actual_voyages(id) ON DELETE CASCADE,
    leg_id            BIGINT REFERENCES actual_voyage_legs(id),
    port_call_id      BIGINT REFERENCES actual_voyage_port_calls(id),
    event_type        voyage_event_type NOT NULL,
    event_time        TIMESTAMPTZ NOT NULL,
    shift_no          SMALLINT NOT NULL DEFAULT 1,
    remark            TEXT,
    CHECK ((leg_id IS NOT NULL) <> (port_call_id IS NOT NULL))
);
CREATE INDEX idx_actual_events_voyage ON actual_voyage_events (actual_voyage_id, event_time);
CREATE UNIQUE INDEX uq_actual_events_leg  ON actual_voyage_events (leg_id, event_type, shift_no)       WHERE leg_id IS NOT NULL;
CREATE UNIQUE INDEX uq_actual_events_port ON actual_voyage_events (port_call_id, event_type, shift_no) WHERE port_call_id IS NOT NULL;
CREATE TABLE actual_voyage_durations (
    id                 BIGSERIAL PRIMARY KEY,
    actual_voyage_id   BIGINT NOT NULL UNIQUE REFERENCES actual_voyages(id) ON DELETE CASCADE,
    voyage_total_days  NUMERIC(8,2),
    sea_days           NUMERIC(8,2),
    port_days          NUMERIC(8,2),
    laden_days         NUMERIC(8,2),
    ballast_days       NUMERIC(8,2),
    anchor_drift_days  NUMERIC(8,2),
    load_days          NUMERIC(8,2),
    discharge_days     NUMERIC(8,2),
    idle_days          NUMERIC(8,2),
    channel_days       NUMERIC(8,2),
    calculated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE actual_voyage_port_call_durations (
    id              BIGSERIAL PRIMARY KEY,
    port_call_id    BIGINT NOT NULL UNIQUE REFERENCES actual_voyage_port_calls(id) ON DELETE CASCADE,
    port_days       NUMERIC(8,2),
    anchor_days     NUMERIC(8,2),
    channel_days    NUMERIC(8,2),
    load_days       NUMERIC(8,2),
    discharge_days  NUMERIC(8,2),
    idle_days       NUMERIC(8,2)
);
CREATE TABLE actual_voyage_bunker_readings (
    id                 BIGSERIAL PRIMARY KEY,
    event_id           BIGINT NOT NULL REFERENCES actual_voyage_events(id) ON DELETE CASCADE,
    fuel_type_id       SMALLINT NOT NULL REFERENCES fuel_types(id),
    rob_mt             NUMERIC(12,3),
    supply_qty_mt      NUMERIC(12,3),
    supply_unit_price  NUMERIC(12,2),
    UNIQUE (event_id, fuel_type_id)
);
CREATE TABLE actual_voyage_bunker_opening_closing (
    id                BIGSERIAL PRIMARY KEY,
    actual_voyage_id  BIGINT NOT NULL REFERENCES actual_voyages(id) ON DELETE CASCADE,
    fuel_type_id      SMALLINT NOT NULL REFERENCES fuel_types(id),
    opening_rob_mt    NUMERIC(12,3) NOT NULL DEFAULT 0,
    closing_rob_mt    NUMERIC(12,3),
    UNIQUE (actual_voyage_id, fuel_type_id)
);
CREATE TABLE actual_voyage_bunker_summary (
    id                    BIGSERIAL PRIMARY KEY,
    actual_voyage_id      BIGINT NOT NULL REFERENCES actual_voyages(id) ON DELETE CASCADE,
    fuel_type_id          SMALLINT NOT NULL REFERENCES fuel_types(id),
    total_supply_mt       NUMERIC(12,3),
    total_consumption_mt  NUMERIC(12,3),
    weighted_avg_price    NUMERIC(12,2),
    total_cost            NUMERIC(18,2),
    UNIQUE (actual_voyage_id, fuel_type_id)
);
CREATE TYPE actual_consumption_activity AS ENUM ('LADEN','BALLAST','LOADING','DISCHARGE','IDLE');
CREATE TABLE actual_voyage_bunker_by_activity (
    id                BIGSERIAL PRIMARY KEY,
    actual_voyage_id  BIGINT NOT NULL REFERENCES actual_voyages(id) ON DELETE CASCADE,
    fuel_type_id      SMALLINT NOT NULL REFERENCES fuel_types(id),
    activity          actual_consumption_activity NOT NULL,
    consumption_mt    NUMERIC(12,3) NOT NULL DEFAULT 0,
    UNIQUE (actual_voyage_id, fuel_type_id, activity)
);
CREATE TYPE off_hire_place AS ENUM ('PORT','SEA');
CREATE TABLE actual_voyage_off_hires (
    id                     BIGSERIAL PRIMARY KEY,
    actual_voyage_id       BIGINT NOT NULL REFERENCES actual_voyages(id) ON DELETE CASCADE,
    place_type             off_hire_place NOT NULL,
    from_port_id           BIGINT REFERENCES ports(id),
    to_port_id             BIGINT REFERENCES ports(id),
    due_to                 VARCHAR(255) NOT NULL,
    from_at                TIMESTAMPTZ NOT NULL,
    to_at                  TIMESTAMPTZ NOT NULL,
    tz_offset_min          SMALLINT,
    rate_pct               NUMERIC(6,3) NOT NULL DEFAULT 100,
    net_duration_days      NUMERIC(8,3),
    daily_hire             NUMERIC(18,2) NOT NULL,
    gross_hire_amount      NUMERIC(18,2),
    add_comm_pct           NUMERIC(6,3),
    net_hire_amount        NUMERIC(18,2),
    cev_amount             NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_off_hire_amount  NUMERIC(18,2),
    remark                 TEXT,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by             BIGINT REFERENCES users(id)
);
CREATE TABLE actual_voyage_off_hire_bunker (
    id            BIGSERIAL PRIMARY KEY,
    off_hire_id   BIGINT NOT NULL REFERENCES actual_voyage_off_hires(id) ON DELETE CASCADE,
    fuel_type_id  SMALLINT NOT NULL REFERENCES fuel_types(id),
    quantity_mt   NUMERIC(12,3) NOT NULL DEFAULT 0,
    unit_price    NUMERIC(12,2),
    amount        NUMERIC(18,2),
    UNIQUE (off_hire_id, fuel_type_id)
);
CREATE TABLE actual_voyage_off_hire_additional_costs (
    id           BIGSERIAL PRIMARY KEY,
    off_hire_id  BIGINT NOT NULL REFERENCES actual_voyage_off_hires(id) ON DELETE CASCADE,
    line_no      SMALLINT NOT NULL,
    description  VARCHAR(200) NOT NULL,
    amount       NUMERIC(18,2) NOT NULL,
    UNIQUE (off_hire_id, line_no)
);
CREATE TABLE actual_voyage_cargo_lines (
    id                       BIGSERIAL PRIMARY KEY,
    actual_voyage_id         BIGINT NOT NULL REFERENCES actual_voyages(id) ON DELETE CASCADE,
    estimate_cargo_line_id   BIGINT REFERENCES estimate_cargo_lines(id),
    line_no                  SMALLINT NOT NULL,
    account_company_id       BIGINT,
    cargo_name                VARCHAR(150),
    loading_port_id            BIGINT REFERENCES ports(id),
    discharging_port_id        BIGINT REFERENCES ports(id),
    bl_quantity_mt              NUMERIC(12,2) NOT NULL,
    remark                      TEXT,
    UNIQUE (actual_voyage_id, line_no)
);
CREATE TABLE actual_voyage_cargo_freight_terms (
    id                BIGSERIAL PRIMARY KEY,
    cargo_line_id     BIGINT NOT NULL REFERENCES actual_voyage_cargo_lines(id) ON DELETE CASCADE,
    cp_side           cp_side NOT NULL DEFAULT 'HEAD',
    freight_rate      NUMERIC(12,3),
    freight_term_id   SMALLINT REFERENCES cp_terms(id),
    add_comm_pct      NUMERIC(6,3),
    brokerage_pct     NUMERIC(6,3),
    freight_tax_pct   NUMERIC(6,3),
    liner_terms_id    SMALLINT REFERENCES cp_terms(id),
    net_freight       NUMERIC(18,2),
    total_freight     NUMERIC(18,2),
    UNIQUE (cargo_line_id, cp_side)
);
CREATE TABLE actual_voyage_port_call_expenses (
    id            BIGSERIAL PRIMARY KEY,
    port_call_id  BIGINT NOT NULL REFERENCES actual_voyage_port_calls(id) ON DELETE CASCADE,
    category_id   SMALLINT NOT NULL REFERENCES expense_categories(id),
    amount        NUMERIC(18,2) NOT NULL,
    remark        TEXT,
    UNIQUE (port_call_id, category_id)
);
CREATE TABLE actual_voyage_expense_items (
    id                BIGSERIAL PRIMARY KEY,
    actual_voyage_id  BIGINT NOT NULL REFERENCES actual_voyages(id) ON DELETE CASCADE,
    category_id       SMALLINT NOT NULL REFERENCES expense_categories(id),
    cp_side           cp_side,
    amount            NUMERIC(18,2) NOT NULL,
    remark            TEXT,
    UNIQUE (actual_voyage_id, category_id, cp_side)
);
CREATE TABLE voyage_variances (
    id                  BIGSERIAL PRIMARY KEY,
    estimate_id         BIGINT NOT NULL REFERENCES estimates(id),
    actual_voyage_id    BIGINT NOT NULL REFERENCES actual_voyages(id),
    side                result_side NOT NULL DEFAULT 'TOTAL',
    est_duration_days   NUMERIC(8,2),  act_duration_days   NUMERIC(8,2),  diff_duration_days   NUMERIC(8,2),
    est_laden_days      NUMERIC(8,2),  act_laden_days      NUMERIC(8,2),  diff_laden_days      NUMERIC(8,2),
    est_ballast_days    NUMERIC(8,2),  act_ballast_days    NUMERIC(8,2),  diff_ballast_days    NUMERIC(8,2),
    est_port_days       NUMERIC(8,2),  act_port_days       NUMERIC(8,2),  diff_port_days       NUMERIC(8,2),
    est_idle_days       NUMERIC(8,2),  act_idle_days       NUMERIC(8,2),  diff_idle_days       NUMERIC(8,2),
    est_bunker_consumption_mt NUMERIC(12,3), act_bunker_consumption_mt NUMERIC(12,3), diff_bunker_consumption_mt NUMERIC(12,3),
    est_bunker_cost      NUMERIC(18,2), act_bunker_cost      NUMERIC(18,2), diff_bunker_cost      NUMERIC(18,2),
    est_revenue          NUMERIC(18,2), act_revenue          NUMERIC(18,2), diff_revenue          NUMERIC(18,2),
    est_op_expense       NUMERIC(18,2), act_op_expense       NUMERIC(18,2), diff_op_expense       NUMERIC(18,2),
    est_off_hire_amount  NUMERIC(18,2), act_off_hire_amount  NUMERIC(18,2), diff_off_hire_amount  NUMERIC(18,2),
    est_profit_usd       NUMERIC(18,2), act_profit_usd       NUMERIC(18,2), diff_profit_usd       NUMERIC(18,2),
    est_tce_usd_day      NUMERIC(18,2), act_tce_usd_day      NUMERIC(18,2), diff_tce_usd_day      NUMERIC(18,2),
    calculated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (estimate_id, actual_voyage_id, side)
);
CREATE INDEX idx_voyage_variances_actual ON voyage_variances (actual_voyage_id);
CREATE TABLE business_types (
    id    SMALLSERIAL PRIMARY KEY,
    code  VARCHAR(30) UNIQUE NOT NULL,
    name  VARCHAR(100) NOT NULL
);
CREATE TABLE im_types (
    id    SMALLSERIAL PRIMARY KEY,
    code  VARCHAR(20) UNIQUE NOT NULL,
    name  VARCHAR(50) NOT NULL
);
CREATE TABLE companies (
    id                BIGSERIAL PRIMARY KEY,
    company_name      VARCHAR(200) NOT NULL,
    country_id        SMALLINT REFERENCES countries(id),
    time_zone         VARCHAR(10),
    remark            TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by        BIGINT REFERENCES users(id)
);
CREATE INDEX idx_companies_name ON companies (company_name);
CREATE TABLE company_business_types (
    company_id        BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    business_type_id  SMALLINT NOT NULL REFERENCES business_types(id),
    PRIMARY KEY (company_id, business_type_id)
);
CREATE TABLE company_aliases (
    id          BIGSERIAL PRIMARY KEY,
    company_id  BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    alias       VARCHAR(200) NOT NULL,
    UNIQUE (company_id, alias)
);
CREATE TABLE contact_persons (
    id          BIGSERIAL PRIMARY KEY,
    company_id  BIGINT NOT NULL REFERENCES companies(id),
    full_name   VARCHAR(150) NOT NULL,
    division    VARCHAR(100),
    title       VARCHAR(100),
    remark      TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by  BIGINT REFERENCES users(id)
);
CREATE INDEX idx_contact_persons_company ON contact_persons (company_id);
CREATE TABLE addresses (
    id                 BIGSERIAL PRIMARY KEY,
    company_id         BIGINT REFERENCES companies(id) ON DELETE CASCADE,
    contact_person_id  BIGINT REFERENCES contact_persons(id) ON DELETE CASCADE,
    label              VARCHAR(50) NOT NULL DEFAULT 'Address',
    country_id         SMALLINT REFERENCES countries(id),
    province           VARCHAR(100),
    post_code          VARCHAR(20),
    city               VARCHAR(100),
    detail             TEXT,
    sort_order         SMALLINT NOT NULL DEFAULT 1,
    CHECK ((company_id IS NOT NULL) <> (contact_person_id IS NOT NULL))
);
CREATE INDEX idx_addresses_company ON addresses (company_id);
CREATE INDEX idx_addresses_contact ON addresses (contact_person_id);
CREATE TYPE contact_channel_type AS ENUM
    ('PHONE','FAX','MOBILE','EMAIL','WEBSITE','BANK_ACCOUNT','INSTANT_MESSENGER');
CREATE TABLE contact_channels (
    id                 BIGSERIAL PRIMARY KEY,
    company_id         BIGINT REFERENCES companies(id) ON DELETE CASCADE,
    contact_person_id  BIGINT REFERENCES contact_persons(id) ON DELETE CASCADE,
    channel_type       contact_channel_type NOT NULL,
    country_code       VARCHAR(5),
    im_type_id         SMALLINT REFERENCES im_types(id),
    value              VARCHAR(200) NOT NULL,
    sort_order         SMALLINT NOT NULL DEFAULT 1,
    CHECK ((company_id IS NOT NULL) <> (contact_person_id IS NOT NULL))
);
CREATE INDEX idx_contact_channels_company ON contact_channels (company_id);
CREATE INDEX idx_contact_channels_contact ON contact_channels (contact_person_id);
CREATE TABLE company_relations (
    id                  BIGSERIAL PRIMARY KEY,
    company_id          BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    related_company_id  BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    relation_note       VARCHAR(200),
    UNIQUE (company_id, related_company_id),
    CHECK (company_id <> related_company_id)
);
ALTER TABLE vessels
    ADD CONSTRAINT fk_vessels_owner_company FOREIGN KEY (owner_company_id) REFERENCES companies(id);
ALTER TABLE estimate_cargo_lines
    ADD CONSTRAINT fk_est_cargo_lines_account FOREIGN KEY (account_company_id) REFERENCES companies(id);
ALTER TABLE estimate_charter_terms
    ADD CONSTRAINT fk_est_charter_terms_account FOREIGN KEY (account_company_id) REFERENCES companies(id);
ALTER TABLE actual_voyage_cargo_lines
    ADD CONSTRAINT fk_act_cargo_lines_account FOREIGN KEY (account_company_id) REFERENCES companies(id);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated;
    END IF;
END $$;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'departments',
        'users',
        'countries',
        'port_types',
        'ports',
        'fuel_types',
        'vessel_kinds',
        'vessel_types',
        'vessels',
        'vessel_gears',
        'vessel_bunker_profiles',
        'vessel_performance_modes',
        'vessel_bunker_consumption',
        'estimate_files',
        'estimates',
        'estimate_vessels',
        'estimate_vessel_bunker',
        'estimate_voyage_durations',
        'cp_terms',
        'estimate_cargo_lines',
        'estimate_cargo_freight_terms',
        'laytime_terms',
        'estimate_port_legs',
        'estimate_port_leg_cp_terms',
        'estimate_charter_terms',
        'estimate_charter_duration_periods',
        'estimate_bunker_opening_rob',
        'estimate_leg_bunker_rob',
        'estimate_bunker_summary',
        'expense_categories',
        'estimate_expense_items',
        'estimate_results',
        'actual_voyages',
        'actual_voyage_legs',
        'actual_voyage_port_calls',
        'actual_voyage_events',
        'actual_voyage_durations',
        'actual_voyage_port_call_durations',
        'actual_voyage_bunker_readings',
        'actual_voyage_bunker_opening_closing',
        'actual_voyage_bunker_summary',
        'actual_voyage_bunker_by_activity',
        'actual_voyage_off_hires',
        'actual_voyage_off_hire_bunker',
        'actual_voyage_off_hire_additional_costs',
        'actual_voyage_cargo_lines',
        'actual_voyage_cargo_freight_terms',
        'actual_voyage_port_call_expenses',
        'actual_voyage_expense_items',
        'voyage_variances',
        'business_types',
        'im_types',
        'companies',
        'company_business_types',
        'company_aliases',
        'contact_persons',
        'addresses',
        'contact_channels',
        'company_relations'
    ])
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format(
            'CREATE POLICY authenticated_full_access ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true);',
            tbl
        );
    END LOOP;
END $$;
