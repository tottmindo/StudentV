-- =====================================================
-- Dormitory Management Database (MySQL 8+)
-- =====================================================
CREATE DATABASE dorms_db;
USE dorms_db;

CREATE TABLE dorms (
    dormID INT AUTO_INCREMENT,
    floor INT NOT NULL,
    address VARCHAR(255) NOT NULL,
    PRIMARY KEY (dormID)
);

CREATE TABLE room (
    roomID INT AUTO_INCREMENT,
    dormID INT NOT NULL,
    PRIMARY KEY (roomID, dormID),
    CONSTRAINT fk_room_dorm
        FOREIGN KEY (dormID)
        REFERENCES dorms(dormID)
        ON DELETE CASCADE
);

CREATE TABLE users (
    userID INT AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL UNIQUE,
    passwordHash VARCHAR(255) NOT NULL, -- Store hashed passwords only
    role VARCHAR(50) NOT NULL,
    roomID INT NOT NULL,
    dormID INT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (userID),
    CONSTRAINT fk_user_room
        FOREIGN KEY (roomID, dormID)
        REFERENCES room(roomID, dormID)
);

CREATE TABLE survey (
    eID INT AUTO_INCREMENT,
    question VARCHAR(500) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiresAt DATETIME NOT NULL,
    multipleChoice BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (eID)
);

CREATE TABLE surveyAnswers (
    eID INT NOT NULL,
    userID INT NOT NULL,
    answer VARCHAR(1000) NOT NULL,
    answeredAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (eID, userID),
    CONSTRAINT fk_surveyanswers_survey
        FOREIGN KEY (eID)
        REFERENCES survey(eID)
        ON DELETE CASCADE,
    CONSTRAINT fk_surveyanswers_user
        FOREIGN KEY (userID)
        REFERENCES users(userID)
        ON DELETE CASCADE
);

CREATE TABLE events (
    eventID INT AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    startDate DATETIME NOT NULL,
    endDate DATETIME NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    type VARCHAR(100) NOT NULL,

    dormID INT NOT NULL,

    CONSTRAINT fk_event_dorm
        FOREIGN KEY (dormID)
        REFERENCES dorms(dormID)
        ON DELETE CASCADE,

    PRIMARY KEY (eventID)
);

CREATE TABLE activatedEvents (
    eventID INT NOT NULL,
    userID INT NOT NULL,
    PRIMARY KEY (eventID, userID),
    CONSTRAINT fk_activatedevents_event
        FOREIGN KEY (eventID)
        REFERENCES events(eventID)
        ON DELETE CASCADE,
    CONSTRAINT fk_activatedevents_user
        FOREIGN KEY (userID)
        REFERENCES users(userID)
        ON DELETE CASCADE
);

CREATE TABLE sensor (
    sensorCode VARCHAR(100) NOT NULL,
    type VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    dormID INT NOT NULL,
    PRIMARY KEY (sensorCode),
    CONSTRAINT fk_sensor_dorm
        FOREIGN KEY (dormID)
        REFERENCES dorms(dormID)
        ON DELETE CASCADE
);

CREATE TABLE chat (
    chatID INT AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dormID INT NOT NULL,
    PRIMARY KEY (chatID),
    CONSTRAINT fk_chat_dorm
        FOREIGN KEY (dormID)
        REFERENCES dorms(dormID)
        ON DELETE CASCADE
);

CREATE TABLE chatMembers (
    chatID INT NOT NULL,
    userID INT NOT NULL,
    joinedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (chatID, userID),
    CONSTRAINT fk_chatmembers_chat
        FOREIGN KEY (chatID)
        REFERENCES chat(chatID)
        ON DELETE CASCADE,
    CONSTRAINT fk_chatmembers_user
        FOREIGN KEY (userID)
        REFERENCES users(userID)
        ON DELETE CASCADE
);

CREATE TABLE chatHistory (
    messageID INT AUTO_INCREMENT,
    msg TEXT NOT NULL,
    sentAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    chatID INT NOT NULL,
    userID INT NOT NULL,
    PRIMARY KEY (messageID),
    CONSTRAINT fk_chathistory_member
        FOREIGN KEY (chatID, userID)
        REFERENCES chatMembers(chatID, userID)
        ON DELETE CASCADE
);

CREATE TABLE sensor_data (
    sensorCode VARCHAR(100) NOT NULL,
    recordedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    totalVolume FLOAT NOT NULL,
    tempMin FLOAT NOT NULL,
    tempMax FLOAT NOT NULL,
    errorCode INT NOT NULL,
    battery FLOAT NOT NULL,
    ambientTemp FLOAT NOT NULL,
    humidity FLOAT NOT NULL,
    leakStatus BOOLEAN NOT NULL,
    PRIMARY KEY (sensorCode, recordedAt),
    CONSTRAINT fk_sensordata_sensor
        FOREIGN KEY (sensorCode)
        REFERENCES sensor(sensorCode)
        ON DELETE CASCADE
);

CREATE TABLE cleaningTaskTemplate (
    templateID INT AUTO_INCREMENT,
    taskName VARCHAR(100) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY(templateID)
);

CREATE TABLE cleaningWeeks (
    weekID INT AUTO_INCREMENT,
    dormID INT NOT NULL,
    assignedUserID INT NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,

    PRIMARY KEY(weekID),

    FOREIGN KEY (dormID)
        REFERENCES dorms(dormID)
        ON DELETE CASCADE,

    FOREIGN KEY (assignedUserID)
        REFERENCES users(userID)
        ON DELETE CASCADE,
    
    UNIQUE(dormID, startDate),
    CHECK (endDate >= startDate)
);

CREATE TABLE cleaningAssignments (
    assignmentID INT AUTO_INCREMENT,

    weekID INT NOT NULL,
    templateID INT NOT NULL,

    completed BOOLEAN DEFAULT FALSE,
    completedAt DATETIME NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    assignedUserID INT NULL,

    FOREIGN KEY (assignedUserID)
        REFERENCES users(userID)
        ON DELETE SET NULL,

    PRIMARY KEY(assignmentID),

    FOREIGN KEY (weekID)
        REFERENCES cleaningWeeks(weekID)
        ON DELETE CASCADE,

    FOREIGN KEY (templateID)
        REFERENCES cleaningTaskTemplate(templateID),
    
    UNIQUE (weekID, templateID)
);
