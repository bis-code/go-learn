package dashboard

import (
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/bis-code/go-learn/internal/db"
)

type Server struct {
	store     *db.Store
	addr      string
	clients   map[chan struct{}]struct{}
	clientsMu sync.Mutex
}

//go:embed all:static
var staticFiles embed.FS

func NewServer(store *db.Store, addr string) *Server {
	return &Server{
		store:   store,
		addr:    addr,
		clients: make(map[chan struct{}]struct{}),
	}
}

func (s *Server) Notify() {
	s.clientsMu.Lock()
	defer s.clientsMu.Unlock()
	for ch := range s.clients {
		select {
		case ch <- struct{}{}:
		default:
		}
	}
}

func (s *Server) Start() error {
	ln, err := net.Listen("tcp", s.addr)
	if err != nil {
		return fmt.Errorf("dashboard listen: %w", err)
	}

	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("/api/phases", s.handlePhases)
	mux.HandleFunc("/api/topics/", s.handleTopic)
	mux.HandleFunc("/api/entries/", s.handleEntries)
	mux.HandleFunc("/api/progress", s.handleProgress)
	mux.HandleFunc("/api/search", s.handleSearch)
	mux.HandleFunc("/api/events", s.handleSSE)

	// Static files
	staticFS, err := fs.Sub(staticFiles, "static")
	if err != nil {
		return fmt.Errorf("static fs: %w", err)
	}
	mux.Handle("/", http.FileServer(http.FS(staticFS)))

	server := &http.Server{Handler: mux}
	log.Printf("Dashboard running at http://%s", ln.Addr())

	go server.Serve(ln)
	return nil
}

func (s *Server) handlePhases(w http.ResponseWriter, r *http.Request) {
	phases, err := s.store.ListPhases()
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	writeJSON(w, phases)
}

func (s *Server) handleTopic(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/api/topics/"):]

	if idStr == "active" {
		topic, err := s.store.GetActiveTopic()
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		if topic == nil {
			writeJSON(w, nil)
			return
		}
		writeJSON(w, topic)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid topic id", 400)
		return
	}

	topic, err := s.store.GetTopic(id)
	if err != nil {
		http.Error(w, err.Error(), 404)
		return
	}

	entries, err := s.store.ListEntries(id)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	writeJSON(w, db.TopicWithEntries{Topic: *topic, Entries: entries})
}

func (s *Server) handleEntries(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/api/entries/"):]
	topicID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid topic id", 400)
		return
	}

	entries, err := s.store.ListEntries(topicID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	if entries == nil {
		entries = []db.Entry{}
	}
	writeJSON(w, entries)
}

func (s *Server) handleProgress(w http.ResponseWriter, _ *http.Request) {
	stats, err := s.store.GetProgress()
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	writeJSON(w, stats)
}

func (s *Server) handleSearch(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		writeJSON(w, []db.SearchResult{})
		return
	}

	results, err := s.store.Search(query)
	if err != nil {
		writeJSON(w, []db.SearchResult{})
		return
	}
	if results == nil {
		results = []db.SearchResult{}
	}
	writeJSON(w, results)
}

func (s *Server) handleSSE(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", 500)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	ch := make(chan struct{}, 1)
	s.clientsMu.Lock()
	s.clients[ch] = struct{}{}
	s.clientsMu.Unlock()

	defer func() {
		s.clientsMu.Lock()
		delete(s.clients, ch)
		s.clientsMu.Unlock()
	}()

	// Send initial ping
	fmt.Fprintf(w, "data: {\"type\":\"connected\"}\n\n")
	flusher.Flush()

	for {
		select {
		case <-ch:
			fmt.Fprintf(w, "data: {\"type\":\"update\",\"ts\":\"%s\"}\n\n", time.Now().UTC().Format(time.RFC3339))
			flusher.Flush()
		case <-r.Context().Done():
			return
		}
	}
}

func writeJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}
