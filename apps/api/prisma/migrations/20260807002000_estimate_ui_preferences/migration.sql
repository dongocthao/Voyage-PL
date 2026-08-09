ALTER TABLE estimates
    ADD COLUMN IF NOT EXISTS time_display_unit VARCHAR(10) NOT NULL DEFAULT 'DAYS',
    ADD COLUMN IF NOT EXISTS timezone_display_mode VARCHAR(10) NOT NULL DEFAULT 'PORT_LOCAL';

ALTER TABLE estimates
    ADD CONSTRAINT estimates_time_display_unit_check
        CHECK (time_display_unit IN ('DAYS', 'HOURS')),
    ADD CONSTRAINT estimates_timezone_display_mode_check
        CHECK (timezone_display_mode IN ('PORT_LOCAL', 'UTC'));
