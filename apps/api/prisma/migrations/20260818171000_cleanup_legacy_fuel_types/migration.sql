UPDATE fuel_types
SET
    fuel_category_id = category.id,
    fuel_type_name = updates.fuel_type_name,
    description = COALESCE(fuel_types.description, updates.description),
    is_active = updates.is_active
FROM (
    VALUES
        ('HSFO',  'HSFO',  'High sulphur fuel oil', true),
        ('VLSFO', 'VLSFO', 'Very low sulphur fuel oil', true),
        ('ULSFO', 'ULSFO', 'Ultra low sulphur fuel oil', true),
        ('MGO',   'MGO',   'Marine gas oil', true),
        ('MDO',   'MDO',   'Marine diesel oil', true),
        ('LNG',   'LNG',   'Liquefied natural gas', true),
        ('BIO',   'BIO',   'Biofuel', true),
        ('ALT',   'ALT',   'Alternative fuel', true),
        ('LSMGO', 'MGO',   'Low sulphur marine gas oil', false),
        ('DMX',   'MGO',   'Marine distillate DMX grade', false),
        ('IFO180','HSFO',  'Residual fuel oil IFO 180', false),
        ('IFO380','HSFO',  'Residual fuel oil IFO 380', false),
        ('RMK700','HSFO',  'Residual fuel oil RMK 700', false),
        ('RME180','VLSFO', 'Very low sulphur residual fuel oil', false),
        ('LPGP',  'LNG',   'Liquefied petroleum gas propane', false),
        ('LPGB',  'LNG',   'Liquefied petroleum gas butane', false),
        ('HVO100','BIO',   'Hydrotreated vegetable oil renewable diesel', false),
        ('B30',   'BIO',   'Biofuel blend B30', false),
        ('MEOH',  'ALT',   'Marine methanol fuel', false),
        ('NH3',   'ALT',   'Green ammonia marine fuel', false)
) AS updates(code, fuel_type_name, description, is_active)
LEFT JOIN fuel_categories category
    ON category.code = CASE updates.fuel_type_name
        WHEN 'HSFO' THEN 'HSFO'
        WHEN 'VLSFO' THEN 'VLSFO'
        WHEN 'ULSFO' THEN 'ULSFO'
        WHEN 'MGO' THEN 'MGO_MDO'
        WHEN 'MDO' THEN 'MGO_MDO'
        WHEN 'LNG' THEN 'GAS_FUEL'
        WHEN 'BIO' THEN 'BIOFUEL'
        WHEN 'ALT' THEN 'ALTERNATIVE'
        ELSE NULL
    END
WHERE fuel_types.code = updates.code;

UPDATE fuel_types
SET code = 'BIO'
WHERE code = 'B30';

UPDATE fuel_types
SET code = 'ALT'
WHERE code = 'NH3';
