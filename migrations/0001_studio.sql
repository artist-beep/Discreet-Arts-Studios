CREATE TABLE IF NOT EXISTS content (id INTEGER PRIMARY KEY CHECK(id=1), body TEXT NOT NULL, revision INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS leads (
  submission_id TEXT PRIMARY KEY, created_at TEXT NOT NULL, payload TEXT NOT NULL,
  suspected_spam INTEGER NOT NULL CHECK(suspected_spam IN (0,1)), status TEXT NOT NULL DEFAULT 'New'
);
CREATE INDEX IF NOT EXISTS leads_created ON leads(created_at DESC);
CREATE TABLE IF NOT EXISTS hearts(project TEXT NOT NULL, device TEXT NOT NULL, PRIMARY KEY(project,device));
CREATE TABLE IF NOT EXISTS owner(id INTEGER PRIMARY KEY CHECK(id=1), email TEXT NOT NULL, password_hash TEXT, credential_version INTEGER NOT NULL DEFAULT 0, ticket_digest TEXT, ticket_type TEXT, ticket_expires INTEGER);
CREATE TABLE IF NOT EXISTS sessions(digest TEXT PRIMARY KEY, version INTEGER NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS attempts(key TEXT PRIMARY KEY, window INTEGER NOT NULL, hits INTEGER NOT NULL);
