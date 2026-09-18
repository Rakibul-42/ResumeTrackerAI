ALTER TABLE users ADD COLUMN terms_version varchar(32);
ALTER TABLE users ADD COLUMN terms_accepted_at timestamptz;
ALTER TABLE users ADD CONSTRAINT users_terms_pair CHECK ((terms_version IS NULL) = (terms_accepted_at IS NULL));
ALTER TABLE resumes ADD COLUMN ai_notice_version varchar(32);
ALTER TABLE resumes ADD COLUMN ai_acknowledged_at timestamptz;
ALTER TABLE resumes ADD CONSTRAINT resumes_notice_pair CHECK ((ai_notice_version IS NULL) = (ai_acknowledged_at IS NULL));
