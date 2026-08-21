DELETE FROM fuel_types f
WHERE f.is_active = false
  AND f.code IN ('LSMGO', 'RMK700', 'IFO180', 'IFO380', 'RME180', 'DMX', 'LPGB', 'LPGP', 'HVO100', 'MEOH', 'B30', 'NH3')
  AND NOT EXISTS (
    SELECT 1
    FROM vessel_bunker_consumption t
    WHERE t.fuel_type_id = f.id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM estimate_vessel_bunker t
    WHERE t.fuel_type_id = f.id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM estimate_bunker_opening_rob t
    WHERE t.fuel_type_id = f.id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM estimate_leg_bunker_rob t
    WHERE t.fuel_type_id = f.id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM estimate_bunker_summary t
    WHERE t.fuel_type_id = f.id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM actual_voyage_bunker_readings t
    WHERE t.fuel_type_id = f.id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM actual_voyage_bunker_opening_closing t
    WHERE t.fuel_type_id = f.id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM actual_voyage_bunker_summary t
    WHERE t.fuel_type_id = f.id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM actual_voyage_bunker_by_activity t
    WHERE t.fuel_type_id = f.id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM actual_voyage_off_hire_bunker t
    WHERE t.fuel_type_id = f.id
  );
