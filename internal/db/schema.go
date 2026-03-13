package db

const schema = `
CREATE TABLE IF NOT EXISTS phases (
	id          INTEGER PRIMARY KEY AUTOINCREMENT,
	name        TEXT    NOT NULL,
	description TEXT    NOT NULL DEFAULT '',
	sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS topics (
	id          INTEGER PRIMARY KEY AUTOINCREMENT,
	phase_id    INTEGER NOT NULL REFERENCES phases(id),
	name        TEXT    NOT NULL,
	description TEXT    NOT NULL DEFAULT '',
	sort_order  INTEGER NOT NULL DEFAULT 0,
	status      TEXT    NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done'))
);

CREATE TABLE IF NOT EXISTS entries (
	id          INTEGER PRIMARY KEY AUTOINCREMENT,
	topic_id    INTEGER NOT NULL REFERENCES topics(id),
	kind        TEXT    NOT NULL CHECK (kind IN ('question', 'answer', 'note')),
	content     TEXT    NOT NULL,
	session_id  TEXT    NOT NULL DEFAULT '',
	question_id INTEGER REFERENCES entries(id),
	created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_entries_topic ON entries(topic_id);
CREATE INDEX IF NOT EXISTS idx_entries_kind  ON entries(kind);
CREATE INDEX IF NOT EXISTS idx_topics_phase  ON topics(phase_id);

CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
	content,
	content_rowid='id',
	content='entries'
);

CREATE TRIGGER IF NOT EXISTS entries_ai AFTER INSERT ON entries BEGIN
	INSERT INTO entries_fts(rowid, content) VALUES (new.id, new.content);
END;

CREATE TRIGGER IF NOT EXISTS entries_ad AFTER DELETE ON entries BEGIN
	INSERT INTO entries_fts(entries_fts, rowid, content) VALUES ('delete', old.id, old.content);
END;

CREATE TRIGGER IF NOT EXISTS entries_au AFTER UPDATE ON entries BEGIN
	INSERT INTO entries_fts(entries_fts, rowid, content) VALUES ('delete', old.id, old.content);
	INSERT INTO entries_fts(rowid, content) VALUES (new.id, new.content);
END;
`

// migrations adds columns that don't exist yet (safe to re-run).
var migrations = []string{
	`ALTER TABLE entries ADD COLUMN question_id INTEGER REFERENCES entries(id)`,
}
