BEGIN;

-- ======================================
-- RESET (drop old tables if they exist)
-- ======================================

DROP TABLE IF EXISTS user_reward CASCADE;
DROP TABLE IF EXISTS habit_log CASCADE;
DROP TABLE IF EXISTS streak CASCADE;
DROP TABLE IF EXISTS habit CASCADE;
DROP TABLE IF EXISTS reward CASCADE;
DROP TABLE IF EXISTS app_user CASCADE;

-- ================================
-- ENUM type for reward category
-- ================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reward_category') THEN
        CREATE TYPE reward_category AS ENUM ('character', 'tree_skin', 'badge', 'other');
    END IF;
END$$;

-- =======================================================
-- 1) USER  (table name: app_user to avoid keyword clash)
-- =======================================================

CREATE TABLE app_user (
    user_id        SERIAL PRIMARY KEY,
    username       VARCHAR(50)  NOT NULL UNIQUE,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    display_name   VARCHAR(100) NOT NULL,
    avatar_url     TEXT,
    leaf_dollars   INTEGER      NOT NULL DEFAULT 0,
    last_login     TIMESTAMPTZ,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE
);

-- ============
-- 2) HABIT
-- ============

CREATE TABLE habit (
    habit_id           SERIAL PRIMARY KEY,
    user_id            INTEGER      NOT NULL,
    name               VARCHAR(100) NOT NULL,
    description        TEXT,
    emoji              VARCHAR(10),
    icon               VARCHAR(50),
    color              VARCHAR(20),
    habit_type         VARCHAR(30)  NOT NULL,      -- 'build', 'quit', etc.
    tracking_mode      VARCHAR(30)  NOT NULL,      -- 'tick', 'amount', 'quit', etc.
    target_amount      NUMERIC(10,2),
    unit               VARCHAR(30),
    frequency          VARCHAR(50),                -- 'daily', 'weekly', etc.
    is_public          BOOLEAN      NOT NULL DEFAULT FALSE,

    -- Denormalized streak data for fast reads:
    current_streak     INTEGER      NOT NULL DEFAULT 0,
    longest_streak     INTEGER      NOT NULL DEFAULT 0,
    last_completed_date DATE,

    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ,
    is_active          BOOLEAN      NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_habit_user
        FOREIGN KEY (user_id)
        REFERENCES app_user (user_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_habit_user_id ON habit(user_id);

-- =============
-- 3) STREAK
-- =============

CREATE TABLE streak (
    streak_id    SERIAL PRIMARY KEY,
    habit_id     INTEGER     NOT NULL,
    start_date   DATE        NOT NULL,
    end_date     DATE,
    length_days  INTEGER     NOT NULL DEFAULT 0,
    is_current   BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_streak_habit
        FOREIGN KEY (habit_id)
        REFERENCES habit (habit_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_streak_habit_id ON streak(habit_id);

-- At most one current streak per habit
CREATE UNIQUE INDEX uq_streak_current_per_habit
    ON streak(habit_id)
    WHERE is_current = TRUE;

-- ==============
-- 4) HABIT_LOG
-- ==============

CREATE TABLE habit_log (
    log_id       SERIAL PRIMARY KEY,
    habit_id     INTEGER     NOT NULL,
    log_date     DATE        NOT NULL,
    status       VARCHAR(20) NOT NULL,      -- 'done', 'missed', 'partial', etc.
    amount_done  NUMERIC(10,2),
    note         TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ,

    CONSTRAINT fk_log_habit
        FOREIGN KEY (habit_id)
        REFERENCES habit (habit_id)
        ON DELETE CASCADE
);

-- one log per habit per day
CREATE UNIQUE INDEX uq_habit_log_habit_date
    ON habit_log (habit_id, log_date);

CREATE INDEX idx_habit_log_habit_id ON habit_log(habit_id);

-- ============
-- 5) REWARD
-- ============

CREATE TABLE reward (
    reward_id    SERIAL PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    description  TEXT,
    cost_leaf    INTEGER      NOT NULL CHECK (cost_leaf >= 0),
    icon_url     TEXT,
    category     reward_category,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE
);

-- ====================================================
-- 6) USER_REWARD (bridge between app_user and reward)
-- ====================================================

CREATE TABLE user_reward (
    user_reward_id SERIAL PRIMARY KEY,
    user_id        INTEGER     NOT NULL,
    reward_id      INTEGER     NOT NULL,
    unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_equipped    BOOLEAN     NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_user_reward_user
        FOREIGN KEY (user_id)
        REFERENCES app_user (user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_user_reward_reward
        FOREIGN KEY (reward_id)
        REFERENCES reward (reward_id)
        ON DELETE CASCADE
);

-- user can unlock a specific reward only once
CREATE UNIQUE INDEX uq_user_reward_unique
    ON user_reward (user_id, reward_id);

CREATE INDEX idx_user_reward_user_id   ON user_reward(user_id);
CREATE INDEX idx_user_reward_reward_id ON user_reward(reward_id);

COMMIT;
