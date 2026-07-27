-- Run once against an existing database that previously stored email addresses
-- in users.username. Existing users keep a readable temporary public name and
-- can change it from Account settings.
ALTER TABLE users
    ADD COLUMN email VARCHAR(255) NULL AFTER userID;

-- Include the primary key in the predicate so this works with MySQL
-- Workbench's safe-update mode enabled.
UPDATE users
SET email = LOWER(username)
WHERE email IS NULL
  AND userID > 0;

ALTER TABLE users
    MODIFY email VARCHAR(255) NOT NULL,
    ADD UNIQUE KEY uq_users_email (email),
    MODIFY username VARCHAR(100) NULL;
