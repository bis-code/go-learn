package mathutil

import (
	"errors"
	"fmt"
	"strings"
	"unicode/utf8"
)

// Functions to test — some have bugs for you to find!

// Abs returns the absolute value of n.
func Abs(n int) int {
	if n < 0 {
		return -n
	}
	return n
}

// Max returns the larger of a or b.
func Max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

// Clamp restricts n to the range [min, max].
func Clamp(n, min, max int) int {
	if n < min {
		return min
	}
	if n > max {
		return max
	}
	return n
}

// Reverse returns the string reversed.
// BUG: this has a bug with multi-byte unicode characters.
// Fuzzing should find it!
func Reverse(s string) string {
	runes := []rune(s)
	for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
		runes[i], runes[j] = runes[j], runes[i]
	}
	return string(runes)
}

// IsPalindrome checks if a string reads the same forwards and backwards.
// Case-insensitive.
func IsPalindrome(s string) bool {
	s = strings.ToLower(s)
	return s == Reverse(s)
}

// Divide returns a / b, or an error if b is zero.
func Divide(a, b float64) (float64, error) {
	if b == 0 {
		return 0, errors.New("division by zero")
	}
	return a / b, nil
}

// FizzBuzz returns "Fizz", "Buzz", "FizzBuzz", or the number as a string.
func FizzBuzz(n int) string {
	switch {
	case n%15 == 0:
		return "FizzBuzz"
	case n%3 == 0:
		return "Fizz"
	case n%5 == 0:
		return "Buzz"
	default:
		return fmt.Sprintf("%d", n)
	}
}

// TruncateUTF8 truncates a string to at most maxChars rune characters.
// Appends "..." if truncated.
func TruncateUTF8(s string, maxChars int) string {
	if utf8.RuneCountInString(s) <= maxChars {
		return s
	}
	runes := []rune(s)
	return string(runes[:maxChars]) + "..."
}

// SliceSum returns the sum of all elements in a slice.
func SliceSum(nums []int) int {
	sum := 0
	for _, n := range nums {
		sum += n
	}
	return sum
}
