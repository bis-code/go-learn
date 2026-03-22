package main

import (
	"bufio"
	"bytes"
	"embed"
	"flag"
	"fmt"
	"io"
	"log/slog"
	"os"
	"regexp"
	"strings"
)

// Exercise 07: Standard Library Deep Dive
//
// Run: go run ./exercises/07-stdlib
// Some exercises use flags: go run ./exercises/07-stdlib -name=Alice -verbose
//
// Concepts covered:
//   1. slog — structured logging
//   2. flag — command-line argument parsing
//   3. go:embed — embedding files at compile time
//   4. regexp — regular expressions
//   5. bufio — buffered I/O (scanner, reader)
//   6. io — Reader/Writer interfaces and composition

// ============================================================
// EXERCISE 1: slog — Structured Logging
// ============================================================
// Set up a structured logger and log messages at different levels.
//
// 1. Create a JSON handler that writes to os.Stdout
// 2. Log an Info message with key-value pairs: "user", "alice", "action", "login"
// 3. Log a Warn message with: "disk_usage", 92.5
// 4. Log an Error message with: "err", "connection refused", "retry_in", 5
// 5. Create a logger with default attributes using slog.With()
//    Add "service", "api" — then log a message (service should appear automatically)
//
// TODO: Implement setupLogging()
func setupLogging() {
	handler := slog.NewJSONHandler(os.Stdout, nil)
	logger := slog.New(handler)

	logger.Info("user login", "user", "alice", "action", "login")
	logger.Warn("disk_usage", "usage", 92.5)
	logger.Error("connection refused", "retry_in", 5)

	apiLogger := logger.With("service", "api")
	apiLogger.Info("request handled")
}

// ============================================================
// EXERCISE 2: flag — Command Line Arguments
// ============================================================
// Parse command-line flags:
//   -name string  (default: "World")
//   -count int    (default: 1)
//   -verbose bool (default: false)
//
// Print "Hello, <name>!" count times.
// If verbose, also print the flag values.
//
// Test: go run ./exercises/07-stdlib -name=Go -count=3 -verbose
//
// TODO: Implement parseFlags()
func parseFlags() {
	name := flag.String("name", "World", "name of caller")
	count := flag.Int("count", 1, "counter")
	verbose := flag.Bool("verbose", false, "print the flag values as well if enabled")
	flag.Parse()

	if count == nil {
		fmt.Printf("count flag not set\n")
	}

	if name == nil {
		fmt.Printf("name flag not set\n")
	}

	for i := 0; i < *count; i++ {
		fmt.Printf("Hello, %s\n", *name)
	}

	if *verbose {
		fmt.Printf("name flag value: %s\n", *name)
		fmt.Printf("count flag value: %d\n", *count)
	}
}

// ============================================================
// EXERCISE 3: go:embed — Embedded Files
// ============================================================
// Embed a text file and read its contents at runtime.
//
// 1. Create a file called "greeting.txt" in the same directory
//    with content: "Hello from an embedded file!"
// 2. Use //go:embed to load it into a string variable
// 3. Also embed all .txt files using embed.FS
// 4. List and print all embedded files
//
// TODO: Create greeting.txt
// TODO: Add embed directives
// TODO: Implement printEmbedded()
func printEmbedded() {
	entries, _ := textFiles.ReadDir(".")
	for _, entry := range entries {
		data, _ := textFiles.ReadFile(entry.Name())
		fmt.Printf(" %s: %s\n", entry.Name(), string(data))
	}
}

//go:embed greeting.txt
var greetingText string

//go:embed *.txt
var textFiles embed.FS

// ============================================================
// EXERCISE 4: regexp — Pattern Matching
// ============================================================
// Write functions that use regular expressions:
//
// 1. isValidEmail(s string) bool
//    Basic email validation: something@something.something
//
// 2. extractURLs(text string) []string
//    Find all URLs (http:// or https://) in a text
//
// 3. maskPhoneNumbers(text string) string
//    Replace phone numbers (XXX-XXX-XXXX) with "***-***-XXXX"
//    keeping last 4 digits visible
//
// TODO: Implement isValidEmail
func isValidEmail(s string) bool {
	emailRegex := `^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z0-9]`

	re := regexp.MustCompile(emailRegex)

	return re.MatchString(s)
}

// TODO: Implement extractURLs
func extractURLs(text string) []string{
	rgx := `https?://\S+`
	re := regexp.MustCompile(rgx)

	return re.FindAllString(text, -1)
}

// TODO: Implement maskPhoneNumbers
func maskPhoneNumbers(text string) string {
	rgx := `(\d{3})-(\d{3})-(\d{4})`
	re := regexp.MustCompile(rgx)

	return re.ReplaceAllString(text, "x*x-x*x-$3")
}

// ============================================================
// EXERCISE 5: bufio — Buffered I/O
// ============================================================
// Build a simple word counter that:
//   1. Takes a string input (simulating a file)
//   2. Uses bufio.Scanner to read line by line
//   3. Counts: total lines, total words, total characters
//
// func wordCount(input string) (lines, words, chars int)
//
// TODO: Implement wordCount
func wordCount(input string) (lines, words, chars int) {
	scanner := bufio.NewScanner(strings.NewReader(input))
	for scanner.Scan() {
		line := scanner.Text()
		lines++
		words += len(strings.Fields(line))
		chars += len(line)
	}
	return
}

// ============================================================
// EXERCISE 6: io — Reader/Writer Composition
// ============================================================
// Demonstrate io.Reader and io.Writer composition:
//
// 1. Write a function that copies from a Reader to a Writer
//    using io.Copy (like a simplified cat command)
//
// 2. Write a function that chains multiple Readers using
//    io.MultiReader — combine 3 strings into one stream
//
// 3. Write a function that writes to multiple Writers using
//    io.MultiWriter — write once, goes to both a buffer and stdout
//
// TODO: Implement copyStream(dst io.Writer, src io.Reader) (int64, error)
func copyStream(dst io.Writer, src io.Reader) (int64, error) {
	return io.Copy(dst, src)
}

// TODO: Implement combineReaders(parts ...string) io.Reader
func combineReaders(parts ...string) io.Reader {
	readers := make([]io.Reader, len(parts))
	for i, p := range parts {
		readers[i] = strings.NewReader(p)
	}
	return io.MultiReader(readers...)
}

// TODO: Implement multiWrite(msg string) string — writes to stdout AND returns the string
func multiWrite(msg string) string {
	var buf bytes.Buffer
	w := io.MultiWriter(os.Stdout, &buf)
	fmt.Fprint(w, msg)
	return buf.String()
}

// Keep compiler happy
var _ = bufio.NewScanner
var _ = fmt.Println
var _ = io.Copy
var _ = os.Stdout
var _ = regexp.MustCompile
var _ = slog.Info
var _ = strings.NewReader
var _ embed.FS
var _ = flag.String

func main() {
	fmt.Println("=== Exercise 07: Standard Library Deep Dive ===")
	fmt.Println()

	// --- Uncomment each section as you implement ---

	// EXERCISE 1: slog
	fmt.Println("-- slog --")
	setupLogging()
	fmt.Println()

	// EXERCISE 2: flag
	fmt.Println("-- flag --")
	parseFlags()
	fmt.Println()

	// EXERCISE 3: go:embed
	fmt.Println("-- go:embed --")
	fmt.Println("Embedded string:", greetingText)
	printEmbedded()
	fmt.Println()

	// EXERCISE 4: regexp
	fmt.Println("-- regexp --")
	fmt.Println("Valid email:", isValidEmail("user@example.com"))    // true
	fmt.Println("Valid email:", isValidEmail("not-an-email"))         // false
	fmt.Println("Valid email:", isValidEmail("a@b.c"))                // true
	fmt.Println()
	
	text := "Check https://go.dev and http://example.com for more info"
	fmt.Println("URLs:", extractURLs(text))
	// [https://go.dev http://example.com]
	fmt.Println()
	
	msg := "Call me at 555-123-4567 or 800-999-0000"
	fmt.Println("Masked:", maskPhoneNumbers(msg))
	// Call me at ***-***-4567 or ***-***-0000
	fmt.Println()

	// EXERCISE 5: bufio
	fmt.Println("-- bufio --")
	sample := "Hello World\nThis is line two\nAnd line three"
	lines, words, chars := wordCount(sample)
	fmt.Printf("Lines: %d, Words: %d, Chars: %d\n", lines, words, chars)
	// Lines: 3, Words: 10, Chars: 44
	fmt.Println()

	// EXERCISE 6: io composition
	fmt.Println("-- io --")
	// Copy
	src := strings.NewReader("Hello from io.Copy!\n")
	n, _ := copyStream(os.Stdout, src)
	fmt.Printf("Copied %d bytes\n", n)
	fmt.Println()
	
	// MultiReader
	combined := combineReaders("Hello ", "from ", "MultiReader!\n")
	io.Copy(os.Stdout, combined)
	fmt.Println()
	
	// MultiWriter
	result := multiWrite("Hello MultiWriter!")
	fmt.Printf("Returned: %q\n", result)
}
