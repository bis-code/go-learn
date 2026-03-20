package main

import (
	"fmt"
	"math/rand"
	"sync"
	"sync/atomic"
	"time"
)

// Exercise 04: Sync Primitives
//
// You already know sync.Mutex and sync.WaitGroup from Exercise 03.
// This exercise covers the rest of the sync package.
//
// Run: go run ./exercises/04-sync-primitives
//
// Concepts covered:
//   1. sync.RWMutex — multiple readers, one writer
//   2. sync.Once — run something exactly once
//   3. sync/atomic — lock-free counter operations
//   4. sync.Map — concurrent-safe map
//   5. sync.Pool — reusable object pool
//   6. Putting it all together

// ============================================================
// EXERCISE 1: sync.RWMutex — Read-heavy cache
// ============================================================
// Build a UserCache that stores user names by ID.
// Multiple goroutines will read from it at the same time,
// but only one can write at a time.
//
// Use sync.RWMutex:
//   - RLock/RUnlock for reads (allows multiple concurrent readers)
//   - Lock/Unlock for writes (exclusive access)
//
// Think: why not just use sync.Mutex for everything?
//
// TODO: Implement Get(id int) (string, bool)
// TODO: Implement Set(id int, name string)
type UserCache struct {
	data map[int]string
	mu   sync.RWMutex
}

// TODO: Implement Get and Set methods
func (u *UserCache) Get(id int) (string, bool) {
	u.mu.RLock()
	defer u.mu.RUnlock()

	name, ok := u.data[id]
	return name, ok
}

func (u *UserCache) Set(id int, name string) {
	u.mu.Lock()
	defer u.mu.Unlock()

	u.data[id] = name
}

// ============================================================
// EXERCISE 2: sync.Once — Lazy initialization
// ============================================================
// Build a Config struct that loads its values only on first access.
// No matter how many goroutines call GetConfig() simultaneously,
// the expensive loadConfig() should run exactly once.
//
// TODO: Implement GetConfig() map[string]string
// TODO: The load function should print "Loading config..." so you
//       can verify it only runs once

type Config struct {
	once  sync.Once
	cache map[string]string
}

// TODO: Implement GetConfig method
func (c *Config) GetConfig() map[string]string {
	c.once.Do(func() {
		fmt.Println("Loading config...")
		c.cache = map[string]string{
			"app_name": "go-learn",
			"version":  "1.0",
		}
	})
	return c.cache
}

// ============================================================
// EXERCISE 3: sync/atomic — Lock-free counter
// ============================================================
// Build a HitCounter that tracks page views using atomic operations.
// No mutex needed — atomic operations are faster for simple counters.
//
// Use: atomic.AddInt64, atomic.LoadInt64
//
// TODO: Implement Increment()
// TODO: Implement Count() int64
type HitCounter struct {
	counter int64
}

// TODO: Implement Increment and Count methods
func (hc *HitCounter) Count() int64 {
	return atomic.LoadInt64(&hc.counter)
}

func (hc *HitCounter) Increment() {
	atomic.AddInt64(&hc.counter, 1)
}

// ============================================================
// EXERCISE 4: sync.Map — Concurrent session store
// ============================================================
// Build a SessionStore using sync.Map.
// Multiple goroutines will create, read, and delete sessions.
//
// sync.Map is useful when:
//   - Keys are mostly stable (read-heavy)
//   - Different goroutines access different keys
//
// Use: Store, Load, Delete, Range
//
// TODO: Implement Set(sessionID string, username string)
// TODO: Implement Get(sessionID string) (string, bool)
// TODO: Implement Delete(sessionID string)
// TODO: Implement Count() int — use Range to count entries
type SessionStore struct {
	sm sync.Map
}

// TODO: Implement Set, Get, Delete, Count methods
func (ss *SessionStore) Set(sessionID string, username string) {
	ss.sm.Store(sessionID, username)
}

func (ss *SessionStore) Get(sessionID string) (string, bool) {
	val, ok := ss.sm.Load(sessionID)
	if !ok {
		return "", false
	}
	return val.(string), true
}

func (ss *SessionStore) Delete(sessionID string) {
	ss.sm.Delete(sessionID)
}

func (ss *SessionStore) Count() int {
	var count int
	ss.sm.Range(func(key, value any) bool {
		count++
		return true
	})
	return count
}

// ============================================================
// EXERCISE 5: sync.Pool — Buffer reuse
// ============================================================
// Build a BufferPool that reuses byte slices instead of
// allocating new ones every time.
//
// sync.Pool is useful for:
//   - Reducing garbage collection pressure
//   - Reusing expensive-to-create objects
//
// The pool needs a New function that creates a fresh buffer
// when the pool is empty.
//
// TODO: Create a sync.Pool that produces []byte slices of size 1024
// TODO: Implement GetBuffer() []byte — gets from pool
// TODO: Implement PutBuffer(buf []byte) — returns to pool
type BufferPool struct {
	pool sync.Pool
}

// TODO: Implement NewBufferPool, GetBuffer, PutBuffer
func NewBufferPool() *BufferPool {
	return &BufferPool{
		pool: sync.Pool{
			New: func() any {
				return make([]byte, 1024)
			},
		},
	}
}

func (bp *BufferPool) GetBuffer() []byte {
	// when you write ([]byte) you cast like in java ([]byte) pool.Get()
	return bp.pool.Get().([]byte)
}

func (bp *BufferPool) PutBuffer(buf []byte) {
	bp.pool.Put(buf)
}

// ============================================================
// EXERCISE 6: Putting it all together — Rate-limited API
// ============================================================
// Build a SimpleAPI that:
//   - Uses sync.Once to initialize on first request
//   - Uses atomic counter for request counting
//   - Uses sync.RWMutex to protect a response cache
//   - Limits concurrent requests with a channel semaphore
//
// TODO: Implement HandleRequest(path string) string
type SimpleAPI struct {
	once sync.Once
	requestCount int64
	mu sync.RWMutex
	cache map[string]string
	sem chan struct{}
}

// TODO: Implement NewSimpleAPI and HandleRequest
func NewSimpleAPI(concurrReq int) *SimpleAPI {
	return &SimpleAPI{
		sem: make(chan struct{}, concurrReq),
	}
}

func (api *SimpleAPI) HandleRequest(path string) string {
	api.once.Do(func() {
		api.cache = make(map[string]string)
		fmt.Println("API Initialized")
	})

	// acquires a semaphore for concurrency
	// the value doesn't matter, we just take a slot so we put it in the queue
	api.sem <- struct{}{}
	// also defer it so that when function exists the semaphore is released
	defer func ()  {
		<- api.sem
	}()

	// bump up request count atomicly
	atomic.AddInt64(&api.requestCount, 1)

	// check cache with read locker
	api.mu.RLock()
	// now we can safely check if path is already cached
	if resp, ok := api.cache[path]; ok {
		api.mu.RUnlock()
		return resp // returning cached
	}
	// now we are unlocking read locker as we are preparing for writing
	// as cache was not found
	api.mu.RUnlock()
	// now are locking for writing purposes
	api.mu.Lock()
	// otherwise return the path
	resp := fmt.Sprintf("response for %s", path)
	api.cache[path] = resp
	api.mu.Unlock()
	return resp
}

// Keep compiler happy
var _ = rand.Intn
var _ = time.Sleep
var _ sync.WaitGroup
var _ atomic.Int64

func main() {
	fmt.Println("=== Exercise 04: Sync Primitives ===")
	fmt.Println()

	// --- Uncomment each section as you implement ---

	// EXERCISE 1: RWMutex Cache
	fmt.Println("-- RWMutex Cache --")
	cache := &UserCache{
		data: make(map[int]string),
	} // may need to initialize
	cache.Set(1, "Alice")
	cache.Set(2, "Bob")
	cache.Set(3, "Charlie")

	// Launch 10 concurrent readers
	var wg sync.WaitGroup
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			name, ok := cache.Get(id%3 + 1)
			fmt.Printf("  Reader got user %d: %s (found: %v)\n", id%3+1, name, ok)
		}(i)
	}

	// Launch a writer while readers are running
	wg.Add(1)
	go func() {
		defer wg.Done()
		cache.Set(4, "Dave")
		fmt.Println("  Writer added Dave")
	}()
	wg.Wait()
	fmt.Println()

	// EXERCISE 2: sync.Once
	fmt.Println("-- sync.Once --")
	cfg := &Config{}
	var wg2 sync.WaitGroup
	for i := 0; i < 5; i++ {
		wg2.Add(1)
		go func(n int) {
			defer wg2.Done()
			c := cfg.GetConfig()
			fmt.Printf("  Goroutine %d got app_name: %s\n", n, c["app_name"])
		}(i)
	}
	wg2.Wait()
	fmt.Println("  'Loading config...' should appear only ONCE above")
	fmt.Println()

	// EXERCISE 3: Atomic counter
	fmt.Println("-- Atomic Counter --")
	hits := &HitCounter{}
	var wg3 sync.WaitGroup
	for i := 0; i < 1000; i++ {
		wg3.Add(1)
		go func() {
			defer wg3.Done()
			hits.Increment()
		}()
	}
	wg3.Wait()
	fmt.Printf("  Total hits: %d (should always be 1000)\n", hits.Count())
	fmt.Println()

	// EXERCISE 4: sync.Map
	fmt.Println("-- sync.Map Sessions --")
	sessions := &SessionStore{}
	var wg4 sync.WaitGroup

	// Create sessions concurrently
	for i := 0; i < 5; i++ {
		wg4.Add(1)
		go func(n int) {
			defer wg4.Done()
			id := fmt.Sprintf("sess_%d", n)
			sessions.Set(id, fmt.Sprintf("user_%d", n))
		}(i)
	}
	wg4.Wait()
	fmt.Printf("  Active sessions: %d\n", sessions.Count()) // 5

	// Read one
	if user, ok := sessions.Get("sess_2"); ok {
		fmt.Printf("  sess_2 belongs to: %s\n", user)
	}

	// Delete one
	sessions.Delete("sess_0")
	fmt.Printf("  After delete: %d sessions\n", sessions.Count()) // 4
	fmt.Println()

	// EXERCISE 5: sync.Pool
	fmt.Println("-- sync.Pool Buffers --")
	pool := NewBufferPool()
	
	buf1 := pool.GetBuffer()
	fmt.Printf("  Got buffer, len=%d\n", len(buf1)) // 1024
	copy(buf1, []byte("hello pool"))
	fmt.Printf("  Buffer content: %s\n", string(buf1[:10]))
	pool.PutBuffer(buf1)
	
	buf2 := pool.GetBuffer()
	fmt.Printf("  Reused buffer? %v\n", &buf1[0] == &buf2[0]) // likely true
	pool.PutBuffer(buf2)
	fmt.Println()

	// EXERCISE 6: Putting it all together
	fmt.Println("-- SimpleAPI --")
	api := NewSimpleAPI(3) // max 3 concurrent requests
	var wg6 sync.WaitGroup
	for i := 0; i < 10; i++ {
		wg6.Add(1)
		go func(n int) {
			defer wg6.Done()
			path := fmt.Sprintf("/page/%d", n%3) // 3 unique paths
			result := api.HandleRequest(path)
			fmt.Printf("  Request %d (%s): %s\n", n, path, result)
		}(i)
	}
	wg6.Wait()
	fmt.Printf("  Total requests handled: %d\n", api.requestCount)
}
