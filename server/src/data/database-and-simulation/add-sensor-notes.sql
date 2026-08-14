CREATE TABLE IF NOT EXISTS sensor_notes (
  sensorCode VARCHAR(100) PRIMARY KEY REFERENCES sensor(sensorCode) ON DELETE CASCADE,
  note TEXT NOT NULL DEFAULT '',
  updatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sensor_notes_length CHECK (char_length(note) <= 2000)
);
