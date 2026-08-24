ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'RESEARCHER', 'STUDENT'));

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_room_assignment_check;
ALTER TABLE users ADD CONSTRAINT users_room_assignment_check CHECK (
  (role IN ('ADMIN', 'RESEARCHER') AND roomid IS NULL AND dormid IS NULL) OR
  (role = 'STUDENT' AND roomid IS NOT NULL AND dormid IS NOT NULL)
);
