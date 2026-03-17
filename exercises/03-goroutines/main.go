package main

import (
	"fmt"
	"sync"
	"time"
)

// Exercise 03: Goroutines
//
// Work through each exercise in order.
// Uncomment the test calls in main() as you implement each function.
//
// Run: go run ./exercises/03-goroutines
//
// Concepts covered:
//   1. Basic goroutine — fire and forget
//   2. sync.WaitGroup — waiting for goroutines to finish
//   3. Anonymous goroutines with closures
//   4. Goroutine with shared state (the race condition problem)
//   5. Fixing shared state with sync.Mutex

// ============================================================
// EXERCISE 1: Basic goroutine
// ============================================================
// Write a function greet(name string) that prints "Hello, <name>!"
// Then call it as a goroutine 3 times with different names.
//
// Note: You'll need time.Sleep here since we haven't learned
// channels or WaitGroup yet. That's OK for this one exercise.
//
// TODO: Implement greet(name string)
func greet(name string) {
	time.Sleep(100 * time.Millisecond)
	fmt.Printf("Hello %s\n", name)
}

// ============================================================
// EXERCISE 2: sync.WaitGroup
// ============================================================
// Write a function fetchPage(url string, wg *sync.WaitGroup) that:
//   - Simulates a slow HTTP request with time.Sleep(500ms)
//   - Prints "Fetched: <url>"
//   - Calls wg.Done() when finished
//
// Then launch 5 goroutines to fetch different URLs and wait
// for all of them using wg.Wait().
//
// TODO: Implement fetchPage(url string, wg *sync.WaitGroup)
func fetchPage(url string, wg *sync.WaitGroup) {
	// Run this on function exists, no matter how, this is the responsibility of 'defer'
	defer wg.Done()

	time.Sleep(500 * time.Millisecond)
	fmt.Printf("Fetched: %s\n", url)
}

// ============================================================
// EXERCISE 3: Anonymous goroutines with closures
// ============================================================
// Launch 5 goroutines using anonymous functions (no named function).
// Each goroutine should print "Worker <i> started" and sleep 300ms
// then print "Worker <i> done".
//
// Use a WaitGroup to wait for all of them.
//
// GOTCHA: What happens if you use `i` directly inside the goroutine
// without passing it as a parameter? Try it and see!
//
// Hint: the fix is to pass i as a parameter to the anonymous function.
//
// TODO: Implement in main()

// ============================================================
// EXERCISE 4: The race condition
// ============================================================
// Create a counter variable (int) starting at 0.
// Launch 1000 goroutines that each increment the counter by 1.
// Wait for all to finish, then print the counter.
//
// Expected: 1000. What do you actually get? Run it multiple times.
//
// DO NOT fix it yet — just observe the bug.
//
// TODO: Implement in main()

// ============================================================
// EXERCISE 5: Fix with sync.Mutex
// ============================================================
// Same as Exercise 4, but use a sync.Mutex to protect the counter.
// Now the result should always be 1000.
//
// TODO: Implement in main()

// Keep the compiler happy for unused imports while working
var _ = fmt.Println
var _ = sync.WaitGroup{}
var _ = time.Sleep

func main() {
	fmt.Println("=== Exercise 03: Goroutines ===")
	fmt.Println()

	// --- Uncomment each section as you implement ---

	// EXERCISE 1: Basic goroutine
	fmt.Println("-- Greet --")
	go greet("Alice")
	go greet("Bob")
	go greet("Charlie")
	time.Sleep(1 * time.Second) // hack — OK for this exercise only
	fmt.Println()

	// EXERCISE 2: WaitGroup
	fmt.Println("-- Fetch Pages --")
	urls := []string{
		"https://go.dev",
		"https://github.com",
		"https://reddit.com",
		"https://news.ycombinator.com",
		"https://stackoverflow.com",
	}
	var wg sync.WaitGroup
	wg.Add(len(urls))
	start := time.Now()
	for _, url := range urls {
		go fetchPage(url, &wg)
	}
	wg.Wait()
	fmt.Printf("All fetched in %v (should be ~500ms, not ~2.5s)\n", time.Since(start).Round(time.Millisecond))
	fmt.Println()

	// EXERCISE 3: Anonymous goroutines
	fmt.Println("-- Anonymous Workers --")
	
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func (n int)  {
			defer wg.Done()
			fmt.Printf("Worker %d\n", n)
		}(i)
	}
	wg.Wait()
	fmt.Println()

	// EXERCISE 4: Race condition (observe the bug)
	fmt.Println("-- Race Condition --")
	counter := 0
	var wg2 sync.WaitGroup
	wg2.Add(1000)
	for i := 0; i < 1000; i++ {
		go func() {
			defer wg2.Done()
			counter++ // ← NOT thread-safe!
		}()
	}
	wg2.Wait()
	fmt.Printf("Counter: %d (expected 1000, got?)\n", counter)
	fmt.Println()

	// EXERCISE 5: Fix with Mutex
	fmt.Println("-- Mutex Fix --")
	safeCounter := 0
	var mu sync.Mutex
	var wg3 sync.WaitGroup
	wg3.Add(1000)
	for i := 0; i < 1000; i++ {
		go func() {
			defer wg3.Done()
			mu.Lock()
			safeCounter++
			mu.Unlock()
		}()
	}
	wg3.Wait()
	fmt.Printf("Safe counter: %d (should always be 1000)\n", safeCounter)
}
