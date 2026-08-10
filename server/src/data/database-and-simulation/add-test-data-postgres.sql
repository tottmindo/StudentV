-- PostgreSQL development-only seed data for StudentV.
-- This deliberately removes all existing application data.
BEGIN;
TRUNCATE TABLE dorms RESTART IDENTITY CASCADE;

INSERT INTO dorms (floor, address) VALUES
  (5, '123 University Road'), (4, '456 Campus Avenue'), (6, '789 Student Street');
INSERT INTO room (dormid) VALUES (1), (1), (1), (2), (2), (2), (3), (3), (3);

-- All accounts use password: test123
INSERT INTO users (email, username, passwordhash, role, roomid, dormid, active, mustchangepassword, credentialversion) VALUES
  ('admin1@example.test', 'admin1', '$2b$10$1cbAlcKhgYdlur29MMF8HuXjGMHiBfPttqceX7cVEvCNQ/NZHxWuy', 'ADMIN', 1, 1, true, false, 0),
  ('clara@example.test', 'clara', '$2b$10$1cbAlcKhgYdlur29MMF8HuXjGMHiBfPttqceX7cVEvCNQ/NZHxWuy', 'STUDENT', 2, 1, true, false, 0),
  ('john@example.test', 'john', '$2b$10$1cbAlcKhgYdlur29MMF8HuXjGMHiBfPttqceX7cVEvCNQ/NZHxWuy', 'STUDENT', 3, 1, true, false, 0),
  ('admin2@example.test', 'admin2', '$2b$10$1cbAlcKhgYdlur29MMF8HuXjGMHiBfPttqceX7cVEvCNQ/NZHxWuy', 'ADMIN', 4, 2, true, false, 0),
  ('alice@example.test', 'alice', '$2b$10$1cbAlcKhgYdlur29MMF8HuXjGMHiBfPttqceX7cVEvCNQ/NZHxWuy', 'STUDENT', 5, 2, true, false, 0),
  ('bob@example.test', 'bob', '$2b$10$1cbAlcKhgYdlur29MMF8HuXjGMHiBfPttqceX7cVEvCNQ/NZHxWuy', 'STUDENT', 6, 2, true, false, 0),
  ('admin3@example.test', 'admin3', '$2b$10$1cbAlcKhgYdlur29MMF8HuXjGMHiBfPttqceX7cVEvCNQ/NZHxWuy', 'ADMIN', 7, 3, true, false, 0),
  ('emma@example.test', 'emma', '$2b$10$1cbAlcKhgYdlur29MMF8HuXjGMHiBfPttqceX7cVEvCNQ/NZHxWuy', 'STUDENT', 8, 3, true, false, 0),
  ('sarah@example.test', 'sarah', '$2b$10$1cbAlcKhgYdlur29MMF8HuXjGMHiBfPttqceX7cVEvCNQ/NZHxWuy', 'STUDENT', 9, 3, true, true, 0);

INSERT INTO survey (question, active, expiresat, multiplechoice) VALUES
  ('How satisfied are you with the dorm facilities?', true, now() + interval '30 days', false),
  ('Which facility should be upgraded next?', true, now() + interval '14 days', true);
INSERT INTO surveyanswers (eid, userid, answer) VALUES (1, 2, 'Very satisfied');

INSERT INTO events (title, description, startdate, enddate, active, type, dormid) VALUES
  ('Movie Night', 'Community movie screening in the common room.', now() + interval '2 days', now() + interval '2 days 3 hours', true, 'SOCIAL', 1),
  ('Fire Safety Training', 'Mandatory fire evacuation training.', now() + interval '5 days', now() + interval '5 days 2 hours', true, 'SAFETY', 1),
  ('Dorm Council Meeting', 'Monthly resident council meeting.', now() + interval '3 days', now() + interval '3 days 2 hours', true, 'MEETING', 2);
INSERT INTO activatedevents (eventid, userid) VALUES (1, 2), (2, 2), (3, 4);

INSERT INTO sensor (sensorcode, type, location, dormid) VALUES
  ('wtr-d1-basement', 'Water Meter', 'Basement main inlet', 1),
  ('wtr-d2-basement', 'Water Meter', 'Basement main inlet', 2),
  ('wtr-d3-basement', 'Water Meter', 'Basement main inlet', 3);
INSERT INTO sensor_data (sensorcode, recordedat, totalvolume, tempmin, tempmax, errorcode, battery, ambienttemp, humidity, leakstatus) VALUES
  ('wtr-d1-basement', now(), 1230, 21.2, 24.8, 0, 95, 20.1, 45, false),
  ('wtr-d2-basement', now(), 980, 20.8, 24.1, 0, 90, 19.8, 48, false),
  ('wtr-d3-basement', now(), 1100, 21.0, 25.0, 0, 88, 20.5, 42, false);

INSERT INTO chat (name, dormid) VALUES ('Dorm 1 General', 1), ('Dorm 2 General', 2), ('Dorm 3 General', 3);
INSERT INTO chatmembers (chatid, userid) VALUES (1, 1), (1, 2), (1, 3), (2, 4), (2, 5), (2, 6), (3, 7), (3, 8), (3, 9);
INSERT INTO chathistory (msg, chatid, userid) VALUES
  ('Welcome everyone!', 1, 1), ('Thanks for adding me.', 1, 2), ('Hello from Dorm 2.', 2, 4),
  ('Anyone want to get coffee?', 1, 3), ('Sure, lets meet at the cafe', 1, 2), ('Count me in!', 3, 8);

-- Base cleaning tasks with new fields (createdByUserID NULL for base tasks, isImportant varies)
INSERT INTO cleaningtasktemplate (taskname, description, active, createdbyuserid, isimportant) VALUES
  ('Kitchen', 'Clean kitchen counters and shared appliances.', true, NULL, true),
  ('Bathroom', 'Clean the shared bathroom.', true, NULL, true),
  ('Floors', 'Vacuum and mop shared floors.', true, NULL, false),
  ('Trash and recycling', 'Empty shared bins.', true, NULL, false),
  ('Common area', 'Tidy up common areas and furniture.', true, NULL, false);

-- Multiple cleaning weeks (current and future) for testing swaps
INSERT INTO cleaningweeks (dormid, assigneduserid, startdate, enddate) VALUES
  -- Current week
  (1, 2, date_trunc('week', current_date)::date, date_trunc('week', current_date)::date + 6),
  (2, 5, date_trunc('week', current_date)::date, date_trunc('week', current_date)::date + 6),
  (3, 8, date_trunc('week', current_date)::date, date_trunc('week', current_date)::date + 6),
  -- Next week
  (1, 3, date_trunc('week', current_date)::date + 7, date_trunc('week', current_date)::date + 13),
  (2, 6, date_trunc('week', current_date)::date + 7, date_trunc('week', current_date)::date + 13),
  (3, 9, date_trunc('week', current_date)::date + 7, date_trunc('week', current_date)::date + 13),
  -- Week after next
  (1, 2, date_trunc('week', current_date)::date + 14, date_trunc('week', current_date)::date + 20),
  (2, 5, date_trunc('week', current_date)::date + 14, date_trunc('week', current_date)::date + 20),
  (3, 8, date_trunc('week', current_date)::date + 14, date_trunc('week', current_date)::date + 20);

-- Base task assignments for all weeks
INSERT INTO cleaningassignments (weekid, templateid, completed, completedat, assigneduserid)
SELECT cw.weekid, ctt.templateid,
       ctt.templateid = 1 AND cw.weekid = 1,
       CASE WHEN ctt.templateid = 1 AND cw.weekid = 1 THEN now() - interval '2 hours' END,
       cw.assigneduserid
FROM cleaningweeks cw CROSS JOIN cleaningtasktemplate ctt
WHERE ctt.active = true;

-- Custom tasks created by users (non-base tasks)
INSERT INTO cleaningtasktemplate (taskname, description, active, createdbyuserid, isimportant) VALUES
  ('Deep clean kitchen', 'Extra thorough kitchen cleaning - scrub walls and appliances', false, 2, true),
  ('Reststock toilet paper', 'Restocking in bathrooms and common areas', false, 2, false),
  ('Windows cleaning', 'Clean all windows in common areas', false, 5, true),
  ('Carpet shampooing', 'Deep clean carpets in living room', false, 8, true);

-- Assign custom tasks to multiple weeks in same dorm
INSERT INTO cleaningassignments (weekid, templateid, completed, completedat, assigneduserid)
SELECT cw.weekid, ctt.templateid, false, NULL, cw.assigneduserid
FROM cleaningweeks cw
CROSS JOIN cleaningtasktemplate ctt
WHERE ctt.active = false;

-- Cleaning week swap requests (pending, accepted, rejected)
INSERT INTO cleaningweekswaprequests (dormid, requesteruserid, targetuserid, sourceweekid, targetweekid, status, createdat, updatedat)
SELECT
    1 AS dormid,
    cw1.assigneduserid AS requesteruserid,
    cw2.assigneduserid AS targetuserid,
    cw1.weekid AS sourceweekid,
    cw2.weekid AS targetweekid,
    'pending' AS status,
    now() - interval '1 day' AS createdat,
    now() - interval '1 day' AS updatedat
FROM cleaningweeks cw1
JOIN cleaningweeks cw2 
  ON cw1.dormid = cw2.dormid
  AND cw1.startdate < cw2.startdate
WHERE cw1.dormid = 1
  AND cw1.startdate = date_trunc('week', current_date)::date
  AND cw2.startdate = date_trunc('week', current_date)::date + 7
LIMIT 1;

INSERT INTO cleaningweekswaprequests (dormid, requesteruserid, targetuserid, sourceweekid, targetweekid, status, createdat, updatedat)
SELECT
    2 AS dormid,
    cw1.assigneduserid AS requesteruserid,
    cw2.assigneduserid AS targetuserid,
    cw1.weekid AS sourceweekid,
    cw2.weekid AS targetweekid,
    'accepted' AS status,
    now() - interval '3 days' AS createdat,
    now() - interval '2 days' AS updatedat
FROM cleaningweeks cw1
JOIN cleaningweeks cw2 
  ON cw1.dormid = cw2.dormid
  AND cw1.startdate < cw2.startdate
WHERE cw1.dormid = 2
  AND cw1.startdate = date_trunc('week', current_date)::date + 7
  AND cw2.startdate = date_trunc('week', current_date)::date + 14
LIMIT 1;

INSERT INTO cleaningweekswaprequests (dormid, requesteruserid, targetuserid, sourceweekid, targetweekid, status, createdat, updatedat)
SELECT
    3 AS dormid,
    cw1.assigneduserid AS requesteruserid,
    cw2.assigneduserid AS targetuserid,
    cw1.weekid AS sourceweekid,
    cw2.weekid AS targetweekid,
    'rejected' AS status,
    now() - interval '5 days' AS createdat,
    now() - interval '4 days' AS updatedat
FROM cleaningweeks cw1
JOIN cleaningweeks cw2 
  ON cw1.dormid = cw2.dormid
  AND cw1.startdate < cw2.startdate
WHERE cw1.dormid = 3
  AND cw1.startdate = date_trunc('week', current_date)::date + 7
  AND cw2.startdate = date_trunc('week', current_date)::date + 14
LIMIT 1;

COMMIT;

