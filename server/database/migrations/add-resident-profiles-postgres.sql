-- Non-destructive migration for existing databases.
CREATE TABLE IF NOT EXISTS residentprofiles (
  userid integer PRIMARY KEY REFERENCES users(userid) ON DELETE CASCADE,
  bio varchar(500) NOT NULL DEFAULT '',
  updatedat timestamptz NOT NULL DEFAULT current_timestamp,
  CONSTRAINT residentprofiles_bio_length CHECK (char_length(bio) <= 500)
);
