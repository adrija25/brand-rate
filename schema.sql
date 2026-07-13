CREATE TABLE IF NOT EXISTS kits (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'locked',
  access_token_hash TEXT,
  payment_provider TEXT,
  payment_id TEXT,
  created_at TEXT NOT NULL,
  paid_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_kits_access_hash ON kits(access_token_hash);
CREATE UNIQUE INDEX IF NOT EXISTS idx_kits_payment ON kits(payment_provider, payment_id);
