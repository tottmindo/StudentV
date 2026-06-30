USE dorms_db;

-- =====================================================
-- EXPANDED TEST DATA FOR DORMITORY MANAGEMENT
-- MySQL 8+
--
-- WARNING: this script clears all data from dorms_db.
-- Run it only against a local/test database.
-- =====================================================

SET @seed_now = NOW();
SET @current_week_start = DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY);

-- =====================================================
-- RESET EXISTING TEST DATA
-- =====================================================
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE chatHistory;
TRUNCATE TABLE chatMembers;
TRUNCATE TABLE chat;
TRUNCATE TABLE sensor_data;
TRUNCATE TABLE sensor;
TRUNCATE TABLE activatedEvents;
TRUNCATE TABLE events;
TRUNCATE TABLE surveyAnswers;
TRUNCATE TABLE survey;
TRUNCATE TABLE cleaningAssignments;
TRUNCATE TABLE cleaningWeeks;
TRUNCATE TABLE cleaningTaskTemplate;
TRUNCATE TABLE users;
TRUNCATE TABLE room;
TRUNCATE TABLE dorms;

SET FOREIGN_KEY_CHECKS = 1;

START TRANSACTION;

-- =====================================================
-- DORMS
-- =====================================================
INSERT INTO dorms (dormID, floor, address) VALUES
(1, 5, '123 University Road'),
(2, 4, '456 Campus Avenue'),
(3, 6, '789 Student Street');

-- =====================================================
-- ROOMS
-- Four rooms per dorm. Explicit IDs make all test data
-- deterministic and easier to reference in automated tests.
-- =====================================================
INSERT INTO room (roomID, dormID) VALUES
(1, 1), (2, 1), (3, 1), (4, 1),
(5, 2), (6, 2), (7, 2), (8, 2),
(9, 3), (10, 3), (11, 3), (12, 3);

-- =====================================================
-- USERS
-- All accounts use the same existing dummy BCrypt hash.
-- Replace it if your authentication tests require a known
-- plaintext password.
-- =====================================================
INSERT INTO users
(userID, username, passwordHash, role, roomID, dormID, active)
VALUES
-- Dorm 1
(1,  'admin1',  '$2a$10$YouE3ep18kTU5uWuUTV4AOpd5BFeQDr7NYqrAhb8RKSfC0ATGNjs6', 'ADMIN',   1, 1, TRUE),
(2,  'alice',   '$2a$10$zGNeEsyfyloIAc0mM2S04uAa1v6w.8UQGvngA7O15GUKh0zoVpote', 'STUDENT', 1, 1, FALSE),
(3,  'bob',     '$2a$10$zGNeEsyfyloIAc0mM2S04uAa1v6w.8UQGvngA7O15GUKh0zoVpote', 'STUDENT', 1, 1, FALSE),
(4,  'clara',   '$2a$10$zGNeEsyfyloIAc0mM2S04uAa1v6w.8UQGvngA7O15GUKh0zoVpote', 'STUDENT', 2, 1, TRUE),
(5,  'david',   '$2a$10$zGNeEsyfyloIAc0mM2S04uAa1v6w.8UQGvngA7O15GUKh0zoVpote', 'STUDENT', 2, 1, FALSE),
(6,  'emma',    '$2a$10$zGNeEsyfyloIAc0mM2S04uAa1v6w.8UQGvngA7O15GUKh0zoVpote', 'STUDENT', 3, 1, TRUE),
(7,  'felix',   '$2a$10$zGNeEsyfyloIAc0mM2S04uAa1v6w.8UQGvngA7O15GUKh0zoVpote', 'STUDENT', 3, 1, FALSE),
(8,  'grace',   '$2a$10$zGNeEsyfyloIAc0mM2S04uAa1v6w.8UQGvngA7O15GUKh0zoVpote', 'STUDENT', 4, 1, TRUE),
(9,  'henry',   '$2a$10$zGNeEsyfyloIAc0mM2S04uAa1v6w.8UQGvngA7O15GUKh0zoVpote', 'STUDENT', 4, 1, FALSE),

-- Dorm 2
(10, 'admin2',  '$2a$10$YouE3ep18kTU5uWuUTV4AOpd5BFeQDr7NYqrAhb8RKSfC0ATGNjs6', 'ADMIN',   5, 2, TRUE),
(11, 'irene',   '$2a$10$zGNeEsyfyloIAc0mM2S04uAa1v6w.8UQGvngA7O15GUKh0zoVpote', 'STUDENT', 5, 2, FALSE),
(12, 'jamal',   '$2a$10$zGNeEsyfyloIAc0mM2S04uAa1v6w.8UQGvngA7O15GUKh0zoVpote', 'STUDENT', 5, 2, FALSE),
(13, 'karin',   '$2a$10$zGNeEsyfyloIAc0mM2S04uAa1v6w.8UQGvngA7O15GUKh0zoVpote', 'STUDENT', 6, 2, TRUE),
(14, 'leo',     '$2a$10$zGNeEsyfyloIAc0mM2S04uAa1v6w.8UQGvngA7O15GUKh0zoVpote', 'STUDENT', 6, 2, FALSE),
(15, 'maya',    '$2a$10$zGNeEsyfyloIAc0mM2S04uAa1v6w.8UQGvngA7O15GUKh0zoVpote', 'STUDENT', 7, 2, TRUE),
(16, 'noah',    '$2a$10$zGNeEsyfyloIAc0mM2S04uAa1v6w.8UQGvngA7O15GUKh0zoVpote', 'STUDENT', 7, 2, FALSE),
(17, 'olivia',  '$2a$10$zGNeEsyfyloIAc0mM2S04uAa1v6w.8UQGvngA7O15GUKh0zoVpote', 'STUDENT', 8, 2, TRUE),
(18, 'peter',   '$2a$10$zGNeEsyfyloIAc0mM2S04uAa1v6w.8UQGvngA7O15GUKh0zoVpote', 'STUDENT', 8, 2, FALSE),

-- Dorm 3
(19, 'admin3',  '$2a$10$YouE3ep18kTU5uWuUTV4AOpd5BFeQDr7NYqrAhb8RKSfC0ATGNjs6', 'ADMIN',   9, 3, TRUE),
(20, 'quinn',   '$2a$10$zGNeEsyfyloIAc0mM2S04uAa1v6w.8UQGvngA7O15GUKh0zoVpote', 'STUDENT', 9, 3, FALSE),
(21, 'rania',   '$2a$10$zGNeEsyfyloIAc0mM2S04uAa1v6w.8UQGvngA7O15GUKh0zoVpote', 'STUDENT', 9, 3, FALSE),
(22, 'sam',     '$2a$10$zGNeEsyfyloIAc0mM2S04uAa1v6w.8UQGvngA7O15GUKh0zoVpote', 'STUDENT', 10, 3, TRUE),
(23, 'tina',    '$2a$10$zGNeEsyfyloIAc0mM2S04uAa1v6w.8UQGvngA7O15GUKh0zoVpote', 'STUDENT', 10, 3, FALSE),
(24, 'uma',     '$2a$10$zGNeEsyfyloIAc0mM2S04uAa1v6w.8UQGvngA7O15GUKh0zoVpote', 'STUDENT', 11, 3, TRUE),
(25, 'victor',  '$2a$10$zGNeEsyfyloIAc0mM2S04uAa1v6w.8UQGvngA7O15GUKh0zoVpote', 'STUDENT', 11, 3, FALSE),
(26, 'wendy',   '$2a$10$zGNeEsyfyloIAc0mM2S04uAa1v6w.8UQGvngA7O15GUKh0zoVpote', 'STUDENT', 12, 3, TRUE),
(27, 'xavier',  '$2a$10$zGNeEsyfyloIAc0mM2S04uAa1v6w.8UQGvngA7O15GUKh0zoVpote', 'STUDENT', 12, 3, FALSE);

-- =====================================================
-- SURVEYS
-- Includes active, expired and multiple-choice examples.
-- =====================================================
INSERT INTO survey
(eID, question, active, createdAt, expiresAt, multipleChoice)
VALUES
(1, 'How satisfied are you with the dorm facilities?',
 TRUE, DATE_SUB(@seed_now, INTERVAL 5 DAY), DATE_ADD(@seed_now, INTERVAL 30 DAY), FALSE),
(2, 'Which facility should be upgraded next?',
 TRUE, DATE_SUB(@seed_now, INTERVAL 3 DAY), DATE_ADD(@seed_now, INTERVAL 14 DAY), TRUE),
(3, 'Would you attend a dorm social event this month?',
 TRUE, DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_ADD(@seed_now, INTERVAL 10 DAY), FALSE),
(4, 'Which cleaning task is hardest to complete?',
 TRUE, DATE_SUB(@seed_now, INTERVAL 1 DAY), DATE_ADD(@seed_now, INTERVAL 21 DAY), TRUE),
(5, 'Was last month''s quiet-hours policy effective?',
 FALSE, DATE_SUB(@seed_now, INTERVAL 45 DAY), DATE_SUB(@seed_now, INTERVAL 15 DAY), FALSE);

INSERT INTO surveyAnswers (eID, userID, answer, answeredAt) VALUES
(1, 2,  'Very satisfied', DATE_SUB(@seed_now, INTERVAL 2 DAY)),
(1, 3,  'Satisfied',      DATE_SUB(@seed_now, INTERVAL 2 DAY)),
(1, 4,  'Could be better',DATE_SUB(@seed_now, INTERVAL 1 DAY)),
(1, 11, 'Satisfied',      DATE_SUB(@seed_now, INTERVAL 1 DAY)),
(1, 20, 'Very satisfied', DATE_SUB(@seed_now, INTERVAL 5 HOUR)),

(2, 2,  'Laundry Room',   DATE_SUB(@seed_now, INTERVAL 2 DAY)),
(2, 5,  'Study Area',     DATE_SUB(@seed_now, INTERVAL 1 DAY)),
(2, 6,  'Gym',            DATE_SUB(@seed_now, INTERVAL 12 HOUR)),
(2, 13, 'Laundry Room',   DATE_SUB(@seed_now, INTERVAL 8 HOUR)),
(2, 24, 'Study Area',     DATE_SUB(@seed_now, INTERVAL 4 HOUR)),

(3, 3,  'Yes',            DATE_SUB(@seed_now, INTERVAL 1 DAY)),
(3, 4,  'No',             DATE_SUB(@seed_now, INTERVAL 12 HOUR)),
(3, 7,  'Maybe',          DATE_SUB(@seed_now, INTERVAL 8 HOUR)),
(3, 16, 'Yes',            DATE_SUB(@seed_now, INTERVAL 6 HOUR)),
(3, 26, 'Yes',            DATE_SUB(@seed_now, INTERVAL 2 HOUR)),

(4, 2,  'Bathroom',       DATE_SUB(@seed_now, INTERVAL 8 HOUR)),
(4, 8,  'Kitchen',        DATE_SUB(@seed_now, INTERVAL 7 HOUR)),
(4, 12, 'Trash and recycling', DATE_SUB(@seed_now, INTERVAL 6 HOUR)),
(4, 18, 'Laundry room',   DATE_SUB(@seed_now, INTERVAL 5 HOUR)),
(4, 23, 'Floors',         DATE_SUB(@seed_now, INTERVAL 4 HOUR)),

(5, 2,  'Yes',            DATE_SUB(@seed_now, INTERVAL 20 DAY)),
(5, 11, 'Mostly',         DATE_SUB(@seed_now, INTERVAL 18 DAY)),
(5, 20, 'No',             DATE_SUB(@seed_now, INTERVAL 17 DAY));

-- =====================================================
-- EVENTS
-- Every event now includes the required dormID.
-- =====================================================
INSERT INTO events
(eventID, title, description, startDate, endDate, createdAt, active, type, dormID)
VALUES
(1, 'Movie Night',
 'Community movie screening in the common room.',
 DATE_ADD(@seed_now, INTERVAL 5 DAY), DATE_ADD(DATE_ADD(@seed_now, INTERVAL 5 DAY), INTERVAL 3 HOUR),
 @seed_now, TRUE, 'SOCIAL', 1),

(2, 'Fire Safety Training',
 'Mandatory fire evacuation training.',
 DATE_ADD(@seed_now, INTERVAL 10 DAY), DATE_ADD(DATE_ADD(@seed_now, INTERVAL 10 DAY), INTERVAL 2 HOUR),
 @seed_now, TRUE, 'SAFETY', 1),

(3, 'Study Workshop',
 'Exam preparation and study techniques.',
 DATE_ADD(@seed_now, INTERVAL 15 DAY), DATE_ADD(DATE_ADD(@seed_now, INTERVAL 15 DAY), INTERVAL 2 HOUR),
 @seed_now, TRUE, 'ACADEMIC', 3),

(4, 'Cleaning Assignment Kickoff',
 'Walkthrough of the new weekly cleaning assignment feature.',
 DATE_ADD(@seed_now, INTERVAL 1 DAY), DATE_ADD(DATE_ADD(@seed_now, INTERVAL 1 DAY), INTERVAL 1 HOUR),
 @seed_now, TRUE, 'CLEANING', 1),

(5, 'Dorm Council Meeting',
 'Monthly resident council meeting.',
 DATE_ADD(@seed_now, INTERVAL 3 DAY), DATE_ADD(DATE_ADD(@seed_now, INTERVAL 3 DAY), INTERVAL 2 HOUR),
 @seed_now, TRUE, 'MEETING', 2),

(6, 'Laundry Room Maintenance',
 'The laundry room will be unavailable during maintenance.',
 DATE_SUB(@seed_now, INTERVAL 2 DAY), DATE_ADD(DATE_SUB(@seed_now, INTERVAL 2 DAY), INTERVAL 4 HOUR),
 DATE_SUB(@seed_now, INTERVAL 10 DAY), FALSE, 'MAINTENANCE', 2),

(7, 'Summer Barbecue',
 'Outdoor barbecue for all Dorm 3 residents.',
 DATE_ADD(@seed_now, INTERVAL 7 DAY), DATE_ADD(DATE_ADD(@seed_now, INTERVAL 7 DAY), INTERVAL 4 HOUR),
 @seed_now, TRUE, 'SOCIAL', 3),

(8, 'Water Shutoff Drill',
 'Short planned water shutoff and emergency procedure test.',
 DATE_ADD(@seed_now, INTERVAL 12 DAY), DATE_ADD(DATE_ADD(@seed_now, INTERVAL 12 DAY), INTERVAL 1 HOUR),
 @seed_now, TRUE, 'SAFETY', 3),

(9, 'Past Welcome Meeting',
 'Completed welcome meeting used to test event history.',
 DATE_SUB(@seed_now, INTERVAL 20 DAY), DATE_ADD(DATE_SUB(@seed_now, INTERVAL 20 DAY), INTERVAL 2 HOUR),
 DATE_SUB(@seed_now, INTERVAL 30 DAY), FALSE, 'MEETING', 1);

INSERT INTO activatedEvents (eventID, userID) VALUES
(1, 2), (1, 3), (1, 4), (1, 6), (1, 8),
(2, 2), (2, 3), (2, 5), (2, 7), (2, 9),
(3, 20), (3, 21), (3, 22), (3, 24), (3, 26),
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5),
(5, 10), (5, 11), (5, 13), (5, 15), (5, 17),
(6, 11), (6, 12), (6, 14),
(7, 19), (7, 20), (7, 21), (7, 23), (7, 25), (7, 27),
(8, 20), (8, 22), (8, 24), (8, 26),
(9, 2), (9, 3), (9, 6);

-- =====================================================
-- SENSORS
-- =====================================================
INSERT INTO sensor (sensorCode, type, location, dormID) VALUES
('WTR-D1-BASEMENT', 'Water Meter', 'Basement main inlet', 1),
('TMP-D1-HALL',     'Temperature', 'Second-floor hallway', 1),
('HUM-D1-LAUNDRY',  'Humidity',    'Laundry room', 1),
('WTR-D2-BASEMENT', 'Water Meter', 'Basement main inlet', 2),
('TMP-D2-HALL',     'Temperature', 'Third-floor hallway', 2),
('WTR-D3-BASEMENT', 'Water Meter', 'Basement main inlet', 3),
('TMP-D3-HALL',     'Temperature', 'Fourth-floor hallway', 3),
('LEAK-D3-KITCHEN', 'Leak Sensor', 'Shared kitchen', 3);

-- Seven readings per sensor: now, 1h, 2h, 6h, 12h, 24h and 48h ago.
INSERT INTO sensor_data
(sensorCode, recordedAt, totalVolume, tempMin, tempMax, errorCode,
 battery, ambientTemp, humidity, leakStatus)
SELECT
    s.sensorCode,
    TIMESTAMPADD(HOUR, -samples.hoursAgo, @seed_now),
    CASE
        WHEN s.type = 'Water Meter'
            THEN 1000 + (s.dormID * 250) + ((48 - samples.hoursAgo) * 4.5)
        ELSE 0
    END AS totalVolume,
    17.0 + s.dormID + MOD(samples.hoursAgo, 3) AS tempMin,
    22.0 + s.dormID + MOD(samples.hoursAgo, 4) AS tempMax,
    CASE
        WHEN s.sensorCode = 'TMP-D3-HALL' AND samples.hoursAgo = 6 THEN 101
        ELSE 0
    END AS errorCode,
    GREATEST(60.0, 98.0 - (samples.hoursAgo * 0.08) - s.dormID) AS battery,
    20.0 + s.dormID + (MOD(samples.hoursAgo, 5) * 0.2) AS ambientTemp,
    42.0 + (s.dormID * 2) + MOD(samples.hoursAgo, 7) AS humidity,
    CASE
        WHEN s.sensorCode = 'WTR-D2-BASEMENT' AND samples.hoursAgo = 1 THEN TRUE
        WHEN s.sensorCode = 'LEAK-D3-KITCHEN' AND samples.hoursAgo IN (0, 1) THEN TRUE
        ELSE FALSE
    END AS leakStatus
FROM sensor s
CROSS JOIN (
    SELECT 0 AS hoursAgo
    UNION ALL SELECT 1
    UNION ALL SELECT 2
    UNION ALL SELECT 6
    UNION ALL SELECT 12
    UNION ALL SELECT 24
    UNION ALL SELECT 48
) samples;

-- =====================================================
-- CHATS
-- =====================================================
INSERT INTO chat (chatID, name, createdAt, dormID) VALUES
(1, 'Dorm 1 General',  DATE_SUB(@seed_now, INTERVAL 60 DAY), 1),
(2, 'Dorm 1 Cleaning', DATE_SUB(@seed_now, INTERVAL 20 DAY), 1),
(3, 'Dorm 2 General',  DATE_SUB(@seed_now, INTERVAL 55 DAY), 2),
(4, 'Dorm 2 Cleaning', DATE_SUB(@seed_now, INTERVAL 18 DAY), 2),
(5, 'Dorm 3 General',  DATE_SUB(@seed_now, INTERVAL 50 DAY), 3),
(6, 'Dorm 3 Cleaning', DATE_SUB(@seed_now, INTERVAL 15 DAY), 3);

-- Every user joins both chats belonging to their own dorm.
INSERT INTO chatMembers (chatID, userID, joinedAt)
SELECT c.chatID, u.userID, DATE_SUB(@seed_now, INTERVAL 14 DAY)
FROM chat c
JOIN users u ON u.dormID = c.dormID;

INSERT INTO chatHistory (messageID, msg, sentAt, chatID, userID) VALUES
(1,  'Welcome everyone!', DATE_SUB(@seed_now, INTERVAL 10 DAY), 1, 1),
(2,  'Thanks for adding me.', DATE_SUB(@seed_now, INTERVAL 9 DAY), 1, 2),
(3,  'Movie night sounds fun!', DATE_SUB(@seed_now, INTERVAL 8 DAY), 1, 3),
(4,  'Who is assigned to the kitchen this week?', DATE_SUB(@seed_now, INTERVAL 4 HOUR), 2, 4),
(5,  'I can swap the floor task if needed.', DATE_SUB(@seed_now, INTERVAL 3 HOUR), 2, 5),
(6,  'Please mark tasks complete after checking them.', DATE_SUB(@seed_now, INTERVAL 2 HOUR), 2, 1),

(7,  'When is the next dorm meeting?', DATE_SUB(@seed_now, INTERVAL 7 DAY), 3, 11),
(8,  'Thursday evening.', DATE_SUB(@seed_now, INTERVAL 6 DAY), 3, 10),
(9,  'The laundry room is working again.', DATE_SUB(@seed_now, INTERVAL 1 DAY), 3, 14),
(10, 'The bathroom task is still pending.', DATE_SUB(@seed_now, INTERVAL 5 HOUR), 4, 15),
(11, 'I will finish it after class.', DATE_SUB(@seed_now, INTERVAL 4 HOUR), 4, 16),
(12, 'Remember to replace the bin liners.', DATE_SUB(@seed_now, INTERVAL 3 HOUR), 4, 10),

(13, 'Anyone preparing for exams?', DATE_SUB(@seed_now, INTERVAL 6 DAY), 5, 20),
(14, 'Yes, let us organize a study session.', DATE_SUB(@seed_now, INTERVAL 5 DAY), 5, 21),
(15, 'The barbecue signup is open.', DATE_SUB(@seed_now, INTERVAL 2 DAY), 5, 19),
(16, 'The fridge inspection is assigned for Friday.', DATE_SUB(@seed_now, INTERVAL 6 HOUR), 6, 22),
(17, 'I have restocked the cleaning supplies.', DATE_SUB(@seed_now, INTERVAL 5 HOUR), 6, 24),
(18, 'One task is intentionally unassigned for testing.', DATE_SUB(@seed_now, INTERVAL 4 HOUR), 6, 19);

-- =====================================================
-- CLEANING TASK TEMPLATES
-- Includes one inactive template to test historical records
-- and active/inactive filtering.
-- =====================================================
INSERT INTO cleaningTaskTemplate
(templateID, taskName, description, active)
VALUES
(1,  'Kitchen surfaces',
 'Wipe counters, clean the sink and stove, and disinfect shared handles.', TRUE),
(2,  'Bathroom',
 'Clean the toilet, shower, sink, mirrors and bathroom floor.', TRUE),
(3,  'Vacuum and mop floors',
 'Vacuum shared areas and mop hard floors.', TRUE),
(4,  'Trash and recycling',
 'Empty bins, replace liners and sort recycling.', TRUE),
(5,  'Common room',
 'Dust furniture, wipe tables and arrange the common room.', TRUE),
(6,  'Laundry room',
 'Wipe machines, clear lint filters and mop the floor.', TRUE),
(7,  'Fridge inspection',
 'Remove expired food and wipe shelves without discarding labelled food.', TRUE),
(8,  'Windows and glass',
 'Clean interior windows, glass doors and mirrors.', TRUE),
(9,  'Restock supplies',
 'Check soap, bin liners, paper towels and cleaning products.', TRUE),
(10, 'Legacy deep-clean checklist',
 'Inactive historical template retained to test old assignments.', FALSE);

-- =====================================================
-- CLEANING WEEKS
-- Generates five weeks per dorm:
--   - two completed/past weeks
--   - the current week
--   - two future weeks
-- Total: 3 dorms * 5 weeks = 15 cleaning weeks.
-- Each week has exactly one assigned user. The assignment rotates
-- through all users in that dorm.
-- =====================================================
CREATE TEMPORARY TABLE dormStudents AS
SELECT
    userID,
    dormID,
    ROW_NUMBER() OVER (
        PARTITION BY dormID
        ORDER BY userID
    ) AS studentNumber,
    COUNT(*) OVER (
        PARTITION BY dormID
    ) AS studentCount
FROM users
WHERE active = TRUE;

CREATE TEMPORARY TABLE weekOffsets AS
SELECT 0 AS weekIndex, -14 AS dayOffset
UNION ALL SELECT 1, -7
UNION ALL SELECT 2, 0
UNION ALL SELECT 3, 7
UNION ALL SELECT 4, 14;

INSERT INTO cleaningWeeks (dormID, assignedUserID, startDate, endDate)
SELECT
    d.dormID,
    ds.userID,
    ADDDATE(@current_week_start, wo.dayOffset),
    DATE_ADD(
        ADDDATE(@current_week_start, wo.dayOffset),
        INTERVAL 6 DAY
    )
FROM dorms d
CROSS JOIN weekOffsets wo
JOIN dormStudents ds
  ON ds.dormID = d.dormID
 AND ds.studentNumber = 1 + MOD(wo.weekIndex, ds.studentCount)
ORDER BY d.dormID, wo.dayOffset;

-- =====================================================
-- CLEANING ASSIGNMENTS
-- Produces one checklist per dorm/week, assigned to the same user as
-- the week itself.
--
-- Includes:
--   * completed historical tasks
--   * overdue incomplete tasks
--   * current pending/completed tasks
--   * future tasks
--   * historical assignments using an inactive template
-- =====================================================
INSERT INTO cleaningAssignments
(weekID, templateID, completed, completedAt, createdAt, assignedUserID)
SELECT
    generatedAssignments.weekID,
    generatedAssignments.templateID,
    generatedAssignments.isCompleted AS completed,
    CASE
        WHEN generatedAssignments.isCompleted = TRUE
             AND generatedAssignments.startDate = @current_week_start
            THEN GREATEST(
                CAST(generatedAssignments.startDate AS DATETIME),
                TIMESTAMPADD(
                    HOUR,
                    -(1 + MOD(generatedAssignments.dormID + generatedAssignments.templateID, 8)),
                    @seed_now
                )
            )
        WHEN generatedAssignments.isCompleted = TRUE
            THEN TIMESTAMPADD(
                HOUR,
                8 + MOD(generatedAssignments.dormID * 7 + generatedAssignments.templateID * 5, 120),
                CAST(generatedAssignments.startDate AS DATETIME)
            )
        ELSE NULL
    END AS completedAt,
    CASE
        WHEN generatedAssignments.startDate > CURDATE()
            THEN DATE_SUB(@seed_now, INTERVAL 1 DAY)
        ELSE DATE_SUB(CAST(generatedAssignments.startDate AS DATETIME), INTERVAL 3 DAY)
    END AS createdAt,
    generatedAssignments.assignedUserID
FROM (
    SELECT
        cw.weekID,
        cw.dormID,
        cw.assignedUserID,
        cw.startDate,
        cw.endDate,
        ctt.templateID,
        CASE
            -- Most historical work is complete, but some remains overdue.
            WHEN cw.endDate < CURDATE()
                THEN MOD(cw.weekID + ctt.templateID, 5) <> 0

            -- The current week contains a mix of complete and pending work.
            WHEN cw.startDate <= CURDATE() AND cw.endDate >= CURDATE()
                THEN MOD(cw.dormID * 2 + ctt.templateID, 4) = 0

            -- Future assignments are never pre-completed.
            ELSE FALSE
        END AS isCompleted
    FROM cleaningWeeks cw
    JOIN cleaningTaskTemplate ctt
      ON (
            ctt.templateID BETWEEN 1 AND 7
            OR (ctt.templateID = 8 AND cw.startDate = @current_week_start)
            OR (
                ctt.templateID = 9
                AND cw.startDate >= @current_week_start
            )
            OR (
                ctt.templateID = 10
                AND cw.startDate = DATE_SUB(@current_week_start, INTERVAL 2 WEEK)
            )
         )
) generatedAssignments;

-- =====================================================
-- GUARANTEED CLEANING TEST CASES
-- These updates make a few stable scenarios easy to use in
-- frontend, integration and API tests regardless of seed date.
-- =====================================================

-- Dorm 1 current week: completed kitchen task assigned to the week's user.
UPDATE cleaningAssignments ca
JOIN cleaningWeeks cw ON cw.weekID = ca.weekID
SET ca.completed = TRUE,
    ca.completedAt = GREATEST(
        CAST(cw.startDate AS DATETIME),
        DATE_SUB(@seed_now, INTERVAL 2 HOUR)
    ),
    ca.assignedUserID = cw.assignedUserID
WHERE cw.dormID = 1
  AND cw.startDate = @current_week_start
  AND ca.templateID = 1;

-- Dorm 1 current week: pending bathroom task assigned to the same week's user.
UPDATE cleaningAssignments ca
JOIN cleaningWeeks cw ON cw.weekID = ca.weekID
SET ca.completed = FALSE,
    ca.completedAt = NULL,
    ca.assignedUserID = cw.assignedUserID
WHERE cw.dormID = 1
  AND cw.startDate = @current_week_start
  AND ca.templateID = 2;

-- Dorm 1 current week: pending floor task assigned to the same week's user.
UPDATE cleaningAssignments ca
JOIN cleaningWeeks cw ON cw.weekID = ca.weekID
SET ca.completed = FALSE,
    ca.completedAt = NULL,
    ca.assignedUserID = cw.assignedUserID
WHERE cw.dormID = 1
  AND cw.startDate = @current_week_start
  AND ca.templateID = 3;

-- Dorm 1 previous week: guaranteed overdue trash task.
UPDATE cleaningAssignments ca
JOIN cleaningWeeks cw ON cw.weekID = ca.weekID
SET ca.completed = FALSE,
    ca.completedAt = NULL,
    ca.assignedUserID = cw.assignedUserID
WHERE cw.dormID = 1
  AND cw.startDate = DATE_SUB(@current_week_start, INTERVAL 1 WEEK)
  AND ca.templateID = 4;

-- Dorm 2 next week: guaranteed future kitchen assignment.
UPDATE cleaningAssignments ca
JOIN cleaningWeeks cw ON cw.weekID = ca.weekID
SET ca.completed = FALSE,
    ca.completedAt = NULL,
    ca.assignedUserID = cw.assignedUserID
WHERE cw.dormID = 2
  AND cw.startDate = DATE_ADD(@current_week_start, INTERVAL 1 WEEK)
  AND ca.templateID = 1;

-- Dorm 3 previous week: guaranteed completed historical bathroom assignment.
UPDATE cleaningAssignments ca
JOIN cleaningWeeks cw ON cw.weekID = ca.weekID
SET ca.completed = TRUE,
    ca.completedAt = DATE_ADD(CAST(cw.startDate AS DATETIME), INTERVAL 30 HOUR),
    ca.assignedUserID = cw.assignedUserID
WHERE cw.dormID = 3
  AND cw.startDate = DATE_SUB(@current_week_start, INTERVAL 1 WEEK)
  AND ca.templateID = 2;

DROP TEMPORARY TABLE weekOffsets;
DROP TEMPORARY TABLE dormStudents;

COMMIT;

-- =====================================================
-- OPTIONAL VERIFICATION OUTPUT
-- =====================================================
SELECT 'dorms' AS tableName, COUNT(*) AS rowCount FROM dorms
UNION ALL SELECT 'rooms', COUNT(*) FROM room
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'surveys', COUNT(*) FROM survey
UNION ALL SELECT 'events', COUNT(*) FROM events
UNION ALL SELECT 'sensors', COUNT(*) FROM sensor
UNION ALL SELECT 'sensor_data', COUNT(*) FROM sensor_data
UNION ALL SELECT 'chats', COUNT(*) FROM chat
UNION ALL SELECT 'cleaning_templates', COUNT(*) FROM cleaningTaskTemplate
UNION ALL SELECT 'cleaning_weeks', COUNT(*) FROM cleaningWeeks
UNION ALL SELECT 'cleaning_assignments', COUNT(*) FROM cleaningAssignments;

SELECT
    CASE
        WHEN ca.completed = TRUE THEN 'COMPLETED'
        WHEN cw.endDate < CURDATE() THEN 'OVERDUE'
        WHEN cw.startDate > CURDATE() THEN 'FUTURE'
        ELSE 'CURRENT_PENDING'
    END AS assignmentStatus,
    COUNT(*) AS assignmentCount
FROM cleaningAssignments ca
JOIN cleaningWeeks cw ON cw.weekID = ca.weekID
GROUP BY assignmentStatus
ORDER BY assignmentStatus;

-- Stable current-week Dorm 1 test fixture.
SELECT
    cw.weekID,
    cw.dormID,
    cw.assignedUserID AS weekAssignedUserID,
    weekUser.username AS weekAssignedUsername,
    cw.startDate,
    cw.endDate,
    ca.assignmentID,
    ctt.taskName,
    ca.completed,
    ca.completedAt,
    ca.assignedUserID,
    u.username AS assignedUsername
FROM cleaningWeeks cw
JOIN cleaningAssignments ca ON ca.weekID = cw.weekID
JOIN cleaningTaskTemplate ctt ON ctt.templateID = ca.templateID
JOIN users weekUser ON weekUser.userID = cw.assignedUserID
LEFT JOIN users u ON u.userID = ca.assignedUserID
WHERE cw.dormID = 1
  AND cw.startDate = @current_week_start
ORDER BY ca.assignmentID;
