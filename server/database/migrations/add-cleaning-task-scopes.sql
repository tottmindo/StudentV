-- Adds house-wide cleaning-template targeting to an existing StudentV database.
-- Safe to run more than once.
ALTER TABLE cleaningtasktemplate
  ADD COLUMN IF NOT EXISTS houseaddress varchar(255);

ALTER TABLE cleaningtasktemplate
  DROP CONSTRAINT IF EXISTS cleaningtasktemplate_one_scope;

ALTER TABLE cleaningtasktemplate
  ADD CONSTRAINT cleaningtasktemplate_one_scope
  CHECK (dormid IS NULL OR houseaddress IS NULL);
