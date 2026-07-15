-- ============================================================
-- REP TOKEN - PostgreSQL Schema
-- ============================================================
-- Run this once against your Aiven PostgreSQL database to create
-- the tables the backend depends on.
--
-- Usage:
--   psql "$DATABASE_URL" -f backend/db/schema.sql
-- or import via Aiven's web console / psql / pgAdmin.
-- ============================================================

-- configs: tracks last-processed block number per event type
CREATE TABLE IF NOT EXISTS configs (
    id                   SMALLINT PRIMARY KEY DEFAULT 0,
    job_posts            BIGINT NOT NULL DEFAULT 0,
    pendings             BIGINT NOT NULL DEFAULT 0,
    job_acceptances      BIGINT NOT NULL DEFAULT 0,
    job_unhired_cancels  BIGINT NOT NULL DEFAULT 0,
    job_expire_cancels   BIGINT NOT NULL DEFAULT 0,
    disputes             BIGINT NOT NULL DEFAULT 0,
    completes            BIGINT NOT NULL DEFAULT 0,
    closes               BIGINT NOT NULL DEFAULT 0,
    freelancer_transfer  BIGINT NOT NULL DEFAULT 0,
    detailed_disputes    BIGINT NOT NULL DEFAULT 0,
    dispute_resolves     BIGINT NOT NULL DEFAULT 0,
    verifiers_selection  BIGINT NOT NULL DEFAULT 0,
    verifier_transfers   BIGINT NOT NULL DEFAULT 0,
    roles_assignments    BIGINT NOT NULL DEFAULT 0
);

INSERT INTO configs (id) VALUES (0)
    ON CONFLICT (id) DO NOTHING;

-- users
CREATE TABLE IF NOT EXISTS users (
    id               SERIAL PRIMARY KEY,
    f_name           VARCHAR(255),
    l_name           VARCHAR(255),
    email            VARCHAR(255) UNIQUE NOT NULL,
    pass_hash        TEXT NOT NULL,
    address          TEXT,
    hash_address     TEXT,
    bio              TEXT,
    location         VARCHAR(255),
    profile_picture  TEXT,
    role             VARCHAR(50) NOT NULL DEFAULT 'freelancer',
    code             TEXT,
    expiry_at        TIMESTAMP,
    email_v          BOOLEAN NOT NULL DEFAULT FALSE,
    kyc_v            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- freelancers
CREATE TABLE IF NOT EXISTS freelancers (
    user_id        INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    title          VARCHAR(255),
    category       VARCHAR(255),
    description    TEXT,
    min_wage       NUMERIC,
    skills         TEXT,
    qualifications TEXT
);

-- verifiers
CREATE TABLE IF NOT EXISTS verifiers (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
);

-- contacts
CREATE TABLE IF NOT EXISTS contacts (
    user_id   INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    website   TEXT,
    github    TEXT,
    linkedin  TEXT,
    twitter   TEXT,
    instagram TEXT,
    telegram  TEXT,
    whatsapp  TEXT
);

-- education_levels
CREATE TABLE IF NOT EXISTS education_levels (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255),
    institution VARCHAR(255),
    start_year  INTEGER,
    end_year    INTEGER
);

-- certifications
CREATE TABLE IF NOT EXISTS certifications (
    id      SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title   VARCHAR(255),
    issuer  VARCHAR(255),
    year    INTEGER
);

-- reviews
CREATE TABLE IF NOT EXISTS reviews (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment     TEXT,
    rating      NUMERIC,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- jobs (id is the on-chain job bytes id, stored as BYTEA)
CREATE TABLE IF NOT EXISTS jobs (
    id            BYTEA PRIMARY KEY,
    employer_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
    freelancer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title         VARCHAR(255),
    description   TEXT,
    category      VARCHAR(255),
    topics        TEXT,
    skills        TEXT,
    company       VARCHAR(255),
    salary        NUMERIC,
    bid_duration  NUMERIC,
    state         VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    published_date TIMESTAMP,
    last_change   TIMESTAMP
);

-- bids
CREATE TABLE IF NOT EXISTS bids (
    id                SERIAL PRIMARY KEY,
    job_id            BYTEA NOT NULL,
    user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount            NUMERIC,
    finishing_days    NUMERIC,
    cover_letter      TEXT,
    profile_links     TEXT,
    freelancer_address TEXT,
    created_at        TIMESTAMP
);

-- disputes (job_id is BYTEA = on-chain job id)
CREATE TABLE IF NOT EXISTS disputes (
    id                  SERIAL PRIMARY KEY,
    job_id              BYTEA UNIQUE,
    issuer_id           INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reason              TEXT,
    description         TEXT,
    stakes              NUMERIC,
    created_at          TIMESTAMP,
    submission_deadline NUMERIC,
    reveal_deadline     NUMERIC,
    score               NUMERIC,
    resolved_time       NUMERIC,
    slashed_cnt         NUMERIC,
    total_reward        NUMERIC
);

-- verifier_disputes (join table)
CREATE TABLE IF NOT EXISTS verifier_disputes (
    dispute_id  INTEGER NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    verifier_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (dispute_id, verifier_id)
);

-- contract_roles (indexed from RPTAccessManager events)
CREATE TABLE IF NOT EXISTS contract_roles (
    role_id      NUMERIC NOT NULL,
    subject      BYTEA NOT NULL,
    action       VARCHAR(50),
    delay        NUMERIC,
    granted_time NUMERIC,
    new_member   BOOLEAN,
    block_number NUMERIC,
    log_index    INTEGER,
    tx_hash      TEXT,
    PRIMARY KEY (role_id, subject)
);

-- nonces (wallet signup verification)
CREATE TABLE IF NOT EXISTS nonces (
    nonce      VARCHAR(255) PRIMARY KEY,
    used       BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP
);

-- Helpful indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_users_hash_address    ON users (hash_address);
CREATE INDEX IF NOT EXISTS idx_jobs_employer_id      ON jobs (employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_freelancer_id    ON jobs (freelancer_id);
CREATE INDEX IF NOT EXISTS idx_bids_job_id           ON bids (job_id);
CREATE INDEX IF NOT EXISTS idx_bids_user_id          ON bids (user_id);
CREATE INDEX IF NOT EXISTS idx_disputes_job_id       ON disputes (job_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id       ON reviews (user_id);
