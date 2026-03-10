package curriculum

import "github.com/bis-code/go-learn/internal/db"

type TopicDef struct {
	Name        string
	Description string
}

type PhaseDef struct {
	Name        string
	Description string
	Topics      []TopicDef
}

var Curriculum = []PhaseDef{
	{
		Name:        "Phase 1: Go Fundamentals",
		Description: "Core language features — focused on gaps from the roadmap.sh/golang roadmap",
		Topics: []TopicDef{
			{"Error Handling Deep Dive", "error interface, errors.New, fmt.Errorf, wrapping/unwrapping, sentinel errors, errors.Is/As, custom error types, panic/recover"},
			{"Generics", "generic functions, generic types/interfaces, type constraints, type inference, when to use vs not"},
			{"Goroutines & Channels", "goroutine basics, buffered vs unbuffered channels, select statement, channel direction"},
			{"Sync Primitives", "sync.Mutex, sync.RWMutex, sync.WaitGroup, sync.Once, sync.Pool, sync.Map, atomic operations"},
			{"Context Package", "context.Background, WithCancel, WithTimeout, WithDeadline, WithValue, propagation patterns"},
			{"Concurrency Patterns", "fan-in, fan-out, pipeline, worker pools, rate limiting, semaphore, errgroup"},
			{"Standard Library Deep Dive", "slog (structured logging), flag, go:embed, regexp, bufio, io patterns"},
			{"Testing Mastery", "table-driven tests, subtests, test helpers, benchmarks, fuzzing, testdata, build tags"},
			{"Phase 1 Project", "Build a concurrent CLI tool that applies goroutines, channels, context, and testing patterns"},
		},
	},
	{
		Name:        "Phase 2: Design Patterns & SOLID",
		Description: "SOLID principles and GoF patterns adapted for Go's composition model",
		Topics: []TopicDef{
			{"Single Responsibility Principle", "one reason to change per type, package-level SRP, separating concerns in Go"},
			{"Open/Closed Principle", "extending behavior through interfaces and composition, not modification"},
			{"Liskov Substitution Principle", "interface contracts, behavioral compatibility, Go's implicit interfaces"},
			{"Interface Segregation Principle", "small interfaces, io.Reader/io.Writer as examples, consumer-defined interfaces"},
			{"Dependency Inversion Principle", "depend on abstractions, constructor injection, wire-up in main"},
			{"Functional Options Pattern", "variadic options, WithXxx convention, default values, builder alternative"},
			{"Strategy Pattern", "swappable behavior via interfaces, runtime algorithm selection"},
			{"Factory & Builder Patterns", "constructor functions, builder chains, functional builders"},
			{"Decorator & Middleware", "wrapping interfaces, HTTP middleware chains, composable behavior"},
			{"Observer Pattern", "event systems, pub/sub, callback registration, channel-based observers"},
			{"Repository Pattern", "data access abstraction, unit of work, transaction boundaries"},
			{"Dependency Injection", "manual DI in Go, wire-up patterns, testing with DI, avoiding DI frameworks"},
			{"Phase 2 Project", "Build a plugin-based system that demonstrates SOLID and patterns working together"},
		},
	},
	{
		Name:        "Phase 3: Networked Go",
		Description: "Building real services — HTTP, gRPC, databases, real-time communication",
		Topics: []TopicDef{
			{"net/http From Scratch", "http.Handler, http.HandlerFunc, ServeMux, middleware, request lifecycle"},
			{"Routing with Chi", "chi router, route groups, middleware stacking, URL parameters, RESTful design"},
			{"REST API Design", "resource modeling, status codes, pagination, filtering, error responses, versioning"},
			{"gRPC & Protobuf", "proto definitions, unary/streaming RPCs, interceptors, error handling, reflection"},
			{"Database with pgx/sqlx", "connection pooling, prepared statements, transactions, scanning, migrations"},
			{"WebSockets", "gorilla/websocket or nhooyr/websocket, upgrade handshake, broadcast patterns, chat example"},
			{"Phase 3 Project", "Build a full service with REST + gRPC + database + real-time features"},
		},
	},
	{
		Name:        "Phase 4: Production Go",
		Description: "Performance, reliability, and operational patterns for production systems",
		Topics: []TopicDef{
			{"Profiling & Benchmarking", "pprof (CPU, memory, goroutine), benchmark tests, trace tool, optimization workflow"},
			{"Rate Limiting", "token bucket, sliding window, per-client limits, golang.org/x/time/rate"},
			{"Circuit Breakers", "failure detection, half-open state, gobreaker, resilience patterns"},
			{"Caching Patterns", "in-memory caches, TTL, LRU, cache-aside, write-through, invalidation strategies"},
			{"OpenTelemetry", "traces, metrics, spans, context propagation, exporters, instrumentation"},
			{"Graceful Shutdown", "signal handling, connection draining, shutdown ordering, health checks"},
			{"Phase 4 Project", "Build a production-grade system combining performance, resilience, and observability"},
		},
	},
}

func Seed(store *db.Store) error {
	seeded, err := store.IsSeeded()
	if err != nil {
		return err
	}
	if seeded {
		return nil
	}

	for i, phase := range Curriculum {
		phaseID, err := store.SeedPhase(phase.Name, phase.Description, i+1)
		if err != nil {
			return err
		}
		for j, topic := range phase.Topics {
			if err := store.SeedTopic(phaseID, topic.Name, topic.Description, j+1); err != nil {
				return err
			}
		}
	}
	return nil
}
