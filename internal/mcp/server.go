package mcp

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/bis-code/go-learn/internal/db"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

type Server struct {
	store     *db.Store
	mcpServer *server.MCPServer
	sseNotify func() // callback to notify dashboard of changes
}

func NewServer(store *db.Store, sseNotify func()) *Server {
	s := &Server{
		store:     store,
		sseNotify: sseNotify,
	}

	s.mcpServer = server.NewMCPServer(
		"go-learn",
		"1.0.0",
		server.WithToolCapabilities(true),
	)

	s.registerTools()
	return s
}

func (s *Server) MCPServer() *server.MCPServer {
	return s.mcpServer
}

func (s *Server) registerTools() {
	s.mcpServer.AddTool(
		mcp.NewTool("learn_set_topic",
			mcp.WithDescription("Set the current active topic by name or ID. Marks it as in_progress."),
			mcp.WithString("topic", mcp.Description("Topic name or numeric ID"), mcp.Required()),
		),
		s.handleSetTopic,
	)

	s.mcpServer.AddTool(
		mcp.NewTool("learn_log_question",
			mcp.WithDescription("Log a question you asked during a learning session. Supports markdown with code blocks."),
			mcp.WithString("content", mcp.Description("The question content (markdown)"), mcp.Required()),
			mcp.WithString("session_id", mcp.Description("Session identifier (optional)")),
		),
		s.handleLogQuestion,
	)

	s.mcpServer.AddTool(
		mcp.NewTool("learn_log_answer",
			mcp.WithDescription("Log an answer or note for the current topic. Supports markdown with code blocks."),
			mcp.WithString("content", mcp.Description("The answer/note content (markdown)"), mcp.Required()),
			mcp.WithString("kind", mcp.Description("Entry kind: 'answer' or 'note' (default: answer)")),
			mcp.WithString("session_id", mcp.Description("Session identifier (optional)")),
		),
		s.handleLogAnswer,
	)

	s.mcpServer.AddTool(
		mcp.NewTool("learn_mark_done",
			mcp.WithDescription("Mark the current or specified topic as done."),
			mcp.WithString("topic", mcp.Description("Topic name or ID (optional, defaults to active topic)")),
		),
		s.handleMarkDone,
	)

	s.mcpServer.AddTool(
		mcp.NewTool("learn_get_progress",
			mcp.WithDescription("Get overall learning progress — phases, topics, completion stats."),
		),
		s.handleGetProgress,
	)

	s.mcpServer.AddTool(
		mcp.NewTool("learn_get_curriculum",
			mcp.WithDescription("Get the full curriculum with all phases, topics, and their status."),
		),
		s.handleGetCurriculum,
	)

	s.mcpServer.AddTool(
		mcp.NewTool("learn_search",
			mcp.WithDescription("Full-text search across all questions, answers, and notes."),
			mcp.WithString("query", mcp.Description("Search query"), mcp.Required()),
		),
		s.handleSearch,
	)
}

func (s *Server) resolveTopic(topicStr string) (*db.Topic, error) {
	if id, err := strconv.Atoi(topicStr); err == nil {
		return s.store.GetTopic(id)
	}
	return s.store.FindTopicByName(topicStr)
}

func (s *Server) notify() {
	if s.sseNotify != nil {
		s.sseNotify()
	}
}

func (s *Server) handleSetTopic(_ context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	topicStr := request.GetString("topic", "")
	if topicStr == "" {
		return mcp.NewToolResultError("topic is required"), nil
	}

	topic, err := s.resolveTopic(topicStr)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("topic not found: %s", topicStr)), nil
	}

	if err := s.store.SetTopicStatus(topic.ID, "in_progress"); err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to set topic: %v", err)), nil
	}

	s.notify()
	return mcp.NewToolResultText(fmt.Sprintf("Active topic set to: %s (ID: %d)", topic.Name, topic.ID)), nil
}

func (s *Server) handleLogQuestion(_ context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	content := request.GetString("content", "")
	if content == "" {
		return mcp.NewToolResultError("content is required"), nil
	}
	sessionID := request.GetString("session_id", "")

	active, err := s.store.GetActiveTopic()
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("error getting active topic: %v", err)), nil
	}
	if active == nil {
		return mcp.NewToolResultError("no active topic. Use learn_set_topic first."), nil
	}

	entry, err := s.store.CreateEntry(active.ID, "question", content, sessionID)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to log question: %v", err)), nil
	}

	s.notify()
	return mcp.NewToolResultText(fmt.Sprintf("Question logged (ID: %d) under topic: %s", entry.ID, active.Name)), nil
}

func (s *Server) handleLogAnswer(_ context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	content := request.GetString("content", "")
	if content == "" {
		return mcp.NewToolResultError("content is required"), nil
	}
	kind := request.GetString("kind", "answer")
	if kind != "answer" && kind != "note" {
		return mcp.NewToolResultError("kind must be 'answer' or 'note'"), nil
	}
	sessionID := request.GetString("session_id", "")

	active, err := s.store.GetActiveTopic()
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("error getting active topic: %v", err)), nil
	}
	if active == nil {
		return mcp.NewToolResultError("no active topic. Use learn_set_topic first."), nil
	}

	entry, err := s.store.CreateEntry(active.ID, kind, content, sessionID)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to log %s: %v", kind, err)), nil
	}

	s.notify()
	return mcp.NewToolResultText(fmt.Sprintf("%s logged (ID: %d) under topic: %s", kind, entry.ID, active.Name)), nil
}

func (s *Server) handleMarkDone(_ context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	topicStr := request.GetString("topic", "")

	var topic *db.Topic
	var err error

	if topicStr != "" {
		topic, err = s.resolveTopic(topicStr)
	} else {
		topic, err = s.store.GetActiveTopic()
	}
	if err != nil || topic == nil {
		return mcp.NewToolResultError("no topic found to mark as done"), nil
	}

	if err := s.store.SetTopicStatus(topic.ID, "done"); err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to mark done: %v", err)), nil
	}

	s.notify()
	return mcp.NewToolResultText(fmt.Sprintf("Topic marked as done: %s", topic.Name)), nil
}

func (s *Server) handleGetProgress(_ context.Context, _ mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	stats, err := s.store.GetProgress()
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to get progress: %v", err)), nil
	}

	active, _ := s.store.GetActiveTopic()
	activeName := "(none)"
	if active != nil {
		activeName = active.Name
	}

	data, _ := json.MarshalIndent(map[string]interface{}{
		"activeTopic": activeName,
		"stats":       stats,
	}, "", "  ")

	return mcp.NewToolResultText(string(data)), nil
}

func (s *Server) handleGetCurriculum(_ context.Context, _ mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	phases, err := s.store.ListPhases()
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to get curriculum: %v", err)), nil
	}

	data, _ := json.MarshalIndent(phases, "", "  ")
	return mcp.NewToolResultText(string(data)), nil
}

func (s *Server) handleSearch(_ context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	query := request.GetString("query", "")
	if query == "" {
		return mcp.NewToolResultError("query is required"), nil
	}

	results, err := s.store.Search(query)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("search failed: %v", err)), nil
	}

	if len(results) == 0 {
		return mcp.NewToolResultText("No results found."), nil
	}

	data, _ := json.MarshalIndent(results, "", "  ")
	return mcp.NewToolResultText(string(data)), nil
}
