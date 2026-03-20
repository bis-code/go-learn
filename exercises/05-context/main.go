package main

import (
	"context"
	"fmt"
	"math/rand"
	"sync"
	"time"
)

// Exercise 05: Context Package
//
// Work through each exercise in order.
// Uncomment the test calls in main() as you implement each function.
//
// Run: go run ./exercises/05-context
//
// Concepts covered:
//   1. context.WithCancel — manual cancellation
//   2. context.WithTimeout — automatic deadline
//   3. context.WithValue — passing request-scoped data
//   4. Propagation — passing context through layers
//   5. Putting it all together — HTTP-like request pipeline

// ============================================================
// EXERCISE 1: context.WithCancel — Stop a worker
// ============================================================
// Write a function worker(ctx context.Context, id int) that:
//   - Loops, printing "Worker <id> working..." every 200ms
//   - Stops when ctx is cancelled
//   - Prints "Worker <id> stopped" on exit
//
// In main, start 3 workers, wait 1 second, then cancel them all.
//
// Hint: use select with ctx.Done() and time.After/time.Tick
//
// TODO: Implement worker(ctx context.Context, id int, wg *sync.WaitGroup)
func worker(ctx context.Context, id int, wg *sync.WaitGroup) {
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()
	defer wg.Done()

	for {
		select {
		case <-ctx.Done():
			{
				// when cancel is called, the done method is called as well as part of the cancel lifecycle
				fmt.Printf("Worker %d stopped\n", id)
				return
			}
		case <-time.After(200 * time.Millisecond):
			// this case runs every 200 seconds through the for loop
			fmt.Printf("Worker %d still running\n", id)
		}
	}
}

// ============================================================
// EXERCISE 2: context.WithTimeout — Simulated API call
// ============================================================
// Write a function fetchData(ctx context.Context, query string) (string, error) that:
//   - Simulates a slow API call (random 100-500ms sleep)
//   - Returns the result if it finishes in time
//   - Returns ctx.Err() if the context times out
//
// Call it with a 300ms timeout. Sometimes it succeeds, sometimes it times out.
//
// Hint: use select with ctx.Done() and a channel for the result
//
// TODO: Implement fetchData(ctx context.Context, query string) (string, error)
func fetchData(ctx context.Context, query string) (string, error) {
	ch := make(chan string, 1)

	// simulates slow of API call
	go func ()  {
		time.Sleep(time.Duration(100 + rand.Intn(400)) * time.Millisecond)
		ch <- fmt.Sprintf("result for: %s", query)
	}()

	select {
	case result := <-ch:
		return result, nil 
	case <- ctx.Done():
		return "", ctx.Err()
	}
}

// ============================================================
// EXERCISE 3: context.WithValue — Request metadata
// ============================================================
// Write middleware-style functions that:
//   1. withRequestID(ctx) — adds a random request ID to context
//   2. withUserID(ctx, userID) — adds a user ID to context
//   3. getRequestID(ctx) — extracts request ID (returns "" if missing)
//   4. getUserID(ctx) — extracts user ID (returns 0 if missing)
//
// Use custom key types to avoid collisions (not raw strings).
//
// TODO: Define key types
type requestID struct{}
type userID struct{}
// TODO: Implement with/get functions
func withRequestID(ctx context.Context) context.Context {
	reqID := fmt.Sprintf("req-%d", rand.Intn(100000))
	return context.WithValue(ctx, requestID{}, reqID)
}

func withUserID(ctx context.Context, usrID int) context.Context {
	return context.WithValue(ctx, userID{}, usrID)
}

func getRequestID(ctx context.Context) string {
	if reqID, ok := ctx.Value(requestID{}).(string); ok {
		return reqID
	}
	return ""
}

func getUserID(ctx context.Context) int {
	if usrID, ok := ctx.Value(userID{}).(int); ok {
		return usrID
	}
	return 0
}

// ============================================================
// EXERCISE 4: Propagation — Service layers
// ============================================================
// Build a 3-layer service that passes context through:
//   Handler → Service → Repository
//
// Each layer should:
//   - Check if context is cancelled before doing work
//   - Log the request ID from context (using Exercise 3 helpers)
//   - Simulate work with a small sleep
//
// TODO: Implement handler(ctx context.Context, userID int) (string, error)
func handler(ctx context.Context, userID int) (string, error) {
	if ctx.Err() != nil {
		return "", ctx.Err()
	}

	fmt.Printf("handler request with ID %s and userID: %d\n", getRequestID(ctx), userID)

	time.Sleep(300 * time.Millisecond)
	return service(ctx, userID)
}
// TODO: Implement service(ctx context.Context, userID int) (string, error)
func service(ctx context.Context, userID int) (string, error) {
	if ctx.Err() != nil {
		return "", ctx.Err()
	}

	fmt.Printf("service request with ID %s and userID: %d\n", getRequestID(ctx), userID)

	time.Sleep(300 * time.Millisecond)
	return repository(ctx, userID)
}

// TODO: Implement repository(ctx context.Context, userID int) (string, error)
func repository(ctx context.Context, userID int) (string, error) {
	if ctx.Err() != nil {
		return "", ctx.Err()
	}

	fmt.Printf("repository request with ID %s and userID %d\n", getRequestID(ctx), userID)

	time.Sleep(300 * time.Millisecond)
	return "repository returned", nil
}

// ============================================================
// EXERCISE 5: Pipeline with timeout and cancellation
// ============================================================
// Build a search function that:
//   - Queries 3 "backends" concurrently (simulated with random delays)
//   - Returns the FIRST result that comes back
//   - Cancels the remaining backends (they should stop working)
//   - Has an overall timeout of 400ms
//
// This combines WithCancel + WithTimeout + goroutines + select.
//
// TODO: Implement searchBackend(ctx context.Context, name string, results chan<- string)
func searchBackend(ctx context.Context, name string, results chan <- string) {
	delay := time.Duration(100 + rand.Intn(400)) * time.Millisecond

	select {
	case <-time.After(delay):
		results <- fmt.Sprintf("%s: found result", name)
	case <-ctx.Done():
		return
	}
}

// TODO: Implement search(ctx context.Context, query string) (string, error)
func search(ctx context.Context, query string) (string, error) {
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	results := make(chan string, 3)

	go searchBackend(ctx, "google", results)
	go searchBackend(ctx, "bing", results)
	go searchBackend(ctx, "duckduckgo", results)

	select {
	case result := <- results:
		return result, nil
	case <- ctx.Done():
		return "", ctx.Err()
	}
}

// Keep compiler happy
var _ = rand.Intn
var _ = time.Sleep
var _ = fmt.Println
var _ sync.WaitGroup
var _ context.Context

func main() {
	fmt.Println("=== Exercise 05: Context ===")
	fmt.Println()

	// --- Uncomment each section as you implement ---

	// EXERCISE 1: WithCancel
	fmt.Println("-- WithCancel --")
	ctx, cancel := context.WithCancel(context.Background())
	var wg sync.WaitGroup
	for i := 1; i <= 3; i++ {
		wg.Add(1)
		go worker(ctx, i, &wg)
	}
	time.Sleep(1 * time.Second)
	fmt.Println("Cancelling all workers...")
	cancel()
	wg.Wait()
	fmt.Println("All workers stopped")
	fmt.Println()

	// EXERCISE 2: WithTimeout
	fmt.Println("-- WithTimeout --")
	for i := 0; i < 5; i++ {
		ctx, cancel := context.WithTimeout(context.Background(), 300*time.Millisecond)
		result, err := fetchData(ctx, "SELECT * FROM users")
		if err != nil {
			fmt.Printf("  Attempt %d: TIMEOUT — %v\n", i+1, err)
		} else {
			fmt.Printf("  Attempt %d: OK — %s\n", i+1, result)
		}
		cancel() // always call cancel, even if timeout fired
	}
	fmt.Println()

	// EXERCISE 3: WithValue
	fmt.Println("-- WithValue --")
	ctx = context.Background()
	ctx = withRequestID(ctx)
	ctx = withUserID(ctx, 42)
	fmt.Printf("  Request ID: %s\n", getRequestID(ctx))
	fmt.Printf("  User ID: %d\n", getUserID(ctx))
	// Test missing values
	emptyCtx := context.Background()
	fmt.Printf("  Missing Request ID: %q\n", getRequestID(emptyCtx))
	fmt.Printf("  Missing User ID: %d\n", getUserID(emptyCtx))
	fmt.Println()

	// EXERCISE 4: Propagation
	fmt.Println("-- Propagation --")
	ctx, cancel = context.WithTimeout(context.Background(), 500*time.Millisecond)
	ctx = withRequestID(ctx)
	result, err := handler(ctx, 42)
	if err != nil {
		fmt.Printf("  Error: %v\n", err)
	} else {
		fmt.Printf("  Result: %s\n", result)
	}

	cancel()
	fmt.Println()

	// EXERCISE 5: First result wins
	fmt.Println("-- Search (first result wins) --")
	for i := 0; i < 3; i++ {
		ctx, cancel = context.WithTimeout(context.Background(), 400*time.Millisecond)
		result, err := search(ctx, "golang context")
		if err != nil {
			fmt.Printf("  Search %d: TIMEOUT — %v\n", i+1, err)
		} else {
			fmt.Printf("  Search %d: %s\n", i+1, result)
		}
		cancel()
	}
}
