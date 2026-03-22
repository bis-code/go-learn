# Phase 1 Project: `goscan` — Concurrent Site Health Checker

A CLI tool that takes a list of URLs (from a file or stdin), checks their health concurrently, and reports results.

## What it exercises

| Phase 1 Topic | How it's used |
|---|---|
| Error handling | Custom errors, wrapping, sentinel errors for timeouts/DNS failures |
| Generics | Generic `Result[T]` type for success/error results |
| Goroutines & Channels | Worker pool processing URLs concurrently |
| Sync primitives | `sync.Map` for result caching, `atomic` for stats counters |
| Context | Timeout per request, overall deadline, graceful cancellation (Ctrl+C) |
| Concurrency patterns | Fan-out workers, fan-in results, rate limiting |
| Standard library | `slog` for structured logging, `flag` for CLI args, `bufio` for reading input, `io` for composing output |
| Testing | Table-driven tests, benchmarks, fuzzing the URL parser |

## Features

1. **Input:** read URLs from file (`-file urls.txt`) or stdin (pipe-friendly)
2. **Concurrency:** `-workers=10` flag, worker pool pattern
3. **Rate limiting:** `-rate=5` max requests per second
4. **Timeouts:** `-timeout=5s` per request, `-deadline=30s` overall
5. **Output:** structured JSON or human-readable table (`-format=json|table`)
6. **Graceful shutdown:** Ctrl+C cancels in-flight requests cleanly
7. **Caching:** don't re-check duplicate URLs
8. **Logging:** `slog` with `-verbose` flag for debug level

## Example usage

```bash
# From file
goscan -file urls.txt -workers=10 -timeout=3s -format=table

# From stdin (pipe)
cat urls.txt | goscan -workers=5 -rate=10

# Single URL
echo "https://go.dev" | goscan
```

## Example output

```
URL                          STATUS  TIME     ERROR
https://go.dev               200     145ms    -
https://example.com          200     89ms     -
https://doesnotexist.xyz     -       -        DNS lookup failed
https://slow-site.com        -       -        timeout after 3s

Summary: 2 OK, 1 failed, 1 timeout (total: 437ms)
```

## Suggested structure

```
exercises/09-phase1-project/
├── main.go           # CLI entry, flag parsing, signal handling
├── scanner.go        # Worker pool, fan-out/fan-in
├── checker.go        # HTTP health check logic
├── result.go         # Result types, error types
├── output.go         # Table and JSON formatters
├── scanner_test.go   # Tests
└── urls.txt          # Sample URLs for testing
```
