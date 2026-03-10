package db

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"time"

	_ "modernc.org/sqlite"
)

type Store struct {
	db *sql.DB
}

type Phase struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	SortOrder   int    `json:"sortOrder"`
}

type Topic struct {
	ID          int    `json:"id"`
	PhaseID     int    `json:"phaseId"`
	Name        string `json:"name"`
	Description string `json:"description"`
	SortOrder   int    `json:"sortOrder"`
	Status      string `json:"status"`
}

type Entry struct {
	ID        int    `json:"id"`
	TopicID   int    `json:"topicId"`
	Kind      string `json:"kind"`
	Content   string `json:"content"`
	SessionID string `json:"sessionId"`
	CreatedAt string `json:"createdAt"`
}

type TopicWithEntries struct {
	Topic   Topic   `json:"topic"`
	Entries []Entry `json:"entries"`
}

type PhaseWithTopics struct {
	Phase  Phase   `json:"phase"`
	Topics []Topic `json:"topics"`
}

type SearchResult struct {
	Entry     Entry  `json:"entry"`
	TopicName string `json:"topicName"`
	PhaseName string `json:"phaseName"`
}

type ProgressStats struct {
	TotalTopics     int `json:"totalTopics"`
	DoneTopics      int `json:"doneTopics"`
	InProgressTopics int `json:"inProgressTopics"`
	TotalQuestions  int `json:"totalQuestions"`
	TotalAnswers    int `json:"totalAnswers"`
}

// NewStore opens or creates a SQLite database.
// If dbPath is empty, it defaults to data/learn.sqlite relative to projectDir.
// If projectDir is also empty, it uses the current working directory.
func NewStore(dbPath string, projectDir ...string) (*Store, error) {
	if dbPath == "" {
		base := "."
		if len(projectDir) > 0 && projectDir[0] != "" {
			base = projectDir[0]
		}
		dir := filepath.Join(base, "data")
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return nil, fmt.Errorf("create data dir: %w", err)
		}
		dbPath = filepath.Join(dir, "learn.sqlite")
	}

	db, err := sql.Open("sqlite", dbPath+"?_journal_mode=WAL&_busy_timeout=5000")
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}

	if _, err := db.Exec(schema); err != nil {
		return nil, fmt.Errorf("apply schema: %w", err)
	}

	return &Store{db: db}, nil
}

func (s *Store) Close() error {
	return s.db.Close()
}

// --- Phases ---

func (s *Store) ListPhases() ([]PhaseWithTopics, error) {
	phases, err := s.listPhases()
	if err != nil {
		return nil, err
	}

	var result []PhaseWithTopics
	for _, p := range phases {
		topics, err := s.ListTopicsByPhase(p.ID)
		if err != nil {
			return nil, err
		}
		result = append(result, PhaseWithTopics{Phase: p, Topics: topics})
	}
	return result, nil
}

func (s *Store) listPhases() ([]Phase, error) {
	rows, err := s.db.Query("SELECT id, name, description, sort_order FROM phases ORDER BY sort_order")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var phases []Phase
	for rows.Next() {
		var p Phase
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.SortOrder); err != nil {
			return nil, err
		}
		phases = append(phases, p)
	}
	return phases, rows.Err()
}

// --- Topics ---

func (s *Store) ListTopicsByPhase(phaseID int) ([]Topic, error) {
	rows, err := s.db.Query(
		"SELECT id, phase_id, name, description, sort_order, status FROM topics WHERE phase_id = ? ORDER BY sort_order",
		phaseID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var topics []Topic
	for rows.Next() {
		var t Topic
		if err := rows.Scan(&t.ID, &t.PhaseID, &t.Name, &t.Description, &t.SortOrder, &t.Status); err != nil {
			return nil, err
		}
		topics = append(topics, t)
	}
	return topics, rows.Err()
}

func (s *Store) GetTopic(id int) (*Topic, error) {
	var t Topic
	err := s.db.QueryRow(
		"SELECT id, phase_id, name, description, sort_order, status FROM topics WHERE id = ?", id,
	).Scan(&t.ID, &t.PhaseID, &t.Name, &t.Description, &t.SortOrder, &t.Status)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (s *Store) FindTopicByName(name string) (*Topic, error) {
	var t Topic
	err := s.db.QueryRow(
		"SELECT id, phase_id, name, description, sort_order, status FROM topics WHERE LOWER(name) = LOWER(?)", name,
	).Scan(&t.ID, &t.PhaseID, &t.Name, &t.Description, &t.SortOrder, &t.Status)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (s *Store) SetTopicStatus(id int, status string) error {
	_, err := s.db.Exec("UPDATE topics SET status = ? WHERE id = ?", status, id)
	return err
}

func (s *Store) GetActiveTopic() (*Topic, error) {
	var t Topic
	err := s.db.QueryRow(
		"SELECT id, phase_id, name, description, sort_order, status FROM topics WHERE status = 'in_progress' ORDER BY sort_order LIMIT 1",
	).Scan(&t.ID, &t.PhaseID, &t.Name, &t.Description, &t.SortOrder, &t.Status)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &t, nil
}

// --- Entries ---

func (s *Store) CreateEntry(topicID int, kind, content, sessionID string) (*Entry, error) {
	now := time.Now().UTC().Format(time.RFC3339)
	result, err := s.db.Exec(
		"INSERT INTO entries (topic_id, kind, content, session_id, created_at) VALUES (?, ?, ?, ?, ?)",
		topicID, kind, content, sessionID, now,
	)
	if err != nil {
		return nil, err
	}
	id, _ := result.LastInsertId()
	return &Entry{
		ID:        int(id),
		TopicID:   topicID,
		Kind:      kind,
		Content:   content,
		SessionID: sessionID,
		CreatedAt: now,
	}, nil
}

func (s *Store) ListEntries(topicID int) ([]Entry, error) {
	rows, err := s.db.Query(
		"SELECT id, topic_id, kind, content, session_id, created_at FROM entries WHERE topic_id = ? ORDER BY created_at",
		topicID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []Entry
	for rows.Next() {
		var e Entry
		if err := rows.Scan(&e.ID, &e.TopicID, &e.Kind, &e.Content, &e.SessionID, &e.CreatedAt); err != nil {
			return nil, err
		}
		entries = append(entries, e)
	}
	return entries, rows.Err()
}

func (s *Store) Search(query string) ([]SearchResult, error) {
	rows, err := s.db.Query(`
		SELECT e.id, e.topic_id, e.kind, e.content, e.session_id, e.created_at,
		       t.name, p.name
		FROM entries_fts fts
		JOIN entries e ON e.id = fts.rowid
		JOIN topics t ON t.id = e.topic_id
		JOIN phases p ON p.id = t.phase_id
		WHERE entries_fts MATCH ?
		ORDER BY rank
		LIMIT 50
	`, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []SearchResult
	for rows.Next() {
		var r SearchResult
		if err := rows.Scan(
			&r.Entry.ID, &r.Entry.TopicID, &r.Entry.Kind, &r.Entry.Content,
			&r.Entry.SessionID, &r.Entry.CreatedAt,
			&r.TopicName, &r.PhaseName,
		); err != nil {
			return nil, err
		}
		results = append(results, r)
	}
	return results, rows.Err()
}

func (s *Store) GetProgress() (*ProgressStats, error) {
	var stats ProgressStats
	err := s.db.QueryRow("SELECT COUNT(*) FROM topics").Scan(&stats.TotalTopics)
	if err != nil {
		return nil, err
	}
	s.db.QueryRow("SELECT COUNT(*) FROM topics WHERE status = 'done'").Scan(&stats.DoneTopics)
	s.db.QueryRow("SELECT COUNT(*) FROM topics WHERE status = 'in_progress'").Scan(&stats.InProgressTopics)
	s.db.QueryRow("SELECT COUNT(*) FROM entries WHERE kind = 'question'").Scan(&stats.TotalQuestions)
	s.db.QueryRow("SELECT COUNT(*) FROM entries WHERE kind IN ('answer', 'note')").Scan(&stats.TotalAnswers)
	return &stats, nil
}

// --- Seeding ---

func (s *Store) IsSeeded() (bool, error) {
	var count int
	err := s.db.QueryRow("SELECT COUNT(*) FROM phases").Scan(&count)
	return count > 0, err
}

func (s *Store) SeedPhase(name, description string, order int) (int, error) {
	result, err := s.db.Exec(
		"INSERT INTO phases (name, description, sort_order) VALUES (?, ?, ?)",
		name, description, order,
	)
	if err != nil {
		return 0, err
	}
	id, _ := result.LastInsertId()
	return int(id), nil
}

func (s *Store) SeedTopic(phaseID int, name, description string, order int) error {
	_, err := s.db.Exec(
		"INSERT INTO topics (phase_id, name, description, sort_order) VALUES (?, ?, ?, ?)",
		phaseID, name, description, order,
	)
	return err
}
