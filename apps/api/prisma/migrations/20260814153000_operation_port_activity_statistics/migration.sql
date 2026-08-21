CREATE TABLE IF NOT EXISTS operation_port_activity_statistics (
  id BIGSERIAL PRIMARY KEY,
  port_rotation_id INTEGER NOT NULL,
  port_id BIGINT NULL REFERENCES ports(id) ON DELETE SET NULL,
  voyage_id BIGINT NOT NULL REFERENCES actual_voyages(id) ON DELETE CASCADE,
  operation_id BIGINT NOT NULL REFERENCES actual_voyages(id) ON DELETE CASCADE,
  channel_days NUMERIC(8, 2) NOT NULL DEFAULT 0,
  port_working_days NUMERIC(8, 2) NOT NULL DEFAULT 0,
  port_idle_days NUMERIC(8, 2) NOT NULL DEFAULT 0,
  port_margin_day NUMERIC(8, 2) NOT NULL DEFAULT 0,
  port_stay_duration NUMERIC(8, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT operation_port_activity_statistics_unique UNIQUE (operation_id, port_rotation_id)
);

CREATE INDEX IF NOT EXISTS idx_operation_port_activity_statistics_operation
  ON operation_port_activity_statistics(operation_id);

CREATE INDEX IF NOT EXISTS idx_operation_port_activity_statistics_port
  ON operation_port_activity_statistics(port_id);
