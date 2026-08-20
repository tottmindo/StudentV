ALTER TABLE users
  ADD COLUMN IF NOT EXISTS scheduleddeactivationat timestamptz;

CREATE INDEX IF NOT EXISTS idx_users_scheduled_deactivation
  ON users (scheduleddeactivationat)
  WHERE active = true AND scheduleddeactivationat IS NOT NULL;
