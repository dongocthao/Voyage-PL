CREATE TABLE IF NOT EXISTS fuel_categories (
    id          SMALLSERIAL PRIMARY KEY,
    code        VARCHAR(30) UNIQUE NOT NULL,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(200),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fuel_types
    ADD COLUMN IF NOT EXISTS fuel_category_id SMALLINT REFERENCES fuel_categories(id),
    ADD COLUMN IF NOT EXISTS fuel_type_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS iso_standard VARCHAR(50),
    ADD COLUMN IF NOT EXISTS max_sulphur_percent NUMERIC(6,3),
    ADD COLUMN IF NOT EXISTS carbon_factor NUMERIC(8,3),
    ADD COLUMN IF NOT EXISTS default_density NUMERIC(8,4),
    ADD COLUMN IF NOT EXISTS is_eca_compliant BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE fuel_types
SET fuel_type_name = COALESCE(NULLIF(fuel_type_name, ''), description, code)
WHERE fuel_type_name IS NULL OR fuel_type_name = '';

CREATE INDEX IF NOT EXISTS idx_fuel_types_category ON fuel_types (fuel_category_id);

ALTER TABLE vessel_kinds
    ADD COLUMN IF NOT EXISTS description VARCHAR(200),
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE vessel_types
    ADD COLUMN IF NOT EXISTS vessel_kind_id SMALLINT REFERENCES vessel_kinds(id),
    ADD COLUMN IF NOT EXISTS type_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS description VARCHAR(200),
    ADD COLUMN IF NOT EXISTS dwt_min_range NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS dwt_max_range NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE vessel_types
SET type_name = COALESCE(NULLIF(type_name, ''), name, code)
WHERE type_name IS NULL OR type_name = '';

UPDATE vessel_types
SET name = COALESCE(NULLIF(name, ''), type_name, code)
WHERE name IS NULL OR name = '';

CREATE INDEX IF NOT EXISTS idx_vessel_types_kind ON vessel_types (vessel_kind_id);
CREATE INDEX IF NOT EXISTS idx_vessels_kind_type ON vessels (vessel_kind_id, vessel_type_id);

INSERT INTO fuel_categories (code, name, description, is_active)
VALUES
    ('HSFO', 'HSFO', 'High sulphur fuel oil family', true),
    ('VLSFO', 'VLSFO', 'Very low sulphur fuel oil family', true),
    ('ULSFO', 'ULSFO', 'Ultra low sulphur fuel oil family', true),
    ('MGO_MDO', 'MGO/MDO', 'Marine gasoil and marine diesel oil family', true),
    ('GAS_FUEL', 'Gas Fuel', 'Liquefied gas marine fuels', true),
    ('BIOFUEL', 'Biofuel', 'Bio-derived marine fuel family', true),
    ('ALTERNATIVE', 'Alternative', 'Alternative zero or low carbon marine fuels', true)
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

INSERT INTO vessel_kinds (code, name, description, is_active)
VALUES
    ('DRY_BULK', 'Dry Bulk', 'Bulk carriers for unpackaged dry cargo', true),
    ('GEN_CARGO', 'General Cargo', 'Breakbulk and multipurpose cargo vessels', true),
    ('CONTAINER', 'Container', 'Container ships by slot capacity class', true),
    ('TANKER', 'Tanker', 'Liquid cargo tanker segments', true),
    ('GAS_CARRIER', 'Gas Carrier', 'LPG, LNG and gas carrier segments', true),
    ('RORO_PAX', 'Ro-Ro & Passenger', 'Ro-Ro, passenger and combined pax freight segments', true),
    ('OFFSHORE', 'Offshore & Service', 'Offshore support and marine service vessels', true)
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

INSERT INTO vessel_types (code, name, vessel_kind_id, type_name, description, dwt_min_range, dwt_max_range, is_active)
SELECT v.code, v.type_name, k.id, v.type_name, v.description, v.dwt_min_range, v.dwt_max_range, true
FROM (
    VALUES
    ('HANDY', 'DRY_BULK', 'Handysize', 'Small dry bulk handy segment', 15000, 39999),
    ('HMAX', 'DRY_BULK', 'Handymax', 'Legacy handymax dry bulk segment', 40000, 49999),
    ('SMAX', 'DRY_BULK', 'Supramax', 'Supramax dry bulk segment', 50000, 59999),
    ('UMAX', 'DRY_BULK', 'Ultramax', 'Ultramax dry bulk segment', 60000, 66999),
    ('PMAX', 'DRY_BULK', 'Panamax', 'Panamax dry bulk segment', 67000, 79999),
    ('KMAX', 'DRY_BULK', 'Kamsarmax', 'Kamsarmax dry bulk segment', 80000, 87999),
    ('PPMAX', 'DRY_BULK', 'Post-Panamax', 'Post-Panamax dry bulk segment', 88000, 119999),
    ('CAPE', 'DRY_BULK', 'Capesize', 'Capesize dry bulk segment', 120000, 209999),
    ('VLOC', 'DRY_BULK', 'VLOC', 'Very large ore carrier segment', 210000, 400000),
    ('GCS', 'GEN_CARGO', 'General Cargo Ship', 'Conventional general cargo ship', 3000, 15000),
    ('MPP', 'GEN_CARGO', 'Multi-Purpose (MPP)', 'Multipurpose breakbulk vessel', 8000, 25000),
    ('HL', 'GEN_CARGO', 'Heavy Lift', 'Heavy lift/project cargo vessel', 10000, 25000),
    ('LOG', 'GEN_CARGO', 'Log Carrier', 'Timber and log cargo vessel', 8000, 30000),
    ('TDK', 'GEN_CARGO', 'Tween Decker', 'Tween deck general cargo vessel', 5000, 18000),
    ('FDR', 'CONTAINER', 'Feeder (< 3,000 TEU)', 'Feeder container vessel under 3,000 TEU', 8000, 35000),
    ('CPMAX', 'CONTAINER', 'Panamax', 'Panamax container vessel', 35000, 65000),
    ('CPPOST', 'CONTAINER', 'Post-Panamax', 'Post-Panamax container vessel', 65001, 100000),
    ('CNEO', 'CONTAINER', 'Neo-Panamax', 'Neo-Panamax container vessel', 100001, 150000),
    ('ULCV', 'CONTAINER', 'ULCV', 'Ultra large container vessel', 150001, 240000),
    ('SPT', 'TANKER', 'Small Product', 'Small clean product tanker', 5000, 24999),
    ('MR', 'TANKER', 'MR', 'Medium range product tanker', 25000, 54999),
    ('LR1', 'TANKER', 'Panamax/LR1', 'Panamax or LR1 tanker segment', 55000, 79999),
    ('LR2', 'TANKER', 'Aframax/LR2', 'Aframax or LR2 tanker segment', 80000, 119999),
    ('SUEZ', 'TANKER', 'Suezmax', 'Suezmax tanker segment', 120000, 199999),
    ('VLCC', 'TANKER', 'VLCC', 'Very large crude carrier', 200000, 319999),
    ('ULCC', 'TANKER', 'ULCC', 'Ultra large crude carrier', 320000, 550000),
    ('CHEM', 'TANKER', 'Chemical Tanker', 'Specialized chemical tanker', 5000, 50000),
    ('BIT', 'TANKER', 'Bitumen/Asphalt', 'Bitumen and asphalt tanker', 3000, 25000),
    ('SLPG', 'GAS_CARRIER', 'Small LPG', 'Small pressurized or semi-refrigerated LPG carrier', 2000, 9999),
    ('MGC', 'GAS_CARRIER', 'MGC', 'Medium gas carrier', 10000, 29999),
    ('VLGC', 'GAS_CARRIER', 'VLGC', 'Very large gas carrier', 30000, 84999),
    ('LNGM', 'GAS_CARRIER', 'LNG (Membrane)', 'Membrane type LNG carrier', 70000, 130000),
    ('LNGS', 'GAS_CARRIER', 'LNG (Moss)', 'Moss type LNG carrier', 70000, 130000),
    ('ETH', 'GAS_CARRIER', 'Ethylene Carrier', 'Dedicated ethylene carrier', 3500, 18000),
    ('PCTC', 'RORO_PAX', 'PCTC', 'Pure car and truck carrier', 5000, 30000),
    ('RORO', 'RORO_PAX', 'Ro-Ro Cargo', 'Ro-Ro cargo vessel', 4000, 25000),
    ('ROPAX', 'RORO_PAX', 'Ro-Pax Ferry', 'Passenger and vehicle ferry', 3000, 20000),
    ('CRUISE', 'RORO_PAX', 'Passenger Cruise', 'Cruise passenger vessel', 10000, 120000),
    ('TUG', 'OFFSHORE', 'Tugboat', 'Harbor or ocean tugboat', 200, 3000),
    ('AHTS', 'OFFSHORE', 'AHTS', 'Anchor handling tug supply vessel', 2000, 8000),
    ('PSV', 'OFFSHORE', 'PSV', 'Platform supply vessel', 2000, 6000),
    ('CREW', 'OFFSHORE', 'Crew Boat', 'Offshore crew transfer vessel', 100, 1500),
    ('DRED', 'OFFSHORE', 'Dredger', 'Dredging support or hopper dredger', 1000, 30000)
) AS v(code, kind_code, type_name, description, dwt_min_range, dwt_max_range)
JOIN vessel_kinds k ON k.code = v.kind_code
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    vessel_kind_id = EXCLUDED.vessel_kind_id,
    type_name = EXCLUDED.type_name,
    description = EXCLUDED.description,
    dwt_min_range = EXCLUDED.dwt_min_range,
    dwt_max_range = EXCLUDED.dwt_max_range,
    is_active = EXCLUDED.is_active;

INSERT INTO fuel_types (
    code,
    fuel_category_id,
    fuel_type_name,
    description,
    iso_standard,
    max_sulphur_percent,
    carbon_factor,
    default_density,
    is_eca_compliant,
    is_active
)
SELECT
    f.code,
    c.id,
    f.fuel_type_name,
    f.description,
    f.iso_standard,
    f.max_sulphur_percent,
    f.carbon_factor,
    f.default_density,
    f.is_eca_compliant,
    true
FROM (
    VALUES
    ('IFO380', 'HSFO', 'HSFO', 'Residual fuel oil IFO 380', 'ISO 8217 RMG 380', 3.500, 3.114, 0.9910, false),
    ('IFO180', 'HSFO', 'HSFO', 'Residual fuel oil IFO 180', 'ISO 8217 RME 180', 3.500, 3.114, 0.9850, false),
    ('RMK700', 'HSFO', 'HSFO', 'Residual fuel oil RMK 700', 'ISO 8217 RMK 700', 3.500, 3.114, 1.0100, false),
    ('VLSFO', 'VLSFO', 'VLSFO', 'Very low sulphur fuel oil 0.5%', 'ISO 8217 RMG 380', 0.500, 3.151, 0.9600, false),
    ('RME180', 'VLSFO', 'VLSFO', 'Very low sulphur residual fuel oil', 'ISO 8217 RME 180', 0.500, 3.151, 0.9550, false),
    ('ULSFO', 'ULSFO', 'ULSFO', 'Ultra low sulphur residual fuel oil', 'ISO 8217 RMD 80', 0.100, 3.151, 0.9300, true),
    ('LSMGO', 'MGO_MDO', 'MGO', 'Low sulphur marine gas oil', 'ISO 8217 DMA', 0.100, 3.206, 0.8600, true),
    ('MDO', 'MGO_MDO', 'MDO', 'Marine diesel oil', 'ISO 8217 DMB', 0.500, 3.206, 0.8900, false),
    ('DMX', 'MGO_MDO', 'MGO', 'Marine distillate DMX grade', 'ISO 8217 DMX', 0.100, 3.206, 0.8450, true),
    ('LNG', 'GAS_FUEL', 'LNG', 'Liquefied natural gas', 'IMO IGF Code', 0.000, 2.750, 0.4500, true),
    ('LPGP', 'GAS_FUEL', 'LNG', 'Liquefied petroleum gas propane', 'IMO IGC Code', 0.000, 3.000, 0.5100, true),
    ('LPGB', 'GAS_FUEL', 'LNG', 'Liquefied petroleum gas butane', 'IMO IGC Code', 0.000, 3.030, 0.5800, true),
    ('B30', 'BIOFUEL', 'BIO', 'Biofuel blend B30', 'Supplier specific', 0.100, 2.520, 0.8800, true),
    ('HVO100', 'BIOFUEL', 'BIO', 'Hydrotreated vegetable oil renewable diesel', 'EN 15940', 0.050, 0.195, 0.7800, true),
    ('MEOH', 'ALTERNATIVE', 'ALT', 'Marine methanol fuel', 'IMO interim guideline', 0.000, 1.375, 0.7900, true),
    ('NH3', 'ALTERNATIVE', 'ALT', 'Green ammonia marine fuel', 'Emerging fuel spec', 0.000, 0.000, 0.6800, true)
) AS f(code, category_code, fuel_type_name, description, iso_standard, max_sulphur_percent, carbon_factor, default_density, is_eca_compliant)
JOIN fuel_categories c ON c.code = f.category_code
ON CONFLICT (code) DO UPDATE
SET
    fuel_category_id = EXCLUDED.fuel_category_id,
    fuel_type_name = EXCLUDED.fuel_type_name,
    description = EXCLUDED.description,
    iso_standard = EXCLUDED.iso_standard,
    max_sulphur_percent = EXCLUDED.max_sulphur_percent,
    carbon_factor = EXCLUDED.carbon_factor,
    default_density = EXCLUDED.default_density,
    is_eca_compliant = EXCLUDED.is_eca_compliant,
    is_active = EXCLUDED.is_active;
