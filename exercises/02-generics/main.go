package main

import "fmt"

// Exercise 02: Generics — Building a Utility Library
//
// Work through each TODO in order. Each builds on the previous concept.
// Uncomment the test calls in main() as you implement each function.
//
// Run: go run ./exercises/02-generics
//
// Concepts covered:
//   1. Basic generic function with `any` constraint
//   2. Type constraints with `comparable`
//   3. Custom type constraints (interfaces)
//   4. Generic types (structs)
//   5. The `~` tilde operator and `[S ~[]E, E any]` pattern

// ============================================================
// EXERCISE 1: Generic Contains
// ============================================================
// Write a function that checks if a slice contains a value.
// Hint: You need `comparable` because you're using `==`.
//
// TODO: Implement Contains[???](slice ???, target ???) bool
func Contains[T comparable](s []T, target T) bool {
	for _, v := range s {
		if v == target {
			return true
		}
	}
	return false
}

// ============================================================
// EXERCISE 2: Generic Map (transform)
// ============================================================
// Write a function that applies a transform function to every
// element in a slice and returns a new slice.
// Example: Map([]int{1,2,3}, func(n int) string { return fmt.Sprint(n) })
//          → []string{"1", "2", "3"}
//
// Hint: You need TWO type parameters — input type and output type.
//
// TODO: Implement Map[???](slice ???, fn ???) ???
func Map[T any, R any](s []T, fn func(T) R) []R {
	// we are creating first the result array, take takes the slice array length
	result := make([]R, len(s))
	// first one is the index, second one is the value
	for i, v := range s {
		result[i] = fn(v)
	}
	return result
}

// ============================================================
// EXERCISE 3: Generic Filter
// ============================================================
// Write a function that returns only elements matching a predicate.
// Example: Filter([]int{1,2,3,4,5}, func(n int) bool { return n > 3 })
//          → []int{4, 5}
//
// TODO: Implement Filter[???](slice ???, predicate ???) ???
// even though we are having predicate, we are not using == as this is a call stack
// meaning that our T generic function calls another function, and by the time it is called
// Go has already resolve the actual type of the T, so we don't need 'comparable', and we are using 'any' instead
func Filter[T any](s []T, p func(T) bool) []T {
	// we create it like that as we don't know final size
	// and we should use append because of that
	var result []T
	for _, v := range s {
		if p(v) {
			result = append(result, v)
		}
	}
	return result
}

// ============================================================
// EXERCISE 4: Number constraint
// ============================================================
// Define a Number constraint that accepts int, float64, and int64.
// Then write a Sum function that adds all elements in a slice.
//
// TODO: Define the Number interface constraint
// we need to declare an interface just for convenience to just have a Number as T type
type Number interface {
	int | float64 | int64
}

// TODO: Implement Sum[???](nums ???) ???
func Sum[T Number](nums []T) T {
	// we have to declare value like that explicitly say this is a T type as well
	// otherwise code won't compile
	// and also we don't need to init with 0 as 0 as default for numbers
	var sum T
	for _, v := range nums {
		sum += v
	}
	return sum
}

// ============================================================
// EXERCISE 5: Generic Stack (generic type)
// ============================================================
// Implement a Stack[T any] with Push, Pop, and IsEmpty methods.
// Pop should return (T, bool) — the value and whether it succeeded.
//
// TODO: Define Stack[T any] struct
type Stack[T any] struct {
	items []T 
}

// TODO: Implement Push(val T)
func (s *Stack[T]) Push(val T) {
	s.items = append(s.items, val)
}

// TODO: Implement Pop() (T, bool)
func (s *Stack[T]) Pop() (T, bool) {	
	if s.IsEmpty() {
		var zero T
		return zero, false
	}

	last := s.items[len(s.items) - 1] // get last
	// the :n creates a new slice of the first n elements, where we are removing the last one
	// meaning it takes elements from the start up but not including index n
	s.items = s.items[:len(s.items) - 1]

	return last, true
}

// TODO: Implement IsEmpty() bool
func (s *Stack[T]) IsEmpty() bool {
	return len(s.items) == 0
}

// ============================================================
// EXERCISE 6: The ~tilde and [S ~[]E, E any] pattern
// ============================================================
// Write a Reverse function that:
//   - Works on any slice type (including named types like MyNames)
//   - Preserves the caller's named type in the return value
//
// First, try WITHOUT ~  and see what breaks with MyNames.
// Then fix it with ~.
//
// type MyNames []string
// names := MyNames{"alice", "bob", "charlie"}
// reversed := Reverse(names) // should return MyNames, not []string
//
// TODO: Implement Reverse[S ~[]E, E any](s S) S

// ============================================================
// EXERCISE 7: The ~ with maps — Keys and Values
// ============================================================
// Write two functions:
//   1. Keys  — returns all keys from any map type
//   2. Values — returns all values from any map type
//
// They must work with named map types like:
//   type Env map[string]string
//   type Scores map[string]int
//
// Hint: for k, v := range m — iterates over map entries
//
// TODO: Implement Keys
// we need to have the key of a map comparable because under the hood, Go goes and compare that
// and because of that, as it compares directly into our main function, Keys, we need to have K comparable
// this is a language rule, a key value of a map has to be comparable
// its value can be any, or comparable, depending on the scope
// meaning that if the function uses == or != then the V has to be comparable too
func Keys[M ~map[K]V, K comparable, V any](m M) []K {
	// when creating a new array we should use make(type of array, length WITHOUT -1)
	result := make([]K, 0, len(m))
	for k, _ := range m {
		result = append(result, k)
	}
	return result
}
// TODO: Implement Values
func Values[M ~map[K]V, K comparable, V any](m M) []V {
	// we should also specify 0 as initial length to an already known list so that 
	// it doesn't length of zero-value slots
	// it is because we are appending and not using indexes to equal the value
	result := make([]V, 0, len(m))
	for _, v := range m {
		result = append(result, v)
	}
	return result
}

type Env map[string]string
type Scores map[string]int

type MyNames []string
// we are using ~ because we want to return MyNames, and not []string
// we usually use ~ when we want to return the underlying type, not the specific type from the custom type created
// so we also use ~ because we want so that S to return the same type we are passing, in this case not []string, but MyNames
func Reverse[S ~[]E, E any](s S) S {
	result := make(S, len(s)) 
	for i, v := range s {
		result[len(s) - 1 - i] = v
	}
	return result
}

func main() {
	fmt.Println("=== Exercise 02: Generics ===")
	fmt.Println()

	// EXERCISE 1: Generic
	fmt.Println("-- Generic --")
	fmt.Printf("Contains number: %v\n", Contains([]int{1, 2, 3}, 2))

	// EXERCISE 2: Map
	fmt.Println("-- Map --")
	fmt.Printf("List [1, 2, 3] -> %v\n", Map([]int{1, 2, 3}, func(n int) string {return fmt.Sprintf("%d", n)}))
	fmt.Printf("List [1, 2, 3] -> %v\n", Map([]int{1, 2, 3}, func(n int)  int{return n * n}))

	// EXERCISE 3: Filter
	fmt.Println("-- Filter --")
	evens := Filter([]int{1, 2, 3, 4, 5, 6}, func(n int) bool { return n%2 == 0 })
	fmt.Println(evens) // [2 4 6]
	long := Filter([]string{"go", "rust", "c", "python"}, func(s string) bool { return len(s) > 2 })
	fmt.Println(long)  // [rust python]
	fmt.Println()

	// EXERCISE 4: Sum
	fmt.Println("-- Sum --")
	fmt.Println(Sum([]int{1, 2, 3, 4}))           // 10
	fmt.Println(Sum([]float64{1.5, 2.5, 3.0}))    // 7
	fmt.Println(Sum([]int64{100, 200, 300}))       // 600
	fmt.Println()

	// EXERCISE 5: Stack
	fmt.Println("-- Stack --")
	s := &Stack[int]{}
	s.Push(10)
	s.Push(20)
	s.Push(30)
	val, ok := s.Pop()
	fmt.Println(val, ok)      // 30 true
	val, ok = s.Pop()
	fmt.Println(val, ok)      // 20 true
	val, ok = s.Pop()
	fmt.Println(val, ok)      // 10 true
	val, ok = s.Pop()
	fmt.Println(val, ok)      // 0 false
	fmt.Println(s.IsEmpty())  // true
	fmt.Println()

	// EXERCISE 6: Reverse with ~tilde
	fmt.Println("-- Reverse --")
	nums := []int{1, 2, 3, 4, 5}
	fmt.Println(Reverse(nums)) // [5 4 3 2 1]
	
	names := MyNames{"alice", "bob", "charlie"}
	reversed := Reverse(names)
	fmt.Println(reversed)                          // [charlie bob alice]
	fmt.Printf("type: %T\n", reversed)             // type: main.MyNames (NOT []string!)

	// EXERCISE 7: Keys and Values with ~map
	fmt.Println("-- Keys & Values --")
	env := Env{"HOME": "/home/user", "SHELL": "/bin/zsh", "EDITOR": "vim"}
	fmt.Println("Keys:", Keys(env))     // [HOME SHELL EDITOR] (order may vary — maps are unordered)
	fmt.Println("Values:", Values(env)) // [/home/user /bin/zsh vim] (order may vary)
	fmt.Printf("Keys type from Env: %T\n", Keys(env)) // []string (not Env!)

	scores := Scores{"alice": 95, "bob": 87, "charlie": 92}
	fmt.Println("Keys:", Keys(scores))     // [alice bob charlie] (order may vary)
	fmt.Println("Values:", Values(scores)) // [95 87 92] (order may vary)
}
