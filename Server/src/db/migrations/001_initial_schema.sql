CREATE TABLE users (
  id uuid PRIMARY KEY,
  name varchar(80) NOT NULL,
  email text NOT NULL,
  password_hash text NOT NULL,
  session_version integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_unique ON users (lower(email));
CREATE TABLE resumes (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title varchar(160) NOT NULL,
  source_filename varchar(255) NOT NULL,
  current_version_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX resumes_owner_updated ON resumes(user_id, updated_at DESC);
CREATE TABLE resume_versions (
  id uuid PRIMARY KEY,
  resume_id uuid NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  parent_version_id uuid REFERENCES resume_versions(id) ON DELETE SET NULL,
  version_number integer NOT NULL CHECK (version_number > 0),
  source_type text NOT NULL CHECK (source_type IN ('upload','rewrite')),
  raw_text text NOT NULL,
  parsed_sections jsonb NOT NULL,
  latest_score smallint CHECK (latest_score BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (resume_id, version_number),
  UNIQUE (resume_id, id)
);
CREATE INDEX versions_resume_created ON resume_versions(resume_id, created_at);
ALTER TABLE resumes ADD CONSTRAINT current_version_fk FOREIGN KEY (current_version_id)
  REFERENCES resume_versions(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE analyses (
  id uuid PRIMARY KEY,
  version_id uuid NOT NULL REFERENCES resume_versions(id) ON DELETE CASCADE,
  target_role varchar(160),
  ats_score smallint NOT NULL CHECK (ats_score BETWEEN 0 AND 100),
  model varchar(100) NOT NULL,
  summary text NOT NULL,
  score_breakdown jsonb NOT NULL,
  issues jsonb NOT NULL,
  strengths jsonb NOT NULL,
  keywords_present jsonb NOT NULL,
  keywords_missing jsonb NOT NULL,
  bullet_rewrites jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX analyses_version_created ON analyses(version_id, created_at DESC);
CREATE TABLE activity_events (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_id uuid NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  version_id uuid REFERENCES resume_versions(id) ON DELETE SET NULL,
  analysis_id uuid REFERENCES analyses(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('upload','analyze','rewrite')),
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  label varchar(80) NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX events_owner_occurred ON activity_events(user_id, occurred_at DESC);
