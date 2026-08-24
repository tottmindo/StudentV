-- Store only the numeric house identifier. Presentation such as "House" or
-- "Hus" belongs to the localized client.
UPDATE dorms
SET address = substring(address FROM '[0-9]+')
WHERE address !~ '^[0-9]+$'
  AND address ~ '[0-9]+';

ALTER TABLE dorms DROP CONSTRAINT IF EXISTS dorms_address_number_check;
ALTER TABLE dorms ADD CONSTRAINT dorms_address_number_check CHECK (address ~ '^[0-9]+$');
