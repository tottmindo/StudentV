-- PostgreSQL development-only seed data for StudentV.
-- This deliberately removes all existing application data.
BEGIN;
TRUNCATE TABLE dorms RESTART IDENTITY CASCADE;

-- A room number is house + floor + room, for example 1251 means
-- house 12, floor 5, room 1. Each house/floor has eight rooms.
INSERT INTO dorms (floor, address) VALUES
  (1, 'House 12'), (2, 'House 12'), (3, 'House 12'), (4, 'House 12'), (5, 'House 12'),
  (1, 'House 14'), (2, 'House 14'), (3, 'House 14'), (4, 'House 14'), (5, 'House 14');

INSERT INTO room (roomid, dormid)
SELECT
  (CASE WHEN dormid <= 5 THEN 12 ELSE 14 END) * 100 + floor * 10 + room_number,
  dormid
FROM dorms
CROSS JOIN generate_series(1, 8) AS rooms(room_number);

-- Explicit room numbers do not advance PostgreSQL identity sequences.
SELECT setval(pg_get_serial_sequence('room', 'roomid'), (SELECT MAX(roomid) FROM room));

-- All accounts use password: test123
INSERT INTO users (email, username, passwordhash, role, roomid, dormid, active, mustchangepassword, credentialversion) VALUES
  ('admin1@example.test', 'admin1', '$2b$10$1cbAlcKhgYdlur29MMF8HuXjGMHiBfPttqceX7cVEvCNQ/NZHxWuy', 'ADMIN', 1211, 1, true, false, 0),
  ('clara@example.test', 'clara', '$2b$10$1cbAlcKhgYdlur29MMF8HuXjGMHiBfPttqceX7cVEvCNQ/NZHxWuy', 'STUDENT', 1212, 1, true, false, 0),
  ('john@example.test', 'john', '$2b$10$1cbAlcKhgYdlur29MMF8HuXjGMHiBfPttqceX7cVEvCNQ/NZHxWuy', 'STUDENT', 1213, 1, true, false, 0),
  ('admin2@example.test', 'admin2', '$2b$10$1cbAlcKhgYdlur29MMF8HuXjGMHiBfPttqceX7cVEvCNQ/NZHxWuy', 'ADMIN', 1221, 2, true, false, 0),
  ('alice@example.test', 'alice', '$2b$10$1cbAlcKhgYdlur29MMF8HuXjGMHiBfPttqceX7cVEvCNQ/NZHxWuy', 'STUDENT', 1222, 2, true, false, 0),
  ('bob@example.test', 'bob', '$2b$10$1cbAlcKhgYdlur29MMF8HuXjGMHiBfPttqceX7cVEvCNQ/NZHxWuy', 'STUDENT', 1223, 2, true, false, 0),
  ('admin3@example.test', 'admin3', '$2b$10$1cbAlcKhgYdlur29MMF8HuXjGMHiBfPttqceX7cVEvCNQ/NZHxWuy', 'ADMIN', 1231, 3, true, false, 0),
  ('emma@example.test', 'emma', '$2b$10$1cbAlcKhgYdlur29MMF8HuXjGMHiBfPttqceX7cVEvCNQ/NZHxWuy', 'STUDENT', 1232, 3, true, false, 0),
  ('sarah@example.test', 'sarah', '$2b$10$1cbAlcKhgYdlur29MMF8HuXjGMHiBfPttqceX7cVEvCNQ/NZHxWuy', 'STUDENT', 1233, 3, true, true, 0);

-- Populate rooms 1–7 on every floor. Room 8 stays empty on each floor so
-- resident provisioning and vacant-room scenarios can still be tested.
INSERT INTO users
  (email, username, passwordhash, role, roomid, dormid, active, mustchangepassword, credentialversion)
SELECT
  'resident-' || roomid || '@example.test',
  'resident' || roomid,
  '$2b$10$1cbAlcKhgYdlur29MMF8HuXjGMHiBfPttqceX7cVEvCNQ/NZHxWuy',
  'STUDENT', roomid, dormid, true, false, 0
FROM room
WHERE roomid % 10 <> 8
  AND NOT EXISTS (SELECT 1 FROM users WHERE users.roomid = room.roomid AND users.dormid = room.dormid);

INSERT INTO survey (question, active, expiresat, multiplechoice) VALUES
  ('How satisfied are you with the dorm facilities?', true, now() + interval '30 days', false),
  ('Which facility should be upgraded next?', true, now() + interval '14 days', true);
INSERT INTO surveyanswers (eid, userid, answer) VALUES (1, 2, 'Very satisfied');

INSERT INTO events (title, description, startdate, enddate, active, type, dormid) VALUES
  ('Movie Night', 'Community movie screening in the common room.', now() + interval '2 days', now() + interval '2 days 3 hours', true, 'SOCIAL', 1),
  ('Fire Safety Training', 'Mandatory fire evacuation training.', now() + interval '5 days', now() + interval '5 days 2 hours', true, 'SAFETY', 1),
  ('Dorm Council Meeting', 'Monthly resident council meeting.', now() + interval '3 days', now() + interval '3 days 2 hours', true, 'MEETING', 2);
INSERT INTO activatedevents (eventid, userid) VALUES (1, 2), (2, 2), (3, 4);

-- Add an event for each remaining floor so calendars can be tested across
-- both houses and all five floors.
INSERT INTO events (title, description, startdate, enddate, active, type, dormid)
SELECT
  address || ' floor ' || floor || ' social night',
  'Seeded social event for ' || address || ', floor ' || floor || '.',
  now() + dormid * interval '1 day',
  now() + (dormid + 1) * interval '1 day',
  true, 'SOCIAL', dormid
FROM dorms
WHERE dormid > 3;

INSERT INTO sensor (sensorcode, type, location, dormid) VALUES
  ('8c1f6461900014f5', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f646190001501', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f646190001592', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f6461900015ba', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f64619000160f', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f64619000171c', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f646190001743', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f64619000177c', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f646190001790', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f6461900017e3', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f6461900018f5', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f646190001968', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f6461900019cf', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f646190001ba9', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f646190001c1c', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f646190001c1f', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f646190001dd8', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f646190001e41', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f646190001ebd', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f646190002012', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f6461900020d1', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f646190002120', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f6461900021a9', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f6461900021c5', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f6461900021e0', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f6461900021e2', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f6461900021e8', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f646190002222', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f64619000227c', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f646190002291', 'Water Meter', 'gateway 24e124725d489523', 1),
  ('8c1f6461900015c1', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f6461900015ed', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f64619000170a', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f646190001833', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f6461900018ba', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f646190001901', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f646190001947', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f646190001963', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f6461900019c7', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f6461900019cb', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f646190001af8', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f646190001b0f', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f646190001b91', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f646190001baf', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f646190001bea', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f646190001bf1', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f646190001c9b', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f646190001d93', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f646190001ec9', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f646190001fc1', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f646190001fcb', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f6461900020a5', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f6461900021bd', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f6461900021c1', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f6461900021da', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f6461900021db', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f646190002206', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f646190002244', 'Water Meter', 'gateway 24e124fffef94d5c', 1),
  ('8c1f64619000228d', 'Water Meter', 'gateway 24e124fffef94d5c', 1);

INSERT INTO chat (name, dormid) VALUES ('Dorm 1 General', 1), ('Dorm 2 General', 2), ('Dorm 3 General', 3);
INSERT INTO chat (name, dormid)
SELECT address || ' floor ' || floor || ' General', dormid
FROM dorms
WHERE dormid > 3;
INSERT INTO chatmembers (chatid, userid) VALUES (1, 1), (1, 2), (1, 3), (2, 4), (2, 5), (2, 6), (3, 7), (3, 8), (3, 9);
INSERT INTO chatmembers (chatid, userid)
SELECT chat.chatid, MIN(users.userid)
FROM chat
JOIN users ON users.dormid = chat.dormid
WHERE chat.dormid > 3
GROUP BY chat.chatid;
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
