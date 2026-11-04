CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT,            -- NULL for Google-only accounts
  google_sub    TEXT,            -- Google subject id (unique when set, see migrate.js)
  role         TEXT NOT NULL CHECK (role IN ('client','freelancer','admin')),
  title         TEXT NOT NULL DEFAULT '',
  company       TEXT NOT NULL DEFAULT '',
  location      TEXT NOT NULL DEFAULT '',
  bio           TEXT NOT NULL DEFAULT '',
  skills        TEXT NOT NULL DEFAULT '[]',
  hourly_rate   REAL,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS jobs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  category    TEXT NOT NULL,
  budget_min  REAL NOT NULL,
  budget_max  REAL NOT NULL,
  duration    TEXT NOT NULL DEFAULT '',
  experience  TEXT NOT NULL DEFAULT 'Intermediate',
  skills      TEXT NOT NULL DEFAULT '[]',
  deadline    TEXT,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','completed','closed')),
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_jobs_client ON jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);

CREATE TABLE IF NOT EXISTS proposals (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id          INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  freelancer_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cover_letter    TEXT NOT NULL,
  proposed_amount REAL NOT NULL CHECK (proposed_amount > 0),
  delivery_days   INTEGER NOT NULL CHECK (delivery_days > 0),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','withdrawn')),
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_proposals_job ON proposals(job_id);
CREATE INDEX IF NOT EXISTS idx_proposals_freelancer ON proposals(freelancer_id);
-- One live proposal per freelancer per job (a withdrawn one may be re-submitted).
CREATE UNIQUE INDEX IF NOT EXISTS uq_proposals_live ON proposals(job_id, freelancer_id) WHERE status <> 'withdrawn';

CREATE TABLE IF NOT EXISTS projects (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id        INTEGER NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE RESTRICT,
  client_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  freelancer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  proposal_id   INTEGER NOT NULL UNIQUE REFERENCES proposals(id) ON DELETE RESTRICT,
  title         TEXT NOT NULL,
  budget        REAL NOT NULL,
  deadline      TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','in_review','on_hold','completed')),
  progress      INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_freelancer ON projects(freelancer_id);

CREATE TABLE IF NOT EXISTS payments (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id     INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  freelancer_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount         REAL NOT NULL CHECK (amount >= 0),
  payment_type   TEXT NOT NULL CHECK (payment_type IN ('deposit','final')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid','pending','refunded')),
  payment_date   TEXT NOT NULL,
  created_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_payments_project ON payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_freelancer ON payments(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
