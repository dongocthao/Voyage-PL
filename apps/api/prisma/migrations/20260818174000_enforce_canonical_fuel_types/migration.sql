UPDATE fuel_types
SET
    fuel_category_id = (SELECT id FROM fuel_categories WHERE code = 'HSFO'),
    fuel_type_name = 'HSFO',
    is_active = true
WHERE code = 'HSFO';

UPDATE fuel_types
SET
    fuel_category_id = (SELECT id FROM fuel_categories WHERE code = 'VLSFO'),
    fuel_type_name = 'VLSFO',
    is_active = true
WHERE code = 'VLSFO';

UPDATE fuel_types
SET
    fuel_category_id = (SELECT id FROM fuel_categories WHERE code = 'ULSFO'),
    fuel_type_name = 'ULSFO',
    is_active = true
WHERE code = 'ULSFO';

UPDATE fuel_types
SET
    fuel_category_id = (SELECT id FROM fuel_categories WHERE code = 'MGO_MDO'),
    fuel_type_name = 'MGO',
    is_active = true
WHERE code = 'MGO';

UPDATE fuel_types
SET
    fuel_category_id = (SELECT id FROM fuel_categories WHERE code = 'MGO_MDO'),
    fuel_type_name = 'MDO',
    is_active = true
WHERE code = 'MDO';

UPDATE fuel_types
SET
    fuel_category_id = (SELECT id FROM fuel_categories WHERE code = 'GAS_FUEL'),
    fuel_type_name = 'LNG',
    is_active = true
WHERE code = 'LNG';

UPDATE fuel_types
SET
    code = 'BIO',
    fuel_type_name = 'BIO',
    description = 'Biofuel',
    fuel_category_id = (SELECT id FROM fuel_categories WHERE code = 'BIOFUEL'),
    is_active = true
WHERE code = 'B30'
  AND NOT EXISTS (SELECT 1 FROM fuel_types existing WHERE existing.code = 'BIO');

UPDATE fuel_types
SET
    fuel_type_name = 'BIO',
    description = COALESCE(description, 'Biofuel'),
    fuel_category_id = (SELECT id FROM fuel_categories WHERE code = 'BIOFUEL'),
    is_active = true
WHERE code = 'BIO';

UPDATE fuel_types
SET
    code = 'ALT',
    fuel_type_name = 'ALT',
    description = 'Alternative fuel',
    fuel_category_id = (SELECT id FROM fuel_categories WHERE code = 'ALTERNATIVE'),
    is_active = true
WHERE code = 'NH3'
  AND NOT EXISTS (SELECT 1 FROM fuel_types existing WHERE existing.code = 'ALT');

UPDATE fuel_types
SET
    fuel_type_name = 'ALT',
    description = COALESCE(description, 'Alternative fuel'),
    fuel_category_id = (SELECT id FROM fuel_categories WHERE code = 'ALTERNATIVE'),
    is_active = true
WHERE code = 'ALT';

UPDATE fuel_types
SET is_active = false
WHERE code IN ('LSMGO', 'DMX', 'IFO180', 'IFO380', 'RMK700', 'RME180', 'LPGB', 'LPGP', 'HVO100', 'MEOH', 'NH3', 'B30');
