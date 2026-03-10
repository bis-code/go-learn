package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"net/url"
)

// Exercise 01: Error Handling — URL Shortener
//
// Build a mini URL shortener HTTP server that demonstrates:
//   - Sentinel errors (var ErrNotFound = ...)
//   - Custom error types (ValidationError struct with Error() method)
//   - Wrapping errors with context (fmt.Errorf("...: %w", err))
//   - Unwrap() method on custom types
//   - Mapping errors to HTTP status codes using errors.Is / errors.As
//
// Layers to implement:
//   1. Store  — in-memory map, returns StoreError wrapping ErrNotFound
//   2. Service — validates input, wraps store errors with context
//   3. Handler — uses errors.Is/errors.As to pick the right HTTP status
//
// Endpoints:
//   GET /shorten?url=https://go.dev  → returns JSON with slug
//   GET /r?slug=abc123               → redirects to original URL
//
// Test with:
//   curl 'http://localhost:8080/shorten?url=https://go.dev'   → 200
//   curl 'http://localhost:8080/shorten?url='                  → 400
//   curl 'http://localhost:8080/r?slug=nope'                   → 404
//
// Run: go run ./exercises/01-error-handling

// -- Error types --
var ErrNotFound = errors.New("url not found")

type ValidationError struct {
	Field string
	Message string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("validation: %s - %s", e.Field, e.Message)
}

type Operation string
const (
	SAVE Operation = "save"
	LOOKUP Operation ="lookup"
)

type StoreError struct {
	Op Operation
	Err error
}

func (e *StoreError) Error() string {
	return fmt.Sprintf("store.%s: %v", e.Op, e.Err)
}

// -- Store layer --
type Store struct {
	urls map[string]string
}

func NewStore() *Store {
	return &Store{urls: make(map[string]string)}
}

func (s *Store) Save(slug, rawURL string) error {
	if _, exists := s.urls[slug]; exists {
		return &StoreError{Op: SAVE, Err: fmt.Errorf("slug %q already exists", slug)}
	}
	s.urls[slug] = rawURL
	return nil
}

func (s *Store) Lookup(slug string) (string, error) {
	url, ok := s.urls[slug]
	if !ok {
		return "", &StoreError{Op: LOOKUP, Err: ErrNotFound}
	}
	return url, nil
}

// -- Service layer --
type Service struct {
	store *Store
}

func generateSlug() string {
	const letters = "abcdeghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, 6)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}
	return string(b)
}

func NewService(store *Store) *Service {
	return &Service{store: store}
}

func (svc *Service) Shorten(rawURL string) (string, error) {
	if rawURL == "" {
		return "", &ValidationError{Field: "url", Message: "cannot be empty"}
	}
	if _, err := url.ParseRequestURI(rawURL); err != nil {
		return "", fmt.Errorf("shorten: %w", err)
	}

	slug := generateSlug()
	if err := svc.store.Save(slug, rawURL); err != nil {
		return "", fmt.Errorf("shorten: %w", err)
	}
	return slug, nil
}

func (svc *Service) Resolve(slug string) (string, error) {
	url, err := svc.store.Lookup(slug)
	if err != nil {
		return "", fmt.Errorf("resolve: %w", err)
	}
	return url, nil
}

// -- HTTP handler layer --
func writeError(w http.ResponseWriter, err error) {
	var valErr *ValidationError
	if errors.As(err, &valErr) {
		http.Error(w, valErr.Error(), http.StatusBadRequest)
		return
	}
	if errors.Is(err, ErrNotFound) {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	log.Printf("ERROR: %v", err)
	http.Error(w, "internal error", http.StatusInternalServerError)
}

func (svc *Service) HandleShorten(w http.ResponseWriter, r *http.Request) {
	rawURL := r.URL.Query().Get("url")

	slug, err := svc.Shorten(rawURL)
	if err != nil {
		writeError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"slug": slug,
		"short": "http://localhost:8080/r?slug=" + slug,
	})
}

func (svc *Service) HandleResolve(w http.ResponseWriter, r *http.Request) {
	slug := r.URL.Query().Get("slug")

	url, err := svc.Resolve(slug)
	if err != nil {
		writeError(w, err)
		return
	}

	http.Redirect(w, r, url, http.StatusFound)
}

func main() {
	store := NewStore()
	svc := NewService(store)

	http.HandleFunc("/shorten", svc.HandleShorten)
	http.HandleFunc("/r", svc.HandleResolve)

	fmt.Println("Starting up...")
	fmt.Println("URL Shortener")
	fmt.Println("Listening on :8080")
	log.Fatalln(http.ListenAndServe(":8080", nil))
}
