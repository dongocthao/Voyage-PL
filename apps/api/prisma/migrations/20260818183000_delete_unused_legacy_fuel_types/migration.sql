DELETE FROM fuel_types
WHERE is_active = false
  AND code IN ('LSMGO', 'RMK700', 'IFO180', 'IFO380', 'RME180', 'DMX', 'LPGB', 'LPGP', 'HVO100', 'MEOH', 'B30', 'NH3')
  AND id NOT IN (
    SELECT fuel_type_id FROM vessel_bunker_consumption
    UNION
    SELECT fuel_type_id FROM estimate_vessel_bunker
    UNION
    SELECT fuel_type_id FROM estimate_bunker_opening_rob
    UNION
    SELECT fuel_type_id FROM estimate_leg_bunker_rob
    UNION
    SELECT fuel_type_id FROM estimate_bunker_summary
    UNION
    SELECT fuel_type_id FROM actual_voyage_bunker_readings
    UNION
    SELECT fuel_type_id FROM actual_voyage_bunker_opening_closing
    UNION
    SELECT fuel_type_id FROM actual_voyage_bunker_summary
    UNION
    SELECT fuel_type_id FROM actual_voyage_bunker_by_activity
    UNION
    SELECT fuel_type_id FROM actual_voyage_off_hire_bunker
  );
