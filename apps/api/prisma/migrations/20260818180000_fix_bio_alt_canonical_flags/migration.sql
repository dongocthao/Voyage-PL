UPDATE fuel_types
SET
    fuel_type_name = 'BIO',
    description = COALESCE(description, 'Biofuel'),
    fuel_category_id = (SELECT id FROM fuel_categories WHERE code = 'BIOFUEL'),
    is_active = true
WHERE code = 'BIO';

UPDATE fuel_types
SET
    fuel_type_name = 'ALT',
    description = COALESCE(description, 'Alternative fuel'),
    fuel_category_id = (SELECT id FROM fuel_categories WHERE code = 'ALTERNATIVE'),
    is_active = true
WHERE code = 'ALT';

UPDATE fuel_types
SET is_active = false
WHERE code IN ('HVO100', 'MEOH', 'NH3', 'B30');
