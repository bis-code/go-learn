package main

import (
	"log"
	"os"
	"path/filepath"

	"github.com/bis-code/go-learn/internal/curriculum"
	"github.com/bis-code/go-learn/internal/dashboard"
	"github.com/bis-code/go-learn/internal/db"
	"github.com/bis-code/go-learn/internal/mcp"
	"github.com/mark3labs/mcp-go/server"
)

const dashboardAddr = "127.0.0.1:19281"

func main() {
	// Resolve project root: the directory containing the binary,
	// or GOLEARN_PROJECT_DIR env var, or current working directory.
	projectDir := os.Getenv("GOLEARN_PROJECT_DIR")
	if projectDir == "" {
		exe, err := os.Executable()
		if err == nil {
			// Binary is in <project>/bin/, so go up one level
			projectDir = filepath.Dir(filepath.Dir(exe))
		}
	}

	store, err := db.NewStore("", projectDir)
	if err != nil {
		log.Fatalf("Failed to open store: %v", err)
	}
	defer store.Close()

	if err := curriculum.Seed(store); err != nil {
		log.Fatalf("Failed to seed curriculum: %v", err)
	}

	dash := dashboard.NewServer(store, dashboardAddr)
	if err := dash.Start(); err != nil {
		log.Printf("Dashboard unavailable: %v", err)
	}

	mcpServer := mcp.NewServer(store, dash.Notify)

	if err := server.ServeStdio(mcpServer.MCPServer()); err != nil {
		log.Fatalf("MCP server error: %v", err)
	}
}
