package main

import (
	"fmt"
	"time"
)

// Exercise 04: Channels
//
// Work through each exercise in order. Each matches a visualization
// on the dashboard (Goroutines & Channels → Visualize tab).
//
// Run: go run ./exercises/04-channels
//
// Concepts covered:
//   1. Unbuffered channel — send and receive
//   2. Buffered channel — capacity and blocking
//   3. Channel direction — send-only and receive-only
//   4. Select statement — multiplexing channels
//   5. Range + Close — iterating over channels
//   6. Pipeline pattern — chaining stages with channels

// Keep compiler happy
var _ = fmt.Println
var _ = time.Sleep

// ============================================================
// EXERCISE 1: Unbuffered Channel
// ============================================================
// Create an unbuffered channel of type string.
// Launch a goroutine that sends "hello from goroutine" into the channel.
// Receive the message in main and print it.
//
// No time.Sleep allowed — the channel IS the synchronization.
//
// TODO: Implement in main()
func sendMessage(ch chan string) {
	ch <- "hello from goroutine"
}

// ============================================================
// EXERCISE 2: Buffered Channel
// ============================================================
// Create a buffered channel of type int with capacity 3.
// Send 3 values into it WITHOUT a receiver goroutine.
// Then receive and print all 3 values.
//
// Why does this work without a goroutine? Because the buffer
// has room — sends don't block until the buffer is full.
//
// TODO: Implement in main()
func sendInteger(ch chan int, value int) {
	ch <- value
}

// ============================================================
// EXERCISE 3: Channel Direction
// ============================================================
// Write two functions:
//
//	producer(ch chan<- string) — sends 3 messages into ch, then closes it
//	consumer(ch <-chan string) — receives and prints all messages from ch
//
// The types chan<- (send-only) and <-chan (receive-only) prevent
// the wrong side from doing the wrong thing.
//
// TODO: Implement producer and consumer
func producer(ch chan<- string) {
	ch <- "first message"
	ch <- "second message"
	ch <- "third message"
	// we need to close the channel when the receiver of the channel uses loops to receive messages
	// otherwise it enters deadlock
	close(ch)
}

func consumer(ch <-chan string) {
	for msg := range ch {
		fmt.Printf("Consuming: '%s'\n", msg)
	}
}

// ============================================================
// EXERCISE 4: Select Statement
// ============================================================
// Create two channels: ch1 and ch2 (both chan string).
// Launch two goroutines:
//   - One sends "from ch1" after 200ms
//   - One sends "from ch2" after 100ms
//
// Use a select statement to receive from whichever is ready first.
// Print which channel won.
//
// Bonus: wrap the select in a loop to receive from BOTH
// (the second one will arrive after the first).
//
// TODO: Implement in main()
func sendMessage2(ch chan string, msg string) {
	ch <- msg
}

// ============================================================
// EXERCISE 5: Range + Close
// ============================================================
// Write a function fibonacci(n int, ch chan<- int) that:
//   - Sends the first n Fibonacci numbers into ch
//   - Closes the channel when done
//
// In main, use "for v := range ch" to receive and print
// all Fibonacci numbers.
//
// Fibonacci: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, ...
//
// TODO: Implement fibonacci
func fibonacci(n int, ch chan<- int) {
	a, b := 0, 1
	for i := 0; i < n; i++ {
		ch <- a
		a, b = b, a+b
	}
	close(ch)
}

// ============================================================
// EXERCISE 6: Pipeline Pattern
// ============================================================
// Build a 3-stage pipeline:
//
//	Stage 1: generate(nums ...int) <-chan int
//	  — sends all nums into a channel, closes it, returns the channel
//	Stage 2: square(in <-chan int) <-chan int
//	  — reads from in, squares each value, sends to output channel
//	Stage 3: main receives from square's output and prints
//
// Example: generate(2, 3, 4) → square → prints 4, 9, 16
//
// TODO: Implement generate and square
func generate(nums ...int) <-chan int {
	ch := make(chan int)
	go func() {
		for num := range nums {
			ch <- num
		}
		close(ch)
	}()
	return ch
}

func square(in <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		for num := range in {
			out <- num * num
		}
		close(out)
	}()
	return out
}

func main() {
	fmt.Println("=== Exercise 04: Channels ===")
	fmt.Println()

	// --- Uncomment each section as you implement ---

	// EXERCISE 1: Unbuffered Channel
	fmt.Println("-- Unbuffered Channel --")
	ch1 := make(chan string)
	// we could either declare the function directly like this
	// or we could declare the function beforehand and use it here
	//! example with declaring function directly here
	// go func() {
	// 	ch <- "hello from goroutine"
	// }()
	//! example with declaring the function beforehand
	go sendMessage(ch1)
	msg := <-ch1
	fmt.Printf("Message received from the channel: '%s'\n", msg)
	fmt.Println()

	// EXERCISE 2: Buffered Channel
	fmt.Println("-- Buffered Channel --")
	// TODO: create buffered channel, send 3 values, receive and print
	//! If you can see here we are not using 'go' because we don't have goroutines
	//! The reason for that is because this is 'buffered channel', meaning that
	//! the idea is that buffered channels are FIFO (first in first out)
	ch2 := make(chan int, 3)
	// we are using goroutines still here as we want to use a pre-declared function
	// because we are using pre-declared function, the main can block if we are not using go routine
	// otherwise, we could use directly ch <- value inside the main block, instead of pre-declared function
	// so that we wouldn't need the goroutine
	go func() {
		sendInteger(ch2, 1)
		sendInteger(ch2, 2)
		sendInteger(ch2, 3)
		sendInteger(ch2, 4)
	}()
	integer1 := <-ch2
	integer2 := <-ch2
	integer3 := <-ch2
	integer4 := <-ch2
	fmt.Printf("Integer received from the channel: '%d'\n", integer1)
	fmt.Printf("Integer received from the channel: '%d'\n", integer2)
	fmt.Printf("Integer received from the channel: '%d'\n", integer3)
	fmt.Printf("Integer received from the channel: '%d'\n", integer4)
	fmt.Println()

	// EXERCISE 3: Channel Direction
	fmt.Println("-- Channel Direction --")
	ch3 := make(chan string)
	go producer(ch3)
	consumer(ch3)
	fmt.Println()

	// EXERCISE 4: Select Statement
	fmt.Println("-- Select Statement --")
	ch41 := make(chan string)
	ch42 := make(chan string)
	// the time sleep is added here so that we define the priority of which channel would go faster
	// this basically mimics two implementations
	// as for in the first go func() we have 200 miliseconds, meaning that it takes with 100 more miliseconds than the second channel

	println("---> based on performance")
	go func() {
		time.Sleep(200 * time.Millisecond)
		go sendMessage2(ch41, "An interesting message")
	}()
	go func() {
		time.Sleep(100 * time.Millisecond)
		go sendMessage2(ch42, "Is the other message so interesting?")
	}()

	select {
	case msg := <-ch41:
		time.Sleep(100 * time.Millisecond)
		fmt.Printf("Received message from channel 1: '%s'\n", msg)
	case msg := <-ch42:

		fmt.Printf("Received message from channel 2: '%s'\n", msg)
	}
	fmt.Println()

	// we could also receive both messages with a for loop just to check them
	println("---> using range to show both messages")
	go func() {
		time.Sleep(200 * time.Millisecond)
		go sendMessage2(ch41, "An interesting message")
	}()
	go func() {
		time.Sleep(100 * time.Millisecond)
		go sendMessage2(ch42, "Is the other message so interesting?")
	}()
	for i := 0; i < 2; i++ {
		select {
		case msg := <-ch41:
			time.Sleep(100 * time.Millisecond)
			fmt.Printf("Received message from channel 1: '%s'\n", msg)
		case msg := <-ch42:

			fmt.Printf("Received message from channel 2: '%s'\n", msg)
		}
	}
	fmt.Println()

	// EXERCISE 5: Range + Close
	fmt.Println("-- Fibonacci --")
	ch := make(chan int)
	go fibonacci(10, ch)
	for v := range ch {
		fmt.Println(v)
	}
	fmt.Println()

	// EXERCISE 6: Pipeline
	fmt.Println("-- Pipeline --")
	for v := range square(generate(2, 3, 4)) {
		fmt.Println(v) // 4, 9, 16
	}
}
