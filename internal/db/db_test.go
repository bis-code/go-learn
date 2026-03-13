package db

import (
	"path/filepath"
	"testing"
)

func newTestStore(t *testing.T) *Store {
	t.Helper()
	dir := t.TempDir()
	dbPath := filepath.Join(dir, "test.sqlite")
	store, err := NewStore(dbPath)
	if err != nil {
		t.Fatalf("NewStore: %v", err)
	}
	t.Cleanup(func() { store.Close() })
	return store
}

func seedTestTopic(t *testing.T, store *Store) int {
	t.Helper()
	phaseID, err := store.SeedPhase("Phase 1", "desc", 1)
	if err != nil {
		t.Fatalf("SeedPhase: %v", err)
	}
	if err := store.SeedTopic(phaseID, "Test Topic", "desc", 1); err != nil {
		t.Fatalf("SeedTopic: %v", err)
	}
	topic, err := store.FindTopicByName("Test Topic")
	if err != nil {
		t.Fatalf("FindTopicByName: %v", err)
	}
	return topic.ID
}

func TestCreateEntry_WithoutQuestionID(t *testing.T) {
	store := newTestStore(t)
	topicID := seedTestTopic(t, store)

	entry, err := store.CreateEntry(topicID, "question", "What is Go?", "", nil)
	if err != nil {
		t.Fatalf("CreateEntry: %v", err)
	}

	if entry.QuestionID != nil {
		t.Errorf("expected nil QuestionID, got %v", *entry.QuestionID)
	}
	if entry.Kind != "question" {
		t.Errorf("expected kind=question, got %s", entry.Kind)
	}
}

func TestCreateEntry_WithQuestionID(t *testing.T) {
	store := newTestStore(t)
	topicID := seedTestTopic(t, store)

	// Create a question first
	question, err := store.CreateEntry(topicID, "question", "What is Go?", "", nil)
	if err != nil {
		t.Fatalf("CreateEntry question: %v", err)
	}

	// Create an answer linked to the question
	qid := question.ID
	answer, err := store.CreateEntry(topicID, "answer", "A programming language.", "", &qid)
	if err != nil {
		t.Fatalf("CreateEntry answer: %v", err)
	}

	if answer.QuestionID == nil {
		t.Fatal("expected non-nil QuestionID")
	}
	if *answer.QuestionID != question.ID {
		t.Errorf("expected QuestionID=%d, got %d", question.ID, *answer.QuestionID)
	}
}

func TestListEntries_ReturnsQuestionID(t *testing.T) {
	store := newTestStore(t)
	topicID := seedTestTopic(t, store)

	question, _ := store.CreateEntry(topicID, "question", "Q1", "", nil)
	qid := question.ID
	store.CreateEntry(topicID, "answer", "A1", "", &qid)
	store.CreateEntry(topicID, "note", "standalone note", "", nil)

	entries, err := store.ListEntries(topicID)
	if err != nil {
		t.Fatalf("ListEntries: %v", err)
	}

	if len(entries) != 3 {
		t.Fatalf("expected 3 entries, got %d", len(entries))
	}

	// Question has no questionID
	if entries[0].QuestionID != nil {
		t.Error("question should have nil QuestionID")
	}

	// Answer is linked to question
	if entries[1].QuestionID == nil || *entries[1].QuestionID != question.ID {
		t.Error("answer should be linked to question")
	}

	// Standalone note has no questionID
	if entries[2].QuestionID != nil {
		t.Error("standalone note should have nil QuestionID")
	}
}

func TestMigration_AddsQuestionIDColumn(t *testing.T) {
	// Test that opening a DB twice (simulating migration on existing DB) works
	dir := t.TempDir()
	dbPath := filepath.Join(dir, "test.sqlite")

	store1, err := NewStore(dbPath)
	if err != nil {
		t.Fatalf("first NewStore: %v", err)
	}
	store1.Close()

	// Open again — migration should be idempotent
	store2, err := NewStore(dbPath)
	if err != nil {
		t.Fatalf("second NewStore: %v", err)
	}
	defer store2.Close()

	// Verify we can create entries with questionID
	phaseID, _ := store2.SeedPhase("P1", "", 1)
	store2.SeedTopic(phaseID, "T1", "", 1)
	topic, _ := store2.FindTopicByName("T1")

	q, err := store2.CreateEntry(topic.ID, "question", "test", "", nil)
	if err != nil {
		t.Fatalf("CreateEntry after migration: %v", err)
	}

	qid := q.ID
	_, err = store2.CreateEntry(topic.ID, "answer", "test answer", "", &qid)
	if err != nil {
		t.Fatalf("CreateEntry with questionID after migration: %v", err)
	}
}

func TestSearch_ReturnsQuestionID(t *testing.T) {
	store := newTestStore(t)
	topicID := seedTestTopic(t, store)

	question, _ := store.CreateEntry(topicID, "question", "unique searchable question", "", nil)
	qid := question.ID
	store.CreateEntry(topicID, "answer", "unique searchable answer", "", &qid)

	results, err := store.Search("searchable")
	if err != nil {
		t.Fatalf("Search: %v", err)
	}

	if len(results) < 2 {
		t.Fatalf("expected at least 2 results, got %d", len(results))
	}

	// Find the answer result and check its questionID
	for _, r := range results {
		if r.Entry.Kind == "answer" {
			if r.Entry.QuestionID == nil || *r.Entry.QuestionID != question.ID {
				t.Error("answer search result should have questionID set")
			}
		}
		if r.Entry.Kind == "question" {
			if r.Entry.QuestionID != nil {
				t.Error("question search result should have nil questionID")
			}
		}
	}
}
