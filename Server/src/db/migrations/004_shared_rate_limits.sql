CREATE TABLE rate_limit_counters (
  scope varchar(32) NOT NULL,
  key_hash varchar(64) NOT NULL,
  hits integer NOT NULL CHECK (hits >= 0),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (scope, key_hash)
);
CREATE INDEX rate_limit_expiry ON rate_limit_counters(expires_at);
