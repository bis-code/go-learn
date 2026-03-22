package mathutil

import (
	"strings"
	"testing"
	"unicode/utf8"
)

// Exercise 08: Testing Mastery
//
// Run all tests:     go test ./exercises/08-testing/ -v
// Run one test:      go test ./exercises/08-testing/ -run TestAbs
// Run benchmarks:    go test ./exercises/08-testing/ -bench=. -benchmem
// Run fuzzing:       go test ./exercises/08-testing/ -fuzz=FuzzReverse -fuzztime=10s
//
// Concepts covered:
//   1. Table-driven tests with subtests
//   2. Test helpers
//   3. Testing errors
//   4. Benchmarks
//   5. Fuzzing
//   6. Parallel subtests

// ============================================================
// EXERCISE 1: Table-driven tests with subtests
// ============================================================
// Write table-driven tests for Abs, Max, and Clamp.
// Use t.Run() for each test case.
//
// Cover: positive, negative, zero, edge cases.
//
// TODO: Implement TestAbs
func TestAbs(t *testing.T) {
	tests := []struct {
		name string
		input int
		expected int
	}{
		{"positive number", 5, 5},
		{"negative number", -5, 5},
		{"zero", 0, 0},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			actual := Abs(test.input)
			if actual != test.expected {
				t.Errorf("Expected %d, actual %d", test.expected, actual)
			}
		})
	}
}
// TODO: Implement TestMax
func TestMax(t *testing.T) {
	tests := []struct {
		name string
		input [2]int
		expected int
	}{
		{"positive numbers", [2]int{2, 3}, 3},
		{"negative numbers", [2]int{-2, -3}, -2},
		{"negative and positive numbers", [2]int{-2, 3}, 3},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			actual := Max(tt.input[0], tt.input[1])
			if actual != tt.expected {
				t.Errorf("Expected %d, actual %d", tt.expected, actual)
			}
		})
	}
}

// TODO: Implement TestClamp
func TestClamp(t *testing.T) {
	tests := []struct {
		name string
		val int
		min int
		max int
		expected int
	}{
		{"value within boundaries", 2, 0, 3, 2},
		{"value out of min boundaries", 1, 2, 3, 2},
		{"value out of max boundaries", 3, 0, 2, 2},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			actual := Clamp(tt.val, tt.min, tt.max)
			if actual != tt.expected {
				t.Errorf("Expected %d, actual %d", tt.expected, actual)
			}
		})
	}
}

// ============================================================
// EXERCISE 2: Test helper
// ============================================================
// Write a helper function:
//   assertEqual(t *testing.T, got, want int)
//
// It should:
//   - Call t.Helper() so failures point to the caller
//   - Use t.Errorf if got != want
//
// Then rewrite one of your Exercise 1 tests to use it.
//
// TODO: Implement assertEqual helper
func assertEqual(t *testing.T, got, want int) {
	t.Helper()
	if got != want {
		t.Errorf("Want %d, got %d", want, got)
	}
}

// TODO: Implement TestAbsWithHelper using the helper
func TestAbsWithHelper(t *testing.T) {
	tests := []struct {
		name string
		input int
		expected int
	}{
		{"positive number", 5, 5},
		{"negative number", -5, 5},
		{"zero", 0, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			actual := Abs(tt.input)
			assertEqual(t, actual, tt.expected)
		})
	}
}

// ============================================================
// EXERCISE 3: Testing errors
// ============================================================
// Write table-driven tests for Divide:
//   - Normal division (10/2 = 5)
//   - Division by zero (should return error)
//   - Negative numbers
//   - Decimal results
//
// Check both the result AND whether an error was expected.
//
// TODO: Implement TestDivide
func TestDivide(t *testing.T) {
	tests := []struct{
		name string
		a float64
		b float64
		expected float64
		wantErr bool
		wantErrMsg string
	}{
		{"normal division", 10, 2, 5, false, ""},
		{"division by zero", 10, 0, -1, true, "division by zero"},
		{"negative numbers", -10, -5, 2, false, ""},
		{"decimal result", -5, -2, 2.5, false, ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			actual, err := Divide(tt.a, tt.b)

			if tt.wantErr {
				if err == nil {
					t.Errorf("Expected error, got nil")
				}

				if err.Error() != tt.wantErrMsg {
					t.Errorf("Got error %q, want error %q", err.Error(), tt.wantErrMsg)
				}
				return
			}

			if err != nil {
				t.Errorf("Unexpected error: %v", err)
			}

			if actual != tt.expected {
				t.Errorf("Divide(%v, %v) = %v, want %v", tt.a, tt.b, actual, tt.expected)
			}
		})
	}
}

// ============================================================
// EXERCISE 4: Table-driven test for FizzBuzz
// ============================================================
// Write a comprehensive table-driven test for FizzBuzz.
// Cover: regular numbers, multiples of 3, 5, 15, edge cases (0, 1).
//
// TODO: Implement TestFizzBuzz
func TestFizzBuzz(t *testing.T) {
	tests := []struct{
		name string
		val int
		expected string
	}{
		{"regular numbers", 2, "2"},
		{"multiple of 3", 3, "Fizz"},
		{"multiple of 5", 5, "Buzz"},
		{"multiple of 15", 15, "FizzBuzz"},
		{"edge case 0", 0, "FizzBuzz"},
		{"edge case 1", 1, "1"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			actual := FizzBuzz(tt.val)

			if actual != tt.expected {
				t.Errorf("Expected %q, got %q", tt.expected, actual)
			}
		})
	}
}

// ============================================================
// EXERCISE 5: Benchmarks
// ============================================================
// Write benchmarks for:
//   - BenchmarkReverse (with a medium-length string)
//   - BenchmarkIsPalindrome
//   - BenchmarkSliceSum (with a slice of 1000 elements)
//
// Run: go test ./exercises/08-testing/ -bench=. -benchmem
//
// TODO: Implement BenchmarkReverse
func BenchmarkReverse(b *testing.B) {
	s := strings.Repeat("a", 100)
	for i := 0; i < b.N; i++ {
		Reverse(s)
	}
}

// TODO: Implement BenchmarkIsPalindrome
func BenchmarkIsPalindrome(b *testing.B) {
	for i := 0; i < b.N; i++ {
		IsPalindrome("Mum")
	}
}

// TODO: Implement BenchmarkSliceSum
func BenchmarkSliceSum(b *testing.B) {
	for i := 0; i < b.N; i++ {
		SliceSum([]int{0, 1, 2, 3, 4, 5, 6, 7, 8, 9})
	}
}

// ============================================================
// EXERCISE 6: Fuzzing
// ============================================================
// Write a fuzz test for Reverse:
//   - Property: reversing twice should give back the original
//   - Property: reversed string should have same length (in runes)
//
// Seed with: "hello", "世界", "", "a", "ab"
//
// Run: go test ./exercises/08-testing/ -fuzz=FuzzReverse -fuzztime=10s
//
// TODO: Implement FuzzReverse
func FuzzReverse(f *testing.F) {
	f.Add("hello")
	f.Add("世界")
	f.Add("")
	f.Add("a")
	f.Add("ab")

	f.Fuzz(func (t *testing.T, s string)  {
		rev := Reverse(s)
		doubleReverse := Reverse(rev)

		if s != doubleReverse {
			t.Errorf("double reverse of %q = %q, want %q", s, doubleReverse, s)
		}

		if utf8.RuneCountInString(s) != utf8.RuneCountInString(rev) {
			t.Errorf("length mismatch: %q (%d) vs %q (%d)", s, utf8.RuneCountInString(s), rev, utf8.RuneCountInString(rev))
		}
	})
}

// ============================================================
// EXERCISE 7: Parallel subtests
// ============================================================
// Write a test for TruncateUTF8 with parallel subtests.
// Each subtest should call t.Parallel().
//
// Cover: short string (no truncation), exact length, truncation,
//        unicode characters, empty string.
//
// TODO: Implement TestTruncateUTF8Parallel
func TestTruncateUTF8Parallel(t *testing.T) {
	tests := []struct{
		name string
		input string
		maxChars int
		expected string
	}{
		{"no truncation", "hello", 10, "hello"},
		{"exact length", "hello", 5, "hello"},
		{"truncation", "hello", 3, "hel..."},
		{"unicode characters", "世界你好", 2, "世界..."},
		{"empty string", "", 5, ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
´
			actual := TruncateUTF8(tt.input, tt.maxChars)
			if actual != tt.expected {
				t.Errorf("Expected %q, actual %q", tt.expected, actual)
			}
		})
	}
}
