package main

import (
	"context"
	"fmt"
	"math/rand"
	"sync"
	"time"

	"golang.org/x/sync/errgroup"
)

// Exercise 06: Concurrency Patterns
//
// Run: go run ./exercises/06-concurrency-patterns
//
// Concepts covered:
//   1. Pipeline — chain of stages connected by channels
//   2. Fan-out — multiple goroutines reading from one channel
//   3. Fan-in (merge) — multiple channels into one
//   4. Worker pool — N workers pulling from a job queue
//   5. errgroup — parallel work with error handling
//   6. Rate limiting — control throughput

// ============================================================
// EXERCISE 1: Pipeline
// ============================================================
// Build a 3-stage pipeline:
//
//	generate → square → print
//
// generate(nums ...int) <-chan int
//   - Sends nums into a channel, then closes it
//
// square(in <-chan int) <-chan int
//   - Reads from in, squares each value, sends to out
//   - Closes out when in is drained
//
// Both should use context for cancellation.
//
// TODO: Implement generate
func generate(ctx context.Context, nums ...int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for _, num := range nums {
			select {
			case out <- num:
			case <-ctx.Done():
				return // consumer stopped reading, and it should not block the producer
			}
		}
	}()

	return out
}

// TODO: Implement square
func square(ctx context.Context, in <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for num := range in {
			select {
			case out <- num * num:
			case <-ctx.Done():
				return // consumer of our output stopped reading, so we stop too
			}
		}
	}()
	return out
}

// ============================================================
// EXERCISE 2: Fan-out
// ============================================================
// Take the generate function from Exercise 1.
// Start 3 square workers reading from the SAME input channel.
// Each worker squares numbers concurrently.
//
// Note: multiple goroutines can safely read from one channel.
// Go ensures each value is received by exactly one goroutine.
//
// TODO: Start 3 square workers on the same input

// ============================================================
// EXERCISE 3: Fan-in (merge)
// ============================================================
// Write a merge function that combines multiple <-chan int
// into a single <-chan int.
//
// func merge(ctx context.Context, channels ...<-chan int) <-chan int
//
// Use this to merge the 3 square worker outputs from Exercise 2.
//
// Hints:
//   - Start one goroutine per input channel
//   - Use sync.WaitGroup to know when all inputs are drained
//   - A separate goroutine waits on wg then closes the output
//   - Use select with ctx.Done() on sends
//
// TODO: Implement merge
func merge(ctx context.Context, cs ...<-chan int) <-chan int {
	var wg sync.WaitGroup
	out := make(chan int)

	wg.Add(len(cs))
	for _, ch := range cs {
		go func(ch <-chan int) {
			defer wg.Done()
			for v := range ch {
				select {
				case out <- v:
				case <-ctx.Done():
					return
				}
			}
		}(ch)
	}

	go func() {
		wg.Wait()
		close(out)
	}()

	return out
}

// ============================================================
// EXERCISE 4: Worker Pool
// ============================================================
// Build a worker pool that processes jobs concurrently:
//
// type Job struct { ID int; Data string }
// type Result struct { JobID int; Output string }
//
// func workerPool(ctx context.Context, numWorkers int, jobs <-chan Job) <-chan Result
//
// Each worker should:
//   - Read a job from the jobs channel
//   - Simulate processing (50-200ms random sleep)
//   - Send a Result with the processed output
//   - Respect ctx cancellation
//
// TODO: Define Job and Result types
type Job struct {
	ID   int
	Data string
}

type Result struct {
	JobID  int
	Output string
}

// TODO: Implement workerPool
func workerPool(ctx context.Context, numWorkers int, jobs <-chan Job) <-chan Result {
	results := make(chan Result)
	var wg sync.WaitGroup

	wg.Add(numWorkers)
	for i := 0; i < numWorkers; i++ {
		go func() {
			defer wg.Done()
			for job := range jobs {
				time.Sleep(time.Duration(50+rand.Intn(200)) * time.Millisecond)
				select {
				case results <- Result{JobID: job.ID, Output: fmt.Sprintf("processed %s", job.Data)}:
				case <-ctx.Done():
					return
				}
			}
		}()
	}

	go func() {
		wg.Wait()
		close(results)
	}()

	return results
}

// ============================================================
// EXERCISE 5: errgroup
// ============================================================
// Fetch data from 3 "services" in parallel using errgroup.
// If any one fails, cancel the others and return the error.
//
// Simulate services with random delays and occasional errors.
//
// func fetchAllData(ctx context.Context) (users []string, products []string, orders []string, err error)
//
// TODO: Implement fetchAllData using errgroup
func fetchAllData(ctx context.Context) (users []string, products []string, orders []string, err error) {
	g, ctx := errgroup.WithContext(ctx)

	// fetching users
	g.Go(func() error {
		time.Sleep(time.Duration(100+rand.Intn(200)) * time.Millisecond)

		// randomly returning error
		if rand.Intn(4) == 0 {
			return fmt.Errorf("users service unavailable")
		}

		users = append(users, "Bob", "Ana")
		return nil
	})

	g.Go(func() error {
		time.Sleep(time.Duration(100+rand.Intn(200)) * time.Millisecond)

		// randomly returning error
		if rand.Intn(4) == 0 {
			return fmt.Errorf("products service unavailable")
		}

		products = append(products, "Shampoo", "Candies")
		return nil
	})

	g.Go(func() error {
		time.Sleep(time.Duration(100+rand.Intn(200)) * time.Millisecond)

		// randomly returning error
		if rand.Intn(4) == 0 {
			return fmt.Errorf("orders service unavailable")
		}

		orders = append(orders, "summer shoes")
		return nil
	})

	err = g.Wait()

	return
}

// ============================================================
// EXERCISE 6: Rate Limiter
// ============================================================
// Build a simple rate limiter that processes events at most
// N times per second using time.Ticker.
//
// func rateLimited(ctx context.Context, events <-chan string, perSecond int) <-chan string

// Each event should only be forwarded after the rate limit allows.
//
// TODO: Implement rateLimited
func rateLimited(ctx context.Context, events <-chan string, perSecond int) <-chan string {
	out := make(chan string)
	ticker := time.NewTicker(time.Second / time.Duration(perSecond))

	go func() {
		defer close(out)
		defer ticker.Stop()

		for event := range events {
			<-ticker.C // wait for next tick
			select {
			case out <- event:
			case <-ctx.Done():
				return
			}
		}
	}()
	return out
}

// Keep compiler happy
var _ = rand.Intn
var _ = time.Sleep
var _ = fmt.Println
var _ sync.WaitGroup
var _ context.Context
var _ *errgroup.Group

func main() {
	fmt.Println("=== Exercise 06: Concurrency Patterns ===")
	fmt.Println()

	ctx := context.Background()

	// --- Uncomment each section as you implement ---

	// EXERCISE 1: Pipeline
	fmt.Println("-- Pipeline --")
	nums := generate(ctx, 1, 2, 3, 4, 5)
	squared := square(ctx, nums)
	for v := range squared {
		fmt.Printf("  %d\n", v)
	}
	fmt.Println()

	// EXERCISE 2 + 3: Fan-out + Fan-in
	fmt.Println("-- Fan-out / Fan-in --")
	input := generate(ctx, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
	// Fan-out: 3 workers reading from same channel
	c1 := square(ctx, input)
	c2 := square(ctx, input)
	c3 := square(ctx, input)
	// Fan-in: merge results
	for v := range merge(ctx, c1, c2, c3) {
		fmt.Printf("  %d\n", v)
	}
	fmt.Println()

	// EXERCISE 4: Worker Pool
	fmt.Println("-- Worker Pool --")
	jobs := make(chan Job, 10)
	go func() {
		for i := 1; i <= 10; i++ {
			jobs <- Job{ID: i, Data: fmt.Sprintf("task-%d", i)}
		}
		close(jobs)
	}()
	results := workerPool(ctx, 3, jobs)
	for r := range results {
		fmt.Printf("  Job %d: %s\n", r.JobID, r.Output)
	}
	fmt.Println()

	// EXERCISE 5: errgroup
	fmt.Println("-- errgroup --")
	users, products, orders, err := fetchAllData(ctx)
	if err != nil {
		fmt.Printf("  Error: %v\n", err)
	} else {
		fmt.Printf("  Users: %v\n", users)
		fmt.Printf("  Products: %v\n", products)
		fmt.Printf("  Orders: %v\n", orders)
	}
	fmt.Println()

	// EXERCISE 6: Rate Limiter
	fmt.Println("-- Rate Limiter (5/sec) --")
	events := make(chan string, 20)
	go func() {
		for i := 1; i <= 10; i++ {
			events <- fmt.Sprintf("event-%d", i)
		}
		close(events)
	}()
	start := time.Now()
	for evt := range rateLimited(ctx, events, 5) {
		fmt.Printf("  [%v] %s\n", time.Since(start).Round(time.Millisecond), evt)
	}

	_ = ctx
}
