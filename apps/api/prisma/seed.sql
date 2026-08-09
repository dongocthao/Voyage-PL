INSERT INTO departments (code, name) VALUES
    ('CHARTERING', 'Chartering'),
    ('OPERATION', 'Operation'),
    ('ACCOUNTING', 'Accounting'),
    ('MANAGEMENT', 'Management')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO users (username, full_name, email, job_title, department_id)
SELECT 'admin', 'Administrator', 'admin@voyage-pnl.local', 'System Administrator', d.id
FROM departments d
WHERE d.code = 'MANAGEMENT'
ON CONFLICT (username) DO UPDATE
SET full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    job_title = EXCLUDED.job_title,
    department_id = EXCLUDED.department_id;

INSERT INTO countries (iso_code, name) VALUES
    ('VN', 'Vietnam'),
    ('SG', 'Singapore'),
    ('KR', 'South Korea'),
    ('CN', 'China'),
    ('JP', 'Japan'),
    ('US', 'United States')
ON CONFLICT (iso_code) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO companies (company_name, country_id, time_zone, remark)
SELECT item.company_name, countries.id, item.time_zone, item.remark
FROM (
    VALUES
        ('Demo Charterer A', 'SG', '+08:00', 'Seed company for voyage estimation cargo account lookup'),
        ('Demo Charterer B', 'CN', '+08:00', 'Seed company for voyage estimation cargo account lookup')
) AS item(company_name, iso_code, time_zone, remark)
JOIN countries ON countries.iso_code = item.iso_code
WHERE NOT EXISTS (
    SELECT 1
    FROM companies
    WHERE companies.company_name = item.company_name
);

INSERT INTO port_types (code, name) VALUES
    ('SEA_PORT', 'Sea Port'),
    ('RIVER_PORT', 'River Port'),
    ('ANCHORAGE', 'Anchorage'),
    ('CANAL', 'Canal'),
    ('TRANSIT_POINT', 'Transit Point')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO ports (port_name, country_id, unlocode, utc_offset_min, is_canal, port_type_id)
SELECT port_name, countries.id, unlocode, utc_offset_min, is_canal, port_types.id
FROM (
    VALUES
        ('Ho Chi Minh City', 'VN', 'VNSGN', 420, false, 'SEA_PORT'),
        ('Singapore', 'SG', 'SGSIN', 480, false, 'SEA_PORT'),
        ('Busan', 'KR', 'KRPUS', 540, false, 'SEA_PORT'),
        ('Shanghai', 'CN', 'CNSHA', 480, false, 'SEA_PORT'),
        ('Yokohama', 'JP', 'JPYOK', 540, false, 'SEA_PORT')
) AS seed(port_name, country_code, unlocode, utc_offset_min, is_canal, port_type_code)
JOIN countries ON countries.iso_code = seed.country_code
JOIN port_types ON port_types.code = seed.port_type_code
ON CONFLICT DO NOTHING;

INSERT INTO fuel_types (code, description) VALUES
    ('VLSFO', 'Very Low Sulfur Fuel Oil'),
    ('ULSFO', 'Ultra Low Sulfur Fuel Oil'),
    ('HSFO', 'High Sulfur Fuel Oil'),
    ('MGO', 'Marine Gas Oil'),
    ('LSMGO', 'Low Sulfur Marine Gas Oil')
ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO vessel_kinds (code, name) VALUES
    ('BULK', 'Bulk Carrier'),
    ('TANKER', 'Tanker'),
    ('CONTAINER', 'Container Vessel'),
    ('MPP', 'Multi Purpose Vessel')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO vessel_types (code, name) VALUES
    ('GEARED', 'Geared'),
    ('GEARLESS', 'Gearless'),
    ('TCT', 'Time Charter Trip')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO cp_terms (code, term, paragraph) VALUES
    ('FI', 'Free In', NULL),
    ('FO', 'Free Out', NULL),
    ('FIO', 'Free In and Out', NULL),
    ('FIOS', 'Free In, Out and Stowed', NULL),
    ('FIOST', 'Free In, Out, Stowed and Trimmed', NULL),
    ('LT', 'Liner Terms', NULL),
    ('BT', 'Berth Terms', NULL)
ON CONFLICT (code) DO UPDATE
SET term = EXCLUDED.term,
    paragraph = EXCLUDED.paragraph;

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
    stowage_factor_unit = EXCLUDED.stowage_factor_unit;

INSERT INTO laytime_terms (code, term, description, factor) VALUES
    ('SHINC', 'Sundays Holidays Included', NULL, 1.0000),
    ('SHEX', 'Sundays Holidays Excepted', NULL, 0.8571),
    ('FHINC', 'Fridays Holidays Included', NULL, 1.0000),
    ('CQD', 'Customary Quick Dispatch', NULL, 1.0000)
ON CONFLICT (code) DO UPDATE
SET term = EXCLUDED.term,
    description = EXCLUDED.description,
    factor = EXCLUDED.factor;

INSERT INTO expense_categories (code, name, flow) VALUES
    ('FREIGHT', 'Freight', 'INCOME'),
    ('BALLAST_BONUS', 'Ballast Bonus', 'INCOME'),
    ('BUNKER', 'Bunker Cost', 'EXPENSE'),
    ('PORT_CHARGE', 'Port Charge', 'EXPENSE'),
    ('CANAL_TOLL', 'Canal Toll', 'EXPENSE'),
    ('DEM_DES', 'Despatch', 'EXPENSE'),
    ('BROKERAGE', 'Brokerage', 'EXPENSE'),
    ('ADD_COMM', 'Address Commission', 'EXPENSE'),
    ('FREIGHT_TAX', 'Freight Tax', 'EXPENSE'),
    ('LINER_TERMS', 'Liner Terms', 'EXPENSE'),
    ('ROUTING_SERVICE', 'Routing Service', 'EXPENSE'),
    ('OTHER', 'Other', 'EXPENSE'),
    ('OTHER_INCOME', 'Other Income', 'INCOME')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    flow = EXCLUDED.flow;

INSERT INTO business_types (code, name) VALUES
    ('OWNER', 'Owner'),
    ('CHARTERER', 'Charterer'),
    ('BROKER', 'Broker'),
    ('BUNKER_SUPPLIER', 'Bunker Supplier'),
    ('AGENT', 'Agent'),
    ('BANK', 'Bank')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO im_types (code, name) VALUES
    ('SKYPE', 'Skype'),
    ('WHATSAPP', 'WhatsApp'),
    ('ZALO', 'Zalo'),
    ('WECHAT', 'WeChat')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
